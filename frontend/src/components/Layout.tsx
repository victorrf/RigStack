import { Outlet, useLocation, Link } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Bell, ChevronRight, MapPin } from 'lucide-react'

const pageMeta: Record<string, { title: string; parent?: string }> = {
  '/': { title: 'Dashboard' },
  '/instances': { title: 'Instances', parent: 'Compute' },
  '/nodes': { title: 'Nodes', parent: 'Compute' },
  '/storage': { title: 'Buckets', parent: 'Object Storage' },
  '/containers': { title: 'Containers', parent: 'Containers' },
  '/kubernetes': { title: 'Clusters', parent: 'Kubernetes' },
  '/databases': { title: 'Databases', parent: 'Database' },
  '/network': { title: 'Virtual Cloud Networks', parent: 'Networking' },
  '/loadbalancer': { title: 'Load Balancers', parent: 'Networking' },
  '/images': { title: 'Images', parent: 'Compute' },
  '/iam': { title: 'Users', parent: 'Identity & Security' },
}

interface LayoutProps {
  basePath?: string
}

export function Layout({ basePath = '' }: LayoutProps) {
  const location = useLocation()
  const rawPath = basePath ? location.pathname.slice(basePath.length) || '/' : location.pathname
  const meta = pageMeta[rawPath] ?? { title: rawPath }
  const isDemo = basePath !== ''

  return (
    <div className="flex min-h-screen" style={{ background: '#f3f4f8' }}>
      <Sidebar basePath={basePath} />
      <div className="flex-1 ml-56 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-6 py-0 flex items-center justify-between h-12 sticky top-0 z-10">
          <nav className="flex items-center gap-1.5 text-sm">
            <Link to={basePath + '/'} className="text-slate-400 hover:text-slate-600 text-xs">RigStack</Link>
            {meta.parent && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <span className="text-slate-400 text-xs">{meta.parent}</span>
              </>
            )}
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-slate-700 text-xs font-medium">{meta.title}</span>
          </nav>

          <div className="flex items-center gap-3">
            {isDemo && (
              <span className="text-xs bg-amber-100 border border-amber-300 text-amber-700 rounded px-2 py-0.5 font-medium">
                Live Demo
              </span>
            )}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 border border-slate-200 rounded px-2 py-1">
              <MapPin className="w-3 h-3" />
              <span>local-1</span>
            </div>
            <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-500 rounded-full" />
            </button>
          </div>
        </header>

        {isDemo && (
          <div className="bg-amber-50 border-b border-amber-100 px-6 py-1.5 flex items-center gap-2 text-xs text-amber-700">
            <span>Modo demonstração — dados fictícios, sem conexão com a API</span>
            <Link to="/" className="ml-auto text-orange-600 hover:underline font-medium">
              Usar API real →
            </Link>
          </div>
        )}

        <div className="px-6 py-4 border-b border-slate-200 bg-white">
          <h1 className="text-slate-800 font-semibold text-xl">{meta.title}</h1>
        </div>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
