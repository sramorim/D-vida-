/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#020617',
        foreground: '#FFFFFF',
        card: '#0F172A',
        'card-border': '#1E293B',
        border: '#1E293B',
        primary: '#8B5CF6',
        'primary-dim': 'rgba(139,92,246,0.3)',
        'primary-bright': 'rgba(139,92,246,0.7)',
        accent: '#06B6D4',
        'accent-dim': 'rgba(6,182,212,0.3)',
        'accent-bright': 'rgba(6,182,212,0.7)',
        neon: '#22FF88',
        'neon-dim': 'rgba(34,255,136,0.3)',
        danger: '#EF4444',
        'danger-dim': 'rgba(239,68,68,0.3)',
        warning: '#F59E0B',
        'warning-dim': 'rgba(245,158,11,0.3)',
        text: '#FFFFFF',
        'text-dim': 'rgba(255,255,255,0.5)',
        'text-muted': 'rgba(255,255,255,0.3)',
        dark: {
          50: '#1E293B',
          100: '#0F172A',
          200: '#0A0F1A',
          300: '#020617',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'primary-glow': '0 0 30px rgba(139,92,246,0.3)',
        'accent-glow': '0 0 30px rgba(6,182,212,0.3)',
        'neon-glow': '0 0 30px rgba(34,255,136,0.3)',
        'danger-glow': '0 0 30px rgba(239,68,68,0.3)',
        'card': '0 0 0 1px rgba(139,92,246,0.1), 0 20px 80px rgba(0,0,0,0.8)',
      },
      animation: {
        'scan-line': 'scanLine 8s linear infinite',
        'pulse-primary': 'pulsePrimary 2s ease-in-out infinite',
        'pulse-accent': 'pulseAccent 2s ease-in-out infinite',
      },
      keyframes: {
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        pulsePrimary: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(139,92,246,0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(139,92,246,0.4)' },
        },
        pulseAccent: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(6,182,212,0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(6,182,212,0.4)' },
        },
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
        'card-gradient': 'linear-gradient(135deg, #0F172A 0%, #020617 100%)',
        'primary-gradient': 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
        'accent-gradient': 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
      },
    },
  },
  plugins: [],
}
