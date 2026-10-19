'use client'

import { Globe, Search, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { ShHelpGuide } from './sh-help-guide'
import { ShUpsell } from './sh-upsell'

export function ShForumMonitor() {
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
      const res = await fetch('/api/premium/darkweb/forum-monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
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
          <Globe size={14} className="text-purple-400" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-purple-400/60">Forum Monitor</span>
        </div>
        <h2 className="text-[20px] font-black text-white/90">Monitor de Fóruns</h2>
      </div>

      <ShHelpGuide
        what="Procura um nome ou palavra dentro de fóruns de discussão da internet e mostra onde essa palavra apareceu. Simples assim: se alguém (ou algo) foi comentado em um fórum, aparece aqui."
        steps={[
          { title: 'Digite o nome, e-mail ou palavra', detail: 'Escreva o que você quer rastrear. Pode ser um apelido, um nome de usuário ou um termo específico.' },
          { title: 'Clique em "Monitorar"', detail: 'O sistema vai nos fóruns e traz os trechos onde esse termo aparece, com o nome do fórum.' },
          { title: 'Leia os resultados', detail: 'Cada bloco é um fórum onde o termo foi achado. Se ficar vazio, o termo não foi encontrado agora.' },
        ]}
        example="nome: joao_silva · termo: empresa tal"
      />

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-[10px] border border-white/[0.08] bg-white/[0.03] py-2.5 pl-9 pr-3 text-[13px] text-white/80 placeholder:text-white/20 focus:border-purple-500/30 focus:outline-none"
            placeholder="Termo para monitorar..."
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="flex items-center gap-2 rounded-[10px] bg-purple-500/20 border border-purple-500/30 px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase text-purple-400 hover:bg-purple-500/30 disabled:opacity-40"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          Monitorar
        </button>
      </form>

      {error && <div className="rounded-[12px] bg-red-500/10 border border-red-500/20 p-4 text-[12px] text-red-400">{error}</div>}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((r: any, i: number) => (
            <div key={i} className="rounded-[12px] border border-purple-500/10 bg-[#0F121A] p-4">
              <div className="text-[11px] font-bold text-purple-400/80">{r.forum || r.source || 'Fórum'}</div>
              <div className="text-[12px] text-white/60 mt-1">{r.title || r.content || JSON.stringify(r)}</div>
            </div>
          ))}
        </div>
      )}

      <ShUpsell
        title="Viu algo? Isso é só o começo"
        description="Na versão gratuita você vê onde o termo apareceu. No PRO o Monitor de Fóruns acompanha em tempo real, avisa quando o nome surgir de novo e cruza com e-mail e telefone."
        bullets={[
          'Alertas: você é avisado no momento em que o nome aparece',
          'Cruzamento com e-mail, telefone e username',
          'Histórico organizado para você usar como prova',
        ]}
        cta="Ativar alertas no PRO"
      />
    </div>
  )
}
