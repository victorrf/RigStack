import { useEffect, useState, type ReactNode } from 'react'
import { Server } from 'lucide-react'

const MESSAGES = [
  'Inicializando ambiente...',
  'Conectando ao controller...',
  'Preparando os serviços...',
  'Verificando banco de dados...',
  'Quase lá...',
]

export function HealthGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [msgIndex, setMsgIndex] = useState(0)
  const [dots, setDots] = useState('')

  useEffect(() => {
    let cancelled = false

    async function poll() {
      while (!cancelled) {
        try {
          const res = await fetch('/api/v1/health')
          if (res.ok) {
            if (!cancelled) setReady(true)
            return
          }
        } catch {
          // controller ainda não está pronto
        }
        await new Promise(r => setTimeout(r, 2000))
      }
    }

    poll()
    return () => { cancelled = true }
  }, [])

  // Alterna a mensagem a cada 3s
  useEffect(() => {
    if (ready) return
    const t = setInterval(() => setMsgIndex(i => (i + 1) % MESSAGES.length), 3000)
    return () => clearInterval(t)
  }, [ready])

  // Anima os "..."
  useEffect(() => {
    if (ready) return
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500)
    return () => clearInterval(t)
  }, [ready])

  if (ready) return <>{children}</>

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-8">
      {/* Logo / ícone */}
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
          <Server className="w-9 h-9 text-orange-500" />
        </div>
        {/* Anel pulsante */}
        <span className="absolute inset-0 rounded-2xl border border-orange-500/40 animate-ping" />
      </div>

      {/* Barra de progresso indeterminada */}
      <div className="w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-orange-500 rounded-full animate-[loading_1.4s_ease-in-out_infinite]" />
      </div>

      {/* Texto */}
      <div className="text-center space-y-1.5">
        <p className="text-slate-200 text-sm font-medium">
          {MESSAGES[msgIndex]}<span className="text-orange-400">{dots}</span>
        </p>
        <p className="text-slate-500 text-xs">RigStack está inicializando</p>
      </div>
    </div>
  )
}
