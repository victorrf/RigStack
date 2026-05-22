package handler

// Handlers HTTP para nodes (regiões).
//
// Nodes são registrados pelos agents via gRPC, não pelo frontend.
// O frontend apenas lista e monitora os nodes existentes.
//
// Endpoints:
//   GET  /api/v1/nodes         → lista todos os nodes e seus status
//   GET  /api/v1/nodes/:id     → detalhes de um node (CPU, RAM, VMs, uptime)
