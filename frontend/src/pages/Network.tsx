import { Network as NetworkIcon, Plus } from 'lucide-react'
import { vpcs } from '../data/mock'
import { StatusBadge } from '../components/StatusBadge'
import { useViewMode } from '../hooks/useViewMode'
import { ViewToggle } from '../components/ViewToggle'

export function Network() {
  const [view, setView] = useViewMode('network', 'grid')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <ViewToggle mode={view} onChange={setView} />
        <button className="ml-auto flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors">
          <Plus className="w-4 h-4" /> Criar VPC
        </button>
      </div>

      {view === 'list' ? (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Nome</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">CIDR</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Status</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Subnets</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Instâncias</th>
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
                  <td className="px-4 py-3 text-slate-600 text-xs">{v.subnets}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{v.instances}</td>
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
                <StatusBadge status={v.status} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Subnets', value: v.subnets },
                  { label: 'Instâncias', value: v.instances },
                ].map(item => (
                  <div key={item.label} className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-slate-800">{item.value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
