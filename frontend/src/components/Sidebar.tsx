import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Server, Package, Container, GitBranch,
  Database, Network, Scale, Image, Shield, Zap
} from 'lucide-react'

const navGroups = [
  {
    label: null,
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Compute',
    items: [
      { to: '/instances', label: 'Instances', icon: Server },
    ],
  },
  {
    label: 'Storage',
    items: [
      { to: '/storage', label: 'Object Storage', icon: Package },
      { to: '/images', label: 'Images', icon: Image },
    ],
  },
  {
    label: 'Containers',
    items: [
      { to: '/containers', label: 'Containers', icon: Container },
      { to: '/kubernetes', label: 'Kubernetes', icon: GitBranch },
    ],
  },
  {
    label: 'Database',
    items: [
      { to: '/databases', label: 'Databases', icon: Database },
    ],
  },
  {
    label: 'Networking',
    items: [
      { to: '/network', label: 'Network', icon: Network },
      { to: '/loadbalancer', label: 'Load Balancer', icon: Scale },
    ],
  },
  {
    label: 'Identity & Security',
    items: [
      { to: '/iam', label: 'IAM', icon: Shield },
    ],
  },
]

export function Sidebar() {
  return (
    <aside className="w-56 min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-10" style={{ background: '#0f1523' }}>
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/5">
        <div className="bg-orange-600 rounded-md p-1.5">
          <Zap className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-white font-bold text-sm tracking-widest uppercase">RigStack</span>
      </div>

      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {navGroups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-1' : ''}>
            {group.label && (
              <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                {group.label}
              </p>
            )}
            {group.items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-1.5 rounded text-xs transition-colors my-0.5 ${
                    isActive
                      ? 'border-l-2 border-orange-500 bg-orange-500/10 text-orange-400 pl-[10px]'
                      : 'border-l-2 border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5 pl-[10px]'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            M
          </div>
          <div className="min-w-0">
            <p className="text-slate-300 text-xs font-medium truncate">Missael</p>
            <p className="text-slate-600 text-[10px] truncate">Administrator</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
