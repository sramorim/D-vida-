'use client'

import { useState } from 'react'
import { LogIn, LogOut, CheckCircle, AlertTriangle, Loader2, Shield, Eye, EyeOff, Facebook, Instagram } from 'lucide-react'
import { cn } from '@/lib/utils'

type Provider = 'facebook' | 'instagram'

interface AuthStatus {
  provider: Provider
  authenticated: boolean
  username?: string
  lastCheck?: string
}

interface Props {
  onAuth: (provider: Provider, username: string, password: string) => Promise<void>
  onLogout: (provider: Provider) => void
  status: AuthStatus[]
  loading?: Provider | null
}

export function ShAuthLogin({ onAuth, onLogout, status, loading }: Props) {
  const [selectedProvider, setSelectedProvider] = useState<Provider>('instagram')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) return
    setLoginError(null)
    try {
      await onAuth(selectedProvider, username, password)
      setUsername('')
      setPassword('')
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Falha na autenticação')
    }
  }

  const getStatus = (provider: Provider) => status.find(s => s.provider === provider)

  const PROVIDER_CONFIG: Record<Provider, { label: string; icon: any; color: string }> = {
    instagram: { label: 'Instagram', icon: Instagram, color: '#E4405F' },
    facebook: { label: 'Facebook', icon: Facebook, color: '#1877F2' },
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/20">
            <LogIn size={16} className="text-[#3B82F6]" />
          </div>
          <div>
            <div className="text-[13px] font-black text-white/90">Login Autenticado</div>
            <div className="text-[10px] text-white/35">Conecte sua conta fake para ver mais dados</div>
          </div>
        </div>

        <div className="bg-[#3B82F6]/5 border border-[#3B82F6]/20 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <Shield size={12} className="text-[#3B82F6] mt-0.5 shrink-0" />
            <div className="text-[10px] text-[#3B82F6]/80">
              <strong>Por que logar?</strong> Com login você vê: stories, seguidores detalhados, posts privados (via collab), listas de amigos, e muito mais.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {(Object.keys(PROVIDER_CONFIG) as Provider[]).map((provider) => {
            const cfg = PROVIDER_CONFIG[provider]
            const Icon = cfg.icon
            const authStatus = getStatus(provider)
            return (
              <button
                key={provider}
                onClick={() => setSelectedProvider(provider)}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-lg text-[11px] font-bold transition-all border',
                  selectedProvider === provider
                    ? 'border-current'
                    : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                )}
                style={selectedProvider === provider ? { color: cfg.color, backgroundColor: `${cfg.color}10`, borderColor: `${cfg.color}30` } : undefined}
              >
                <Icon size={16} />
                <div className="text-left">
                  <div>{cfg.label}</div>
                  {authStatus?.authenticated ? (
                    <div className="text-[8px] text-[#22FF88]">✓ Conectado</div>
                  ) : (
                    <div className="text-[8px] opacity-50">Não conectado</div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <div className="space-y-2 mb-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={`Username do ${PROVIDER_CONFIG[selectedProvider].label}`}
            className="input-field"
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha da conta fake"
              className="input-field pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={!username.trim() || !password.trim() || loading !== null}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading === selectedProvider ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <LogIn size={14} />
          )}
          {loading === selectedProvider ? 'Conectando...' : `Conectar ${PROVIDER_CONFIG[selectedProvider].label}`}
        </button>

        {loginError && (
          <div className="mt-3 rounded-lg bg-[#FF3B3B]/10 border border-[#FF3B3B]/20 p-3 text-[11px] text-[#FF3B3B]">
            {loginError}
          </div>
        )}
      </div>

      <div className="card">
        <div className="text-[11px] font-black tracking-widest uppercase text-white/40 mb-3">
          Conexões Ativas
        </div>
        <div className="space-y-2">
          {(Object.keys(PROVIDER_CONFIG) as Provider[]).map((provider) => {
            const cfg = PROVIDER_CONFIG[provider]
            const Icon = cfg.icon
            const authStatus = getStatus(provider)
            return (
              <div key={provider} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <Icon size={14} style={{ color: cfg.color }} />
                  <div>
                    <div className="text-[11px] font-bold text-white/80">{cfg.label}</div>
                    {authStatus?.authenticated ? (
                      <div className="text-[9px] text-[#22FF88]">@{authStatus.username} - Conectado</div>
                    ) : (
                      <div className="text-[9px] text-white/30">Não conectado</div>
                    )}
                  </div>
                </div>
                {authStatus?.authenticated && (
                  <button
                    onClick={() => onLogout(provider)}
                    className="p-1.5 rounded-md bg-[#FF3B3B]/10 text-[#FF3B3B] hover:bg-[#FF3B3B]/20 transition-all"
                  >
                    <LogOut size={12} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
