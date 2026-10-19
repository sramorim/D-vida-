'use client'

import { useState, useEffect } from 'react'
import { Settings, Check, AlertTriangle, Loader2, Eye, EyeOff, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SessionStatus {
  hasSession: boolean
  isValid: boolean
  username?: string
}

export function ShInstagramAuthSettings({ onSessionSaved }: { onSessionSaved?: () => void }) {
  const [cookie, setCookie] = useState('')
  const [showCookie, setShowCookie] = useState(false)
  const [status, setStatus] = useState<SessionStatus>({ hasSession: false, isValid: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Check existing session on mount
  useEffect(() => {
    const saved = localStorage.getItem('shandon_ig_session')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.cookie && data.username) {
          setStatus({ hasSession: true, isValid: data.isValid !== false, username: data.username })
        }
      } catch {}
    }
  }, [])

  const handleValidate = async () => {
    if (!cookie.trim()) {
      setError('Cole o cookie sessionid')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/instagram/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookie: cookie.trim() }),
      })

      const data = await res.json()

      if (data.success && data.data) {
        // Save to localStorage
        localStorage.setItem('shandon_ig_session', JSON.stringify({
          cookie: cookie.trim(),
          username: data.data.username,
          createdAt: Date.now(),
          lastValidated: Date.now(),
          isValid: true,
        }))

        setStatus({ hasSession: true, isValid: true, username: data.data.username })
        setSuccess(`Sessão válida! Logado como @${data.data.username}`)
        setCookie('')
        onSessionSaved?.()
      } else {
        setError(data.error || 'Cookie inválido')
        setStatus({ hasSession: false, isValid: false })
      }
    } catch (err) {
      setError('Erro ao validar sessão')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    localStorage.removeItem('shandon_ig_session')
    setStatus({ hasSession: false, isValid: false })
    setCookie('')
    setSuccess(null)
    setError(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E1306C]/10 border border-[#E1306C]/20">
          <Settings size={16} className="text-[#E1306C]" />
        </div>
        <div>
          <div className="text-[13px] font-black text-white/90">Instagram Autenticado</div>
          <div className="text-[10px] text-white/35">Configure sua sessão para acesso completo</div>
        </div>
      </div>

      {/* Status */}
      {status.hasSession && (
        <div className={cn(
          'rounded-lg border p-3',
          status.isValid
            ? 'bg-[#22FF88]/5 border-[#22FF88]/20'
            : 'bg-[#FF6B6B]/5 border-[#FF6B6B]/20'
        )}>
          <div className="flex items-center gap-2">
            {status.isValid ? (
              <Check size={14} className="text-[#22FF88]" />
            ) : (
              <AlertTriangle size={14} className="text-[#FF6B6B]" />
            )}
            <span className="text-[11px] font-bold text-white/80">
              {status.isValid ? `Conectado como @${status.username}` : 'Sessão expirada'}
            </span>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
        <div className="text-[11px] font-bold text-white/60 mb-2">Como obter o cookie:</div>
        <ol className="text-[10px] text-white/40 space-y-1 list-decimal list-inside">
          <li>Abra o Instagram no navegador (conta fake/secundária)</li>
          <li>Faça login normalmente</li>
          <li>Pressione F12 (DevTools)</li>
          <li>Vá em Application → Cookies → instagram.com</li>
          <li>Encontre o cookie <span className="text-[#E1306C] font-mono">sessionid</span></li>
          <li>Copie o valor completo</li>
          <li>Cole abaixo</li>
        </ol>
      </div>

      {/* Cookie Input */}
      <div className="relative">
        <input
          type={showCookie ? 'text' : 'password'}
          value={cookie}
          onChange={(e) => setCookie(e.target.value)}
          placeholder="Cole o valor do cookie sessionid..."
          className="input-field pr-10"
          disabled={loading}
        />
        <button
          type="button"
          onClick={() => setShowCookie(!showCookie)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
        >
          {showCookie ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>

      {/* Error/Success */}
      {error && (
        <div className="text-[11px] text-[#FF6B6B] bg-[#FF6B6B]/10 rounded-lg p-2">
          {error}
        </div>
      )}
      {success && (
        <div className="text-[11px] text-[#22FF88] bg-[#22FF88]/10 rounded-lg p-2">
          {success}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleValidate}
          disabled={loading || !cookie.trim()}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {loading ? 'Validando...' : 'Salvar Sessão'}
        </button>

        {status.hasSession && (
          <button
            onClick={handleClear}
            className="flex items-center gap-2 rounded-xl border border-[#FF6B6B]/20 bg-[#FF6B6B]/5 px-4 py-2 text-[11px] font-bold text-[#FF6B6B] hover:bg-[#FF6B6B]/10 transition-all"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Warning */}
      <div className="text-[9px] text-white/25 text-center">
        ⚠️ Use uma conta descartável. O Instagram pode bloquear contas que fazem scraping frequente.
      </div>
    </div>
  )
}
