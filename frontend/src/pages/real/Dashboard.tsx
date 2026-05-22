import { useEffect, useState } from 'react'
import { Server, Network, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { api, fmtBytes, type ApiInstance, type ApiNode } from '../../api/client'

export function RealDashboard() {
  const [instances, setInstances] = useState<ApiInstance[]>([])
  const [nodes, setNodes] = useState<ApiNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.instances.list(), api.nodes.list()])
      .then(([inst, nd]) => {
        setInstances(inst ?? [])
        setNodes(nd ?? [])
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Carregando...</div>
  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
      Erro ao conectar com o controller: <span className="font-mono">{error}</span>
      <p className="mt-1 text-xs text-red-500">Verifique se o controller está rodando em localhost:8080</p>
    </div>
  )

  const running = instances.filter(i => i.status === 'running').length
  const stopped = instances.filter(i => i.status === 'stopped').length
  const pending = instances.filter(i => i.status === 'pending').length
  const healthyNodes = nodes.filter(n => n.status === 'healthy').length
  const totalRAM = nodes.reduce((acc, n) => acc + n.ram_bytes, 0)
  const freeRAM = nodes.reduce((acc, n) => acc + n.ram_free, 0)
  const totalVMs = nodes.reduce((acc, n) => acc + n.vm_count, 0)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-sm">Instances</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">{running}</p>
              <p className="text-slate-400 text-xs mt-1">{stopped} stopped · {pending} pending</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-2.5">
              <Server className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <span className="text-slate-400 text-xs">{instances.length} total</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-sm">Nodes</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">{healthyNodes}</p>
              <p className="text-slate-400 text-xs mt-1">{nodes.length - healthyNodes} unreachable</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-2.5">
              <Network className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <span className="text-slate-400 text-xs">{totalVMs} VMs em execução</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-sm">RAM Total</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">{fmtBytes(totalRAM)}</p>
              <p className="text-slate-400 text-xs mt-1">{fmtBytes(freeRAM)} livre</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-2.5">
              <Server className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            {totalRAM > 0 && (
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${Math.round((1 - freeRAM / totalRAM) * 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Nodes */}
        <div className="col-span-1 bg-white rounded-lg border border-slate-200 p-5">
          <h2 className="text-slate-700 font-semibold text-sm mb-4">Nodes</h2>
          {nodes.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">Nenhum node conectado</p>
          ) : (
            <div className="space-y-3">
              {nodes.map(n => (
                <div key={n.id} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${n.status === 'healthy' ? 'bg-emerald-500' : 'bg-red-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 text-sm font-medium truncate">{n.name}</p>
                    <p className="text-slate-400 text-xs">{n.region} · {n.vm_count} VMs</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimas instâncias */}
        <div className="col-span-2 bg-white rounded-lg border border-slate-200 p-5">
          <h2 className="text-slate-700 font-semibold text-sm mb-4">Instâncias Recentes</h2>
          {instances.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">Nenhuma instância criada ainda</p>
          ) : (
            <div className="space-y-3">
              {instances.slice(0, 6).map(i => (
                <div key={i.id} className="flex items-center gap-3">
                  {i.status === 'running'
                    ? <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    : i.status === 'error'
                    ? <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    : <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 text-sm">{i.name}</p>
                    <p className="text-slate-400 text-xs">{i.os_image} · {i.vcpus} vCPU · {i.ram_mb} MB</p>
                  </div>
                  <span className="text-slate-400 text-xs">{i.ip_address || '—'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
