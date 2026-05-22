package storage

import (
	"fmt"
	"log/slog"
	"os"
	"os/exec"
	"path/filepath"
	"text/template"
	"bytes"
)

const baseDir = "/var/lib/rigstack"

// Local gerencia o armazenamento de VMs no disco local do node (Fase A).
type Local struct {
	logger *slog.Logger
}

func NewLocal(logger *slog.Logger) *Local {
	return &Local{logger: logger}
}

// VMPaths retorna os caminhos dos arquivos de uma VM.
type VMPaths struct {
	Dir           string // /var/lib/rigstack/images/{vmID}/
	DiskPath      string // .../disk.qcow2
	CloudInitPath string // .../cloudinit.iso
}

func PathsFor(vmID string) VMPaths {
	dir := filepath.Join(baseDir, "images", vmID)
	return VMPaths{
		Dir:           dir,
		DiskPath:      filepath.Join(dir, "disk.qcow2"),
		CloudInitPath: filepath.Join(dir, "cloudinit.iso"),
	}
}

// CloudInitConfig contém os dados para gerar o cloud-init da VM.
type CloudInitConfig struct {
	Hostname  string
	IPAddress string // ex: "10.0.1.10"
	Prefix    int    // ex: 24
	Gateway   string // ex: "10.0.1.1" (IP do NAT GW)
	SSHPubKey string
}

// Provision cria o diretório, o disco qcow2 e o ISO de cloud-init para uma VM.
// BaseImage é o caminho para a imagem base (ex: /var/lib/rigstack/base/ubuntu-24.04.qcow2).
func (l *Local) Provision(vmID, baseImage string, diskGB int, ci CloudInitConfig) (VMPaths, error) {
	paths := PathsFor(vmID)

	if err := os.MkdirAll(paths.Dir, 0755); err != nil {
		return VMPaths{}, fmt.Errorf("mkdir %s: %w", paths.Dir, err)
	}

	if err := l.createDisk(paths.DiskPath, baseImage, diskGB); err != nil {
		return VMPaths{}, err
	}

	if err := l.createCloudInitISO(paths, ci); err != nil {
		return VMPaths{}, err
	}

	l.logger.Info("VM storage provisioned", "vm_id", vmID, "disk_gb", diskGB)
	return paths, nil
}

// Delete remove todos os arquivos de uma VM.
func (l *Local) Delete(vmID string) error {
	paths := PathsFor(vmID)
	if err := os.RemoveAll(paths.Dir); err != nil {
		return fmt.Errorf("remove vm dir %s: %w", paths.Dir, err)
	}
	l.logger.Info("VM storage deleted", "vm_id", vmID)
	return nil
}

// ListBaseImages retorna as imagens base disponíveis em /var/lib/rigstack/base/.
func (l *Local) ListBaseImages() ([]string, error) {
	pattern := filepath.Join(baseDir, "base", "*.qcow2")
	matches, err := filepath.Glob(pattern)
	if err != nil {
		return nil, err
	}
	names := make([]string, 0, len(matches))
	for _, m := range matches {
		names = append(names, filepath.Base(m))
	}
	return names, nil
}

// createDisk cria um disco qcow2 com backing file da imagem base.
// Isso significa que o disco da VM começa vazio e usa a imagem base como read-only layer —
// economiza espaço e é muito mais rápido que copiar a imagem inteira.
func (l *Local) createDisk(diskPath, baseImage string, sizeGB int) error {
	l.logger.Info("creating VM disk", "path", diskPath, "base", baseImage, "size_gb", sizeGB)

	// qemu-img create -f qcow2 -b <base> -F qcow2 <disk> <size>G
	cmd := exec.Command("qemu-img", "create",
		"-f", "qcow2",
		"-b", baseImage,
		"-F", "qcow2",
		diskPath,
		fmt.Sprintf("%dG", sizeGB),
	)
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("qemu-img create: %w\n%s", err, out)
	}
	return nil
}

// createCloudInitISO gera os arquivos cloud-init e empacota em um ISO.
// Requer: genisoimage ou mkisofs instalado no node.
func (l *Local) createCloudInitISO(paths VMPaths, ci CloudInitConfig) error {
	l.logger.Info("creating cloud-init ISO", "hostname", ci.Hostname)

	// Gerar meta-data
	metaData := fmt.Sprintf("instance-id: %s\nlocal-hostname: %s\n",
		filepath.Base(paths.Dir), ci.Hostname)
	if err := os.WriteFile(filepath.Join(paths.Dir, "meta-data"), []byte(metaData), 0644); err != nil {
		return fmt.Errorf("write meta-data: %w", err)
	}

	// Gerar user-data
	var udBuf bytes.Buffer
	if err := userDataTmpl.Execute(&udBuf, ci); err != nil {
		return fmt.Errorf("render user-data: %w", err)
	}
	if err := os.WriteFile(filepath.Join(paths.Dir, "user-data"), udBuf.Bytes(), 0644); err != nil {
		return fmt.Errorf("write user-data: %w", err)
	}

	// Gerar network-config
	var ncBuf bytes.Buffer
	if err := networkConfigTmpl.Execute(&ncBuf, ci); err != nil {
		return fmt.Errorf("render network-config: %w", err)
	}
	if err := os.WriteFile(filepath.Join(paths.Dir, "network-config"), ncBuf.Bytes(), 0644); err != nil {
		return fmt.Errorf("write network-config: %w", err)
	}

	// Criar ISO com genisoimage
	// genisoimage -output cloudinit.iso -volid cidata -joliet -rock user-data meta-data network-config
	cmd := exec.Command("genisoimage",
		"-output", paths.CloudInitPath,
		"-volid", "cidata",
		"-joliet", "-rock",
		filepath.Join(paths.Dir, "user-data"),
		filepath.Join(paths.Dir, "meta-data"),
		filepath.Join(paths.Dir, "network-config"),
	)
	if out, err := cmd.CombinedOutput(); err != nil {
		// Tentar com mkisofs como fallback
		cmd2 := exec.Command("mkisofs",
			"-output", paths.CloudInitPath,
			"-volid", "cidata",
			"-joliet", "-rock",
			filepath.Join(paths.Dir, "user-data"),
			filepath.Join(paths.Dir, "meta-data"),
			filepath.Join(paths.Dir, "network-config"),
		)
		if out2, err2 := cmd2.CombinedOutput(); err2 != nil {
			return fmt.Errorf("genisoimage: %w (%s)\nmkisofs: %v (%s)", err, out, err2, out2)
		}
	}
	return nil
}

var userDataTmpl = template.Must(template.New("user-data").Parse(`#cloud-config
users:
  - name: rigstack
    sudo: ALL=(ALL) NOPASSWD:ALL
    shell: /bin/bash
    ssh_authorized_keys:
      - {{ .SSHPubKey }}

package_update: true
packages:
  - qemu-guest-agent

runcmd:
  - systemctl enable --now qemu-guest-agent
`))

var networkConfigTmpl = template.Must(template.New("network-config").Parse(`version: 2
ethernets:
  eth0:
    addresses:
      - {{ .IPAddress }}/{{ .Prefix }}
    gateway4: {{ .Gateway }}
    nameservers:
      addresses:
        - 8.8.8.8
        - 1.1.1.1
`))
