import type { HoleheResult, SearchResult } from './types.ts'
import { maskEmail } from './redact.ts'

export async function checkHoleheAvailable(): Promise<boolean> {
  try {
    const { execSync } = await import('child_process')
    execSync('python3 -c "import holehe"', { stdio: 'ignore', timeout: 10000 })
    return true
  } catch {
    return false
  }
}

export async function runHolehe(email: string): Promise<HoleheResult[]> {
  const { execSync } = await import('child_process')

  try {
    const command = `holehe "${email}" --only-used --no-color`

    const output = execSync(command, { 
      stdio: 'pipe', 
      timeout: 120000,
      maxBuffer: 1024 * 1024 * 10 
    })

    const stdout = output.toString()
    
    return parseHoleheOutput(stdout)
  } catch (error) {
    console.error('Holehe error:', error)
    throw error
  }
}

function parseHoleheOutput(output: string): HoleheResult[] {
  const results: HoleheResult[] = []
  
  try {
    const lines = output.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('[+]')) {
        const site = trimmed.replace('[+]', '').trim()
        if (site) {
          results.push({
            email: '',
            site,
            exists: true,
            rate_limit: false,
          })
        }
      } else if (trimmed.startsWith('[-]')) {
        const site = trimmed.replace('[-]', '').trim()
        if (site) {
          results.push({
            email: '',
            site,
            exists: false,
            rate_limit: false,
          })
        }
      }
    }
  } catch (e) {
    console.error('Error parsing holehe output:', e)
  }

  return results
}

export function holeheResultToSearchResult(holeheResult: HoleheResult): SearchResult {
  const platformName = formatPlatformName(holeheResult.site)
  
  return {
    id: `holehe-${holeheResult.site}`,
    platform: platformName,
    // E-mail completo é dado pessoal do titular. O resultado mostra se o
    // e-mail EXISTE na plataforma sem entregar o endereço inteiro de novo —
    // quem fez a busca já o digitou.
    username: maskEmail(holeheResult.email),
    displayName: holeheResult.exists ? 'E-mail encontrado' : 'E-mail não encontrado',
    score: holeheResult.exists ? 90 : 10,
    bio: holeheResult.exists 
      ? `E-mail cadastrado em ${platformName}` 
      : holeheResult.rate_limit 
        ? `Rate limit em ${platformName} - resultado inconclusivo`
        : `E-mail não cadastrado em ${platformName}`,
    url: `https://${holeheResult.site.toLowerCase().replace(/\s+/g, '')}.com`,
    exists: holeheResult.exists,
    status: holeheResult.rate_limit ? 'rate_limited' : (holeheResult.exists ? 'found' : 'not_found'),
    source: 'holehe',
    timestamp: Date.now(),
    extra: {
      rateLimit: holeheResult.rate_limit,
    },
  }
}

function formatPlatformName(site: string): string {
  const nameMap: Record<string, string> = {
    instagram: 'Instagram',
    facebook: 'Facebook',
    twitter: 'Twitter/X',
    tiktok: 'TikTok',
    linkedin: 'LinkedIn',
    pinterest: 'Pinterest',
    github: 'GitHub',
    youtube: 'YouTube',
    reddit: 'Reddit',
    twitch: 'Twitch',
    spotify: 'Spotify',
    telegram: 'Telegram',
    whatsapp: 'WhatsApp',
    snapchat: 'Snapchat',
    vk: 'VK',
    medium: 'Medium',
    slack: 'Slack',
    discord: 'Discord',
    protonmail: 'ProtonMail',
    gmail: 'Gmail',
    outlook: 'Outlook',
    yahoo: 'Yahoo',
    icloud: 'iCloud',
  }

  return nameMap[site.toLowerCase()] || site.charAt(0).toUpperCase() + site.slice(1)
}