package service

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"math/big"
	"net"
	"strings"

	pb "github.com/rigstack/proto/gen"
	"github.com/rigstack/controller/internal/dispatcher"
	"github.com/rigstack/controller/internal/scheduler"
	"github.com/rigstack/controller/internal/store/postgres"
)

const passwordChars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"

func generatePassword(length int) string {
	b := make([]byte, length)
	for i := range b {
		n, _ := rand.Int(rand.Reader, big.NewInt(int64(len(passwordChars))))
		b[i] = passwordChars[n.Int64()]
	}
	return string(b)
}

type InstanceService struct {
	store      *postgres.InstanceStore
	vpcs       *postgres.VPCStore
	nodes      *postgres.NodeStore
	scheduler  *scheduler.Scheduler
	dispatcher *dispatcher.Dispatcher
}

func NewInstanceService(
	store *postgres.InstanceStore,
	vpcs *postgres.VPCStore,
	nodes *postgres.NodeStore,
	sched *scheduler.Scheduler,
	disp *dispatcher.Dispatcher,
) *InstanceService {
	return &InstanceService{store: store, vpcs: vpcs, nodes: nodes, scheduler: sched, dispatcher: disp}
}

// NodeAddressForInstance retorna host:porta do agente no node que hospeda a instância.
func (s *InstanceService) NodeAddressForInstance(ctx context.Context, instanceID string) (vmName, nodeAddr string, err error) {
	inst, err := s.store.Get(ctx, instanceID)
	if err != nil {
		return "", "", fmt.Errorf("instance not found: %w", err)
	}
	node, err := s.nodes.GetByID(ctx, inst.NodeID)
	if err != nil {
		return "", "", fmt.Errorf("node not found: %w", err)
	}
	// Node address is stored as host:grpcPort; console server runs on :9090
	host := node.Address
	if idx := len(host) - 1; idx >= 0 {
		for i := len(host) - 1; i >= 0; i-- {
			if host[i] == ':' {
				host = host[:i]
				break
			}
		}
	}
	return inst.Name, host + ":9090", nil
}

type CreateInstanceRequest struct {
	Name      string
	VPCID     string
	VCPUs     int
	RAMMB     int
	DiskGB    int
	OSImage   string
	SSHPubKey string
}

func (s *InstanceService) Create(ctx context.Context, req CreateInstanceRequest) (*postgres.Instance, error) {
	if req.Name == "" {
		return nil, fmt.Errorf("name is required")
	}
	if req.VCPUs < 1 {
		return nil, fmt.Errorf("vcpus must be >= 1")
	}
	if req.RAMMB < 512 {
		return nil, fmt.Errorf("ram_mb must be >= 512")
	}
	if req.VPCID == "" {
		return nil, fmt.Errorf("vpc_id is required")
	}

	vpc, err := s.vpcs.Get(ctx, req.VPCID)
	if err != nil {
		return nil, fmt.Errorf("vpc not found: %w", err)
	}

	node, err := s.scheduler.PickNode(ctx, int64(req.RAMMB)*1024*1024)
	if err != nil {
		return nil, fmt.Errorf("pick node: %w", err)
	}

	ip, prefix, gw, err := allocateIP(ctx, s.store, vpc)
	if err != nil {
		return nil, fmt.Errorf("allocate ip: %w", err)
	}

	password := generatePassword(12)

	id, err := s.store.Create(ctx, &postgres.Instance{
		Name:     req.Name,
		NodeID:   node.ID,
		VPCID:    req.VPCID,
		VCPUs:    req.VCPUs,
		RAMMB:    req.RAMMB,
		DiskGB:   req.DiskGB,
		OSImage:  req.OSImage,
		Password: password,
	})
	if err != nil {
		return nil, fmt.Errorf("create instance: %w", err)
	}

	// Atualiza o IP alocado na instância recém-criada
	if err := s.store.UpdateStatus(ctx, id, "pending", ip); err != nil {
		return nil, fmt.Errorf("update instance ip: %w", err)
	}

	payload, _ := json.Marshal(map[string]any{
		"vm_id":       id,
		"name":        req.Name,
		"vcpus":       req.VCPUs,
		"ram_mb":      req.RAMMB,
		"disk_gb":     req.DiskGB,
		"os_image":    req.OSImage,
		"bridge_name": bridgeName(req.VPCID),
		"ip_address":  ip,
		"prefix":      prefix,
		"gateway":     gw,
		"ssh_pubkey":  req.SSHPubKey,
		"password":    password,
	})
	s.dispatcher.Enqueue(node.ID, &pb.Command{Type: "create_vm", Payload: string(payload)})

	return s.store.Get(ctx, id)
}

