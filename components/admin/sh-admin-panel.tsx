'use client'

import { useState, useEffect } from 'react'
import { Shield, Eye, EyeOff, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Painel administrativo.
 *
 * A senha NÃO é comparada aqui. Antes ela era conferida contra
 * `NEXT_PUBLIC_ADMIN_KEY`, que o Next.js embute no bundle do navegador:
 * qualquer pessoa lia a senha no JavaScript e a tela se abria sozinha. Não
 * havia servidor envolvido.
 *
 * Agora a verificação é uma chamada a /api/admin/verify, que compara com
 * `SHANDON_ADMIN_KEY` (segredo do servidor) e devolve cookie httpOnly. A
 * tela só decide o que pintar; quem decide o que abre é o servidor.
 */

export function ShAdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // A sessão mora no cookie httpOnly. O navegador não precisa (e não pode)
  // ler o token; basta perguntar ao servidor se ele ainda vale.
  useEffect(() => {
    let cancelado = false
    fetch('/api/admin/session')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { success?: boolean } | null) => {
        if (cancelado) return
        setIsAuthenticated(d?.success === true)
      })
      .catch(() => {
        if (!cancelado) setIsAuthenticated(false)
      })
      .finally(() => {
        if (!cancelado) setChecking(false)
      })
    return () => { cancelado = true }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const json = await res.json().catch(() => null)
      if (res.ok && json?.success) {
        setIsAuthenticated(true)
        setPassword('')
      } else {
        setError(json?.error || 'Não foi possível entrar. Tente novamente.')
      }
    } catch {
      setError('Erro de conexão com o servidor.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    // O cookie é httpOnly: não dá para apagar pelo JavaScript. O logout real
    // acontece no servidor; até lá, a tela volta ao estado de login.
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {})
    setIsAuthenticated(false)
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#05070A] flex items-center justify-center">
        <div className="text-[11px] text-white/30">Verificando sessão...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#05070A] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Lock size={40} className="mx-auto text-[#00E5FF]/30 mb-4" />
            <h1 className="text-lg font-bold text-white/80">Área Restrita</h1>
            <p className="text-[11px] text-white/30 mt-1">Acesso exclusivo do administrador</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha de administrador"
                className="input-field w-full pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {error && (
              <div className="rounded-[8px] bg-[#FF3B3B]/10 border border-[#FF3B3B]/20 p-3 text-[11px] text-[#FF3B3B]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className={cn(
                'w-full py-3 rounded-full text-[12px] font-bold tracking-widest uppercase transition-all',
                password && !loading
                  ? 'bg-[#00E5FF] text-[#05070A] hover:bg-[#00D4EB]'
                  : 'bg-white/5 text-white/30 cursor-not-allowed'
              )}
            >
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#05070A] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-[#00E5FF]" />
            <div>
              <h1 className="text-lg font-bold text-white/90">Painel Administrativo</h1>
              <p className="text-[10px] text-white/30">SHANDON ELITE — Controle Total</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-[11px] text-white/40 hover:text-[#FF3B3B] transition-colors"
          >
            Sair
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="card">
            <div className="text-[12px] font-bold text-white/60 mb-2">Usuários Cadastrados</div>
            <div className="text-[24px] font-black text-[#00E5FF]">—</div>
            <div className="text-[10px] text-white/30 mt-1">Em breve</div>
          </div>
          <div className="card">
            <div className="text-[12px] font-bold text-white/60 mb-2">Usuários Premium</div>
            <div className="text-[24px] font-black text-[#22FF88]">—</div>
            <div className="text-[10px] text-white/30 mt-1">Em breve</div>
          </div>
          <div className="card">
            <div className="text-[12px] font-bold text-white/60 mb-2">Total de Buscas</div>
            <div className="text-[24px] font-black text-white/80">—</div>
            <div className="text-[10px] text-white/30 mt-1">Em breve</div>
          </div>
        </div>

        <div className="mt-8 card">
          <div className="text-[12px] font-bold text-white/60 mb-3">Ações Rápidas</div>
          <div className="space-y-2">
            <button className="w-full text-left p-3 rounded-[8px] bg-white/[0.03] border border-[#1E293B] text-[12px] text-white/60 hover:bg-white/[0.06] transition-colors">
              Gerenciar Usuários
            </button>
            <button className="w-full text-left p-3 rounded-[8px] bg-white/[0.03] border border-[#1E293B] text-[12px] text-white/60 hover:bg-white/[0.06] transition-colors">
              Aprovar Assinaturas
            </button>
            <button className="w-full text-left p-3 rounded-[8px] bg-white/[0.03] border border-[#1E293B] text-[12px] text-white/60 hover:bg-white/[0.06] transition-colors">
              Ver Logs de Atividade
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
