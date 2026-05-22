# RigStack

> Build your own cloud. RigStack is an open source private cloud platform for homelabs and self-hosters — inspired by AWS and Oracle Cloud, running on your own hardware.

---

## Quick Start

**1. Start the controller (any machine with Docker):**
```bash
git clone https://github.com/missa-thecreator/rigstack.git
cd rigstack
docker compose up -d
```

**2. Add a node (each bare-metal hypervisor — no Go required):**
```bash
# Prerequisites on the node
sudo apt install -y libvirt-daemon-system qemu-kvm genisoimage qemu-utils
sudo systemctl enable --now libvirtd

# Bootstrap the agent — single command
curl -fsSL http://CONTROLLER_IP:8080/agent/install.sh | sudo sh -
```

With a custom name and region:
```bash
curl -fsSL "http://CONTROLLER_IP:8080/agent/install.sh?name=node-01&region=home-1" | sudo sh -
```

The controller serves the agent binary automatically — no Go, source code, or manual file copying needed on the node.

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
│ node-1 │   │ node-2 │     one per physical server
└────────┘   └────────┘
 libvirt      libvirt
 KVM/QEMU    KVM/QEMU
```

**Controller** — runs in Docker, manages global state:
- REST API consumed by the frontend (`/api/v1/*`)
- gRPC server that communicates with agents
- Scheduler picks which node runs each VM (least-loaded by free RAM)
- Dispatcher queues commands and delivers them on the next agent heartbeat

**Agent** — runs as a `systemd` service on each bare-metal hypervisor:
- Registers the node with the controller via gRPC
- Sends a heartbeat every 10s with CPU/RAM/disk stats
- Receives commands (`create_vm`, `create_vpc`, etc.) and executes them
- Creates VMs via libvirt/KVM, configures networking via Linux bridges + iptables
- Reports status back to the controller (`running`, `stopped`, `error`)

**Why doesn't the agent run in Docker?**  
It needs direct kernel access: `/dev/kvm`, the libvirtd socket, `ip netns`, `iptables`, and filesystem operations under `/var/lib/rigstack/`. Running it in Docker with `--privileged` removes all isolation without any real benefit — systemd is the right place for it.

---

## Features

| Feature | Status | Powered By |
|---|---|---|
| Virtual Machines | In development | libvirt / QEMU-KVM |
| VPC / Virtual Network | In development | Linux bridge + iptables NAT |
| NAT Gateway per VPC | In development | Linux network namespace |
| Dashboard UI | Working | React + Tailwind |
| REST API | Working | Go `net/http` |
| Agent gRPC | Working | Bidirectional gRPC stream |
| Object Storage | Planned | MinIO |
| Managed Kubernetes | Planned | k3s |
| Managed Databases | Planned | PostgreSQL, MySQL, Redis |
| Load Balancer | Planned | HAProxy / Nginx |
| IAM | Planned | JWT |

---

## Tech Stack

**Frontend**
- React 18 + TypeScript + Vite + Tailwind CSS
- React Router + Lucide React

**Backend**
- Go 1.23 — modules: `controller`, `agent`, `proto`
- gRPC (Protocol Buffers) — controller ↔ agent communication
- PostgreSQL — controller state (nodes, VPCs, instances)
- libvirt / QEMU-KVM — VM management on nodes
- cloud-init — initial VM provisioning (SSH key, static IP)
- qcow2 + backing files — VM disks (copy-on-write)
- Linux bridges + iptables — VPC networking

---

## Requirements

### Controller
- Docker + Docker Compose
- 1 CPU, 512 MB RAM minimum
- Network access to hypervisors on port 9090 (gRPC)

### Agent (each hypervisor)
- Any Linux distro with libvirt/KVM — tested on Ubuntu 22.04+, Debian 12+
- KVM enabled: `egrep -c '(vmx|svm)' /proc/cpuinfo` must return > 0
- Minimum: 8 GB RAM, 4 CPUs, 100 GB disk

**Ubuntu 22.04 / 24.04:**
```bash
apt install libvirt-daemon-system qemu-kvm genisoimage qemu-utils
```

**Debian 12 / 13:**
```bash
apt install libvirt-daemon-system qemu-kvm genisoimage qemu-utils cloud-utils
```

> **Testing with nested virtualization?**  
> You can run the agent inside a VM — useful for testing before using real hardware.  
> Enable nested virtualization on your hypervisor:
> - **VMware Workstation/Player** → Settings → Processors → *Virtualize Intel VT-x/EPT*
> - **VirtualBox** → `VBoxManage modifyvm "vm-name" --nested-hw-virt on`
> - **Hyper-V** → `Set-VMProcessor -VMName "vm-name" -ExposeVirtualizationExtensions $true`
> - **Proxmox** → set CPU type to `host` on the VM
>
> Minimum specs for the test VM: 4 vCPUs, 4 GB RAM, 40 GB disk.  
> Verify before installing: `kvm-ok` (from the `cpu-checker` package).

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/missa-thecreator/rigstack.git
cd rigstack
```

### 2. Start the Controller

```bash
docker compose up -d
```

The controller starts on:
- `http://localhost:8080` — REST API + frontend
- `localhost:9090` — gRPC (for agents)

Verify:
```bash
curl http://localhost:8080/api/v1/health
# {"status":"ok"}
```

### 3. Install the Agent on hypervisors

No Go or source code needed on the node. The controller serves the binary and install script automatically.

**a) Prerequisites on the node**
```bash
sudo apt update
sudo apt install -y libvirt-daemon-system qemu-kvm genisoimage qemu-utils
sudo systemctl enable --now libvirtd
```

**b) Install with a single command**

Replace `192.168.1.100` with your controller's IP:

```bash
curl -fsSL http://192.168.1.100:8080/agent/install.sh | sudo sh -
```

With a custom name and region:
```bash
curl -fsSL "http://192.168.1.100:8080/agent/install.sh?name=node-01&region=home-1" | sudo sh -
```

The script downloads the compiled binary from the controller, creates the systemd service, and starts the agent automatically.

**c) Verify**
```bash
systemctl status rigstack-agent
journalctl -u rigstack-agent -f
```

The node should appear at:
```bash
curl http://192.168.1.100:8080/api/v1/nodes
```

### 4. Prepare base images

Download cloud images and place them in `/var/lib/rigstack/base/` on each hypervisor:

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

### 5. Frontend (development)

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

---

## REST API

Base URL: `http://localhost:8080`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/nodes` | List registered nodes |
| GET | `/api/v1/vpcs` | List VPCs |
| POST | `/api/v1/vpcs` | Create VPC |
| DELETE | `/api/v1/vpcs/{id}` | Delete VPC |
| GET | `/api/v1/instances` | List instances |
| POST | `/api/v1/instances` | Create instance (VM) |
| PUT | `/api/v1/instances/{id}/start` | Start instance |
| PUT | `/api/v1/instances/{id}/stop` | Stop instance |
| DELETE | `/api/v1/instances/{id}` | Delete instance |

**Example — create VPC:**
```bash
curl -X POST http://localhost:8080/api/v1/vpcs \
  -H "Content-Type: application/json" \
  -d '{"name": "my-vpc", "cidr": "10.0.1.0/24"}'
```

**Example — create instance:**
```bash
curl -X POST http://localhost:8080/api/v1/instances \
  -H "Content-Type: application/json" \
  -d '{
    "name": "web-01",
    "vpc_id": "<VPC_ID>",
    "vcpus": 2,
    "ram_mb": 2048,
    "disk_gb": 20,
    "os_image": "ubuntu-24.04",
    "ssh_pubkey": "ssh-ed25519 AAAA..."
  }'
```

---

## Project Structure

```
RigStack/
├── frontend/              # React + Vite (dashboard)
├── controller/            # REST API + gRPC server (Go)
│   ├── cmd/               # main.go
│   ├── internal/
│   │   ├── api/           # HTTP handlers + router + middleware
│   │   ├── dispatcher/    # command queue: controller → agent
│   │   ├── grpcserver/    # gRPC server (heartbeat + commands)
│   │   ├── scheduler/     # node selection (least-loaded)
│   │   ├── service/       # business logic (VPC, instance, node)
│   │   └── store/         # PostgreSQL access
│   ├── migrations/        # SQL migrations
│   └── Dockerfile
├── agent/                 # Agent (Go) — runs bare-metal
│   ├── cmd/               # main.go
│   ├── internal/
│   │   ├── controller/    # gRPC client for the controller
│   │   ├── executor/      # executes received commands
│   │   ├── libvirt/       # VM management via libvirt/KVM
│   │   ├── network/       # Linux bridge + NAT Gateway (iptables)
│   │   └── storage/       # qcow2 disk provisioning
│   └── rigstack-agent.service  # systemd unit
├── proto/                 # Protobuf definitions (gRPC)
├── docker-compose.yml
├── Makefile
└── go.work                # Go workspace
```

---

## Development

```bash
# Build everything
make build

# Generate protobuf code (requires protoc)
make proto

# Start only the database
docker compose up postgres -d

# Run controller locally
DATABASE_URL=postgres://rigstack:rigstack@localhost:5432/rigstack \
  go run ./controller/cmd/...

# Run agent locally (no libvirt — test mode)
CONTROLLER_ADDR=localhost:9090 \
LIBVIRT_SOCKET="" \
  go run ./agent/cmd/...
```

---

## Roadmap

- [x] Dashboard UI (live demo + connected to real API)
- [x] REST API (Go) — nodes, VPCs, instances
- [x] gRPC controller ↔ agent (bidirectional heartbeat + commands)
- [x] VM provisioning (libvirt/KVM + cloud-init)
- [x] VPC networking (Linux bridge + NAT Gateway + iptables)
- [x] Least-loaded scheduler (automatic node selection)
- [x] Command dispatcher (per-node queue, delivered on heartbeat)
- [x] Agent bootstrap via curl (k3s-style install)
- [ ] Security groups (per-VM iptables rules)
- [ ] VM migration between nodes (rsync + qemu-img)
- [ ] Object Storage (MinIO)
- [ ] IAM with JWT
- [ ] Managed Kubernetes (k3s)
- [ ] CLI (`rigstack`)

---

## Contributing

1. Fork the repository
2. Create a branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m 'feat: add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

MIT — see the [LICENSE](LICENSE) file.

---

<p align="center">Built for the homelab and self-hosting community</p>
