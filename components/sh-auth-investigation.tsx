'use client'

import { useState, useCallback } from 'react'
import { Fingerprint, Instagram, Facebook, Loader2, Search, Eye, EyeOff, ExternalLink, AlertTriangle, Shield, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

type AuthPlatform = 'instagram' | 'facebook'

interface PlatformConfig {
  id: AuthPlatform
  label: string
  description: string
  icon: React.ReactNode
  color: string
  fields: { name: string; label: string; placeholder: string; type: string }[]
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: 'instagram',
    label: 'Instagram',
    description: 'Sua conta ou conta descartável para extrair dados de perfis privados, seguidores, interações e mais',
    icon: <Instagram size={18} />,
    color: '#E1306C',
    fields: [
      { name: 'username', label: 'Usuário Instagram', placeholder: 'seu_usuario_fake', type: 'text' },
      { name: 'password', label: 'Senha', placeholder: '••••••••', type: 'password' },
      { name: 'target', label: 'Alvo (username)', placeholder: 'usuario_alvo', type: 'text' },
    ],
  },
  {
    id: 'facebook',
    label: 'Facebook',
    description: 'Sua conta ou conta descartável para extrair dados de perfis, páginas e conteúdo público',
    icon: <Facebook size={18} />,
    color: '#1877F2',
    fields: [
      { name: 'email', label: 'E-mail / Telefone', placeholder: 'fake@email.com', type: 'text' },
      { name: 'password', label: 'Senha', placeholder: '••••••••', type: 'password' },
      { name: 'target', label: 'Alvo (URL ou username)', placeholder: 'https://facebook.com/perfil', type: 'text' },
    ],
  },
]

export function ShAuthInvestigation() {
  const [selectedPlatform, setSelectedPlatform] = useState<AuthPlatform | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const platform = PLATFORMS.find(p => p.id === selectedPlatform)

  const handleSubmit = useCallback(async () => {
    if (!platform || !formData.target?.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const endpoint = `/api/${platform.id}-auth`
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setResult(json.data)
      } else {
        setError(json.error || 'Erro na autenticação')
      }
    } catch {
      setError('Esta funcionalidade está em desenvolvimento')
    }
    setLoading(false)
  }, [platform, formData])

  const updateField = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (!selectedPlatform) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Fingerprint size={18} className="text-[#22FF88]" />
          <h2 className="text-sm font-black tracking-widest uppercase text-white/80">Investigação Autenticada</h2>
        </div>
        <p className="text-[11px] text-white/30 mb-4">Conta fake · Dados extras · Mais informações</p>

        <div className="rounded-[12px] bg-amber-500/10 border border-amber-500/20 p-4 flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-[12px] font-bold text-amber-400 mb-1">Atenção</div>
            <div className="text-[11px] text-amber-400/70 leading-relaxed">
              Esta funcionalidade requer contas fake. O sistema NÃO armazena suas credenciais.
              Use sua conta pessoal (risco de banimento) ou crie uma conta descartável para mais segurança. Não nos responsabilizamos por banimento de contas.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {PLATFORMS.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPlatform(p.id)}
              className="platform-card p-5 text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-[10px] flex items-center justify-center"
                  style={{ backgroundColor: `${p.color}15`, color: p.color }}>
                  {p.icon}
                </div>
                <div>
                  <div className="text-[13px] font-bold text-white/80">{p.label}</div>
                  <div className="badge-neon mt-1">
                    <Shield size={8} />
                    AUTENTICADO
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-white/40 leading-relaxed">{p.description}</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <button onClick={() => { setSelectedPlatform(null); setFormData({}); setResult(null); setError(null) }}
        className="flex items-center gap-1 text-[11px] text-[#00E5FF]/60 hover:text-[#00E5FF] transition-colors">
        <ArrowLeft size={12} /> Voltar
      </button>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-[10px] flex items-center justify-center"
            style={{ backgroundColor: `${platform?.color}15`, color: platform?.color }}>
            {platform?.icon}
          </div>
          <div>
            <div className="text-[14px] font-bold text-white/80">{platform?.label}</div>
            <div className="text-[10px] text-white/30">Investigação autenticada</div>
          </div>
        </div>

        <div className="space-y-3">
          {platform?.fields.map(field => (
            <div key={field.name}>
              <label className="block text-[10px] text-white/40 uppercase mb-1.5 font-bold">{field.label}</label>
              <div className="relative">
                <input
                  type={field.type === 'password' && !showPassword ? 'password' : 'text'}
                  value={formData[field.name] || ''}
                  onChange={(e) => updateField(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="input-field w-full pr-10"
                />
                {field.type === 'password' && (
                  <button onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                )}
              </div>
            </div>
          ))}

          <button onClick={handleSubmit} disabled={loading || !formData.target?.trim()}
            className="btn-primary w-full mt-2">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Autenticando...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Search size={14} /> Investigar Alvo
              </span>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-[10px] bg-[#FF3B3B]/10 border border-[#FF3B3B]/20 p-4 text-[12px] text-[#FF3B3B]">
          {error}
        </div>
      )}

      {result && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Eye size={14} className="text-[#22FF88]" />
            <span className="text-[12px] font-bold text-white/60">Resultado da Investigação</span>
          </div>
          <pre className="text-[11px] text-white/70 font-mono whitespace-pre-wrap overflow-auto max-h-[400px]">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
