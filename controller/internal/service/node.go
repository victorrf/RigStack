package service

// NodeService — gerenciamento dos nodes registrados.
//
// Métodos planejados:
//   Register(info)     → cria ou atualiza o node no banco, retorna NodeID
//   UpdateHeartbeat(id, stats) → atualiza last_seen, CPU/RAM/disco disponível
//   MarkUnreachable(id) → chamado quando heartbeat para; não deleta, só muda status
//   List()             → retorna todos os nodes com status atual
//   GetHealthy()       → retorna apenas nodes em condição de receber workload
