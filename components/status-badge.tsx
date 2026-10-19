'use client'

import { cn } from '@/lib/utils'

type StatusType = 'found' | 'not_found' | 'rate_limited' | 'error' | 'unavailable' | 'possible' | 'valid' | 'invalid' | 'follower' | 'following' | 'scanning' | 'idle'

interface StatusBadgeProps {
  status: StatusType
  label?: string
  className?: string
}

const STATUS_CONFIG: Record<StatusType, { bg: string; text: string; border: string; dot: string; defaultLabel: string }> = {
  found:        { bg: 'bg-neon/10',   text: 'text-neon',           border: 'border-neon/20',           dot: 'bg-neon',           defaultLabel: 'Encontrado' },
  possible:     { bg: 'bg-amber-500/10', text: 'text-amber-400',  border: 'border-amber-500/20',      dot: 'bg-amber-400',      defaultLabel: 'Possível' },
  not_found:    { bg: 'bg-white/5',   text: 'text-white/40',      border: 'border-white/10',          dot: 'bg-white/30',       defaultLabel: 'Não encontrado' },
  rate_limited: { bg: 'bg-amber-500/10', text: 'text-amber-400',  border: 'border-amber-500/20',      dot: 'bg-amber-400',      defaultLabel: 'Rate limit' },
  error:        { bg: 'bg-red-500/10', text: 'text-red-400',      border: 'border-red-500/20',        dot: 'bg-red-400',        defaultLabel: 'Erro' },
  unavailable:  { bg: 'bg-white/5',   text: 'text-white/30',      border: 'border-white/10',          dot: 'bg-white/20',       defaultLabel: 'Indisponível' },
  valid:        { bg: 'bg-neon/10',   text: 'text-neon',           border: 'border-neon/20',           dot: 'bg-neon',           defaultLabel: 'Válido' },
  invalid:      { bg: 'bg-red-500/10', text: 'text-red-400',      border: 'border-red-500/20',        dot: 'bg-red-400',        defaultLabel: 'Inválido' },
  follower:     { bg: 'bg-blue-500/10', text: 'text-blue-400',    border: 'border-blue-500/20',       dot: 'bg-blue-400',       defaultLabel: 'Seguidor' },
  following:    { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20',    dot: 'bg-purple-400',     defaultLabel: 'Seguindo' },
  scanning:     { bg: 'bg-neon/10',   text: 'text-neon',           border: 'border-neon/20',           dot: 'bg-neon animate-pulse', defaultLabel: 'Escaneando' },
  idle:         { bg: 'bg-white/5',   text: 'text-white/40',      border: 'border-white/10',          dot: 'bg-white/30',       defaultLabel: 'Aguardando' },
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase',
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
      {label || config.defaultLabel}
    </span>
  )
}
