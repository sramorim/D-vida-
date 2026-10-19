'use client'

import { useState } from 'react'
import { ExternalLink, ChevronDown, ChevronUp, Shield, Clock, Link2, Scan } from 'lucide-react'
import { SearchResult, SnapshotPlatform } from '@/lib/types'
import { StatusBadge } from './status-badge'
import { ProfileDrawer } from './profile-drawer'
import { cn } from '@/lib/utils'

interface ResultCardProps {
  result: SearchResult
  index: number
}

function getSourceLabel(source: SearchResult['source']): string {
  const labels: Record<SearchResult['source'], string> = {
    maigret: 'Maigret',
    holehe: 'Holehe',
    instaloader: 'Instaloader',
    phonenumbers: 'libphonenumber',
    'http-checker': 'HTTP Checker',
    manual: 'Manual',
    'ip-intel': 'IP Intelligence',
    'domain-intel': 'Domain Recon',
    'breach-check': 'Breach Check',
    'crypto-check': 'Crypto Intel',
    'exposed-db': 'Exposed DB',
    'image-forensics': 'Image Forensics',
    'phone-osint': 'Phone OSINT',
    'username-enum': 'Username Enum',
    'password-leak': 'Password Leak',
    'social-check': 'Social Check',
    telegram: 'Telegram OSINT',
    subdomain: 'Subdomain Finder',
    wayback: 'Wayback Machine',
    'ssl-tracker': 'SSL Tracker',
    'port-scanner': 'Port Scanner',
  }
  return labels[source] || source
}

function getStatusType(result: SearchResult): 'found' | 'not_found' | 'rate_limited' | 'error' | 'possible' | 'valid' | 'invalid' | 'follower' | 'following' {
  if (result.status === 'follower') return 'follower'
  if (result.status === 'following') return 'following'
  if (result.status === 'rate_limited') return 'rate_limited'
  if (result.status === 'valid') return 'valid'
  if (result.status === 'invalid') return 'invalid'
  if (result.exists === true) return 'found'
  if (result.exists === false) return 'not_found'
  return 'possible'
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function ResultCard({ result, index }: ResultCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)
  const statusType = getStatusType(result)

  const isAnalyzeable = (result.platform === 'Instagram' || result.platform === 'Facebook') && result.exists
  const snapshotPlatform = result.platform === 'Instagram' ? 'instagram' : 'facebook' as SnapshotPlatform

  return (
    <div
      className={cn(
        'card card-hover animate-in stagger-' + ((index % 6) + 1),
        result.exists && 'border-neon/10'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 overflow-hidden flex items-center justify-center rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-black text-white/50">
          {result.avatar ? (
            <img src={result.avatar} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            result.platform.slice(0, 2).toUpperCase()
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-white/90">
              {result.platform}
            </span>
            <StatusBadge status={statusType} />
          </div>
          <div className="mt-0.5 text-[12px] text-white/50 font-mono">
            {result.displayName}
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className={cn(
            'text-[18px] font-black',
            result.exists ? 'text-neon' : 'text-white/20'
          )}>
            {result.score}
          </div>
          <div className="text-[9px] text-white/25 uppercase tracking-wider">
            score
          </div>
        </div>
      </div>

      {result.url && (
        <a
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-neon/80 hover:text-neon transition-colors"
        >
          @{result.username} <Link2 size={10} />
        </a>
      )}

      {result.bio && (
        <div className="mt-3 rounded-[10px] bg-white/[0.03] border border-white/[0.04] px-3 py-2 text-[11px] text-white/50 leading-relaxed">
          {result.bio}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-white/30">
        {result.followers && (
          <span className="flex items-center gap-1">
            <span className="text-white/50 font-bold">{result.followers}</span> seguidores
          </span>
        )}
        {result.following && (
          <span className="flex items-center gap-1">
            <span className="text-white/50 font-bold">{result.following}</span> seguindo
          </span>
        )}
        {result.posts && (
          <span className="flex items-center gap-1">
            <span className="text-white/50 font-bold">{result.posts}</span> posts
          </span>
        )}
        {result.location && (
          <span className="flex items-center gap-1">
            📍 {result.location}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 text-[10px] text-white/25">
        <Shield size={10} />
        <span>Fonte: {getSourceLabel(result.source)}</span>
        <span className="text-white/10">•</span>
        <Clock size={10} />
        <span>{formatTimestamp(result.timestamp)}</span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {result.url && (
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-[8px] bg-neon/10 border border-neon/15 px-3 py-1.5 text-[10px] font-bold text-neon/80 uppercase tracking-wider transition-all hover:bg-neon/20 hover:text-neon"
          >
            <Link2 size={10} />
            Ver na fonte
            <ExternalLink size={9} />
          </a>
        )}

        {isAnalyzeable && (
          <button
            onClick={() => setShowDrawer(true)}
            className="flex items-center gap-1.5 rounded-[8px] bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 text-[10px] font-bold text-white/40 uppercase tracking-wider transition-all hover:bg-white/[0.08] hover:text-white/60"
          >
            <Scan size={10} />
            Analisar Perfil
          </button>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 rounded-[8px] bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 text-[10px] font-bold text-white/40 uppercase tracking-wider transition-all hover:bg-white/[0.08] hover:text-white/60"
        >
          Detalhes
          {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 rounded-[10px] bg-[#05070A] border border-white/[0.04] p-3 space-y-2 animate-in">
          <DetailRow label="Plataforma" value={result.platform} />
          <DetailRow label="Username" value={result.username} />
          <DetailRow label="Status" value={result.status || '—'} />
          <DetailRow label="HTTP Status" value={result.httpStatus?.toString() || '—'} />
          <DetailRow label="ID" value={result.id} />
          {result.extra && Object.entries(result.extra).map(([key, val]) => (
            <DetailRow
              key={key}
              label={key}
              value={typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val ?? '—')}
            />
          ))}
        </div>
      )}

      {showDrawer && (
        <ProfileDrawer
          platform={snapshotPlatform}
          username={result.username}
          onClose={() => setShowDrawer(false)}
        />
      )}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-[10px]">
      <span className="text-white/25 uppercase tracking-wider shrink-0">{label}</span>
      <span className="text-white/50 font-mono text-right break-all">{value}</span>
    </div>
  )
}
