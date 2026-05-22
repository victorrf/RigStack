package network

// Gerenciamento de bridges Linux para as VPCs.
//
// Cada VPC recebe uma bridge dedicada no node: rs-br-{vpcID}
//
// Operações:
//   CreateBridge(vpcID, cidr) → ip link add rs-br-{id} type bridge
//                               ip addr add {natgw_ip}/prefix dev rs-br-{id}
//                               ip link set rs-br-{id} up
//
//   DeleteBridge(vpcID)       → ip link set rs-br-{id} down
//                               ip link del rs-br-{id}
//
//   AttachInterface(vpcID, iface) → ip link set {iface} master rs-br-{id}
//
// A bridge é o ponto central da VPC no node:
//   VMs → bridge → NAT GW (netns) → eth0 do node → internet
