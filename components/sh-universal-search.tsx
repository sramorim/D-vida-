'use client'

import { useState } from 'react'
import {
  Search, User, Mail, Phone, AtSign, ExternalLink, Loader2, Users, MapPin, CheckCircle2, AlertTriangle, MessageCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiPost } from '@/lib/api-client'

type SearchType = 'username' | 'name' | 'email' | 'phone'

interface SearchResult {
  id: string
  platform: string
  username: string
  displayName: string
  score: number
  bio?: string
  followers?: string
  following?: string
  posts?: string
  location?: string
  avatar?: string
  url?: string
  exists?: boolean
  status?: string
  httpStatus?: number
  extra?: Record<string, unknown>
  source: string
  timestamp: number
}

const SEARCH_TYPES: { type: SearchType; label: string; icon: any; placeholder: string }[] = [
  { type: 'username', label: 'Username', icon: AtSign, placeholder: 'Ex: daniel_amorim' },
  { type: 'name', label: 'Nome', icon: User, placeholder: 'Ex: Maria da Silva' },
  { type: 'email', label: 'E-mail', icon: Mail, placeholder: 'Ex: maria@email.com' },
  { type: 'phone', label: 'Telefone', icon: Phone, placeholder: 'Ex: 55 47 99876-8098' },
]

const PLATFORM_COLORS: Record<string, string> = {
  GitHub: '#ffffff', GitLab: '#FC6D26', Bitbucket: '#2684FF', Reddit: '#FF4500',
  Telegram: '#2AABEE', Steam: '#66c0f4', YouTube: '#FF0000', Twitch: '#9146FF',
  TikTok: '#69C9D0', Instagram: '#E4405F', Pinterest: '#E60023', Behance: '#1769FF',
  Dribbble: '#EA4C89', DeviantArt: '#05CC47', Medium: '#ffffff', Tumblr: '#36465D',
  Blogspot: '#F57D00', WordPress: '#21759B', SoundCloud: '#FF5500', Bandcamp: '#1DA0C3',
  Keybase: '#33a0ff', CodePen: '#ffffff', 'Dev.to': '#0A0A0A', npm: '#CB3837',
  PyPI: '#3775A9', 'Docker Hub': '#2496ED', Patreon: '#FF424D', Replit: '#F26207',
  Spotify: '#1DB954', 'Last.fm': '#D51007', 'Hacker News': '#FF6600', Facebook: '#1877F2',
  'X / Twitter': '#e7e9ea', LinkedIn: '#0A66C2', Google: '#4285F4', Bing: '#008373',
  Gravatar: '#1E8CBE', 'E-mail hunter': '#3ECF8E',
}

function platformColor(name: string): string {
  return PLATFORM_COLORS[name] || '#22FF88'
}

function fmt(n?: string): string {
  if (!n) return ''
  const num = Number(n.replace(/[^\d.]/g, ''))
  if (!num) return n
  return n.includes(',') || n.includes('K') || n.includes('mil')
    ? n
    : new Intl.NumberFormat('pt-BR').format(num)
}

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase()
}

function StatusBadge({ status }: { status?: string }) {
  const found = status === 'found'
  const possible = status === 'possible'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider',
        found && 'bg-[#22FF88]/10 text-[#22FF88] border border-[#22FF88]/20',
        possible && 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20',
        !found && !possible && 'bg-white/5 text-white/40 border border-white/10'
      )}
    >
      {found ? <CheckCircle2 size={9} /> : possible ? <AlertTriangle size={9} /> : null}
      {found ? 'Encontrado' : possible ? 'Possível' : status || '—'}
    </span>
  )
}

function CardStats({ r }: { r: SearchResult }) {
  const stats: { icon: any; value: string; label: string }[] = []
  if (r.followers) stats.push({ icon: Users, value: fmt(r.followers), label: 'seguidores' })
  if (r.following) stats.push({ icon: Users, value: fmt(r.following), label: 'seguindo' })
  if (r.posts) stats.push({ icon: Search, value: fmt(r.posts), label: 'posts' })
  if (r.location) stats.push({ icon: MapPin, value: r.location, label: '' })
  return (
    <div className="flex flex-wrap gap-2">
      {stats.map((s, i) => (
        <span key={i} className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] border border-white/[0.05] px-2 py-1 text-[10px] text-white/50">
          <s.icon size={10} className="text-white/30" />
          <b className="text-white/80">{s.value}</b> {s.label}
        </span>
      ))}
    </div>
  )
}

