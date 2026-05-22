import { Construction } from 'lucide-react'

interface ComingSoonProps {
  feature: string
}

export function ComingSoon({ feature }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="bg-slate-100 rounded-xl p-4 mb-4">
        <Construction className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-slate-700 font-semibold text-base mb-1">{feature}</h3>
      <p className="text-slate-400 text-sm">This feature is not yet implemented.</p>
      <p className="text-slate-400 text-xs mt-1">
        Try the <a href="/live-demo" className="text-orange-500 hover:underline">live demo</a> to see a preview.
      </p>
    </div>
  )
}
