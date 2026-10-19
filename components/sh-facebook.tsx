'use client'

import { useState, useCallback } from 'react'
import { Facebook, Search, ChevronRight, ExternalLink, Users, Globe, Loader2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FacebookResult {
  username: string
  name: string
  bio: string
  followers: string
  following: string
  posts: string
  verified: boolean
  url: string
  avatar: string
  location: string
  website: string
}

export function ShFacebook() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<FacebookResult | null>(null)
  const [error, setError] = useState('')

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/facebook/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: query.replace('@', '').trim() }),
      })
      const data = await res.json()
      if (data.success && data.result) {
        setResult(data.result)
      } else {
        setError(data.error || 'Perfil não encontrado ou privado')
      }
    } catch {
      setError('Erro ao buscar perfil')
    } finally {
      setLoading(false)
    }
  }, [query])

  return (
    <div className="space-y-5">
      <div className="rounded-[20px] border border-white/[0.06] bg-[#0F121A] p-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Facebook size={18} className="text-blue-500/60" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/40">
              Facebook · Perfil Público
            </span>
          </div>
          <p className="text-[12px] text-white/35">Dados públicos de perfis do Facebook</p>
        </div>

        <div className="mt-5">
          <div className="text-[10px] font-bold tracking-widest uppercase text-white/25 mb-2">
            Username do Facebook
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="nome.do.usuario ou URL completa"
              className="w-full rounded-[14px] bg-white/[0.04] border border-white/[0.08] pl-11 pr-4 py-3.5 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all font-mono"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!query.trim() || loading}
            className={cn(
              'mt-3 w-full flex items-center justify-center gap-2 rounded-[12px] py-3 text-[12px] font-black tracking-widest uppercase transition-all',
              query.trim() && !loading
                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20 hover:bg-blue-500/25'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            )}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <>Buscar <ChevronRight size={14} /></>}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-[16px] border border-red-500/20 bg-red-500/5 p-4 flex items-start gap-3">
          <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <span className="text-[12px] text-red-300">{error}</span>
        </div>
      )}

      {result && (
        <div className="rounded-[20px] border border-white/[0.06] bg-[#0F121A] p-6 space-y-4">
          <div className="flex items-center gap-4">
            {result.avatar && (
              <img src={result.avatar} alt={result.name} className="h-16 w-16 rounded-full border border-white/10" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-black text-white/90">{result.name}</span>
                {result.verified && <span className="text-blue-400 text-[10px]">✓ Verificado</span>}
              </div>
              <div className="text-[12px] text-white/40 font-mono">@{result.username}</div>
            </div>
          </div>

          {result.bio && (
            <div className="rounded-[12px] bg-white/[0.03] border border-white/[0.04] p-4">
              <div className="text-[10px] font-bold tracking-widest uppercase text-white/25 mb-1">Bio</div>
              <div className="text-[12px] text-white/60">{result.bio}</div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Seguidores', value: result.followers },
              { label: 'Seguindo', value: result.following },
              { label: 'Posts', value: result.posts },
            ].map((stat) => (
              <div key={stat.label} className="rounded-[12px] bg-white/[0.03] border border-white/[0.04] p-3 text-center">
                <div className="text-[10px] font-bold tracking-widest uppercase text-white/25">{stat.label}</div>
                <div className="text-[14px] font-black text-white/80 mt-1">{stat.value || '—'}</div>
              </div>
            ))}
          </div>

          {result.location && (
            <div className="flex items-center gap-2 text-[11px] text-white/40">
              <Globe size={12} /> {result.location}
            </div>
          )}

          <a
            href={result.url || `https://facebook.com/${result.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-[12px] bg-blue-500/10 border border-blue-500/20 py-3 text-[12px] font-bold text-blue-400 hover:bg-blue-500/20 transition-all"
          >
            <ExternalLink size={14} /> Abrir no Facebook
          </a>
        </div>
      )}

      {!result && !error && !loading && (
        <div className="rounded-[16px] border border-white/[0.04] bg-white/[0.02] p-5 text-center">
          <Users size={20} className="mx-auto text-white/15 mb-2" />
          <p className="text-[11px] text-white/30">Digite um username para buscar dados públicos</p>
        </div>
      )}
    </div>
  )
}
