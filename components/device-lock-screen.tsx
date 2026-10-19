'use client'

import { useState } from 'react'
import { Shield } from 'lucide-react'
import { activateDevice } from '@/lib/device-lock'

export default function DeviceLockScreen() {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    setTimeout(() => {
      const success = activateDevice(key)
      if (success) {
        window.location.reload()
      } else {
        setError('Chave inválida')
        setLoading(false)
      }
    }, 500)
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#05070A]">
      <div className="absolute inset-0 bg-[url('/grid-pattern')] opacity-10" />

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-cyan to-transparent opacity-40" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-cyan to-transparent opacity-40" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[1px] h-[600px] bg-gradient-to-b from-transparent via-cyan to-transparent opacity-40" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[1px] h-[600px] bg-gradient-to-b from-transparent via-cyan to-transparent opacity-40" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="flex flex-col items-center gap-8">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-cyan/20 blur-2xl animate-pulse-cyan" />
            <div className="relative flex items-center justify-center w-24 h-24 rounded-full border border-cyan/30 bg-dark-100">
              <Shield className="w-12 h-12 text-cyan" strokeWidth={1.5} />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-3xl font-mono font-bold tracking-wider text-white">
              SHANDON ELITE
            </h1>
            <p className="text-sm text-text-dim tracking-widest uppercase">
              Ative seu dispositivo
            </p>
          </div>

          <form onSubmit={handleActivate} className="w-full space-y-4">
            <div className="relative">
              <input
                type="text"
                value={key}
                onChange={(e) => {
                  setKey(e.target.value.toUpperCase())
                  setError('')
                }}
                placeholder="Digite sua chave de ativação"
                className="w-full px-4 py-4 bg-dark-100 border border-border rounded-lg text-white font-mono text-center text-lg tracking-widest placeholder:text-text-muted placeholder:tracking-normal placeholder:text-sm focus:outline-none focus:border-cyan focus:shadow-cyan-glow transition-all"
                autoFocus
                disabled={loading}
              />
              <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-cyan/5 to-transparent pointer-events-none" />
            </div>

            {error && (
              <div className="flex items-center justify-center gap-2 text-danger text-sm font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!key || loading}
              className="w-full py-4 bg-gradient-to-r from-cyan to-cyan-bright text-[#05070A] font-mono font-bold text-sm tracking-widest uppercase rounded-lg transition-all hover:shadow-cyan-glow disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#05070A]/30 border-t-[#05070A] rounded-full animate-spin" />
                  Verificando...
                </span>
              ) : (
                'Ativar'
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-xs text-text-muted">
              Dispositivo bloqueado. Chave de ativação necessária.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
