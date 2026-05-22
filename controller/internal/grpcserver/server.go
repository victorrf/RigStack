package grpcserver

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"net"
	"time"

	pb "github.com/rigstack/proto/gen"
	"github.com/rigstack/controller/internal/dispatcher"
	"github.com/rigstack/controller/internal/store/postgres"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/peer"
	"google.golang.org/grpc/status"
)

type Server struct {
	pb.UnimplementedNodeServiceServer
	nodes      *postgres.NodeStore
	dispatcher *dispatcher.Dispatcher
	logger     *slog.Logger
}

func New(nodes *postgres.NodeStore, disp *dispatcher.Dispatcher, logger *slog.Logger) *Server {
	return &Server{nodes: nodes, dispatcher: disp, logger: logger}
}

func (s *Server) RegisterNode(ctx context.Context, info *pb.NodeInfo) (*pb.NodeID, error) {
	p, _ := peer.FromContext(ctx)
	s.logger.Info("node registering", "name", info.Name, "region", info.Region, "addr", p.Addr)

	id, err := s.nodes.Upsert(ctx, &postgres.Node{
		Name:      info.Name,
		Region:    info.Region,
		Address:   info.Address,
		CPUCores:  info.CpuCores,
		RAMBytes:  info.RamBytes,
		DiskBytes: info.DiskBytes,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "register node: %v", err)
	}

	s.logger.Info("node registered", "id", id, "name", info.Name, "region", info.Region)
	return &pb.NodeID{Id: id}, nil
}

func (s *Server) Heartbeat(stream pb.NodeService_HeartbeatServer) error {
	var nodeID string

	for {
		req, err := stream.Recv()
		if err == io.EOF {
			return nil
		}
		if err != nil {
			if nodeID != "" {
				s.logger.Warn("node heartbeat lost", "id", nodeID)
				_ = s.nodes.MarkUnreachable(context.Background(), nodeID)
			}
			return err
		}

		nodeID = req.NodeId
		if err := s.nodes.UpdateHeartbeat(
			stream.Context(), nodeID,
			req.CpuFree, req.RamFree, req.DiskFree, req.VmCount,
		); err != nil {
			s.logger.Error("heartbeat update failed", "id", nodeID, "err", err)
		}

		// Drena comandos pendentes para este node e os envia na resposta.
		cmds := s.dispatcher.Drain(nodeID)
		if len(cmds) > 0 {
			s.logger.Info("dispatching commands to node", "node_id", nodeID, "count", len(cmds))
		}
		if err := stream.Send(&pb.HeartbeatResponse{Commands: cmds}); err != nil {
			return err
		}
	}
}

func (s *Server) ReportVMStatus(ctx context.Context, update *pb.VMStatusUpdate) (*pb.Ack, error) {
	s.logger.Info("vm status update", "vm_id", update.VmId, "status", update.Status, "ip", update.Ip)

	if err := s.nodes.UpdateVMStatus(ctx, update.VmId, update.Status, update.Ip); err != nil {
		return &pb.Ack{Ok: false}, status.Errorf(codes.Internal, "update vm status: %v", err)
	}
	return &pb.Ack{Ok: true}, nil
}

func Listen(addr string, srv *Server) error {
	lis, err := net.Listen("tcp", addr)
	if err != nil {
		return fmt.Errorf("listen %s: %w", addr, err)
	}

	grpcSrv := grpc.NewServer(
		grpc.ConnectionTimeout(10 * time.Second),
	)
	pb.RegisterNodeServiceServer(grpcSrv, srv)

	slog.Info("gRPC server listening", "addr", addr)
	return grpcSrv.Serve(lis)
}
