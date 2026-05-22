package postgres

// Implementação PostgreSQL do VPCStore.
//
// Tabela: vpcs
//   id          UUID PRIMARY KEY
//   name        TEXT
//   cidr        CIDR
//   status      TEXT          (provisioning | active | deleting)
//   created_at  TIMESTAMPTZ
//
// Tabela: subnets
//   id          UUID PRIMARY KEY
//   vpc_id      UUID REFERENCES vpcs(id)
//   name        TEXT
//   cidr        CIDR
//   is_public   BOOLEAN
//   created_at  TIMESTAMPTZ
//
// Tabela: nat_gateways
//   id          UUID PRIMARY KEY
//   vpc_id      UUID REFERENCES vpcs(id)      UNIQUE
//   node_id     UUID REFERENCES nodes(id)      (node que hospeda o NAT GW)
//   netns_name  TEXT                           (ex: rs-natgw-{vpcID})
//   bridge_name TEXT                           (ex: rs-br-{vpcID})
//   internal_ip INET                           (IP do NAT GW dentro da VPC)
//   status      TEXT          (provisioning | active | error)
//   created_at  TIMESTAMPTZ
