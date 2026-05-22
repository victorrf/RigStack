package postgres

// Implementação PostgreSQL do InstanceStore.
//
// Tabela: instances
//   id          UUID PRIMARY KEY
//   name        TEXT
//   status      TEXT          (pending | running | stopped | error)
//   node_id     UUID REFERENCES nodes(id)
//   vpc_id      UUID REFERENCES vpcs(id)
//   subnet_id   UUID REFERENCES subnets(id)
//   vcpus       INT
//   ram_mb      INT
//   disk_gb     INT
//   ip_address  INET
//   os_image    TEXT
//   created_at  TIMESTAMPTZ
//   updated_at  TIMESTAMPTZ
