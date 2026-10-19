/**
 * Mascaramento de dados pessoais em respostas da API.
 *
 * Motivo: sem uma chave de API configurada, `validateApiKey` abre a porta e as
 * ferramentas de telefone/e-mail devolvem o dado inteiro para qualquer pessoa
 * que chame a URL. Isto transforma o produto em uma ferramenta de doxing
 * pronta para uso — além de risco legal (LGPD), é o motivo clássico de a Meta
 * bloquear a conta e derrubar o domínio.
 *
 * A regra é simples: dados pessoais de TERCEIROS (número de telefone, e-mail,
 * fotos e status) saem mascarados. Quem tem a chave/assinatura vê o dado
 * completo.
 */

export function maskPhone(phone: string): string {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.length < 7) return String(phone ?? '')
  const countryAndDDD = digits.slice(0, 4)
  const lastFour = digits.slice(-4)
  return `${countryAndDDD} ****${lastFour}`
}

export function maskEmail(email: string): string {
  const value = String(email || '')
  const at = value.indexOf('@')
  if (at <= 1) {
    return value ? `${value.slice(0, 1)}***` : ''
  }
  const name = value.slice(0, at)
  const domain = value.slice(at)
  const visible = name.slice(0, 2)
  return `${visible}***${domain}`
}

export function maskInstagramUsername(username: string): string {
  const value = String(username || '')
  if (value.length <= 4) return value
  return `${value.slice(0, 2)}***`
}

/**
 * Aplica máscara a um objeto OpenGraph/Instagram de perfil: avatar fica público
 * (é foto de capa, já pública), mas bio com e-mail/telefone/cidade é truncada.
 */
export function maskProfileBio(bio: string | null, max = 120): string | null {
  if (!bio) return bio
  return bio.length > max ? `${bio.slice(0, max)}…` : bio
}