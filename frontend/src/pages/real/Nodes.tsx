import { useEffect, useState } from 'react'
import { Server, RefreshCw, Plus, Trash2, Wifi, WifiOff, X, Copy, Check } from 'lucide-react'
import { api, fmtBytes, type ApiNode } from '../../api/client'
import { StatusBadge } from '../../components/StatusBadge'

export function RealNodes() {
  const [nodes, setNodes] = useState<ApiNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', region: 'local-1' })
  const [copied, setCopied] = useState(false)

  const load = () => {
    setLoading(true)
    api.nodes.list()
      .then(n => setNodes(n ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    const timer = setInterval(load, 15000)
    return () => clearInterval(timer)
  }, [])

  async function handleDelete(id: string) {
    if (!confirm('Remover este node?')) return
    await api.nodes.delete(id).catch(() => null)
    load()
  }

  const controllerHost = window.location.hostname
  const installCmd = `curl -fsSL "http://${controllerHost}:8080/agent/install.sh?name=${form.name || 'node-1'}&region=${form.region || 'local-1'}" | sudo sh -`

  function copyCmd() {
    navigator.clipboard.writeText(installCmd)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const healthy = nodes.filter(n => n.status === 'healthy').length

  if (loading && nodes.length === 0) return (
    <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Carregando...</div>
  )
  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
      Erro ao conectar com o controller: <span className="font-mono">{error}</span>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="font-medium text-slate-700">{healthy}</span> healthy
          <span className="text-slate-300">·</span>
          <span className="font-medium text-slate-700">{nodes.length - healthy}</span> unreachable
        </div>
        <button onClick={load} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Atualizar">
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowModal(true)}
          className="ml-auto flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Node
        </button>
      </div>

      {/* Node list */}
      {nodes.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <Server className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No nodes registered yet</p>
          <button onClick={() => setShowModal(true)} className="mt-3 text-orange-600 text-sm hover:underline">
            Add first node
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {nodes.map(n => {
            const ramPct = n.ram_bytes > 0 ? Math.round((1 - n.ram_free / n.ram_bytes) * 100) : 0
            const isHealthy = n.status === 'healthy'
            return (
              <div key={n.id} className="bg-white rounded-lg border border-slate-200 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${isHealthy ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}>
                      {isHealthy
                        ? <Wifi className="w-5 h-5 text-emerald-600" />
                        : <WifiOff className="w-5 h-5 text-red-400" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{n.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">{n.address} · {n.region}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={isHealthy ? 'running' : 'error'} />
                    <button onClick={() => handleDelete(n.id)} className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">vCPUs</p>
                    <p className="text-sm font-semibold text-slate-700">{n.cpu_cores}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">RAM</p>
                    <p className="text-sm font-semibold text-slate-700">{fmtBytes(n.ram_bytes)}</p>
                    <div className="h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                      <div className={`h-full rounded-full ${ramPct > 80 ? 'bg-red-400' : 'bg-emerald-400'}`} style={{ width: `${ramPct}%` }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{fmtBytes(n.ram_free)} free</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Disk</p>
                    <p className="text-sm font-semibold text-slate-700">{fmtBytes(n.disk_bytes)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">VMs</p>
                    <p className="text-sm font-semibold text-slate-700">{n.vm_count}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
                  Last seen {new Date(n.last_seen).toLocaleString('pt-BR')}
                  {' · '}Registered {new Date(n.registered_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Node modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-slate-800 font-semibold text-lg">Add Node</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Node name</label>
                  <input
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="node-1"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Region</label>
                  <input
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="local-1"
                    value={form.region}
                    onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Run on the node</label>
                <div className="relative">
                  <pre className="bg-slate-900 text-emerald-400 text-xs rounded-lg p-4 pr-12 overflow-x-auto whitespace-pre-wrap break-all font-mono leading-relaxed">
                    {installCmd}
                  </pre>
                  <button
                    onClick={copyCmd}
                    className="absolute top-3 right-3 p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                    title="Copy"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  Prerequisites: <span className="font-mono">libvirt-daemon-system qemu-kvm</span> installed and <span className="font-mono">libvirtd</span> running.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
                After running the command, the node will appear here automatically within a few seconds.
              </div>
            </div>

            <button onClick={() => setShowModal(false)} className="w-full mt-5 px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
