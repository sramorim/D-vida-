/**
 * Classificação de resposta de plataforma.
 *
 * O problema que este arquivo resolve: Instagram, TikTok, Facebook, X e
 * Threads recusam requisição vinda de datacenter (Cloudflare). A resposta é
 * 403/429 ou a conexão morre. O código antigo fazia `exists = status === 200`,
 * então esse bloqueio virava "perfil não existe" — com nota 5, igual a um
 * perfil inexistente de verdade.
 *
 * Numa ferramenta de OSINT isso é o pior erro possível: leva a pessoa a
 * concluir "não há nada nesta pessoa" quando o perfil existe e é público.
 *
 * A regra é: só 404 (ou o corpo dizendo explicitamente que não existe) prova
 * ausência. Bloqueio é "não deu para saber", erro de servidor é "indisponível".
 */

export const BOT_PROTECTED_SITES = new Set([
  'Instagram',
  'TikTok',
  'Facebook',
  'X (Twitter)',
  'Threads',
  'LinkedIn',
  'Pinterest',
])

export type Verdict = 'found' | 'private' | 'possible' | 'not_found' | 'unavailable'

export interface ClassifyInput {
  site: string
  httpStatus: number
  /** Para sites com checagem por corpo: o corpo disse que NÃO existe. */
  bodySaysNotFound?: boolean
  /** A página tem conteúdo de perfil (nome, avatar, contadores). */
  contentLooksLikeProfile?: boolean
}

export interface ClassifyResult {
  verdict: Verdict
  /** O perfil existe? Só true para found/private — 'possible' não confirma. */
  exists: boolean
  score: number
  message: string
  /** Status para a UI. 'possible' = confirme no link. */
  uiStatus: 'found' | 'possible' | 'not_found' | 'unavailable'
}

const BLOCKING_STATUSES = new Set([401, 403, 429])

export function classifySite(input: ClassifyInput): ClassifyResult {
  const { site, httpStatus, bodySaysNotFound, contentLooksLikeProfile } = input

  // 0 = a conexão falhou ou deu timeout. Não é resposta do site.
  if (httpStatus === 0) {
    return result('unavailable', false, site,
      `Não foi possível consultar ${site} (tempo limite ou rede). Tente novamente.`)
  }

  if (BLOCKING_STATUSES.has(httpStatus)) {
    const motivo = httpStatus === 429
      ? `${site} limitou o número de consultas (rate limit).`
      : httpStatus === 401
        ? `${site} recusou a consulta (401).`
        : `${site} bloqueia consultas automáticas (403).`
    return result('possible', false, site,
      `${motivo} Não é possível confirmar por aqui — abra o link e verifique.`)
  }

  // 404 é a única resposta que prova que o perfil não existe.
  if (httpStatus === 404 || bodySaysNotFound === true) {
    return result('not_found', false, site, `Nenhum perfil encontrado em ${site}`)
  }

  // 5xx: o site está fora do ar, o que é diferente de perfil inexistente.
  if (httpStatus >= 500) {
    return result('unavailable', false, site,
      `${site} está fora do ar no momento (erro ${httpStatus}). Tente novamente mais tarde.`)
  }

  if (httpStatus === 200 || (httpStatus >= 200 && httpStatus < 400)) {
    if (contentLooksLikeProfile === false) {
      // Veio 200 mas sem nenhum dado de perfil: quase sempre a tela de login
      // ou o muro de bloqueio do Instagram. Não dá para afirmar que existe.
      return result('possible', false, site,
        `${site} respondeu sem os dados do perfil (provável bloqueio). Abra o link para verificar.`)
    }
    return result('found', true, site, `Perfil encontrado em ${site}`)
  }

  // Qualquer código inesperado: honestidade acima de adivinhação.
  return result('unavailable', false, site,
    `${site} respondeu de forma inesperada (HTTP ${httpStatus}).`)
}

function result(
  verdict: Verdict,
  exists: boolean,
  site: string,
  message: string
): ClassifyResult {
  const score = verdict === 'found' ? 90 : verdict === 'private' ? 85 : verdict === 'possible' ? 55 : verdict === 'unavailable' ? 10 : 0
  const uiStatus: ClassifyResult['uiStatus'] =
    verdict === 'found' || verdict === 'private' ? 'found'
      : verdict === 'possible' ? 'possible'
        : verdict === 'unavailable' ? 'unavailable'
          : 'not_found'
  return { verdict, exists, score, message, uiStatus }
}

/** Mensagem para quando o perfil existe mas é privado. */
export function privateMessage(site: string): string {
  return `Perfil encontrado em ${site}, mas é privado. Só aparecem os dados públicos.`
}
