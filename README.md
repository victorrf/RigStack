# RigStack

> Build your own cloud. RigStack is an open source private cloud platform for homelabs and self-hosters — inspired by AWS and Oracle Cloud, running on your own hardware.

---

## Quick Start

**1. Suba o controller (qualquer máquina com Docker):**
```bash
git clone https://github.com/missa-thecreator/rigstack.git
cd rigstack
docker compose up -d
```

**2. Adicione um node (cada hypervisor bare-metal, sem Go necessário):**
```bash
# Pré-requisitos no node
sudo apt install -y libvirt-daemon-system qemu-kvm genisoimage qemu-utils
sudo systemctl enable --now libvirtd

# Instalar o agent — um único comando
curl -fsSL http://IP-DO-CONTROLLER:8080/agent/install.sh | sudo sh -
```

Com nome e região personalizados:
```bash
curl -fsSL "http://IP-DO-CONTROLLER:8080/agent/install.sh?name=node-01&region=home-1" | sudo sh -
```

O controller serve o binário do agent automaticamente — não é necessário Go, código-fonte ou cópia manual de arquivos no node.

---

## What is RigStack?

RigStack lets you provision and manage virtual machines, networks, and storage from a single dashboard — without depending on AWS, GCP, or Azure.

Think of it as your own cloud, running on your own hardware, with your own rules.

---

## Architecture

RigStack follows a **controller + agent** model similar to Kubernetes:

```
┌─────────────────────────────────┐
│         Browser / Frontend      │
│      React + TypeScript + Vite  │
└────────────────┬────────────────┘
                 │ HTTP REST  :8080
┌────────────────▼────────────────┐
│         RigStack Controller     │  ← Docker container
│         Go · REST + gRPC        │
│         PostgreSQL (state)      │
└──────────┬──────────────────────┘
           │ gRPC (bidirectional stream)  :9090
    ┌──────┴──────┐
    ▼             ▼
┌────────┐   ┌────────┐
│ Agent  │   │ Agent  │   ← bare-metal / systemd
│ node-1 │   │ node-2 │     cada servidor físico
└────────┘   └────────┘
 libvirt      libvirt
 KVM/QEMU    KVM/QEMU
```

**Controller** — roda em Docker, gerencia o estado global:
- REST API consumida pelo frontend (`/api/v1/*`)
- Servidor gRPC que se comunica com os agents
- Scheduler escolhe qual node executa cada VM (least-loaded por RAM)
- Dispatcher enfileira comandos e os entrega no próximo heartbeat do agent

**Agent** — roda como `systemd` service em cada hypervisor bare-metal:
- Registra o node no controller via gRPC
- Envia heartbeat a cada 10s com stats de CPU/RAM/disco
- Recebe comandos (`create_vm`, `create_vpc`, etc.) e os executa
- Cria VMs via libvirt/KVM, configura redes via Linux bridges + iptables
- Reporta status de volta ao controller (`running`, `stopped`, `error`)

**Por que o agent não roda em Docker?**  
Ele precisa de acesso direto ao kernel: `/dev/kvm`, socket do libvirtd, `ip netns`, `iptables` e operações de filesystem em `/var/lib/rigstack/`. Rodar em Docker com `--privileged` remove todo o isolamento sem ganho real — `systemd` é o lugar certo.

---

## Features

| Feature | Status | Powered By |
|---|---|---|
| Instâncias (VMs) | Em desenvolvimento | libvirt / QEMU-KVM |
| VPC / Rede virtual | Em desenvolvimento | Linux bridge + iptables NAT |
| NAT Gateway por VPC | Em desenvolvimento | Linux network namespace |
| Dashboard UI | Funcional (live demo) | React + Tailwind |
| REST API | Funcional | Go `net/http` |
| Agent gRPC | Funcional | gRPC bidirecional |
| Object Storage | Planejado | MinIO |
| Kubernetes gerenciado | Planejado | k3s |
| Databases gerenciados | Planejado | PostgreSQL, MySQL, Redis |
| Load Balancer | Planejado | HAProxy / Nginx |
| IAM | Planejado | JWT |

---

## Tech Stack

**Frontend**
- React 18 + TypeScript + Vite + Tailwind CSS
- React Router + Lucide React

**Backend**
- Go 1.23 — módulos: `controller`, `agent`, `proto`
- gRPC (Protocol Buffers) — comunicação controller ↔ agent
- PostgreSQL — estado do controller (nodes, VPCs, instances)
- libvirt / QEMU-KVM — gerenciamento de VMs nos nodes
- cloud-init — provisionamento inicial das VMs (SSH key, IP estático)
- qcow2 + backing files — discos das VMs (copy-on-write)
- Linux bridges + iptables — networking das VPCs

