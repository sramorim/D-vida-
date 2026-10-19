'use client'

import { useState, useCallback } from 'react'
import { Search, Globe, ExternalLink, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Subdomain {
  subdomain: string
  status: 'active' | 'inactive' | 'unknown'
  url?: string
}

interface SubdomainData {
  domain: string
  subdomains: Subdomain[]
  total: number
}

export function ShSubdomainFinder() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<SubdomainData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const res = await fetch('/api/subdomain-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: query }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
      } else {
        setError(json.error || 'Erro ao buscar subdomínios')
      }
    } catch {
      setError('Erro de conexão')
    }
    setLoading(false)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="badge-neon">Ativo</span>
      case 'inactive':
        return <span className="badge-danger">Inativo</span>
      default:
        return <span className="badge-cyan">Desconhecido</span>
    }
  }

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#22FF88]/10 border border-[#22FF88]/20">
            <Globe size={16} className="text-[#22FF88]" />
          </div>
          <div>
            <div className="text-[13px] font-black text-white/90">Subdomain Finder</div>
            <div className="text-[10px] text-white/35">Encontrar subdomínios de um domínio</div>
          </div>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="exemplo.com"
            className="input-field pl-11"
          />
        </div>

        <button
          onClick={handleSearch}
          disabled={!query.trim() || loading}
          className={cn('btn-primary mt-3 w-full flex items-center justify-center gap-2')}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          {loading ? 'Buscando...' : 'Buscar'}
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
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[11px] font-black tracking-widest uppercase text-white/40">
              {data.total} subdomínios encontrados
            </div>
            <div className="text-[10px] text-white/30">{data.domain}</div>
          </div>

          <div className="space-y-2">
            {data.subdomains.map((sub) => (
              <div key={sub.subdomain} className="result-item group">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-white/[0.04]">
                  {sub.status === 'active' ? (
                    <CheckCircle size={14} className="text-[#22FF88]" />
                  ) : sub.status === 'inactive' ? (
                    <XCircle size={14} className="text-[#FF3B3B]" />
                  ) : (
                    <Globe size={14} className="text-white/30" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-mono text-white/80 truncate">{sub.subdomain}</div>
                </div>
                {getStatusBadge(sub.status)}
                {sub.url && (
                  <a
                    href={sub.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 p-1.5 rounded-[6px] bg-white/[0.04] text-white/40 hover:text-[#00E5FF] hover:bg-[#00E5FF]/10 transition-all opacity-60 group-hover:opacity-100"
                  >
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!data && !loading && !error && (
        <div className="card text-center py-8">
          <Globe size={32} className="mx-auto text-white/10 mb-3" />
          <div className="text-[12px] text-white/35">Digite um domínio para buscar subdomínios</div>
        </div>
      )}
    </div>
  )
}
