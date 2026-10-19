'use client'

import { useState, useCallback } from 'react'
import { Search, Shield, ExternalLink, AlertTriangle, Server, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Issuer {
  name: string
  count: number
}

interface Certificate {
  domain: string
  issuer: string
  not_before: string
  not_after: string
}

interface SslData {
  domain: string
  total_certs: number
  unique_subdomains: number
  issuers: Issuer[]
  certificates: Certificate[]
}

export function ShSslTracker() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<SslData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const res = await fetch('/api/ssl-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: query }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
      } else {
        setError(json.error || 'Erro ao rastrear certificados SSL')
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
          <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#22FF88]/10 border border-[#22FF88]/20">
            <Shield size={16} className="text-[#22FF88]" />
          </div>
          <div>
            <div className="text-[13px] font-black text-white/90">SSL Certificate Tracker</div>
            <div className="text-[10px] text-white/35">Rastrear certificados SSL de um domínio</div>
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
          {loading ? 'Rastreando...' : 'Rastrear'}
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
              <Shield size={14} className="text-[#22FF88]" />
              <div className="text-[11px] font-black tracking-widest uppercase text-white/40">
                Resumo de {data.domain}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="rounded-[12px] bg-white/[0.04] p-4 text-center">
                <div className="text-[10px] text-white/30 uppercase tracking-wider">Total de Certs</div>
                <div className="mt-1 text-[20px] font-black text-[#00E5FF]">{data.total_certs}</div>
              </div>
              <div className="rounded-[12px] bg-white/[0.04] p-4 text-center">
                <div className="text-[10px] text-white/30 uppercase tracking-wider">Subdomínios Únicos</div>
                <div className="mt-1 text-[20px] font-black text-[#22FF88]">{data.unique_subdomains}</div>
              </div>
            </div>

            {data.issuers.length > 0 && (
              <div>
                <div className="text-[10px] font-bold tracking-widest uppercase text-white/30 mb-2">
                  Emissores
                </div>
                <div className="space-y-1.5">
                  {data.issuers.map((issuer) => (
                    <div key={issuer.name} className="result-item">
                      <Server size={12} className="text-[#00E5FF] shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] text-white/70 truncate">{issuer.name}</div>
                      </div>
                      <span className="badge-cyan">{issuer.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {data.certificates.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Shield size={14} className="text-[#00E5FF]" />
                <div className="text-[11px] font-black tracking-widest uppercase text-white/40">
                  Timeline de Certificados
                </div>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {data.certificates.map((cert, i) => (
                  <div key={i} className="result-item group">
                    <div className="flex h-2 w-2 shrink-0 rounded-full bg-[#22FF88]/50" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-mono text-white/80 truncate">{cert.domain}</div>
                      <div className="text-[10px] text-white/30">
                        {cert.not_before} → {cert.not_after}
                      </div>
                      <div className="text-[10px] text-white/40">{cert.issuer}</div>
                    </div>
                    <a
                      href={`https://crt.sh/?q=${encodeURIComponent(cert.domain)}`}
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
          <Shield size={32} className="mx-auto text-white/10 mb-3" />
          <div className="text-[12px] text-white/35">Digite um domínio para rastrear certificados SSL</div>
        </div>
      )}
    </div>
  )
}
