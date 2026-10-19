'use client'

import { useState, useCallback } from 'react'
import { GitCompare, Search, ChevronRight, Loader2, AlertTriangle, User, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CompareResult {
  username: string
  name: string
  bio: string
  followers: number
  following: number
  posts: number
  avatar: string
  verified: boolean
  location: string
  platform: string
}

export function ShComparador() {
  const [query1, setQuery1] = useState('')
  const [query2, setQuery2] = useState('')
  const [loading, setLoading] = useState(false)
  const [result1, setResult1] = useState<CompareResult | null>(null)
  const [result2, setResult2] = useState<CompareResult | null>(null)
  const [error, setError] = useState('')

  const handleCompare = useCallback(async () => {
    if (!query1.trim() || !query2.trim()) return
    setLoading(true)
    setError('')
    setResult1(null)
    setResult2(null)

    try {
      const [res1, res2] = await Promise.all([
        fetch('/api/search/username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target: query1.replace('@', '').trim() }),
        }),
        fetch('/api/search/username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target: query2.replace('@', '').trim() }),
        }),
      ])
      const [data1, data2] = await Promise.all([res1.json(), res2.json()])

      if (data1.success && data1.results?.length > 0) {
        setResult1(data1.results[0])
      } else {
        setError(`Perfil "${query1}" não encontrado`)
        return
      }
      if (data2.success && data2.results?.length > 0) {
        setResult2(data2.results[0])
      } else {
        setError(`Perfil "${query2}" não encontrado`)
      }
    } catch {
      setError('Erro ao buscar perfis')
    } finally {
      setLoading(false)
    }
  }, [query1, query2])

  const diff = result1 && result2 ? {
    followers: (result1.followers || 0) - (result2.followers || 0),
    following: (result1.following || 0) - (result2.following || 0),
    posts: (result1.posts || 0) - (result2.posts || 0),
  } : null

  return (
    <div className="space-y-5">
      <div className="rounded-[20px] border border-white/[0.06] bg-[#0F121A] p-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <GitCompare size={18} className="text-neon/60" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/40">
              Comparador de Perfis
            </span>
          </div>
          <p className="text-[12px] text-white/35">Compare dois perfis lado a lado</p>
        </div>

        <div className="mt-5 space-y-3">
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase text-white/25 mb-2">Perfil 1</div>
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                type="text"
                value={query1}
                onChange={(e) => setQuery1(e.target.value)}
                placeholder="@username primeiro perfil"
                className="w-full rounded-[14px] bg-white/[0.04] border border-white/[0.08] pl-11 pr-4 py-3 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-neon/40 transition-all font-mono"
              />
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase text-white/25 mb-2">Perfil 2</div>
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                type="text"
                value={query2}
                onChange={(e) => setQuery2(e.target.value)}
                placeholder="@username segundo perfil"
                className="w-full rounded-[14px] bg-white/[0.04] border border-white/[0.08] pl-11 pr-4 py-3 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-neon/40 transition-all font-mono"
              />
            </div>
          </div>
          <button
            onClick={handleCompare}
            disabled={!query1.trim() || !query2.trim() || loading}
            className={cn(
              'w-full flex items-center justify-center gap-2 rounded-[12px] py-3 text-[12px] font-black tracking-widest uppercase transition-all',
              query1.trim() && query2.trim() && !loading
                ? 'bg-neon/15 text-neon border border-neon/20 hover:bg-neon/25'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            )}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <>Comparar <ChevronRight size={14} /></>}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-[16px] border border-red-500/20 bg-red-500/5 p-4 flex items-start gap-3">
          <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <span className="text-[12px] text-red-300">{error}</span>
        </div>
      )}

      {result1 && result2 && (
        <div className="rounded-[20px] border border-white/[0.06] bg-[#0F121A] p-6 space-y-4">
          <div className="text-[10px] font-black tracking-[0.2em] uppercase text-white/40 flex items-center gap-2">
            <BarChart3 size={14} /> Resultado da Comparação
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[result1, result2].map((r, i) => (
              <div key={i} className="rounded-[12px] bg-white/[0.03] border border-white/[0.04] p-4 text-center">
                <div className="flex justify-center mb-2">
                  {r.avatar ? (
                    <img src={r.avatar} alt={r.name} className="h-12 w-12 rounded-full border border-white/10" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-white/[0.05] flex items-center justify-center">
                      <User size={20} className="text-white/20" />
                    </div>
                  )}
                </div>
                <div className="text-[12px] font-bold text-white/80 truncate">{r.name}</div>
                <div className="text-[10px] text-white/40 font-mono">@{r.username}</div>
              </div>
            ))}
            <div className="rounded-[12px] bg-neon/[0.03] border border-neon/10 p-4 text-center">
              <div className="text-[10px] font-bold tracking-widest uppercase text-neon/60 mb-2">Diferença</div>
              <div className="space-y-2 text-[11px]">
                <div>
                  <span className="text-white/40">Followers: </span>
                  <span className={cn('font-bold', diff!.followers > 0 ? 'text-green-400' : diff!.followers < 0 ? 'text-red-400' : 'text-white/60')}>
                    {diff!.followers > 0 ? '+' : ''}{diff!.followers}
                  </span>
                </div>
                <div>
                  <span className="text-white/40">Following: </span>
                  <span className={cn('font-bold', diff!.following > 0 ? 'text-green-400' : diff!.following < 0 ? 'text-red-400' : 'text-white/60')}>
                    {diff!.following > 0 ? '+' : ''}{diff!.following}
                  </span>
                </div>
                <div>
                  <span className="text-white/40">Posts: </span>
                  <span className={cn('font-bold', diff!.posts > 0 ? 'text-green-400' : diff!.posts < 0 ? 'text-red-400' : 'text-white/60')}>
                    {diff!.posts > 0 ? '+' : ''}{diff!.posts}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
