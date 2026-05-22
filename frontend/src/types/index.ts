export type Status = 'running' | 'stopped' | 'pending' | 'error'

export interface Instance {
  id: string
  name: string
  status: Status
  vcpus: number
  ram: string
  disk: string
  ip: string
  os: string
  createdAt: string
}

export interface Bucket {
  id: string
  name: string
  size: string
  objects: number
  region: string
  access: 'public' | 'private'
  createdAt: string
}

export interface Container {
  id: string
  name: string
  image: string
  status: Status
  ports: string
  cpu: string
  memory: string
  uptime: string
}

export interface K8sCluster {
  id: string
  name: string
  status: Status
  version: string
  nodes: number
  pods: number
  region: string
  createdAt: string
}

export interface Database {
  id: string
  name: string
  engine: 'PostgreSQL' | 'MySQL' | 'Redis'
  version: string
  status: Status
  storage: string
  connections: number
  host: string
}

export interface LoadBalancer {
  id: string
  name: string
  type: 'HTTP' | 'HTTPS' | 'TCP'
  status: Status
  targets: number
  ip: string
  requests: string
}

export interface NetworkVPC {
  id: string
  name: string
  cidr: string
  subnets: number
  instances: number
  status: 'active' | 'inactive'
}

export interface Image {
  id: string
  name: string
  type: 'VM' | 'Container'
  os?: string
  size: string
  status: 'available' | 'building' | 'deprecated'
  createdAt: string
}

export interface IAMUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'developer' | 'viewer'
  status: 'active' | 'inactive'
  lastAccess: string
}

export interface Activity {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  time: string
}

export interface ContainerTag {
  tag: string
  size: string
  pushed: string
  digest: string
}

export interface ContainerRepo {
  id: string
  namespace: string
  name: string
  fullName: string
  imageCount: number
  totalSize: string
  lastPushed: string
  isPublic: boolean
  tags: ContainerTag[]
}
