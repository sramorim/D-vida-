'use client'

import { useMemo } from 'react'
import { SearchResult } from '@/lib/types'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle, AlertTriangle, Globe, Link2 } from 'lucide-react'

interface PresenceSummaryProps {
  results: SearchResult[]
  query: string
}

interface PlatformGroup {
  platform: string
  results: SearchResult[]
  foundCount: number
  totalCount: number
}

export function PresenceSummary({ results, query }: PresenceSummaryProps) {
  const stats = useMemo(() => {
    const found = results.filter((r) => r.exists === true).length
    const notFound = results.filter((r) => r.exists === false).length
    const rateLimited = results.filter((r) => r.status === 'rate_limited').length
    const errors = results.filter((r) => r.status === 'error').length
    const total = results.length

    const scoreSum = results.reduce((acc, r) => acc + (r.exists ? r.score : 0), 0)
    const avgScore = total > 0 ? Math.round(scoreSum / total) : 0

    const presenceScore = total > 0 ? Math.round((found / total) * 100) : 0

    const platformMap = new Map<string, SearchResult[]>()
    for (const r of results) {
      const existing = platformMap.get(r.platform) || []
      existing.push(r)
      platformMap.set(r.platform, existing)
    }

    const platforms: PlatformGroup[] = Array.from(platformMap.entries()).map(
      ([platform, res]) => ({
        platform,
        results: res,
        foundCount: res.filter((r) => r.exists).length,
        totalCount: res.length,
      })
    )

    return { found, notFound, rateLimited, errors, total, avgScore, presenceScore, platforms }
  }, [results])

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Globe size={14} className="text-neon/60" />
          <span className="text-[11px] font-black tracking-widest uppercase text-white/50">
            Resumo da Presença
          </span>
        </div>

        <div className="text-center mb-4">
          <div className="text-[48px] font-black text-neon leading-none">
            {stats.presenceScore}%
          </div>
          <div className="text-[10px] text-white/30 uppercase tracking-widest mt-1">
            Presença Online — {query}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={<CheckCircle2 size={12} className="text-neon" />}
            value={stats.found}
            label="Encontrados"
            color="neon"
          />
          <StatCard
            icon={<XCircle size={12} className="text-white/30" />}
            value={stats.notFound}
            label="Não encontrados"
            color="dim"
          />
          <StatCard
            icon={<AlertTriangle size={12} className="text-amber-400" />}
            value={stats.rateLimited}
            label="Rate limit"
            color="amber"
          />
          <StatCard
            icon={<Link2 size={12} className="text-blue-400" />}
            value={stats.total}
            label="Total verificados"
            color="blue"
          />
        </div>
      </div>

      {stats.platforms.length > 0 && (
        <div className="card">
          <div className="text-[11px] font-black tracking-widest uppercase text-white/50 mb-3">
            Por Plataforma
          </div>
          <div className="space-y-2">
            {stats.platforms.map((pg) => (
              <div
                key={pg.platform}
                className="flex items-center justify-between rounded-[10px] bg-white/[0.03] border border-white/[0.04] px-3 py-2"
              >
                <span className="text-[12px] text-white/60 font-medium">{pg.platform}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        pg.foundCount > 0 ? 'bg-neon/60' : 'bg-white/10'
                      )}
                      style={{
                        width: `${pg.totalCount > 0 ? (pg.foundCount / pg.totalCount) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-white/30 font-mono w-8 text-right">
                    {pg.foundCount}/{pg.totalCount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode
  value: number
  label: string
  color: 'neon' | 'dim' | 'amber' | 'blue'
}) {
  return (
    <div className="rounded-[12px] bg-white/[0.03] border border-white/[0.04] p-3 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <div className="text-[20px] font-black text-white/80">{value}</div>
      <div className="text-[9px] text-white/25 uppercase tracking-wider">{label}</div>
    </div>
  )
}
