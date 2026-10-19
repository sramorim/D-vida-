'use client'

import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ShAuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode?: 'login' | 'register'
  onAuth?: (user: { userId: string; email: string; tier: string }) => void
}

export function ShAuthModal({ isOpen, onClose, mode: initialMode = 'login', onAuth }: ShAuthModalProps) {
  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body = mode === 'login'
        ? { email, password }
        : { email, password, confirmPassword }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error || 'Erro ao processar')
        return
      }

      if (onAuth && data.data) {
        onAuth(data.data.user)
      }
      onClose()
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[20px] border border-white/[0.08] bg-[#0F121A] p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[16px] font-black text-white/90">
            {mode === 'login' ? 'Entrar' : 'Criar Conta'}
          </h3>
          <button onClick={onClose} className="text-white/30 hover:text-white/60">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold tracking-widest uppercase text-white/30 mb-1.5 block">E-mail</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-[10px] border border-white/[0.08] bg-white/[0.03] py-2.5 pl-9 pr-3 text-[13px] text-white/80 placeholder:text-white/20 focus:border-[#00E5FF]/30 focus:outline-none"
                placeholder="email@exemplo.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold tracking-widest uppercase text-white/30 mb-1.5 block">Senha</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-[10px] border border-white/[0.08] bg-white/[0.03] py-2.5 pl-9 pr-9 text-[13px] text-white/80 placeholder:text-white/20 focus:border-[#00E5FF]/30 focus:outline-none"
                placeholder="••••••••"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40">
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="text-[10px] font-bold tracking-widest uppercase text-white/30 mb-1.5 block">Confirmar Senha</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-[10px] border border-white/[0.08] bg-white/[0.03] py-2.5 pl-9 pr-3 text-[13px] text-white/80 placeholder:text-white/20 focus:border-[#00E5FF]/30 focus:outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-[8px] bg-red-500/10 border border-red-500/20 px-3 py-2 text-[11px] text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-[12px] bg-white py-3 text-[11px] font-black tracking-widest uppercase text-black hover:bg-white/90 active:scale-[0.98] disabled:opacity-50"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {mode === 'login' ? 'Entrar' : 'Criar Conta'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-[11px] text-white/30 hover:text-white/50"
          >
            {mode === 'login' ? 'Não tem conta? Criar' : 'Já tem conta? Entrar'}
          </button>
        </div>
      </div>
    </div>
  )
}
