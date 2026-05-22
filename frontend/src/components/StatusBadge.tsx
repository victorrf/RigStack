import type { Status } from '../types'

const config: Record<string, { label: string; dot: string; className: string }> = {
  running:    { label: 'Running',    dot: 'bg-emerald-500', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  stopped:    { label: 'Stopped',    dot: 'bg-slate-400',   className: 'bg-slate-50 text-slate-500 border-slate-200' },
  pending:    { label: 'Pending',    dot: 'bg-amber-500',   className: 'bg-amber-50 text-amber-700 border-amber-200' },
  error:      { label: 'Error',      dot: 'bg-red-500',     className: 'bg-red-50 text-red-700 border-red-200' },
  active:     { label: 'Active',     dot: 'bg-emerald-500', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  inactive:   { label: 'Inactive',   dot: 'bg-slate-400',   className: 'bg-slate-50 text-slate-500 border-slate-200' },
  available:  { label: 'Available',  dot: 'bg-emerald-500', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  building:   { label: 'Building',   dot: 'bg-amber-500',   className: 'bg-amber-50 text-amber-700 border-amber-200' },
  deprecated: { label: 'Deprecated', dot: 'bg-red-500',     className: 'bg-red-50 text-red-700 border-red-200' },
}

export function StatusBadge({ status }: { status: Status | string }) {
  const c = config[status] ?? { label: status, dot: 'bg-slate-400', className: 'bg-slate-50 text-slate-500 border-slate-200' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-medium ${c.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}
