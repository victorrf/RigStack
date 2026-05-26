package executor

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"os/exec"
	"path/filepath"
	"regexp"

	pb "github.com/rigstack/proto/gen"
	"github.com/rigstack/agent/internal/libvirt"
	"github.com/rigstack/agent/internal/network"
	"github.com/rigstack/agent/internal/storage"
)

const baseImageDir = "/var/lib/rigstack/base"

var safeImageName = regexp.MustCompile(`^[a-zA-Z0-9._-]+$`)

// StatusReporter é a função que o executor chama para informar o controller
// sobre mudanças de estado de uma VM.
type StatusReporter func(ctx context.Context, vmID, status, ip string) error

// Executor recebe comandos do controller e os executa localmente.
// Cada comando roda em uma goroutine separada para não bloquear o heartbeat.
type Executor struct {
	lv      *libvirt.Manager
	store   *storage.Local
	net     *network.Manager
	report  StatusReporter
	logger  *slog.Logger
}

func New(lv *libvirt.Manager, store *storage.Local, net *network.Manager, report StatusReporter, logger *slog.Logger) *Executor {
	return &Executor{lv: lv, store: store, net: net, report: report, logger: logger}
}

// Handle despacha um comando recebido do controller.
func (e *Executor) Handle(cmd *pb.Command) {
	go func() {
		ctx := context.Background()
		var err error
		switch cmd.Type {
		case "create_vpc":
			err = e.createVPC(cmd.Payload)
		case "delete_vpc":
			err = e.deleteVPC(cmd.Payload)
		case "download_image":
			err = e.downloadImage(ctx, cmd.Payload)
		case "create_vm":
			err = e.createVM(ctx, cmd.Payload)
		case "start_vm":
			err = e.startVM(ctx, cmd.Payload)
		case "stop_vm":
			err = e.stopVM(ctx, cmd.Payload)
		case "delete_vm":
			err = e.deleteVM(ctx, cmd.Payload)
		default:
			e.logger.Warn("unknown command", "type", cmd.Type)
		}
		if err != nil {
			e.logger.Error("command failed", "type", cmd.Type, "err", err)
		}
	}()
}

func (e *Executor) createVPC(payload string) error {
	var cmd CreateVPCCmd
	if err := json.Unmarshal([]byte(payload), &cmd); err != nil {
		return fmt.Errorf("parse create_vpc payload: %w", err)
	}
	if e.net == nil {
		return fmt.Errorf("network manager not available")
	}
	e.logger.Info("creating vpc network", "vpc_id", cmd.VPCID, "cidr", cmd.CIDR)
	return e.net.CreateVPC(cmd.VPCID, cmd.CIDR)
}

func (e *Executor) deleteVPC(payload string) error {
	var cmd DeleteVPCCmd
	if err := json.Unmarshal([]byte(payload), &cmd); err != nil {
		return fmt.Errorf("parse delete_vpc payload: %w", err)
	}
	if e.net == nil {
		return nil
	}
	e.logger.Info("deleting vpc network", "vpc_id", cmd.VPCID)
	return e.net.DeleteVPC(cmd.VPCID, cmd.CIDR)
}

