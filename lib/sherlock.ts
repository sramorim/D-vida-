import { execSync } from 'child_process'
import { mkdirSync, existsSync, readFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

export interface SherlockResult {
  id: string
  platform: string
  username: string
  displayName: string
  score: number
  url: string
  exists: boolean
  httpStatus: number
  status: 'found' | 'not_found' | 'error'
  source: string
  timestamp: number
  extra?: {
    responseTime?: number
    siteUrl?: string
  }
}

/**
 * O Sherlock é um CLI Python. Sem o binário instalado, `execSync` levanta e a
 * função devolvia `[]` — silenciosamente, como se a busca tivesse rodado sem
 * achar nada. Verificar antes evita gastar um timeout de 60s numa chamada que
 * não tinha chance de funcionar, e evita reportar o motor como ativo quando
 * está inerte.
 */
export async function checkSherlockAvailable(): Promise<boolean> {
  try {
    execSync('sherlock --version', { stdio: 'ignore', timeout: 10000 })
    return true
  } catch {
    return false
  }
}

export async function runSherlock(username: string): Promise<SherlockResult[]> {
  const results: SherlockResult[] = []
  const startTime = Date.now()
  
  try {
    // Create temp directory for sherlock output
    const tempDir = join(tmpdir(), `sherlock-${Date.now()}`)
    mkdirSync(tempDir, { recursive: true })
    
    // Run sherlock
    const command = `sherlock "${username}" --output "${tempDir}/results.json" --json --timeout 10 --print-found 2>/dev/null || true`
    
    try {
      execSync(command, { 
        timeout: 60000,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      })
    } catch (e) {
      // Sherlock exits with code 1 when some sites are not found, this is normal
    }
    
    // Parse results
    const resultsFile = join(tempDir, 'results.json')
    if (existsSync(resultsFile)) {
      try {
        const rawData = readFileSync(resultsFile, 'utf-8')
        const data = JSON.parse(rawData)
        
        if (data && typeof data === 'object') {
          for (const [site, info] of Object.entries(data)) {
            if (typeof info === 'object' && info !== null) {
              const infoTyped = info as { url: string; status: string }
              results.push({
                id: `sherlock-${site.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${username}`,
                platform: site,
                username,
                displayName: site,
                score: infoTyped.status === 'Claimed' ? 100 : 0,
                url: infoTyped.url || '',
                exists: infoTyped.status === 'Claimed',
                httpStatus: infoTyped.status === 'Claimed' ? 200 : 404,
                status: infoTyped.status === 'Claimed' ? 'found' : 'not_found',
                source: 'sherlock',
                timestamp: Date.now(),
                extra: {
                  siteUrl: infoTyped.url,
                  responseTime: Date.now() - startTime
                }
              })
            }
          }
        }
      } catch (e) {
        console.error('Failed to parse sherlock results:', e)
      }
      
      // Cleanup
      try {
        unlinkSync(resultsFile)
      } catch (e) {}
    }
    
    // Cleanup temp directory
    try {
      const { rmdirSync } = require('fs')
      rmdirSync(tempDir, { recursive: true } as any)
    } catch (e) {}
    
  } catch (error) {
    console.error('Sherlock execution failed:', error)
  }
  
  return results
}
