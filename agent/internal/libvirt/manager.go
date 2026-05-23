package libvirt

import (
	"context"
	"encoding/xml"
	"fmt"
	"log/slog"
	"net"
	"strings"
	"time"

	"github.com/digitalocean/go-libvirt"
)

const defaultSocket = "/var/run/libvirt/libvirt-sock"

// Manager gerencia VMs locais via libvirt/KVM.
type Manager struct {
	lv     *libvirt.Libvirt
	logger *slog.Logger
}

// NodeStats retorna métricas de recurso do node (para o heartbeat).
type NodeStats struct {
	CPUCores  uint32
	RAMTotal  uint64 // bytes
	RAMFree   uint64 // bytes
	VMRunning int
}

func New(socketPath string, logger *slog.Logger) (*Manager, error) {
	if socketPath == "" {
		socketPath = defaultSocket
	}

	conn, err := net.DialTimeout("unix", socketPath, 3*time.Second)
	if err != nil {
		return nil, fmt.Errorf("connect to libvirt socket %s: %w", socketPath, err)
	}

	lv := libvirt.New(conn)
	if err := lv.Connect(); err != nil {
		return nil, fmt.Errorf("libvirt handshake: %w", err)
	}

	version, _ := lv.ConnectGetLibVersion()
	logger.Info("connected to libvirt", "version", version)

	return &Manager{lv: lv, logger: logger}, nil
}

func (m *Manager) Close() {
	_ = m.lv.Disconnect()
}

// CreateVM define e inicia uma nova VM a partir de um VMSpec.
// O disco e o cloud-init ISO devem ter sido criados antes (storage.Local).
func (m *Manager) CreateVM(spec VMSpec) error {
	xml, err := spec.domainXML()
	if err != nil {
		return fmt.Errorf("generate domain xml: %w", err)
	}

	m.logger.Info("defining VM domain", "name", spec.Name)
	dom, err := m.lv.DomainDefineXML(xml)
	if err != nil {
		return fmt.Errorf("define domain: %w", err)
	}

	m.logger.Info("starting VM", "name", spec.Name)
	if err := m.lv.DomainCreate(dom); err != nil {
		return fmt.Errorf("start domain: %w", err)
	}

	return nil
}

// StartVM inicia uma VM já definida que esteja parada.
func (m *Manager) StartVM(name string) error {
	dom, err := m.getDomain(name)
	if err != nil {
		return err
	}
	if err := m.lv.DomainCreate(dom); err != nil {
		return fmt.Errorf("start domain %q: %w", name, err)
	}
	m.logger.Info("VM started", "name", name)
	return nil
}

// StopVM encerra uma VM. Se force=true usa destroy imediato; caso contrário tenta
// shutdown gracioso com ACPI e aguarda até 30s, forçando se necessário.
func (m *Manager) StopVM(name string, force bool) error {
	dom, err := m.getDomain(name)
	if err != nil {
		return err
	}
	if force {
		if err := m.lv.DomainDestroy(dom); err != nil {
			return fmt.Errorf("destroy domain %q: %w", name, err)
		}
		m.logger.Info("VM force-stopped", "name", name)
		return nil
	}

	if err := m.lv.DomainShutdown(dom); err != nil {
		return fmt.Errorf("shutdown domain %q: %w", name, err)
	}
	m.logger.Info("VM shutdown requested, waiting up to 30s", "name", name)

	deadline := time.Now().Add(30 * time.Second)
	for time.Now().Before(deadline) {
		time.Sleep(2 * time.Second)
		state, _, err := m.lv.DomainGetState(dom, 0)
		if err != nil {
			break
		}
		if libvirt.DomainState(state) == libvirt.DomainShutoff {
			m.logger.Info("VM stopped gracefully", "name", name)
			return nil
		}
	}

	m.logger.Warn("graceful shutdown timed out, force stopping", "name", name)
	if err := m.lv.DomainDestroy(dom); err != nil {
		return fmt.Errorf("force stop domain %q: %w", name, err)
	}
	return nil
}

