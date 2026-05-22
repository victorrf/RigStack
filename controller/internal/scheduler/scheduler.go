package scheduler

// Scheduler — decide qual node executa cada operação.
//
// Critérios de seleção de node (em ordem de prioridade):
//   1. Node deve estar "healthy" (heartbeat recente)
//   2. Node deve ter recursos suficientes (RAM, CPU, disco)
//   3. Estratégia de balanceamento: least-loaded (padrão) ou affinity
//
// Para VMs: retorna o node com mais recursos livres que satisfaça os requisitos.
// Para NAT GW: retorna o node com melhor conectividade externa (a definir).
//
// Fase A: seleção simples por recurso disponível.
// Fase B: adicionar afinidade de região e preferência de migração.
