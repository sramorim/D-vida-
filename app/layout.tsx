import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/providers/theme-provider'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  title: 'SHANDON ELITE — OSINT ENGINE',
  description: 'Plataforma OSINT profissional. Busca de usernames, e-mails, telefones, IPs, domínios, crypto, redes sociais e mais. 100% gratuito, sem API keys.',
  keywords: ['osint', 'inteligência', 'investigação', 'username', 'email', 'phone', 'instagram', 'facebook', 'ip', 'domain', 'crypto', 'hacker do bem'],
  authors: [{ name: 'SHANDON ELITE' }],
  creator: 'SHANDON ELITE',
  publisher: 'SHANDON ELITE',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://shandon-elite.com',
    siteName: 'SHANDON ELITE',
    title: 'SHANDON ELITE — OSINT ENGINE',
    description: 'Plataforma OSINT profissional. 100% gratuito, sem API keys.',
    images: [
      {
        url: '/logo.svg',
        width: 512,
        height: 512,
        alt: 'Shandon Elite Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SHANDON ELITE',
    description: 'Plataforma OSINT profissional. 100% gratuito.',
    images: ['/logo.svg'],
  },
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jetbrainsMono.variable} dark`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-[#020617] text-white font-sans antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
