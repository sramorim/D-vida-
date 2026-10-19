'use client'

import { useState, useEffect, useCallback } from 'react'
import { Settings, Save, RotateCcw, Moon, Sun, Globe, Shield, Bell, Trash2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SettingsState {
  theme: 'dark' | 'light'
  language: 'pt-BR' | 'en-US'
  notifications: boolean
  autoScan: boolean
  maxResults: number
  apiTimeout: number
  safeMode: boolean
}

const DEFAULT_SETTINGS: SettingsState = {
  theme: 'dark',
  language: 'pt-BR',
  notifications: true,
  autoScan: false,
  maxResults: 20,
  apiTimeout: 30,
  safeMode: true,
}

export function ShConfiguracoes() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)
  const [showReset, setShowReset] = useState(false)

  useEffect(() => {
    const savedSettings = typeof window !== 'undefined' ? localStorage.getItem('shandon-settings') : null
    if (savedSettings) {
      try { setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) }) } catch { /* ignore */ }
    }
  }, [])

  const handleSave = useCallback(() => {
    localStorage.setItem('shandon-settings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [settings])

  const handleReset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    localStorage.removeItem('shandon-settings')
    setShowReset(false)
  }, [])

  const handleClearData = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('shandon-monitored')
      localStorage.removeItem('shandon-history')
      localStorage.removeItem('shandon-settings')
    }
    setSettings(DEFAULT_SETTINGS)
  }, [])

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[20px] border border-white/[0.06] bg-[#0F121A] p-6">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Settings size={18} className="text-neon/60" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/40">
              Configurações
            </span>
          </div>
          <p className="text-[12px] text-white/35">Personalize sua experiência</p>
        </div>

        <div className="space-y-4">
          <div className="rounded-[12px] bg-white/[0.03] border border-white/[0.04] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon size={14} className="text-white/40" />
                <div>
                  <div className="text-[12px] font-bold text-white/70">Tema</div>
                  <div className="text-[10px] text-white/30">Aparência da interface</div>
                </div>
              </div>
              <select
                value={settings.theme}
                onChange={(e) => updateSetting('theme', e.target.value as 'dark' | 'light')}
                className="rounded-[8px] bg-white/[0.04] border border-white/[0.08] px-2 py-1.5 text-[11px] text-white/70 focus:outline-none"
              >
                <option value="dark">Escuro</option>
                <option value="light">Claro</option>
              </select>
            </div>
          </div>

          <div className="rounded-[12px] bg-white/[0.03] border border-white/[0.04] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe size={14} className="text-white/40" />
                <div>
                  <div className="text-[12px] font-bold text-white/70">Idioma</div>
                  <div className="text-[10px] text-white/30">Idioma da interface</div>
                </div>
              </div>
              <select
                value={settings.language}
                onChange={(e) => updateSetting('language', e.target.value as 'pt-BR' | 'en-US')}
                className="rounded-[8px] bg-white/[0.04] border border-white/[0.08] px-2 py-1.5 text-[11px] text-white/70 focus:outline-none"
              >
                <option value="pt-BR">Português</option>
                <option value="en-US">English</option>
              </select>
            </div>
          </div>

          <div className="rounded-[12px] bg-white/[0.03] border border-white/[0.04] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell size={14} className="text-white/40" />
                <div>
                  <div className="text-[12px] font-bold text-white/70">Notificações</div>
                  <div className="text-[10px] text-white/30">Alertas de monitoramento</div>
                </div>
              </div>
              <button
                onClick={() => updateSetting('notifications', !settings.notifications)}
                className={cn(
                  'relative w-10 h-5 rounded-full transition-all',
                  settings.notifications ? 'bg-neon/30' : 'bg-white/10'
                )}
              >
                <div className={cn(
                  'absolute top-0.5 h-4 w-4 rounded-full transition-all',
                  settings.notifications ? 'left-5 bg-neon' : 'left-0.5 bg-white/40'
                )} />
              </button>
            </div>
          </div>

          <div className="rounded-[12px] bg-white/[0.03] border border-white/[0.04] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield size={14} className="text-white/40" />
                <div>
                  <div className="text-[12px] font-bold text-white/70">Modo Seguro</div>
                  <div className="text-[10px] text-white/30">Filtrar conteúdo sensível</div>
                </div>
              </div>
              <button
                onClick={() => updateSetting('safeMode', !settings.safeMode)}
                className={cn(
                  'relative w-10 h-5 rounded-full transition-all',
                  settings.safeMode ? 'bg-neon/30' : 'bg-white/10'
                )}
              >
                <div className={cn(
                  'absolute top-0.5 h-4 w-4 rounded-full transition-all',
                  settings.safeMode ? 'left-5 bg-neon' : 'left-0.5 bg-white/40'
                )} />
              </button>
            </div>
          </div>

          <div className="rounded-[12px] bg-white/[0.03] border border-white/[0.04] p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] font-bold text-white/70">Max Resultados</div>
                <div className="text-[10px] text-white/30">Limite de resultados por busca</div>
              </div>
              <div className="flex items-center gap-2">
                {[10, 20, 50].map((val) => (
                  <button
                    key={val}
                    onClick={() => updateSetting('maxResults', val)}
                    className={cn(
                      'rounded-[8px] px-2.5 py-1 text-[11px] font-bold transition-all',
                      settings.maxResults === val
                        ? 'bg-neon/15 text-neon border border-neon/20'
                        : 'bg-white/5 text-white/40 hover:bg-white/10'
                    )}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[12px] bg-white/[0.03] border border-white/[0.04] p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] font-bold text-white/70">Timeout da API</div>
                <div className="text-[10px] text-white/30">Tempo limite em segundos</div>
              </div>
              <select
                value={settings.apiTimeout}
                onChange={(e) => updateSetting('apiTimeout', parseInt(e.target.value))}
                className="rounded-[8px] bg-white/[0.04] border border-white/[0.08] px-2 py-1.5 text-[11px] text-white/70 focus:outline-none"
              >
                <option value={15}>15s</option>
                <option value={30}>30s</option>
                <option value={60}>60s</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={handleSave}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 rounded-[12px] py-3 text-[12px] font-black tracking-widest uppercase transition-all',
              saved
                ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                : 'bg-neon/15 text-neon border border-neon/20 hover:bg-neon/25'
            )}
          >
            <Save size={14} /> {saved ? 'Salvo!' : 'Salvar'}
          </button>
          <button
            onClick={() => setShowReset(true)}
            className="flex items-center justify-center gap-2 rounded-[12px] px-4 py-3 text-[12px] text-white/40 border border-white/[0.08] hover:bg-white/5 transition-all"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div className="rounded-[20px] border border-white/[0.06] bg-[#0F121A] p-5">
        <div className="text-[10px] font-black tracking-[0.15em] uppercase text-white/40 mb-3">
          Dados Locais
        </div>
        <button
          onClick={handleClearData}
          className="flex items-center gap-2 rounded-[10px] bg-red-500/5 border border-red-500/10 px-4 py-2.5 text-[11px] text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <Trash2 size={12} /> Limpar todos os dados locais
        </button>
      </div>

      <div className="rounded-[20px] border border-white/[0.06] bg-[#0F121A] p-6">
        <div className="flex items-center gap-2 mb-5">
          <Info size={16} className="text-[#8B5CF6]/60" />
          <span className="text-[10px] font-black tracking-[0.15em] uppercase text-white/40">
            Sobre o SHANDON
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col items-center text-center py-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[20px] font-black tracking-[0.15em] text-white/80">SHANDON</span>
              <span className="text-[20px] font-black tracking-[0.15em] text-[#8B5CF6]/80">ELITE</span>
            </div>
            <div className="text-[13px] font-semibold text-white/50 mb-1">
              Public Intelligence Platform
            </div>
            <div className="text-[11px] text-white/30">
              Versão 2.0
            </div>
          </div>

          <div className="rounded-[12px] bg-white/[0.03] border border-white/[0.04] p-4 space-y-3">
            <div className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Copyright</div>
            <div className="text-[13px] text-white/60 font-semibold">
              © {new Date().getFullYear()} SHANDON™
            </div>
            <div className="text-[12px] text-white/40">
              Criado e desenvolvido por <span className="text-white/60 font-semibold">Daniel Amorim</span>
            </div>
            <div className="text-[11px] text-white/30">
              Todos os direitos reservados.
            </div>
          </div>

          <div className="rounded-[12px] bg-white/[0.03] border border-white/[0.04] p-4 space-y-2">
            <div className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Tecnologias</div>
            <div className="flex flex-wrap gap-2">
              {['Next.js', 'TypeScript', 'Tailwind CSS', 'Node.js', 'React'].map((tech) => (
                <span key={tech} className="text-[10px] bg-[#8B5CF6]/10 border border-[#8B5CF6]/15 rounded px-2 py-1 text-[#8B5CF6]/60">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[12px] bg-white/[0.03] border border-white/[0.04] p-4 space-y-2">
            <div className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Links</div>
            <div className="space-y-1.5">
              <a
                href="https://github.com/sramorim/shandon-elite"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[12px] text-white/40 hover:text-[#8B5CF6]/60 transition-colors"
              >
                GitHub →
              </a>
              <a
                href="https://shandon-elite.onrender.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[12px] text-white/40 hover:text-[#8B5CF6]/60 transition-colors"
              >
                Site Oficial →
              </a>
            </div>
          </div>
        </div>
      </div>

      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-[20px] border border-white/[0.1] bg-[#0F121A] p-6 max-w-sm mx-4">
            <h3 className="text-[14px] font-bold text-white/80 mb-2">Resetar configurações?</h3>
            <p className="text-[12px] text-white/40 mb-5">Isso vai restaurar todas as opções para o padrão.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowReset(false)}
                className="flex-1 rounded-[10px] py-2.5 text-[12px] text-white/50 border border-white/[0.08] hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleReset}
                className="flex-1 rounded-[10px] py-2.5 text-[12px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all"
              >
                Resetar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
