import { GitBranch, Plus } from 'lucide-react'
import { k8sClusters } from '../data/mock'
import { StatusBadge } from '../components/StatusBadge'
import { useViewMode } from '../hooks/useViewMode'
import { ViewToggle } from '../components/ViewToggle'

export function Kubernetes() {
  const [view, setView] = useViewMode('kubernetes', 'grid')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <ViewToggle mode={view} onChange={setView} />
        <button className="ml-auto flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors">
          <Plus className="w-4 h-4" /> Novo Cluster
        </button>
      </div>

      {view === 'list' ? (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Nome</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Status</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Versão</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Nodes</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Pods</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Região</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Criado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {k8sClusters.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-800">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">{c.version}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{c.nodes}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{c.pods}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{c.region}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{c.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {k8sClusters.map(c => (
            <div key={c.id} className="bg-white rounded-lg border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-sky-50 border border-sky-100 p-2.5 rounded-lg">
                    <GitBranch className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{c.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">{c.version}</p>
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Nodes', value: c.nodes },
                  { label: 'Pods', value: c.pods },
                  { label: 'Região', value: c.region },
                ].map(item => (
                  <div key={item.label} className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-slate-800">{item.value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex gap-3">
                <button className="text-xs text-orange-600 hover:text-orange-700 font-medium">Ver Workloads</button>
                <span className="text-slate-200">|</span>
                <button className="text-xs text-orange-600 hover:text-orange-700 font-medium">Escalar</button>
                <span className="text-slate-200">|</span>
                <button className="text-xs text-slate-400 hover:text-slate-600 font-medium">Kubeconfig</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
