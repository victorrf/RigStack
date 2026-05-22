package libvirt

import (
	"bytes"
	"crypto/rand"
	"fmt"
	"text/template"
)

// VMSpec define os parâmetros de uma VM a ser criada.
type VMSpec struct {
	ID            string // UUID da VM (vem do controller)
	Name          string
	VCPUs         int
	RAMMB         int
	DiskPath      string // /var/lib/rigstack/images/{vmID}/disk.qcow2
	CloudInitPath string // /var/lib/rigstack/images/{vmID}/cloudinit.iso
	BridgeName    string // rs-br-{vpcID}
	MAC           string // gerado por RandomMAC()
}

// domainXML gera o XML de definição do domínio libvirt para esta VM.
func (s VMSpec) domainXML() (string, error) {
	if s.MAC == "" {
		mac, err := RandomMAC()
		if err != nil {
			return "", err
		}
		s.MAC = mac
	}
	var buf bytes.Buffer
	if err := domainTmpl.Execute(&buf, s); err != nil {
		return "", fmt.Errorf("render domain template: %w", err)
	}
	return buf.String(), nil
}

// RandomMAC gera um MAC address válido para VMs QEMU (prefixo 52:54:00).
func RandomMAC() (string, error) {
	b := make([]byte, 3)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return fmt.Sprintf("52:54:00:%02x:%02x:%02x", b[0], b[1], b[2]), nil
}

// domainTmpl é o template XML do domínio KVM.
// Referência: https://libvirt.org/formatdomain.html
var domainTmpl = template.Must(template.New("domain").Parse(`
<domain type='kvm'>
  <name>{{ .Name }}</name>
  <uuid>{{ .ID }}</uuid>
  <memory unit='MiB'>{{ .RAMMB }}</memory>
  <currentMemory unit='MiB'>{{ .RAMMB }}</currentMemory>
  <vcpu placement='static'>{{ .VCPUs }}</vcpu>

  <os>
    <type arch='x86_64' machine='pc-q35-8.2'>hvm</type>
    <boot dev='hd'/>
    <boot dev='cdrom'/>
  </os>

  <features>
    <acpi/>
    <apic/>
  </features>

  <cpu mode='host-passthrough' check='none' migratable='on'/>

  <clock offset='utc'>
    <timer name='rtc' tickpolicy='catchup'/>
    <timer name='pit' tickpolicy='delay'/>
    <timer name='hpet' present='no'/>
  </clock>

  <on_poweroff>destroy</on_poweroff>
  <on_reboot>restart</on_reboot>
  <on_crash>destroy</on_crash>

  <devices>
    <emulator>/usr/bin/qemu-system-x86_64</emulator>

    <!-- Disco principal da VM -->
    <disk type='file' device='disk'>
      <driver name='qemu' type='qcow2' discard='unmap'/>
      <source file='{{ .DiskPath }}'/>
      <target dev='vda' bus='virtio'/>
    </disk>

    <!-- Cloud-init ISO para configuração inicial -->
    <disk type='file' device='cdrom'>
      <driver name='qemu' type='raw'/>
      <source file='{{ .CloudInitPath }}'/>
      <target dev='sda' bus='sata'/>
      <readonly/>
    </disk>

    <!-- Interface de rede ligada à bridge da VPC -->
    <interface type='bridge'>
      <mac address='{{ .MAC }}'/>
      <source bridge='{{ .BridgeName }}'/>
      <model type='virtio'/>
    </interface>

    <!-- Console serial para acesso via virsh console -->
    <serial type='pty'>
      <target type='isa-serial' port='0'/>
    </serial>
    <console type='pty'>
      <target type='serial' port='0'/>
    </console>

    <!-- QEMU guest agent para integração (IP, shutdown gracioso) -->
    <channel type='unix'>
      <target type='virtio' name='org.qemu.guest_agent.0'/>
    </channel>

    <!-- VNC local para acesso emergencial (fase A: só localhost) -->
    <graphics type='vnc' port='-1' autoport='yes' listen='127.0.0.1'>
      <listen type='address' address='127.0.0.1'/>
    </graphics>
    <video>
      <model type='vga' vram='16384' heads='1' primary='yes'/>
    </video>

    <memballoon model='virtio'/>
    <rng model='virtio'>
      <backend model='random'>/dev/urandom</backend>
    </rng>
  </devices>
</domain>
`))
