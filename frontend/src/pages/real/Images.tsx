import { useEffect, useState } from 'react'
import { HardDrive, Download, RefreshCw, CheckCircle2, Loader2 } from 'lucide-react'
import { api, type ApiImage } from '../../api/client'

const OS_COLORS: Record<string, string> = {
  Ubuntu:  'bg-orange-50 border-orange-200 text-orange-700',
  Debian:  'bg-red-50 border-red-200 text-red-700',
}

export function RealImages() {
  const [images, setImages] = useState<ApiImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deploying, setDeploying] = useState<Record<string, boolean>>({})
  const [deployed, setDeployed] = useState<Record<string, string[]>>({})

  useEffect(() => {
    api.images.list()
      .then(setImages)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleDeploy(id: string) {
    setDeploying(d => ({ ...d, [id]: true }))
    try {
      const res = await api.images.deploy(id)
      setDeployed(d => ({ ...d, [id]: res.nodes }))
    } catch (e: any) {
      alert(e.message)
    } finally {
      setDeploying(d => ({ ...d, [id]: false }))
    }
  }

  if (loading) return <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Carregando...</div>
  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
      Erro ao conectar com o controller: <span className="font-mono">{error}</span>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-700">
        Images are base cloud OS images (qcow2) stored in <span className="font-mono">/var/lib/rigstack/base/</span> on each node.
        Click <strong>Deploy to nodes</strong> to download an image to all healthy nodes automatically.
      </div>

      <div className="grid grid-cols-1 gap-3">
        {images.map(img => {
          const colorClass = OS_COLORS[img.os] ?? 'bg-slate-50 border-slate-200 text-slate-700'
          const isDeploying = deploying[img.id]
          const deployedNodes = deployed[img.id]

          return (
            <div key={img.id} className="bg-white rounded-lg border border-slate-200 p-5 flex items-center gap-5">
              <div className={`border rounded-lg px-3 py-2 text-xs font-semibold flex-shrink-0 ${colorClass}`}>
                {img.os}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-800 text-sm">{img.name}</h3>
                  <span className="text-xs text-slate-400 font-mono">v{img.version}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">{img.id}.qcow2 · ~{img.size_gb} GB</p>
                {deployedNodes && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs text-emerald-600">
                      Queued on: {deployedNodes.join(', ')}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-slate-400 font-mono hidden lg:block truncate max-w-xs">{img.url.split('/').pop()}</span>
                <button
                  onClick={() => handleDeploy(img.id)}
                  disabled={isDeploying}
                  className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-colors"
                >
                  {isDeploying
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Deploying...</>
                    : <><Download className="w-3.5 h-3.5" /> Deploy to nodes</>}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <HardDrive className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">Manual download</span>
        </div>
        <p className="text-xs text-slate-500 mb-2">Run on each node to download images manually:</p>
        <pre className="bg-slate-900 text-emerald-400 text-xs rounded-lg p-3 overflow-x-auto font-mono">
{`sudo mkdir -p /var/lib/rigstack/base

# Ubuntu 24.04
wget https://cloud-images.ubuntu.com/noble/current/noble-server-cloudimg-amd64.img \\
  -O /var/lib/rigstack/base/ubuntu-24.04.qcow2

# Debian 13
wget https://cloud.debian.org/images/cloud/trixie/latest/debian-13-genericcloud-amd64.qcow2 \\
  -O /var/lib/rigstack/base/debian-13.qcow2

# Debian 12
wget https://cloud.debian.org/images/cloud/bookworm/latest/debian-12-genericcloud-amd64.qcow2 \\
  -O /var/lib/rigstack/base/debian-12.qcow2`}
        </pre>
      </div>
    </div>
  )
}