---

## Requisitos

### Controller (servidor de controle)
- Docker + Docker Compose
- 1 CPU, 512 MB RAM mínimo
- Acesso de rede para os hypervisores na porta 9090 (gRPC)

### Agent (cada hypervisor)
- Qualquer distro Linux com libvirt/KVM — testado em Ubuntu 22.04+, Debian 12+
- KVM habilitado: `egrep -c '(vmx|svm)' /proc/cpuinfo` deve retornar > 0
- Mínimo 8 GB RAM, 4 CPUs, 100 GB disco

**Ubuntu 22.04 / 24.04:**
```bash
apt install libvirt-daemon-system qemu-kvm genisoimage qemu-utils
```

**Debian 12 / 13:**
```bash
apt install libvirt-daemon-system qemu-kvm genisoimage qemu-utils cloud-utils
```

> **Testando em VM (nested virtualization)?**  
> É possível rodar o agent dentro de uma VM — útil para testes antes de usar hardware real.  
> Você precisa habilitar nested virtualization no seu hypervisor:
> - **VMware Workstation/Player** → Settings → Processors → *Virtualize Intel VT-x/EPT*
> - **VirtualBox** → `VBoxManage modifyvm "nome-vm" --nested-hw-virt on`
> - **Hyper-V** → `Set-VMProcessor -VMName "nome-vm" -ExposeVirtualizationExtensions $true`
>
> Specs mínimas para a VM de teste: 4 vCPUs, 4 GB RAM, 40 GB disco.  
> Verifique antes de instalar: `kvm-ok` (pacote `cpu-checker`).

---

## Instalação

### 1. Clonar o repositório

```bash
git clone https://github.com/missa-thecreator/rigstack.git
cd rigstack
```

### 2. Subir o Controller + Banco de dados

```bash
docker compose up -d
```

O controller sobe em:
- `http://localhost:8080` — REST API
- `localhost:9090` — gRPC (para os agents)

Verificar saúde:
```bash
curl http://localhost:8080/api/v1/health
# {"status":"ok"}
```

### 3. Instalar o Agent nos hypervisores

Não é necessário Go nem código-fonte no node. O controller serve o binário e o script de instalação automaticamente.

**a) Pré-requisitos no node**
```bash
sudo apt update
sudo apt install -y libvirt-daemon-system qemu-kvm genisoimage qemu-utils
sudo systemctl enable --now libvirtd
```

**b) Instalar com um único comando**

Substitua `192.168.1.100` pelo IP da sua máquina onde o controller está rodando:

```bash
curl -fsSL http://192.168.1.100:8080/agent/install.sh | sudo sh -
```

Com nome e região personalizados:
```bash
curl -fsSL "http://192.168.1.100:8080/agent/install.sh?name=node-01&region=home-1" | sudo sh -
```

O script baixa o binário compilado do próprio controller, cria o serviço systemd e inicia o agent automaticamente.

**c) Verificar**
```bash
systemctl status rigstack-agent
journalctl -u rigstack-agent -f
```

O node deve aparecer em:
```bash
curl http://192.168.1.100:8080/api/v1/nodes
```

### 4. Preparar imagens base

Baixe imagens cloud e coloque em `/var/lib/rigstack/base/` em cada hypervisor:

```bash
sudo mkdir -p /var/lib/rigstack/base

# Ubuntu 24.04
wget https://cloud-images.ubuntu.com/noble/current/noble-server-cloudimg-amd64.img \
  -O /var/lib/rigstack/base/ubuntu-24.04.qcow2

# Debian 13 (Trixie)
wget https://cloud.debian.org/images/cloud/trixie/latest/debian-13-genericcloud-amd64.qcow2 \
  -O /var/lib/rigstack/base/debian-13.qcow2

# Debian 12 (Bookworm)
wget https://cloud.debian.org/images/cloud/bookworm/latest/debian-12-genericcloud-amd64.qcow2 \
  -O /var/lib/rigstack/base/debian-12.qcow2
```

### 5. Frontend em desenvolvimento

```bash
cd frontend
npm install
npm run dev
# Acesse http://localhost:5173
```

---

## API REST

