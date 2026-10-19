'use client'

import { useState } from 'react'
import { Search, Loader2, Users, UserCheck, Image, MessageCircle, Heart, AlertTriangle, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SnapshotStats {
  snapshotId: string
  duration: number
  stats: {
    followers: number
    following: number
    posts: number
  }
}

interface SnapshotData {
  id: string
  targetUsername: string
  timestamp: number
  duration: number
  stats: {
    followers: number
    following: number
    posts: number
  }
  profile: any
  followers: any[]
  following: any[]
  posts: any[]
  analysis: any
}

export function ShInstagramAnalyzer() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SnapshotStats | null>(null)
  const [snapshots, setSnapshots] = useState<any[]>([])
  const [selectedSnapshot, setSelectedSnapshot] = useState<SnapshotData | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const handleAnalyze = async () => {
    if (!username.trim()) return

    const savedSession = localStorage.getItem('shandon_ig_session')
    if (!savedSession) {
      setError('Configure a sessão do Instagram primeiro')
      return
    }

    const session = JSON.parse(savedSession)
    setLoading(true)
    setError(null)
    setResult(null)
    setProgress('Iniciando captura...')

    try {
      const res = await fetch('/api/instagram/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.replace('@', '').trim(),
          cookie: session.cookie,
        }),
      })

      const data = await res.json()

      if (data.success && data.data) {
        setResult(data.data)
        setProgress(null)
        // Refresh snapshots list
        loadSnapshots()
      } else {
        setError(data.error || 'Erro ao criar snapshot')
      }
    } catch (err) {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }

  const loadSnapshots = async () => {
    if (!username.trim()) return
    
    try {
      const res = await fetch(`/api/instagram/snapshot?username=${encodeURIComponent(username.replace('@', ''))}`)
      const data = await res.json()
      if (data.success && data.data) {
        setSnapshots(data.data.snapshots || [])
      }
    } catch {}
  }

  const loadSnapshotDetail = async (id: string) => {
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/instagram/snapshot?id=${id}`)
      const data = await res.json()
      if (data.success && data.data) {
        setSelectedSnapshot(data.data)
      }
    } catch {} finally {
      setLoadingDetail(false)
    }
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString('pt-BR')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E1306C]/10 border border-[#E1306C]/20">
          <Search size={16} className="text-[#E1306C]" />
        </div>
        <div>
          <div className="text-[13px] font-black text-white/90">Instagram Analyzer</div>
          <div className="text-[10px] text-white/35">Capture e analise perfis públicos</div>
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25">@</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="username_do_alvo"
            className="input-field pl-8"
            disabled={loading}
          />
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || !username.trim()}
          className="btn-primary flex items-center gap-2"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          {loading ? 'Capturando...' : 'Analisar'}
        </button>
      </div>

      {/* Progress */}
      {progress && (
        <div className="text-[11px] text-[#22FF88] bg-[#22FF88]/10 rounded-lg p-2 flex items-center gap-2">
          <Loader2 size={12} className="animate-spin" />
          {progress}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-[11px] text-[#FF6B6B] bg-[#FF6B6B]/10 rounded-lg p-2 flex items-center gap-2">
          <AlertTriangle size={12} />
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="rounded-xl border border-[#22FF88]/20 bg-[#22FF88]/5 p-4">
          <div className="text-[11px] font-bold text-[#22FF88] mb-3">✓ Snapshot Criado</div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <Users size={16} className="mx-auto mb-1 text-white/40" />
              <div className="text-[18px] font-black text-white/90">{result.stats.followers}</div>
              <div className="text-[9px] text-white/30">Seguidores</div>
            </div>
            <div className="text-center">
              <UserCheck size={16} className="mx-auto mb-1 text-white/40" />
              <div className="text-[18px] font-black text-white/90">{result.stats.following}</div>
              <div className="text-[9px] text-white/30">Seguidos</div>
            </div>
            <div className="text-center">
              <Image size={16} className="mx-auto mb-1 text-white/40" />
              <div className="text-[18px] font-black text-white/90">{result.stats.posts}</div>
              <div className="text-[9px] text-white/30">Posts</div>
            </div>
          </div>
          <div className="mt-3 text-[10px] text-white/30 text-center">
            Capturado em {formatDuration(result.duration)}
          </div>
        </div>
      )}

      {/* Snapshots History */}
      {snapshots.length > 0 && (
        <div className="space-y-3">
          <div className="text-[11px] font-bold text-white/40 uppercase tracking-wider">
            Snapshots Anteriores ({snapshots.length})
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {snapshots.map((snap) => (
              <div
                key={snap.id}
                className={cn(
                  'rounded-lg border p-3 cursor-pointer transition-all',
                  selectedSnapshot?.id === snap.id
                    ? 'border-[#E1306C]/30 bg-[#E1306C]/5'
                    : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                )}
                onClick={() => loadSnapshotDetail(snap.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="text-[11px] text-white/60">{formatDate(snap.timestamp)}</div>
                  <div className="text-[9px] text-white/30">{formatDuration(snap.duration)}</div>
                </div>
                <div className="flex gap-4 mt-2 text-[10px] text-white/40">
                  <span>👥 {snap.stats.followers}</span>
                  <span>👤 {snap.stats.following}</span>
                  <span>📸 {snap.stats.posts}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading Detail */}
      {loadingDetail && (
        <div className="text-center py-4">
          <Loader2 size={20} className="animate-spin mx-auto text-white/30" />
          <div className="text-[10px] text-white/30 mt-2">Carregando detalhes...</div>
        </div>
      )}

      {/* Selected Snapshot Detail */}
      {selectedSnapshot && !loadingDetail && (
        <div className="space-y-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="text-[11px] font-bold text-white/60 uppercase tracking-wider">
            Detalhes do Snapshot
          </div>
          
          {/* Profile Info */}
          <div className="flex items-center gap-3">
            {selectedSnapshot.profile.avatarUrl && (
              <img
                src={selectedSnapshot.profile.avatarUrl}
                alt=""
                className="w-12 h-12 rounded-full"
              />
            )}
            <div>
              <div className="text-[13px] font-bold text-white/90">
                @{selectedSnapshot.profile.username || selectedSnapshot.targetUsername}
              </div>
              <div className="text-[10px] text-white/40">
                {selectedSnapshot.profile.fullName}
              </div>
              {selectedSnapshot.profile.bio && (
                <div className="text-[10px] text-white/30 mt-1 line-clamp-2">
                  {selectedSnapshot.profile.bio}
                </div>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white/[0.03] p-3">
              <div className="text-[10px] text-white/40">Seguidores</div>
              <div className="text-[16px] font-black text-white/90">
                {selectedSnapshot.followers.length.toLocaleString()}
              </div>
            </div>
            <div className="rounded-lg bg-white/[0.03] p-3">
              <div className="text-[10px] text-white/40">Seguidos</div>
              <div className="text-[16px] font-black text-white/90">
                {selectedSnapshot.following.length.toLocaleString()}
              </div>
            </div>
            <div className="rounded-lg bg-white/[0.03] p-3">
              <div className="text-[10px] text-white/40">Posts</div>
              <div className="text-[16px] font-black text-white/90">
                {selectedSnapshot.posts.length.toLocaleString()}
              </div>
            </div>
            <div className="rounded-lg bg-white/[0.03] p-3">
              <div className="text-[10px] text-white/40">Engajamento</div>
              <div className="text-[16px] font-black text-white/90">
                {selectedSnapshot.analysis?.engagement?.engagementRate || 0}
              </div>
            </div>
          </div>

          {/* Top Commenters */}
          {selectedSnapshot.analysis?.rankings?.topCommenters?.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-white/40 mb-2">
                <MessageCircle size={10} className="inline mr-1" />
                Top Comentaristas
              </div>
              <div className="space-y-1">
                {selectedSnapshot.analysis.rankings.topCommenters.slice(0, 5).map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-[10px]">
                    <span className="text-white/60">@{c.username}</span>
                    <span className="text-white/30">{c.count} comentários</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Hashtags */}
          {selectedSnapshot.analysis?.rankings?.topHashtags?.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-white/40 mb-2">
                # Hashtags Mais Usadas
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedSnapshot.analysis.rankings.topHashtags.slice(0, 10).map((h: any, i: number) => (
                  <span key={i} className="text-[9px] bg-white/[0.05] rounded px-2 py-0.5 text-white/40">
                    #{h.tag} ({h.count})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
