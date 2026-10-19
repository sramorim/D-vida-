'use client'

import Image from 'next/image'
import { Menu, Shield, Search, LogIn } from 'lucide-react'
import type { ViewType } from './sh-menu'

interface ShHeaderProps {
  onMenuOpen: () => void
  onNavigate?: (view: ViewType) => void
}

export function ShHeader({ onMenuOpen, onNavigate }: ShHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.04] bg-[#020617]/80 backdrop-blur-xl">
      {/* Top accent line */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#8B5CF6]/30 to-transparent" />
      
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        {/* Logo */}
        <button 
          onClick={() => onNavigate?.('dashboard')}
          className="flex items-center gap-3 group"
        >
          <div className="relative h-10 w-10 overflow-hidden rounded-xl ring-1 ring-[#8B5CF6]/20 bg-gradient-to-br from-[#8B5CF6]/10 to-[#06B6D4]/10 p-[1px]">
            <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/20 to-[#06B6D4]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative h-full w-full overflow-hidden rounded-[11px] bg-[#0F172A]">
              <Image
                src="/logo.svg"
                alt="SHANDON ELITE"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-black tracking-[0.12em] text-white/90 group-hover:text-white transition-colors">
                SHANDON
              </span>
              <span className="text-[13px] font-black tracking-[0.12em] text-[#8B5CF6]">
                ELITE
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] tracking-[0.18em] text-white/25">
              <span className="h-1 w-1 rounded-full bg-[#06B6D4] animate-pulse" />
              OSINT ENGINE v2.0
            </div>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {[
            { label: 'Dashboard', view: 'dashboard' as ViewType },
            { label: 'Investigar', view: 'osint-user' as ViewType },
            { label: 'Redes Sociais', view: 'social-check' as ViewType },
            { label: 'Dark Web', view: 'darkweb' as ViewType },
            { label: 'Planos', view: 'planos' as ViewType },
          ].map((item) => (
            <button
              key={item.view}
              onClick={() => onNavigate?.(item.view)}
              className="px-4 py-2 text-[11px] font-semibold tracking-wider text-white/35 hover:text-white/80 hover:bg-white/[0.04] rounded-lg transition-all duration-200 uppercase"
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Status badge */}
          <div className="hidden md:flex items-center gap-1.5 rounded-full bg-[#22FF88]/8 border border-[#22FF88]/15 px-3 py-1.5">
            <Shield size={10} className="text-[#22FF88]" />
            <span className="text-[9px] font-bold tracking-wider text-[#22FF88]/70 uppercase">100% Grátis</span>
          </div>

          {/* Quick search */}
          <button
            onClick={() => onNavigate?.('osint-user')}
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.04] text-white/30 hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/10 hover:border-[#8B5CF6]/20 transition-all duration-200"
          >
            <Search size={15} />
          </button>

          {/* Login button */}
          <button
            onClick={() => onNavigate?.('login')}
            className="hidden sm:flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/[0.04] px-4 py-2 text-[10px] font-bold tracking-wider text-white/50 hover:text-white/80 hover:bg-white/[0.06] hover:border-white/[0.08] transition-all duration-200 uppercase"
          >
            <LogIn size={12} />
            Entrar
          </button>

          {/* Mobile menu button */}
          <button
            onClick={onMenuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.04] text-white/40 hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/10 hover:border-[#8B5CF6]/20 transition-all duration-200"
          >
            <Menu size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
