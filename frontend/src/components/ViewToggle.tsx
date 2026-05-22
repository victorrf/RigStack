import { LayoutGrid, List } from 'lucide-react'

interface ViewToggleProps {
  mode: 'grid' | 'list'
  onChange: (mode: 'grid' | 'list') => void
}

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div className="flex border border-slate-200 rounded overflow-hidden bg-white">
      <button
        onClick={() => onChange('list')}
        title="Visualização em lista"
        className={`p-1.5 transition-colors ${mode === 'list' ? 'bg-orange-50 text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
      >
        <List className="w-4 h-4" />
      </button>
      <button
        onClick={() => onChange('grid')}
        title="Visualização em grade"
        className={`p-1.5 border-l border-slate-200 transition-colors ${mode === 'grid' ? 'bg-orange-50 text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
    </div>
  )
}
