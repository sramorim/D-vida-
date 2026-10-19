'use client'

import { useState, useCallback } from 'react'
import { Loader2, ShieldAlert, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Breach {
  name: string
  date: string
  count: number
  dataClasses: string[]
}

interface BreachCheckData {
  email: string
  breached: boolean
  breachCount: number
  breaches: Breach[]
}

export function ShBreachCheck() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<BreachCheckData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const res = await fetch('/api/breach-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: query.trim() }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
      } else {
        setError(json.error || 'Falha ao verificar vazamentos')
      }
    } catch {
      setError('Falha na conexão')
    } finally {
      setLoading(false)
    }
  }, [query])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <ShieldAlert size={18} className="text-[#FF3B3B]" />
        <h2 className="text-sm font-black tracking-widest uppercase text-white/80">Breach Check</h2>
      </div>
      <p className="text-[11px] text-white/30 mb-4">Verifique se um e-mail apareceu em vazamentos de dados</p>

      <div className="flex gap-2">
        <input
          type="email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Ex: user@example.com"
          className="input-field flex-1"
        />
        <button onClick={handleSearch} disabled={loading || !query.trim()} className="btn-primary">
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Verificar'}
        </button>
      </div>

      {error && (
        <div className="rounded-[10px] bg-[#FF3B3B]/10 border border-[#FF3B3B]/20 p-4 text-[12px] text-[#FF3B3B]">
          {error}
        </div>
      )}

      {data && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[#00E5FF] font-mono text-[13px] break-all">{data.email}</span>
            {data.breached ? (
              <span className="badge-danger">
                <XCircle size={10} /> Vazado
              </span>
            ) : (
              <span className="badge-neon">
                <CheckCircle size={10} /> Seguro
              </span>
            )}
          </div>

          <div className="text-[13px] text-white/60 mb-3">
            Vazamentos encontrados: <span className="text-[#FF3B3B] font-bold">{data.breachCount}</span>
          </div>

          {data.breaches.length > 0 && (
            <div className="space-y-2">
              {data.breaches.map((breach, i) => (
                <div key={i} className="rounded-[8px] bg-white/[0.03] border border-[#1E293B] p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-bold text-white/80">{breach.name}</span>
                    <span className="text-[10px] text-white/30">{breach.date}</span>
                  </div>
                  <div className="text-[11px] text-white/40 mb-1">
                    Registros: <span className="text-[#FF3B3B] font-bold">{breach.count.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {breach.dataClasses.map((cls, j) => (
                      <span key={j} className="badge-cyan text-[9px]">{cls}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
