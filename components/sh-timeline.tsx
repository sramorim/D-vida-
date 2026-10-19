'use client'

import { Zap, Search, Loader2 } from 'lucide-react'
import { useState } from 'react'

export function ShTimeline() {
  const [target, setTarget] = useState('')
  const [loading, setLoading] = useState(false)
  const [events, setEvents] = useState<any[]>([])
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!target.trim()) return
    setLoading(true)
    setError('')
    setEvents([])

    try {
      const res = await fetch('/api/premium/advanced/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: target.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setEvents(data.events || [])
      } else {
        setError(data.error || 'Nenhum evento encontrado')
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
          <Zap size={14} className="text-yellow-400" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-yellow-400/60">Timeline Builder</span>
        </div>
        <h2 className="text-[20px] font-black text-white/90">Linha do Tempo</h2>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full rounded-[10px] border border-white/[0.08] bg-white/[0.03] py-2.5 pl-9 pr-3 text-[13px] text-white/80 placeholder:text-white/20 focus:border-yellow-500/30 focus:outline-none"
            placeholder="E-mail, username ou domínio..."
          />
        </div>
        <button
          type="submit"
          disabled={loading || !target.trim()}
          className="flex items-center gap-2 rounded-[10px] bg-yellow-500/20 border border-yellow-500/30 px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase text-yellow-400 hover:bg-yellow-500/30 disabled:opacity-40"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
          Gerar
        </button>
      </form>

      {error && <div className="rounded-[12px] bg-red-500/10 border border-red-500/20 p-4 text-[12px] text-red-400">{error}</div>}

      {events.length > 0 && (
        <div className="relative border-l-2 border-yellow-500/20 ml-4 space-y-4">
          {events.map((evt: any, i: number) => (
            <div key={i} className="relative pl-6">
              <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-yellow-500/20 border-2 border-yellow-500/40" />
              <div className="text-[10px] text-yellow-400/60 font-mono">{evt.date || evt.timestamp}</div>
              <div className="text-[12px] text-white/70 mt-1">{evt.description || evt.event || JSON.stringify(evt)}</div>
              {evt.source && <div className="text-[10px] text-white/30 mt-0.5">Fonte: {evt.source}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
