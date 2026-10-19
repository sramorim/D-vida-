'use client'

import { useState, useCallback } from 'react'
import { Search, Send, ExternalLink, AlertTriangle, User, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TelegramData {
  username: string
  exists: boolean
  first_name?: string
  last_name?: string
  bio?: string
  profile_url?: string
  photo_url?: string
}

export function ShTelegramOsint() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<TelegramData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const res = await fetch('/api/telegram-osint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: query }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
      } else {
        setError(json.error || 'Erro ao verificar usuário no Telegram')
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
            <Send size={16} className="text-[#00E5FF]" />
          </div>
          <div>
            <div className="text-[13px] font-black text-white/90">Telegram OSINT</div>
            <div className="text-[10px] text-white/35">Verificar informações de perfil do Telegram</div>
          </div>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="username do Telegram (sem @)"
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
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Send size={14} className="text-[#00E5FF]" />
            <div className="text-[11px] font-black tracking-widest uppercase text-white/40">
              Resultado
            </div>
          </div>

          {data.exists ? (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-[12px] bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 overflow-hidden">
                  {data.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={data.photo_url} alt={data.username} className="h-full w-full object-cover" />
                  ) : (
                    <User size={24} className="text-[#00E5FF]/40" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-bold text-white/90">
                    {data.first_name || ''} {data.last_name || ''}
                  </div>
                  <div className="text-[11px] text-white/40 font-mono">@{data.username}</div>
                  {data.bio && (
                    <p className="mt-2 text-[11px] text-white/50 leading-relaxed">{data.bio}</p>
                  )}
                </div>
              </div>

              <a
                href={data.profile_url || `https://t.me/${data.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-[10px] bg-[#00E5FF]/10 border border-[#00E5FF]/15 px-4 py-2.5 text-[11px] font-bold text-[#00E5FF]/80 uppercase tracking-wider transition-all hover:bg-[#00E5FF]/20 hover:text-[#00E5FF]"
              >
                Abrir no Telegram
                <ExternalLink size={12} />
              </a>
            </div>
          ) : (
            <div className="text-center py-6">
              <User size={32} className="mx-auto text-[#FF3B3B]/30 mb-3" />
              <div className="text-[12px] text-[#FF3B3B]/70">
                Usuário <span className="font-mono">@{data.username}</span> não encontrado no Telegram
              </div>
            </div>
          )}
        </div>
      )}

      {!data && !loading && !error && (
        <div className="card text-center py-8">
          <Send size={32} className="mx-auto text-white/10 mb-3" />
          <div className="text-[12px] text-white/35">Digite um username do Telegram para verificar</div>
        </div>
      )}
    </div>
  )
}
