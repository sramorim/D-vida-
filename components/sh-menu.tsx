'use client'

import { useEffect, useCallback } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import {
  Home, Search, Instagram, Phone, Mail,
  Globe2, Users,
  Settings, Radar, Clock, GitCompare, Crown, Lock,
  ChevronRight, X, Wifi, Globe, Link, Key,
  FileText, Send, Scan,
  Fingerprint, ShieldCheck,
  UserPlus, MessageCircle
} from 'lucide-react'

export type ViewType =
  | 'dashboard'
  | 'anon-investigation' | 'auth-investigation'
  | 'osint-user' | 'osint-email' | 'osint-phone'
  | 'username-enum' | 'password-leak' | 'social-check'
  | 'ip-intel' | 'domain-intel' | 'breach-check' | 'crypto-check'
  | 'exposed-db' | 'image-forensics' | 'phone-osint'
  | 'whatsapp-lookup'
  | 'google-dorks' | 'subdomain-finder' | 'wayback-check'
  | 'ssl-tracker' | 'port-scanner' | 'email-header' | 'telegram-osint'
  | 'instagram' | 'instagram-seguidores' | 'instagram-interacoes' | 'instagram-snapshots'
  | 'instagram-auth-settings' | 'instagram-auth-analyzer' | 'instagram-auth-comparison'
  | 'facebook'
  | 'comparador'
  | 'radar' | 'radar-monitorados' | 'radar-historico'
  | 'configuracoes' | 'planos'
  | 'login' | 'register' | 'premium' | 'darkweb' | 'dark-search' | 'deep-leak' | 'paste-monitor' | 'forum-monitor' | 'credential-leak' | 'advanced' | 'bulk-scan' | 'advanced-dorks' | 'email-trace' | 'metadata-extractor' | 'wayback-pro' | 'ssl-history' | 'correlation' | 'timeline' | 'instagram-module' | 'facebook-module' | 'tiktok-module' | 'adult-sites'
  | 'universal-search' | 'auth-login' | 'private-module' | 'telegram-bot'

interface MenuItem {
  id: ViewType
  label: string
  description: string
  icon: React.ReactNode
  implemented: boolean
  badge?: string
}

interface MenuGroup {
  title: string
  items: MenuItem[]
  adminOnly?: boolean
}

interface ShMenuProps {
  isOpen: boolean
  onClose: () => void
  activeView: ViewType
  onNavigate: (view: ViewType) => void
  isAdmin: boolean
}

