'use client'

import { useState, useEffect } from 'react'
import { GitCompare, Loader2, AlertTriangle, ArrowRight, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SnapshotOption {
  id: string
  timestamp: number
  stats: { followers: number; following: number; posts: number }
}

interface DiffResult {
  profileChanges: { field: string; oldValue: string; newValue: string }[]
  followersChanges: { added: any[]; removed: any[]; netChange: number }
  followingChanges: { added: any[]; removed: any[]; netChange: number }
  postsChanges: { added: any[]; removed: any[] }
  engagementChanges: { totalLikesDiff: number; totalCommentsDiff: number; avgLikesDiff: number; avgCommentsDiff: number }
  alerts: { type: string; message: string; severity: string; timestamp: number }[]
}

function ChangeIndicator({ value }: { value: number }) {
  if (value > 0) return <TrendingUp size={12} className="text-[#22FF88]" />
  if (value < 0) return <TrendingDown size={12} className="text-[#FF6B6B]" />
  return <Minus size={12} className="text-white/30" />
}

export function ShInstagramComparison() {
  const [snapshots, setSnapshots] = useState<SnapshotOption[]>([])
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingSnapshots, setLoadingSnapshots] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previousId, setPreviousId] = useState('')
  const [currentId, setCurrentId] = useState('')
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null)
  const [summary, setSummary] = useState<string | null>(null)

  const loadSnapshots = async () => {
    if (!username.trim()) return
    setLoadingSnapshots(true)
    try {
      const res = await fetch(`/api/instagram/snapshot?username=${encodeURIComponent(username.replace('@', ''))}`)
      const data = await res.json()
      if (data.success && data.data) {
        setSnapshots(data.data.snapshots || [])
      }
    } catch {} finally {
      setLoadingSnapshots(false)
    }
  }

  useEffect(() => {
    if (username.trim()) loadSnapshots()
  }, [username])

  const handleCompare = async () => {
    if (!previousId || !currentId) {
      setError('Selecione dois snapshots para comparar')
      return
    }

    if (previousId === currentId) {
      setError('Selecione snapshots diferentes')
      return
    }

    setLoading(true)
    setError(null)
    setDiffResult(null)
    setSummary(null)

    try {
      const res = await fetch('/api/instagram/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previousId, currentId }),
      })

      const data = await res.json()

      if (data.success && data.data) {
        setDiffResult(data.data.diff)
        setSummary(data.data.summary)
      } else {
        setError(data.error || 'Erro ao comparar')
      }
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (ts: number) => new Date(ts).toLocaleString('pt-BR')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4A90D9]/10 border border-[#4A90D9]/20">
          <GitCompare size={16} className="text-[#4A90D9]" />
        </div>
        <div>
          <div className="text-[13px] font-black text-white/90">Comparação de Snapshots</div>
          <div className="text-[10px] text-white/35">Detecte mudanças entre capturas</div>
        </div>
      </div>

      {/* Username */}
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username do alvo"
        className="input-field"
      />

      {/* Snapshot Selectors */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] text-white/40 mb-1">Snapshot Anterior</div>
          <select
            value={previousId}
            onChange={(e) => setPreviousId(e.target.value)}
            className="input-field text-[11px]"
            disabled={loadingSnapshots}
          >
            <option value="">Selecione...</option>
            {snapshots.map((s) => (
              <option key={s.id} value={s.id}>
                {formatDate(s.timestamp)} — 👥{s.stats.followers} 📸{s.stats.posts}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="text-[10px] text-white/40 mb-1">Snapshot Atual</div>
          <select
            value={currentId}
            onChange={(e) => setCurrentId(e.target.value)}
            className="input-field text-[11px]"
            disabled={loadingSnapshots}
          >
            <option value="">Selecione...</option>
            {snapshots.map((s) => (
              <option key={s.id} value={s.id}>
                {formatDate(s.timestamp)} — 👥{s.stats.followers} 📸{s.stats.posts}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Compare Button */}
      <button
        onClick={handleCompare}
        disabled={loading || !previousId || !currentId}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <GitCompare size={14} />}
        {loading ? 'Comparando...' : 'Comparar Snapshots'}
      </button>

      {/* Error */}
      {error && (
        <div className="text-[11px] text-[#FF6B6B] bg-[#FF6B6B]/10 rounded-lg p-2 flex items-center gap-2">
          <AlertTriangle size={12} /> {error}
        </div>
      )}

      {/* Results */}
      {diffResult && (
        <div className="space-y-4">
          {/* Alerts */}
          {diffResult.alerts.length > 0 && (
            <div className="space-y-2">
              {diffResult.alerts.map((alert, i) => (
                <div
                  key={i}
                  className={cn(
                    'text-[11px] rounded-lg p-2 flex items-center gap-2',
                    alert.severity === 'critical' ? 'bg-[#FF6B6B]/10 text-[#FF6B6B]' :
                    alert.severity === 'warning' ? 'bg-[#FFB84D]/10 text-[#FFB84D]' :
                    'bg-[#4A90D9]/10 text-[#4A90D9]'
                  )}
                >
                  {alert.message}
                </div>
              ))}
            </div>
          )}

          {/* Stats Changes */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white/[0.03] p-3">
              <div className="text-[10px] text-white/40">Seguidores</div>
              <div className="flex items-center gap-2">
                <ChangeIndicator value={diffResult.followersChanges.netChange} />
                <span className={cn(
                  'text-[14px] font-black',
                  diffResult.followersChanges.netChange > 0 ? 'text-[#22FF88]' :
                  diffResult.followersChanges.netChange < 0 ? 'text-[#FF6B6B]' : 'text-white/60'
                )}>
                  {diffResult.followersChanges.netChange >= 0 ? '+' : ''}{diffResult.followersChanges.netChange}
                </span>
              </div>
            </div>
            <div className="rounded-lg bg-white/[0.03] p-3">
              <div className="text-[10px] text-white/40">Seguidos</div>
              <div className="flex items-center gap-2">
                <ChangeIndicator value={diffResult.followingChanges.netChange} />
                <span className={cn(
                  'text-[14px] font-black',
                  diffResult.followingChanges.netChange > 0 ? 'text-[#22FF88]' :
                  diffResult.followingChanges.netChange < 0 ? 'text-[#FF6B6B]' : 'text-white/60'
                )}>
                  {diffResult.followingChanges.netChange >= 0 ? '+' : ''}{diffResult.followingChanges.netChange}
                </span>
              </div>
            </div>
            <div className="rounded-lg bg-white/[0.03] p-3">
              <div className="text-[10px] text-white/40">Posts Novos</div>
              <span className="text-[14px] font-black text-[#22FF88]">
                +{diffResult.postsChanges.added.length}
              </span>
            </div>
            <div className="rounded-lg bg-white/[0.03] p-3">
              <div className="text-[10px] text-white/40">Posts Removidos</div>
              <span className={cn(
                'text-[14px] font-black',
                diffResult.postsChanges.removed.length > 0 ? 'text-[#FF6B6B]' : 'text-white/60'
              )}>
                -{diffResult.postsChanges.removed.length}
              </span>
            </div>
          </div>

          {/* Engagement */}
          <div className="rounded-lg bg-white/[0.03] p-3">
            <div className="text-[10px] text-white/40 mb-2">Engajamento</div>
            <div className="grid grid-cols-2 gap-4 text-[11px]">
              <div>
                <span className="text-white/50">Curtidas: </span>
                <span className={cn(diffResult.engagementChanges.totalLikesDiff >= 0 ? 'text-[#22FF88]' : 'text-[#FF6B6B]')}>
                  {diffResult.engagementChanges.totalLikesDiff >= 0 ? '+' : ''}{diffResult.engagementChanges.totalLikesDiff}
                </span>
              </div>
              <div>
                <span className="text-white/50">Comentários: </span>
                <span className={cn(diffResult.engagementChanges.totalCommentsDiff >= 0 ? 'text-[#22FF88]' : 'text-[#FF6B6B]')}>
                  {diffResult.engagementChanges.totalCommentsDiff >= 0 ? '+' : ''}{diffResult.engagementChanges.totalCommentsDiff}
                </span>
              </div>
            </div>
          </div>

          {/* Followers Added/Removed */}
          {(diffResult.followersChanges.added.length > 0 || diffResult.followersChanges.removed.length > 0) && (
            <div className="rounded-lg bg-white/[0.03] p-3">
              <div className="text-[10px] text-white/40 mb-2">Mudanças nos Seguidores</div>
              {diffResult.followersChanges.added.length > 0 && (
                <div className="mb-2">
                  <div className="text-[9px] text-[#22FF88] mb-1">+ Novos ({diffResult.followersChanges.added.length})</div>
                  <div className="flex flex-wrap gap-1">
                    {diffResult.followersChanges.added.slice(0, 10).map((f, i) => (
                      <span key={i} className="text-[9px] bg-[#22FF88]/10 text-[#22FF88] rounded px-1.5 py-0.5">
                        @{f.username}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {diffResult.followersChanges.removed.length > 0 && (
                <div>
                  <div className="text-[9px] text-[#FF6B6B] mb-1">- Saíram ({diffResult.followersChanges.removed.length})</div>
                  <div className="flex flex-wrap gap-1">
                    {diffResult.followersChanges.removed.slice(0, 10).map((f, i) => (
                      <span key={i} className="text-[9px] bg-[#FF6B6B]/10 text-[#FF6B6B] rounded px-1.5 py-0.5">
                        @{f.username}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Profile Changes */}
          {diffResult.profileChanges.length > 0 && (
            <div className="rounded-lg bg-white/[0.03] p-3">
              <div className="text-[10px] text-white/40 mb-2">Mudanças no Perfil</div>
              {diffResult.profileChanges.map((change, i) => (
                <div key={i} className="text-[10px] mb-1">
                  <span className="text-white/50">{change.field}: </span>
                  <span className="text-[#FF6B6B] line-through">{change.oldValue}</span>
                  <span className="text-white/30 mx-1">→</span>
                  <span className="text-[#22FF88]">{change.newValue}</span>
                </div>
              ))}
            </div>
          )}

          {/* Summary Text */}
          {summary && (
            <details className="rounded-lg bg-white/[0.03] p-3">
              <summary className="text-[10px] text-white/40 cursor-pointer hover:text-white/60">
                Ver resumo em texto
              </summary>
              <pre className="text-[10px] text-white/50 mt-2 whitespace-pre-wrap font-mono">
                {summary}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
