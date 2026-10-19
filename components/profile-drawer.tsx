'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ExternalLink, Camera, GitCompare, BarChart3, Clock, TrendingUp, TrendingDown, User, ChevronDown, ChevronUp, RefreshCw, Users, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Snapshot, SnapshotPlatform, SnapshotComparison, InterestData, FollowersData, InteractionsData, FollowerProfile, InteractionProfile } from '@/lib/types'

interface ProfileDrawerProps {
  platform: SnapshotPlatform
  username: string
  onClose: () => void
}

type Tab = 'perfil' | 'posts' | 'seguidores' | 'interacoes' | 'snapshot' | 'interesses'

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function DeltaBadge({ delta }: { delta: number | null | undefined }) {
  if (delta === null || delta === undefined || delta === 0) {
    return <span className="text-[10px] text-white/30">—</span>
  }
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] text-neon">
        <TrendingUp size={10} />+{delta.toLocaleString('pt-BR')}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] text-red-400">
      <TrendingDown size={10} />{delta.toLocaleString('pt-BR')}
    </span>
  )
}

export function ProfileDrawer({ platform, username, onClose }: ProfileDrawerProps) {
  const [activeTab, setActiveTab] = useState<Tab>('perfil')
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [comparison, setComparison] = useState<SnapshotComparison | null>(null)
  const [interests, setInterests] = useState<InterestData | null>(null)
  const [followersData, setFollowersData] = useState<FollowersData | null>(null)
  const [interactionsData, setInteractionsData] = useState<InteractionsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [comparing, setComparing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const snapRes = await fetch(`/api/snapshot?action=latest&platform=${platform}&username=${username}`)
      const snapData = await snapRes.json()
      if (snapData.success && snapData.data) {
        setSnapshot(snapData.data)
      }
    } catch {
      // Snapshot pode não existir ainda
    }
    setLoading(false)
  }, [platform, username])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCompare = async () => {
    setComparing(true)
    try {
      const res = await fetch(`/api/compare?platform=${platform}&username=${username}&days=30`)
      const data = await res.json()
      if (data.success && data.data) {
        setComparison(data.data)
      }
    } catch {
      // Comparação pode falhar
    }
    setComparing(false)
  }

  const handleCreateSnapshot = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, username }),
      })
      const data = await res.json()
      if (data.success && data.data) {
        setSnapshot(data.data)
      }
    } catch {
      // Snapshot pode falhar
    }
    setLoading(false)
  }

  const fetchInterests = async () => {
    try {
      const res = await fetch(`/api/interests?platform=${platform}&username=${username}`)
      const data = await res.json()
      if (data.success && data.data) {
        setInterests(data.data)
      }
    } catch {
      // Interesses podem falhar
    }
  }

  const fetchFollowers = async () => {
    try {
      const res = await fetch(`/api/followers?platform=${platform}&username=${username}&limit=30`)
      const data = await res.json()
      if (data.success && data.data) {
        setFollowersData(data.data)
      }
    } catch {
      // Seguidores podem falhar
    }
  }

  const fetchInteractions = async () => {
    try {
      const res = await fetch(`/api/interactions?platform=${platform}&username=${username}&limit=7`)
      const data = await res.json()
      if (data.success && data.data) {
        setInteractionsData(data.data)
      }
    } catch {
      // Interações podem falhar
    }
  }

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'perfil', label: 'Perfil', icon: <User size={14} /> },
    { key: 'seguidores', label: 'Seguidores', icon: <Users size={14} /> },
    { key: 'interacoes', label: 'Interações', icon: <MessageCircle size={14} /> },
    { key: 'posts', label: 'Posts', icon: <Camera size={14} /> },
    { key: 'snapshot', label: 'Snapshot', icon: <GitCompare size={14} /> },
    { key: 'interesses', label: 'Interesses', icon: <BarChart3 size={14} /> },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[20px] bg-card border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-neon/10 border border-neon/20 text-neon text-sm font-black">
              {platform.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white/90">@{username}</h2>
              <p className="text-[11px] text-white/40">{platform}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex border-b border-white/10 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key)
                if (tab.key === 'interesses' && !interests) fetchInterests()
                if (tab.key === 'seguidores' && !followersData) fetchFollowers()
                if (tab.key === 'interacoes' && !interactionsData) fetchInteractions()
              }}
              className={cn(
                'flex items-center gap-1.5 px-4 py-3 text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap',
                activeTab === tab.key
                  ? 'text-neon border-b-2 border-neon bg-neon/5'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/[0.02]'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          {activeTab === 'perfil' && (
            <PerfilTab snapshot={snapshot} loading={loading} error={error} />
          )}
          {activeTab === 'seguidores' && (
            <SeguidoresTab
              data={followersData}
              platform={platform}
              targetUsername={username}
              loading={!followersData && loading}
            />
          )}
          {activeTab === 'interacoes' && (
            <InteracoesTab
              data={interactionsData}
              platform={platform}
              targetUsername={username}
              loading={!interactionsData && loading}
            />
          )}
          {activeTab === 'posts' && (
            <PostsTab snapshot={snapshot} platform={platform} />
          )}
          {activeTab === 'snapshot' && (
            <SnapshotTab
              snapshot={snapshot}
              comparison={comparison}
              comparing={comparing}
              onCompare={handleCompare}
              onCreateSnapshot={handleCreateSnapshot}
              loading={loading}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
            />
          )}
          {activeTab === 'interesses' && (
            <InterestsTab interests={interests} />
          )}
        </div>
      </div>
    </div>
  )
}

