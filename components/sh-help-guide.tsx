'use client'

import { HelpCircle } from 'lucide-react'

interface Step {
  title: string
  detail: string
}

interface ShHelpGuideProps {
  what: string
  steps: Step[]
  example?: string
}

/**
 * Guia de uso em linguagem simples, para quem não é da área técnica.
 * O problema que resolve: a interface do Shadow Elite fala a língua de quem
 * já entende de OSINT ("snapshot", "footprint", "correlação"). Um leigo abre
 * a ferramenta e não sabe o que digitar nem o que está olhando. Este bloco dá
 * o caminho em 1-2-3 e diz, em uma frase, o que a ferramenta faz por ele.
 */
export function ShHelpGuide({ what, steps, example }: ShHelpGuideProps) {
  return (
    <div className="rounded-[18px] border border-white/[0.06] bg-[#0F121A] p-5">
      <div className="flex items-center gap-2 mb-3">
        <HelpCircle size={15} className="text-cyan/70" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan/70">
          Para quem não é da área
        </span>
      </div>

      <p className="text-[13px] leading-relaxed text-white/55">{what}</p>

      <div className="mt-4 space-y-3">
        {steps.map((s, i) => (
          <div key={s.title} className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-cyan/20 bg-cyan/[0.06] text-[11px] font-black text-cyan">
              {i + 1}
            </div>
            <div>
              <div className="text-[12px] font-bold text-white/75">{s.title}</div>
              <div className="text-[11.5px] leading-relaxed text-white/40">{s.detail}</div>
            </div>
          </div>
        ))}
      </div>

      {example && (
        <div className="mt-4 rounded-[10px] border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 font-mono text-[11px] text-white/35">
          Exemplo: <span className="text-cyan/80">{example}</span>
        </div>
      )}
    </div>
  )
}