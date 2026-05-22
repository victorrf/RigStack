package handler

import (
	"fmt"
	"net/http"
	"time"

	"github.com/rigstack/controller/internal/service"
)

type InstanceHandler struct {
	svc *service.InstanceService
}

func NewInstanceHandler(svc *service.InstanceService) *InstanceHandler {
	return &InstanceHandler{svc: svc}
}

type instanceResponse struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Status    string    `json:"status"`
	NodeID    string    `json:"node_id"`
	VPCID     string    `json:"vpc_id"`
	VCPUs     int       `json:"vcpus"`
	RAMMB     int       `json:"ram_mb"`
	DiskGB    int       `json:"disk_gb"`
	IPAddress string    `json:"ip_address"`
	OSImage   string    `json:"os_image"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type createInstanceRequest struct {
	Name      string `json:"name"`
	VPCID     string `json:"vpc_id"`
	VCPUs     int    `json:"vcpus"`
	RAMMB     int    `json:"ram_mb"`
	DiskGB    int    `json:"disk_gb"`
	OSImage   string `json:"os_image"`
	SSHPubKey string `json:"ssh_pubkey"`
}

func (h *InstanceHandler) List(w http.ResponseWriter, r *http.Request) {
	instances, err := h.svc.List(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	resp := make([]instanceResponse, 0, len(instances))
	for _, i := range instances {
		resp = append(resp, instanceResponse{
			ID:        i.ID,
			Name:      i.Name,
			Status:    i.Status,
			NodeID:    i.NodeID,
			VPCID:     i.VPCID,
			VCPUs:     i.VCPUs,
			RAMMB:     i.RAMMB,
			DiskGB:    i.DiskGB,
			IPAddress: i.IPAddress,
			OSImage:   i.OSImage,
			CreatedAt: i.CreatedAt,
			UpdatedAt: i.UpdatedAt,
		})
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h *InstanceHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req createInstanceRequest
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}

	inst, err := h.svc.Create(r.Context(), service.CreateInstanceRequest{
		Name:      req.Name,
		VPCID:     req.VPCID,
		VCPUs:     req.VCPUs,
		RAMMB:     req.RAMMB,
		DiskGB:    req.DiskGB,
		OSImage:   req.OSImage,
		SSHPubKey: req.SSHPubKey,
	})
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}

	writeJSON(w, http.StatusCreated, instanceResponse{
		ID:        inst.ID,
		Name:      inst.Name,
		Status:    inst.Status,
		NodeID:    inst.NodeID,
		VPCID:     inst.VPCID,
		VCPUs:     inst.VCPUs,
		RAMMB:     inst.RAMMB,
		DiskGB:    inst.DiskGB,
		IPAddress: inst.IPAddress,
		OSImage:   inst.OSImage,
		CreatedAt: inst.CreatedAt,
		UpdatedAt: inst.UpdatedAt,
	})
}

func (h *InstanceHandler) Start(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if err := h.svc.UpdateStatus(r.Context(), id, "starting"); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "starting"})
}

func (h *InstanceHandler) Stop(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if err := h.svc.UpdateStatus(r.Context(), id, "stopping"); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "stopping"})
}

func (h *InstanceHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	inst, err := h.svc.Get(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusNotFound, fmt.Errorf("instance not found"))
		return
	}
	if inst.Status == "running" {
		writeError(w, http.StatusConflict, fmt.Errorf("stop the instance before deleting"))
		return
	}

	if err := h.svc.Delete(r.Context(), id); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
