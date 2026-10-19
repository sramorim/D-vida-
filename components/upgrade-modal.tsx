'use client'

import { Crown, Check, Lock, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  feature?: string
}

const PREMIUM_FEATURES = [
  'Username Scan ilimitado com detalhes',
  'Instagram: modo completo + top likers',
  'Facebook: amigos e curtidas',
  'TikTok: comentários e top vídeos',
  'Radar com monitoramento e alertas',
  'Dark Web monitoring',
  'Acesso a ferramentas avançadas',
]

export default function UpgradeModal({ isOpen, onClose, feature }: UpgradeModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl bg-card border border-card-border shadow-card overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 to-transparent pointer-events-none" />

        <div className="relative p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-lg text-text-dim hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-cyan/10 border border-cyan/30 flex items-center justify-center shadow-cyan-glow">
              <Crown className="w-8 h-8 text-cyan" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">
                Desbloqueie o PRO
              </h2>
              {feature && (
                <p className="text-sm text-text-dim">
                  Desbloqueie <span className="text-cyan font-medium">{feature}</span> e muito mais
                </p>
              )}
            </div>

            <div className="w-full space-y-2 py-2">
              {PREMIUM_FEATURES.map((f) => (
                <div key={f} className="flex items-center gap-2.5 text-left">
                  <div className="w-5 h-5 rounded-full bg-neon/10 border border-neon/30 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-neon" />
                  </div>
                  <span className="text-sm text-white/80">{f}</span>
                </div>
              ))}
            </div>

            <div className="w-full space-y-2 pt-2">
              <a
                href="/register"
                className={cn(
                  'flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold',
                  'bg-gradient-to-r from-cyan to-neon text-black',
                  'hover:shadow-cyan-glow transition-all duration-200'
                )}
              >
                <Crown className="w-4 h-4" />
                Criar conta grátis
              </a>

              <a
                href="/login"
                className={cn(
                  'flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium',
                  'bg-white/5 hover:bg-white/10 text-white border border-card-border',
                  'transition-all duration-200'
                )}
              >
                <Lock className="w-4 h-4" />
                Já tenho conta
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
