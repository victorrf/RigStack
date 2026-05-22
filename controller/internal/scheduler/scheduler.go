package scheduler

import (
	"context"
	"fmt"

	"github.com/rigstack/controller/internal/store/postgres"
)

// Scheduler seleciona qual node executa cada operação.
// Fase A: least-loaded — escolhe o node saudável com mais RAM livre.
type Scheduler struct {
	nodes *postgres.NodeStore
}

func New(nodes *postgres.NodeStore) *Scheduler {
	return &Scheduler{nodes: nodes}
}

// HealthyNodes retorna todos os nodes saudáveis.
func (s *Scheduler) HealthyNodes(ctx context.Context) ([]postgres.Node, error) {
	return s.nodes.GetHealthy(ctx)
}

// PickNode retorna o node mais adequado para receber uma VM com os requisitos dados.
// minRAMBytes: RAM mínima necessária (0 = sem requisito).
func (s *Scheduler) PickNode(ctx context.Context, minRAMBytes int64) (*postgres.Node, error) {
	healthy, err := s.nodes.GetHealthy(ctx)
	if err != nil {
		return nil, fmt.Errorf("list healthy nodes: %w", err)
	}
	if len(healthy) == 0 {
		return nil, fmt.Errorf("no healthy nodes available")
	}

	var best *postgres.Node
	for i := range healthy {
		n := &healthy[i]
		if n.RAMFree < minRAMBytes {
			continue
		}
		if best == nil || n.RAMFree > best.RAMFree {
			best = n
		}
	}
	if best == nil {
		return nil, fmt.Errorf("no node with enough resources (need %d bytes RAM free)", minRAMBytes)
	}
	return best, nil
}
