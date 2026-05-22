package network

import "fmt"

// createNATGW habilita o NAT Gateway da VPC neste node.
//
// Fase A: ip_forward no host + netns reservado + iptables MASQUERADE.
// A bridge da VPC carrega o IP do gateway; o NAT ocorre no namespace do host.
//
// Fase B (futuro): veth pairs dentro do netns para isolamento completo,
// com roteamento separado por VPC.
func createNATGW(vpcID, cidr, uplinkIface string) error {
	if err := run("sysctl", "-w", "net.ipv4.ip_forward=1"); err != nil {
		return fmt.Errorf("enable ip_forward: %w", err)
	}
	if err := run("ip", "netns", "add", netnsName(vpcID)); err != nil {
		return fmt.Errorf("create netns: %w", err)
	}
	if err := addMasquerade(cidr, uplinkIface); err != nil {
		_ = run("ip", "netns", "del", netnsName(vpcID))
		return fmt.Errorf("add masquerade: %w", err)
	}
	return nil
}

func deleteNATGW(vpcID, cidr, uplinkIface string) error {
	_ = deleteMasquerade(cidr, uplinkIface)
	_ = run("ip", "netns", "del", netnsName(vpcID))
	return nil
}
