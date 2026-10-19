'use client'

import { useState, useCallback } from 'react'
import { Search, Mail, AlertTriangle, Globe, Clock, Shield, User, Server, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuthResult {
  protocol: string
  result: string
  details?: string
}

interface EmailHeaderData {
  origin_ip: string
  forwarding_path: string[]
  timestamps: string[]
  auth_results: AuthResult[]
  client_software: string
  subject?: string
  from?: string
  to?: string
}

export function ShEmailHeader() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<EmailHeaderData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const res = await fetch('/api/email-header', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ header: query }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
      } else {
        setError(json.error || 'Erro ao analisar cabeçalho de e-mail')
      }
    } catch {
      setError('Erro de conexão')
    }
    setLoading(false)
  }, [query])

  const getAuthBadge = (result: string) => {
    if (result.toLowerCase().includes('pass')) return 'badge-neon'
    if (result.toLowerCase().includes('fail')) return 'badge-danger'
    return 'badge-amber'
  }

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#00E5FF]/10 border border-[#00E5FF]/20">
            <Mail size={16} className="text-[#00E5FF]" />
          </div>
          <div>
            <div className="text-[13px] font-black text-white/90">Email Header Analyzer</div>
            <div className="text-[10px] text-white/35">Analisar cabeçalho de e-mail para rastrear origem</div>
          </div>
        </div>

        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cole o cabeçalho do e-mail aqui...&#10;&#10;Exemplo:&#10;Received: from mail.example.com...&#10;From: sender@example.com&#10;Subject: ..."
          className="w-full px-4 py-3 rounded-[14px] bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/25 font-mono text-[12px] leading-relaxed focus:outline-none focus:border-[#00E5FF]/40 focus:ring-1 focus:ring-[#00E5FF]/20 transition-all min-h-[140px] resize-y"
        />

        <button
          onClick={handleSearch}
          disabled={!query.trim() || loading}
          className={cn('btn-primary mt-3 w-full flex items-center justify-center gap-2')}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          {loading ? 'Analisando...' : 'Analisar'}
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
              <Globe size={14} className="text-[#00E5FF]" />
              <div className="text-[11px] font-black tracking-widest uppercase text-white/40">
                Origem e Roteamento
              </div>
            </div>

            <div className="space-y-3">
              <div className="result-item">
                <Globe size={14} className="text-[#00E5FF] shrink-0" />
                <div>
                  <div className="text-[10px] text-white/30 uppercase tracking-wider">IP de Origem</div>
                  <div className="text-[12px] font-mono text-[#00E5FF]">{data.origin_ip}</div>
                </div>
              </div>

              {data.client_software && (
                <div className="result-item">
                  <Server size={14} className="text-[#22FF88] shrink-0" />
                  <div>
                    <div className="text-[10px] text-white/30 uppercase tracking-wider">Software do Cliente</div>
                    <div className="text-[12px] font-mono text-white/70">{data.client_software}</div>
                  </div>
                </div>
              )}

              {data.from && (
                <div className="result-item">
                  <User size={14} className="text-white/30 shrink-0" />
                  <div>
                    <div className="text-[10px] text-white/30 uppercase tracking-wider">De</div>
                    <div className="text-[12px] font-mono text-white/70">{data.from}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {data.forwarding_path.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Globe size={14} className="text-[#22FF88]" />
                <div className="text-[11px] font-black tracking-widest uppercase text-white/40">
                  Caminho de Encaminhamento
                </div>
              </div>

              <div className="space-y-2">
                {data.forwarding_path.map((hop, i) => (
                  <div key={i} className="result-item">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#00E5FF]/10 text-[10px] font-bold text-[#00E5FF]">
                      {i + 1}
                    </div>
                    <div className="text-[11px] font-mono text-white/60 truncate">{hop}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.timestamps.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={14} className="text-[#00E5FF]" />
                <div className="text-[11px] font-black tracking-widest uppercase text-white/40">
                  Timestamps
                </div>
              </div>

              <div className="space-y-1.5">
                {data.timestamps.map((ts, i) => (
                  <div key={i} className="result-item">
                    <Clock size={10} className="text-white/20 shrink-0" />
                    <div className="text-[11px] font-mono text-white/50">{ts}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.auth_results.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Shield size={14} className="text-[#22FF88]" />
                <div className="text-[11px] font-black tracking-widest uppercase text-white/40">
                  Autenticação
                </div>
              </div>

              <div className="space-y-2">
                {data.auth_results.map((auth, i) => (
                  <div key={i} className="result-item">
                    <Shield size={14} className="text-[#00E5FF] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-bold text-white/80">{auth.protocol}</div>
                      {auth.details && (
                        <div className="text-[10px] text-white/30 mt-0.5">{auth.details}</div>
                      )}
                    </div>
                    <span className={cn(getAuthBadge(auth.result))}>{auth.result}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!data && !loading && !error && (
        <div className="card text-center py-8">
          <Mail size={32} className="mx-auto text-white/10 mb-3" />
          <div className="text-[12px] text-white/35">Cole o cabeçalho de um e-mail para analisar</div>
        </div>
      )}
    </div>
  )
}
