package handler

// Handlers HTTP para instâncias (VMs).
//
// Fluxo de criação de VM:
//   1. Recebe request do frontend (nome, OS, flavor, subnet)
//   2. Valida os parâmetros
//   3. Chama InstanceService.Create()
//   4. O service aciona o Scheduler para escolher o node
//   5. O Scheduler envia o comando ao agent via gRPC
//   6. Retorna o estado inicial da VM (status: pending)
