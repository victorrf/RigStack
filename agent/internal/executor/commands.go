package executor

// Estruturas de payload dos comandos recebidos do controller via gRPC.
// O controller serializa em JSON; o agent desserializa aqui.

type CreateVPCCmd struct {
	VPCID string `json:"vpc_id"`
	CIDR  string `json:"cidr"` // ex: "10.0.1.0/24"
}

type DeleteVPCCmd struct {
	VPCID string `json:"vpc_id"`
	CIDR  string `json:"cidr"`
}

type CreateVMCmd struct {
	VMID       string `json:"vm_id"`
	Name       string `json:"name"`
	VCPUs      int    `json:"vcpus"`
	RAMMB      int    `json:"ram_mb"`
	DiskGB     int    `json:"disk_gb"`
	OSImage    string `json:"os_image"`    // ex: "ubuntu-24.04" → base: /var/lib/rigstack/base/ubuntu-24.04.qcow2
	BridgeName string `json:"bridge_name"` // ex: "rs-br-abc123"
	IPAddress  string `json:"ip_address"`  // ex: "10.0.1.10"
	Prefix     int    `json:"prefix"`      // ex: 24
	Gateway    string `json:"gateway"`     // IP do NAT GW da VPC
	SSHPubKey  string `json:"ssh_pubkey"`
	Password   string `json:"password"`    // senha do user rigstack (plain, hash feito no agent)
}

type VMCmd struct {
	VMID    string `json:"vm_id"`
	Name    string `json:"name"`
	Force   bool   `json:"force"`    // usado em stop_vm: true = destroy, false = shutdown gracioso
	VpcID   string `json:"vpc_id"`   // usado em start_vm para recriar bridge se sumiu após reboot
	VpcCIDR string `json:"vpc_cidr"` // subnet da VPC para recriar NAT
}
