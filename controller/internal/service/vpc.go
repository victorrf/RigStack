package service

// VPCService — lógica de negócio para redes virtuais.
//
// Métodos planejados:
//   Create(name, cidr) → valida CIDR, persiste VPC, provisiona NAT GW
//   ProvisionNATGateway(vpcID) → scheduler escolhe node, agent cria netns + bridge + iptables
//   CreateSubnet(vpcID, cidr, isPublic) → valida range dentro do CIDR da VPC, persiste
//   Delete(vpcID) → só permite se não tiver VMs. Remove NAT GW, bridges, regras
//
// Conceitos de rede por VPC:
//   - Bridge Linux: rs-br-{vpcID}         → conecta VMs ao NAT GW
//   - Netns do NAT GW: rs-natgw-{vpcID}   → faz MASQUERADE para internet
//   - IP do NAT GW dentro da VPC: primeiro IP utilizável do CIDR (ex: 10.0.0.1)
