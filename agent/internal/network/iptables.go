package network

// addMasquerade adiciona regra POSTROUTING para que VMs da VPC saiam pela internet.
func addMasquerade(cidr, uplinkIface string) error {
	return run("iptables", "-t", "nat", "-A", "POSTROUTING",
		"-s", cidr, "-o", uplinkIface, "-j", "MASQUERADE")
}

// deleteMasquerade remove a regra MASQUERADE da VPC.
func deleteMasquerade(cidr, uplinkIface string) error {
	return run("iptables", "-t", "nat", "-D", "POSTROUTING",
		"-s", cidr, "-o", uplinkIface, "-j", "MASQUERADE")
}
