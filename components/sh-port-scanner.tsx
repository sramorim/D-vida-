'use client'

import { useState, useCallback } from 'react'
import { Search, Wifi, AlertTriangle, CheckCircle, XCircle, Timer, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OpenPort {
  port: number
  service: string
  state: string
}

interface PortScannerData {
  host: string
  open_ports: OpenPort[]
  closed_count: number
  scan_time: string
  total_scanned: number
}

export function ShPortScanner() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PortScannerData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const res = await fetch('/api/port-scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: query }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
      } else {
        setError(json.error || 'Erro ao escanear portas')
      }
    } catch {
      setError('Erro de conexão')
    }
    setLoading(false)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#FF3B3B]/10 border border-[#FF3B3B]/20">
            <Wifi size={16} className="text-[#FF3B3B]" />
          </div>
          <div>
            <div className="text-[13px] font-black text-white/90">Network Port Scanner</div>
            <div className="text-[10px] text-white/35">Verificar portas abertas de um host</div>
          </div>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="192.168.1.1 ou exemplo.com"
            className="input-field pl-11"
          />
        </div>

        <button
          onClick={handleSearch}
          disabled={!query.trim() || loading}
          className={cn('btn-primary mt-3 w-full flex items-center justify-center gap-2')}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          {loading ? 'Escaneando...' : 'Escanear Portas'}
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
        <>
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Wifi size={14} className="text-[#FF3B3B]" />
              <div className="text-[11px] font-black tracking-widest uppercase text-white/40">
                Resultado para {data.host}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="rounded-[12px] bg-white/[0.04] p-4 text-center">
                <div className="text-[10px] text-white/30 uppercase tracking-wider">Portas Abertas</div>
                <div className="mt-1 text-[20px] font-black text-[#22FF88]">{data.open_ports.length}</div>
              </div>
              <div className="rounded-[12px] bg-white/[0.04] p-4 text-center">
                <div className="text-[10px] text-white/30 uppercase tracking-wider">Portas Fechadas</div>
                <div className="mt-1 text-[20px] font-black text-[#FF3B3B]">{data.closed_count}</div>
              </div>
              <div className="rounded-[12px] bg-white/[0.04] p-4 text-center">
                <div className="text-[10px] text-white/30 uppercase tracking-wider">Tempo</div>
                <div className="mt-1 text-[12px] font-bold text-white/70 flex items-center justify-center gap-1">
                  <Timer size={12} />
                  {data.scan_time}
                </div>
              </div>
            </div>
          </div>

          {data.open_ports.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={14} className="text-[#22FF88]" />
                <div className="text-[11px] font-black tracking-widest uppercase text-white/40">
                  Portas Abertas
                </div>
              </div>

              <div className="space-y-2">
                {data.open_ports.map((port) => (
                  <div key={port.port} className="result-item">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#22FF88]/10">
                      <CheckCircle size={14} className="text-[#22FF88]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-mono text-white/80">
                        Porta <span className="text-[#00E5FF]">{port.port}</span>
                      </div>
                      <div className="text-[10px] text-white/40">{port.service}</div>
                    </div>
                    <span className="badge-neon">{port.state}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.closed_count > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <XCircle size={14} className="text-[#FF3B3B]" />
                <div className="text-[11px] font-black tracking-widest uppercase text-white/40">
                  Portas Fechadas
                </div>
              </div>
              <div className="text-[12px] text-white/40">
                {data.closed_count} portas fechadas ou filtradas
              </div>
            </div>
          )}
        </>
      )}

      {!data && !loading && !error && (
        <div className="card text-center py-8">
          <Wifi size={32} className="mx-auto text-white/10 mb-3" />
          <div className="text-[12px] text-white/35">Digite um host para escanear portas abertas</div>
        </div>
      )}
    </div>
  )
}
