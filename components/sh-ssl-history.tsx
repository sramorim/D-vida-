'use client'

import { Shield, Search, Loader2 } from 'lucide-react'
import { useState } from 'react'

export function ShSslHistory() {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!domain.trim()) return
    setLoading(true)
    setError('')
    setResults([])

    try {
      const res = await fetch('/api/premium/advanced/ssl-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setResults(data.data || [])
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
          <Shield size={14} className="text-amber-400" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-amber-400/60">SSL History</span>
        </div>
        <h2 className="text-[20px] font-black text-white/90">Histórico de Certificados SSL</h2>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Shield size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full rounded-[10px] border border-white/[0.08] bg-white/[0.03] py-2.5 pl-9 pr-3 text-[13px] text-white/80 placeholder:text-white/20 focus:border-amber-500/30 focus:outline-none"
            placeholder="exemplo.com"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !domain.trim()}
          className="flex items-center gap-2 rounded-[10px] bg-amber-500/20 border border-amber-500/30 px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase text-amber-400 hover:bg-amber-500/30 disabled:opacity-40"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          Buscar
        </button>
      </form>

      {error && <div className="rounded-[12px] bg-red-500/10 border border-red-500/20 p-4 text-[12px] text-red-400">{error}</div>}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((r: any, i: number) => (
            <div key={i} className="rounded-[12px] border border-amber-500/10 bg-[#0F121A] p-4">
              <div className="flex justify-between text-[12px]">
                <span className="text-amber-400/80 font-mono">{r.issuer || r.cn}</span>
                <span className="text-white/40">{r.valid_from || r.date}</span>
              </div>
              {r.valid_to && <div className="text-[10px] text-white/30 mt-1">Expira: {r.valid_to}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
