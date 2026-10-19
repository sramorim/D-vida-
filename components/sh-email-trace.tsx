'use client'

import { Mail, Search, Loader2 } from 'lucide-react'
import { useState } from 'react'

export function ShEmailTrace() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/premium/advanced/email-trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setResult(data.data)
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
          <Mail size={14} className="text-purple-400" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-purple-400/60">Email Trace</span>
        </div>
        <h2 className="text-[20px] font-black text-white/90">Rastreamento de E-mail</h2>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-[10px] border border-white/[0.08] bg-white/[0.03] py-2.5 pl-9 pr-3 text-[13px] text-white/80 placeholder:text-white/20 focus:border-purple-500/30 focus:outline-none"
            placeholder="email@exemplo.com"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="flex items-center gap-2 rounded-[10px] bg-purple-500/20 border border-purple-500/30 px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase text-purple-400 hover:bg-purple-500/30 disabled:opacity-40"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          Rastrear
        </button>
      </form>

      {error && <div className="rounded-[12px] bg-red-500/10 border border-red-500/20 p-4 text-[12px] text-red-400">{error}</div>}

      {result && (
        <div className="rounded-[16px] border border-purple-500/10 bg-[#0F121A] p-5 space-y-3">
          {Object.entries(result).map(([key, value]) => (
            <div key={key} className="flex justify-between text-[12px]">
              <span className="text-white/40">{key}</span>
              <span className="text-white/70 font-mono">{String(value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
