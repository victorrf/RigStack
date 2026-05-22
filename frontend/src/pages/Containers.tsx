import { Search, Plus } from 'lucide-react'
import { containers } from '../data/mock'
import { StatusBadge } from '../components/StatusBadge'

export function Containers() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Buscar containers..." />
        </div>
        <button className="ml-auto flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Novo Container
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Nome</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Imagem</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Portas</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">CPU</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Memória</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Uptime</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {containers.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{c.image}</td>
                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-3 text-slate-600">{c.ports}</td>
                <td className="px-4 py-3 text-slate-600">{c.cpu}</td>
                <td className="px-4 py-3 text-slate-600">{c.memory}</td>
                <td className="px-4 py-3 text-slate-500">{c.uptime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
