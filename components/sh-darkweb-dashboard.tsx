'use client'

import { Shield, AlertTriangle, Eye, Database, Globe } from 'lucide-react'

export function ShDarkwebDashboard() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Shield size={14} className="text-red-400" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-red-400/60">Dark Web Monitor</span>
        </div>
        <h2 className="text-[20px] font-black text-white/90">Monitoramento Dark Web</h2>
        <p className="mt-2 text-[12px] text-white/35">Acompanhe vazamentos e exposições</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <button className="rounded-[16px] border border-white/[0.06] bg-[#0F121A] p-4 text-left hover:border-red-500/30 transition-all">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-red-500/10 text-red-400">
              <Eye size={16} />
            </div>
            <div>
              <div className="text-[12px] font-bold text-white/80">Dark Search</div>
              <div className="text-[10px] text-white/30">Busca na dark web</div>
            </div>
          </div>
        </button>
        <button className="rounded-[16px] border border-white/[0.06] bg-[#0F121A] p-4 text-left hover:border-red-500/30 transition-all">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-red-500/10 text-red-400">
              <Database size={16} />
            </div>
            <div>
              <div className="text-[12px] font-bold text-white/80">Deep Leak</div>
              <div className="text-[10px] text-white/30">Vazamentos profundos</div>
            </div>
          </div>
        </button>
        <button className="rounded-[16px] border border-white/[0.06] bg-[#0F121A] p-4 text-left hover:border-red-500/30 transition-all">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-red-500/10 text-red-400">
              <AlertTriangle size={16} />
            </div>
            <div>
              <div className="text-[12px] font-bold text-white/80">Paste Monitor</div>
              <div className="text-[10px] text-white/30">Monitor de pastas</div>
            </div>
          </div>
        </button>
        <button className="rounded-[16px] border border-white/[0.06] bg-[#0F121A] p-4 text-left hover:border-red-500/30 transition-all">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-red-500/10 text-red-400">
              <Globe size={16} />
            </div>
            <div>
              <div className="text-[12px] font-bold text-white/80">Forum Monitor</div>
              <div className="text-[10px] text-white/30">Monitor de fóruns</div>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}
