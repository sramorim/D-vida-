import type { InstaloaderProfile, SearchResult } from './types.ts'
import { spawn } from 'child_process'
import path from 'path'

interface PythonResult<T> {
  success: boolean
  data?: T
  error?: string
}

function runPythonScript(scriptName: string, args: string[]): Promise<PythonResult<unknown>> {
  return new Promise((resolve) => {
    const scriptPath = path.join(process.cwd(), 'scripts', `${scriptName}.py`)
    const pythonProcess = spawn('python3', [scriptPath, ...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        resolve({ success: false, error: stderr || `Python script exited with code ${code}` })
        return
      }

      try {
        const data = JSON.parse(stdout)
        resolve({ success: true, data })
      } catch {
        resolve({ success: false, error: 'Invalid JSON output from Python script' })
      }
    })

    pythonProcess.on('error', (err) => {
      resolve({ success: false, error: `Failed to spawn Python process: ${err.message}` })
    })

    setTimeout(() => {
      pythonProcess.kill('SIGTERM')
      resolve({ success: false, error: 'Python script timeout' })
    }, 60000)
  })
}

export async function checkInstaloaderAvailable(): Promise<boolean> {
  const result = await runPythonScript('check_instaloader', [])
  return result.success
}

export async function getInstagramProfile(
  username: string,
  sessionId?: string
): Promise<InstaloaderProfile | null> {
  const args = ['--username', username]
  if (sessionId) {
    args.push('--session-id', sessionId)
  }

  const result = await runPythonScript('get_profile', args)

  if (!result.success) {
    if (result.error?.includes('ProfileNotExistsException') || result.error?.includes('404')) {
      return null
    }
    if (result.error?.includes('LoginRequiredException')) {
      throw new Error('Login necessário para acessar este perfil')
    }
    if (result.error?.includes('TwoFactorAuthRequiredException')) {
      throw new Error('Autenticação de dois fatores necessária')
    }
    throw new Error(result.error || 'Erro ao buscar perfil')
  }

  const data = result.data as Record<string, unknown>
  return {
    username: data.username as string,
    full_name: data.full_name as string,
    biography: data.biography as string,
    followers: data.followers as number,
    following: data.followees as number,
    posts: data.mediacount as number,
    is_private: data.is_private as boolean,
    is_verified: data.is_verified as boolean,
    profile_pic_url: data.profile_pic_url as string,
    external_url: (data.external_url as string) || '',
  }
}

export function instagramProfileToSearchResult(profile: InstaloaderProfile): SearchResult {
  return {
    id: `instagram-${profile.username}`,
    platform: 'Instagram',
    username: profile.username,
    displayName: profile.full_name || profile.username,
    score: profile.is_verified ? 100 : 95,
    bio: profile.biography || 'Sem bio',
    followers: formatNumber(profile.followers),
    following: formatNumber(profile.following),
    posts: formatNumber(profile.posts),
    location: '',
    avatar: profile.profile_pic_url,
    url: `https://instagram.com/${profile.username}`,
    exists: true,
    status: 'found',
    source: 'instaloader',
    timestamp: Date.now(),
    extra: {
      isPrivate: profile.is_private,
      isVerified: profile.is_verified,
      externalUrl: profile.external_url,
    },
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

export async function getInstagramFollowers(username: string, sessionId?: string): Promise<SearchResult[]> {
  const args = ['--username', username, '--limit', '100']
  if (sessionId) {
    args.push('--session-id', sessionId)
  }

  const result = await runPythonScript('get_followers', args)

  if (!result.success) {
    if (result.error?.includes('ProfileNotExistsException') || result.error?.includes('404')) {
      return []
    }
    if (result.error?.includes('LoginRequiredException')) {
      throw new Error('Login necessário para acessar seguidores')
    }
    throw new Error(result.error || 'Erro ao buscar seguidores')
  }

  const followersData = result.data as Array<Record<string, unknown>>
  return followersData.map((follower) => ({
    id: `ig-follower-${follower.username}`,
    platform: 'Instagram',
    username: follower.username as string,
    displayName: (follower.full_name as string) || follower.username as string,
    score: 80,
    bio: '',
    avatar: follower.profile_pic_url as string,
    url: `https://instagram.com/${follower.username}`,
    exists: true,
    status: 'follower',
    source: 'instaloader',
    timestamp: Date.now(),
  }))
}

export async function getInstagramFollowing(username: string, sessionId?: string): Promise<SearchResult[]> {
  const args = ['--username', username, '--limit', '100']
  if (sessionId) {
    args.push('--session-id', sessionId)
  }

  const result = await runPythonScript('get_following', args)

  if (!result.success) {
    if (result.error?.includes('ProfileNotExistsException') || result.error?.includes('404')) {
      return []
    }
    if (result.error?.includes('LoginRequiredException')) {
      throw new Error('Login necessário para acessar seguindo')
    }
    throw new Error(result.error || 'Erro ao buscar seguindo')
  }

  const followingData = result.data as Array<Record<string, unknown>>
  return followingData.map((followee) => ({
    id: `ig-following-${followee.username}`,
    platform: 'Instagram',
    username: followee.username as string,
    displayName: (followee.full_name as string) || followee.username as string,
    score: 80,
    bio: '',
    avatar: followee.profile_pic_url as string,
    url: `https://instagram.com/${followee.username}`,
    exists: true,
    status: 'following',
    source: 'instaloader',
    timestamp: Date.now(),
  }))
}