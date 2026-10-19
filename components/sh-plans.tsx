'use client'

import { Crown, Check, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

const PLANS = [
  {
    name: 'Starter',
    price: 'Grátis',
    period: '/ teste',
    features: [
      '5 buscas / dia',
      'Módulo Todos',
      'Sem presença',
      'Sem API',
    ],
    cta: 'Começar',
    popular: false,
  },
  {
    name: 'Elite',
    price: 'R$ 49',
    period: '/ mês',
    features: [
      'Buscas ilimitadas',
      'Todos os módulos',
      'Análise de Presença',
      'Snapshots + Comparação',
      'API completa',
      'Suporte prioritário',
    ],
    cta: 'Assinar Elite',
    popular: true,
  },
  {
    name: 'Pro',
    price: 'R$ 99',
    period: '/ mês',
    features: [
      'Tudo do Elite',
      'Multi-usuário',
      'Webhooks',
      'Relatórios PDF',
      'Monitoramento contínuo',
      'SLA garantido',
    ],
    cta: 'Assinar Pro',
    popular: false,
  },
]

export function ShPlans() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Crown size={14} className="text-white/30" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/30">
            Planos · Checkout · Profissional
          </span>
        </div>
        <h2 className="text-[24px] md:text-[28px] font-black text-white/90">
          Pronto para vender.{' '}
          <span className="text-white/30">De verdade.</span>
        </h2>
        <p className="mt-2 text-[12px] text-white/35 max-w-md mx-auto">
          Matrix preto, neon fraco, avatar puro sem notebook, fundo transparente.
          Home page Shandon Elite real.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              'rounded-[20px] border p-5 transition-all',
              plan.popular
                ? 'border-neon/30 bg-[#0F121A] shadow-[0_0_30px_rgba(0,255,65,0.05)]'
                : 'border-white/[0.06] bg-[#0F121A]'
            )}
          >
            {plan.popular && (
              <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-neon/10 border border-neon/20 px-2.5 py-0.5">
                <Star size={10} className="text-neon" />
                <span className="text-[9px] font-bold tracking-wider uppercase text-neon">Mais Popular</span>
              </div>
            )}

            <div className="text-[11px] font-black tracking-widest uppercase text-white/40">{plan.name}</div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-[28px] font-black text-white/90">{plan.price}</span>
              <span className="text-[11px] text-white/30">{plan.period}</span>
            </div>

            <div className="mt-5 space-y-2.5">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <Check size={12} className="text-neon/60 shrink-0" />
                  <span className="text-[11px] text-white/50">{feature}</span>
                </div>
              ))}
            </div>

            <button
              className={cn(
                'mt-6 w-full flex items-center justify-center gap-2 rounded-[12px] py-3 text-[11px] font-black tracking-widest uppercase transition-all',
                plan.popular
                  ? 'bg-white text-black hover:bg-white/90 active:scale-[0.98]'
                  : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/[0.08] hover:text-white/80'
              )}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}