func (s *InstanceService) List(ctx context.Context) ([]postgres.Instance, error) {
	return s.store.List(ctx)
}

func (s *InstanceService) Get(ctx context.Context, id string) (*postgres.Instance, error) {
	return s.store.Get(ctx, id)
}

func (s *InstanceService) UpdateStatus(ctx context.Context, id, status string) error {
	return s.store.UpdateStatus(ctx, id, status, "")
}

func (s *InstanceService) Start(ctx context.Context, id string) error {
	inst, err := s.store.Get(ctx, id)
	if err != nil {
		return fmt.Errorf("instance not found: %w", err)
	}
	vpc, err := s.vpcs.Get(ctx, inst.VPCID)
	if err != nil {
		return fmt.Errorf("vpc not found: %w", err)
	}
	if err := s.store.UpdateStatus(ctx, id, "starting", ""); err != nil {
		return err
	}
	payload, _ := json.Marshal(map[string]any{
		"vm_id":    id,
		"name":     inst.Name,
		"force":    false,
		"vpc_id":   inst.VPCID,
		"vpc_cidr": vpc.CIDR,
	})
	s.dispatcher.Enqueue(inst.NodeID, &pb.Command{Type: "start_vm", Payload: string(payload)})
	return nil
}

func (s *InstanceService) Stop(ctx context.Context, id string) error {
	inst, err := s.store.Get(ctx, id)
	if err != nil {
		return fmt.Errorf("instance not found: %w", err)
	}
	if err := s.store.UpdateStatus(ctx, id, "stopping", ""); err != nil {
		return err
	}
	payload, _ := json.Marshal(map[string]any{
		"vm_id": id,
		"name":  inst.Name,
		"force": false,
	})
	s.dispatcher.Enqueue(inst.NodeID, &pb.Command{Type: "stop_vm", Payload: string(payload)})
	return nil
}

func (s *InstanceService) Delete(ctx context.Context, id string) error {
	inst, err := s.store.Get(ctx, id)
	if err != nil {
		return fmt.Errorf("instance not found: %w", err)
	}
	_ = s.store.UpdateStatus(ctx, id, "terminating", "")
	payload, _ := json.Marshal(map[string]any{
		"vm_id": id,
		"name":  inst.Name,
	})
	s.dispatcher.Enqueue(inst.NodeID, &pb.Command{Type: "delete_vm", Payload: string(payload)})
	return s.store.Delete(ctx, id)
}

// allocateIP escolhe o próximo IP disponível na subnet da VPC.
// Fase A: sequencial a partir de .11 (gateway = .1, .2-.10 reservados).
func allocateIP(ctx context.Context, store *postgres.InstanceStore, vpc *postgres.VPC) (ip string, prefix int, gw string, err error) {
	_, ipNet, err := net.ParseCIDR(vpc.CIDR)
	if err != nil {
		return "", 0, "", fmt.Errorf("parse cidr: %w", err)
	}
	ones, _ := ipNet.Mask.Size()
	base := ipNet.IP.To4()
	if base == nil {
		return "", 0, "", fmt.Errorf("only IPv4 supported")
	}

	// Gateway = primeiro host da subnet (.1)
	gw4 := make(net.IP, 4)
	copy(gw4, base)
	gw4[3]++
	gw = gw4.String()

	count, err := store.CountByVPC(ctx, vpc.ID)
	if err != nil {
		return "", 0, "", err
	}

	// VMs começam em .11 (count=0 → offset=1 → .11)
	vm4 := make(net.IP, 4)
	copy(vm4, base)
	vm4[3] = byte(11 + count)

	return vm4.String(), ones, gw, nil
}

// bridgeName replica a lógica do agent/internal/network para gerar o nome da bridge.
func bridgeName(vpcID string) string {
	clean := strings.ReplaceAll(vpcID, "-", "")
	if len(clean) > 9 {
		clean = clean[:9]
	}
	return "rs-br-" + clean
}
