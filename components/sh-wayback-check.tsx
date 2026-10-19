'use client'

import { useState, useCallback } from 'react'
import { Search, Clock, ExternalLink, AlertTriangle, Calendar, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Snapshot {
  timestamp: string
  url: string
  status?: string
}

interface WaybackData {
  url: string
  total_snapshots: number
  oldest: string
  newest: string
  snapshots: Snapshot[]
}

export function ShWaybackCheck() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<WaybackData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const res = await fetch('/api/wayback-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: query }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
      } else {
        setError(json.error || 'Erro ao verificar Wayback Machine')
      }
    } catch {
      setError('Erro de conexão')
    }
    setLoading(false)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#00E5FF]/10 border border-[#00E5FF]/20">
            <Clock size={16} className="text-[#00E5FF]" />
          </div>
          <div>
            <div className="text-[13px] font-black text-white/90">Wayback Machine</div>
            <div className="text-[10px] text-white/35">Verificar snapshots históricos de uma URL</div>
          </div>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://exemplo.com"
            className="input-field pl-11"
          />
        </div>

        <button
          onClick={handleSearch}
          disabled={!query.trim() || loading}
          className={cn('btn-primary mt-3 w-full flex items-center justify-center gap-2')}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          {loading ? 'Verificando...' : 'Verificar'}
        </button>
      </div>

      {error && (
        <div className="card border-[#FF3B3B]/20">
          <div className="flex items-center gap-3">
            <AlertTriangle size={16} className="text-[#FF3B3B] shrink-0" />
            <div className="text-[12px] text-[#FF3B3B]">{error}</div>
          </div>
        </div>
      )}

      {data && (
        <>
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={14} className="text-[#00E5FF]" />
              <div className="text-[11px] font-black tracking-widest uppercase text-white/40">
                Resumo
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-[12px] bg-white/[0.04] p-4 text-center">
                <div className="text-[10px] text-white/30 uppercase tracking-wider">Total de Snapshots</div>
                <div className="mt-1 text-[20px] font-black text-[#00E5FF]">{data.total_snapshots}</div>
              </div>
              <div className="rounded-[12px] bg-white/[0.04] p-4 text-center">
                <div className="text-[10px] text-white/30 uppercase tracking-wider">Mais Antigo</div>
                <div className="mt-1 text-[12px] font-bold text-white/70">{data.oldest}</div>
              </div>
              <div className="rounded-[12px] bg-white/[0.04] p-4 text-center">
                <div className="text-[10px] text-white/30 uppercase tracking-wider">Mais Recente</div>
                <div className="mt-1 text-[12px] font-bold text-white/70">{data.newest}</div>
              </div>
            </div>
          </div>

          {data.snapshots.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={14} className="text-[#22FF88]" />
                <div className="text-[11px] font-black tracking-widest uppercase text-white/40">
                  Timeline
                </div>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {data.snapshots.map((snap, i) => (
                  <div key={i} className="result-item group">
                    <div className="flex h-2 w-2 shrink-0 rounded-full bg-[#00E5FF]/50" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-mono text-white/70">{snap.timestamp}</div>
                      {snap.status && (
                        <div className="text-[10px] text-white/30">{snap.status}</div>
                      )}
                    </div>
                    <a
                      href={snap.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 p-1.5 rounded-[6px] bg-white/[0.04] text-white/40 hover:text-[#00E5FF] hover:bg-[#00E5FF]/10 transition-all opacity-60 group-hover:opacity-100"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!data && !loading && !error && (
        <div className="card text-center py-8">
          <Clock size={32} className="mx-auto text-white/10 mb-3" />
          <div className="text-[12px] text-white/35">Digite uma URL para verificar snapshots históricos</div>
        </div>
      )}
    </div>
  )
}
