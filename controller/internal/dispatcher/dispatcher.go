package dispatcher

import (
	"sync"

	pb "github.com/rigstack/proto/gen"
)

// Dispatcher mantém uma fila de comandos pendentes por node.
// O gRPC server drena a fila de cada node a cada heartbeat e inclui
// os comandos no HeartbeatResponse. Os commands ficam enfileirados
// até o agent se reconectar caso esteja offline.
type Dispatcher struct {
	mu     sync.Mutex
	queues map[string][]*pb.Command // nodeID → comandos pendentes
}

func New() *Dispatcher {
	return &Dispatcher{queues: make(map[string][]*pb.Command)}
}

// Enqueue adiciona um comando à fila do node. Thread-safe.
func (d *Dispatcher) Enqueue(nodeID string, cmd *pb.Command) {
	d.mu.Lock()
	defer d.mu.Unlock()
	d.queues[nodeID] = append(d.queues[nodeID], cmd)
}

// Drain retira e retorna todos os comandos pendentes do node. Thread-safe.
func (d *Dispatcher) Drain(nodeID string) []*pb.Command {
	d.mu.Lock()
	defer d.mu.Unlock()
	cmds := d.queues[nodeID]
	delete(d.queues, nodeID)
	return cmds
}
