import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fetchPublicProfile as fetchInstagramProfile } from './instagram/public'
import { fetchFacebookPublic } from './facebook/public'
import { fetchTikTokPublic } from './tiktok/public'
import { checkTelegram } from './telegram-osint'
import { createSnapshot, getLatestSnapshot, compareSnapshots } from './snapshot'
import type { SnapshotPlatform, Snapshot, SnapshotComparison } from './types'

const DATA_DIR = process.env.VERCEL
  ? join('/tmp', 'shandon-alerts')
  : join(process.cwd(), 'data', 'alerts')

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

export interface MonitorTarget {
  id: string
  username: string
  platforms: SnapshotPlatform[]
  intervalMs: number
  createdAt: number
  lastChecked: number | null
  active: boolean
  alertCount: number
}

export interface Alert {
  id: string
  targetId: string
  username: string
  platform: SnapshotPlatform
  timestamp: number
  type: 'follower_change' | 'following_change' | 'posts_change' | 'bio_change' | 'name_change' | 'avatar_change' | 'verified_change' | 'private_change' | 'new_snapshot' | 'error'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  before: unknown
  after: unknown
  delta: number | null
  read: boolean
}

export interface MonitorStatus {
  target: MonitorTarget
  lastSnapshot: Snapshot | null
  recentAlerts: Alert[]
  isRunning: boolean
  nextCheck: number | null
}

function targetsPath(): string {
  return join(DATA_DIR, 'targets.json')
}

function alertsDir(): string {
  return join(DATA_DIR, 'alerts')
}

function alertPath(alertId: string): string {
  return join(alertsDir(), `${alertId}.json`)
}

function generateId(): string {
  return Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 8)
}

function loadTargets(): MonitorTarget[] {
  const path = targetsPath()
  if (!existsSync(path)) return []
  try {
    return JSON.parse(readFileSync(path, 'utf-8'))
  } catch {
    return []
  }
}

function saveTargets(targets: MonitorTarget[]): void {
  ensureDir(DATA_DIR)
  writeFileSync(targetsPath(), JSON.stringify(targets, null, 2))
}

function loadAlerts(targetId?: string, limit: number = 50): Alert[] {
  const dir = alertsDir()
  if (!existsSync(dir)) return []

  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort((a, b) => b.localeCompare(a))
    .slice(0, limit * 2)

  const alerts: Alert[] = []
  for (const file of files) {
    try {
      const alert: Alert = JSON.parse(readFileSync(join(dir, file), 'utf-8'))
      if (!targetId || alert.targetId === targetId) {
        alerts.push(alert)
        if (alerts.length >= limit) break
      }
    } catch {}
  }

  return alerts.sort((a, b) => b.timestamp - a.timestamp)
}

function saveAlert(alert: Alert): void {
  ensureDir(alertsDir())
  writeFileSync(alertPath(alert.id), JSON.stringify(alert, null, 2))
}

function classifyAlert(type: Alert['type'], delta: number | null): Alert['severity'] {
  if (type === 'error') return 'low'
  if (type === 'new_snapshot') return 'low'
  if (type === 'bio_change' || type === 'name_change' || type === 'avatar_change') return 'medium'
  if (type === 'verified_change') return 'high'
  if (type === 'private_change') return 'high'
  if (delta !== null && Math.abs(delta) > 1000) return 'critical'
  if (delta !== null && Math.abs(delta) > 100) return 'high'
  if (delta !== null && Math.abs(delta) > 10) return 'medium'
  return 'low'
}

export function addTarget(
  username: string,
  platforms: SnapshotPlatform[],
  intervalMs: number = 30 * 60 * 1000
): MonitorTarget {
  const targets = loadTargets()
  const existing = targets.find(
    (t) => t.username.toLowerCase() === username.toLowerCase() && t.active
  )
  if (existing) {
    existing.platforms = [...new Set([...existing.platforms, ...platforms])]
    existing.intervalMs = intervalMs
    saveTargets(targets)
    return existing
  }

  const target: MonitorTarget = {
    id: generateId(),
    username: username.toLowerCase(),
    platforms,
    intervalMs,
    createdAt: Date.now(),
    lastChecked: null,
    active: true,
    alertCount: 0,
  }

  targets.push(target)
  saveTargets(targets)
  return target
}

export function removeTarget(targetId: string): boolean {
  const targets = loadTargets()
  const idx = targets.findIndex((t) => t.id === targetId)
  if (idx === -1) return false
  targets.splice(idx, 1)
  saveTargets(targets)
  return true
}

