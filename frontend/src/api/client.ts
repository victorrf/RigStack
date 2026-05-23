// Cliente HTTP para a REST API do controller.
// Usa caminhos relativos — o proxy do Vite encaminha /api/* para localhost:8080.

export interface ApiNode {
  id: string
  name: string
  region: string
  address: string
  status: string
  cpu_cores: number
  cpu_free_pct: number
  ram_bytes: number
  ram_free: number
  disk_bytes: number
  disk_free: number
  vm_count: number
  last_seen: string
  registered_at: string
}

export interface ApiVPC {
  id: string
  name: string
  cidr: string
  status: string
  created_at: string
}

export interface ApiInstance {
  id: string
  name: string
  status: string
  node_id: string
  vpc_id: string
  vcpus: number
  ram_mb: number
  disk_gb: number
  ip_address: string
  os_image: string
  created_at: string
  updated_at: string
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export interface ApiImage {
  id: string
  name: string
  os: string
  version: string
  url: string
  size_gb: number
}

export const api = {
  nodes: {
    list: () => req<ApiNode[]>('/api/v1/nodes'),
    delete: (id: string) => req<void>(`/api/v1/nodes/${id}`, { method: 'DELETE' }),
  },

  vpcs: {
    list: () => req<ApiVPC[]>('/api/v1/vpcs'),
    create: (name: string, cidr: string) =>
      req<ApiVPC>('/api/v1/vpcs', {
        method: 'POST',
        body: JSON.stringify({ name, cidr }),
      }),
    delete: (id: string) => req<void>(`/api/v1/vpcs/${id}`, { method: 'DELETE' }),
  },

  images: {
    list: () => req<ApiImage[]>('/api/v1/images'),
    deploy: (id: string) => req<{ queued: boolean; nodes: string[] }>(`/api/v1/images/${id}/deploy`, { method: 'POST' }),
  },

  instances: {
    list: () => req<ApiInstance[]>('/api/v1/instances'),
    create: (data: {
      name: string
      vpc_id: string
      vcpus: number
      ram_mb: number
      disk_gb: number
      os_image: string
      ssh_pubkey?: string
    }) => req<ApiInstance>('/api/v1/instances', { method: 'POST', body: JSON.stringify(data) }),
    start: (id: string) => req<{ status: string }>(`/api/v1/instances/${id}/start`, { method: 'PUT' }),
    stop: (id: string) => req<{ status: string }>(`/api/v1/instances/${id}/stop`, { method: 'PUT' }),
    delete: (id: string) => req<void>(`/api/v1/instances/${id}`, { method: 'DELETE' }),
    metrics: (id: string) => req<{ cpu_pct: number; ram_mb: number; time: string }>(`/api/v1/instances/${id}/metrics`),
  },
}

// Helpers de formatação
export function fmtBytes(b: number): string {
  if (b >= 1024 ** 3) return (b / 1024 ** 3).toFixed(1) + ' GB'
  if (b >= 1024 ** 2) return (b / 1024 ** 2).toFixed(0) + ' MB'
  return b + ' B'
}

export function fmtRam(mb: number): string {
  return mb >= 1024 ? (mb / 1024).toFixed(0) + ' GB' : mb + ' MB'
}
