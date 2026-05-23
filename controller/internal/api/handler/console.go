package handler

import (
	"fmt"
	"io"
	"net/http"
	"net/url"

	"github.com/gorilla/websocket"
	"github.com/rigstack/controller/internal/service"
)

var wsUpgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type ConsoleHandler struct {
	svc *service.InstanceService
}

func NewConsoleHandler(svc *service.InstanceService) *ConsoleHandler {
	return &ConsoleHandler{svc: svc}
}

// Console faz upgrade WebSocket e proxeia para o servidor de console do agente.
func (h *ConsoleHandler) Console(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	vmName, agentAddr, err := h.svc.NodeAddressForInstance(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusNotFound, err)
		return
	}

	// Conecta ao WebSocket do agente
	agentURL := fmt.Sprintf("ws://%s/console?vm=%s", agentAddr, url.QueryEscape(vmName))
	agentConn, _, err := websocket.DefaultDialer.Dial(agentURL, nil)
	if err != nil {
		writeError(w, http.StatusBadGateway, fmt.Errorf("connect to agent console: %w", err))
		return
	}
	defer agentConn.Close()

	// Faz upgrade da conexão do browser
	browserConn, err := wsUpgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer browserConn.Close()

	errc := make(chan error, 2)

	go func() {
		for {
			mt, msg, err := agentConn.ReadMessage()
			if err != nil {
				errc <- err
				return
			}
			if err := browserConn.WriteMessage(mt, msg); err != nil {
				errc <- err
				return
			}
		}
	}()

	go func() {
		for {
			mt, msg, err := browserConn.ReadMessage()
			if err != nil {
				errc <- err
				return
			}
			if err := agentConn.WriteMessage(mt, msg); err != nil {
				errc <- err
				return
			}
		}
	}()

	<-errc
}

// Metrics proxeia GET /api/v1/instances/:id/metrics → agente HTTP /metrics?vm=name
func (h *ConsoleHandler) Metrics(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	vmName, agentAddr, err := h.svc.NodeAddressForInstance(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusNotFound, err)
		return
	}

	agentURL := fmt.Sprintf("http://%s/metrics?vm=%s", agentAddr, url.QueryEscape(vmName))
	resp, err := http.Get(agentURL) //nolint:noctx
	if err != nil {
		writeError(w, http.StatusBadGateway, fmt.Errorf("agent metrics: %w", err))
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body) //nolint:errcheck
}
