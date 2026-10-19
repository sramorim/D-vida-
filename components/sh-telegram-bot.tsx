'use client'

import { useState } from 'react'
import { Bot, Send, MessageCircle, Bell, Settings, CheckCircle, AlertTriangle, Loader2, Copy, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BotCommand {
  command: string
  description: string
  example: string
}

const BOT_COMMANDS: BotCommand[] = [
  { command: '/start', description: 'Iniciar o bot', example: '/start' },
  { command: '/search', description: 'Buscar pessoa por nome', example: '/search Daniel Amorim' },
  { command: '/email', description: 'Buscar por email', example: '/search email daniel@email.com' },
  { command: '/phone', description: 'Buscar por telefone', example: '/search phone 11999999999' },
  { command: '/ig', description: 'Verificar Instagram', example: '/ig senhor_amorim' },
  { command: '/fb', description: 'Verificar Facebook', example: '/fb daniel.amorim' },
  { command: '/of', description: 'Verificar OnlyFans', example: '/of daniel_amorim' },
  { command: '/tinder', description: 'Verificar Tinder', example: '/tinder daniel_amorim' },
  { command: '/status', description: 'Ver status de monitores', example: '/status' },
  { command: '/alerts', description: 'Configurar alertas', example: '/alerts on' },
]

interface Props {
  botUsername?: string
  onSetup: () => void
  isConfigured: boolean
}

export function ShTelegramBot({ botUsername, onSetup, isConfigured }: Props) {
  const [testCommand, setTestCommand] = useState('')
  const [testResult, setTestResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleTest = async () => {
    if (!testCommand.trim()) return
    setLoading(true)
    // Simula teste
    await new Promise(r => setTimeout(r, 1500))
    setTestResult(`✓ Comando "${testCommand}" enviado para @${botUsername || 'shandon_bot'}`)
    setLoading(false)
  }

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd)
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0088CC]/10 border border-[#0088CC]/20">
            <Bot size={16} className="text-[#0088CC]" />
          </div>
          <div>
            <div className="text-[13px] font-black text-white/90">Telegram Bot</div>
            <div className="text-[10px] text-white/35">Acesso rápido direto pelo Telegram</div>
          </div>
        </div>

        {!isConfigured ? (
          <div className="space-y-3">
            <div className="bg-[#0088CC]/5 border border-[#0088CC]/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <MessageCircle size={12} className="text-[#0088CC] mt-0.5 shrink-0" />
                <div className="text-[10px] text-[#0088CC]/80">
                  <strong>Configure seu bot.</strong> Para usar o bot do Telegram, você precisa criar um bot via @BotFather e configurar o token.
                </div>
              </div>
            </div>
            <button onClick={onSetup} className="btn-primary w-full flex items-center justify-center gap-2">
              <Settings size={14} />
              Configurar Bot
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-[#22FF88]/5 border border-[#22FF88]/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <CheckCircle size={12} className="text-[#22FF88] mt-0.5 shrink-0" />
                <div className="text-[10px] text-[#22FF88]/80">
                  <strong>Bot configurado!</strong> Acesse: <a href={`https://t.me/${botUsername}`} target="_blank" rel="noopener noreferrer" className="underline">@{botUsername}</a>
                </div>
              </div>
            </div>

            <div className="text-[11px] font-black tracking-widest uppercase text-white/40">
              Comandos Disponíveis
            </div>
            <div className="space-y-1">
              {BOT_COMMANDS.map((cmd) => (
                <div key={cmd.command} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                  <code className="text-[10px] font-mono text-[#0088CC] font-bold shrink-0">{cmd.command}</code>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] text-white/30">{cmd.description}</div>
                    <div className="text-[8px] text-white/20 truncate">{cmd.example}</div>
                  </div>
                  <button
                    onClick={() => copyCommand(cmd.example)}
                    className="p-1 rounded bg-white/5 text-white/30 hover:bg-white/10 shrink-0"
                  >
                    <Copy size={10} />
                  </button>
                </div>
              ))}
            </div>

            <div className="text-[11px] font-black tracking-widest uppercase text-white/40 mt-4">
              Testar Comando
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={testCommand}
                onChange={(e) => setTestCommand(e.target.value)}
                placeholder="/search Daniel Amorim"
                className="input-field flex-1 text-[11px] font-mono"
              />
              <button
                onClick={handleTest}
                disabled={!testCommand.trim() || loading}
                className="btn-primary px-3"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
            {testResult && (
              <div className="text-[10px] text-[#22FF88] bg-[#22FF88]/5 p-2 rounded">{testResult}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
