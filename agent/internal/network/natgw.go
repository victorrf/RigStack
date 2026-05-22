package network

// NAT Gateway — implementado como Linux network namespace.
//
// Nomenclatura:
//   netns:  rs-natgw-{vpcID}
//   veth par: rs-gw0-{vpcID}  (dentro da netns)
//             rs-gw1-{vpcID}  (na bridge da VPC)
//
// Sequência de criação:
//   1. ip netns add rs-natgw-{vpcID}
//   2. ip link add rs-gw0-{vpcID} type veth peer name rs-gw1-{vpcID}
//   3. ip link set rs-gw0-{vpcID} netns rs-natgw-{vpcID}
//   4. ip link set rs-gw1-{vpcID} master rs-br-{vpcID}   (entra na bridge da VPC)
//   5. ip -n rs-natgw-{vpcID} addr add {natgw_ip}/prefix dev rs-gw0-{vpcID}
//   6. ip -n rs-natgw-{vpcID} link set rs-gw0-{vpcID} up
//   7. ip -n rs-natgw-{vpcID} route add default via {ip da eth0 do node}
//   8. ip netns exec rs-natgw-{vpcID} iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
//
// Resultado: VMs com default gateway = natgw_ip saem para internet via MASQUERADE.
//
// Fase A: NAT GW sempre no mesmo node que a VPC foi criada.
// Fase B: NAT GW pode ser movido para outro node (com downtime breve).
