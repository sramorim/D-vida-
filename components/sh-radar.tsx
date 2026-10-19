'use client'

import { useState, useCallback } from 'react'
import { Radar, Search, ChevronRight, GitCompare, Camera, Clock, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SnapshotPlatform } from '@/lib/types'
import { ProfileDrawer } from './profile-drawer'
import { ShHelpGuide } from './sh-help-guide'
import { ShUpsell } from './sh-upsell'

export function ShRadar() {
  const [query, setQuery] = useState('')
  const [searched, setSearched] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)

  const handleSearch = useCallback(() => {
    if (!query.trim()) return
    setSearched(true)
    setShowDrawer(true)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[20px] border border-white/[0.06] bg-[#0F121A] p-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Radar size={18} className="text-neon/60" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/40">
              Análise de Presença · Separado
            </span>
            <span className="rounded-full bg-neon/10 px-2 py-0.5 text-[8px] font-bold tracking-wider text-neon/70 uppercase">
              NOVO
            </span>
          </div>
          <p className="text-[12px] text-white/35 max-w-sm mx-auto">
            O que Sherlock não faz · Footprint · Risco
          </p>
        </div>

        <ShHelpGuide
          what="O Radar descobre em quais redes sociais um nome de usuário está cadastrado, e calcula o quanto essa pessoa está ‘exposta’ na internet. Se você quer saber por onde alguém aparece online, é aqui."
          steps={[
            { title: 'Digite o username', detail: 'É o @ que a pessoa usa no Instagram, X, TikTok, GitHub — qualquer um. O nome inteiro também funciona em busca por nome.' },
            { title: 'Clique em "Analisar"', detail: 'O sistema varre dezenas de redes de uma vez e monta o mapa de onde esse username existe.' },
            { title: 'Veja o mapa de presença', detail: 'Cada plataforma encontrada aparece listada. Quanto mais plataformas, maior o score de exposição.' },
          ]}
          example="@seu_usuario · sem arroba: seu_usuario"
        />

        <div className="mt-5">
          <div className="text-[10px] font-bold tracking-widest uppercase text-white/25 mb-2">
            Username para presença
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="@username para mapear presença"
              className="w-full rounded-[14px] bg-white/[0.04] border border-white/[0.08] pl-11 pr-4 py-3.5 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-neon/40 focus:ring-1 focus:ring-neon/20 transition-all font-mono"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!query.trim()}
            className={cn(
              'mt-3 w-full flex items-center justify-center gap-2 rounded-[12px] py-3 text-[12px] font-black tracking-widest uppercase transition-all',
              query.trim()
                ? 'bg-neon/15 text-neon border border-neon/20 hover:bg-neon/25'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            )}
          >
            Analisar
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="rounded-[20px] border border-white/[0.06] bg-[#0F121A] p-5">
        <div className="text-[11px] font-black tracking-[0.15em] uppercase text-white/40 mb-4">
          Diferença · Varredura vs Presença
        </div>

        <div className="space-y-4">
          <div className="rounded-[12px] bg-white/[0.03] border border-white/[0.04] p-4">
            <div className="text-[12px] font-bold text-white/70 mb-1">Varredura</div>
            <div className="text-[11px] text-white/40 leading-relaxed">
              Verifica se username existe. Lista perfis. Rápido.
            </div>
          </div>

          <div className="rounded-[12px] bg-neon/[0.03] border border-neon/10 p-4">
            <div className="text-[12px] font-bold text-neon/80 mb-1">Presença (Shandon)</div>
            <div className="text-[11px] text-white/40 leading-relaxed">
              Calcula exposição, correlação foto/bio, risco doxing. O que ninguém faz. Módulo separado.
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[20px] border border-white/[0.06] bg-[#0F121A] p-5">
        <div className="text-[11px] font-black tracking-[0.15em] uppercase text-white/40 mb-4">
          Funcionalidades do Radar
        </div>

        <div className="space-y-2">
          {[
            { icon: <Camera size={14} />, label: 'Criar snapshot', desc: 'Capturar estado atual do perfil' },
            { icon: <GitCompare size={14} />, label: 'Comparar snapshots', desc: 'Ver alterações entre capturas' },
            { icon: <Clock size={14} />, label: 'Histórico temporal', desc: 'Evolução do perfil no tempo' },
            { icon: <AlertTriangle size={14} />, label: 'Alertas de mudança', desc: 'Bio, nome, avatar, links' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 rounded-[10px] bg-white/[0.03] border border-white/[0.04] p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-white/[0.04] text-white/30">
                {item.icon}
              </div>
              <div>
                <div className="text-[11px] font-bold text-white/70">{item.label}</div>
                <div className="text-[10px] text-white/30">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-[12px] bg-amber-500/5 border border-amber-500/10 p-3">
          <div className="text-[10px] text-amber-400/70 leading-relaxed">
            ⚠ Se uma pessoa desaparecer de um snapshot, NÃO declaramos automaticamente que ela deixou de seguir.
            Usamos: &quot;Perfil não encontrado no snapshot atual&quot; quando não houver evidência suficiente.
          </div>
        </div>
      </div>

      <ShUpsell
        title="Descobriu onde a pessoa aparece. E agora?"
        description="A varredura gratuita mostra o mapa. O Radar PRO acompanha tudo isso com o tempo: tira ‘foto’ do perfil, compara e avisa quando algo mudar — sem você precisar olhar."
        bullets={[
          'Comparação automática: vê o que mudou entre duas fotos do perfil',
          'Histórico: a evolução do perfil no tempo, guardada para você',
          'Alertas: bio, nome, foto e links — avisado na hora',
        ]}
        cta="Monitorar no PRO"
      />

      {showDrawer && query && (
        <ProfileDrawer
          platform={'instagram' as SnapshotPlatform}
          username={query.replace('@', '')}
          onClose={() => setShowDrawer(false)}
        />
      )}
    </div>
  )
}