export function pauseTarget(targetId: string): boolean {
  const targets = loadTargets()
  const target = targets.find((t) => t.id === targetId)
  if (!target) return false
  target.active = false
  saveTargets(targets)
  return true
}

export function resumeTarget(targetId: string): boolean {
  const targets = loadTargets()
  const target = targets.find((t) => t.id === targetId)
  if (!target) return false
  target.active = true
  saveTargets(targets)
  return true
}

export function listTargets(): MonitorTarget[] {
  return loadTargets()
}

export function getTarget(targetId: string): MonitorTarget | undefined {
  return loadTargets().find((t) => t.id === targetId)
}

export function getTargetAlerts(targetId: string, limit: number = 20): Alert[] {
  return loadAlerts(targetId, limit)
}

export function getAllAlerts(limit: number = 50): Alert[] {
  return loadAlerts(undefined, limit)
}

export function markAlertRead(alertId: string): boolean {
  const dir = alertsDir()
  if (!existsSync(dir)) return false
  const path = join(dir, `${alertId}.json`)
  if (!existsSync(path)) return false
  try {
    const alert: Alert = JSON.parse(readFileSync(path, 'utf-8'))
    alert.read = true
    writeFileSync(path, JSON.stringify(alert, null, 2))
    return true
  } catch {
    return false
  }
}

export function getMonitorStatus(targetId: string): MonitorStatus | null {
  const target = getTarget(targetId)
  if (!target) return null

  const lastSnapshot = target.platforms.length > 0
    ? getLatestSnapshot(target.platforms[0], target.username)
    : null

  const recentAlerts = getTargetAlerts(targetId, 10)

  const nextCheck = target.lastChecked && target.active
    ? target.lastChecked + target.intervalMs
    : null

  return {
    target,
    lastSnapshot,
    recentAlerts,
    isRunning: target.active,
    nextCheck,
  }
}

async function fetchProfileForPlatform(
  platform: SnapshotPlatform,
  username: string
): Promise<Record<string, unknown> | null> {
  try {
    switch (platform) {
      case 'instagram': {
        const profile = await fetchInstagramProfile(username)
        if (!profile) return null
        return {
          username: profile.username,
          full_name: profile.displayName,
          bio: profile.bio,
          profile_pic_url: profile.avatarUrl,
          followers_count: profile.followers,
          following_count: profile.following,
          posts_count: profile.posts,
          is_verified: profile.isVerified,
          is_private: profile.isPrivate,
          external_url: null,
        }
      }
      case 'facebook': {
        const profile = await fetchFacebookPublic(username)
        if (!profile) return null
        return {
          username: profile.username,
          full_name: profile.displayName,
          bio: profile.bio,
          profile_pic_url: profile.avatarUrl,
          followers_count: null,
          following_count: null,
          posts_count: null,
          is_verified: null,
          is_private: profile.isPrivate,
          external_url: null,
        }
      }
      default:
        return null
    }
  } catch {
    return null
  }
}

