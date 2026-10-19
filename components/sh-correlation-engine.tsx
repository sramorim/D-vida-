'use client'

import { GitCompare, Search, Loader2 } from 'lucide-react'
import { useState } from 'react'

export function ShCorrelationEngine() {
  const [queries, setQueries] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const lines = queries.split('\n').map(l => l.trim()).filter(Boolean)
    if (!lines.length) return
    setLoading(true)
    setError('')
    setResults(null)

    try {
      const res = await fetch('/api/premium/advanced/correlate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries: lines }),
      })
      const data = await res.json()
      if (data.success) {
        setResults(data.data)
      } else {
        setError(data.error || 'Nenhum resultado')
      }
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <GitCompare size={14} className="text-red-400" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-red-400/60">Correlation Engine</span>
        </div>
        <h2 className="text-[20px] font-black text-white/90">Motor de Correlação</h2>
      </div>

      <form onSubmit={handleSearch} className="space-y-3">
        <textarea
          value={queries}
          onChange={(e) => setQueries(e.target.value)}
          className="w-full rounded-[10px] border border-white/[0.08] bg-white/[0.03] p-3 text-[13px] text-white/80 placeholder:text-white/20 focus:border-red-500/30 focus:outline-none h-32 resize-none font-mono"
          placeholder="Um dado por linha para correlacionar&#10;user@email.com&#10;username123&#10;+5511999999999"
        />
        <button
          type="submit"
          disabled={loading || !queries.trim()}
          className="flex items-center gap-2 rounded-[10px] bg-red-500/20 border border-red-500/30 px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase text-red-400 hover:bg-red-500/30 disabled:opacity-40"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <GitCompare size={14} />}
          Correlacionar
        </button>
      </form>

      {error && <div className="rounded-[12px] bg-red-500/10 border border-red-500/20 p-4 text-[12px] text-red-400">{error}</div>}

      {results && (
        <div className="rounded-[16px] border border-red-500/10 bg-[#0F121A] p-5 space-y-3">
          <div className="text-[11px] font-bold text-red-400/80 uppercase tracking-wider">Resultados da Correlação</div>
          {typeof results === 'object' ? (
            Object.entries(results).map(([key, value]) => (
              <div key={key} className="text-[12px]">
                <span className="text-white/40">{key}: </span>
                <span className="text-white/70">{String(value)}</span>
              </div>
            ))
          ) : (
            <div className="text-[12px] text-white/60">{String(results)}</div>
          )}
        </div>
      )}
    </div>
  )
}
