'use client'

import { useState } from 'react'
import { Shield, Lock, Eye, EyeOff, LogIn, LogOut, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

type AccessLevel = 'public' | 'authenticated' | 'admin'

interface AccessFeature {
  name: string
  description: string
  levels: {
    public: { available: boolean; label: string }
    authenticated: { available: boolean; label: string }
    admin: { available: boolean; label: string }
  }
}

const FEATURES: AccessFeature[] = [
  {
    name: 'Perfil Instagram',
    description: 'Nome, username, bio, posts, seguidores',
    levels: {
      public: { available: true, label: 'Dados públicos' },
      authenticated: { available: true, label: 'Dados completos + stories' },
      admin: { available: true, label: 'Tudo incluindo posts privados via collab' },
    }
  },
  {
    name: 'Perfil Facebook',
    description: 'Nome, username, posts, fotos',
    levels: {
      public: { available: true, label: 'Dados públicos' },
      authenticated: { available: true, label: 'Dados completos' },
      admin: { available: true, label: 'Tudo incluindo amigos' },
    }
  },
  {
    name: 'Apps de Namoro',
    description: 'Tinder, Bumble, Happn, OkCupid, Badoo',
    levels: {
      public: { available: false, label: 'Indisponível' },
      authenticated: { available: false, label: 'Indisponível' },
      admin: { available: true, label: 'Busca por username' },
    }
  },
  {
    name: 'Sites +18',
    description: 'OnlyFans, Fansly, Privacy, etc',
    levels: {
      public: { available: false, label: 'Indisponível' },
      authenticated: { available: false, label: 'Indisponível' },
      admin: { available: true, label: 'Verificação completa' },
    }
  },
  {
    name: 'Telegram Groups',
    description: 'Grupos públicos que participa',
    levels: {
      public: { available: false, label: 'Indisponível' },
      authenticated: { available: true, label: 'Grupos públicos' },
      admin: { available: true, label: 'Grupos + canais + atividade' },
    }
  },
  {
    name: 'Foto Metadata (EXIF)',
    description: 'GPS, dispositivo, data da foto',
    levels: {
      public: { available: false, label: 'Indisponível' },
      authenticated: { available: true, label: 'EXIF básico' },
      admin: { available: true, label: 'EXIF completo + análise de edição' },
    }
  },
  {
    name: 'Perfis Privados',
    description: 'Dados de contas privadas',
    levels: {
      public: { available: false, label: 'Indisponível' },
      authenticated: { available: false, label: 'Indisponível' },
      admin: { available: true, label: 'Via dados cross-referenciados' },
    }
  },
  {
    name: 'Dark Web Monitor',
    description: 'Credenciais vazadas, pastes',
    levels: {
      public: { available: false, label: 'Indisponível' },
      authenticated: { available: false, label: 'Indisponível' },
      admin: { available: true, label: 'Monitoramento completo' },
    }
  },
]

const LEVEL_CONFIG: Record<AccessLevel, { label: string; icon: any; color: string; description: string }> = {
  public: { label: 'Público', icon: Eye, color: '#22FF88', description: 'Acesso básico - clientes/free' },
  authenticated: { label: 'Autenticado', icon: LogIn, color: '#3B82F6', description: 'Com login - redes sociais' },
  admin: { label: 'Administrador', icon: Shield, color: '#EF4444', description: 'Acesso total - só você' },
}

interface Props {
  currentLevel: AccessLevel
  onLevelChange: (level: AccessLevel) => void
}

export function ShAccessPanel({ currentLevel, onLevelChange }: Props) {
  const config = LEVEL_CONFIG[currentLevel]

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#22FF88]/10 border border-[#22FF88]/20">
            <Shield size={16} className="text-[#22FF88]" />
          </div>
          <div>
            <div className="text-[13px] font-black text-white/90">Nível de Acesso</div>
            <div className="text-[10px] text-white/35">Selecione o modo de operação</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(LEVEL_CONFIG) as AccessLevel[]).map((level) => {
            const cfg = LEVEL_CONFIG[level]
            const Icon = cfg.icon
            return (
              <button
                key={level}
                onClick={() => onLevelChange(level)}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 rounded-lg text-[10px] font-bold transition-all border',
                  currentLevel === level
                    ? 'border-current'
                    : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                )}
                style={currentLevel === level ? { color: cfg.color, backgroundColor: `${cfg.color}10`, borderColor: `${cfg.color}30` } : undefined}
              >
                <Icon size={18} />
                <span>{cfg.label}</span>
                <span className="text-[8px] font-normal opacity-60 text-center">{cfg.description}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="card">
        <div className="text-[11px] font-black tracking-widest uppercase text-white/40 mb-3">
          Funcionalidades Disponíveis - Modo {config.label}
        </div>
        <div className="space-y-2">
          {FEATURES.map((feature) => {
            const levelInfo = feature.levels[currentLevel]
            const Icon = levelInfo.available ? CheckCircle : (currentLevel === 'admin' ? XCircle : Lock)
            const color = levelInfo.available ? '#22FF88' : (currentLevel === 'admin' ? '#FF3B3B' : '#666')
            return (
              <div key={feature.name} className="flex items-start gap-3 p-2 rounded-lg bg-white/[0.02]">
                <Icon size={14} className="mt-0.5 shrink-0" style={{ color }} />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold text-white/80">{feature.name}</div>
                  <div className="text-[9px] text-white/30">{feature.description}</div>
                  <div className="text-[9px] mt-0.5" style={{ color }}>{levelInfo.label}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
