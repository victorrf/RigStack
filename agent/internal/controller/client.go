package controller

// Cliente gRPC para comunicação com o controller.
//
// Responsabilidades:
//   - Manter conexão persistente com o controller (reconectar se cair)
//   - RegisterNode() no boot
//   - Loop de Heartbeat() em goroutine separada
//   - ReportVMStatus() quando libvirt notificar mudança de estado de VM
//
// O agent NÃO expõe porta. Toda comunicação é iniciada pelo agent → controller.
// Comandos do controller chegam via stream bidirecional do Heartbeat.
