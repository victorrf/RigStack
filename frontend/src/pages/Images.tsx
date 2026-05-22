import { useState } from 'react'
import { Server, Container, Plus, ChevronDown, ChevronRight, Globe, Lock, Copy } from 'lucide-react'
import { images, containerRepos } from '../data/mock'
import { StatusBadge } from '../components/StatusBadge'

type Tab = 'vm' | 'container'

export function Images() {
  const [tab, setTab] = useState<Tab>('vm')
  const [expanded, setExpanded] = useState<string | null>(null)

  function toggleRepo(id: string) {
    setExpanded(prev => (prev === id ? null : id))
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-lg overflow-hidden -mb-4">
        {([
          { key: 'vm', label: 'VM Images', icon: Server },
          { key: 'container', label: 'Container Registry', icon: Container },
        ] as { key: Tab; label: string; icon: typeof Server }[]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-orange-500 text-orange-600 bg-orange-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'vm' && (
        <div className="space-y-4 pt-4">
          <div className="flex justify-end">
            <button className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors">
              <Plus className="w-4 h-4" /> Importar Imagem
            </button>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Nome</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">OS</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Status</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Tamanho</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Criado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {images.filter(i => i.type === 'VM').map(img => (
                  <tr key={img.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-800 font-mono text-xs">{img.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{img.os ?? '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={img.status} /></td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{img.size}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{img.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'container' && (
        <div className="space-y-4 pt-4">
          <div className="flex justify-end">
            <button className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors">
              <Plus className="w-4 h-4" /> Novo Repositório
            </button>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs w-8" />
                  <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Repositório</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Visibilidade</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Imagens</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Tamanho total</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Último push</th>
                </tr>
              </thead>
              <tbody>
                {containerRepos.map(repo => (
                  <>
                    <tr
                      key={repo.id}
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => toggleRepo(repo.id)}
                    >
                      <td className="px-4 py-3 text-slate-400">
                        {expanded === repo.id
                          ? <ChevronDown className="w-3.5 h-3.5" />
                          : <ChevronRight className="w-3.5 h-3.5" />
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Container className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-800 font-mono text-xs">{repo.fullName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {repo.isPublic
                          ? <span className="inline-flex items-center gap-1 text-xs text-sky-600 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded"><Globe className="w-3 h-3" /> Público</span>
                          : <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded"><Lock className="w-3 h-3" /> Privado</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{repo.imageCount}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{repo.totalSize}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{repo.lastPushed}</td>
                    </tr>

                    {expanded === repo.id && (
                      <tr key={`${repo.id}-tags`} className="border-b border-slate-100 bg-slate-50/70">
                        <td />
                        <td colSpan={5} className="px-4 py-2">
                          <table className="w-full text-xs">
                            <thead>
                              <tr>
                                <th className="text-left py-1.5 text-slate-400 font-medium">Tag</th>
                                <th className="text-left py-1.5 text-slate-400 font-medium">Digest</th>
                                <th className="text-left py-1.5 text-slate-400 font-medium">Tamanho</th>
                                <th className="text-left py-1.5 text-slate-400 font-medium">Publicado</th>
                                <th />
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {repo.tags.map(t => (
                                <tr key={t.tag}>
                                  <td className="py-2">
                                    <span className="bg-slate-200 text-slate-700 font-mono px-2 py-0.5 rounded">{t.tag}</span>
                                  </td>
                                  <td className="py-2 font-mono text-slate-400">{t.digest}</td>
                                  <td className="py-2 text-slate-600">{t.size}</td>
                                  <td className="py-2 text-slate-500">{t.pushed}</td>
                                  <td className="py-2">
                                    <button className="flex items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors" title="Copiar endereço">
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
