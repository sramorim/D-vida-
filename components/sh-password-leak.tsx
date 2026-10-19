'use client'

import { useState, useCallback } from 'react'
import { Search, Eye, EyeOff, AlertTriangle, Shield, Info, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeakData {
  password_length: number
  leak_count: number
  risk_level: string
  recommendations: string[]
}

export function ShPasswordLeak() {
  const [query, setQuery] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<LeakData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const res = await fetch('/api/password-leak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: query }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
      } else {
        setError(json.error || 'Erro ao verificar senha')
      }
    } catch {
      setError('Erro de conexão')
    }
    setLoading(false)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const getRiskBadgeClass = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'alto':
      case 'high':
        return 'badge-danger'
      case 'medio':
      case 'medium':
        return 'badge-amber'
      case 'baixo':
      case 'low':
        return 'badge-neon'
      default:
        return 'badge-cyan'
    }
  }

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#FF3B3B]/10 border border-[#FF3B3B]/20">
            <Shield size={16} className="text-[#FF3B3B]" />
          </div>
          <div>
            <div className="text-[13px] font-black text-white/90">Password Leak Checker</div>
            <div className="text-[10px] text-white/35">Verificar se senha foi comprometida</div>
          </div>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite a senha para verificar..."
            className="input-field pl-11 pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-all"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <button
          onClick={handleSearch}
          disabled={!query.trim() || loading}
          className={cn('btn-primary mt-3 w-full flex items-center justify-center gap-2')}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          {loading ? 'Verificando...' : 'Verificar'}
        </button>
      </div>

      {error && (
        <div className="card border-[#FF3B3B]/20">
          <div className="flex items-center gap-3">
            <AlertTriangle size={16} className="text-[#FF3B3B] shrink-0" />
            <div className="text-[12px] text-[#FF3B3B]">{error}</div>
          </div>
        </div>
      )}

      {data && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Info size={14} className="text-[#00E5FF]" />
            <div className="text-[11px] font-black tracking-widest uppercase text-white/40">
              Resultado da Verificação
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="rounded-[12px] bg-white/[0.04] p-4">
              <div className="text-[10px] text-white/30 uppercase tracking-wider">Vazamentos</div>
              <div className={cn(
                'mt-1 text-[20px] font-black',
                data.leak_count > 0 ? 'text-[#FF3B3B]' : 'text-[#22FF88]'
              )}>
                {data.leak_count.toLocaleString()}
              </div>
            </div>

            <div className="rounded-[12px] bg-white/[0.04] p-4">
              <div className="text-[10px] text-white/30 uppercase tracking-wider">Nível de Risco</div>
              <div className="mt-1">
                <span className={cn(getRiskBadgeClass(data.risk_level))}>
                  {data.risk_level}
                </span>
              </div>
            </div>
          </div>

          {data.recommendations && data.recommendations.length > 0 && (
            <div>
              <div className="text-[10px] font-bold tracking-widest uppercase text-white/30 mb-2">
                Recomendações
              </div>
              <div className="space-y-2">
                {data.recommendations.map((rec, i) => (
                  <div key={i} className="result-item text-[11px] text-white/60">
                    <span className="text-[#00E5FF] shrink-0">•</span>
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!data && !loading && !error && (
        <div className="card text-center py-8">
          <Shield size={32} className="mx-auto text-white/10 mb-3" />
          <div className="text-[12px] text-white/35">Digite uma senha para verificar se foi comprometida</div>
        </div>
      )}
    </div>
  )
}
