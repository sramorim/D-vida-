'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Search, Eye, Shield, Zap, Database, AlertTriangle, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SearchResult, ApiResponse } from '@/lib/types'
import { ResultCard } from './result-card'
import { PresenceSummary } from './presence-summary'
import { LoadingScan } from './loading-scan'

type ScanStatus = 'idle' | 'scanning' | 'completed' | 'error'

interface ShOsintProps {
  initialView?: 'user' | 'email' | 'phone'
}

export function ShOsint({ initialView = 'user' }: ShOsintProps) {
  const [view, setView] = useState(initialView)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<ScanStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<SearchResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    setView(initialView)
  }, [initialView])

  const charCount = query.length
  const maxChars = 32

  const jsonPreview = {
    target: query || 'username',
    module: 'todos',
    mode: 'varredura',
    avatar_only: true,
    transparent: true,
    tor: true,
    status: status === 'scanning' ? 'scanning' : status === 'completed' ? 'completed' : 'idle',
  }

  const handleSearch = useCallback(async () => {
    if (query.trim().length < 2) return

    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setStatus('scanning')
    setProgress(0)
    setResults([])
    setError(null)

    try {
      let endpoint = ''
      let body: Record<string, unknown> = {}

      if (view === 'email') {
        endpoint = '/api/search/email'
        body = { email: query }
      } else if (view === 'phone') {
        endpoint = '/api/search/phone'
        body = { phone: query }
      } else {
        endpoint = '/api/search/username'
        body = { target: query, modules: ['todos'], avatarOnly: false, transparent: false, tor: true }
      }

      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + Math.random() * 8, 92))
      }, 600)

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      })

      clearInterval(progressInterval)

      const data = await response.json()

      if (!data.success) {
        setStatus('error')
        setProgress(100)
        setError(data.error || 'Erro desconhecido na busca')
        return
      }

      const r: SearchResult[] = data.data?.results || (Array.isArray(data.data) ? data.data : [])
      setResults(r)
      setStatus('completed')
      setProgress(100)
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setStatus('error')
      setProgress(100)
      setError(err instanceof Error ? err.message : 'Erro de conexão')
    }
  }, [query, view])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handleReset = () => {
    abortRef.current?.abort()
    setQuery('')
    setStatus('idle')
    setProgress(0)
    setResults([])
    setError(null)
  }

  const foundResults = results.filter((r) => r.exists === true)

  return (
    <div className="space-y-5">
      <div className="rounded-[20px] border border-white/[0.06] bg-[#0F121A] p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-[11px] font-black tracking-[0.15em] uppercase text-white/40">
            Investigar
          </div>
          <div className="flex-1 h-px bg-white/[0.06]" />
          <div className="text-[10px] text-white/25">
            LGPD · Anônimo
          </div>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value.slice(0, maxChars))}
            onKeyDown={handleKeyDown}
            placeholder={view === 'email' ? 'Digite o e-mail...' : view === 'phone' ? 'Digite o telefone...' : 'Digite e veja'}
            className="w-full rounded-[14px] bg-white/[0.04] border border-white/[0.08] pl-11 pr-20 py-4 text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:border-neon/40 focus:ring-1 focus:ring-neon/20 transition-all font-mono"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <span className={cn(
              'text-[11px] font-mono',
              charCount >= maxChars ? 'text-amber-400' : 'text-white/25'
            )}>
              {charCount}/{maxChars}
            </span>
            {charCount > 0 && (
              <span className="h-2 w-2 rounded-full bg-[#00FF41]" />
            )}
          </div>
        </div>

        <div className="mt-3 text-center text-[11px] text-white/25">
          Você está preparado para ver?
        </div>

        <button
          onClick={handleSearch}
          disabled={query.trim().length < 2 || status === 'scanning'}
          className={cn(
            'mt-4 w-full flex items-center justify-center gap-2 rounded-[14px] py-4 text-[13px] font-black tracking-[0.15em] uppercase transition-all',
            query.trim().length >= 2 && status !== 'scanning'
              ? 'bg-white text-black hover:bg-white/90 active:scale-[0.98]'
              : 'bg-white/5 text-white/30 cursor-not-allowed'
          )}
        >
          <Eye size={16} />
          Investigar
        </button>

        <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-white/25">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00FF41]" />
            Filtro ativo
          </span>
          <span>Todos · 15 plataformas</span>
        </div>
      </div>

      <div className="rounded-[20px] border border-white/[0.06] bg-[#0F121A] p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] font-black tracking-[0.15em] uppercase text-white/40">
            Intel · Preview
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00FF41] animate-pulse" />
            <span className="text-[10px] text-[#00FF41]/60 font-bold">AO VIVO</span>
          </div>
        </div>

        <div className="rounded-[12px] bg-[#05070A] border border-white/[0.04] p-4 font-mono text-[11px] leading-relaxed">
          <div className="text-white/25">{'>_'} shandon@elite:~$ cat target.json</div>
          <pre className="mt-2 text-white/60">{JSON.stringify(jsonPreview, null, 2)}</pre>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-[12px] bg-white/[0.04] px-3 py-2.5">
            <div className="text-[10px] text-white/30">Plataformas</div>
            <div className="mt-1 text-[12px] font-bold text-white/80">15 ativas</div>
          </div>
          <div className="rounded-[12px] bg-white/[0.04] px-3 py-2.5">
            <div className="text-[10px] text-white/30">Tempo</div>
            <div className="mt-1 text-[12px] font-bold text-white/80">1.4s</div>
          </div>
          <div className="rounded-[12px] bg-white/[0.04] px-3 py-2.5">
            <div className="text-[10px] text-white/30">Estilo</div>
            <div className="mt-1 text-[12px] font-bold text-white/80">Matrix preto</div>
          </div>
        </div>
      </div>

      {status === 'scanning' && (
        <LoadingScan progress={progress} query={query} />
      )}

      {status === 'error' && (
        <div className="card border-red-500/20">
          <div className="flex items-center gap-3">
            <AlertTriangle size={16} className="text-red-400 shrink-0" />
            <div>
              <div className="text-[12px] font-bold text-red-400">Erro na busca</div>
              <div className="text-[11px] text-white/40 mt-0.5">{error}</div>
            </div>
          </div>
          <button onClick={handleReset} className="mt-3 btn-secondary text-[11px] w-full sm:w-auto">
            Tentar novamente
          </button>
        </div>
      )}

      {status === 'completed' && results.length === 0 && (
        <div className="card">
          <div className="text-center py-6">
            <Database size={32} className="mx-auto text-white/15 mb-3" />
            <div className="text-[13px] text-white/40">
              Nenhum resultado para <span className="text-white/60 font-mono">{query}</span>
            </div>
            <button onClick={handleReset} className="mt-4 btn-secondary text-[11px]">Nova busca</button>
          </div>
        </div>
      )}

      {status === 'completed' && results.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-black tracking-widest uppercase text-white/40">
              {foundResults.length} de {results.length} plataformas encontradas
            </div>
            <button onClick={handleReset} className="btn-ghost text-[10px]">Nova busca</button>
          </div>

          <div className="space-y-3">
            {foundResults.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={12} className="text-neon" />
                  <span className="text-[10px] font-bold tracking-widest uppercase text-neon/60">Encontrados</span>
                </div>
                <div className="space-y-3">
                  {foundResults.map((result, i) => (
                    <ResultCard key={result.id} result={result} index={i} />
                  ))}
                </div>
              </div>
            )}

            {results.length > foundResults.length && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={12} className="text-white/25" />
                  <span className="text-[10px] font-bold tracking-widest uppercase text-white/25">Não encontrados</span>
                </div>
                <div className="space-y-3">
                  {results.filter((r) => r.exists !== true).map((result, i) => (
                    <ResultCard key={result.id} result={result} index={i} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6">
            <PresenceSummary results={results} query={query} />
          </div>
        </>
      )}
    </div>
  )
}