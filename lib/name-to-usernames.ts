/**
 * Derivação de usernames a partir de um nome completo.
 *
 * O problema: a tela de "Localizar Pessoa" oferece o tipo de busca "Nome" com
 * o exemplo "Maria da Silva", mas o backend tratava o texto exatamente como
 * um username. "Maria da Silva" com espaço vira a URL
 * `https://instagram.com/Maria da Silva/`, que não é um perfil — o servidor
 * responde 404 e a tela mostra "não encontrado" em tudo. O usuário via um
 * "não existe em lugar nenhum" que era só o app procurando no endereço
 * errado.
 *
 * Nenhuma plataforma oferece busca pública por nome completo de forma
 * confiável. O que dá para fazer é derivar os usernames mais prováveis a
 * partir do nome e medir cada um. Isso é honesto: o app diz de onde veio o
 * palpite e o operador confirma no link.
 *
 * Tudo aqui é local e determinístico: a mesma entrada gera sempre a mesma
 * lista, na mesma ordem.
 */

export interface UsernameCandidate {
  username: string
  /** Como o palpite foi montado. Aparece na tela para o operador confiar ou não. */
  origem:
    | 'exato'
    | 'primeiro.sobrenome'
    | 'primeiroSobrenome'
    | 'sobrenome_primeiro'
    | 'primeiro.ultimo'
    | 'iniciaisSobrenome'
    | 'primeiro_sobrenome'
    | 'primeiro'
    | 'sobrenome'
  /** 0 a 100. Ordem de tentativa é por este valor, decrescente. */
  confianca: number
}

/** Palavras que fazem parte do nome mas não são o nome. */
const CONECTIVOS = new Set([
  'da', 'das', 'de', 'do', 'dos', 'das', 'e', 'em', 'no', 'na', 'nos', 'nas',
  'a', 'o', 'as', 'os', 'para', 'por', 'com',
])

/** Tira acento depois de decompor: "Gonçalves" vira "goncalves". */
const SEM_ACENTO = /[̀-ͯ]/g

function limpar(parte: string): string {
  return parte
    .normalize('NFD')
    .replace(SEM_ACENTO, '')
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, '')
}

function soAlfabetico(parte: string): string {
  return limpar(parte).replace(/[^a-z]/g, '')
}

/** Divide o nome em nomes próprios e sobrenomes, ignorando conectivos. */
function separar(nome: string): { prenomes: string[]; sobrenomes: string[] } {
  const partes = nome
    .trim()
    .split(/[\s.]+/)
    .map(soAlfabetico)
    .filter((p) => p.length >= 2)

  const prenomes: string[] = []
  const sobrenomes: string[] = []
  for (const p of partes) {
    if (CONECTIVOS.has(p)) continue
    prenomes.push(p)
  }
  return { prenomes, sobrenomes }
}

function push(
  acc: Map<string, UsernameCandidate>,
  username: string,
  origem: UsernameCandidate['origem'],
  confianca: number
): void {
  if (!username || username.length < 3 || username.length > 30) return
  if (!/^[a-z0-9._]+$/.test(username)) return
  // Username já visto com a MESMA confiança: mantém o primeiro (mais estável).
  const anterior = acc.get(username)
  if (anterior && anterior.confianca >= confianca) return
  acc.set(username, { username, origem, confianca })
}

/**
 * Gera os candidatos ordenados por confiança.
 *
 * Ordem de prioridade: o sobrenome é o identificador mais forte no
 * Instagram/Twitter; o prenome sozinho é o mais fraco e o mais genérico, por
 * isso entra por último com a menor nota.
 */
export function gerarCandidatesDeUsername(nomeCompleto: string): UsernameCandidate[] {
  const bruto = nomeCompleto.trim().replace(/^@+/, '')
  if (!bruto) return []

  // Já parece um username: não é preciso inventar variação nenhuma.
  if (!/\s/.test(bruto) && /^[A-Za-z0-9._]+$/.test(bruto)) {
    return [{ username: limpar(bruto), origem: 'exato', confianca: 100 }]
  }

  const { prenomes, sobrenomes } = separar(bruto)
  const acc = new Map<string, UsernameCandidate>()

  // Primeiro e último token significantes são o identificador mais forte: no
  // Instagram e no Twitter o sobrenome pesa mais que o prenome, e prenome
  // sozinho ("jose") é genérico demais para servir de palpite.
  //
  // Tokens do meio ficam de fora dos candidatos principais — em "José Antônio
  // Pereira dos Santos" o palpite certo usa "josesantos", não o nome do meio.
  const tokens = [...prenomes, ...sobrenomes]
  const primeiro = tokens[0] || ''
  const ultimo = sobrenomes.length > 0
    ? sobrenomes[sobrenomes.length - 1]
    : tokens.length > 1
      ? tokens[tokens.length - 1]
      : ''
  const segundo = tokens.length > 2 ? tokens[1] : ''

  if (primeiro && ultimo) {
    // A ordem mais comum no Instagram brasileiro: primeiro.sobrenome.
    push(acc, `${primeiro}.${ultimo}`, 'primeiro.ultimo', 88)
    push(acc, `${primeiro}${ultimo}`, 'primeiroSobrenome', 84)
    push(acc, `${ultimo}.${primeiro}`, 'sobrenome_primeiro', 80)
    push(acc, `${primeiro}_${ultimo}`, 'primeiro_sobrenome', 78)
    push(acc, `${ultimo}${primeiro}`, 'primeiroSobrenome', 72)
    push(acc, `${primeiro[0]}${ultimo}`, 'iniciaisSobrenome', 70)
    push(acc, `${primeiro[0]}_${ultimo}`, 'iniciaisSobrenome', 66)
    push(acc, `${ultimo[0]}${primeiro}`, 'iniciaisSobrenome', 58)
  }

  if (segundo && ultimo) {
    push(acc, `${segundo}.${ultimo}`, 'primeiro.ultimo', 62)
    push(acc, `${segundo}${ultimo}`, 'primeiroSobrenome', 58)
  }

  if (ultimo) push(acc, ultimo, 'sobrenome', 50)
  if (primeiro) push(acc, primeiro, 'primeiro', 40)

  return Array.from(acc.values()).sort((a, b) => {
    if (b.confianca !== a.confianca) return b.confianca - a.confianca
    return a.username.localeCompare(b.username)
  })
}

/** Rótulo curto para a tela explicar de onde saiu o palpite. */
export function descreverOrigem(origem: UsernameCandidate['origem']): string {
  const textos: Record<UsernameCandidate['origem'], string> = {
    exato: 'digitado como está',
    'primeiro.sobrenome': 'primeiro.sobrenome',
    primeiroSobrenome: 'primeiro + sobrenome',
    sobrenome_primeiro: 'sobrenome.primeiro',
    'primeiro.ultimo': 'primeiro.último',
    iniciaisSobrenome: 'inicial + sobrenome',
    primeiro_sobrenome: 'primeiro_sobrenome',
    primeiro: 'só o primeiro nome',
    sobrenome: 'só o sobrenome',
  }
  return textos[origem]
}
