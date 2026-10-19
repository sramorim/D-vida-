'use client'

import { useState } from 'react'
import { Music, Search, Loader2, ExternalLink } from 'lucide-react'

export function ShTiktokModule() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return
    setLoading(true)
    setError('')
    setProfile(null)

    try {
      const res = await fetch(`/api/tiktok/public?username=${encodeURIComponent(username.trim())}`)
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

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Music size={14} className="text-cyan-400" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/30">TikTok OSINT</span>
        </div>
        <h2 className="text-[20px] font-black text-white/90">Análise TikTok</h2>
        <p className="mt-2 text-[12px] text-white/35">Dados públicos do TikTok</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Music size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-[10px] border border-white/[0.08] bg-white/[0.03] py-2.5 pl-9 pr-3 text-[13px] text-white/80 placeholder:text-white/20 focus:border-cyan-500/30 focus:outline-none"
            placeholder="@username"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !username.trim()}
          className="flex items-center gap-2 rounded-[10px] bg-cyan-500/20 border border-cyan-500/30 px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-40"
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
            <div className="h-16 w-16 rounded-full bg-white/[0.04] border border-white/[0.08] overflow-hidden">
              {profile.avatar && <img src={profile.avatar} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-black text-white/90">{profile.nickname || profile.username}</div>
              <div className="text-[12px] text-white/40">@{profile.username}</div>
              <div className="mt-1 text-[11px] text-white/30 line-clamp-2">{profile.bio}</div>
              <div className="mt-2 flex gap-4 text-[11px] text-white/40">
                <span><strong className="text-white/60">{profile.followers}</strong> seguidores</span>
                <span><strong className="text-white/60">{profile.following}</strong> seguindo</span>
                <span><strong className="text-white/60">{profile.likes}</strong> curtidas</span>
              </div>
            </div>
          </div>
          {profile.url && (
            <a href={profile.url} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center gap-1.5 text-[11px] text-cyan-400/60 hover:text-cyan-400">
              <ExternalLink size={12} /> Ver perfil
            </a>
          )}
        </div>
      )}
    </div>
  )
}