const MENU_GROUPS: MenuGroup[] = [
  {
    title: 'PRINCIPAL',
    items: [
      { id: 'dashboard', label: 'Dashboard', description: 'Página inicial', icon: <Home size={16} />, implemented: true },
      { id: 'universal-search', label: 'Buscar Pessoa', description: 'Nome, e-mail, telefone ou username', icon: <Search size={16} />, implemented: true },
      { id: 'planos', label: 'Planos', description: 'Assinatura PRO', icon: <Crown size={16} />, implemented: true },
    ],
  },
  {
    title: 'REDES SOCIAIS',
    items: [
      { id: 'instagram', label: 'Perfil Público', description: 'Bio, seguidores, contatos e cidade', icon: <Instagram size={16} />, implemented: true },
      { id: 'instagram-seguidores', label: 'Seguidores', description: 'Exige scraping com sessão — não implementado', icon: <Users size={16} />, implemented: false },
      { id: 'instagram-snapshots', label: 'Snapshots', description: 'Use "Comparação" em Instagram com sessão', icon: <GitCompare size={16} />, implemented: false },
      { id: 'social-check', label: 'IG / TikTok', description: 'Checagem rápida em IG e TikTok', icon: <Globe2 size={16} />, implemented: true },
    ],
  },
  {
    title: 'INSTAGRAM COM SESSÃO',
    items: [
      { id: 'instagram-auth-settings', label: 'Configurar Sessão', description: 'Colar cookie sessionid', icon: <Settings size={16} />, implemented: true, badge: 'AUTH' },
      { id: 'instagram-auth-analyzer', label: 'Analyzer', description: 'Captura completa de perfil', icon: <Search size={16} />, implemented: true, badge: 'AUTH' },
      { id: 'instagram-auth-comparison', label: 'Comparação', description: 'Diferenças entre snapshots', icon: <GitCompare size={16} />, implemented: true, badge: 'AUTH' },
    ],
  },
  {
    title: 'E-MAIL',
    items: [
      { id: 'osint-email', label: 'E-mail', description: 'Contas associadas ao e-mail', icon: <Mail size={16} />, implemented: true },
      { id: 'email-header', label: 'Análise de Cabeçalho', description: 'Trilha de um e-mail recebido', icon: <FileText size={16} />, implemented: true },
      { id: 'password-leak', label: 'Password Leak', description: 'Verificação de vazamentos', icon: <Key size={16} />, implemented: true },
    ],
  },
  {
    title: 'TELEFONE / CELULAR',
    items: [
      { id: 'osint-phone', label: 'Telefone', description: 'Formato, operadora, localização', icon: <Phone size={16} />, implemented: true },
      { id: 'whatsapp-lookup', label: 'WhatsApp Lookup', description: 'Perfil, status, business, dispositivos', icon: <MessageCircle size={16} />, implemented: true, badge: 'API' },
    ],
  },
  {
    title: 'USERNAME / PESSOAS',
    items: [
      { id: 'osint-user', label: 'Username / Pessoa', description: 'Busca por username', icon: <Search size={16} />, implemented: true },
      { id: 'username-enum', label: 'Username Enumerator', description: '100+ sites simultâneos', icon: <Scan size={16} />, implemented: true },
      { id: 'telegram-osint', label: 'Telegram', description: 'Perfis do Telegram', icon: <Send size={16} />, implemented: true },
      { id: 'comparador', label: 'Comparador', description: 'Dois perfis lado a lado', icon: <GitCompare size={16} />, implemented: true },
    ],
  },
  {
    title: 'DOMÍNIOS / INFRAESTRUTURA',
    items: [
      { id: 'domain-intel', label: 'Domain Recon', description: 'WHOIS, DNS, SSL, tecnologias', icon: <Globe size={16} />, implemented: true },
      { id: 'subdomain-finder', label: 'Subdomínios', description: 'Subdomínios ocultos', icon: <Link size={16} />, implemented: true },
      { id: 'ssl-tracker', label: 'SSL Certificate', description: 'Histórico de certificados', icon: <ShieldCheck size={16} />, implemented: true },
      { id: 'wayback-check', label: 'Wayback Machine', description: 'Versões antigas de sites', icon: <Clock size={16} />, implemented: true },
      { id: 'ip-intel', label: 'IP Intelligence', description: 'Geo, ASN, ISP', icon: <Wifi size={16} />, implemented: true },
    ],
  },
  {
    title: 'MONITORAMENTO',
    items: [
      { id: 'radar', label: 'Radar de Presença', description: 'Monitorar presença online', icon: <Radar size={16} />, implemented: true },
      { id: 'radar-monitorados', label: 'Perfis Monitorados', description: 'Lista de monitorados', icon: <Users size={16} />, implemented: true },
      { id: 'radar-historico', label: 'Histórico', description: 'Evolução temporal', icon: <Clock size={16} />, implemented: true },
    ],
  },
  {
    title: 'CONTA',
    items: [
      { id: 'login', label: 'Entrar', description: 'Acessar sua conta', icon: <Fingerprint size={16} />, implemented: true },
      { id: 'register', label: 'Criar Conta', description: 'Cadastro gratuito', icon: <UserPlus size={16} />, implemented: true },
      { id: 'configuracoes', label: 'Configurações', description: 'Preferências do sistema', icon: <Settings size={16} />, implemented: true },
    ],
  },
  {
    title: 'ÁREA RESTRITA',
    adminOnly: true,
    items: [
      { id: 'private-module', label: 'Área Restrita', description: 'Somente administrador', icon: <Lock size={16} />, implemented: true, badge: 'ADMIN' },
    ],
  },
]

