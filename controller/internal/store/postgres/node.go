package postgres

// Implementação PostgreSQL do NodeStore.
//
// Tabela: nodes
//   id          UUID PRIMARY KEY
//   name        TEXT
//   region      TEXT
//   address     TEXT          (IP:porta gRPC do agent)
//   status      TEXT          (healthy | unreachable)
//   cpu_total   INT
//   cpu_free    INT
//   ram_total   BIGINT        (bytes)
//   ram_free    BIGINT
//   disk_total  BIGINT
//   disk_free   BIGINT
//   last_seen   TIMESTAMPTZ
//   registered_at TIMESTAMPTZ
