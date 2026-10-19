import type { MaigretResult, SearchResult, SearchModule } from './types.ts'

const MAIGRET_CATEGORIES: Record<string, SearchModule[]> = {
  todos: ['instagram', 'facebook', 'telefone', 'email', 'tiktok', 'pinterest', 'twitter', 'kwai', 'linkedin', 'imagem', 'dominios', 'vazamentos', 'documentos'],
  instagram: ['instagram'],
  facebook: ['facebook'],
  telefone: ['telefone'],
  email: ['email'],
  tiktok: ['tiktok'],
  pinterest: ['pinterest'],
  twitter: ['twitter'],
  kwai: ['kwai'],
  linkedin: ['linkedin'],
  imagem: ['imagem'],
  dominios: ['dominios'],
  vazamentos: ['vazamentos'],
  documentos: ['documentos'],
  planos: ['planos'],
}

export async function checkMaigretAvailable(): Promise<boolean> {
  try {
    const { execSync } = await import('child_process')
    execSync('python3 -c "import maigret"', { stdio: 'ignore', timeout: 10000 })
    return true
  } catch {
    return false
  }
}

export async function runMaigret(username: string, modules: SearchModule[] = ['todos']): Promise<MaigretResult[]> {
  const { execSync } = await import('child_process')
  const { writeFileSync, mkdtempSync, rmSync, readdirSync, readFileSync } = await import('fs')
  const { join } = await import('path')
  const { tmpdir } = await import('os')

  const tempDir = mkdtempSync(join(tmpdir(), 'maigret-'))

  try {
    const moduleFlags = modules.flatMap(m => MAIGRET_CATEGORIES[m] || [m]).join(',')
    
    const command = `maigret "${username}" -J simple --folderoutput "${tempDir}" --timeout 30 --no-color --no-progressbar --dns-resolver threaded ${moduleFlags !== 'todos' ? `--site ${moduleFlags.replace(/,/g, ' --site ')}` : ''}`

    execSync(command, { 
      stdio: 'pipe', 
      timeout: 120000,
      maxBuffer: 1024 * 1024 * 10 
    })

    const files = readdirSync(tempDir).filter(f => f.endsWith('.json') && f.includes('simple'))
    if (files.length === 0) {
      const allFiles = readdirSync(tempDir).filter(f => f.endsWith('.json'))
      if (allFiles.length === 0) {
        return []
      }
      const report = JSON.parse(readFileSync(join(tempDir, allFiles[0]), 'utf-8'))
      return parseMaigretReport(report, username)
    }

    const report = JSON.parse(readFileSync(join(tempDir, files[0]), 'utf-8'))
    
    return parseMaigretReport(report, username)
  } catch (error) {
    console.error('Maigret error:', error)
    throw error
  } finally {
    try {
      rmSync(tempDir, { recursive: true, force: true })
    } catch {}
  }
}

function parseMaigretReport(report: Record<string, unknown>, username: string): MaigretResult[] {
  const results: MaigretResult[] = []
  
  for (const [site, data] of Object.entries(report)) {
    if (typeof data === 'object' && data !== null) {
      const d = data as Record<string, unknown>
      const statusObj = d.status as Record<string, unknown> | undefined
      const status = (statusObj?.status as string) || (d.status as string) || 'unknown'
      const exists = status.toLowerCase() === 'claimed' || status.toLowerCase() === 'found'
      results.push({
        site,
        url: (d.url_user as string) || (d.url_probe as string) || (statusObj?.url as string) || '',
        exists,
        status,
        http_status: (d.http_status as number) || 0,
        response_time: (d.response_time as number) || 0,
      })
    }
  }

  return results
}

export function maigretResultToSearchResult(maigretResult: MaigretResult, username: string): SearchResult {
  const platformName = formatPlatformName(maigretResult.site)
  
  return {
    id: `maigret-${maigretResult.site}`,
    platform: platformName,
    username,
    displayName: maigretResult.exists ? `@${username}` : 'Não encontrado',
    score: maigretResult.exists ? 95 : 5,
    bio: maigretResult.exists ? `Perfil encontrado em ${platformName}` : `Nenhum perfil encontrado em ${platformName}`,
    url: maigretResult.url || `https://${maigretResult.site}.com/${username}`,
    exists: maigretResult.exists,
    status: maigretResult.status,
    httpStatus: maigretResult.http_status,
    source: 'maigret',
    timestamp: Date.now(),
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
    steam: 'Steam',
    spotify: 'Spotify',
    telegram: 'Telegram',
    whatsapp: 'WhatsApp',
    snapchat: 'Snapchat',
    vk: 'VK',
    ok: 'Odnoklassniki',
    medium: 'Medium',
    devto: 'Dev.to',
    behance: 'Behance',
    dribbble: 'Dribbble',
    producthunt: 'Product Hunt',
    hackernews: 'Hacker News',
    stackoverflow: 'Stack Overflow',
    gitlab: 'GitLab',
    bitbucket: 'Bitbucket',
    codepen: 'CodePen',
    replit: 'Replit',
    codesandbox: 'CodeSandbox',
    glitch: 'Glitch',
    heroku: 'Heroku',
    netlify: 'Netlify',
    vercel: 'Vercel',
    firebase: 'Firebase',
    aws: 'AWS',
    gcp: 'Google Cloud',
    azure: 'Azure',
    digitalocean: 'DigitalOcean',
    linode: 'Linode',
    vultr: 'Vultr',
  }

  return nameMap[site.toLowerCase()] || site.charAt(0).toUpperCase() + site.slice(1)
}