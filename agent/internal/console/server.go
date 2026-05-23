package console

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/websocket"
	"github.com/rigstack/agent/internal/libvirt"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type Server struct {
	lv     *libvirt.Manager
	logger *slog.Logger
}

func NewServer(lv *libvirt.Manager, logger *slog.Logger) *Server {
	return &Server{lv: lv, logger: logger}
}

func (s *Server) Start(addr string) error {
	mux := http.NewServeMux()
	mux.HandleFunc("/console", s.handleConsole)
	mux.HandleFunc("/metrics", s.handleMetrics)
	s.logger.Info("console/metrics HTTP server listening", "addr", addr)
	return http.ListenAndServe(addr, mux)
}

// handleConsole faz upgrade para WebSocket e faz proxy bidirecional com o PTY serial da VM.
func (s *Server) handleConsole(w http.ResponseWriter, r *http.Request) {
	vmName := r.URL.Query().Get("vm")
	if vmName == "" {
		http.Error(w, "vm param required", http.StatusBadRequest)
		return
	}

	ptyPath, err := s.lv.GetConsolePTY(vmName)
	if err != nil {
		http.Error(w, fmt.Sprintf("get console pty: %v", err), http.StatusInternalServerError)
		return
	}

	pty, err := os.OpenFile(ptyPath, os.O_RDWR, 0)
	if err != nil {
		http.Error(w, fmt.Sprintf("open pty %s: %v", ptyPath, err), http.StatusInternalServerError)
		return
	}
	defer pty.Close()

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		s.logger.Error("websocket upgrade failed", "err", err)
		return
	}
	defer ws.Close()

	s.logger.Info("console session started", "vm", vmName, "pty", ptyPath)

	errc := make(chan error, 2)

	// PTY → WebSocket
	go func() {
		buf := make([]byte, 4096)
		for {
			n, err := pty.Read(buf)
			if err != nil {
				errc <- err
				return
			}
			if err := ws.WriteMessage(websocket.BinaryMessage, buf[:n]); err != nil {
				errc <- err
				return
			}
		}
	}()

	// WebSocket → PTY
	go func() {
		for {
			_, msg, err := ws.ReadMessage()
			if err != nil {
				errc <- err
				return
			}
			if _, err := pty.Write(msg); err != nil {
				errc <- err
				return
			}
		}
	}()

	<-errc
	s.logger.Info("console session ended", "vm", vmName)
}

type metricsResponse struct {
	CPUPct float64 `json:"cpu_pct"`
	RAMMB  int     `json:"ram_mb"`
	Time   string  `json:"time"`
}

func (s *Server) handleMetrics(w http.ResponseWriter, r *http.Request) {
	vmName := r.URL.Query().Get("vm")
	if vmName == "" {
		http.Error(w, "vm param required", http.StatusBadRequest)
		return
	}

	stats, err := s.lv.GetVMStats(vmName)
	if err != nil {
		http.Error(w, fmt.Sprintf("get vm stats: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(metricsResponse{
		CPUPct: stats.CPUPct,
		RAMMB:  stats.RAMMB,
		Time:   time.Now().UTC().Format(time.RFC3339),
	})
}
