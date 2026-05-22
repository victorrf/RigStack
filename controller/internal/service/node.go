package service

import (
	"context"

	"github.com/rigstack/controller/internal/store/postgres"
)

type NodeService struct {
	store *postgres.NodeStore
}

func NewNodeService(store *postgres.NodeStore) *NodeService {
	return &NodeService{store: store}
}

func (s *NodeService) List(ctx context.Context) ([]postgres.Node, error) {
	return s.store.List(ctx)
}
