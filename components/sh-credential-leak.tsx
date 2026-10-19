'use client'

import { Key, Search, Loader2 } from 'lucide-react'
import { useState } from 'react'

export function ShCredentialLeak() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setResults([])

    try {
      const res = await fetch('/api/premium/darkweb/credential-leak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      })
      const data = await res.json()
      if (data.success && data.result) {
        const r = data.result
        setResults([r])
      } else {
        setError(data.error || 'Nenhum resultado encontrado')
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
          <Key size={14} className="text-red-400" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-red-400/60">Credential Leak</span>
        </div>
        <h2 className="text-[20px] font-black text-white/90">Vazamento de Credenciais</h2>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-[10px] border border-white/[0.08] bg-white/[0.03] py-2.5 pl-9 pr-3 text-[13px] text-white/80 placeholder:text-white/20 focus:border-red-500/30 focus:outline-none"
            placeholder="E-mail ou domínio..."
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="flex items-center gap-2 rounded-[10px] bg-red-500/20 border border-red-500/30 px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase text-red-400 hover:bg-red-500/30 disabled:opacity-40"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          Verificar
        </button>
      </form>

      {error && <div className="rounded-[12px] bg-red-500/10 border border-red-500/20 p-4 text-[12px] text-red-400">{error}</div>}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((r: any, i: number) => (
            <div key={i} className="rounded-[12px] border border-red-500/10 bg-[#0F121A] p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-red-400/80">E-mail:</span>
                <span className="text-[12px] text-white/70">{r.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-red-400/80">Vazamentos:</span>
                <span className="text-[12px] text-white/70">{r.count || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-red-400/80">Senha encontrada:</span>
                <span className={`text-[12px] ${r.passwordFound ? 'text-red-400' : 'text-green-400'}`}>{r.passwordFound ? 'Sim' : 'Não'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-red-400/80">Risco:</span>
                <span className={`text-[12px] font-bold ${
                  r.riskLevel === 'CRITICAL' ? 'text-red-500' :
                  r.riskLevel === 'HIGH' ? 'text-orange-400' :
                  r.riskLevel === 'MEDIUM' ? 'text-yellow-400' :
                  r.riskLevel === 'LOW' ? 'text-blue-400' :
                  'text-green-400'
                }`}>{r.riskLevel}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
