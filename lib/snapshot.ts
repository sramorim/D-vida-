import type { Snapshot, SnapshotPlatform, SnapshotComparison, SnapshotDiffField, FollowerDiff } from './types.ts'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const DATA_DIR = process.env.VERCEL
  ? join('/tmp', 'shandon-snapshots')
  : join(process.cwd(), 'data', 'snapshots')

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

function snapshotDir(platform: SnapshotPlatform, username: string): string {
  return join(DATA_DIR, platform, username.toLowerCase())
}

function snapshotPath(platform: SnapshotPlatform, username: string, id: string): string {
  return join(snapshotDir(platform, username), `${id}.json`)
}

export function generateSnapshotId(): string {
  return Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 8)
}

export function computeImageHash(url: string | null): string | null {
  if (!url) return null
  return createHash('sha256').update(url).digest('hex').substring(0, 16)
}

export function createSnapshot(
  platform: SnapshotPlatform,
  username: string,
  profile: Snapshot['profile'],
  provider: string,
  status: Snapshot['status'] = 'complete',
  error?: string
): Snapshot {
  const snapshot: Snapshot = {
    id: generateSnapshotId(),
    platform,
    username: username.toLowerCase(),
    timestamp: Date.now(),
    profile: {
      ...profile,
      profile_pic_hash: computeImageHash(profile.profile_pic_url),
    },
    provider,
    status,
  }

  if (error) {
    snapshot.error = error
  }

  const dir = snapshotDir(platform, username)
  ensureDir(dir)
  writeFileSync(snapshotPath(platform, username, snapshot.id), JSON.stringify(snapshot, null, 2))

  return snapshot
}

export function getSnapshots(
  platform: SnapshotPlatform,
  username: string
): Snapshot[] {
  const dir = snapshotDir(platform, username)
  if (!existsSync(dir)) return []

  const files = readdirSync(dir).filter((f) => f.endsWith('.json'))
  const snapshots: Snapshot[] = []

  for (const file of files) {
    try {
      const content = readFileSync(join(dir, file), 'utf-8')
      snapshots.push(JSON.parse(content))
    } catch {
      // Arquivo corrompido, ignorar
    }
  }

  return snapshots.sort((a, b) => b.timestamp - a.timestamp)
}

export function getLatestSnapshot(
  platform: SnapshotPlatform,
  username: string
): Snapshot | null {
  const snapshots = getSnapshots(platform, username)
  return snapshots.length > 0 ? snapshots[0] : null
}

export function getSnapshotById(
  platform: SnapshotPlatform,
  username: string,
  id: string
): Snapshot | null {
  const path = snapshotPath(platform, username, id)
  if (!existsSync(path)) return null
  try {
    const content = readFileSync(path, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

function diffField(field: string, before: unknown, after: unknown): SnapshotDiffField {
  const changed = JSON.stringify(before) !== JSON.stringify(after)
  let delta: number | null = null

  if (typeof before === 'number' && typeof after === 'number') {
    delta = after - before
  }

  return { field, before, after, changed, delta }
}

function diffFollowers(
  before: string[] | null,
  after: string[] | null
): FollowerDiff | null {
  if (!before || !after) return null

  const beforeSet = new Set(before.map((f) => f.toLowerCase()))
  const afterSet = new Set(after.map((f) => f.toLowerCase()))

  const new_observed = after.filter((f) => !beforeSet.has(f.toLowerCase()))
  const not_observed_in_current = before.filter((f) => !afterSet.has(f.toLowerCase()))

  return { new_observed, not_observed_in_current }
}

export function compareSnapshots(before: Snapshot, after: Snapshot): SnapshotComparison {
  const fields: SnapshotDiffField[] = [
    diffField('full_name', before.profile.full_name, after.profile.full_name),
    diffField('bio', before.profile.bio, after.profile.bio),
    diffField('profile_pic_url', before.profile.profile_pic_url, after.profile.profile_pic_url),
    diffField('profile_pic_hash', before.profile.profile_pic_hash, after.profile.profile_pic_hash),
    diffField('followers_count', before.profile.followers_count, after.profile.followers_count),
    diffField('following_count', before.profile.following_count, after.profile.following_count),
    diffField('posts_count', before.profile.posts_count, after.profile.posts_count),
    diffField('is_verified', before.profile.is_verified, after.profile.is_verified),
    diffField('is_private', before.profile.is_private, after.profile.is_private),
    diffField('external_url', before.profile.external_url, after.profile.external_url),
  ]

  const follower_diff = diffFollowers(
    before.profile.followers_sample,
    after.profile.followers_sample
  )

  const changed = fields.some((f) => f.changed)

  const summary: string[] = []

  const followersField = fields.find((f) => f.field === 'followers_count')
  if (followersField?.changed) {
    const fd = followersField.delta
    if (fd !== null && fd !== undefined && fd !== 0) {
      const direction = fd > 0 ? 'aumentou' : 'reduziu'
      summary.push(`Seguidores ${direction} de ${followersField.before} para ${followersField.after} (delta: ${fd > 0 ? '+' : ''}${fd})`)
    }
  }

  const followingField = fields.find((f) => f.field === 'following_count')
  if (followingField?.changed) {
    const fud = followingField.delta
    if (fud !== null && fud !== undefined && fud !== 0) {
      const direction = fud > 0 ? 'aumentou' : 'reduziu'
      summary.push(`Seguindo ${direction} de ${followingField.before} para ${followingField.after} (delta: ${fud > 0 ? '+' : ''}${fud})`)
    }
  }

  const postsField = fields.find((f) => f.field === 'posts_count')
  if (postsField?.changed) {
    const pd = postsField.delta
    if (pd !== null && pd !== undefined && pd !== 0) {
      summary.push(`Publicações alteradas de ${postsField.before} para ${postsField.after}`)
    }
  }

  const bioField = fields.find((f) => f.field === 'bio')
  if (bioField?.changed) {
    summary.push('Bio foi alterada')
  }

  const nameField = fields.find((f) => f.field === 'full_name')
  if (nameField?.changed) {
    summary.push(`Nome alterado de "${nameField.before}" para "${nameField.after}"`)
  }

  const picHashField = fields.find((f) => f.field === 'profile_pic_hash')
  const picUrlField = fields.find((f) => f.field === 'profile_pic_url')
  if (picHashField?.changed || picUrlField?.changed) {
    summary.push('Foto de perfil foi alterada')
  }

  const verifiedField = fields.find((f) => f.field === 'is_verified')
  if (verifiedField?.changed) {
    summary.push(`Verificação: ${verifiedField.before ? 'verificado' : 'não verificado'} → ${verifiedField.after ? 'verificado' : 'não verificado'}`)
  }

  if (follower_diff) {
    if (follower_diff.new_observed.length > 0) {
      summary.push(`${follower_diff.new_observed.length} novos perfis observados na amostra`)
    }
    if (follower_diff.not_observed_in_current.length > 0) {
      summary.push(`${follower_diff.not_observed_in_current.length} perfis não observados no snapshot atual`)
    }
  }

  if (summary.length === 0 && !changed) {
    summary.push('Nenhuma alteração detectada entre os snapshots')
  }

  return {
    snapshot_before: before,
    snapshot_after: after,
    changed,
    fields,
    follower_diff,
    summary,
  }
}

export function getTimeline(
  platform: SnapshotPlatform,
  username: string
): Snapshot[] {
  return getSnapshots(platform, username)
}
