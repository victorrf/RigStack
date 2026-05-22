import { Scale, Plus } from 'lucide-react'
import { loadBalancers } from '../data/mock'
import { StatusBadge } from '../components/StatusBadge'

export function LoadBalancer() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Novo Load Balancer
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Nome</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Tipo</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Targets</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">IP</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Requisições</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loadBalancers.map(lb => (
              <tr key={lb.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-800">{lb.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-mono">{lb.type}</span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={lb.status} /></td>
                <td className="px-4 py-3 text-slate-600">{lb.targets}</td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{lb.ip}</td>
                <td className="px-4 py-3 text-slate-600">{lb.requests}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
