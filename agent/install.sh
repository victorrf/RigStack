#!/bin/bash
# Instala o rigstack-agent como serviço systemd.
# Uso: sudo ./install.sh [CONTROLLER_ADDR]
# Exemplo: sudo ./install.sh controller.example.com:9090

set -e

BINARY_PATH="/usr/local/bin/rigstack-agent"
SERVICE_PATH="/etc/systemd/system/rigstack-agent.service"
CONTROLLER_ADDR="${1:-controller.example.com:9090}"

if [ "$EUID" -ne 0 ]; then
  echo "Run as root: sudo $0 [CONTROLLER_ADDR]"
  exit 1
fi

# Copia o binário compilado
if [ ! -f "./rigstack-agent" ]; then
  echo "Binário ./rigstack-agent não encontrado. Compile primeiro:"
  echo "  go build -o rigstack-agent ./cmd/..."
  exit 1
fi

install -m 755 ./rigstack-agent "$BINARY_PATH"
echo "Binário instalado em $BINARY_PATH"

# Cria /var/lib/rigstack/base para as imagens base
mkdir -p /var/lib/rigstack/base /var/lib/rigstack/images

# Instala o service file com o CONTROLLER_ADDR correto
sed "s|controller.example.com:9090|${CONTROLLER_ADDR}|g" \
  ./rigstack-agent.service > "$SERVICE_PATH"

echo "Service instalado em $SERVICE_PATH"
echo ""
echo "Edite $SERVICE_PATH para ajustar NODE_NAME, NODE_REGION e NODE_ADDR."
echo ""

systemctl daemon-reload
systemctl enable rigstack-agent
systemctl start rigstack-agent

echo "rigstack-agent iniciado. Status:"
systemctl status rigstack-agent --no-pager
