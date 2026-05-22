package handler

import (
	"net/http"

	"github.com/rigstack/controller/internal/service"
)

type ImageHandler struct {
	svc *service.ImageService
}

func NewImageHandler(svc *service.ImageService) *ImageHandler {
	return &ImageHandler{svc: svc}
}

func (h *ImageHandler) List(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, h.svc.List())
}

func (h *ImageHandler) Deploy(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	nodes, err := h.svc.Deploy(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"queued": true, "nodes": nodes})
}
