'use client'

import { Crown, ChevronRight, Sparkles } from 'lucide-react'

interface ShUpsellProps {
  title?: string
  description?: string
  bullets?: string[]
  cta?: string
}

/**
 * Gatilho de venda exibido dentro das ferramentas gratuitas.
 *
 * A regra do produto: ferramenta gratuita mostra um resultado parcial e, logo
 * depois, empurra para o Shadow Elite completo. Sem esta peça o usuário usa a
 * ferramenta grátis e vai embora sem saber que existe uma versão mais forte.
 */
export function ShUpsell({
  title = 'Quer ir mais fundo?',
  description = 'Essa análise gratuita é só a superfície. O Shadow PRO cruza tudo o que você viu aqui: contatos, vazamentos, histórico e rastreio completo.',
  bullets = [
    'Resultados completos sem cortes',
    'Seus usernames cruzados em 100+ plataformas',
    'Relatório em um clique para cobrança e provas',
  ],
  cta = 'Desbloquear o PRO',
}: ShUpsellProps) {
  return (
    <div className="relative overflow-hidden rounded-[18px] border border-cyan/20 bg-gradient-to-br from-cyan/[0.07] via-[#0F121A] to-[#0F121A] p-5">
      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-cyan/10 blur-2xl pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-cyan/30 bg-cyan/10">
          <Crown size={20} className="text-cyan" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-black text-white/95">{title}</span>
            <span className="flex items-center gap-1 rounded-full bg-cyan/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan">
              <Sparkles size={9} />
              PRO
            </span>
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-white/45">{description}</p>

          {bullets.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-[11.5px] text-white/55">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cyan" />
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>

        <a
          href="/premium"
          className="group flex shrink-0 items-center justify-center gap-2 rounded-[12px] bg-gradient-to-r from-cyan to-neon px-5 py-3 text-[12px] font-black uppercase tracking-wider text-black transition hover:shadow-[0_0_24px_rgba(34,211,238,0.35)]"
        >
          {cta}
          <ChevronRight size={14} className="transition group-hover:translate-x-0.5" />
        </a>
      </div>
    </div>
  )
}