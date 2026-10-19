'use client'

import Image from 'next/image'
import { 
  ChevronRight, Globe, Crown, Shield, Zap, 
  Search, Eye, Lock, Database, Wifi, ArrowRight,
  Sparkles, Users, Activity
} from 'lucide-react'
import type { ViewType } from './sh-menu'

interface ShHeroProps {
  onNavigate: (view: ViewType) => void
}

export function ShHero({ onNavigate }: ShHeroProps) {
  return (
    <div className="space-y-6">
      {/* Main Hero Card */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-b from-[#0F172A] to-[#020617] p-8 md:p-12">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(139,92,246,0.08)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(6,182,212,0.05)_0%,transparent_50%)]" />
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#8B5CF6]/30 to-transparent" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }} />

        <div className="relative flex flex-col items-center text-center">
          {/* Logo with glow */}
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-[#8B5CF6]/20 to-[#06B6D4]/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative h-20 w-20 md:h-24 md:w-24 overflow-hidden rounded-2xl ring-1 ring-[#8B5CF6]/20 bg-gradient-to-br from-[#8B5CF6]/10 to-[#06B6D4]/10 p-[1px]">
              <div className="relative h-full w-full overflow-hidden rounded-[15px] bg-[#0F172A]">
                <Image
                  src="/logo.svg"
                  alt="SHANDON ELITE"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Status badge */}
          <div className="mt-6 flex items-center gap-2 rounded-full bg-[#22FF88]/8 border border-[#22FF88]/15 px-4 py-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22FF88] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22FF88]" />
            </span>
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#22FF88]/80">
              Sistema Operacional • 119+ Plataformas
            </span>
          </div>

          {/* Title */}
          <h1 className="mt-6 text-3xl md:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight">
            <span className="text-white/95">Inteligência</span>
            <br />
            <span className="text-white/95">sobre o </span>
            <span className="bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent">
              público.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-4 max-w-lg text-sm md:text-base leading-relaxed text-white/35">
            Plataforma de inteligência digital profissional. Busca usernames, e-mails, 
            telefones, redes sociais, domínios e vazamentos em tempo real.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => onNavigate('osint-user')}
              className="group relative flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] px-8 py-4 text-sm font-bold tracking-wider uppercase text-white transition-all duration-300 hover:shadow-[0_0_40px_rgba(139,92,246,0.4)] hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
            >
              <Search size={16} />
              Começar Varredura
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button
              onClick={() => onNavigate('anon-investigation')}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-8 py-4 text-sm font-bold tracking-wider uppercase text-white/60 transition-all duration-300 hover:bg-white/[0.06] hover:text-white/80 hover:border-white/[0.12] w-full sm:w-auto"
            >
              <Eye size={16} />
              Investigação Anônima
            </button>
          </div>

          {/* Secondary actions */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('planos')}
              className="flex items-center gap-2 text-xs text-white/25 hover:text-white/50 transition-colors"
            >
              <Crown size={14} />
              <span>Ver Planos Premium</span>
            </button>
            <span className="text-white/10">•</span>
            <button
              onClick={() => onNavigate('darkweb')}
              className="flex items-center gap-2 text-xs text-white/25 hover:text-white/50 transition-colors"
            >
              <Lock size={14} />
              <span>Dark Web Monitor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <Globe size={18} />, label: 'Plataformas', value: '119+', color: '#8B5CF6' },
          { icon: <Users size={18} />, label: 'Redes Sociais', value: '31', color: '#06B6D4' },
          { icon: <Zap size={18} />, label: 'Ferramentas', value: '20+', color: '#F59E0B' },
          { icon: <Shield size={18} />, label: 'Gratuito', value: '100%', color: '#22FF88' },
        ].map((stat) => (
          <div 
            key={stat.label} 
            className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0F172A] p-4 text-center hover:border-white/[0.1] transition-all duration-300"
          >
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle at center, ${stat.color}08 0%, transparent 70%)`
              }}
            />
            <div className="relative">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/[0.04] mb-2" style={{ color: stat.color }}>
                {stat.icon}
              </div>
              <div className="text-2xl font-black" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className="text-[10px] text-white/30 uppercase tracking-wider mt-1">
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { 
            icon: <Search size={20} />, 
            title: 'Username Search', 
            description: 'Busca em 119+ plataformas simultaneamente',
            view: 'osint-user' as ViewType,
            gradient: 'from-[#8B5CF6] to-[#6366F1]'
          },
          { 
            icon: <Database size={20} />, 
            title: 'Breach Check', 
            description: 'Verifique vazamentos de e-mail',
            view: 'breach-check' as ViewType,
            gradient: 'from-[#EF4444] to-[#DC2626]'
          },
          { 
            icon: <Wifi size={20} />, 
            title: 'IP Intelligence', 
            description: 'Geo, ASN, ISP e detecção de ameaças',
            view: 'ip-intel' as ViewType,
            gradient: 'from-[#06B6D4] to-[#0891B2]'
          },
        ].map((card) => (
          <button
            key={card.title}
            onClick={() => onNavigate(card.view)}
            className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0F172A] p-5 text-left hover:border-white/[0.1] transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity duration-300 rounded-full blur-2xl" style={{
              background: `linear-gradient(135deg, ${card.gradient.includes('8B5CF6') ? '#8B5CF6' : card.gradient.includes('EF4444') ? '#EF4444' : '#06B6D4'}, transparent)`
            }} />
            <div className="relative">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} mb-3`}>
                <div className="text-white">{card.icon}</div>
              </div>
              <h3 className="text-sm font-bold text-white/90">{card.title}</h3>
              <p className="text-xs text-white/40 mt-1">{card.description}</p>
              <div className="flex items-center gap-1 mt-3 text-[10px] font-semibold tracking-wider text-white/30 group-hover:text-white/60 transition-colors uppercase">
                Acessar
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Trust indicators */}
      <div className="flex flex-wrap items-center justify-center gap-6 py-4">
        {[
          { icon: <Shield size={14} />, label: 'Dados Criptografados' },
          { icon: <Lock size={14} />, label: 'Sem Armazenamento' },
          { icon: <Activity size={14} />, label: 'Open Source' },
          { icon: <Sparkles size={14} />, label: 'Sem API Keys' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-[10px] text-white/25">
            <div className="text-[#8B5CF6]/50">{item.icon}</div>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
