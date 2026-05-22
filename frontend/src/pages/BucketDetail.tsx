import { useParams, Link } from 'react-router-dom'
import { Package, Folder, FileText, ArrowLeft, Upload, Trash2, Download } from 'lucide-react'
import { buckets, bucketObjects } from '../data/mock'

export function BucketDetail() {
  const { id } = useParams<{ id: string }>()
  const bucket = buckets.find(b => b.id === id)
  const objects = bucketObjects[id ?? ''] ?? []

  if (!bucket) return (
    <div className="text-center py-16 text-slate-400 text-sm">Bucket não encontrado.</div>
  )

  const folders = objects.filter(o => o.type === 'folder')
  const files = objects.filter(o => o.type === 'file')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          to="../storage"
          relative="path"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Buckets
        </Link>
        <span className="text-slate-300 text-xs">/</span>
        <span className="text-slate-700 text-xs font-medium">{bucket.name}</span>
        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors">
            <Upload className="w-4 h-4" /> Upload
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <Package className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium text-slate-700">{bucket.name}</span>
          <span className="text-xs text-slate-400">{bucket.size} · {bucket.objects.toLocaleString()} objects</span>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-4 py-2.5 text-slate-500 font-medium text-xs">Name</th>
              <th className="text-left px-4 py-2.5 text-slate-500 font-medium text-xs">Size</th>
              <th className="text-left px-4 py-2.5 text-slate-500 font-medium text-xs">Last Modified</th>
              <th className="text-left px-4 py-2.5 text-slate-500 font-medium text-xs">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {folders.map(obj => (
              <tr key={obj.key} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="text-slate-700 text-sm font-medium">{obj.key}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-slate-400 text-xs">—</td>
                <td className="px-4 py-2.5 text-slate-400 text-xs">{obj.lastModified}</td>
                <td className="px-4 py-2.5" />
              </tr>
            ))}
            {files.map(obj => (
              <tr key={obj.key} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-700 text-sm">{obj.key.split('/').pop()}</span>
                    {obj.key.includes('/') && (
                      <span className="text-slate-300 text-xs font-mono">{obj.key.substring(0, obj.key.lastIndexOf('/') + 1)}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-slate-500 text-xs">{obj.size}</td>
                <td className="px-4 py-2.5 text-slate-400 text-xs">{obj.lastModified}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="Download">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
