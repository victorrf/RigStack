import { useEffect, useState } from 'react'
import { Network as NetworkIcon, Plus, Trash2, RefreshCw, X } from 'lucide-react'
import { api, type ApiVPC } from '../../api/client'
import { StatusBadge } from '../../components/StatusBadge'
import { useViewMode } from '../../hooks/useViewMode'
import { ViewToggle } from '../../components/ViewToggle'

export function RealNetwork() {
  const [vpcs, setVpcs] = useState<ApiVPC[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', cidr: '10.0.1.0/24' })
  const [view, setView] = useViewMode('network', 'grid')

  const load = () => {
    setLoading(true)
    api.vpcs.list()
      .then(v => setVpcs(v ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleCreate() {
    if (!form.name.trim() || !form.cidr.trim()) return
    setCreating(true)
    try {
      await api.vpcs.create(form.name.trim(), form.cidr.trim())
      setShowModal(false)
      setForm({ name: '', cidr: '10.0.1.0/24' })
      load()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deletar esta VPC?')) return
    await api.vpcs.delete(id).catch(() => null)
    load()
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
        <ViewToggle mode={view} onChange={setView} />
        <button onClick={load} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Atualizar">
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowModal(true)}
          className="ml-auto flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors"
        >
          <Plus className="w-4 h-4" /> Criar VPC
        </button>
      </div>

      {vpcs.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <NetworkIcon className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Nenhuma VPC criada ainda</p>
          <button onClick={() => setShowModal(true)} className="mt-3 text-orange-600 text-sm hover:underline">
            Criar primeira VPC
          </button>
        </div>
      ) : view === 'list' ? (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Nome</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">CIDR</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Status</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Criada em</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vpcs.map(v => (
                <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <NetworkIcon className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-800">{v.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{v.cidr}</td>
                  <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(v.created_at).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(v.id)} className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {vpcs.map(v => (
            <div key={v.id} className="bg-white rounded-lg border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 border border-slate-200 p-2.5 rounded-lg">
                    <NetworkIcon className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">{v.name}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{v.cidr}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={v.status} />
                  <button onClick={() => handleDelete(v.id)} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-400">Criada em {new Date(v.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-slate-800 font-semibold text-lg">Criar VPC</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome</label>
                <input
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="ex: vpc-producao"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">CIDR</label>
                <input
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="10.0.1.0/24"
                  value={form.cidr}
                  onChange={e => setForm(f => ({ ...f, cidr: e.target.value }))}
                />
                <p className="text-xs text-slate-400 mt-1">Gateway automático: primeiro IP da subnet</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.name.trim() || !form.cidr.trim() || creating}
                className="flex-1 px-4 py-2 text-sm bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {creating ? 'Criando...' : 'Criar VPC'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
