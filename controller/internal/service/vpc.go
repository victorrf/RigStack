package service

import (
	"context"
	"encoding/json"
	"fmt"
	"net"

	pb "github.com/rigstack/proto/gen"
	"github.com/rigstack/controller/internal/dispatcher"
	"github.com/rigstack/controller/internal/scheduler"
	"github.com/rigstack/controller/internal/store/postgres"
)

type VPCService struct {
	store      *postgres.VPCStore
	scheduler  *scheduler.Scheduler
	dispatcher *dispatcher.Dispatcher
}

func NewVPCService(store *postgres.VPCStore, sched *scheduler.Scheduler, disp *dispatcher.Dispatcher) *VPCService {
	return &VPCService{store: store, scheduler: sched, dispatcher: disp}
}

func (s *VPCService) Create(ctx context.Context, name, cidr string) (*postgres.VPC, error) {
	if _, _, err := net.ParseCIDR(cidr); err != nil {
		return nil, fmt.Errorf("invalid CIDR %q: %w", cidr, err)
	}

	id, err := s.store.Create(ctx, &postgres.VPC{Name: name, CIDR: cidr})
	if err != nil {
		return nil, fmt.Errorf("create vpc: %w", err)
	}

	// Envia create_vpc para o node com mais recursos disponíveis.
	// Se não houver node disponível, a VPC é criada no banco mas o agente
	// receberá o comando quando se conectar (comandos ficam na fila).
	node, err := s.scheduler.PickNode(ctx, 0)
	if err == nil {
		payload, _ := json.Marshal(map[string]string{
			"vpc_id": id,
			"cidr":   cidr,
		})
		s.dispatcher.Enqueue(node.ID, &pb.Command{Type: "create_vpc", Payload: string(payload)})
	}

	return s.store.Get(ctx, id)
}

func (s *VPCService) List(ctx context.Context) ([]postgres.VPC, error) {
	return s.store.List(ctx)
}

func (s *VPCService) Delete(ctx context.Context, id string) error {
	vpc, err := s.store.Get(ctx, id)
	if err != nil {
		return fmt.Errorf("vpc not found: %w", err)
	}
	// Envia delete_vpc para o mesmo node (Fase A: qualquer node disponível)
	if node, err := s.scheduler.PickNode(ctx, 0); err == nil {
		payload, _ := json.Marshal(map[string]string{
			"vpc_id": id,
			"cidr":   vpc.CIDR,
		})
		s.dispatcher.Enqueue(node.ID, &pb.Command{Type: "delete_vpc", Payload: string(payload)})
	}
	return s.store.Delete(ctx, id)
}
