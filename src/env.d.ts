/**
 * Bindings do Worker.
 *
 * O Worker em si não roda a aplicação: ele só repassa a requisição para o
 * container, que é quem executa o Next.js. Ver src/worker.ts.
 */
interface Env {
  SHANDON_CONTAINER: DurableObjectNamespace;

  // Segurança
  SHANDON_API_KEY?: string;
  JWT_SECRET?: string;
  ALLOWED_ORIGIN?: string;
  RATE_LIMIT_WINDOW_MS?: string;
  RATE_LIMIT_MAX_REQUESTS?: string;
  NEXT_PUBLIC_BASE_URL?: string;
  SHANDON_ACTIVATION_KEY?: string;

  // Painel administrativo
  SHANDON_ADMIN_KEY?: string;
  SHANDON_ADMIN_EMAILS?: string;

  // Instagram (Central Amorim / Apify)
  CENTRAL_API_BASE?: string;
  NEXT_PUBLIC_SHANDON_API_BASE?: string;

  // Proxy
  HTTP_PROXY?: string;
  HTTPS_PROXY?: string;
  ALL_PROXY?: string;
  SHANDON_PROXY_URL?: string;

  // Chaves de OSINT (todas opcionais — melhoram o resultado)
  HIBP_API_KEY?: string;
  SHODAN_API_KEY?: string;
  CENSYS_API_ID?: string;
  CENSYS_API_SECRET?: string;
  FB_ACCESS_TOKEN?: string;
  PASTEBIN_API_KEY?: string;
  RAPIDAPI_WHATSAPP_KEY?: string;
  RAPIDAPI_WHATSAPP_HOST?: string;

  // Pagamentos
  MERCADO_PAGO_ACCESS_TOKEN?: string;
}
