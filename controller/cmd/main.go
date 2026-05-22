package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	api "github.com/rigstack/controller/internal/api"
	"github.com/rigstack/controller/internal/dispatcher"
	"github.com/rigstack/controller/internal/grpcserver"
	"github.com/rigstack/controller/internal/scheduler"
	"github.com/rigstack/controller/internal/service"
	"github.com/rigstack/controller/internal/store/postgres"
)

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

	dsn := getenv("DATABASE_URL", "postgres://rigstack:rigstack@localhost:5432/rigstack")
	grpcAddr := ":" + getenv("GRPC_PORT", "9090")
	httpAddr := ":" + getenv("HTTP_PORT", "8080")

	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	db, err := postgres.Connect(ctx, dsn)
	if err != nil {
		logger.Error("failed to connect to database", "err", err)
		os.Exit(1)
	}
	defer db.Close()
	logger.Info("connected to database")

	// Stores
	nodeStore := postgres.NewNodeStore(db)
	vpcStore := postgres.NewVPCStore(db)
	instanceStore := postgres.NewInstanceStore(db)

	// Dispatcher de comandos controller → agent
	disp := dispatcher.New()

	// Scheduler
	sched := scheduler.New(nodeStore)

	// Services
	nodeSvc := service.NewNodeService(nodeStore)
	vpcSvc := service.NewVPCService(vpcStore, sched, disp)
	instanceSvc := service.NewInstanceService(instanceStore, vpcStore, sched, disp)

	// gRPC server — roda em goroutine, usa o dispatcher para entregar comandos
	grpcSrv := grpcserver.New(nodeStore, disp, logger)
	go func() {
		logger.Info("gRPC server starting", "addr", grpcAddr)
		if err := grpcserver.Listen(grpcAddr, grpcSrv); err != nil {
			logger.Error("gRPC server error", "err", err)
			cancel()
		}
	}()

	// HTTP REST API
	router := api.NewRouter(nodeSvc, vpcSvc, instanceSvc)
	httpSrv := &http.Server{Addr: httpAddr, Handler: router}

	go func() {
		<-ctx.Done()
		_ = httpSrv.Shutdown(context.Background())
	}()

	logger.Info("HTTP server starting", "addr", httpAddr)
	if err := httpSrv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		logger.Error("HTTP server error", "err", err)
		os.Exit(1)
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