Base URL: `http://localhost:8080`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/health` | Healthcheck |
| GET | `/api/v1/nodes` | Lista nodes registrados |
| GET | `/api/v1/vpcs` | Lista VPCs |
| POST | `/api/v1/vpcs` | Cria VPC |
| DELETE | `/api/v1/vpcs/{id}` | Remove VPC |
| GET | `/api/v1/instances` | Lista instâncias |
| POST | `/api/v1/instances` | Cria instância (VM) |
| PUT | `/api/v1/instances/{id}/start` | Inicia instância |
| PUT | `/api/v1/instances/{id}/stop` | Para instância |
| DELETE | `/api/v1/instances/{id}` | Remove instância |

**Exemplo — criar VPC:**
```bash
curl -X POST http://localhost:8080/api/v1/vpcs \
  -H "Content-Type: application/json" \
  -d '{"name": "minha-vpc", "cidr": "10.0.1.0/24"}'
```

**Exemplo — criar instância:**
```bash
curl -X POST http://localhost:8080/api/v1/instances \
  -H "Content-Type: application/json" \
  -d '{
    "name": "web-01",
    "vpc_id": "<ID_DA_VPC>",
    "vcpus": 2,
    "ram_mb": 2048,
    "disk_gb": 20,
    "os_image": "ubuntu-24.04",
    "ssh_pubkey": "ssh-ed25519 AAAA..."
  }'
```

---

## Estrutura do Projeto

```
RigStack/
├── frontend/              # React + Vite (dashboard)
├── controller/            # API REST + gRPC server (Go)
│   ├── cmd/               # main.go
│   ├── internal/
│   │   ├── api/           # handlers HTTP + router + middleware
│   │   ├── dispatcher/    # fila de comandos controller → agent
│   │   ├── grpcserver/    # servidor gRPC (heartbeat + comandos)
│   │   ├── scheduler/     # seleção de node (least-loaded)
│   │   ├── service/       # lógica de negócio (VPC, instância, node)
│   │   └── store/         # acesso ao PostgreSQL
│   ├── migrations/        # SQL migrations
│   └── Dockerfile
├── agent/                 # Agent (Go) — roda bare-metal
│   ├── cmd/               # main.go
│   ├── internal/
│   │   ├── controller/    # cliente gRPC para o controller
│   │   ├── executor/      # executa comandos recebidos
│   │   ├── libvirt/       # gerencia VMs via libvirt/KVM
│   │   ├── network/       # bridge Linux + NAT Gateway (iptables)
│   │   └── storage/       # provisionamento de discos qcow2
│   ├── rigstack-agent.service  # systemd unit
│   └── install.sh         # script de instalação
├── proto/                 # Protobuf definitions (gRPC)
├── docker-compose.yml
├── Makefile
└── go.work                # Go workspace
```

---

## Desenvolvimento

```bash
# Compilar tudo
make build

# Gerar código protobuf (requer protoc)
make proto

# Subir banco para desenvolvimento
docker compose up postgres -d

# Rodar controller local
DATABASE_URL=postgres://rigstack:rigstack@localhost:5432/rigstack \
  go run ./controller/cmd/...

# Rodar agent local (sem libvirt — modo de teste)
CONTROLLER_ADDR=localhost:9090 \
LIBVIRT_SOCKET="" \
  go run ./agent/cmd/...
```

---

## Roadmap

- [x] Dashboard UI (live demo estilo Oracle Cloud)
- [x] REST API (Go) — nodes, VPCs, instâncias
- [x] gRPC controller ↔ agent (heartbeat bidirecional + comandos)
- [x] Provisionamento de VMs (libvirt/KVM + cloud-init)
- [x] Networking de VPCs (bridge Linux + NAT Gateway + iptables)
- [x] Scheduler least-loaded (escolha automática de node)
- [x] Dispatcher de comandos (fila por node, entregue no heartbeat)
- [ ] Integração frontend com API real (substituir mock data)
- [ ] Security groups (regras iptables por VM)
- [ ] Migração de VMs entre nodes (rsync + qemu-img)
- [ ] Object Storage (MinIO)
- [ ] IAM com JWT
- [ ] Kubernetes gerenciado (k3s)
- [ ] CLI (`rigstack`)

---

## Contribuindo

1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/minha-feature`
3. Commit: `git commit -m 'feat: adicionar minha feature'`
4. Push: `git push origin feature/minha-feature`
5. Abra um Pull Request

---

## Licença

MIT — veja o arquivo [LICENSE](LICENSE).

---

<p align="center">Feito para a comunidade homelab e self-hosting</p>
