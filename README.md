# ⚡ RigStack

> Build your own cloud. RigStack is an open source platform that brings together the best open source tools into a single private cloud experience — inspired by AWS and OpenStack, built for homelabs and self-hosters.

---

## 🌩️ What is RigStack?

RigStack is a private cloud management dashboard that lets you provision and manage your own infrastructure from a single interface — without depending on AWS, GCP, or Azure.

Think of it as your own cloud, running on your own hardware, with your own rules.

---

## ✨ Features

| Feature | Description | Powered By |
|---|---|---|
| 🖥️ **Instances** | Create and manage virtual machines | libvirt / QEMU-KVM |
| 📦 **Object Store** | S3-compatible object storage | MinIO |
| 💾 **Storage** | Block storage for instances | LVM / Ceph |
| ☸️ **Kubernetes Service** | Managed Kubernetes clusters (like EKS) | k3s / kubeadm |
| 🐳 **Container Service** | Run and manage containers (like ECS) | Podman / Docker |
| 🖼️ **Images** | VM images and container registry (like AMI + ECR) | libvirt + Harbor |
| 🗄️ **Databases** | Managed database instances (like RDS) | PostgreSQL, MySQL, Redis |
| 🌐 **Network** | Virtual networking and routing | libvirt networking |
| ⚖️ **Load Balancer** | Traffic distribution across instances | HAProxy / Nginx |
| 🔐 **IAM** | Access control and permissions | JWT + Keycloak |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│         RigStack Dashboard          │
│              (React)                │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│           RigStack API              │
│             (FastAPI)               │
└──┬──────┬──────┬──────┬──────┬──────┘
   │      │      │      │      │
   ▼      ▼      ▼      ▼      ▼
libvirt  MinIO  Harbor  k3s  HAProxy
 KVM    Object  Images  K8s   LB
```

---

## 🚀 Getting Started

> Documentation and installation guide coming soon.

### Requirements

- Ubuntu 24.04 LTS
- KVM/QEMU support (nested virtualization if running in a VM)
- Minimum 16GB RAM, 4 CPU cores, 100GB disk

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/rigstack.git
cd rigstack

# Run the setup script
./scripts/setup.sh

# Start RigStack
docker compose up -d
```

---

## 🛠️ Tech Stack

**Frontend**
- React
- TypeScript

**Backend**
- FastAPI (Python)
- PostgreSQL
- Redis + Celery (async task queue)

**Infrastructure**
- libvirt / QEMU-KVM
- MinIO
- Harbor
- k3s
- HAProxy

---

## 🗺️ Roadmap

- [ ] Instance management (create, start, stop, delete VMs)
- [ ] Object storage integration (MinIO)
- [ ] Container registry (Harbor)
- [ ] Kubernetes cluster provisioning (k3s)
- [ ] Container service (Podman)
- [ ] Database provisioning
- [ ] Load balancer management
- [ ] IAM and access control
- [ ] CLI (`rigstack` command)
- [ ] Multi-node support

---

## 🤝 Contributing

RigStack is open source and contributions are very welcome!

1. Fork the repository
2. Create a branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to your branch: `git push origin feature/my-feature`
5. Open a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 💬 Community

> Project just started! Community links coming soon.

---

<p align="center">Built with ❤️ for the homelab and self-hosting community</p>
