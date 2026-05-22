import { useState } from 'react'

export function useViewMode(key: string, defaultMode: 'grid' | 'list' = 'list') {
  const [mode, setMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem(`rigstack:view:${key}`) as 'grid' | 'list') ?? defaultMode
  })

  function change(newMode: 'grid' | 'list') {
    setMode(newMode)
    localStorage.setItem(`rigstack:view:${key}`, newMode)
  }

  return [mode, change] as const
}
