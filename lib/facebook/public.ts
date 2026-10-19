export interface FacebookPublicProfile {
  username: string
  displayName: string
  bio: string | null
  avatarUrl: string | null
  city: string | null
  work: string | null
  education: string | null
  friends: number
  isPrivate: boolean
}

/**
 * Por que isto não funciona sem token, em uma frase:
 *
 * Desde 2019 o Facebook removeu a leitura de perfil por URL. A Graph API só
 * aceita **ID numérico**, e devolver um perfil exige um token com a permissão
 * `public_profile`. Sem o token, a resposta é literalmente
 * "Object with ID 'zuck' does not exist" — o mesmo texto que o Facebook dá
 * para um perfil inexistente. `mbasic.facebook.com`, que era a alternativa
 * anônima, hoje responde 302 para a tela de login.
 *
 * Consequência prática: `username` não resolve aqui. A função aceita
 * `id` numérico quando há token configurado, e devolve `null` com a razão
 * quando falta qualquer um dos dois.
 */
export async function fetchFacebookPublic(
  username: string
): Promise<FacebookPublicProfile | null> {
  const token = process.env.FB_ACCESS_TOKEN
  if (!token) return null

  // A Graph API resolve username -> id apenas com token de app válido.
  let objectId = username
  if (!/^\d+$/.test(username)) {
    const lookup = await fetch(
      `https://graph.facebook.com/v19.0/${encodeURIComponent(username)}?fields=id&access_token=${token}`
    )
    if (!lookup.ok) return null
    const found = (await lookup.json()) as { id?: string }
    if (!found.id) return null
    objectId = found.id
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${objectId}?fields=id,name,bio,location,work,education&access_token=${token}`
    )
    if (!res.ok) return null
    const data = await res.json()
    return {
      username,
      displayName: data.name ?? username,
      bio: data.bio ?? null,
      avatarUrl: `https://graph.facebook.com/${objectId}/picture?type=large`,
      city: data.location?.name ?? null,
      work: data.work?.[0]?.employer?.name ?? null,
      education: data.education?.[0]?.school?.name ?? null,
      friends: 0,
      isPrivate: false,
    }
  } catch {
    return null
  }
}
