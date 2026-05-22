package handler

import (
	"fmt"
	"net/http"
	"os"
	"strings"
)

type AgentHandler struct {
	binaryPath string
}

func NewAgentHandler() *AgentHandler {
	// Em produção (Docker): /app/rigstack-agent
	// Em desenvolvimento local: bin/rigstack-agent no workspace
	for _, p := range []string{"/app/rigstack-agent", "bin/rigstack-agent"} {
		if _, err := os.Stat(p); err == nil {
			return &AgentHandler{binaryPath: p}
		}
	}
	return &AgentHandler{binaryPath: "/app/rigstack-agent"}
}

// InstallScript gera e serve o script de instalação do agent.
// O script detecta o endereço do controller a partir da URL usada para baixá-lo.
//
// Uso no node:
//
//	curl -fsSL http://CONTROLLER:8080/agent/install.sh | sudo sh -
//
// Com NODE_NAME e NODE_REGION customizados:
//
//	curl -fsSL "http://CONTROLLER:8080/agent/install.sh?name=node-01&region=home-1" | sudo sh -
func (h *AgentHandler) InstallScript(w http.ResponseWriter, r *http.Request) {
	// Deriva o host do controller a partir da request (funciona atrás de proxy também)
	host := r.Host
	if fwd := r.Header.Get("X-Forwarded-Host"); fwd != "" {
		host = fwd
	}

	scheme := "http"
	if r.TLS != nil || r.Header.Get("X-Forwarded-Proto") == "https" {
		scheme = "https"
	}

	controllerHost := strings.Split(host, ":")[0]
	grpcAddr := fmt.Sprintf("%s:9090", controllerHost)
	binaryURL := fmt.Sprintf("%s://%s/agent/binary", scheme, host)

	nodeName := r.URL.Query().Get("name")
	if nodeName == "" {
		nodeName = "$(hostname)"
	}
	nodeRegion := r.URL.Query().Get("region")
	if nodeRegion == "" {
		nodeRegion = "local-1"
	}

	script := fmt.Sprintf(`#!/bin/sh
set -e

CONTROLLER_GRPC="%s"
BINARY_URL="%s"
NODE_NAME="%s"
NODE_REGION="%s"

echo "[RigStack] Baixando binário do agent..."
curl -f --progress-bar "$BINARY_URL" -o /usr/local/bin/rigstack-agent
chmod +x /usr/local/bin/rigstack-agent

echo "[RigStack] Criando diretórios..."
mkdir -p /var/lib/rigstack/base /var/lib/rigstack/images

echo "[RigStack] Instalando serviço systemd..."
cat > /etc/systemd/system/rigstack-agent.service << SVCEOF
[Unit]
Description=RigStack Agent
After=network-online.target libvirtd.service
Wants=network-online.target
Requires=libvirtd.service

[Service]
Type=simple
ExecStart=/usr/local/bin/rigstack-agent
Environment=CONTROLLER_ADDR=$CONTROLLER_GRPC
Environment=NODE_NAME=$NODE_NAME
Environment=NODE_REGION=$NODE_REGION
Environment=NODE_ADDR=$(hostname -I | awk '{print $1}'):9091
Environment=LIBVIRT_SOCKET=/var/run/libvirt/libvirt-sock
Restart=always
RestartSec=5
User=root
StandardOutput=journal
StandardError=journal
SyslogIdentifier=rigstack-agent
SVCEOF

systemctl daemon-reload
systemctl enable rigstack-agent
systemctl start --no-block rigstack-agent

echo ""
echo "[RigStack] Agent instalado!"
echo "  Controller: $CONTROLLER_GRPC"
echo "  Node:       $NODE_NAME ($NODE_REGION)"
echo ""
echo "  Status: systemctl status rigstack-agent"
echo "  Logs:   journalctl -u rigstack-agent -f"
`, grpcAddr, binaryURL, nodeName, nodeRegion)

	w.Header().Set("Content-Type", "text/x-shellscript")
	w.Write([]byte(script))
}

// Binary serve o binário compilado do agent para download.
func (h *AgentHandler) Binary(w http.ResponseWriter, r *http.Request) {
	if _, err := os.Stat(h.binaryPath); os.IsNotExist(err) {
		writeError(w, http.StatusNotFound, fmt.Errorf("agent binary not available"))
		return
	}
	w.Header().Set("Content-Type", "application/octet-stream")
	w.Header().Set("Content-Disposition", `attachment; filename="rigstack-agent"`)
	http.ServeFile(w, r, h.binaryPath)
}
