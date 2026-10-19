'use client'

import { useState, useCallback } from 'react'
import { Search, Globe, Copy, ExternalLink, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type DorkCategory = 'all' | 'social' | 'files' | 'security' | 'misc'

interface Dork {
  name: string
  description: string
  dork: string
}

interface DorksData {
  target: string
  category: DorkCategory
  dorks: Dork[]
  total: number
}

const categories: { key: DorkCategory; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'social', label: 'Social' },
  { key: 'files', label: 'Arquivos' },
  { key: 'security', label: 'Segurança' },
  { key: 'misc', label: 'Misc' },
]

export function ShGoogleDorks() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<DorkCategory>('all')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<DorksData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const res = await fetch('/api/google-dorks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: query, category }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
      } else {
        setError(json.error || 'Erro ao gerar dorks')
      }
    } catch {
      setError('Erro de conexão')
    }
    setLoading(false)
  }, [query, category])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handleCopy = async (dork: string, index: number) => {
    try {
      await navigator.clipboard.writeText(dork)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#00E5FF]/10 border border-[#00E5FF]/20">
            <Globe size={16} className="text-[#00E5FF]" />
          </div>
          <div>
            <div className="text-[13px] font-black text-white/90">Google Dorks Builder</div>
            <div className="text-[10px] text-white/35">Gerar dorks para reconhecimento</div>
          </div>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nome ou domínio alvo..."
            className="input-field pl-11"
          />
        </div>

        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={cn(
                'shrink-0 rounded-[10px] px-3 py-2 text-[10px] font-bold tracking-wider uppercase transition-all',
                category === cat.key
                  ? 'bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/20'
                  : 'bg-white/[0.04] text-white/40 border border-white/[0.06] hover:bg-white/[0.08]'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleSearch}
          disabled={!query.trim() || loading}
          className={cn('btn-primary mt-3 w-full flex items-center justify-center gap-2')}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          {loading ? 'Gerando...' : 'Gerar Dorks'}
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
              {data.total} dorks geradas
            </div>
            <div className="text-[10px] text-white/30">{data.target}</div>
          </div>

          <div className="space-y-2">
            {data.dorks.map((dork, i) => (
              <div key={i} className="result-item group">
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-bold text-white/80">{dork.name}</div>
                  <div className="text-[10px] text-white/40 mt-0.5">{dork.description}</div>
                  <div className="mt-1 text-[10px] text-[#00E5FF]/60 font-mono truncate">{dork.dork}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCopy(dork.dork, i)}
                    className={cn(
                      'p-1.5 rounded-[6px] transition-all',
                      copiedIndex === i
                        ? 'bg-[#22FF88]/10 text-[#22FF88]'
                        : 'bg-white/[0.04] text-white/40 hover:text-[#00E5FF] hover:bg-[#00E5FF]/10'
                    )}
                    title="Copiar dork"
                  >
                    {copiedIndex === i ? <CheckCircle size={12} /> : <Copy size={12} />}
                  </button>
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(dork.dork)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-[6px] bg-white/[0.04] text-white/40 hover:text-[#22FF88] hover:bg-[#22FF88]/10 transition-all"
                    title="Abrir no Google"
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!data && !loading && !error && (
        <div className="card text-center py-8">
          <Globe size={32} className="mx-auto text-white/10 mb-3" />
          <div className="text-[12px] text-white/35">Defina um alvo e gere dorks para reconhecimento</div>
        </div>
      )}
    </div>
  )
}
