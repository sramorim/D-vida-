'use client'

import { Lock, ShieldCheck, Instagram, Camera, Snail, Scan, ChevronRight } from 'lucide-react'
import type { ViewType } from '@/components/sh-menu'

const ADMIN_TOOLS: { name: string; description: string; icon: any; view: ViewType }[] = [
  {
    name: 'Sessão Instagram',
    description: 'Configurar cookie sessionid da sua conta para capturas completas',
    icon: Instagram,
    view: 'instagram-auth-settings',
  },
  {
    name: 'Snapshots',
    // "Comparação" é a tela que realmente captura e compara estados. O item
    // "Snapshots" do menu aponta para cá, mas está desativado: não existe
    // componente de captura de snapshot ligado à rota do menu.
    description: 'Capturar e comparar estados de um perfil ao longo do tempo',
    icon: Camera,
    view: 'instagram-auth-comparison',
  },
  {
    name: 'Monitoramento (Radar)',
    description: 'Acompanhar presença online dos perfis que você cadastrou',
    icon: Snail,
    view: 'radar',
  },
  {
    name: 'Username Enumerator',
    description: 'Buscar o mesmo username em 100+ plataformas de uma vez',
    icon: Scan,
    view: 'username-enum',
  },
]

interface Props {
  isAdmin: boolean
  onNavigate: (view: ViewType) => void
}

export function ShPrivateModule({ isAdmin, onNavigate }: Props) {
  return (
    <div className="space-y-4">
      <div className="card border-[#EF4444]/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20">
            <Lock size={16} className="text-[#EF4444]" />
          </div>
          <div>
            <div className="text-[13px] font-black text-[#EF4444]">Área Restrita</div>
            <div className="text-[10px] text-white/35">Somente o administrador</div>
          </div>
        </div>

        {!isAdmin && (
          <div className="bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Lock size={12} className="text-[#EF4444] mt-0.5 shrink-0" />
              <div className="text-[10px] text-[#EF4444]/80">
                <strong>Acesso Restrito.</strong> Esta área é exclusiva do criador da plataforma. Nem o plano PRO libera estas opções.
                <div className="mt-1 text-white/30">
                  Se você e o criador combinaram um trabalho específico, ele é entregue diretamente — use o WhatsApp oficial.
                </div>
              </div>
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="space-y-2">
            <div className="bg-[#22FF88]/5 border border-[#22FF88]/20 rounded-lg p-3 mb-3">
              <div className="flex items-start gap-2">
                <ShieldCheck size={12} className="text-[#22FF88] mt-0.5 shrink-0" />
                <div className="text-[10px] text-[#22FF88]/80">
                  <strong>Modo Administrador ativo.</strong> Ferramentas reais disponíveis abaixo.
                  <div className="mt-1 text-white/30">
                    Investigações específicas (+18, namoros, dark web) não são automáticas — são combinadas e entregues pelo criador.
                  </div>
                </div>
              </div>
            </div>

            {ADMIN_TOOLS.map((tool) => (
              <button
                key={tool.view}
                onClick={() => onNavigate(tool.view)}
                className="flex w-full items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-[#22FF88]/30 hover:bg-white/[0.04] transition-all text-left"
              >
                <tool.icon size={16} className="shrink-0 text-[#22FF88]" />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold text-white/80">{tool.name}</div>
                  <div className="text-[9px] text-white/30">{tool.description}</div>
                </div>
                <ChevronRight size={12} className="text-white/20" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}