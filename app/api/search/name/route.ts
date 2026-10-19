import { NextRequest, NextResponse } from 'next/server'
import { gerarCandidatesDeUsername, descreverOrigem, type UsernameCandidate } from '@/lib/name-to-usernames'
import { runHttpCheck } from '@/lib/http-checker'
import { fetchAllSocialProfiles, profileToSearchResult } from '@/lib/social-providers'
import { fetchInstagramFromCentral, outcomeToMessage } from '@/lib/instagram/central-source'
import { validateApiKey, extractApiKeyFromHeaders } from '@/lib/auth-core'
import { SearchResult, ApiResponse } from '@/lib/types'

/**
 * Busca por NOME COMPLETO.
 *
 * "Maria da Silva" não é um username, e treatá-la como um produzia 404 em
 * toda plataforma — a tela mostrava "não encontrado" e o operador concluía
 * que a pessoa não tinha perfis. Aqui o nome é decomposto nos usernames mais
 * prováveis e cada um é medido de verdade.
 *
 * O que a rota NÃO faz: afirmar que o perfil é da mesma pessoa. O nome não
 * prova identidade. Por isso cada resultado volta com o username testado e a
 * regra usada, e a tela manda o operador confirmar no link.
 */

/** Quantos candidatos medir por busca. Cada um custa ~26 requisições. */
const MAX_CANDIDATOS = 6

export const maxDuration = 60

interface CandidatoResultado {
  candidato: UsernameCandidate
  resultados: SearchResult[]
}

function classificarEntrada(entrada: unknown): UsernameCandidate[] {
  if (typeof entrada !== 'string') return []
  const lista = gerarCandidatesDeUsername(entrada)
  // Corta pela confiança: os últimos são palpite genérico demais ("jose") e
  // só adicionam ruído e tempo.
  return lista.filter((c) => c.confianca >= 55).slice(0, MAX_CANDIDATOS)
}

