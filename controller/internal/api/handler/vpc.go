package handler

// Handlers HTTP para VPCs, subnets e NAT Gateways.
//
// Fluxo de criação de VPC:
//   1. Recebe nome + CIDR do frontend
//   2. Valida que o CIDR não conflita com VPCs existentes
//   3. Persiste a VPC no banco (status: provisioning)
//   4. Chama VPCService.ProvisionNATGateway()
//      → Scheduler escolhe o node que vai hospedar o NAT GW
//      → Envia comando ao agent via gRPC
//      → Agent cria a bridge + network namespace + regras iptables
//   5. Atualiza status da VPC para "active"
