'use client'

import { useState } from 'react'
import { Facebook, Search, Loader2, ExternalLink } from 'lucide-react'

export function ShFacebookModule() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<unknown[]>([])
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setResults([])

    try {
      const res = await fetch(`/api/facebook/public?username=${encodeURIComponent(query.trim())}`)
      const data = await res.json()
      if (data.success && data.data) {
        setResults(data.data)
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
          <Facebook size={14} className="text-blue-400" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/30">Facebook OSINT</span>
        </div>
        <h2 className="text-[20px] font-black text-white/90">Busca Facebook</h2>
        <p className="mt-2 text-[12px] text-white/35">Perfis e páginas públicas</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Facebook size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-[10px] border border-white/[0.08] bg-white/[0.03] py-2.5 pl-9 pr-3 text-[13px] text-white/80 placeholder:text-white/20 focus:border-blue-500/30 focus:outline-none"
            placeholder="Nome ou username"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="flex items-center gap-2 rounded-[10px] bg-blue-500/20 border border-blue-500/30 px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase text-blue-400 hover:bg-blue-500/30 disabled:opacity-40"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          Buscar
        </button>
      </form>

      {error && (
        <div className="rounded-[12px] bg-red-500/10 border border-red-500/20 p-4 text-[12px] text-red-400">{error}</div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((r: any, i: number) => (
            <div key={i} className="rounded-[12px] border border-white/[0.06] bg-[#0F121A] p-4 flex items-center justify-between">
              <div>
                <div className="text-[13px] font-bold text-white/80">{r.name || r.username}</div>
                <div className="text-[11px] text-white/30">{r.type || 'Perfil'}</div>
              </div>
              {r.url && (
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-blue-400/60 hover:text-blue-400">
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
