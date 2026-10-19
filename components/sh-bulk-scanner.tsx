'use client'

import { Database, Search, Loader2 } from 'lucide-react'
import { useState } from 'react'

export function ShBulkScanner() {
  const [targets, setTargets] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState('')

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    const lines = targets.split('\n').map(l => l.trim()).filter(Boolean)
    if (!lines.length) return
    setLoading(true)
    setError('')
    setResults([])

    try {
      const res = await fetch('/api/premium/advanced/bulk-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets: lines }),
      })
      const data = await res.json()
      if (data.success) {
        setResults(data.data || [])
      } else {
        setError(data.error || 'Erro no scan')
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
          <Database size={14} className="text-cyan-400" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-cyan-400/60">Bulk Scanner</span>
        </div>
        <h2 className="text-[20px] font-black text-white/90">Scanner em Massa</h2>
      </div>

      <form onSubmit={handleScan} className="space-y-3">
        <textarea
          value={targets}
          onChange={(e) => setTargets(e.target.value)}
          className="w-full rounded-[10px] border border-white/[0.08] bg-white/[0.03] p-3 text-[13px] text-white/80 placeholder:text-white/20 focus:border-cyan-500/30 focus:outline-none h-32 resize-none font-mono"
          placeholder="Um alvo por linha&#10;exemplo.com&#10;user@email.com&#10;@username"
        />
        <button
          type="submit"
          disabled={loading || !targets.trim()}
          className="flex items-center gap-2 rounded-[10px] bg-cyan-500/20 border border-cyan-500/30 px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-40"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          Escanear
        </button>
      </form>

      {error && <div className="rounded-[12px] bg-red-500/10 border border-red-500/20 p-4 text-[12px] text-red-400">{error}</div>}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((r: any, i: number) => (
            <div key={i} className="rounded-[12px] border border-cyan-500/10 bg-[#0F121A] p-4">
              <div className="text-[12px] text-white/60">{r.target || r.email || JSON.stringify(r)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
