'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Trash2, Plus, Search, Loader2, ExternalLink, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MonitoredProfile {
  id: string
  username: string
  platform: string
  addedAt: string
  lastCheck: string
  status: 'active' | 'paused' | 'error'
}

export function ShRadarMonitorados() {
  const [profiles, setProfiles] = useState<MonitoredProfile[]>([])
  const [newUsername, setNewUsername] = useState('')
  const [newPlatform, setNewPlatform] = useState('instagram')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('shandon-monitored') : null
    if (saved) {
      try { setProfiles(JSON.parse(saved)) } catch { /* ignore */ }
    }
  }, [])

  const saveProfiles = useCallback((updated: MonitoredProfile[]) => {
    setProfiles(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('shandon-monitored', JSON.stringify(updated))
    }
  }, [])

  const handleAdd = useCallback(() => {
    if (!newUsername.trim()) return
    setAdding(true)
    setTimeout(() => {
      const profile: MonitoredProfile = {
        id: crypto.randomUUID(),
        username: newUsername.replace('@', '').trim(),
        platform: newPlatform,
        addedAt: new Date().toISOString(),
        lastCheck: new Date().toISOString(),
        status: 'active',
      }
      saveProfiles([...profiles, profile])
      setNewUsername('')
      setAdding(false)
    }, 300)
  }, [newUsername, newPlatform, profiles, saveProfiles])

  const handleRemove = useCallback((id: string) => {
    saveProfiles(profiles.filter(p => p.id !== id))
  }, [profiles, saveProfiles])

  const handleToggle = useCallback((id: string) => {
    saveProfiles(profiles.map(p =>
      p.id === id ? { ...p, status: p.status === 'active' ? 'paused' : 'active' } : p
    ))
  }, [profiles, saveProfiles])

  return (
    <div className="space-y-5">
      <div className="rounded-[20px] border border-white/[0.06] bg-[#0F121A] p-6">
        <div className="text-center mb-5">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users size={18} className="text-neon/60" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/40">
              Perfis Monitorados
            </span>
          </div>
          <p className="text-[12px] text-white/35">Adicione perfis para monitoramento contínuo</p>
        </div>

        <div className="flex gap-2">
          <select
            value={newPlatform}
            onChange={(e) => setNewPlatform(e.target.value)}
            className="rounded-[10px] bg-white/[0.04] border border-white/[0.08] px-3 py-2.5 text-[12px] text-white/70 focus:outline-none"
          >
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="tiktok">TikTok</option>
            <option value="twitter">Twitter/X</option>
            <option value="telegram">Telegram</option>
          </select>
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="username para monitorar"
              className="w-full rounded-[10px] bg-white/[0.04] border border-white/[0.08] pl-9 pr-3 py-2.5 text-[12px] text-white placeholder:text-white/25 focus:outline-none focus:border-neon/40 transition-all font-mono"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!newUsername.trim() || adding}
            className={cn(
              'flex items-center gap-1.5 rounded-[10px] px-4 py-2.5 text-[11px] font-bold transition-all',
              newUsername.trim() && !adding
                ? 'bg-neon/15 text-neon border border-neon/20 hover:bg-neon/25'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            )}
          >
            {adding ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          </button>
        </div>
      </div>

      {profiles.length === 0 ? (
        <div className="rounded-[16px] border border-white/[0.04] bg-white/[0.02] p-8 text-center">
          <Users size={24} className="mx-auto text-white/15 mb-3" />
          <p className="text-[12px] text-white/30">Nenhum perfil monitorado ainda</p>
          <p className="text-[10px] text-white/20 mt-1">Adicione perfis acima para começar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className={cn(
                'rounded-[14px] border p-4 flex items-center gap-3 transition-all',
                profile.status === 'active'
                  ? 'border-neon/10 bg-neon/[0.02]'
                  : profile.status === 'paused'
                  ? 'border-amber-500/10 bg-amber-500/[0.02]'
                  : 'border-red-500/10 bg-red-500/[0.02]'
              )}
            >
              <div className={cn(
                'h-2 w-2 rounded-full shrink-0',
                profile.status === 'active' ? 'bg-green-400' : profile.status === 'paused' ? 'bg-amber-400' : 'bg-red-400'
              )} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold text-white/80 font-mono">@{profile.username}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/30 uppercase">{profile.platform}</span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-[9px] text-white/25">
                  <Clock size={9} /> Adicionado {new Date(profile.addedAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleToggle(profile.id)}
                  className={cn(
                    'rounded-[8px] px-2.5 py-1.5 text-[10px] font-bold transition-all',
                    profile.status === 'active'
                      ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                      : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                  )}
                >
                  {profile.status === 'active' ? 'Pausar' : 'Ativar'}
                </button>
                <button
                  onClick={() => handleRemove(profile.id)}
                  className="rounded-[8px] p-1.5 text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
