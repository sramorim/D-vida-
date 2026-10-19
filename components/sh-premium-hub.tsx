'use client'

import { Crown, Lock, Shield, Radar, Search, Eye, Database, Globe, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ViewType } from './sh-menu'

interface PremiumFeature {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  available: boolean
}

const FEATURES: PremiumFeature[] = [
  { id: 'darkweb', title: 'Dark Web Monitor', description: 'Monitoramento contínuo na dark web', icon: <Eye size={16} />, available: true },
  { id: 'advanced', title: 'Advanced OSINT', description: 'Ferramentas avançadas de investigação', icon: <Search size={16} />, available: true },
  { id: 'bulk-scan', title: 'Bulk Scanner', description: 'Scan em massa de múltiplos alvos', icon: <Database size={16} />, available: true },
  { id: 'correlation', title: 'Correlation Engine', description: 'Correlação cruzada de dados', icon: <Globe size={16} />, available: true },
  { id: 'timeline', title: 'Timeline Builder', description: 'Linha do tempo de atividades', icon: <Zap size={16} />, available: true },
  { id: 'radar', title: 'Radar Premium', description: 'Alertas e monitoramento avançado', icon: <Radar size={16} />, available: true },
]

export function ShPremiumHub({ onNavigate }: { onNavigate?: (view: ViewType) => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Crown size={14} className="text-amber-400" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-amber-400/60">Premium Dashboard</span>
        </div>
        <h2 className="text-[24px] font-black text-white/90">SHANDON ELITE <span className="text-amber-400">PRO</span></h2>
        <p className="mt-2 text-[12px] text-white/35">Acesso a todas as ferramentas premium</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {FEATURES.map((feature) => (
          <button
            key={feature.id}
            onClick={() => feature.available && onNavigate?.(feature.id as ViewType)}
            className={cn(
              'rounded-[16px] border p-4 text-left transition-all',
              feature.available
                ? 'border-amber-500/20 bg-[#0F121A] hover:border-amber-500/40 hover:bg-[#131720]'
                : 'border-white/[0.04] bg-[#0A0D14] opacity-40'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                'flex h-10 w-10 items-center justify-center rounded-[10px]',
                feature.available ? 'bg-amber-500/10 text-amber-400' : 'bg-white/[0.04] text-white/20'
              )}>
                {feature.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-bold text-white/80">{feature.title}</div>
                <div className="text-[10px] text-white/30 truncate">{feature.description}</div>
              </div>
              {!feature.available && <Lock size={12} className="text-white/20" />}
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-[16px] border border-amber-500/10 bg-amber-500/[0.03] p-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={14} className="text-amber-400" />
          <span className="text-[11px] font-bold text-amber-400">Seu Plano: Elite</span>
        </div>
        <p className="text-[11px] text-white/30">Acesso ilimitado a todas as ferramentas premium.</p>
      </div>
    </div>
  )
}