/**
 * Todas as telas que existem, derivadas do próprio menu.
 *
 * O roteador da home valida o `?view=` da URL contra esta lista. Derivar em
 * vez de manter uma cópia é o que impede um link de abrir uma tela que não
 * existe mais (ou o contrário: uma tela nova funcionar e não ser acessível
 * por link).
 */
export const VIEWS_VALIDOS: ReadonlySet<string> = new Set(
  MENU_GROUPS.flatMap((g) => g.items.map((i) => i.id as string))
)

export function ShMenu({ isOpen, onClose, activeView, onNavigate, isAdmin }: ShMenuProps) {
  const handleNavigate = useCallback((view: ViewType) => {
    onNavigate(view)
    onClose()
  }, [onNavigate, onClose])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-[#020617] border-l border-white/[0.06] transition-transform duration-300 ease-out overflow-y-auto',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.06] bg-[#020617]/90 backdrop-blur-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8 overflow-hidden rounded-lg ring-1 ring-[#8B5CF6]/20 bg-gradient-to-br from-[#8B5CF6]/10 to-[#06B6D4]/10 p-[1px]">
              <div className="relative h-full w-full overflow-hidden rounded-[7px] bg-[#0F172A]">
                <Image src="/logo.svg" alt="SH" fill className="object-cover" />
              </div>
            </div>
            <div>
              <div className="text-[11px] font-black tracking-[0.15em] text-white/90">SHANDON ELITE</div>
              <div className="text-[9px] tracking-widest text-[#8B5CF6]/60">OSINT ENGINE</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white hover:bg-white/[0.08] transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-4 py-4">
          {MENU_GROUPS.filter((group) => !group.adminOnly || isAdmin).map((group) => (
            <div key={group.title} className="mb-5">
              <div className="px-3 mb-2 text-[10px] font-black tracking-[0.2em] text-white/20 uppercase">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = activeView === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.id)}
                      disabled={!item.implemented}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200',
                        isActive
                          ? 'bg-[#8B5CF6]/10 border border-[#8B5CF6]/20'
                          : 'hover:bg-white/[0.04] border border-transparent',
                        !item.implemented && 'opacity-50'
                      )}
                    >
                      <div className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                        isActive ? 'bg-[#8B5CF6]/15 text-[#A78BFA]' : 'bg-white/[0.04] text-white/35'
                      )}>
                        {item.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={cn(
                          'text-[12px] font-bold',
                          isActive ? 'text-[#A78BFA]' : 'text-white/75'
                        )}>
                          {item.label}
                        </div>
                        <div className="text-[10px] text-white/25 truncate">{item.description}</div>
                      </div>
                      {item.badge ? (
                        <span className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 text-[8px] font-bold tracking-wider uppercase',
                          item.badge === 'INDISPONÍVEL'
                            ? 'bg-white/5 text-white/25'
                            : 'bg-[#F59E0B]/10 text-[#FBBF24]'
                        )}>
                          {item.badge}
                        </span>
                      ) : (
                        <ChevronRight size={12} className="shrink-0 text-white/15" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 border-t border-white/[0.06] bg-[#020617]/90 backdrop-blur-xl px-5 py-4">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-[0.15em] text-white/40">SHANDON</span>
              <span className="text-[10px] font-bold tracking-[0.15em] text-[#8B5CF6]/40">ELITE</span>
            </div>
            <div className="text-[9px] text-white/20">
              © {new Date().getFullYear()} Daniel Amorim — Todos os direitos reservados
            </div>
            <div className="text-[8px] text-[#8B5CF6]/25">
              @Sr__Amorim • Public Intelligence Platform
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
