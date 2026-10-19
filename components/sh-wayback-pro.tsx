'use client'

import { Globe, Search, Loader2 } from 'lucide-react'
import { useState } from 'react'

export function ShWaybackPro() {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!domain.trim()) return
    setLoading(true)
    setError('')
    setResults([])

    try {
      const res = await fetch('/api/premium/advanced/wayback-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim() }),
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
          <Globe size={14} className="text-green-400" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-green-400/60">Wayback Pro</span>
        </div>
        <h2 className="text-[20px] font-black text-white/90">Wayback Machine Pro</h2>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full rounded-[10px] border border-white/[0.08] bg-white/[0.03] py-2.5 pl-9 pr-3 text-[13px] text-white/80 placeholder:text-white/20 focus:border-green-500/30 focus:outline-none"
            placeholder="exemplo.com"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !domain.trim()}
          className="flex items-center gap-2 rounded-[10px] bg-green-500/20 border border-green-500/30 px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase text-green-400 hover:bg-green-500/30 disabled:opacity-40"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          Buscar
        </button>
      </form>

      {error && <div className="rounded-[12px] bg-red-500/10 border border-red-500/20 p-4 text-[12px] text-red-400">{error}</div>}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((r: any, i: number) => (
            <a
              key={i}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-[12px] border border-green-500/10 bg-[#0F121A] p-4 hover:border-green-500/30 transition-all"
            >
              <div className="text-[11px] font-mono text-green-400/80">{r.timestamp || r.date}</div>
              <div className="text-[12px] text-white/60 mt-1 truncate">{r.url}</div>
              {r.status && <div className="text-[10px] text-white/30 mt-1">Status: {r.status}</div>}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
