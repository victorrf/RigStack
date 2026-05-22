package api

// Configura as rotas HTTP REST consumidas pelo frontend.
//
// Grupos de rotas planejados:
//   GET/POST   /api/v1/nodes
//   GET/POST   /api/v1/instances
//   PUT/DELETE /api/v1/instances/:id
//   GET/POST   /api/v1/vpcs
//   GET/POST   /api/v1/vpcs/:id/subnets
//   GET/POST   /api/v1/vpcs/:id/natgw
//   GET/POST   /api/v1/storage/buckets
//   GET/POST   /api/v1/databases
//   GET/POST   /api/v1/loadbalancers
//   GET/POST   /api/v1/iam/users
