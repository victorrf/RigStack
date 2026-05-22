package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/rigstack/agent/internal/controller"
	"github.com/rigstack/agent/internal/executor"
	"github.com/rigstack/agent/internal/libvirt"
	"github.com/rigstack/agent/internal/network"
	"github.com/rigstack/agent/internal/storage"
)

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))

	cfg := loadConfig()

	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	// --- Libvirt ---
	var lv *libvirt.Manager
	if cfg.libvirtSocket != "" {
		var err error
		lv, err = libvirt.New(cfg.libvirtSocket, logger)
		if err != nil {
			// Não fatal: agent pode registrar e enviar heartbeat sem libvirt.
			// Comandos de VM vão falhar, mas o node aparece no controller.
			logger.Warn("libvirt unavailable — VM commands will fail", "err", err)
		} else {
			defer lv.Close()
		}
	} else {
		logger.Warn("LIBVIRT_SOCKET not set — running without libvirt")
	}

	store := storage.NewLocal(logger)

	// --- Network manager ---
	var netMgr *network.Manager
	if nm, err := network.New(logger); err != nil {
		// Não fatal: agent funciona sem permissão de root/network namespace.
		// Comandos create_vpc vão falhar, mas VMs já existentes não são afetadas.
		logger.Warn("network manager unavailable — vpc commands will fail", "err", err)
	} else {
		netMgr = nm
	}

	// --- Controller gRPC ---
	logger.Info("connecting to controller", "addr", cfg.controllerAddr)
	client, err := controller.Connect(ctx, cfg.controllerAddr, logger)
	if err != nil {
		logger.Error("failed to connect to controller", "err", err)
		os.Exit(1)
	}
	defer client.Close()

	// --- Registro do node ---
	info := buildNodeInfo(cfg, lv, logger)
	if err := client.Register(ctx, info); err != nil {
		logger.Error("failed to register node", "err", err)
		os.Exit(1)
	}

	// --- Executor de comandos ---
	exec := executor.New(lv, store, netMgr, client.ReportVMStatus, logger)

	// --- Heartbeat loop com reconexão automática ---
	logger.Info("starting heartbeat loop", "interval", "10s")
	for {
		err := client.RunHeartbeat(
			ctx,
			func() controller.HeartbeatStats {
				return collectStats(ctx, lv, logger)
			},
			exec.Handle,
		)

		if ctx.Err() != nil {
			logger.Info("agent shutting down")
			return
		}

		logger.Warn("heartbeat disconnected, reconnecting in 5s", "err", err)
		time.Sleep(5 * time.Second)

		// Re-registrar após reconexão (node_id pode ter mudado se o controller reiniciou)
		if err := client.Register(ctx, buildNodeInfo(cfg, lv, logger)); err != nil {
			logger.Error("re-registration failed", "err", err)
		}
	}
}

type config struct {
	controllerAddr string
	nodeName       string
	nodeRegion     string
	nodeAddr       string
	libvirtSocket  string
}

func loadConfig() config {
	return config{
		controllerAddr: getenv("CONTROLLER_ADDR", "localhost:9090"),
		nodeName:       getenv("NODE_NAME", mustHostname()),
		nodeRegion:     getenv("NODE_REGION", "local-1"),
		nodeAddr:       getenv("NODE_ADDR", "localhost:9091"),
		libvirtSocket:  getenv("LIBVIRT_SOCKET", "/var/run/libvirt/libvirt-sock"),
	}
}

func buildNodeInfo(cfg config, lv *libvirt.Manager, logger *slog.Logger) controller.NodeInfo {
	info := controller.NodeInfo{
		Name:      cfg.nodeName,
		Region:    cfg.nodeRegion,
		Address:   cfg.nodeAddr,
		CPUCores:  4,
		RAMBytes:  8 * 1024 * 1024 * 1024, // 8 GB fallback
		DiskBytes: 100 * 1024 * 1024 * 1024, // 100 GB fallback
	}

	if lv == nil {
		return info
	}

	stats, err := lv.GetNodeStats(context.Background())
	if err != nil {
		logger.Warn("could not read node stats from libvirt", "err", err)
		return info
	}

	info.CPUCores = int32(stats.CPUCores)
	info.RAMBytes = int64(stats.RAMTotal)
	return info
}

func collectStats(ctx context.Context, lv *libvirt.Manager, logger *slog.Logger) controller.HeartbeatStats {
	if lv == nil {
		return controller.HeartbeatStats{CPUFreePct: 80, RAMFree: 4 * 1024 * 1024 * 1024, DiskFree: 50 * 1024 * 1024 * 1024}
	}

	stats, err := lv.GetNodeStats(ctx)
	if err != nil {
		logger.Warn("heartbeat: could not read libvirt stats", "err", err)
		return controller.HeartbeatStats{}
	}

	var ramFreePct int32
	if stats.RAMTotal > 0 {
		ramFreePct = int32(stats.RAMFree * 100 / stats.RAMTotal)
	}

	return controller.HeartbeatStats{
		CPUFreePct: ramFreePct, // TODO fase B: ler /proc/stat; por ora usa RAM% como proxy
		RAMFree:    int64(stats.RAMFree),
		DiskFree:   0, // fase B: ler via syscall.Statfs
		VMCount:    int32(stats.VMRunning),
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func mustHostname() string {
	h, err := os.Hostname()
	if err != nil {
		return "unknown-node"
	}
	return h
}
