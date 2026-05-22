package service

// InstanceService — lógica de negócio para VMs.
//
// Métodos planejados:
//   Create(req)        → persiste no banco, aciona scheduler, manda pro agent
//   Start(id)          → verifica estado atual, manda comando ao agent do node
//   Stop(id)           → idem
//   Delete(id)         → para a VM, libera recursos, remove do banco
//   UpdateStatus(id, status) → chamado pelo grpcserver quando agent reporta mudança
