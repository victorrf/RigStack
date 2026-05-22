import type {
  Instance, Bucket, Container, K8sCluster,
  Database, LoadBalancer, NetworkVPC, Image, IAMUser, Activity, ContainerRepo
} from '../types'

export const instances: Instance[] = [
  { id: '1', name: 'web-01', status: 'running', vcpus: 2, ram: '4 GB', disk: '40 GB', ip: '192.168.1.10', os: 'Ubuntu 24.04', createdAt: '2026-04-10' },
  { id: '2', name: 'web-02', status: 'running', vcpus: 2, ram: '4 GB', disk: '40 GB', ip: '192.168.1.11', os: 'Ubuntu 24.04', createdAt: '2026-04-10' },
  { id: '3', name: 'db-primary', status: 'running', vcpus: 4, ram: '8 GB', disk: '100 GB', ip: '192.168.1.20', os: 'Debian 12', createdAt: '2026-03-15' },
  { id: '4', name: 'worker-01', status: 'running', vcpus: 2, ram: '2 GB', disk: '20 GB', ip: '192.168.1.30', os: 'Rocky Linux 9', createdAt: '2026-04-20' },
  { id: '5', name: 'staging-01', status: 'stopped', vcpus: 2, ram: '4 GB', disk: '40 GB', ip: '—', os: 'Ubuntu 24.04', createdAt: '2026-05-01' },
  { id: '6', name: 'test-env', status: 'stopped', vcpus: 1, ram: '1 GB', disk: '10 GB', ip: '—', os: 'Debian 12', createdAt: '2026-05-10' },
]

export const buckets: Bucket[] = [
  { id: '1', name: 'backups', size: '48 GB', objects: 1240, region: 'local-1', access: 'private', createdAt: '2026-03-01' },
  { id: '2', name: 'media-assets', size: '72 GB', objects: 8430, region: 'local-1', access: 'public', createdAt: '2026-03-20' },
  { id: '3', name: 'logs-archive', size: '8 GB', objects: 320, region: 'local-1', access: 'private', createdAt: '2026-04-05' },
]

export const containers: Container[] = [
  { id: '1', name: 'nginx-proxy', image: 'nginx:1.25', status: 'running', ports: '80, 443', cpu: '0.2%', memory: '32 MB', uptime: '15d' },
  { id: '2', name: 'app-api', image: 'myapp/api:v2.1', status: 'running', ports: '8000', cpu: '1.4%', memory: '128 MB', uptime: '15d' },
  { id: '3', name: 'app-worker', image: 'myapp/worker:v2.1', status: 'running', ports: '—', cpu: '0.8%', memory: '96 MB', uptime: '15d' },
  { id: '4', name: 'redis-cache', image: 'redis:7.2', status: 'running', ports: '6379', cpu: '0.1%', memory: '16 MB', uptime: '30d' },
  { id: '5', name: 'postgres-dev', image: 'postgres:16', status: 'running', ports: '5432', cpu: '0.3%', memory: '64 MB', uptime: '7d' },
  { id: '6', name: 'mailhog', image: 'mailhog/mailhog', status: 'stopped', ports: '1025, 8025', cpu: '—', memory: '—', uptime: '—' },
]

export const k8sClusters: K8sCluster[] = [
  { id: '1', name: 'prod-cluster', status: 'running', version: 'v1.29.2', nodes: 5, pods: 42, region: 'local-1', createdAt: '2026-02-10' },
  { id: '2', name: 'staging-cluster', status: 'running', version: 'v1.29.2', nodes: 3, pods: 18, region: 'local-1', createdAt: '2026-03-05' },
]

export const databases: Database[] = [
  { id: '1', name: 'postgres-prod', engine: 'PostgreSQL', version: '16.2', status: 'running', storage: '50 GB', connections: 24, host: '192.168.1.50' },
  { id: '2', name: 'postgres-staging', engine: 'PostgreSQL', version: '16.2', status: 'running', storage: '20 GB', connections: 5, host: '192.168.1.51' },
  { id: '3', name: 'mysql-legacy', engine: 'MySQL', version: '8.0', status: 'running', storage: '30 GB', connections: 8, host: '192.168.1.52' },
  { id: '4', name: 'redis-sessions', engine: 'Redis', version: '7.2', status: 'running', storage: '2 GB', connections: 120, host: '192.168.1.53' },
  { id: '5', name: 'redis-cache', engine: 'Redis', version: '7.2', status: 'stopped', storage: '1 GB', connections: 0, host: '192.168.1.54' },
]

export const loadBalancers: LoadBalancer[] = [
  { id: '1', name: 'lb-web', type: 'HTTPS', status: 'running', targets: 2, ip: '192.168.1.100', requests: '12.4k/min' },
  { id: '2', name: 'lb-api', type: 'HTTP', status: 'running', targets: 3, ip: '192.168.1.101', requests: '3.8k/min' },
  { id: '3', name: 'lb-internal', type: 'TCP', status: 'running', targets: 4, ip: '192.168.1.102', requests: '8.1k/min' },
]

