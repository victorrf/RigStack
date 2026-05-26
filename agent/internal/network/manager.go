package network

import (
	"fmt"
	"log/slog"
	"net"
	"os/exec"
	"strings"
)

// Manager gerencia a rede de VPCs neste node.
// Fase A: bridge Linux por VPC + ip_forward + iptables MASQUERADE no host.
// Fase B: adicionar netns com veth pairs para isolamento completo.
type Manager struct {
	uplink string
	logger *slog.Logger
}

func New(logger *slog.Logger) (*Manager, error) {
	uplink, err := detectUplink()
	if err != nil {
		return nil, fmt.Errorf("detect uplink interface: %w", err)
	}
	logger.Info("network manager ready", "uplink", uplink)
	return &Manager{uplink: uplink, logger: logger}, nil
}

// CreateVPC cria bridge + NAT GW para uma VPC.
func (m *Manager) CreateVPC(vpcID, cidr string) error {
	gw, prefix, err := subnetInfo(cidr)
	if err != nil {
		return err
	}
	if err := createBridge(vpcID, gw, prefix); err != nil {
		return fmt.Errorf("create bridge: %w", err)
	}
	if err := createNATGW(vpcID, cidr, m.uplink); err != nil {
		_ = deleteBridge(vpcID)
		return fmt.Errorf("create nat gw: %w", err)
	}
	m.logger.Info("vpc network ready", "vpc_id", vpcID, "cidr", cidr, "gateway", gw)
	return nil
}

// DeleteVPC remove bridge + NAT GW de uma VPC.
func (m *Manager) DeleteVPC(vpcID, cidr string) error {
	if err := deleteNATGW(vpcID, cidr, m.uplink); err != nil {
		m.logger.Warn("delete natgw failed", "vpc_id", vpcID, "err", err)
	}
	if err := deleteBridge(vpcID); err != nil {
		return err
	}
	m.logger.Info("vpc network removed", "vpc_id", vpcID)
	return nil
}

// BridgeName retorna o nome da bridge Linux para uma VPC.
func BridgeName(vpcID string) string { return "rs-br-" + slug(vpcID) }

// EnsureBridge garante que a bridge e o NAT da VPC existem no node.
// Idempotente: não faz nada se a bridge já existir.
// Necessário após reboot do node, pois bridges criadas via ip link não persistem.
func (m *Manager) EnsureBridge(vpcID, cidr string) error {
	name := BridgeName(vpcID)
	out, _ := exec.Command("ip", "link", "show", name).Output()
	if len(out) > 0 {
		return nil // bridge já existe
	}
	gw, prefix, err := subnetInfo(cidr)
	if err != nil {
		return err
	}
	if err := createBridge(vpcID, gw, prefix); err != nil {
		return fmt.Errorf("recreate bridge: %w", err)
	}
	_ = run("sysctl", "-w", "net.ipv4.ip_forward=1")
	_ = addMasquerade(cidr, m.uplink)
	m.logger.Info("bridge recreated after reboot", "vpc_id", vpcID, "bridge", name)
	return nil
}

func netnsName(vpcID string) string { return "rs-natgw-" + slug(vpcID) }

// slug retorna até 9 chars do ID sem hífens — suficiente para nomes únicos
// sem ultrapassar o limite de 15 chars do kernel para interfaces (6 + 9 = 15).
func slug(id string) string {
	clean := strings.ReplaceAll(id, "-", "")
	if len(clean) > 9 {
		return clean[:9]
	}
	return clean
}

// subnetInfo extrai o gateway (primeiro host da subnet) e o prefixo do CIDR.
func subnetInfo(cidr string) (gw string, prefix int, err error) {
	_, ipNet, err := net.ParseCIDR(cidr)
	if err != nil {
		return "", 0, fmt.Errorf("parse cidr %q: %w", cidr, err)
	}
	ones, _ := ipNet.Mask.Size()
	base := ipNet.IP.To4()
	if base == nil {
		return "", 0, fmt.Errorf("only IPv4 CIDRs are supported")
	}
	gw4 := make(net.IP, 4)
	copy(gw4, base)
	gw4[3]++ // .1 da subnet = gateway
	return gw4.String(), ones, nil
}

// detectUplink retorna a interface da rota default.
func detectUplink() (string, error) {
	out, err := exec.Command("ip", "route", "show", "default").Output()
	if err != nil {
		return "", fmt.Errorf("ip route show default: %w", err)
	}
	fields := strings.Fields(string(out))
	for i, f := range fields {
		if f == "dev" && i+1 < len(fields) {
			return fields[i+1], nil
		}
	}
	return "", fmt.Errorf("no default route found in: %q", strings.TrimSpace(string(out)))
}

// run executa um comando e retorna erro com output combinado.
func run(args ...string) error {
	out, err := exec.Command(args[0], args[1:]...).CombinedOutput()
	if err != nil {
		return fmt.Errorf("%s: %w (output: %s)", strings.Join(args, " "), err, strings.TrimSpace(string(out)))
	}
	return nil
}