function PerfilTab({ snapshot, loading, error }: { snapshot: Snapshot | null; loading: boolean; error: string | null }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neon border-t-transparent" />
        <span className="ml-3 text-sm text-white/50">Carregando perfil...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    )
  }

  if (!snapshot) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-white/40">Nenhum snapshot disponível para este perfil.</p>
        <p className="text-[11px] text-white/25 mt-2">Crie um snapshot na aba Snapshot para ver os dados.</p>
      </div>
    )
  }

  const p = snapshot.profile

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        {p.profile_pic_url && (
          <img
            src={p.profile_pic_url}
            alt={p.username}
            className="h-16 w-16 rounded-[12px] border border-white/10 object-cover"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white/90">{p.username}</span>
            {p.is_verified && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 px-1.5 py-0.5 text-[9px] font-bold text-blue-400 uppercase">
                Verificado
              </span>
            )}
            {p.is_private !== null && (
              <span className={cn(
                'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase',
                p.is_private
                  ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-400'
                  : 'bg-green-500/20 border border-green-500/30 text-green-400'
              )}>
                {p.is_private ? 'Privado' : 'Público'}
              </span>
            )}
          </div>
          {p.full_name && (
            <p className="text-[13px] text-white/70 mt-0.5">{p.full_name}</p>
          )}
          {p.bio && (
            <p className="text-[12px] text-white/50 mt-2 leading-relaxed whitespace-pre-wrap">{p.bio}</p>
          )}
          {p.external_url && (
            <a
              href={p.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-[11px] text-neon/70 hover:text-neon transition-colors"
            >
              <ExternalLink size={10} />
              {p.external_url}
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Seguidores" value={p.followers_count} />
        <StatCard label="Seguindo" value={p.following_count} />
        <StatCard label="Publicações" value={p.posts_count} />
      </div>

      <div className="text-[10px] text-white/20">
        Snapshot: {formatTimestamp(snapshot.timestamp)} • Fonte: {snapshot.provider} • Status: {snapshot.status}
      </div>

      {p.username && (
        <a
          href={`https://${snapshot.platform === 'instagram' ? 'www.instagram.com' : 'www.facebook.com'}/${p.username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full rounded-[10px] bg-neon/10 border border-neon/15 px-4 py-2.5 text-[11px] font-bold text-neon/80 uppercase tracking-wider transition-all hover:bg-neon/20 hover:text-neon"
        >
          <ExternalLink size={12} />
          Ver no Site Oficial
        </a>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-[10px] bg-white/[0.03] border border-white/[0.04] p-3 text-center">
      <div className="text-[18px] font-black text-white/90">
        {value !== null ? value.toLocaleString('pt-BR') : '—'}
      </div>
      <div className="text-[9px] text-white/30 uppercase tracking-wider mt-1">{label}</div>
    </div>
  )
}

function SeguidoresTab({
  data,
  platform,
  targetUsername,
  loading,
}: {
  data: FollowersData | null
  platform: SnapshotPlatform
  targetUsername: string
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neon border-t-transparent" />
        <span className="ml-3 text-sm text-white/50">Carregando seguidores...</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-white/40">Nenhum dado de seguidores disponível.</p>
      </div>
    )
  }

  if (data.status === 'unavailable') {
    return (
      <div className="text-center py-12">
        <Users size={24} className="mx-auto text-white/20 mb-3" />
        <p className="text-sm text-white/40">{data.message}</p>
      </div>
    )
  }

  if (data.followers.length === 0) {
    return (
      <div className="text-center py-12">
        <Users size={24} className="mx-auto text-white/20 mb-3" />
        <p className="text-sm text-white/40">Nenhum seguidor retornado pela fonte.</p>
      </div>
    )
  }

  const followingSet = new Set(data.following_list.map((f) => f.toLowerCase()))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-bold text-white/60 uppercase tracking-wider">
          {data.has_temporal_order ? 'Seguidores mais recentes' : 'Perfis retornados pela fonte'}
        </h4>
        <span className="text-[10px] text-white/30">
          {data.followers.length} de {data.total_returned}
        </span>
      </div>

      {!data.has_temporal_order && data.followers.length > 0 && (
        <p className="text-[10px] text-white/25 italic">
          A fonte não fornece ordem temporal confiável. Perfis listados na ordem retornada.
        </p>
      )}

      <div className="space-y-2">
        {data.followers.map((follower) => (
          <FollowerRow
            key={follower.username}
            follower={follower}
            platform={platform}
            targetFollowsThisUser={followingSet.has(follower.username.toLowerCase())}
          />
        ))}
      </div>
    </div>
  )
}

function FollowerRow({
  follower,
  platform,
  targetFollowsThisUser,
}: {
  follower: FollowerProfile
  platform: SnapshotPlatform
  targetFollowsThisUser: boolean
}) {
  const platformUrl = platform === 'instagram' ? 'www.instagram.com' : 'www.facebook.com'
  const profileUrl = follower.url || `https://${platformUrl}/${follower.username}`

  return (
    <div className="flex items-center gap-3 rounded-[10px] bg-white/[0.03] border border-white/[0.04] p-3">
      {follower.profile_pic_url ? (
        <img
          src={follower.profile_pic_url}
          alt={follower.username}
          className="h-9 w-9 rounded-[8px] border border-white/10 object-cover shrink-0"
        />
      ) : (
        <div className="h-9 w-9 rounded-[8px] bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0">
          <User size={14} className="text-white/20" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12px] font-bold text-white/80 hover:text-neon transition-colors font-mono"
        >
          @{follower.username}
        </a>
        {follower.full_name && follower.full_name !== follower.username && (
          <p className="text-[10px] text-white/40 truncate">{follower.full_name}</p>
        )}
      </div>

      <div className="shrink-0">
        {targetFollowsThisUser ? (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-neon/10 border border-neon/15 px-2 py-0.5 text-[9px] font-bold text-neon/70">
            Segue
          </span>
        ) : (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 text-[9px] font-bold text-white/30">
            —
          </span>
        )}
      </div>
    </div>
  )
}

function InteracoesTab({
  data,
  platform,
  targetUsername,
  loading,
}: {
  data: InteractionsData | null
  platform: SnapshotPlatform
  targetUsername: string
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neon border-t-transparent" />
        <span className="ml-3 text-sm text-white/50">Carregando interações...</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-white/40">Nenhum dado de interações disponível.</p>
      </div>
    )
  }

  if (data.status === 'insufficient_data') {
    return (
      <div className="text-center py-12">
        <MessageCircle size={24} className="mx-auto text-white/20 mb-3" />
        <p className="text-sm text-white/40">{data.message}</p>
      </div>
    )
  }

  if (data.status === 'unavailable') {
    return (
      <div className="text-center py-12">
        <MessageCircle size={24} className="mx-auto text-white/20 mb-3" />
        <p className="text-sm text-white/40">{data.message}</p>
      </div>
    )
  }

  if (data.profiles.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageCircle size={24} className="mx-auto text-white/20 mb-3" />
        <p className="text-sm text-white/40">Nenhuma interação identificada nos dados retornados pela fonte.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-bold text-white/60 uppercase tracking-wider">
          TOP {data.profiles.length} interações observadas
        </h4>
        <span className="text-[10px] text-white/30">
          {data.total_posts_analyzed} posts analisados
        </span>
      </div>

      <div className="space-y-2">
        {data.profiles.map((profile, index) => (
          <InteractionRow
            key={profile.username}
            profile={profile}
            platform={platform}
            rank={index + 1}
          />
        ))}
      </div>
    </div>
  )
}

function InteractionRow({
  profile,
  platform,
  rank,
}: {
  profile: InteractionProfile
  platform: SnapshotPlatform
  rank: number
}) {
  const platformUrl = platform === 'instagram' ? 'www.instagram.com' : 'www.facebook.com'
  const profileUrl = profile.url || `https://${platformUrl}/${profile.username}`

  return (
    <div className="rounded-[10px] bg-white/[0.03] border border-white/[0.04] p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-white/[0.05] border border-white/10 text-[10px] font-black text-white/30">
          {rank}
        </div>

        {profile.profile_pic_url ? (
          <img
            src={profile.profile_pic_url}
            alt={profile.username}
            className="h-9 w-9 rounded-[8px] border border-white/10 object-cover shrink-0"
          />
        ) : (
          <div className="h-9 w-9 rounded-[8px] bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0">
            <User size={14} className="text-white/20" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] font-bold text-white/80 hover:text-neon transition-colors font-mono"
          >
            @{profile.username}
          </a>
          {profile.full_name && profile.full_name !== profile.username && (
            <p className="text-[10px] text-white/40 truncate">{profile.full_name}</p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <div className="text-[14px] font-black text-white/70">
            {profile.total_interactions}
          </div>
          <div className="text-[8px] text-white/25 uppercase tracking-wider">interações</div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-white/30">
        {profile.likes_observed > 0 && (
          <span>Curtidas: <span className="text-white/50 font-bold">{profile.likes_observed}</span></span>
        )}
        {profile.comments_observed > 0 && (
          <span>Comentários: <span className="text-white/50 font-bold">{profile.comments_observed}</span></span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {profile.follows_target === true && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-neon/10 border border-neon/15 px-2 py-0.5 text-[9px] font-bold text-neon/70">
            Segue o alvo
          </span>
        )}
        {profile.follows_target === false && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 text-[9px] font-bold text-white/30">
            Não segue o alvo
          </span>
        )}
        <span className="text-[9px] text-white/25">
          {profile.reciprocity_status}
        </span>
      </div>
    </div>
  )
}

function PostsTab({ snapshot, platform }: { snapshot: Snapshot | null; platform: SnapshotPlatform }) {
  if (!snapshot) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-white/40">Nenhum dado de posts disponível.</p>
        <p className="text-[11px] text-white/25 mt-2">Dados de posts requerem snapshot com provider Instaloader.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[10px] bg-white/[0.03] border border-white/[0.04] p-4">
        <p className="text-[12px] text-white/50 leading-relaxed">
          Dados de posts recentes requerem o provider Instaloader instalado.
          O snapshot atual contém dados do perfil ({snapshot.provider}).
        </p>
        {platform === 'instagram' && (
          <p className="text-[11px] text-white/30 mt-2">
            Para obter posts, execute: pip3 install instaloader
          </p>
        )}
      </div>

      {snapshot.profile.bio && (
        <div className="rounded-[10px] bg-white/[0.03] border border-white/[0.04] p-4">
          <h4 className="text-[11px] font-bold text-white/60 uppercase tracking-wider mb-2">Bio Atual</h4>
          <p className="text-[12px] text-white/50 leading-relaxed whitespace-pre-wrap">{snapshot.profile.bio}</p>
        </div>
      )}
    </div>
  )
}

function SnapshotTab({
  snapshot,
  comparison,
  comparing,
  onCompare,
  onCreateSnapshot,
  loading,
  expandedSections,
  toggleSection,
}: {
  snapshot: Snapshot | null
  comparison: SnapshotComparison | null
  comparing: boolean
  onCompare: () => void
  onCreateSnapshot: () => void
  loading: boolean
  expandedSections: Record<string, boolean>
  toggleSection: (key: string) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={onCreateSnapshot}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-[8px] bg-neon/10 border border-neon/15 px-3 py-2 text-[10px] font-bold text-neon/80 uppercase tracking-wider transition-all hover:bg-neon/20 hover:text-neon disabled:opacity-50"
        >
          <Camera size={12} />
          Capturar Snapshot
        </button>
        <button
          onClick={onCompare}
          disabled={comparing || !snapshot}
          className="flex items-center gap-1.5 rounded-[8px] bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-[10px] font-bold text-white/40 uppercase tracking-wider transition-all hover:bg-white/[0.08] hover:text-white/60 disabled:opacity-50"
        >
          {comparing ? (
            <RefreshCw size={12} className="animate-spin" />
          ) : (
            <GitCompare size={12} />
          )}
          Comparar Agora
        </button>
      </div>

      {snapshot && (
        <div className="rounded-[10px] bg-white/[0.03] border border-white/[0.04] p-4">
          <h4 className="text-[11px] font-bold text-white/60 uppercase tracking-wider mb-3">Snapshot Atual</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-white/40">Data</span>
              <span className="text-[11px] text-white/70 font-mono">{formatTimestamp(snapshot.timestamp)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-white/40">Provider</span>
              <span className="text-[11px] text-white/70">{snapshot.provider}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-white/40">Status</span>
              <span className={cn(
                'text-[10px] font-bold uppercase px-1.5 py-0.5 rounded',
                snapshot.status === 'complete' ? 'bg-green-500/20 text-green-400' :
                snapshot.status === 'partial' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              )}>
                {snapshot.status}
              </span>
            </div>
          </div>
        </div>
      )}

      {!snapshot && !loading && (
        <div className="text-center py-8">
          <p className="text-sm text-white/40">Nenhum snapshot salvo ainda.</p>
          <p className="text-[11px] text-white/25 mt-2">
            Clique em &quot;Capturar Snapshot&quot; para salvar o estado atual do perfil.
          </p>
        </div>
      )}

      {comparison && (
        <div className="rounded-[10px] bg-white/[0.03] border border-white/[0.04] p-4">
          <h4 className="text-[11px] font-bold text-white/60 uppercase tracking-wider mb-3">Comparação</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-white/40">Alterado</span>
              <span className={cn(
                'text-[10px] font-bold uppercase px-1.5 py-0.5 rounded',
                comparison.changed ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
              )}>
                {comparison.changed ? 'Sim' : 'Não'}
              </span>
            </div>
          </div>

          {comparison.changed && (
            <div className="mt-4 space-y-3">
              {comparison.fields.filter((f) => f.changed).map((field) => (
                <div key={field.field} className="rounded-[8px] bg-white/[0.02] border border-white/[0.03] p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-white/60">{field.field}</span>
                    {typeof field.delta === 'number' && field.delta !== 0 && (
                      <DeltaBadge delta={field.delta} />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-white/30">Antes:</span>
                    <span className="text-white/50 font-mono truncate">{String(field.before ?? '—')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-white/30">Agora:</span>
                    <span className="text-white/70 font-mono truncate">{String(field.after ?? '—')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {comparison.follower_diff && (
            <div className="mt-4 space-y-2">
              {comparison.follower_diff.new_observed.length > 0 && (
                <div className="rounded-[8px] bg-green-500/5 border border-green-500/10 p-3">
                  <button
                    onClick={() => toggleSection('new_followers')}
                    className="flex items-center justify-between w-full"
                  >
                    <span className="text-[11px] font-bold text-green-400">
                      Novos perfis observados ({comparison.follower_diff.new_observed.length})
                    </span>
                    {expandedSections['new_followers'] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  {expandedSections['new_followers'] && (
                    <div className="mt-2 space-y-1">
                      {comparison.follower_diff.new_observed.map((u) => (
                        <a
                          key={u}
                          href={`https://instagram.com/${u}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-[11px] text-neon/60 hover:text-neon font-mono"
                        >
                          @{u}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {comparison.follower_diff.not_observed_in_current.length > 0 && (
                <div className="rounded-[8px] bg-yellow-500/5 border border-yellow-500/10 p-3">
                  <button
                    onClick={() => toggleSection('missing_followers')}
                    className="flex items-center justify-between w-full"
                  >
                    <span className="text-[11px] font-bold text-yellow-400">
                      Perfis não observados no snapshot atual ({comparison.follower_diff.not_observed_in_current.length})
                    </span>
                    {expandedSections['missing_followers'] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  {expandedSections['missing_followers'] && (
                    <div className="mt-2 space-y-1">
                      {comparison.follower_diff.not_observed_in_current.map((u) => (
                        <span key={u} className="block text-[11px] text-white/40 font-mono">
                          @{u}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {comparison.summary.length > 0 && (
            <div className="mt-4 space-y-1">
              {comparison.summary.map((s, i) => (
                <p key={i} className="text-[11px] text-white/50">• {s}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {!comparison && snapshot && !comparing && (
        <div className="text-center py-6">
          <Clock size={24} className="mx-auto text-white/20 mb-2" />
          <p className="text-[11px] text-white/30">
            Clique em &quot;Comparar Agora&quot; para comparar com snapshots anteriores.
          </p>
        </div>
      )}
    </div>
  )
}

function InterestsTab({ interests }: { interests: InterestData | null }) {
  if (!interests) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neon border-t-transparent" />
        <span className="ml-3 text-sm text-white/50">Carregando interesses...</span>
      </div>
    )
  }

  if (interests.status === 'insufficient_data') {
    return (
      <div className="text-center py-12">
        <BarChart3 size={24} className="mx-auto text-white/20 mb-3" />
        <p className="text-sm text-white/40">{interests.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {interests.hashtags.length > 0 && (
        <div className="rounded-[10px] bg-white/[0.03] border border-white/[0.04] p-4">
          <h4 className="text-[11px] font-bold text-white/60 uppercase tracking-wider mb-3">Hashtags do Bio</h4>
          <div className="flex flex-wrap gap-2">
            {interests.hashtags.map((h) => (
              <span key={h.tag} className="rounded-full bg-neon/10 border border-neon/15 px-2.5 py-1 text-[10px] font-bold text-neon/70">
                {h.tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {interests.post_times.length > 0 && (
        <div className="rounded-[10px] bg-white/[0.03] border border-white/[0.04] p-4">
          <h4 className="text-[11px] font-bold text-white/60 uppercase tracking-wider mb-3">Horários dos Snapshots</h4>
          <div className="space-y-1.5">
            {interests.post_times.slice(0, 5).map((t) => (
              <div key={t.hour} className="flex items-center gap-2">
                <span className="text-[11px] text-white/40 font-mono w-8">{String(t.hour).padStart(2, '0')}h</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-neon/30"
                    style={{ width: `${(t.count / Math.max(...interests.post_times.map((x) => x.count))) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-white/30">{t.count}x</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {interests.hashtags.length === 0 && interests.post_times.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-white/40">Dados insuficientes pela fonte.</p>
          <p className="text-[11px] text-white/25 mt-2">
            Interesses requerem dados de posts ou hashtags do bio.
          </p>
        </div>
      )}
    </div>
  )
}