// DeleteVM para, remove a definição do domínio e apaga os arquivos do disco.
// A remoção dos arquivos é responsabilidade do chamador (storage.Local.Delete).
func (m *Manager) DeleteVM(name string) error {
	dom, err := m.getDomain(name)
	if err != nil {
		return err
	}

	state, _, err := m.lv.DomainGetState(dom, 0)
	if err == nil && libvirt.DomainState(state) == libvirt.DomainRunning {
		_ = m.lv.DomainDestroy(dom)
	}

	flags := libvirt.DomainUndefineManagedSave |
		libvirt.DomainUndefineSnapshotsMetadata |
		libvirt.DomainUndefineNvram
	if err := m.lv.DomainUndefineFlags(dom, flags); err != nil {
		return fmt.Errorf("undefine domain %q: %w", name, err)
	}

	m.logger.Info("VM deleted", "name", name)
	return nil
}

// GetVMStatus retorna o estado atual da VM como string.
func (m *Manager) GetVMStatus(name string) (string, error) {
	dom, err := m.getDomain(name)
	if err != nil {
		return "", err
	}
	state, _, err := m.lv.DomainGetState(dom, 0)
	if err != nil {
		return "", fmt.Errorf("get state %q: %w", name, err)
	}
	return domainStateString(libvirt.DomainState(state)), nil
}

// VMInfo representa o estado de uma VM no libvirt para reconciliação.
type VMInfo struct {
	ID     string // UUID da VM (= instance ID no controller)
	Name   string
	Status string // "running" | "stopped" | "error"
}

// ListVMs retorna os nomes de todos os domínios (rodando ou não) gerenciados por este node.
func (m *Manager) ListVMs() ([]string, error) {
	domains, _, err := m.lv.ConnectListAllDomains(1,
		libvirt.ConnectListDomainsActive|libvirt.ConnectListDomainsInactive)
	if err != nil {
		return nil, fmt.Errorf("list domains: %w", err)
	}
	names := make([]string, 0, len(domains))
	for _, d := range domains {
		names = append(names, d.Name)
	}
	return names, nil
}

// ListVMInfos retorna ID (UUID), nome e status de todas as VMs — usado na reconciliação.
func (m *Manager) ListVMInfos() ([]VMInfo, error) {
	domains, _, err := m.lv.ConnectListAllDomains(1,
		libvirt.ConnectListDomainsActive|libvirt.ConnectListDomainsInactive)
	if err != nil {
		return nil, fmt.Errorf("list domains: %w", err)
	}
	infos := make([]VMInfo, 0, len(domains))
	for _, d := range domains {
		state, _, err := m.lv.DomainGetState(d, 0)
		if err != nil {
			continue
		}
		// UUID vem como [16]byte — converte para string UUID
		u := d.UUID
		id := fmt.Sprintf("%08x-%04x-%04x-%04x-%012x",
			u[0:4], u[4:6], u[6:8], u[8:10], u[10:16])
		infos = append(infos, VMInfo{
			ID:     id,
			Name:   d.Name,
			Status: domainStateString(libvirt.DomainState(state)),
		})
	}
	return infos, nil
}

// GetNodeStats retorna métricas de CPU e RAM do node para o heartbeat.
func (m *Manager) GetNodeStats(_ context.Context) (NodeStats, error) {
	// NodeGetInfo retorna: model, memoryKB, cpus, mhz, nodes, sockets, cores, threads, err
	_, memKB, cpus, _, _, _, _, _, err := m.lv.NodeGetInfo()
	if err != nil {
		return NodeStats{}, fmt.Errorf("node get info: %w", err)
	}

	freeMem, err := m.lv.NodeGetFreeMemory()
	if err != nil {
		return NodeStats{}, fmt.Errorf("node free memory: %w", err)
	}

	domains, _, err := m.lv.ConnectListAllDomains(1, libvirt.ConnectListDomainsActive)
	running := 0
	if err == nil {
		running = len(domains)
	}

	return NodeStats{
		CPUCores:  uint32(cpus),
		RAMTotal:  memKB * 1024, // libvirt retorna em KB
		RAMFree:   freeMem,
		VMRunning: running,
	}, nil
}

