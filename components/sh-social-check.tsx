'use client'

import { useState, useCallback } from 'react'
import { Search, Users, ExternalLink, AlertTriangle, CheckCircle, XCircle, Loader2, Shield, Heart, Camera, MessageCircle, DollarSign, Gamepad2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PlatformResult {
  platform: string
  found: boolean
  url?: string
  status?: string
  category?: string
}

interface SocialCheckData {
  username: string
  results: PlatformResult[]
  total: number
  found: number
}

const CATEGORY_ICONS: Record<string, any> = {
  social: Users,
  professional: Shield,
  dating: Heart,
  adult: Camera,
  messaging: MessageCircle,
  streaming: Gamepad2,
  music: Gamepad2,
  gaming: Gamepad2,
  blog: Users,
  links: Users,
  finance: DollarSign,
}

const CATEGORY_COLORS: Record<string, string> = {
  social: '#22FF88',
  professional: '#3B82F6',
  dating: '#EC4899',
  adult: '#EF4444',
  messaging: '#10B981',
  streaming: '#8B5CF6',
  music: '#F59E0B',
  gaming: '#6366F1',
  blog: '#14B8A6',
  links: '#64748B',
  finance: '#22C55E',
}

const CATEGORY_NAMES: Record<string, string> = {
  social: 'Redes Sociais',
  professional: 'Profissional',
  dating: 'Apps de Namoro',
  adult: '+18 / Adulto',
  messaging: 'Mensagens',
  streaming: 'Streaming',
  music: 'Música',
  gaming: 'Jogos',
  blog: 'Blog/Artigos',
  links: 'Links',
  finance: 'Pagamentos',
}

export function ShSocialCheck() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<SocialCheckData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const res = await fetch('/api/social-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: query }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
      } else {
        setError(json.error || 'Erro ao buscar em redes sociais')
      }
    } catch {
      setError('Erro de conexão')
    }
    setLoading(false)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  // Agrupar resultados por categoria
  const groupedResults = data?.results.reduce((acc, result) => {
    const cat = result.category || 'social'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(result)
    return acc
  }, {} as Record<string, PlatformResult[]>) || {}

  // Filtrar por categoria ativa
  const filteredResults = activeCategory
    ? { [activeCategory]: groupedResults[activeCategory] || [] }
    : groupedResults

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#22FF88]/10 border border-[#22FF88]/20">
            <Users size={16} className="text-[#22FF88]" />
          </div>
          <div>
            <div className="text-[13px] font-black text-white/90">Social Profile Finder</div>
            <div className="text-[10px] text-white/35">Buscar username em 50+ redes sociais</div>
          </div>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite o username (ex: daniel_amorim)"
            className="input-field pl-11"
          />
        </div>

        <button
          onClick={handleSearch}
          disabled={!query.trim() || loading}
          className={cn('btn-primary mt-3 w-full flex items-center justify-center gap-2')}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          {loading ? 'Buscando...' : 'Buscar em Todas as Redes'}
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
        <div className="space-y-4">
          {/* Resumo */}
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-black tracking-widest uppercase text-white/40">
                Resultados para &quot;{data.username}&quot;
              </div>
              <div className="text-[10px] text-white/30">
                {data.found}/{data.total} encontrados
              </div>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2">
              <div
                className="bg-[#22FF88] h-2 rounded-full transition-all"
                style={{ width: `${(data.found / data.total) * 100}%` }}
              />
            </div>
          </div>

          {/* Filtros de categoria */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={cn(
                'px-3 py-1.5 rounded-[6px] text-[10px] font-bold transition-all',
                !activeCategory ? 'bg-[#22FF88]/20 text-[#22FF88]' : 'bg-white/5 text-white/40 hover:bg-white/10'
              )}
            >
              Todas ({data.total})
            </button>
            {Object.keys(groupedResults).map((cat) => {
              const Icon = CATEGORY_ICONS[cat] || Users
              const color = CATEGORY_COLORS[cat] || '#22FF88'
              const count = groupedResults[cat].filter(p => p.found).length
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                  className={cn(
                    'px-3 py-1.5 rounded-[6px] text-[10px] font-bold transition-all flex items-center gap-1.5',
                    activeCategory === cat ? 'bg-white/10' : 'bg-white/5 hover:bg-white/10'
                  )}
                  style={{ color: activeCategory === cat ? color : undefined }}
                >
                  <Icon size={12} />
                  {CATEGORY_NAMES[cat]} ({count})
                </button>
              )
            })}
          </div>

          {/* Resultados por categoria */}
          {Object.entries(filteredResults).map(([cat, platforms]) => {
            const Icon = CATEGORY_ICONS[cat] || Users
            const color = CATEGORY_COLORS[cat] || '#22FF88'
            return (
              <div key={cat} className="card">
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={14} style={{ color }} />
                  <div className="text-[11px] font-black tracking-widest uppercase" style={{ color }}>
                    {CATEGORY_NAMES[cat]}
                  </div>
                  <div className="text-[10px] text-white/30 ml-auto">
                    {platforms.filter(p => p.found).length}/{platforms.length}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {platforms.map((result) => (
                    <div
                      key={result.platform}
                      className={cn(
                        'platform-card p-3 flex items-center gap-3',
                        result.found ? 'border-[#22FF88]/20' : 'border-[#FF3B3B]/20'
                      )}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-white/[0.04]">
                        {result.found ? (
                          <CheckCircle size={16} className="text-[#22FF88]" />
                        ) : (
                          <XCircle size={16} className="text-[#FF3B3B]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] font-bold text-white/80">{result.platform}</div>
                        <div className="text-[10px] text-white/30 truncate">
                          {result.found ? (
                            <span className="text-[#22FF88]">✓ Perfil encontrado</span>
                          ) : (
                            'Não encontrado'
                          )}
                        </div>
                      </div>
                      {result.found && result.url ? (
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 p-1.5 rounded-[6px] bg-[#22FF88]/10 text-[#22FF88] hover:bg-[#22FF88]/20 transition-all"
                        >
                          <ExternalLink size={12} />
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!data && !loading && !error && (
        <div className="card text-center py-8">
          <Users size={32} className="mx-auto text-white/10 mb-3" />
          <div className="text-[12px] text-white/35">Digite um username para buscar em todas as redes sociais</div>
          <div className="text-[10px] text-white/20 mt-2">Inclui: Instagram, Facebook, Twitter, TikTok, OnlyFans, Tinder e mais</div>
        </div>
      )}
    </div>
  )
}
