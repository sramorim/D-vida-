import { Container, getContainer } from "@cloudflare/containers";

/**
 * Container que roda o Next.js.
 *
 * Detalhe que costuma morder: as variáveis de ambiente configuradas no painel
 * do Cloudflare chegam ao WORKER, mas não passam sozinhas para o container.
 * O container é outro processo — é ele que roda `node server.js` e é nele que
 * `process.env.SHANDON_ADMIN_KEY` é lido. Sem o repasse abaixo, configurar a
 * senha do admin no painel não tem efeito nenhum: o painel respondia 503
 * ("desativado") mesmo com a variável corretamente cadastrada.
 */
export class ShandonContainer extends Container<Env> {
  defaultPort = 3000;
  sleepAfter = "10m";

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    // Só repassa o que está definido. Mandar `undefined` como env var faria o
    // Node ver a variável como a string "undefined", que é pior do que não
    // existir: o `if (!process.env.SHANDON_ADMIN_KEY)` deixaria de passar.
    const defined = <T extends Record<string, string | undefined>>(obj: T) =>
      Object.fromEntries(
        Object.entries(obj).filter(([, v]) => v !== undefined && v !== ""),
      ) as { [K in keyof T]: string };

    this.envVars = {
      ...defined({
        // Segurança
        SHANDON_API_KEY: env.SHANDON_API_KEY,
        JWT_SECRET: env.JWT_SECRET,
        ALLOWED_ORIGIN: env.ALLOWED_ORIGIN,
        RATE_LIMIT_WINDOW_MS: env.RATE_LIMIT_WINDOW_MS,
        RATE_LIMIT_MAX_REQUESTS: env.RATE_LIMIT_MAX_REQUESTS,
        NEXT_PUBLIC_BASE_URL: env.NEXT_PUBLIC_BASE_URL,
        SHANDON_ACTIVATION_KEY: env.SHANDON_ACTIVATION_KEY,

        // Painel administrativo
        SHANDON_ADMIN_KEY: env.SHANDON_ADMIN_KEY,
        SHANDON_ADMIN_EMAILS: env.SHANDON_ADMIN_EMAILS,

        // Instagram / Central
        CENTRAL_API_BASE: env.CENTRAL_API_BASE,
        NEXT_PUBLIC_SHANDON_API_BASE: env.NEXT_PUBLIC_SHANDON_API_BASE,

        // Proxy
        HTTP_PROXY: env.HTTP_PROXY,
        HTTPS_PROXY: env.HTTPS_PROXY,
        ALL_PROXY: env.ALL_PROXY,
        SHANDON_PROXY_URL: env.SHANDON_PROXY_URL,

        // Chaves de OSINT
        HIBP_API_KEY: env.HIBP_API_KEY,
        SHODAN_API_KEY: env.SHODAN_API_KEY,
        CENSYS_API_ID: env.CENSYS_API_ID,
        CENSYS_API_SECRET: env.CENSYS_API_SECRET,
        FB_ACCESS_TOKEN: env.FB_ACCESS_TOKEN,
        PASTEBIN_API_KEY: env.PASTEBIN_API_KEY,
        RAPIDAPI_WHATSAPP_KEY: env.RAPIDAPI_WHATSAPP_KEY,
        RAPIDAPI_WHATSAPP_HOST: env.RAPIDAPI_WHATSAPP_HOST,

        // Pagamentos
        MERCADO_PAGO_ACCESS_TOKEN: env.MERCADO_PAGO_ACCESS_TOKEN,
      }),
      // Fixos: o container precisa destes dois para o Next standalone subir.
      NODE_ENV: "production",
      PORT: "3000",
    } as Record<string, string>;
  }

  override onStart() {
    console.log("[Shandon] Container iniciado");
  }

  override onStop() {
    console.log("[Shandon] Container parado");
  }

  override onError(error: unknown) {
    console.error("[Shandon] Erro no container:", error);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const container = getContainer(env.SHANDON_CONTAINER, "main");
    return container.fetch(request);
  },
};