// VMStats contém métricas de CPU e RAM de uma VM individual.
type VMStats struct {
	CPUPct float64 // percentual de CPU usado (média desde o boot)
	RAMMB  int     // RAM atual em uso pela VM (MB)
}

// GetConsolePTY retorna o caminho do dispositivo PTY do console serial da VM.
// Só funciona enquanto a VM está rodando (libvirt popula o path após o boot).
func (m *Manager) GetConsolePTY(name string) (string, error) {
	dom, err := m.getDomain(name)
	if err != nil {
		return "", err
	}
	xmlStr, err := m.lv.DomainGetXMLDesc(dom, 0)
	if err != nil {
		return "", fmt.Errorf("get xml desc %q: %w", name, err)
	}

	var domXML struct {
		Devices struct {
			Consoles []struct {
				Type   string `xml:"type,attr"`
				Source struct {
					Path string `xml:"path,attr"`
				} `xml:"source"`
			} `xml:"console"`
		} `xml:"devices"`
	}
	if err := xml.Unmarshal([]byte(xmlStr), &domXML); err != nil {
		return "", fmt.Errorf("parse domain xml: %w", err)
	}
	for _, c := range domXML.Devices.Consoles {
		if c.Type == "pty" && strings.HasPrefix(c.Source.Path, "/dev/pts/") {
			return c.Source.Path, nil
		}
	}
	return "", fmt.Errorf("no pty console found for domain %q", name)
}

// GetVMStats retorna CPU% instantâneo e RAM usada da VM.
func (m *Manager) GetVMStats(name string) (VMStats, error) {
	dom, err := m.getDomain(name)
	if err != nil {
		return VMStats{}, err
	}

	state, maxMemKB, memKB, nCPU, cpuNs, err := m.lv.DomainGetInfo(dom)
	if err != nil {
		return VMStats{}, fmt.Errorf("domain get info %q: %w", name, err)
	}
	if libvirt.DomainState(state) != libvirt.DomainRunning {
		return VMStats{}, nil
	}

	t1 := time.Now()
	time.Sleep(500 * time.Millisecond)

	_, _, _, _, cpuNs2, err := m.lv.DomainGetInfo(dom)
	if err != nil {
		return VMStats{}, fmt.Errorf("domain get info (2nd sample) %q: %w", name, err)
	}
	elapsed := time.Since(t1).Seconds()

	cpuPct := 0.0
	if elapsed > 0 && nCPU > 0 {
		cpuPct = float64(cpuNs2-cpuNs) / (elapsed * 1e9 * float64(nCPU)) * 100
	}
	if cpuPct > 100 {
		cpuPct = 100
	}
	_ = maxMemKB
	return VMStats{
		CPUPct: cpuPct,
		RAMMB:  int(memKB / 1024),
	}, nil
}

func (m *Manager) getDomain(name string) (libvirt.Domain, error) {
	dom, err := m.lv.DomainLookupByName(name)
	if err != nil {
		return libvirt.Domain{}, fmt.Errorf("domain %q not found: %w", name, err)
	}
	return dom, nil
}

func domainStateString(s libvirt.DomainState) string {
	switch s {
	case libvirt.DomainRunning:
		return "running"
	case libvirt.DomainShutoff, libvirt.DomainShutdown:
		return "stopped"
	case libvirt.DomainPaused:
		return "paused"
	case libvirt.DomainCrashed:
		return "error"
	default:
		return "pending"
	}
}
