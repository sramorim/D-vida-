'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock, Trash2, Search, Loader2, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SnapshotEntry {
  id: string
  username: string
  platform: string
  timestamp: string
  followers: number
  following: number
  posts: number
  bio: string
}

export function ShRadarHistorico() {
  const [history, setHistory] = useState<SnapshotEntry[]>([])
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('shandon-history') : null
    if (saved) {
      try { setHistory(JSON.parse(saved)) } catch { /* ignore */ }
    }
  }, [])

  const handleSearch = useCallback(async () => {
    if (!username.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.replace('@', '').trim(), action: 'capture' }),
      })
      const data = await res.json()
      if (data.success && data.snapshot) {
        const entry: SnapshotEntry = {
          id: crypto.randomUUID(),
          username: username.replace('@', '').trim(),
          platform: 'instagram',
          timestamp: new Date().toISOString(),
          followers: data.snapshot.followers || 0,
          following: data.snapshot.following || 0,
          posts: data.snapshot.posts || 0,
          bio: data.snapshot.bio || '',
        }
        const updated = [entry, ...history]
        setHistory(updated)
        localStorage.setItem('shandon-history', JSON.stringify(updated))
      }
    } catch { /* ignore */ }
    setLoading(false)
    setUsername('')
  }, [username, history])

  const handleClear = useCallback(() => {
    setHistory([])
    localStorage.removeItem('shandon-history')
  }, [])

  const groupedByUser = history.reduce<Record<string, SnapshotEntry[]>>((acc, entry) => {
    if (!acc[entry.username]) acc[entry.username] = []
    acc[entry.username].push(entry)
    return acc
  }, {})

  const getDiff = (current: SnapshotEntry, previous: SnapshotEntry | undefined) => {
    if (!previous) return null
    return {
      followers: current.followers - previous.followers,
      following: current.following - previous.following,
      posts: current.posts - previous.posts,
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[20px] border border-white/[0.06] bg-[#0F121A] p-6">
        <div className="text-center mb-5">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock size={18} className="text-neon/60" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/40">
              Histórico de Snapshots
            </span>
          </div>
          <p className="text-[12px] text-white/35">Acompanhe a evolução de perfis ao longo do tempo</p>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="username para capturar snapshot"
              className="w-full rounded-[10px] bg-white/[0.04] border border-white/[0.08] pl-9 pr-3 py-2.5 text-[12px] text-white placeholder:text-white/25 focus:outline-none focus:border-neon/40 transition-all font-mono"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!username.trim() || loading}
            className={cn(
              'flex items-center gap-1.5 rounded-[10px] px-4 py-2.5 text-[11px] font-bold transition-all',
              username.trim() && !loading
                ? 'bg-neon/15 text-neon border border-neon/20 hover:bg-neon/25'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            )}
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : 'Capturar'}
          </button>
          {history.length > 0 && (
            <button
              onClick={handleClear}
              className="rounded-[10px] px-3 py-2.5 text-[11px] text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {Object.keys(groupedByUser).length === 0 ? (
        <div className="rounded-[16px] border border-white/[0.04] bg-white/[0.02] p-8 text-center">
          <Calendar size={24} className="mx-auto text-white/15 mb-3" />
          <p className="text-[12px] text-white/30">Nenhum snapshot capturado ainda</p>
          <p className="text-[10px] text-white/20 mt-1">Capture snapshots para acompanhar mudanças</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByUser).map(([user, entries]) => {
            const latest = entries[0]
            const previous = entries[1]
            const diff = getDiff(latest, previous)
            return (
              <div key={user} className="rounded-[16px] border border-white/[0.06] bg-[#0F121A] p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px] font-bold text-white/80 font-mono">@{user}</span>
                  <span className="text-[9px] text-white/25">{entries.length} snapshots</span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  {[
                    { label: 'Followers', value: latest.followers, delta: diff?.followers },
                    { label: 'Following', value: latest.following, delta: diff?.following },
                    { label: 'Posts', value: latest.posts, delta: diff?.posts },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-[10px] bg-white/[0.03] border border-white/[0.04] p-3 text-center">
                      <div className="text-[9px] font-bold tracking-widest uppercase text-white/25">{stat.label}</div>
                      <div className="text-[14px] font-black text-white/80 mt-1">{stat.value.toLocaleString()}</div>
                      {stat.delta !== undefined && stat.delta !== 0 && (
                        <div className={cn(
                          'flex items-center justify-center gap-1 mt-1 text-[9px] font-bold',
                          stat.delta > 0 ? 'text-green-400' : 'text-red-400'
                        )}>
                          {stat.delta > 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                          {stat.delta > 0 ? '+' : ''}{stat.delta}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="text-[9px] text-white/20 flex items-center gap-1">
                  <Clock size={9} />
                  Último: {new Date(latest.timestamp).toLocaleString('pt-BR')}
                  {previous && ` · Anterior: ${new Date(previous.timestamp).toLocaleString('pt-BR')}`}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