func (e *Executor) createVM(ctx context.Context, payload string) error {
	var cmd CreateVMCmd
	if err := json.Unmarshal([]byte(payload), &cmd); err != nil {
		return fmt.Errorf("parse create_vm payload: %w", err)
	}

	e.logger.Info("creating VM", "name", cmd.Name, "vcpus", cmd.VCPUs, "ram_mb", cmd.RAMMB)

	_ = e.report(ctx, cmd.VMID, "pending", "")

	// Garante que a bridge da VPC existe antes de criar a VM.
	// Cria bridge + NAT caso o node ainda não tenha para esta VPC.
	if e.net != nil && cmd.VpcID != "" && cmd.VpcCIDR != "" {
		if err := e.net.EnsureBridge(cmd.VpcID, cmd.VpcCIDR); err != nil {
			_ = e.report(ctx, cmd.VMID, "error", "")
			return fmt.Errorf("ensure bridge for vpc: %w", err)
		}
	}

	if !safeImageName.MatchString(cmd.OSImage) {
		return fmt.Errorf("invalid os_image name: %q", cmd.OSImage)
	}
	baseImage := filepath.Join(baseImageDir, cmd.OSImage+".qcow2")

	mac, err := libvirt.RandomMAC()
	if err != nil {
		return fmt.Errorf("generate mac: %w", err)
	}

	paths, err := e.store.Provision(cmd.VMID, baseImage, cmd.DiskGB, storage.CloudInitConfig{
		Hostname:  cmd.Name,
		IPAddress: cmd.IPAddress,
		Prefix:    cmd.Prefix,
		Gateway:   cmd.Gateway,
		SSHPubKey: cmd.SSHPubKey,
		Password:  cmd.Password,
	})
	if err != nil {
		_ = e.report(ctx, cmd.VMID, "error", "")
		return fmt.Errorf("provision storage: %w", err)
	}

	spec := libvirt.VMSpec{
		ID:            cmd.VMID,
		Name:          cmd.Name,
		VCPUs:         cmd.VCPUs,
		RAMMB:         cmd.RAMMB,
		DiskPath:      paths.DiskPath,
		CloudInitPath: paths.CloudInitPath,
		BridgeName:    cmd.BridgeName,
		MAC:           mac,
	}
	if err := e.lv.CreateVM(spec); err != nil {
		_ = e.report(ctx, cmd.VMID, "error", "")
		return fmt.Errorf("create vm in libvirt: %w", err)
	}

	_ = e.report(ctx, cmd.VMID, "running", cmd.IPAddress)
	e.logger.Info("VM created successfully", "name", cmd.Name, "ip", cmd.IPAddress)
	return nil
}

func (e *Executor) startVM(ctx context.Context, payload string) error {
	var cmd VMCmd
	if err := json.Unmarshal([]byte(payload), &cmd); err != nil {
		return fmt.Errorf("parse start_vm payload: %w", err)
	}
	// Recriar bridge caso tenha sumido após reboot do node
	if e.net != nil && cmd.VpcID != "" && cmd.VpcCIDR != "" {
		if err := e.net.EnsureBridge(cmd.VpcID, cmd.VpcCIDR); err != nil {
			_ = e.report(ctx, cmd.VMID, "error", "")
			return fmt.Errorf("ensure bridge: %w", err)
		}
	}
	e.logger.Info("starting VM", "name", cmd.Name)
	if err := e.lv.StartVM(cmd.Name); err != nil {
		_ = e.report(ctx, cmd.VMID, "error", "")
		return err
	}
	_ = e.report(ctx, cmd.VMID, "running", "")
	return nil
}

func (e *Executor) stopVM(ctx context.Context, payload string) error {
	var cmd VMCmd
	if err := json.Unmarshal([]byte(payload), &cmd); err != nil {
		return fmt.Errorf("parse stop_vm payload: %w", err)
	}
	e.logger.Info("stopping VM", "name", cmd.Name, "force", cmd.Force)
	if err := e.lv.StopVM(cmd.Name, cmd.Force); err != nil {
		return err
	}
	_ = e.report(ctx, cmd.VMID, "stopped", "")
	return nil
}

func (e *Executor) downloadImage(ctx context.Context, payload string) error {
	var cmd struct {
		Name string `json:"name"`
		URL  string `json:"url"`
	}
	if err := json.Unmarshal([]byte(payload), &cmd); err != nil {
		return fmt.Errorf("parse download_image payload: %w", err)
	}
	if !safeImageName.MatchString(cmd.Name) {
		return fmt.Errorf("invalid image name: %q", cmd.Name)
	}
	target := filepath.Join(baseImageDir, cmd.Name+".qcow2")
	e.logger.Info("downloading image", "name", cmd.Name, "target", target)
	if out, err := exec.CommandContext(ctx, "wget", "-q", "--show-progress", "-O", target+".tmp", cmd.URL).CombinedOutput(); err != nil {
		_ = exec.Command("rm", "-f", target+".tmp").Run()
		return fmt.Errorf("download image %q: %w — %s", cmd.Name, err, out)
	}
	return exec.Command("mv", target+".tmp", target).Run()
}

func (e *Executor) deleteVM(ctx context.Context, payload string) error {
	var cmd VMCmd
	if err := json.Unmarshal([]byte(payload), &cmd); err != nil {
		return fmt.Errorf("parse delete_vm payload: %w", err)
	}
	e.logger.Info("deleting VM", "name", cmd.Name)

	if err := e.lv.DeleteVM(cmd.Name); err != nil {
		e.logger.Warn("libvirt delete failed (may already be gone)", "err", err)
	}

	if err := e.store.Delete(cmd.VMID); err != nil {
		return fmt.Errorf("delete vm storage: %w", err)
	}
	return nil
}
