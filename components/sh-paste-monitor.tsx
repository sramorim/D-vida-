'use client'

import { AlertTriangle, Search, Loader2 } from 'lucide-react'
import { useState } from 'react'

export function ShPasteMonitor() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setResults([])

    try {
      const res = await fetch('/api/premium/darkweb/paste-monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setResults(data.data || [])
      } else {
        setError(data.error || 'Nenhum resultado')
      }
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <AlertTriangle size={14} className="text-amber-400" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-amber-400/60">Paste Monitor</span>
        </div>
        <h2 className="text-[20px] font-black text-white/90">Monitor de Pastas</h2>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-[10px] border border-white/[0.08] bg-white/[0.03] py-2.5 pl-9 pr-3 text-[13px] text-white/80 placeholder:text-white/20 focus:border-amber-500/30 focus:outline-none"
            placeholder="E-mail, domínio ou keyword..."
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="flex items-center gap-2 rounded-[10px] bg-amber-500/20 border border-amber-500/30 px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase text-amber-400 hover:bg-amber-500/30 disabled:opacity-40"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          Monitorar
        </button>
      </form>

      {error && <div className="rounded-[12px] bg-red-500/10 border border-red-500/20 p-4 text-[12px] text-red-400">{error}</div>}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((r: any, i: number) => (
            <div key={i} className="rounded-[12px] border border-amber-500/10 bg-[#0F121A] p-4">
              <div className="text-[11px] font-bold text-amber-400/80">{r.source || 'Paste'}</div>
              <div className="text-[12px] text-white/60 mt-1">{r.content || r.title || JSON.stringify(r)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
