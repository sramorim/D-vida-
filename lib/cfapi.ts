/**
 * Base do Worker da CENTRAL AMORIM (https://senhoramorim.com.br).
 *
 * Esse Worker é um serviço SEPARADO do Shandon Elite. Ele existe para duas
 * coisas, e só para elas:
 *
 *   1. Servir o Instagram via Apify (lib/instagram/central-source.ts). O
 *      Instagram bloqueia IP de datacenter, então a consulta é delegada.
 *   2. Servir de opção secundária para as ferramentas leves, quando o
 *      contêiner do Cloudflare pode dormir (ver lib/api-client.ts).
 *
 * NÃO é a base da API do próprio app. As ferramentas do Shandon chamam a
 * mesma origem — ver lib/api-client.ts. Usar a Central como base primária
 * fazia 10 das 12 ferramentas da tela de Investigação Anônima responderem
 * 404, porque as rotas não existem naquele Worker.
 *
 * NEXT_PUBLIC_SHANDON_API_BASE deixa de ser obrigatório: sem ele, a Central
 * é usada só no caminho do Instagram (server-side, via CENTRAL_API_BASE).
 */

/** Base da Central para uso no SERVIDOR (lib/instagram/central-source.ts). */
export const CENTRAL_API_BASE = (
  process.env.CENTRAL_API_BASE || 'https://senhoramorim.com.br'
).replace(/\/$/, '')

/**
 * Base alternativa para uso no NAVEGADOR, apenas se explicitamente
 * configurada. Vazio por padrão: aí o app usa a própria origem.
 */
export const PUBLIC_CENTRAL_API_BASE = (
  process.env.NEXT_PUBLIC_SHANDON_API_BASE || ''
).replace(/\/$/, '')
