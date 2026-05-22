package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/rigstack/controller/internal/service"
)

type NodeHandler struct {
	svc *service.NodeService
}

func NewNodeHandler(svc *service.NodeService) *NodeHandler {
	return &NodeHandler{svc: svc}
}

type nodeResponse struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Region       string    `json:"region"`
	Address      string    `json:"address"`
	Status       string    `json:"status"`
	CPUCores     int32     `json:"cpu_cores"`
	CPUFreePct   int32     `json:"cpu_free_pct"`
	RAMBytes     int64     `json:"ram_bytes"`
	RAMFree      int64     `json:"ram_free"`
	DiskBytes    int64     `json:"disk_bytes"`
	DiskFree     int64     `json:"disk_free"`
	VMCount      int32     `json:"vm_count"`
	LastSeen     time.Time `json:"last_seen"`
	RegisteredAt time.Time `json:"registered_at"`
}

func (h *NodeHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if err := h.svc.Delete(r.Context(), id); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *NodeHandler) List(w http.ResponseWriter, r *http.Request) {
	nodes, err := h.svc.List(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	resp := make([]nodeResponse, 0, len(nodes))
	for _, n := range nodes {
		resp = append(resp, nodeResponse{
			ID:           n.ID,
			Name:         n.Name,
			Region:       n.Region,
			Address:      n.Address,
			Status:       n.Status,
			CPUCores:     n.CPUCores,
			CPUFreePct:   n.CPUFreePct,
			RAMBytes:     n.RAMBytes,
			RAMFree:      n.RAMFree,
			DiskBytes:    n.DiskBytes,
			DiskFree:     n.DiskFree,
			VMCount:      n.VMCount,
			LastSeen:     n.LastSeen,
			RegisteredAt: n.RegisteredAt,
		})
	}
	writeJSON(w, http.StatusOK, resp)
}

// writeJSON serializa v como JSON e escreve na resposta.
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

// writeError escreve uma resposta de erro JSON padronizada.
func writeError(w http.ResponseWriter, status int, err error) {
	writeJSON(w, status, map[string]string{"error": err.Error()})
}

// readJSON decodifica o body da request em v.
func readJSON(r *http.Request, v any) error {
	return json.NewDecoder(r.Body).Decode(v)
}
