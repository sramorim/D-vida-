'use client'

import { ShPremiumHub } from '@/components/sh-premium-hub'

/**
 * Hub premium.
 *
 * A navegação vai para `/?view=<tela>` e a home lê esse parâmetro para abrir
 * a ferramenta certa. Antes o parâmetro era ignorado e toda saída do hub
 * caía no dashboard — o usuário clicava numa ferramenta e voltava para o
 * início, sem entender o motivo.
 */
export default function PremiumPage() {
  return (
    <div className="min-h-screen bg-[#05070A]">
      <div className="matrix-bg" />
      <div className="scan-line" />
      <main className="relative z-10 mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-8">
        <ShPremiumHub
          onNavigate={(view) => {
            if (typeof window !== 'undefined') {
              window.location.href = `/?view=${view}`
            }
          }}
        />
      </main>
    </div>
  )
}
