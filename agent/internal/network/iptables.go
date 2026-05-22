package network

// Gerenciamento de regras iptables/nftables.
//
// Usos planejados:
//
//   NAT de saída (MASQUERADE):
//     Aplicado dentro do netns do NAT GW.
//     Permite que VMs da VPC saiam para internet usando o IP público do node.
//
//   Security Groups (fase B):
//     Regras de firewall por VM, aplicadas na chain FORWARD da bridge.
//     Exemplo: permitir TCP 22 de qualquer origem para VM X.
//
//   Isolamento entre VPCs:
//     VMs de VPCs diferentes não se comunicam mesmo que no mesmo node.
//     Garantido por regras DROP nas chains da bridge.
