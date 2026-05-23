import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Terminal, BarChart2, Info, Play, Square, RefreshCw } from 'lucide-react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { api, fmtRam, type ApiInstance } from '../../api/client'
import { StatusBadge } from '../../components/StatusBadge'

type Tab = 'overview' | 'console' | 'metrics'

interface Metrics {
  cpu_pct: number
  ram_mb: number
  time: string
}

export function RealInstanceDetail() {
  const { id } = useParams<{ id: string }>()
  const [instance, setInstance] = useState<ApiInstance | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('overview')
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [metricsLoading, setMetricsLoading] = useState(false)
  const [metricsError, setMetricsError] = useState<string | null>(null)

  const termRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const load = () =>
    api.instances.list().then(list => {
      const found = list?.find(i => i.id === id) ?? null
      setInstance(found)
      setLoading(false)
    })

  useEffect(() => {
    load()
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [id])

  // Métricas — busca quando aba ativa
  useEffect(() => {
    if (tab !== 'metrics' || !id) return
    let cancelled = false

    const fetch = () => {
      setMetricsLoading(true)
      api.instances.metrics(id!)
        .then(m => { if (!cancelled) { setMetrics(m); setMetricsError(null) } })
        .catch(e => { if (!cancelled) setMetricsError(e.message) })
        .finally(() => { if (!cancelled) setMetricsLoading(false) })
    }
    fetch()
    const t = setInterval(fetch, 6000)
    return () => { cancelled = true; clearInterval(t) }
  }, [tab, id])

  // Console xterm — monta quando aba ativa, desmonta ao sair
  useEffect(() => {
    if (tab !== 'console' || !termRef.current || !id) return

    const term = new XTerm({
      theme: { background: '#0f172a', foreground: '#e2e8f0', cursor: '#f97316' },
      fontFamily: 'monospace',
      fontSize: 13,
      cursorBlink: true,
    })
    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(termRef.current)
    fitAddon.fit()
    xtermRef.current = term

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${proto}//${window.location.host}/api/v1/instances/${id}/console`)
    wsRef.current = ws

    ws.binaryType = 'arraybuffer'

    ws.onopen = () => term.write('\r\n\x1b[32mConectado ao console serial.\x1b[0m\r\n')
    ws.onmessage = e => {
      const data = e.data instanceof ArrayBuffer
        ? new Uint8Array(e.data)
        : e.data
      term.write(data)
    }
    ws.onerror = () => term.write('\r\n\x1b[31mErro na conexão WebSocket.\x1b[0m\r\n')
    ws.onclose = () => term.write('\r\n\x1b[33mConexão encerrada.\x1b[0m\r\n')

    term.onData(data => {
      if (ws.readyState === WebSocket.OPEN) ws.send(data)
    })

    const ro = new ResizeObserver(() => fitAddon.fit())
    ro.observe(termRef.current)

    return () => {
      ws.close()
      term.dispose()
      ro.disconnect()
      xtermRef.current = null
      wsRef.current = null
    }
  }, [tab, id])

  if (loading) return <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Carregando...</div>
  if (!instance) return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
      Instância não encontrada.
    </div>
  )

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Visão Geral', icon: <Info className="w-4 h-4" /> },
    { id: 'console', label: 'Console', icon: <Terminal className="w-4 h-4" /> },
    { id: 'metrics', label: 'Métricas', icon: <BarChart2 className="w-4 h-4" /> },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/instances" className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <h2 className="text-slate-800 font-semibold">{instance.name}</h2>
          <StatusBadge status={instance.status} />
        </div>
        <div className="flex items-center gap-2">
          {instance.status === 'running'
            ? <button onClick={() => api.instances.stop(instance.id).then(load)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                <Square className="w-3.5 h-3.5" /> Parar
              </button>
            : <button onClick={() => api.instances.start(instance.id).then(load)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
                <Play className="w-3.5 h-3.5" /> Iniciar
              </button>
          }
          <button onClick={load} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Identificação</h3>
            <Row label="ID" value={<span className="font-mono text-xs text-slate-500 break-all">{instance.id}</span>} />
            <Row label="Nome" value={instance.name} />
            <Row label="Status" value={<StatusBadge status={instance.status} />} />
            <Row label="OS" value={instance.os_image} />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Recursos</h3>
            <Row label="vCPUs" value={String(instance.vcpus)} />
            <Row label="RAM" value={fmtRam(instance.ram_mb)} />
            <Row label="Disco" value={`${instance.disk_gb} GB`} />
            <Row label="IP" value={<span className="font-mono text-xs">{instance.ip_address || '—'}</span>} />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 md:col-span-2">
            <h3 className="text-sm font-semibold text-slate-700">Infraestrutura</h3>
            <Row label="Node ID" value={<span className="font-mono text-xs text-slate-500">{instance.node_id || '—'}</span>} />
            <Row label="VPC ID" value={<span className="font-mono text-xs text-slate-500">{instance.vpc_id || '—'}</span>} />
            <Row label="Criado em" value={new Date(instance.created_at).toLocaleString('pt-BR')} />
            <Row label="Atualizado em" value={new Date(instance.updated_at).toLocaleString('pt-BR')} />
          </div>
        </div>
      )}

      {/* Console */}
      {tab === 'console' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50">
            <Terminal className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500">Console serial — conectado a <span className="font-mono">{instance.name}</span></span>
          </div>
          {instance.status !== 'running' && (
            <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 text-xs text-amber-700">
              A instância não está running. Inicie-a para acessar o console.
            </div>
          )}
          <div ref={termRef} className="w-full" style={{ height: 420, background: '#0f172a' }} />
        </div>
      )}

      {/* Metrics */}
      {tab === 'metrics' && (
        <div className="space-y-4">
          {metricsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{metricsError}</div>
          )}
          {metricsLoading && !metrics && (
            <div className="flex items-center justify-center h-32 text-slate-400 text-sm">Coletando métricas...</div>
          )}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MetricCard label="CPU" value={metrics.cpu_pct} unit="%" color="orange" />
              <MetricCard label="RAM usada" value={metrics.ram_mb} unit="MB" max={instance.ram_mb} color="blue" />
            </div>
          )}
          {metrics && (
            <p className="text-xs text-slate-400">
              Atualizado em {new Date(metrics.time).toLocaleTimeString('pt-BR')} · atualiza a cada 6s
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800">{value}</span>
    </div>
  )
}

function MetricCard({ label, value, unit, max, color }: {
  label: string; value: number; unit: string; max?: number; color: 'orange' | 'blue'
}) {
  const pct = max ? Math.min((value / max) * 100, 100) : Math.min(value, 100)
  const barColor = color === 'orange' ? 'bg-orange-500' : 'bg-blue-500'
  const display = unit === 'MB' ? fmtRam(value) : `${value.toFixed(1)}${unit}`

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-end justify-between mb-3">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-2xl font-bold text-slate-800">{display}</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div className={`${barColor} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      {max && <p className="text-xs text-slate-400 mt-1">de {fmtRam(max)}</p>}
    </div>
  )
}
