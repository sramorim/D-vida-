'use client'

import { Zap, Search, Database, Mail, Camera, Globe, Shield, GitCompare } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ViewType } from './sh-menu'

interface AdvancedTool {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
}

const TOOLS: AdvancedTool[] = [
  { id: 'bulk-scan', title: 'Bulk Scanner', description: 'Scan em massa', icon: <Database size={16} />, color: 'cyan' },
  { id: 'advanced-dorks', title: 'Advanced Dorks', description: 'Dorks avançadas', icon: <Search size={16} />, color: 'blue' },
  { id: 'email-trace', title: 'Email Trace', description: 'Rastreamento de e-mail', icon: <Mail size={16} />, color: 'purple' },
  { id: 'metadata-extractor', title: 'Metadata Extractor', description: 'Extração de metadados', icon: <Camera size={16} />, color: 'pink' },
  { id: 'wayback-pro', title: 'Wayback Pro', description: 'Histórico avançado', icon: <Globe size={16} />, color: 'green' },
  { id: 'ssl-history', title: 'SSL History', description: 'Histórico SSL', icon: <Shield size={16} />, color: 'amber' },
  { id: 'correlation', title: 'Correlation Engine', description: 'Correlação de dados', icon: <GitCompare size={16} />, color: 'red' },
  { id: 'timeline', title: 'Timeline Builder', description: 'Linha do tempo', icon: <Zap size={16} />, color: 'yellow' },
]

export function ShAdvancedDashboard({ onNavigate }: { onNavigate?: (view: ViewType) => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Zap size={14} className="text-cyan-400" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-cyan-400/60">Advanced OSINT</span>
        </div>
        <h2 className="text-[20px] font-black text-white/90">Ferramentas Avançadas</h2>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onNavigate?.(tool.id as ViewType)}
            className="rounded-[16px] border border-white/[0.06] bg-[#0F121A] p-4 text-left hover:border-cyan-500/30 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-[10px] bg-cyan-500/10 text-cyan-400')}>
                {tool.icon}
              </div>
              <div>
                <div className="text-[12px] font-bold text-white/80">{tool.title}</div>
                <div className="text-[10px] text-white/30">{tool.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
