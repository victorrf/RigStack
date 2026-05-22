import { Package, Plus, Globe, Lock, Trash2, ExternalLink } from 'lucide-react'
import { buckets } from '../data/mock'
import { useViewMode } from '../hooks/useViewMode'
import { ViewToggle } from '../components/ViewToggle'

export function ObjectStorage() {
  const [view, setView] = useViewMode('object-storage', 'list')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <ViewToggle mode={view} onChange={setView} />
        <button className="ml-auto flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors">
          <Plus className="w-4 h-4" />
          Criar Bucket
        </button>
      </div>

      {view === 'list' ? (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Nome</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Acesso</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Tamanho</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Objetos</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Região</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Criado em</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {buckets.map(b => (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span className="font-medium text-slate-800">{b.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {b.access === 'public'
                      ? <span className="inline-flex items-center gap-1 text-xs text-sky-600 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded"><Globe className="w-3 h-3" /> Público</span>
                      : <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded"><Lock className="w-3 h-3" /> Privado</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{b.size}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{b.objects.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs font-mono">{b.region}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{b.createdAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Abrir">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Deletar">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {buckets.map(b => (
            <div key={b.id} className="bg-white rounded-lg border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-lg">
                  <Package className="w-5 h-5 text-amber-600" />
                </div>
                {b.access === 'public'
                  ? <span className="flex items-center gap-1 text-xs text-sky-600 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded"><Globe className="w-3 h-3" /> Público</span>
                  : <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded"><Lock className="w-3 h-3" /> Privado</span>
                }
              </div>
              <h3 className="font-semibold text-slate-800 text-sm">{b.name}</h3>
              <div className="mt-3 space-y-1.5">
                {[
                  { label: 'Tamanho', value: b.size },
                  { label: 'Objetos', value: b.objects.toLocaleString() },
                  { label: 'Região', value: b.region },
                ].map(item => (
                  <div key={item.label} className="flex justify-between text-xs">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="text-slate-700 font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                <button className="flex-1 text-xs text-orange-600 hover:text-orange-700 font-medium py-1">Abrir</button>
                <button className="p-1 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
