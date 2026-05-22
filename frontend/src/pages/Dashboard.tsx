import { Server, Package, Container, GitBranch, Database, Scale, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { instances, buckets, containers, k8sClusters, databases, loadBalancers, recentActivity, resourceUsage } from '../data/mock'

const stats = [
  {
    label: 'Instances',
    icon: Server,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    value: instances.filter(i => i.status === 'running').length,
    sub: `${instances.filter(i => i.status === 'stopped').length} stopped`,
    total: instances.length,
  },
  {
    label: 'Containers',
    icon: Container,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    value: containers.filter(c => c.status === 'running').length,
    sub: `${containers.filter(c => c.status === 'stopped').length} stopped`,
    total: containers.length,
  },
  {
    label: 'Kubernetes',
    icon: GitBranch,
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    value: k8sClusters.length,
    sub: `${k8sClusters.reduce((a, b) => a + b.nodes, 0)} nodes`,
    total: k8sClusters.reduce((a, b) => a + b.pods, 0) + ' pods',
  },
  {
    label: 'Object Storage',
    icon: Package,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    value: buckets.length,
    sub: '128 GB usado',
    total: buckets.reduce((a, b) => a + b.objects, 0).toLocaleString() + ' objetos',
  },
  {
    label: 'Databases',
    icon: Database,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    value: databases.filter(d => d.status === 'running').length,
    sub: `${databases.filter(d => d.status === 'stopped').length} stopped`,
    total: databases.length,
  },
  {
    label: 'Load Balancers',
    icon: Scale,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    value: loadBalancers.length,
    sub: '99.9% uptime',
    total: 'todos ativos',
  },
]

const resourceBars = [
  { label: 'CPU', value: resourceUsage.cpu, color: 'bg-blue-500' },
  { label: 'RAM', value: resourceUsage.ram, color: 'bg-purple-500' },
  { label: 'Storage', value: resourceUsage.storage, color: 'bg-amber-500' },
  { label: 'Network', value: resourceUsage.network, color: 'bg-emerald-500' },
]

const activityIcon = {
  success: <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />,
  error: <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />,
  info: <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />,
}

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white rounded-lg border border-slate-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-500 text-sm">{s.label}</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">{s.value}</p>
                  <p className="text-slate-400 text-xs mt-1">{s.sub}</p>
                </div>
                <div className={`${s.bg} rounded-lg p-2.5`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <span className="text-slate-400 text-xs">{s.total}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Resource usage */}
        <div className="col-span-1 bg-white rounded-lg border border-slate-200 p-5">
          <h2 className="text-slate-700 font-semibold text-sm mb-4">Uso de Recursos</h2>
          <div className="space-y-4">
            {resourceBars.map((r) => (
              <div key={r.label}>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{r.label}</span>
                  <span>{r.value}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${r.color} rounded-full transition-all`} style={{ width: `${r.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="col-span-2 bg-white rounded-lg border border-slate-200 p-5">
          <h2 className="text-slate-700 font-semibold text-sm mb-4">Atividade Recente</h2>
          <div className="space-y-3">
            {recentActivity.map((a) => (
              <div key={a.id} className="flex items-start gap-3">
                {activityIcon[a.type]}
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700 text-sm">{a.message}</p>
                </div>
                <span className="text-slate-400 text-xs whitespace-nowrap">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
