'use client'

import { useState, useCallback } from 'react'
import { Instagram, Users, MessageCircle, GitCompare, Camera, Search, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SearchResult, SnapshotPlatform } from '@/lib/types'
import { ProfileDrawer } from './profile-drawer'
import { StatusBadge } from './status-badge'

/** Status que a UI sabe exibir. 'possible' e 'unavailable' são estados reais
 *  de fonte bloqueada/fora do ar e não podem virar "Não encontrado". */
type CardStatus = 'found' | 'possible' | 'not_found' | 'unavailable'

function toCardStatus(result: SearchResult): CardStatus {
  const raw = (result.status || (result.exists ? 'found' : 'not_found')) as string
  if (raw === 'found' || raw === 'possible' || raw === 'unavailable' || raw === 'not_found') {
    return raw
  }
  return result.exists ? 'found' : 'not_found'
}

type InstagramTab = 'perfil' | 'seguidores' | 'interacoes' | 'snapshots'

interface ShInstagramProps {
  onNavigate?: (view: string) => void
}

export function ShInstagram({ onNavigate }: ShInstagramProps) {
  const [activeTab, setActiveTab] = useState<InstagramTab>('perfil')
  const [query, setQuery] = useState('')
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDrawer, setShowDrawer] = useState(false)

  const tabs: { key: InstagramTab; label: string; icon: React.ReactNode }[] = [
    { key: 'perfil', label: 'Perfil', icon: <Instagram size={14} /> },
    { key: 'seguidores', label: 'Seguidores', icon: <Users size={14} /> },
    { key: 'interacoes', label: 'Interações', icon: <MessageCircle size={14} /> },
    { key: 'snapshots', label: 'Snapshots', icon: <GitCompare size={14} /> },
  ]

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setSearchResult(null)
    try {
      const res = await fetch('/api/search/username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // O backend normaliza ("@sr__amorim" e "sr__amorim" viram o mesmo
        // username). Aqui só limpamos espaços das pontas para não enviar lixo.
        body: JSON.stringify({ target: query.trim(), modules: ['instagram'] }),
      })
      const data = await res.json()
      if (data.success && data.data) {
        const allResults: SearchResult[] = data.data.results || (Array.isArray(data.data) ? data.data : [])
        const igResult = allResults.find((r: SearchResult) => r.platform === 'Instagram')
        if (igResult) {
          setSearchResult(igResult)
        } else if (allResults.length > 0) {
          setError('Instagram não foi verificado pela fonte disponível. As outras plataformas responderam normalmente.')
        } else {
          setError('Nenhum resultado retornado pela fonte.')
        }
      } else {
        // Erro de entrada (username vazio/inválido) ou de autenticação chegam
        // aqui com a mensagem do servidor.
        setError(data.error || 'Erro na busca')
      }
    } catch {
      setError('Erro de conexão')
    }
    setLoading(false)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[20px] border border-white/[0.06] bg-[#0F121A] p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-pink-500/10 border border-pink-500/20">
            <Instagram size={16} className="text-pink-400" />
          </div>
          <div>
            <div className="text-[13px] font-black text-white/90">Instagram</div>
            <div className="text-[10px] text-white/35">Perfil · Conteúdo público · Seguidores</div>
          </div>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="@username do Instagram"
            className="w-full rounded-[14px] bg-white/[0.04] border border-white/[0.08] pl-11 pr-4 py-3.5 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-neon/40 focus:ring-1 focus:ring-neon/20 transition-all font-mono"
          />
        </div>

        <button
          onClick={handleSearch}
          disabled={!query.trim() || loading}
          className={cn(
            'mt-3 w-full flex items-center justify-center gap-2 rounded-[12px] py-3 text-[12px] font-black tracking-widest uppercase transition-all',
            query.trim() && !loading
              ? 'bg-pink-500/15 text-pink-400 border border-pink-500/20 hover:bg-pink-500/25'
              : 'bg-white/5 text-white/30 cursor-not-allowed'
          )}
        >
          {loading ? 'Buscando...' : 'Investigar Instagram'}
          {!loading && <ChevronRight size={14} />}
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-1.5 shrink-0 rounded-[10px] px-3 py-2 text-[11px] font-bold tracking-wider uppercase transition-all',
              activeTab === tab.key
                ? 'bg-neon/15 text-neon border border-neon/20'
                : 'bg-white/[0.04] text-white/40 border border-white/[0.06] hover:bg-white/[0.08]'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="card border-red-500/20">
          <div className="text-[12px] text-red-400">{error}</div>
        </div>
      )}

      {activeTab === 'perfil' && searchResult && (
        <div className="card">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-[12px] bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
              <Instagram size={24} className="text-pink-400/40" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-bold text-white/90">{searchResult.displayName}</div>
              <div className="text-[11px] text-white/40 font-mono">@{searchResult.username}</div>
              {searchResult.bio && (
                <p className="mt-2 text-[11px] text-white/50 leading-relaxed">{searchResult.bio}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-white/30">
                {searchResult.followers && <span><span className="text-white/60 font-bold">{searchResult.followers}</span> seguidores</span>}
                {searchResult.following && <span><span className="text-white/60 font-bold">{searchResult.following}</span> seguindo</span>}
                {searchResult.posts && <span><span className="text-white/60 font-bold">{searchResult.posts}</span> posts</span>}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className={cn('text-[20px] font-black', searchResult.exists ? 'text-neon' : 'text-white/20')}>
                {searchResult.score}
              </div>
              <div className="text-[9px] text-white/25 uppercase">score</div>
            </div>
          </div>

          <div className="mt-3">
            <StatusBadge status={toCardStatus(searchResult)} />
          </div>

          {searchResult.url && (
            <a
              href={searchResult.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-2 w-full rounded-[10px] bg-neon/10 border border-neon/15 px-4 py-2.5 text-[11px] font-bold text-neon/80 uppercase tracking-wider transition-all hover:bg-neon/20 hover:text-neon"
            >
              Ver no Instagram
              <ChevronRight size={12} />
            </a>
          )}

          <button
            onClick={() => setShowDrawer(true)}
            className="mt-2 w-full flex items-center justify-center gap-2 rounded-[10px] bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-[11px] font-bold text-white/50 uppercase tracking-wider transition-all hover:bg-white/[0.08] hover:text-white/70"
          >
            <Camera size={12} />
            Análise Completa
          </button>
        </div>
      )}

      {activeTab === 'perfil' && !searchResult && !loading && (
        <div className="card text-center py-8">
          <Instagram size={32} className="mx-auto text-white/10 mb-3" />
          <div className="text-[12px] text-white/35">Digite um username para buscar o perfil</div>
        </div>
      )}

      {activeTab === 'seguidores' && (
        <div className="card text-center py-8">
          <Users size={32} className="mx-auto text-white/10 mb-3" />
          <div className="text-[12px] text-white/35">
            {searchResult
              ? 'Clique em "Análise Completa" para ver seguidores'
              : 'Busque um perfil primeiro para ver seguidores'}
          </div>
        </div>
      )}

      {activeTab === 'interacoes' && (
        <div className="card text-center py-8">
          <MessageCircle size={32} className="mx-auto text-white/10 mb-3" />
          <div className="text-[12px] text-white/35">
            {searchResult
              ? 'Clique em "Análise Completa" para ver interações'
              : 'Busque um perfil primeiro para ver interações'}
          </div>
        </div>
      )}

      {activeTab === 'snapshots' && (
        <div className="card text-center py-8">
          <GitCompare size={32} className="mx-auto text-white/10 mb-3" />
          <div className="text-[12px] text-white/35">
            {searchResult
              ? 'Clique em "Análise Completa" → aba Snapshot para comparar'
              : 'Busque um perfil primeiro para ver snapshots'}
          </div>
        </div>
      )}

      {showDrawer && searchResult && (
        <ProfileDrawer
          platform={'instagram' as SnapshotPlatform}
          username={searchResult.username}
          onClose={() => setShowDrawer(false)}
        />
      )}
    </div>
  )
}