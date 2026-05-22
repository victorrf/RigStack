package store

// Interfaces do banco de dados.
//
// Separar as interfaces das implementações permite trocar o banco no futuro
// e facilita testes unitários com mocks.
//
// Interfaces planejadas:
//   NodeStore       → CRUD de nodes
//   InstanceStore   → CRUD de VMs
//   VPCStore        → CRUD de VPCs, subnets, NAT GWs
//   UserStore       → CRUD de usuários IAM
//
// A implementação concreta fica em store/postgres/.