async function medir(username: string): Promise<SearchResult[]> {
  const todos: SearchResult[] = []

  const httpResults = await runHttpCheck(username)
  todos.push(...httpResults)

  try {
    const perfis = await fetchAllSocialProfiles(
      ['instagram', 'github', 'telegram', 'tiktok', 'reddit', 'facebook'],
      username,
      {},
      3
    )
    for (const perfil of perfis) {
      const sr = profileToSearchResult(perfil)
      const existente = todos.find(
        (r) => r.platform.toLowerCase() === perfil.platform.toLowerCase()
      )
      if (existente) {
        // Só sobe: um motor mais fraco nunca derruba o que um melhor achou.
        if (sr.exists) {
          existente.exists = true
          existente.status = 'found'
          existente.score = Math.max(existente.score || 0, sr.score)
          existente.displayName = sr.displayName
          existente.bio = sr.bio
          existente.avatar = sr.avatar
          existente.followers = sr.followers
          existente.following = sr.following
          existente.posts = sr.posts
          existente.url = sr.url
          // O `extra` precisa ser trocado, não mesclado. Sem isso o resultado
          // saía como found carregando o veredito antigo do http-checker —
          // "exists: true, status: found, verdict: unavailable" — que é
          // contraditório e leva o usuário a duvidar do resultado certo.
          existente.extra = {
            ...(sr.extra || {}),
            confirmadoPor: sr.source,
          }
        }
      } else {
        todos.push(sr as SearchResult)
      }
    }
  } catch {
    // Um motor cair não pode derrubar a busca inteira: o http-checker já
    // devolveu o essencial.
  }

  // Instagram: a Central Amorim (Apify) é a única fonte que não é bloqueada
  // por IP de datacenter. Sem ela, o Instagram viraria "não encontrado" —
  // exatamente o erro que este projeto já corrigiu uma vez.
  try {
    const outcome = await fetchInstagramFromCentral(username)
    const existente = todos.find((r) => r.platform.toLowerCase() === 'instagram')
    const patch = (p: Partial<SearchResult>): void => {
      if (existente) {
        Object.assign(existente, p)
      } else {
        todos.push({
          id: `nome-instagram-${username.toLowerCase()}`,
          platform: 'Instagram',
          username,
          displayName: `@${username}`,
          score: 0,
          url: `https://www.instagram.com/${username}/`,
          source: 'http-checker',
          timestamp: Date.now(),
          ...p,
        } as SearchResult)
      }
    }
    if (outcome.kind === 'ok' || outcome.kind === 'private') {
      const sr = profileToSearchResult(outcome.profile)
      patch({
        ...sr,
        exists: true,
        status: 'found',
        score: outcome.kind === 'private' ? 85 : 95,
        bio: outcomeToMessage(outcome),
        extra: { ...(sr.extra || {}), engine: 'central-apify' },
      } as Partial<SearchResult>)
    } else if (outcome.kind === 'not_found') {
      patch({
        exists: false,
        status: 'not_found',
        score: 0,
        bio: outcomeToMessage(outcome),
        extra: { engine: 'central-apify' },
      } as Partial<SearchResult>)
    } else {
      // Falha da fonte NÃO vira "não encontrado". Vira "não deu para saber".
      patch({
        exists: false,
        status: outcome.kind === 'not_configured' ? 'unavailable' : 'possible',
        score: outcome.kind === 'not_configured' ? 10 : 20,
        bio: outcomeToMessage(outcome),
        extra: { engine: 'central-apify', desfecho: outcome.kind },
      } as Partial<SearchResult>)
    }
  } catch {
    // Sem a Central, o http-checker ainda diz o que deu para saber.
  }

  return todos.sort((a, b) => {
    if (a.exists && !b.exists) return -1
    if (!a.exists && b.exists) return 1
    return (b.score || 0) - (a.score || 0)
  })
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const auth = validateApiKey(
      extractApiKeyFromHeaders(
        request.headers.get('authorization'),
        request.headers.get('x-api-key'),
        url.searchParams.get('key')
      ),
      process.env.SHANDON_API_KEY
    )
    if (!auth.authenticated) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: auth.error || 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = (await request.json()) as { name?: unknown; query?: unknown }
    const entrada = body.name ?? body.query
    const candidatos = classificarEntrada(entrada)

    if (candidatos.length === 0) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Informe um nome com pelo menos duas palavras, ou um username válido.',
      }, { status: 400 })
    }

    // Mede todos em paralelo. Cada um é independente, e o teto de 6 mantém o
    // tempo total perto do de uma busca por username só.
    const medidos: CandidatoResultado[] = await Promise.all(
      candidatos.map(async (candidato) => ({
        candidato,
        resultados: await medir(candidato.username),
      }))
    )

    // Agrupa por plataforma, mantendo o username que deu a melhor nota. Sem
    // isso a mesma plataforma aparece 6 vezes, uma por candidato.
    const porPlataforma = new Map<string, { melhor: SearchResult; username: string; confianca: number }>()
    for (const { candidato, resultados } of medidos) {
      for (const r of resultados) {
        if (!r.exists) continue
        const chave = r.platform.toLowerCase()
        const atual = porPlataforma.get(chave)
        if (!atual || (r.score || 0) > (atual.melhor.score || 0)) {
          porPlataforma.set(chave, {
            melhor: r,
            username: candidato.username,
            confianca: candidato.confianca,
          })
        }
      }
    }

    const encontrados = Array.from(porPlataforma.values())
      .sort((a, b) => {
        if (b.melhor.exists !== a.melhor.exists) return b.melhor.exists ? 1 : -1
        return (b.melhor.score || 0) - (a.melhor.score || 0)
      })
      .map(({ melhor, username, confianca }) => {
        const candidato = candidatos.find((c) => c.username === username)
        return {
          ...melhor,
          // Username real é o que o operador precisa ver: o palpite é a parte
          // mais importante do resultado.
          username,
          extra: {
            ...(melhor.extra || {}),
            derivadoDeNome: true,
            usernameTestado: username,
            regra: candidato ? descreverOrigem(candidato.origem) : '—',
            confiancaDoPalpite: confianca,
          },
        } as SearchResult
      })

    const testados = medidos.map(({ candidato, resultados }) => ({
      username: candidato.username,
      regra: descreverOrigem(candidato.origem),
      confianca: candidato.confianca,
      encontrados: resultados.filter((r) => r.exists).length,
      total: resultados.length,
    }))

    return NextResponse.json<ApiResponse<{
      resultados: SearchResult[]
      testados: typeof testados
      aviso: string
    }>>({
      success: true,
      data: {
        resultados: encontrados,
        testados,
        aviso: encontrados.length > 0
          ? 'O nome não prova identidade. Confira a foto, a bio e a localização de cada resultado antes de concluir que o perfil é da mesma pessoa.'
          : 'Nenhum perfil público foi encontrado para os usernames derivados deste nome. Se você já souber o username exato, use a busca por username.',
      },
    })
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Erro na busca por nome', details: mensagem },
      { status: 500 }
    )
  }
}
