package controller

import (
	"context"
	"log/slog"
	"time"

	pb "github.com/rigstack/proto/gen"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/keepalive"
)

const heartbeatInterval = 10 * time.Second

type Client struct {
	conn   *grpc.ClientConn
	node   pb.NodeServiceClient
	logger *slog.Logger
	nodeID string
}

type NodeInfo struct {
	Name      string
	Region    string
	Address   string // endereço gRPC deste agent (para o controller guardar)
	CPUCores  int32
	RAMBytes  int64
	DiskBytes int64
}

func Connect(ctx context.Context, controllerAddr string, logger *slog.Logger) (*Client, error) {
	conn, err := grpc.NewClient(controllerAddr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithKeepaliveParams(keepalive.ClientParameters{
			Time:                20 * time.Second,
			Timeout:             10 * time.Second,
			PermitWithoutStream: true,
		}),
	)
	if err != nil {
		return nil, err
	}
	return &Client{conn: conn, node: pb.NewNodeServiceClient(conn), logger: logger}, nil
}

func (c *Client) Register(ctx context.Context, info NodeInfo) error {
	resp, err := c.node.RegisterNode(ctx, &pb.NodeInfo{
		Name:      info.Name,
		Region:    info.Region,
		Address:   info.Address,
		CpuCores:  info.CPUCores,
		RamBytes:  info.RAMBytes,
		DiskBytes: info.DiskBytes,
	})
	if err != nil {
		return err
	}
	c.nodeID = resp.Id
	c.logger.Info("registered with controller", "node_id", c.nodeID)
	return nil
}

// CommandHandler é chamado para cada comando recebido do controller.
type CommandHandler func(cmd *pb.Command)

// RunHeartbeat envia status ao controller a cada heartbeatInterval e
// repassa os comandos recebidos para o handler.
// Bloqueia até o contexto ser cancelado ou a conexão cair.
func (c *Client) RunHeartbeat(ctx context.Context, stats func() HeartbeatStats, handler CommandHandler) error {
	stream, err := c.node.Heartbeat(ctx)
	if err != nil {
		return err
	}

	ticker := time.NewTicker(heartbeatInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return stream.CloseSend()
		case <-ticker.C:
			s := stats()
			if err := stream.Send(&pb.HeartbeatRequest{
				NodeId:   c.nodeID,
				CpuFree:  s.CPUFreePct,
				RamFree:  s.RAMFree,
				DiskFree: s.DiskFree,
				VmCount:  s.VMCount,
			}); err != nil {
				return err
			}

			resp, err := stream.Recv()
			if err != nil {
				return err
			}

			for _, cmd := range resp.Commands {
				c.logger.Info("received command", "type", cmd.Type)
				if handler != nil {
					handler(cmd)
				}
			}
		}
	}
}

func (c *Client) ReportVMStatus(ctx context.Context, vmID, status, ip string) error {
	_, err := c.node.ReportVMStatus(ctx, &pb.VMStatusUpdate{
		VmId:   vmID,
		Status: status,
		Ip:     ip,
	})
	return err
}

func (c *Client) NodeID() string { return c.nodeID }

func (c *Client) Close() { c.conn.Close() }

type HeartbeatStats struct {
	CPUFreePct int32
	RAMFree    int64
	DiskFree   int64
	VMCount    int32
}