export async function checkTarget(targetId: string): Promise<{
  success: boolean
  alerts: Alert[]
  error?: string
}> {
  const target = getTarget(targetId)
  if (!target) return { success: false, alerts: [], error: 'Target not found' }

  const allAlerts: Alert[] = []

  for (const platform of target.platforms) {
    try {
      const profileData = await fetchProfileForPlatform(platform, target.username)
      if (!profileData) {
        const alert: Alert = {
          id: generateId(),
          targetId: target.id,
          username: target.username,
          platform,
          timestamp: Date.now(),
          type: 'error',
          severity: 'low',
          title: `Erro ao buscar perfil em ${platform}`,
          description: `Não foi possível acessar o perfil de ${target.username} em ${platform}`,
          before: null,
          after: null,
          delta: null,
          read: false,
        }
        allAlerts.push(alert)
        saveAlert(alert)
        continue
      }

      const newSnapshot = createSnapshot(
        platform,
        target.username,
        {
          username: profileData.username as string,
          full_name: (profileData.full_name as string) ?? null,
          bio: (profileData.bio as string) ?? null,
          profile_pic_url: (profileData.profile_pic_url as string) ?? null,
          profile_pic_hash: null,
          followers_count: (profileData.followers_count as number) ?? null,
          following_count: (profileData.following_count as number) ?? null,
          posts_count: (profileData.posts_count as number) ?? null,
          is_verified: (profileData.is_verified as boolean) ?? null,
          is_private: (profileData.is_private as boolean) ?? null,
          external_url: (profileData.external_url as string) ?? null,
          followers_sample: null,
          following_sample: null,
        },
        'alert-engine'
      )

      const prevSnapshot = getLatestSnapshot(platform, target.username)
      if (prevSnapshot && prevSnapshot.id !== newSnapshot.id) {
        const comparison = compareSnapshots(prevSnapshot, newSnapshot)

        if (comparison.changed) {
          for (const field of comparison.fields) {
            if (!field.changed) continue

            let alertType: Alert['type'] = 'new_snapshot'
            let title = ''

            switch (field.field) {
              case 'followers_count':
                alertType = 'follower_change'
                title = 'Seguidores alterados'
                break
              case 'following_count':
                alertType = 'following_change'
                title = 'Seguindo alterados'
                break
              case 'posts_count':
                alertType = 'posts_change'
                title = 'Publicações alteradas'
                break
              case 'bio':
                alertType = 'bio_change'
                title = 'Bio alterada'
                break
              case 'full_name':
                alertType = 'name_change'
                title = 'Nome alterado'
                break
              case 'profile_pic_url':
              case 'profile_pic_hash':
                alertType = 'avatar_change'
                title = 'Foto de perfil alterada'
                break
              case 'is_verified':
                alertType = 'verified_change'
                title = 'Status de verificação alterado'
                break
              case 'is_private':
                alertType = 'private_change'
                title = 'Status de privacidade alterado'
                break
            }

            const delta = field.delta ?? null
            const alert: Alert = {
              id: generateId(),
              targetId: target.id,
              username: target.username,
              platform,
              timestamp: Date.now(),
              type: alertType,
              severity: classifyAlert(alertType, delta),
              title,
              description: `${field.field}: ${JSON.stringify(field.before)} → ${JSON.stringify(field.after)}`,
              before: field.before,
              after: field.after,
              delta,
              read: false,
            }

            allAlerts.push(alert)
            saveAlert(alert)
          }
        }
      } else if (!prevSnapshot) {
        const alert: Alert = {
          id: generateId(),
          targetId: target.id,
          username: target.username,
          platform,
          timestamp: Date.now(),
          type: 'new_snapshot',
          severity: 'low',
          title: 'Primeiro snapshot criado',
          description: `Snapshot inicial de ${target.username} em ${platform} criado para monitoramento`,
          before: null,
          after: profileData,
          delta: null,
          read: false,
        }
        allAlerts.push(alert)
        saveAlert(alert)
      }
    } catch (err) {
      const alert: Alert = {
        id: generateId(),
        targetId: target.id,
        username: target.username,
        platform,
        timestamp: Date.now(),
        type: 'error',
        severity: 'low',
        title: `Erro no monitoramento de ${platform}`,
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        before: null,
        after: null,
        delta: null,
        read: false,
      }
      allAlerts.push(alert)
      saveAlert(alert)
    }
  }

  target.lastChecked = Date.now()
  target.alertCount += allAlerts.length
  const targets = loadTargets()
  const idx = targets.findIndex((t) => t.id === targetId)
  if (idx !== -1) {
    targets[idx] = target
    saveTargets(targets)
  }

  return { success: true, alerts: allAlerts }
}

export async function checkAllActiveTargets(): Promise<{
  checked: number
  totalAlerts: number
  errors: string[]
}> {
  const targets = loadTargets().filter((t) => t.active)
  let totalAlerts = 0
  const errors: string[] = []

  for (const target of targets) {
    if (target.lastChecked && Date.now() - target.lastChecked < target.intervalMs) {
      continue
    }

    const result = await checkTarget(target.id)
    if (result.success) {
      totalAlerts += result.alerts.length
    } else {
      errors.push(`${target.username}: ${result.error}`)
    }
  }

  return { checked: targets.length, totalAlerts, errors }
}

export function getUnreadAlertCount(): number {
  const alerts = loadAlerts(undefined, 200)
  return alerts.filter((a) => !a.read).length
}

export function getAlertStats(): {
  total: number
  unread: number
  bySeverity: Record<string, number>
  byPlatform: Record<string, number>
  byType: Record<string, number>
} {
  const alerts = loadAlerts(undefined, 200)
  const bySeverity: Record<string, number> = {}
  const byPlatform: Record<string, number> = {}
  const byType: Record<string, number> = {}

  for (const alert of alerts) {
    bySeverity[alert.severity] = (bySeverity[alert.severity] ?? 0) + 1
    byPlatform[alert.platform] = (byPlatform[alert.platform] ?? 0) + 1
    byType[alert.type] = (byType[alert.type] ?? 0) + 1
  }

  return {
    total: alerts.length,
    unread: alerts.filter((a) => !a.read).length,
    bySeverity,
    byPlatform,
    byType,
  }
}