export const vpcs: NetworkVPC[] = [
  { id: '1', name: 'vpc-main', cidr: '192.168.0.0/16', subnets: 4, instances: 8, status: 'active' },
  { id: '2', name: 'vpc-staging', cidr: '10.0.0.0/24', subnets: 2, instances: 2, status: 'active' },
]

export const images: Image[] = [
  { id: '1', name: 'ubuntu-24.04-lts', type: 'VM', os: 'Ubuntu', size: '2.1 GB', status: 'available', createdAt: '2026-01-10' },
  { id: '2', name: 'debian-12', type: 'VM', os: 'Debian', size: '1.4 GB', status: 'available', createdAt: '2026-01-10' },
  { id: '3', name: 'rocky-linux-9', type: 'VM', os: 'Rocky Linux', size: '1.8 GB', status: 'available', createdAt: '2026-02-01' },
  { id: '4', name: 'myapp/api', type: 'Container', size: '340 MB', status: 'available', createdAt: '2026-05-18' },
  { id: '5', name: 'myapp/worker', type: 'Container', size: '320 MB', status: 'available', createdAt: '2026-05-18' },
]

export const iamUsers: IAMUser[] = [
  { id: '1', name: 'Missael', email: 'missael@rigstack.local', role: 'admin', status: 'active', lastAccess: 'Agora' },
  { id: '2', name: 'Ana Silva', email: 'ana@rigstack.local', role: 'developer', status: 'active', lastAccess: '2h atrás' },
  { id: '3', name: 'Carlos Lima', email: 'carlos@rigstack.local', role: 'developer', status: 'active', lastAccess: '1d atrás' },
  { id: '4', name: 'Bot CI/CD', email: 'ci@rigstack.local', role: 'developer', status: 'active', lastAccess: '5min atrás' },
  { id: '5', name: 'João Costa', email: 'joao@rigstack.local', role: 'viewer', status: 'inactive', lastAccess: '30d atrás' },
]

export const recentActivity: Activity[] = [
  { id: '1', message: 'VM "web-01" iniciada com sucesso', type: 'success', time: 'há 5 min' },
  { id: '2', message: 'Bucket "backups" criado', type: 'success', time: 'há 22 min' },
  { id: '3', message: 'DB "postgres-prod" reiniciado', type: 'info', time: 'há 1h' },
  { id: '4', message: 'Container "app-api" atualizado para v2.1', type: 'success', time: 'há 3h' },
  { id: '5', message: 'Falha ao criar VM "gpu-01" — recursos insuficientes', type: 'error', time: 'há 5h' },
  { id: '6', message: 'Cluster "prod-cluster" escalado para 5 nodes', type: 'success', time: 'há 1d' },
]

export const resourceUsage = {
  cpu: 42,
  ram: 61,
  storage: 35,
  network: 18,
}

export const containerRepos: ContainerRepo[] = [
  {
    id: '1',
    namespace: 'myapp',
    name: 'api',
    fullName: 'myapp/api',
    imageCount: 3,
    totalSize: '1.0 GB',
    lastPushed: '2026-05-18',
    isPublic: false,
    tags: [
      { tag: 'v2.1',   size: '340 MB', pushed: '2026-05-18', digest: 'sha256:a1b2c3d4e5f6' },
      { tag: 'v2.0',   size: '335 MB', pushed: '2026-05-01', digest: 'sha256:e5f6g7h8i9j0' },
      { tag: 'latest', size: '340 MB', pushed: '2026-05-18', digest: 'sha256:a1b2c3d4e5f6' },
    ],
  },
  {
    id: '2',
    namespace: 'myapp',
    name: 'worker',
    fullName: 'myapp/worker',
    imageCount: 2,
    totalSize: '640 MB',
    lastPushed: '2026-05-18',
    isPublic: false,
    tags: [
      { tag: 'v2.1',   size: '320 MB', pushed: '2026-05-18', digest: 'sha256:i9j0k1l2m3n4' },
      { tag: 'latest', size: '320 MB', pushed: '2026-05-18', digest: 'sha256:i9j0k1l2m3n4' },
    ],
  },
  {
    id: '3',
    namespace: 'infra',
    name: 'nginx-custom',
    fullName: 'infra/nginx-custom',
    imageCount: 1,
    totalSize: '45 MB',
    lastPushed: '2026-04-10',
    isPublic: false,
    tags: [
      { tag: '1.25-custom', size: '45 MB', pushed: '2026-04-10', digest: 'sha256:m3n4o5p6q7r8' },
    ],
  },
]