export function ShUniversalSearch() {
  const [searchType, setSearchType] = useState<SearchType>('username')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [searchedFor, setSearchedFor] = useState('')

  const currentType = SEARCH_TYPES.find((t) => t.type === searchType)!

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const q = query.trim()
    if (!q || loading) return
    setLoading(true)
    setError('')
    setAviso('')
    setResults([])
    setSearchedFor(q)

    // Cada tipo de busca tem rota própria. Antes, username e nome iam todos
    // para /api/search, que só sabia tratar o texto como username literal:
    // "Daniel de Amorim" virava a URL /Daniel de Amorim/ em toda plataforma
    // e o resultado era "não encontrado" em tudo.
    const rota =
      searchType === 'email' ? '/api/search/email'
        : searchType === 'phone' ? '/api/search/phone'
          : searchType === 'name' ? '/api/search/name'
            : '/api/search/username'

    const corpo =
      searchType === 'email' ? { email: q }
        : searchType === 'phone' ? { phone: q }
          : searchType === 'name' ? { name: q }
            : { target: q, modules: ['todos'] }

    const r = await apiPost<{
      success?: boolean
      error?: string
      data?: {
        results?: SearchResult[]
        resultados?: SearchResult[]
        aviso?: string
        mode?: string
      }
    }>(rota, corpo)

    if (!r.ok) {
      setError(r.error || 'Falha na busca')
      setLoading(false)
      return
    }

    const envelope = r.data
    if (!envelope?.success) {
      setError(envelope?.error || 'Falha na busca')
      setLoading(false)
      return
    }

    setMode(searchType)
    if (envelope.data?.aviso) setAviso(envelope.data.aviso)

    const brutos = envelope.data?.results || envelope.data?.resultados || []
    const achados = brutos.filter((r2: SearchResult) => r2.exists)
    setResults(achados)

    if (!achados.length && !envelope.data?.aviso) {
      setError(
        searchType === 'name'
          ? 'Nenhum perfil público encontrado para os usernames derivados deste nome.'
          : 'Nada encontrado. Tente variar a escrita do username.'
      )
    }
    setLoading(false)
  }

  const isPhoneMode = mode === 'phone'

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#22FF88]/10 border border-[#22FF88]/25">
            <Search size={17} className="text-[#22FF88]" />
          </div>
          <div>
            <div className="text-[14px] font-black text-white/90">Localizar Pessoa</div>
            <div className="text-[10px] text-white/35">Procura o mesmo username em ~40 plataformas, com foto, nome real, bio e seguidores — e abre direto no site original</div>
          </div>
        </div>

        <div className="text-[11px] font-black tracking-widest uppercase text-white/40 mb-2">Tipo de Busca</div>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {SEARCH_TYPES.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => setSearchType(type)}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-bold transition-all',
                searchType === type
                  ? 'bg-[#22FF88]/15 text-[#22FF88] border border-[#22FF88]/30'
                  : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'
              )}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="relative">
          <currentType.icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={currentType.placeholder}
            className="input-field pl-11"
          />
        </form>

        <button
          onClick={() => handleSearch()}
          disabled={!query.trim() || loading}
          className="btn-primary mt-3 w-full flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          {loading ? 'Verificando ~40 plataformas...' : `Buscar por ${currentType.label}`}
        </button>

        <p className="mt-3 text-[9px] text-white/25 leading-relaxed">
          Redes como Facebook, X/Twitter e LinkedIn bloqueiam robôs — quando não dá pra confirmar automático, aparece “Possível”: clique e confirme no próprio site, sem entrar na conta de ninguém.
        </p>
      </div>

      {loading && (
        <div className="card text-center py-8">
          <Loader2 size={18} className="animate-spin mx-auto mb-2 text-[#22FF88]" />
          <div className="text-[11px] text-white/50">Varrendo plataformas em paralelo... isso leva alguns segundos.</div>
          <div className="mt-2 flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-1 w-1 rounded-full bg-[#22FF88]/40 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
        </div>
      )}

      {aviso && (
        <div className="card border-[#00E5FF]/20 bg-[#00E5FF]/[0.04]">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-[#00E5FF] mt-0.5 shrink-0" />
            <div className="text-[10px] text-[#00E5FF]/80 leading-relaxed">{aviso}</div>
          </div>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="text-[11px] font-black tracking-widest uppercase text-[#22FF88]">
              {isPhoneMode ? 'Resultado detectado' : `Perfis encontrados (${results.length})`}
            </div>
            <div className="text-[9px] text-white/25">busca por “{searchedFor}”</div>
          </div>
          <div className="space-y-3">
            {results.map((r, i) =>
              isPhoneMode ? (
                <PhoneResultCard key={r.id + i} r={r} />
              ) : (
                <a
                  key={r.id + i}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn('card card-hover block animate-in', `stagger-${(i % 4) + 1}`)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="h-12 w-12 shrink-0 rounded-full overflow-hidden flex items-center justify-center border-2"
                      style={{ borderColor: platformColor(r.platform) + '55', background: '#0F131A' }}
                    >
                      {r.avatar ? (
                        <img src={r.avatar} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <span className="text-[11px] font-black" style={{ color: platformColor(r.platform) }}>
                          {initials(r.displayName || r.platform)}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-white/90">{r.displayName || r.username}</span>
                        <StatusBadge status={r.status} />
                      </div>
                      <div className="mt-0.5 text-[11px] text-white/40 font-mono">
                        {r.platform} · @{r.username}
                      </div>

                      {typeof r.extra?.derivadoDeNome === 'boolean' && r.extra.derivadoDeNome && (
                        <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-[#F59E0B]/10 border border-[#F59E0B]/20 px-2 py-0.5 text-[9px] font-bold text-[#F59E0B]/80">
                          Palpite: {String(r.extra.regra ?? '—')} · {String(r.extra.confiancaDoPalpite ?? '—')}/100
                        </div>
                      )}

                      {r.bio && (
                        <div className="mt-2 rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 py-2 text-[11px] text-white/50 leading-relaxed line-clamp-3">
                          {r.bio}
                        </div>
                      )}

                      <div className="mt-2"><CardStats r={r} /></div>

                      {Boolean(r.extra?.nota) && (
                        <div className="mt-2 text-[9px] text-[#F59E0B]/70">{String(r.extra?.nota ?? '')}</div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-white/[0.05] pt-3">
                    <div className="text-[9px] text-white/25">Endereço verificado na própria plataforma</div>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#22FF88]/10 border border-[#22FF88]/20 px-3 py-1.5 text-[10px] font-black text-[#22FF88] uppercase tracking-wider transition-all group-hover:bg-[#22FF88]/20">
                      Abrir perfil
                      <ExternalLink size={10} />
                    </span>
                  </div>
                </a>
              )
            )}
          </div>
        </div>
      )}

      {!loading && !results.length && error && (
        <div className="card border-[#F59E0B]/20">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-[#F59E0B] mt-0.5 shrink-0" />
            <div className="text-[10px] text-[#F59E0B]/80">{error}</div>
          </div>
        </div>
      )}
    </div>
  )
}

function PhoneResultCard({ r }: { r: SearchResult }) {
  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 shrink-0 rounded-full bg-[#22FF88]/10 border-2 border-[#22FF88]/40 flex items-center justify-center">
          <Phone size={17} className="text-[#22FF88]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-white/90">{r.username}</span>
            <StatusBadge status={r.status === 'found' ? 'found' : r.exists ? 'possible' : 'not_found'} />
          </div>
          <div className="mt-1 text-[11px] text-white/40">{r.displayName || 'Telefone'}</div>
          {Boolean(r.extra?.whatsapp) && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#25D366]/10 border border-[#25D366]/25 px-2.5 py-1 text-[10px] font-bold text-[#25D366]">
              <MessageCircle size={11} /> Tem WhatsApp
            </div>
          )}
          {Boolean(r.extra?.carrier) && (
            <div className="mt-1 text-[10px] text-white/40">Operadora: {String(r.extra?.carrier ?? '')}{Boolean(r.extra?.country) ? ` · ${String(r.extra?.country ?? '')}` : ''}</div>
          )}
        </div>
      </div>
    </div>
  )
}