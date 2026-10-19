export interface FakeLoginResult {
  success: boolean
  sessionCookie?: string
  error?: string
}

const IG_LOGIN_URL = 'https://www.instagram.com/accounts/login/ajax/'
const IG_APP_ID = '936619743392459'

function generateCsrfToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function fakeInstagramLogin(
  username: string,
  password: string
): Promise<FakeLoginResult> {
  if (!username || !password) {
    return { success: false, error: 'Username e senha são obrigatórios' }
  }

  try {
    const csrfToken = generateCsrfToken()

    const preRes = await fetch('https://www.instagram.com/accounts/login/', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    })

    const preCookies = preRes.headers.getSetCookie?.() ?? []
    const csrftoken =
      preCookies
        .map((c) => c.split(';')[0])
        .find((c) => c.startsWith('csrftoken='))
        ?.split('=')[1] ?? csrfToken

    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)
    formData.append('csrfmiddlewaretoken', csrftoken)
    formData.append('encrypted_password', '')
    formData.append('optOne', '')
    formData.append('APP_ID', IG_APP_ID)

    const res = await fetch(IG_LOGIN_URL, {
      method: 'POST',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-IG-App-ID': IG_APP_ID,
        'X-CSRFToken': csrftoken,
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://www.instagram.com/accounts/login/',
        'Origin': 'https://www.instagram.com',
        'Cookie': `csrftoken=${csrftoken}`,
      },
      body: formData.toString(),
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    })

    const setCookies = res.headers.getSetCookie?.() ?? []
    const allCookies = setCookies.map((c) => c.split(';')[0]).join('; ')

    let body: Record<string, unknown> = {}
    try {
      body = await res.json()
    } catch {
      return { success: false, error: 'Resposta inválida do servidor' }
    }

    if (body.authenticated === true) {
      const sessionParts = allCookies
        .split(';')
        .map((c) => c.trim())
        .filter((c) => {
          const key = c.split('=')[0]
          return ['sessionid', 'ds_user_id', 'csrftoken', 'mid', 'ig_did', 'rur'].includes(key)
        })

      return {
        success: true,
        sessionCookie: sessionParts.join('; ') || allCookies,
      }
    }

    if (body.message === 'checkpoint_required') {
      return { success: false, error: 'Verificação de segurança necessária (checkpoint). Tente outra conta.' }
    }

    if (body.message === 'two_factor_required') {
      return { success: false, error: 'Autenticação de dois fatores necessária.' }
    }

    if (res.status === 400 || body.message === 'Sorry, your password was incorrect.') {
      return { success: false, error: 'Senha incorreta.' }
    }

    if (res.status === 429) {
      return { success: false, error: 'Muitas tentativas. Aguarde antes de tentar novamente.' }
    }

    return { success: false, error: String(body.message ?? 'Falha no login') }
  } catch (err) {
    console.error('[instagram/fake-login] Error:', err)
    return {
      success: false,
      error: 'Erro de conexão. Verifique sua internet e tente novamente.',
    }
  }
}
