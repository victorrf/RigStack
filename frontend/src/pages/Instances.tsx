import { useState } from 'react'
import { Plus, Search, Play, Square, Trash2, MoreHorizontal, X } from 'lucide-react'
import { instances as initialInstances } from '../data/mock'
import { StatusBadge } from '../components/StatusBadge'
import type { Instance } from '../types'

const OS_OPTIONS = ['Ubuntu 24.04 LTS', 'Debian 12', 'Rocky Linux 9']
const FLAVORS = [
  { label: 'Micro', vcpus: 1, ram: '512 MB', price: 'free' },
  { label: 'Small', vcpus: 2, ram: '2 GB', price: 'free' },
  { label: 'Medium', vcpus: 4, ram: '8 GB', price: 'free' },
]

export function Instances() {
  const [vms, setVms] = useState<Instance[]>(initialInstances)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'running' | 'stopped'>('all')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', os: OS_OPTIONS[0], flavor: 0, disk: '20' })

  const filtered = vms.filter(v => {
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || v.status === filter
    return matchSearch && matchFilter
  })

  function toggleStatus(id: string) {
    setVms(prev => prev.map(v =>
      v.id === id ? { ...v, status: v.status === 'running' ? 'stopped' : 'running', ip: v.status === 'running' ? '—' : `192.168.1.${Math.floor(Math.random() * 200) + 10}` } : v
    ))
  }

  function deleteVm(id: string) {
    setVms(prev => prev.filter(v => v.id !== id))
  }

  function createVm() {
    if (!form.name.trim()) return
    const flavor = FLAVORS[form.flavor]
    const newVm: Instance = {
      id: String(Date.now()),
      name: form.name.trim(),
      status: 'pending',
      vcpus: flavor.vcpus,
      ram: flavor.ram,
      disk: form.disk + ' GB',
      ip: '—',
      os: form.os,
      createdAt: new Date().toISOString().split('T')[0],
    }
    setVms(prev => [newVm, ...prev])
    setShowModal(false)
    setForm({ name: '', os: OS_OPTIONS[0], flavor: 0, disk: '20' })
    // Simulate booting
    setTimeout(() => {
      setVms(prev => prev.map(v =>
        v.id === newVm.id
          ? { ...v, status: 'running', ip: `192.168.1.${Math.floor(Math.random() * 200) + 10}` }
          : v
      ))
    }, 2000)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
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
          <option value="all">Todas ({vms.length})</option>
          <option value="running">Running ({vms.filter(v => v.status === 'running').length})</option>
          <option value="stopped">Stopped ({vms.filter(v => v.status === 'stopped').length})</option>
        </select>
        <button
          onClick={() => setShowModal(true)}
          className="ml-auto flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Instância
        </button>
      </div>

      {/* Table */}
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
              <tr>
                <td colSpan={8} className="text-center py-10 text-slate-400">Nenhuma instância encontrada</td>
              </tr>
            )}
            {filtered.map(vm => (
              <tr key={vm.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-800">{vm.name}</td>
                <td className="px-4 py-3"><StatusBadge status={vm.status} /></td>
                <td className="px-4 py-3 text-slate-600">{vm.vcpus}</td>
                <td className="px-4 py-3 text-slate-600">{vm.ram}</td>
                <td className="px-4 py-3 text-slate-600">{vm.disk}</td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{vm.ip}</td>
                <td className="px-4 py-3 text-slate-500">{vm.os}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleStatus(vm.id)}
                      className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                      title={vm.status === 'running' ? 'Parar' : 'Iniciar'}
                    >
                      {vm.status === 'running' ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => deleteVm(vm.id)}
                      className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                      title="Deletar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
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
                  placeholder="ex: web-03"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Imagem</label>
                <div className="space-y-2">
                  {OS_OPTIONS.map(os => (
                    <label key={os} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                      <input type="radio" name="os" value={os} checked={form.os === os} onChange={() => setForm(f => ({ ...f, os }))} className="accent-blue-600" />
                      <span className="text-sm text-slate-700">{os}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo</label>
                <div className="grid grid-cols-3 gap-2">
                  {FLAVORS.map((f, i) => (
                    <button
                      key={f.label}
                      onClick={() => setForm(prev => ({ ...prev, flavor: i }))}
                      className={`p-3 rounded-lg border text-left transition-colors ${form.flavor === i ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <p className="text-sm font-medium text-slate-800">{f.label}</p>
                      <p className="text-xs text-slate-500">{f.vcpus} vCPU</p>
                      <p className="text-xs text-slate-500">{f.ram}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Disco (GB)</label>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  className="w-28 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={form.disk}
                  onChange={e => setForm(f => ({ ...f, disk: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button
                onClick={createVm}
                disabled={!form.name.trim()}
                className="flex-1 px-4 py-2 text-sm bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                Criar Instância
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
