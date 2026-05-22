package grpcserver

// Servidor gRPC do controller — ponto de conexão dos agents.
//
// RPCs implementados:
//
//   RegisterNode(NodeInfo) → NodeID
//     Agent chama isso ao subir. Controller registra o node no banco
//     e devolve um ID único. A partir daí o agent usa esse ID em todos os RPCs.
//
//   Heartbeat(stream HeartbeatRequest) → stream HeartbeatResponse
//     Stream bidirecional: agent manda status a cada N segundos,
//     controller pode mandar comandos de volta (ex: atualizar config).
//     Se o stream cair, controller marca o node como "unreachable".
//
//   ReportVMStatus(VMStatusUpdate) → Ack
//     Agent notifica mudanças de estado das VMs (pending → running, etc.)
