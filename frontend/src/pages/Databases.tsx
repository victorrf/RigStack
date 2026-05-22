import { Database, Plus } from 'lucide-react'
import { databases } from '../data/mock'
import { StatusBadge } from '../components/StatusBadge'

const engineColors: Record<string, string> = {
  PostgreSQL: 'text-blue-700 bg-blue-50',
  MySQL: 'text-orange-700 bg-orange-50',
  Redis: 'text-red-700 bg-red-50',
}

export function Databases() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Novo Database
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Nome</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Engine</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Storage</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Conexões</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Host</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {databases.map(d => (
              <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-800">{d.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${engineColors[d.engine]}`}>
                    {d.engine} {d.version}
                  </span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                <td className="px-4 py-3 text-slate-600">{d.storage}</td>
                <td className="px-4 py-3 text-slate-600">{d.connections}</td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{d.host}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
