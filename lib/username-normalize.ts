/**
 * Normalização de username.
 *
 * O campo de busca aceita "@sr__amorim", "sr__amorim", "  @sr__amorim  " e
 * "https://instagram.com/sr__amorim". Antes cada camada normalizava por conta
 * própria e de um jeito diferente (`replace('@','')` tira só a primeira
 * ocorrência, e não limpa espaço), então o mesmo texto chegava em formatos
 * diferentes dependendo do motor. Isso fazia o Instagram ser consultado com
 * "@sr__amorim" na URL em um caminho e "sr__amorim" em outro.
 *
 * Aqui a regra é uma só, aplicada antes de qualquer consulta.
 */

export const MIN_USERNAME_LENGTH = 2
export const MAX_USERNAME_LENGTH = 30

export interface NormalizedUsername {
  ok: boolean
  /** Username limpo, pronto para a consulta. Vazio quando ok === false. */
  username: string
  /** Motivo da recusa, com texto já pronto para o usuário. Vazio quando ok === true. */
  error: string
}

const URL_LIKE = /^(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|instagr\.am)\/+/i

export function normalizeUsername(raw: unknown): NormalizedUsername {
  if (typeof raw !== 'string') {
    return { ok: false, username: '', error: 'Informe um username.' }
  }

  let value = raw.trim()

  // Aceita colar o link do perfil inteiro.
  if (URL_LIKE.test(value)) {
    const parts = value.replace(URL_LIKE, '').split(/[/?#]/)
    value = parts[0] || ''
  }

  // Tira TODOS os "@" da frente, não só o primeiro. "  @sr__amorim " e
  // "@@sr__amorim" precisam dar o mesmo resultado que "sr__amorim".
  value = value.replace(/^@+/, '').trim()

  // Espaço no meio nunca é username válido.
  if (/\s/.test(value)) {
    return { ok: false, username: '', error: 'Username não pode conter espaços.' }
  }

  if (value.length < MIN_USERNAME_LENGTH) {
    return {
      ok: false,
      username: '',
      error: `Username muito curto (mínimo ${MIN_USERNAME_LENGTH} caracteres).`,
    }
  }

  if (value.length > MAX_USERNAME_LENGTH) {
    return { ok: false, username: '', error: 'Username longo demais.' }
  }

  // Instagram aceita letras, números, ponto e sublinhado. Qualquer outro
  // caractere faria a URL da consulta ser inválida e a resposta não poderia
  // ser distinguida de "perfil inexistente".
  if (!/^[A-Za-z0-9._]+$/.test(value)) {
    return {
      ok: false,
      username: '',
      error: 'Username inválido. Use apenas letras, números, ponto e sublinhado.',
    }
  }

  return { ok: true, username: value, error: '' }
}
