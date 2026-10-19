'use client'

import { useState, useCallback, useEffect } from 'react'
import { ShHeader } from '@/components/sh-header'
import { ShMenu, VIEWS_VALIDOS, type ViewType } from '@/components/sh-menu'
import { ShHero } from '@/components/sh-hero'
import { ShOsint } from '@/components/sh-osint'
import { ShInstagramProfundo } from '@/components/sh-instagram-profundo'
import { ShFacebook } from '@/components/sh-facebook'
import { ShComparador } from '@/components/sh-comparador'
import { ShRadarMonitorados } from '@/components/sh-radar-monitorados'
import { ShRadarHistorico } from '@/components/sh-radar-historico'
import { ShConfiguracoes } from '@/components/sh-configuracoes'
import { ShPlans } from '@/components/sh-plans'
import { ShRadar } from '@/components/sh-radar'
import { ShIpIntel } from '@/components/sh-ip-intel'
import { ShDomainIntel } from '@/components/sh-domain-intel'
import { ShBreachCheck } from '@/components/sh-breach-check'
import { ShCryptoCheck } from '@/components/sh-crypto-check'
import { ShExposedDb } from '@/components/sh-exposed-db'
import { ShImageForensics } from '@/components/sh-image-forensics'
import { ShPhoneOsint } from '@/components/sh-phone-osint'
import { ShWhatsAppLookup } from '@/components/sh-whatsapp-lookup'
import { ShUsernameEnum } from '@/components/sh-username-enum'
import { ShPasswordLeak } from '@/components/sh-password-leak'
import { ShGoogleDorks } from '@/components/sh-google-dorks'
import { ShSubdomainFinder } from '@/components/sh-subdomain-finder'
import { ShWaybackCheck } from '@/components/sh-wayback-check'
import { ShSslTracker } from '@/components/sh-ssl-tracker'
import { ShPortScanner } from '@/components/sh-port-scanner'
import { ShEmailHeader } from '@/components/sh-email-header'
import { ShTelegramOsint } from '@/components/sh-telegram-osint'
import { ShSocialCheck } from '@/components/sh-social-check'
import { ShAnonInvestigation } from '@/components/sh-anon-investigation'
import { ShAuthInvestigation } from '@/components/sh-auth-investigation'
import { ShAuthModal } from '@/components/sh-auth-modal'
import { ShInstagramModule } from '@/components/sh-instagram-module'
import { ShInstagramAuthSettings } from '@/components/sh-instagram-auth-settings'
import { ShInstagramAnalyzer } from '@/components/sh-instagram-analyzer'
import { ShInstagramComparison } from '@/components/sh-instagram-comparison'
import { ShFacebookModule } from '@/components/sh-facebook-module'
import { ShTiktokModule } from '@/components/sh-tiktok-module'
import { ShPremiumHub } from '@/components/sh-premium-hub'
import { ShDarkwebDashboard } from '@/components/sh-darkweb-dashboard'
import { ShDarkSearch } from '@/components/sh-dark-search'
import { ShDeepLeak } from '@/components/sh-deep-leak'
import { ShPasteMonitor } from '@/components/sh-paste-monitor'
import { ShForumMonitor } from '@/components/sh-forum-monitor'
import { ShCredentialLeak } from '@/components/sh-credential-leak'
import { ShAdvancedDashboard } from '@/components/sh-advanced-dashboard'
import { ShBulkScanner } from '@/components/sh-bulk-scanner'
import { ShAdvancedDorks } from '@/components/sh-advanced-dorks'
import { ShEmailTrace } from '@/components/sh-email-trace'
import { ShMetadataExtractor } from '@/components/sh-metadata-extractor'
import { ShWaybackPro } from '@/components/sh-wayback-pro'
import { ShSslHistory } from '@/components/sh-ssl-history'
import { ShCorrelationEngine } from '@/components/sh-correlation-engine'
import { ShTimeline } from '@/components/sh-timeline'
import { ShChatbot } from '@/components/chatbot/sh-chatbot'
import { ShUniversalSearch } from '@/components/sh-universal-search'
import { ShAccessPanel } from '@/components/sh-access-panel'
import { ShAuthLogin } from '@/components/sh-auth-login'
import { ShPrivateModule } from '@/components/sh-private-module'
import { ShTelegramBot } from '@/components/sh-telegram-bot'

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeView, setActiveView] = useState<ViewType>('dashboard')
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [accessLevel, setAccessLevel] = useState<'public' | 'authenticated' | 'admin'>('public')
  const [authStatus, setAuthStatus] = useState<{ provider: 'facebook' | 'instagram'; authenticated: boolean; username?: string; sessionCookie?: string }[]>([])

  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { success?: boolean; authenticated?: boolean; isAdmin?: boolean } | null) => {
        if (cancelled || !data?.success || !data.authenticated) return
        setAccessLevel(data.isAdmin ? 'admin' : 'authenticated')
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const handleNavigate = useCallback((view: ViewType) => {
    if (view === 'login') {
      setAuthMode('login')
      setAuthModalOpen(true)
      setMenuOpen(false)
      return
    }
    if (view === 'register') {
      setAuthMode('register')
      setAuthModalOpen(true)
      setMenuOpen(false)
      return
    }
    setActiveView(view)
    setMenuOpen(false)
    // A URL passa a refletir a tela. Sem isso, recarregar a página ou
    // compartilhar o link devolvia o usuário sempre ao dashboard, e o
    // redirecionamento de /premium para /?view=X não tinha efeito.
    const url = new URL(window.location.href)
    if (view === 'dashboard') {
      url.searchParams.delete('view')
    } else {
      url.searchParams.set('view', view)
    }
    window.history.replaceState(null, '', url)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Lê ?view= na montagem. É o que faz o link "?view=buscar-pessoa" abrir a
  // tela certa, e o que faz o botão "Voltar para ferramentas" do hub
  // premium funcionar.
  useEffect(() => {
    const alvo = new URLSearchParams(window.location.search).get('view')
    if (alvo && alvo in VIEWS_VALIDOS) {
      setActiveView(alvo as ViewType)
    }
  }, [])

  const handleAuth = useCallback(async (provider: 'facebook' | 'instagram', username: string, password: string) => {
    if (provider === 'instagram') {
      try {
        const res = await fetch('/api/instagram/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        })
        const json = await res.json()
        if (json.success && json.data) {
          setAuthStatus(prev => [...prev.filter(s => s.provider !== provider), {
            provider,
            authenticated: true,
            username: json.data.username,
            sessionCookie: json.data.sessionCookie,
          }])
        } else {
          throw new Error(json.error || 'Falha na autenticação')
        }
      } catch (err) {
        throw err
      }
    } else {
      throw new Error('Login do Facebook ainda não está disponível. Use "Configurar Sessão" no Instagram ou as ferramentas públicas.')
    }
  }, [])

  const handleLogout = useCallback((provider: 'facebook' | 'instagram') => {
    setAuthStatus(prev => prev.filter(s => s.provider !== provider))
  }, [])

  const handleTelegramSetup = useCallback(() => {
    // TODO: Implementar configuração do Telegram Bot
    // Por enquanto, redirecionar para a página do Telegram
    setActiveView('telegram-bot')
  }, [])

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <ShHero onNavigate={handleNavigate} />

      case 'anon-investigation':
        return <ShAnonInvestigation />
      case 'auth-investigation':
        return <ShAuthInvestigation />

      case 'osint-user':
        return <ShOsint initialView="user" />
      case 'osint-email':
        return <ShOsint initialView="email" />
      case 'osint-phone':
        return <ShOsint initialView="phone" />

      case 'username-enum':
        return <ShUsernameEnum />
      case 'password-leak':
        return <ShPasswordLeak />
      case 'social-check':
        return <ShSocialCheck />
      case 'google-dorks':
        return <ShGoogleDorks />
      case 'subdomain-finder':
        return <ShSubdomainFinder />
      case 'wayback-check':
        return <ShWaybackCheck />
      case 'ssl-tracker':
        return <ShSslTracker />
      case 'port-scanner':
        return <ShPortScanner />
      case 'email-header':
        return <ShEmailHeader />
      case 'telegram-osint':
        return <ShTelegramOsint />

      case 'ip-intel':
        return <ShIpIntel />
      case 'domain-intel':
        return <ShDomainIntel />
      case 'breach-check':
        return <ShBreachCheck />
      case 'phone-osint':
        return <ShPhoneOsint />
      case 'whatsapp-lookup':
        return <ShWhatsAppLookup />
      case 'crypto-check':
        return <ShCryptoCheck />
      case 'exposed-db':
        return <ShExposedDb />
      case 'image-forensics':
        return <ShImageForensics />

      case 'instagram':
        return <ShInstagramProfundo />

      case 'facebook':
        return <ShFacebook />

      case 'instagram-module':
        return <ShInstagramModule
          sessionCookie={authStatus.find(s => s.provider === 'instagram')?.sessionCookie}
          authUsername={authStatus.find(s => s.provider === 'instagram')?.username}
          onLogin={() => handleNavigate('auth-login')}
        />

      case 'instagram-auth-settings':
        return <ShInstagramAuthSettings />
      case 'instagram-auth-analyzer':
        return <ShInstagramAnalyzer />
      case 'instagram-auth-comparison':
        return <ShInstagramComparison />
      case 'facebook-module':
        return <ShFacebookModule />
      case 'tiktok-module':
        return <ShTiktokModule />

      case 'premium':
        return <ShPremiumHub onNavigate={handleNavigate} />
      case 'darkweb':
        return <ShDarkwebDashboard />
      case 'dark-search':
        return <ShDarkSearch />
      case 'deep-leak':
        return <ShDeepLeak />
      case 'paste-monitor':
        return <ShPasteMonitor />
      case 'forum-monitor':
        return <ShForumMonitor />
      case 'credential-leak':
        return <ShCredentialLeak />

      case 'advanced':
        return <ShAdvancedDashboard onNavigate={handleNavigate} />
      case 'bulk-scan':
        return <ShBulkScanner />
      case 'advanced-dorks':
        return <ShAdvancedDorks />
      case 'email-trace':
        return <ShEmailTrace />
      case 'metadata-extractor':
        return <ShMetadataExtractor />
      case 'wayback-pro':
        return <ShWaybackPro />
      case 'ssl-history':
        return <ShSslHistory />
      case 'correlation':
        return <ShCorrelationEngine />
      case 'timeline':
        return <ShTimeline />

      case 'universal-search':
        return <ShUniversalSearch />
      case 'auth-login':
        return <ShAuthLogin onAuth={handleAuth} onLogout={handleLogout} status={authStatus} />
      case 'private-module':
        return <ShPrivateModule isAdmin={accessLevel === 'admin'} onNavigate={handleNavigate} />
      case 'telegram-bot':
        return <ShTelegramBot isConfigured={false} onSetup={handleTelegramSetup} />

      case 'comparador':
        return <ShComparador />

      case 'radar':
        return <ShRadar />
      case 'radar-monitorados':
        return <ShRadarMonitorados />
      case 'radar-historico':
        return <ShRadarHistorico />

      case 'planos':
        return <ShPlans />
      case 'configuracoes':
        return <ShConfiguracoes />

      default:
        return <ShHero onNavigate={handleNavigate} />
    }
  }

  return (
    <div className="min-h-screen bg-[#020617]">
      <div className="matrix-bg" />
      <div className="scan-line" />

      <ShHeader onMenuOpen={() => setMenuOpen(true)} />

      <ShMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        activeView={activeView}
        onNavigate={handleNavigate}
        isAdmin={accessLevel === 'admin'}
      />

      <main className="relative z-10 mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-8">
        {renderView()}

        <ShAuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          mode={authMode}
        />

        <ShChatbot />

        <footer className="mt-16 border-t border-white/[0.06] pt-10 pb-10">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              {/* Left - Brand + Copyright */}
              <div className="flex flex-col items-center md:items-start gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-black tracking-[0.15em] text-white/80">SHANDON</span>
                  <span className="text-[15px] font-black tracking-[0.15em] text-[#8B5CF6]/80">ELITE</span>
                </div>
                <div className="text-[12px] font-semibold text-white/50 tracking-wide">
                  © {new Date().getFullYear()} SHANDON™
                </div>
                <div className="text-[11px] text-white/35">
                  Criado e desenvolvido por <span className="text-white/55 font-semibold">Daniel Amorim</span>
                </div>
                <div className="text-[10px] text-white/25">
                  Todos os direitos reservados
                </div>
              </div>

              {/* Center - Links */}
              <div className="flex flex-wrap items-center justify-center gap-5">
                {[
                  { label: 'Dashboard', view: 'dashboard' },
                  { label: 'Investigar', view: 'osint-user' },
                  { label: 'Redes Sociais', view: 'social-check' },
                  { label: 'Planos', view: 'planos' },
                  { label: 'Configurações', view: 'configuracoes' },
                ].map((link) => (
                  <button
                    key={link.view}
                    onClick={() => handleNavigate(link.view as ViewType)}
                    className="text-[11px] text-white/30 hover:text-white/60 transition-colors uppercase tracking-wider font-medium"
                  >
                    {link.label}
                  </button>
                ))}
              </div>

              {/* Right - Social */}
              <div className="flex flex-col items-center md:items-end gap-2">
                <div className="flex items-center gap-2 text-[11px] text-[#8B5CF6]/50">
                  <span>@Sr__Amorim</span>
                </div>
                <div className="text-[10px] text-white/20">
                  Public Intelligence Platform
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="mt-8 pt-6 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-white/25 font-medium">
                SHANDON ELITE v2.0 — OSINT Engine
              </div>
              <div className="flex items-center gap-5">
                <span className="text-[10px] text-white/20">Dados 100% Públicos</span>
                <span className="text-[10px] text-white/15">•</span>
                <span className="text-[10px] text-white/20">Open Source</span>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
