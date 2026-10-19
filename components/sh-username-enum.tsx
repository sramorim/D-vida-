'use client'

import { useState, useCallback } from 'react'
import { Search, Users, ExternalLink, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PlatformResult {
  platform: string
  found: boolean
  url?: string
  status?: string
}

interface UsernameEnumData {
  username: string
  results: PlatformResult[]
  total: number
  found: number
}

export function ShUsernameEnum() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<UsernameEnumData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const res = await fetch('/api/username-enum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: query }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
      } else {
        setError(json.error || 'Erro ao buscar username')
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
          <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#00E5FF]/10 border border-[#00E5FF]/20">
            <Users size={16} className="text-[#00E5FF]" />
          </div>
          <div>
            <div className="text-[13px] font-black text-white/90">Username Enumerator</div>
            <div className="text-[10px] text-white/35">Verificar username em múltiplas plataformas</div>
          </div>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite o username para buscar..."
            className="input-field pl-11"
          />
        </div>

        <button
          onClick={handleSearch}
          disabled={!query.trim() || loading}
          className={cn('btn-primary mt-3 w-full flex items-center justify-center gap-2')}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          {loading ? 'Escaneando...' : 'Escanear'}
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
          <div className="flex items-center justify-between mb-4">
            <div className="text-[11px] font-black tracking-widest uppercase text-white/40">
              Resultados para &quot;{data.username}&quot;
            </div>
            <div className="text-[10px] text-white/30">
              {data.found}/{data.total} encontrados
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.results.map((result) => (
              <div
                key={result.platform}
                className={cn(
                  'platform-card p-3 flex items-center gap-3',
                  result.found ? 'border-[#22FF88]/20' : 'border-[#FF3B3B]/20'
                )}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-white/[0.04]">
                  {result.found ? (
                    <CheckCircle size={16} className="text-[#22FF88]" />
                  ) : (
                    <XCircle size={16} className="text-[#FF3B3B]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-bold text-white/80">{result.platform}</div>
                  <div className="text-[10px] text-white/30 truncate">{result.found ? 'Encontrado' : 'Não encontrado'}</div>
                </div>
                {result.found && result.url ? (
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 p-1.5 rounded-[6px] bg-[#22FF88]/10 text-[#22FF88] hover:bg-[#22FF88]/20 transition-all"
                  >
                    <ExternalLink size={12} />
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {!data && !loading && !error && (
        <div className="card text-center py-8">
          <Users size={32} className="mx-auto text-white/10 mb-3" />
          <div className="text-[12px] text-white/35">Digite um username para iniciar a verificação</div>
        </div>
      )}
    </div>
  )
}
