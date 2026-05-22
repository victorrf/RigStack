import { useEffect, useState } from 'react'
import { Plus, Search, Play, Square, Trash2, X, RefreshCw } from 'lucide-react'
import { api, fmtRam, type ApiInstance, type ApiVPC } from '../../api/client'
import { StatusBadge } from '../../components/StatusBadge'

const OS_OPTIONS = [
  { label: 'Ubuntu 24.04 LTS', value: 'ubuntu-24.04' },
  { label: 'Debian 13', value: 'debian-13' },
  { label: 'Debian 12', value: 'debian-12' },
]

const FLAVORS = [
  { label: 'Micro',  vcpus: 1, ram_mb: 512,  disk_gb: 10 },
  { label: 'Small',  vcpus: 2, ram_mb: 2048, disk_gb: 20 },
  { label: 'Medium', vcpus: 4, ram_mb: 8192, disk_gb: 50 },
]

export function RealInstances() {
  const [instances, setInstances] = useState<ApiInstance[]>([])
  const [vpcs, setVpcs] = useState<ApiVPC[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'running' | 'stopped'>('all')
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', vpc_id: '', os: OS_OPTIONS[0].value, flavor: 1, ssh_pubkey: '' })

  const load = () => {
    setLoading(true)
    Promise.all([api.instances.list(), api.vpcs.list()])
      .then(([inst, v]) => { setInstances(inst ?? []); setVpcs(v ?? []) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = instances.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || i.status === filter
    return matchSearch && matchFilter
  })

  async function handleStart(id: string) {
    await api.instances.start(id).catch(() => null)
    load()
  }

  async function handleStop(id: string) {
    await api.instances.stop(id).catch(() => null)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Deletar esta instância?')) return
    await api.instances.delete(id).catch(() => null)
    load()
  }

  async function handleCreate() {
    if (!form.name.trim() || !form.vpc_id) return
    const flavor = FLAVORS[form.flavor]
    setCreating(true)
    try {
      await api.instances.create({
        name: form.name.trim(),
        vpc_id: form.vpc_id,
        vcpus: flavor.vcpus,
        ram_mb: flavor.ram_mb,
        disk_gb: flavor.disk_gb,
        os_image: form.os,
        ssh_pubkey: form.ssh_pubkey,
      })
      setShowModal(false)
      setForm({ name: '', vpc_id: '', os: OS_OPTIONS[0].value, flavor: 1, ssh_pubkey: '' })
      load()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Carregando...</div>
  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
      Erro ao conectar com o controller: <span className="font-mono">{error}</span>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Buscar instâncias..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          value={filter}
          onChange={e => setFilter(e.target.value as typeof filter)}
        >
          <option value="all">Todas ({instances.length})</option>
          <option value="running">Running ({instances.filter(i => i.status === 'running').length})</option>
          <option value="stopped">Stopped ({instances.filter(i => i.status === 'stopped').length})</option>
        </select>
        <button onClick={load} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Atualizar">
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowModal(true)}
          className="ml-auto flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Nova Instância
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Nome</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">vCPUs</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">RAM</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Disco</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">IP</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">OS</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center py-10 text-slate-400">Nenhuma instância encontrada</td></tr>
            )}
            {filtered.map(i => (
              <tr key={i.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-800">{i.name}</td>
                <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
                <td className="px-4 py-3 text-slate-600">{i.vcpus}</td>
                <td className="px-4 py-3 text-slate-600">{fmtRam(i.ram_mb)}</td>
                <td className="px-4 py-3 text-slate-600">{i.disk_gb} GB</td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{i.ip_address || '—'}</td>
                <td className="px-4 py-3 text-slate-500">{i.os_image}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {i.status === 'running'
                      ? <button onClick={() => handleStop(i.id)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors" title="Parar">
                          <Square className="w-3.5 h-3.5" />
                        </button>
                      : <button onClick={() => handleStart(i.id)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors" title="Iniciar">
                          <Play className="w-3.5 h-3.5" />
                        </button>
                    }
                    <button onClick={() => handleDelete(i.id)} className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors" title="Deletar">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-slate-800 font-semibold text-lg">Nova Instância</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome</label>
                <input
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="ex: web-01"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">VPC</label>
                <select
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={form.vpc_id}
                  onChange={e => setForm(f => ({ ...f, vpc_id: e.target.value }))}
                >
                  <option value="">Selecione uma VPC</option>
                  {vpcs.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.cidr})</option>
                  ))}
                </select>
                {vpcs.length === 0 && <p className="text-xs text-amber-600 mt-1">Crie uma VPC primeiro em Networking</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Imagem</label>
                <div className="space-y-2">
                  {OS_OPTIONS.map(os => (
                    <label key={os.value} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50">
                      <input type="radio" name="os" value={os.value} checked={form.os === os.value} onChange={() => setForm(f => ({ ...f, os: os.value }))} className="accent-orange-600" />
                      <span className="text-sm text-slate-700">{os.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo</label>
                <div className="grid grid-cols-3 gap-2">
                  {FLAVORS.map((f, i) => (
                    <button key={f.label} onClick={() => setForm(prev => ({ ...prev, flavor: i }))}
                      className={`p-3 rounded-lg border text-left transition-colors ${form.flavor === i ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <p className="text-sm font-medium text-slate-800">{f.label}</p>
                      <p className="text-xs text-slate-500">{f.vcpus} vCPU</p>
                      <p className="text-xs text-slate-500">{fmtRam(f.ram_mb)}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">SSH Public Key <span className="text-slate-400 font-normal">(opcional)</span></label>
                <textarea
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  rows={2}
                  placeholder="ssh-ed25519 AAAA..."
                  value={form.ssh_pubkey}
                  onChange={e => setForm(f => ({ ...f, ssh_pubkey: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.name.trim() || !form.vpc_id || creating}
                className="flex-1 px-4 py-2 text-sm bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {creating ? 'Criando...' : 'Criar Instância'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
