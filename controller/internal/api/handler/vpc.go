package handler

import (
	"net/http"
	"time"

	"github.com/rigstack/controller/internal/service"
)

type VPCHandler struct {
	svc *service.VPCService
}

func NewVPCHandler(svc *service.VPCService) *VPCHandler {
	return &VPCHandler{svc: svc}
}

type vpcResponse struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	CIDR      string    `json:"cidr"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

type createVPCRequest struct {
	Name string `json:"name"`
	CIDR string `json:"cidr"`
}

func (h *VPCHandler) List(w http.ResponseWriter, r *http.Request) {
	vpcs, err := h.svc.List(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	resp := make([]vpcResponse, 0, len(vpcs))
	for _, v := range vpcs {
		resp = append(resp, vpcResponse{
			ID:        v.ID,
			Name:      v.Name,
			CIDR:      v.CIDR,
			Status:    v.Status,
			CreatedAt: v.CreatedAt,
		})
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h *VPCHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req createVPCRequest
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}

	vpc, err := h.svc.Create(r.Context(), req.Name, req.CIDR)
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}

	writeJSON(w, http.StatusCreated, vpcResponse{
		ID:        vpc.ID,
		Name:      vpc.Name,
		CIDR:      vpc.CIDR,
		Status:    vpc.Status,
		CreatedAt: vpc.CreatedAt,
	})
}

func (h *VPCHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if err := h.svc.Delete(r.Context(), id); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
