'use client'

import { useState, useCallback } from 'react'
import { Eye, Search, Mail, Phone, Globe, Shield, Bitcoin, Camera, Database, Send, Clock, Lock, User, ExternalLink, Loader2, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiPost } from '@/lib/api-client'

type Tool = 'username' | 'email' | 'phone' | 'ip' | 'domain' | 'crypto' | 'image' | 'social' | 'telegram' | 'wayback' | 'subdomain' | 'ssl'

interface ToolConfig {
  id: Tool
  label: string
  description: string
  icon: React.ReactNode
  placeholder: string
  apiEndpoint: string
  bodyKey: string
  color: string
}

const TOOLS: ToolConfig[] = [
  { id: 'username', label: 'Username / Pessoa', description: 'Busca username em 100+ sites', icon: <User size={16} />, placeholder: 'Digite o username (ex: joao123)', apiEndpoint: '/api/username-enum', bodyKey: 'username', color: '#00E5FF' },
  { id: 'email', label: 'E-mail', description: 'Vazamentos e registros', icon: <Mail size={16} />, placeholder: 'Digite o e-mail (ex: joao@email.com)', apiEndpoint: '/api/breach-check', bodyKey: 'email', color: '#FF3B3B' },
  { id: 'phone', label: 'Telefone', description: 'Operadora, WhatsApp, VoIP', icon: <Phone size={16} />, placeholder: 'Digite o telefone (ex: +5511999999999)', apiEndpoint: '/api/phone-osint', bodyKey: 'phone', color: '#22FF88' },
  { id: 'ip', label: 'IP Address', description: 'Geolocalização, ISP, ameaças', icon: <Globe size={16} />, placeholder: 'Digite o IP (ex: 8.8.8.8)', apiEndpoint: '/api/ip-intel', bodyKey: 'ip', color: '#00E5FF' },
  { id: 'domain', label: 'Domínio / Site', description: 'WHOIS, DNS, SSL, techs', icon: <Globe size={16} />, placeholder: 'Digite o domínio (ex: example.com)', apiEndpoint: '/api/domain-intel', bodyKey: 'domain', color: '#00E5FF' },
  { id: 'crypto', label: 'Crypto Wallet', description: 'Saldo, transações, risco', icon: <Bitcoin size={16} />, placeholder: 'Endereço da wallet (0x..., bc1...)', apiEndpoint: '/api/crypto-check', bodyKey: 'address', color: '#F7931A' },
  { id: 'image', label: 'Imagem', description: 'EXIF, GPS, câmera, estego', icon: <Camera size={16} />, placeholder: 'URL da imagem (https://...)', apiEndpoint: '/api/image-forensics', bodyKey: 'url', color: '#E040FB' },
  { id: 'social', label: 'Redes Sociais', description: 'Busca em 30+ plataformas', icon: <Shield size={16} />, placeholder: 'Username (ex: joao123)', apiEndpoint: '/api/social-check', bodyKey: 'username', color: '#00E5FF' },
  { id: 'telegram', label: 'Telegram', description: 'Perfil do Telegram', icon: <Send size={16} />, placeholder: 'Username do Telegram (ex: joao123)', apiEndpoint: '/api/telegram-osint', bodyKey: 'username', color: '#2AABEE' },
  { id: 'wayback', label: 'Wayback Machine', description: 'Versões antigas de sites', icon: <Clock size={16} />, placeholder: 'URL do site (https://example.com)', apiEndpoint: '/api/wayback-check', bodyKey: 'url', color: '#FF8C00' },
  { id: 'subdomain', label: 'Subdomínios', description: 'Encontra subdomínios ocultos', icon: <Lock size={16} />, placeholder: 'Domínio (ex: example.com)', apiEndpoint: '/api/subdomain-finder', bodyKey: 'domain', color: '#00E5FF' },
  { id: 'ssl', label: 'SSL Certificates', description: 'Histórico de certificados', icon: <Shield size={16} />, placeholder: 'Domínio (ex: example.com)', apiEndpoint: '/api/ssl-tracker', bodyKey: 'domain', color: '#22FF88' },
]

interface ScanResult {
  tool: string
  data: unknown
  timestamp: number
  /** De onde a resposta veio: 'local' (este app) ou 'central' (Worker externo). */
  via?: string
}

