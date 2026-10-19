'use client'

import { useState, useCallback } from 'react'
import { Instagram, Search, Loader2, ExternalLink, Heart, MessageCircle, Hash, Tag, TrendingUp, AlertTriangle, Shield, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuthenticatedProfile {
  username: string
  fullName: string
  biography: string
  followers: number
  following: number
  posts: number
  isPrivate: boolean
  isVerified: boolean
  isBusiness: boolean
  profilePicUrl: string
  externalUrl: string | null
  postsData: {
    url: string
    thumbnail: string
    caption: string
    likes: number
    comments: number
    timestamp: string
    isVideo: boolean
  }[]
  topCommenters: { username: string; count: number }[]
  topLikers: { username: string; count: number }[]
  recentComments: { postUrl: string; author: string; text: string; timestamp: string }[]
  taggedUsers: string[]
  hashtagUsage: { tag: string; count: number }[]
  engagementRate: number
}

interface Props {
  sessionCookie: string
  username: string
}

export function ShInstagramPro({ sessionCookie, username }: Props) {
  const [targetUsername, setTargetUsername] = useState(username)
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<AuthenticatedProfile | null>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'posts' | 'engagement' | 'comments'>('posts')

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetUsername.trim() || !sessionCookie) return
    setLoading(true)
    setError('')
    setProfile(null)

    try {
      const res = await fetch('/api/instagram/pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: targetUsername.trim(),
          sessionCookie,
        }),
      })
      const data = await res.json()
      if (data.success && data.data) {
        setProfile(data.data)
      } else {
        setError(data.error || 'Perfil não encontrado ou sessão expirada')
      }
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }, [targetUsername, sessionCookie])

  const formatNumber = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
    return n.toString()
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Instagram size={14} className="text-pink-400" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/30">Instagram Autenticado</span>
        </div>
        <h2 className="text-[20px] font-black text-white/90">Dados Completos</h2>
        <p className="mt-2 text-[12px] text-white/35">Posts, métricas e engajamento via sua sessão</p>
      </div>

      <div className="rounded-[12px] bg-amber-500/10 border border-amber-500/20 p-4 flex items-start gap-3">
        <Shield size={16} className="text-amber-400 shrink-0 mt-0.5" />
        <div>
          <div className="text-[12px] font-bold text-amber-400 mb-1">Modo Autenticado</div>
          <div className="text-[11px] text-amber-400/70 leading-relaxed">
            Sua sessão é usada apenas para esta busca e não é armazenada.
            Use uma conta descartável para mais segurança.
          </div>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Instagram size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            value={targetUsername}
            onChange={(e) => setTargetUsername(e.target.value)}
            className="w-full rounded-[10px] border border-white/[0.08] bg-white/[0.03] py-2.5 pl-9 pr-3 text-[13px] text-white/80 placeholder:text-white/20 focus:border-pink-500/30 focus:outline-none"
            placeholder="username do alvo"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !targetUsername.trim()}
          className="flex items-center gap-2 rounded-[10px] bg-pink-500/20 border border-pink-500/30 px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase text-pink-400 hover:bg-pink-500/30 disabled:opacity-40"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          Buscar
        </button>
      </form>

      {error && (
        <div className="rounded-[12px] bg-red-500/10 border border-red-500/20 p-4 text-[12px] text-red-400">{error}</div>
      )}

      {profile && (
        <>
          <div className="rounded-[20px] border border-white/[0.06] bg-[#0F121A] p-5">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-full bg-white/[0.04] border border-white/[0.08] overflow-hidden shrink-0">
                {profile.profilePicUrl && (
                  <img src={profile.profilePicUrl} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-black text-white/90">{profile.username}</span>
                  {profile.isVerified && <span className="text-[10px] text-blue-400">✓</span>}
                  {profile.isBusiness && <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-bold">BUSINESS</span>}
                </div>
                <div className="text-[12px] text-white/40">{profile.fullName}</div>
                {profile.biography && (
                  <p className="mt-1 text-[11px] text-white/30 line-clamp-2">{profile.biography}</p>
                )}
                <div className="mt-2 flex gap-4 text-[11px] text-white/40">
                  <span><strong className="text-white/60">{formatNumber(profile.followers)}</strong> seguidores</span>
                  <span><strong className="text-white/60">{formatNumber(profile.following)}</strong> seguindo</span>
                  <span><strong className="text-white/60">{formatNumber(profile.posts)}</strong> posts</span>
                </div>
                {profile.engagementRate > 0 && (
                  <div className="mt-2 flex items-center gap-1 text-[11px]">
                    <TrendingUp size={12} className="text-neon" />
                    <span className="text-neon font-bold">{formatNumber(profile.engagementRate)}</span>
                    <span className="text-white/30">engajamento/post</span>
                  </div>
                )}
              </div>
            </div>
            {profile.externalUrl && (
              <a
                href={profile.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center gap-1.5 text-[11px] text-pink-400/60 hover:text-pink-400"
              >
                <ExternalLink size={12} /> {profile.externalUrl}
              </a>
            )}
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1">
            {([
              { key: 'posts', label: 'Posts', icon: <Instagram size={12} /> },
              { key: 'engagement', label: 'Engajamento', icon: <TrendingUp size={12} /> },
              { key: 'comments', label: 'Comentários', icon: <MessageCircle size={12} /> },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-1.5 shrink-0 rounded-[10px] px-3 py-2 text-[11px] font-bold tracking-wider uppercase transition-all',
                  activeTab === tab.key
                    ? 'bg-neon/15 text-neon border border-neon/20'
                    : 'bg-white/[0.04] text-white/40 border border-white/[0.06] hover:bg-white/[0.08]'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'posts' && (
            <div className="grid grid-cols-3 gap-2">
              {profile.postsData.slice(0, 9).map((post, i) => (
                <a
                  key={i}
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square rounded-[10px] overflow-hidden bg-white/[0.04] border border-white/[0.06]"
                >
                  {post.thumbnail && (
                    <img src={post.thumbnail} alt="" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-end opacity-0 group-hover:opacity-100">
                    <div className="p-2 flex gap-3 text-[10px] text-white font-bold">
                      <span className="flex items-center gap-1"><Heart size={10} /> {formatNumber(post.likes)}</span>
                      <span className="flex items-center gap-1"><MessageCircle size={10} /> {post.comments}</span>
                    </div>
                  </div>
                  {post.isVideo && (
                    <div className="absolute top-1.5 right-1.5">
                      <div className="w-5 h-5 rounded-full bg-black/50 flex items-center justify-center">
                        <div className="w-0 h-0 border-l-[5px] border-l-white border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent ml-0.5" />
                      </div>
                    </div>
                  )}
                </a>
              ))}
            </div>
          )}

          {activeTab === 'engagement' && (
            <div className="space-y-4">
              {profile.topLikers.length > 0 && (
                <div className="card">
                  <div className="flex items-center gap-2 mb-3">
                    <Heart size={14} className="text-pink-400" />
                    <span className="text-[12px] font-bold text-white/60">Top Curtidores</span>
                  </div>
                  <div className="space-y-1.5">
                    {profile.topLikers.slice(0, 10).map((liker, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px]">
                        <span className="text-white/70 font-mono">@{liker.username}</span>
                        <span className="text-pink-400/80 font-bold">{liker.count}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {profile.hashtagUsage.length > 0 && (
                <div className="card">
                  <div className="flex items-center gap-2 mb-3">
                    <Hash size={14} className="text-blue-400" />
                    <span className="text-[12px] font-bold text-white/60">Hashtags Mais Usadas</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.hashtagUsage.slice(0, 15).map((tag, i) => (
                      <span key={i} className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold">
                        #{tag.tag} ({tag.count})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.taggedUsers.length > 0 && (
                <div className="card">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag size={14} className="text-green-400" />
                    <span className="text-[12px] font-bold text-white/60">Usuários Marcados</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.taggedUsers.slice(0, 15).map((user, i) => (
                      <a
                        key={i}
                        href={`https://instagram.com/${user}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold hover:bg-green-500/20"
                      >
                        @{user}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              {profile.topCommenters.length > 0 && (
                <div className="card">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageCircle size={14} className="text-purple-400" />
                    <span className="text-[12px] font-bold text-white/60">Top Comentaristas</span>
                  </div>
                  <div className="space-y-1.5">
                    {profile.topCommenters.slice(0, 10).map((commenter, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px]">
                        <span className="text-white/70 font-mono">@{commenter.username}</span>
                        <span className="text-purple-400/80 font-bold">{commenter.count}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {profile.recentComments.length > 0 && (
                <div className="card">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye size={14} className="text-white/40" />
                    <span className="text-[12px] font-bold text-white/60">Comentários Recentes</span>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {profile.recentComments.slice(0, 20).map((comment, i) => (
                      <div key={i} className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-purple-400 font-bold font-mono">@{comment.author}</span>
                          <span className="text-white/20">·</span>
                          <span className="text-white/20">{comment.timestamp ? new Date(Number(comment.timestamp) * 1000).toLocaleDateString('pt-BR') : ''}</span>
                        </div>
                        <div className="text-[11px] text-white/50 mt-1 line-clamp-2">{comment.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!profile && !loading && !error && (
        <div className="card text-center py-8">
          <Instagram size={32} className="mx-auto text-white/10 mb-3" />
          <div className="text-[12px] text-white/35">Conecte sua conta e busque um username para ver dados completos</div>
        </div>
      )}
    </div>
  )
}
