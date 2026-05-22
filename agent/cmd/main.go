package main

// Ponto de entrada do Agent (roda em cada node/região).
//
// Responsabilidades:
//   - Ler configuração local (endereço do controller, região, etc.)
//   - Registrar este node no controller via gRPC
//   - Iniciar loop de heartbeat (reporta status ao controller periodicamente)
//   - Aguardar e executar comandos recebidos do controller:
//       criar VM, parar VM, deletar VM, criar VPC, configurar NAT GW, etc.

func main() {}