export function ShAnonInvestigation() {
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ScanResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [expandedResult, setExpandedResult] = useState<number | null>(null)

  const activeTool = TOOLS.find(t => t.id === selectedTool)

  const handleScan = useCallback(async () => {
    if (!activeTool || !query.trim()) return
    setLoading(true)
    setError(null)

    const body = { [activeTool.bodyKey]: query.trim() }

    const r = await apiPost<{
      success?: boolean
      data?: unknown
      error?: string
    }>(activeTool.apiEndpoint, body)

    if (r.ok && r.data && r.data.success && r.data.data !== undefined) {
      setResults(prev => [
        { tool: activeTool.label, data: r.data!.data, timestamp: Date.now(), via: r.via },
        ...prev,
      ])
      setExpandedResult(0)
    } else {
      // A mensagem precisa dizer qual ferramenta falhou e por quê. Antes, um 404
      // com corpo vazio virava SyntaxError no res.json() e o catch mostrava só
      // "Falha na conexão", sem nenhuma pista para o operador.
      const reason = !r.ok
        ? r.error
        : r.data?.error || 'A consulta respondeu sem dados.'
      setError(`${activeTool.label}: ${reason}`)
    }
    setLoading(false)
  }, [activeTool, query])

  const renderResult = (result: ScanResult) => {
    const data = result.data as Record<string, unknown>
    const entries = Object.entries(data).filter(([k]) => !['timestamp', 'source'].includes(k))

    return (
      <div className="space-y-2">
        {entries.map(([key, value]) => {
          if (value === null || value === undefined || value === '') return null
          if (typeof value === 'object' && !Array.isArray(value)) {
            return (
              <div key={key} className="rounded-[8px] bg-white/[0.03] border border-[#1E293B] p-3">
                <div className="text-[10px] text-[#00E5FF] uppercase font-bold mb-1">{key.replace(/_/g, ' ')}</div>
                <div className="text-[12px] text-white/70">
                  {JSON.stringify(value, null, 2).slice(0, 500)}
                </div>
              </div>
            )
          }
          if (Array.isArray(value) && value.length > 0) {
            return (
              <div key={key} className="rounded-[8px] bg-white/[0.03] border border-[#1E293B] p-3">
                <div className="text-[10px] text-[#00E5FF] uppercase font-bold mb-1">{key.replace(/_/g, ' ')} ({value.length})</div>
                <div className="space-y-1">
                  {value.slice(0, 10).map((item, i) => (
                    <div key={i} className="text-[11px] text-white/60 font-mono">
                      {typeof item === 'object' ? JSON.stringify(item).slice(0, 200) : String(item)}
                    </div>
                  ))}
                </div>
              </div>
            )
          }
          return (
            <div key={key} className="flex items-center justify-between py-1.5 border-b border-white/[0.03]">
              <span className="text-[10px] text-white/40 uppercase">{key.replace(/_/g, ' ')}</span>
              <span className="text-[12px] text-white/80 font-mono">{String(value).slice(0, 100)}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Eye size={18} className="text-[#00E5FF]" />
        <h2 className="text-sm font-black tracking-widest uppercase text-white/80">Investigação Anônima</h2>
      </div>
      <p className="text-[11px] text-white/30 mb-4">Sem login · Sem rastro · Dados públicos apenas</p>

      {!selectedTool ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              onClick={() => setSelectedTool(tool.id)}
              className="platform-card p-4 text-left"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-[8px] flex items-center justify-center" style={{ backgroundColor: `${tool.color}15`, color: tool.color }}>
                  {tool.icon}
                </div>
              </div>
              <div className="text-[12px] font-bold text-white/80">{tool.label}</div>
              <div className="text-[10px] text-white/30 mt-0.5">{tool.description}</div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <button onClick={() => { setSelectedTool(null); setQuery(''); setError(null) }}
            className="text-[11px] text-[#00E5FF]/60 hover:text-[#00E5FF] transition-colors">
            ← Voltar para ferramentas
          </button>

          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-[8px] flex items-center justify-center" style={{ backgroundColor: `${activeTool?.color}15`, color: activeTool?.color }}>
                {activeTool?.icon}
              </div>
              <div>
                <div className="text-[13px] font-bold text-white/80">{activeTool?.label}</div>
                <div className="text-[10px] text-white/30">{activeTool?.description}</div>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                placeholder={activeTool?.placeholder}
                className="input-field flex-1"
              />
              <button onClick={handleScan} disabled={loading || !query.trim()} className="btn-primary">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-[10px] bg-[#FF3B3B]/10 border border-[#FF3B3B]/20 p-4 text-[12px] text-[#FF3B3B]">
              {error}
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-3">
              <div className="text-[11px] text-white/40 uppercase tracking-wider">{results.length} resultado(s)</div>
              {results.map((result, i) => (
                <div key={i} className="card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={12} className="text-[#22FF88]" />
                      <span className="text-[11px] font-bold text-white/60">{result.tool}</span>
                      {result.via === 'central' && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400/70">
                          via Worker externo
                        </span>
                      )}
                    </div>
                    <button onClick={() => setExpandedResult(expandedResult === i ? null : i)}
                      className="text-white/30 hover:text-white/60 transition-colors">
                      {expandedResult === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                  {expandedResult === i && renderResult(result)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
