'use client'

import { useState } from 'react'
import { Instagram, Search, Loader2, ExternalLink, Shield, LogIn } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ShInstagramPro } from './sh-instagram-pro'

interface InstagramProfile {
  username: string
  displayName: string
  fullName: string
  bio: string | null
  avatarUrl: string | null
  followers: number | null
  following: number | null
  posts: number | null
  isVerified: boolean
  isPrivate: boolean
  isBusiness: boolean
  externalUrl: string | null
  publicEmail: string | null
  publicPhone: string | null
  profileUrl: string
  source: string
}

interface Props {
  sessionCookie?: string
  authUsername?: string
  onLogin?: () => void
}

export function ShInstagramModule({ sessionCookie, authUsername, onLogin }: Props) {
  const [mode, setMode] = useState<'public' | 'authenticated'>(sessionCookie ? 'authenticated' : 'public')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<InstagramProfile | null>(null)
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return
    setLoading(true)
    setError('')
    setProfile(null)

    try {
      const res = await fetch(`/api/instagram/public?username=${encodeURIComponent(username.trim())}`)
      const data = await res.json()
      if (data.success && data.data) {
        setProfile(data.data)
      } else {
        setError(data.error || 'Perfil não encontrado')
      }
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (n: number | null) => {
    if (n === null) return '—'
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
    return n.toString()
  }

  if (mode === 'authenticated' && sessionCookie) {
    return (
      <div className="space-y-4">
        <div className="flex gap-1 overflow-x-auto pb-1">
          <button
            onClick={() => setMode('public')}
            className="flex items-center gap-1.5 shrink-0 rounded-[10px] px-3 py-2 text-[11px] font-bold tracking-wider uppercase transition-all bg-white/[0.04] text-white/40 border border-white/[0.06] hover:bg-white/[0.08]"
          >
            <Search size={12} />
            Público
          </button>
          <button
            onClick={() => setMode('authenticated')}
            className="flex items-center gap-1.5 shrink-0 rounded-[10px] px-3 py-2 text-[11px] font-bold tracking-wider uppercase transition-all bg-neon/15 text-neon border border-neon/20"
          >
            <Shield size={12} />
            Autenticado
          </button>
        </div>
        <ShInstagramPro sessionCookie={sessionCookie} username={authUsername || ''} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Instagram size={14} className="text-pink-400" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/30">Instagram OSINT</span>
        </div>
        <h2 className="text-[20px] font-black text-white/90">Análise de Perfil</h2>
        <p className="mt-2 text-[12px] text-white/35">Busca dados públicos do Instagram</p>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        <button
          onClick={() => setMode('public')}
          className="flex items-center gap-1.5 shrink-0 rounded-[10px] px-3 py-2 text-[11px] font-bold tracking-wider uppercase transition-all bg-neon/15 text-neon border border-neon/20"
        >
          <Search size={12} />
          Público
        </button>
        <button
          onClick={() => {
            if (sessionCookie) {
              setMode('authenticated')
            } else if (onLogin) {
              onLogin()
            }
          }}
          className={cn(
            'flex items-center gap-1.5 shrink-0 rounded-[10px] px-3 py-2 text-[11px] font-bold tracking-wider uppercase transition-all border',
            sessionCookie
              ? 'bg-white/[0.04] text-white/40 border-white/[0.06] hover:bg-white/[0.08]'
              : 'bg-white/[0.02] text-white/20 border-white/[0.04] hover:bg-white/[0.04]'
          )}
        >
          {sessionCookie ? <Shield size={12} /> : <LogIn size={12} />}
          {sessionCookie ? 'Autenticado' : 'Conectar Conta'}
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Instagram size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-[10px] border border-white/[0.08] bg-white/[0.03] py-2.5 pl-9 pr-3 text-[13px] text-white/80 placeholder:text-white/20 focus:border-pink-500/30 focus:outline-none"
            placeholder="username"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !username.trim()}
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
        <div className="rounded-[20px] border border-white/[0.06] bg-[#0F121A] p-5">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-white/[0.04] border border-white/[0.08] overflow-hidden shrink-0">
              {profile.avatarUrl && (
                <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-black text-white/90">{profile.username}</span>
                {profile.isVerified && <span className="text-[10px] text-blue-400">✓</span>}
                {profile.isPrivate && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">PRIVADO</span>}
                {profile.isBusiness && <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-bold">BUSINESS</span>}
              </div>
              <div className="text-[12px] text-white/40">{profile.fullName}</div>
              {profile.bio && (
                <p className="mt-1 text-[11px] text-white/30 line-clamp-2">{profile.bio}</p>
              )}
              <div className="mt-2 flex gap-4 text-[11px] text-white/40">
                <span><strong className="text-white/60">{formatNumber(profile.posts)}</strong> posts</span>
                <span><strong className="text-white/60">{formatNumber(profile.followers)}</strong> seguidores</span>
                <span><strong className="text-white/60">{formatNumber(profile.following)}</strong> seguindo</span>
              </div>
              {profile.publicEmail && (
                <div className="mt-1 text-[10px] text-white/25">📧 {profile.publicEmail}</div>
              )}
              {profile.publicPhone && (
                <div className="mt-1 text-[10px] text-white/25">📱 {profile.publicPhone}</div>
              )}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[9px] text-white/20">
            <span>Fonte: {profile.source}</span>
            {profile.posts === null && (
              <span className="text-amber-400/60">· Posts indisponíveis no modo público</span>
            )}
          </div>
          <a
            href={profile.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-2 w-full rounded-[10px] bg-pink-500/10 border border-pink-500/15 px-4 py-2.5 text-[11px] font-bold text-pink-400/80 uppercase tracking-wider transition-all hover:bg-pink-500/20 hover:text-pink-400"
          >
            <ExternalLink size={12} /> Ver no Instagram
          </a>
        </div>
      )}

      {!profile && !loading && !error && (
        <div className="card text-center py-8">
          <Instagram size={32} className="mx-auto text-white/10 mb-3" />
          <div className="text-[12px] text-white/35">Digite um username para buscar o perfil</div>
        </div>
      )}
    </div>
  )
}
