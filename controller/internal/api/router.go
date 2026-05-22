package api

import (
	"net/http"

	"github.com/rigstack/controller/internal/api/handler"
	"github.com/rigstack/controller/internal/api/middleware"
	"github.com/rigstack/controller/internal/service"
)

// NewRouter monta todas as rotas REST da API v1.
func NewRouter(nodes *service.NodeService, vpcs *service.VPCService, instances *service.InstanceService) http.Handler {
	mux := http.NewServeMux()

	nh := handler.NewNodeHandler(nodes)
	vh := handler.NewVPCHandler(vpcs)
	ih := handler.NewInstanceHandler(instances)

	mux.HandleFunc("GET /api/v1/nodes", nh.List)

	mux.HandleFunc("GET /api/v1/vpcs", vh.List)
	mux.HandleFunc("POST /api/v1/vpcs", vh.Create)
	mux.HandleFunc("DELETE /api/v1/vpcs/{id}", vh.Delete)

	mux.HandleFunc("GET /api/v1/instances", ih.List)
	mux.HandleFunc("POST /api/v1/instances", ih.Create)
	mux.HandleFunc("PUT /api/v1/instances/{id}/start", ih.Start)
	mux.HandleFunc("PUT /api/v1/instances/{id}/stop", ih.Stop)
	mux.HandleFunc("DELETE /api/v1/instances/{id}", ih.Delete)

	// Healthcheck
	// Healthcheck
	mux.HandleFunc("GET /api/v1/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok"}`))
	})

	// Agent bootstrap — curl http://CONTROLLER:8080/agent/install.sh | sudo sh -
	ah := handler.NewAgentHandler()
	mux.HandleFunc("GET /agent/install.sh", ah.InstallScript)
	mux.HandleFunc("GET /agent/binary", ah.Binary)

	return middleware.CORS(mux)
}
