/**
 * SHANDON ELITE — Payment Architecture (Mercado Pago)
 *
 * Este módulo define a interface para integração com gateway de pagamento.
 * A implementação real deve ser feita com as credenciais do Mercado Pago.
 *
 * Para configurar:
 * 1. Criar conta no Mercado Pago (https://www.mercadopago.com.br)
 * 2. Obter Access Token e Public Key
 * 3. Adicionar no .env:
 *    - MERCADO_PAGO_ACCESS_TOKEN=seu_token
 *    - MERCADO_PAGO_PUBLIC_KEY=sua_public_key
 */

export interface PaymentConfig {
  accessToken: string;
  publicKey: string;
  webhookUrl?: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: 'BRL';
  interval: 'monthly' | 'yearly';
  features: string[];
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'past_due' | 'pending';
  startDate: string;
  endDate?: string;
  paymentId?: string;
}

export interface PaymentResult {
  success: boolean;
  subscriptionId?: string;
  paymentUrl?: string;
  error?: string;
}

// Planos disponíveis
export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 0,
    currency: 'BRL',
    interval: 'monthly',
    features: [
      '5 buscas / dia',
      'Módulo Todos',
      'Sem presença',
      'Sem API',
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 49,
    currency: 'BRL',
    interval: 'monthly',
    features: [
      'Buscas ilimitadas',
      'Todos os módulos',
      'Análise de Presença',
      'Snapshots + Comparação',
      'API completa',
      'Suporte prioritário',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99,
    currency: 'BRL',
    interval: 'monthly',
    features: [
      'Tudo do Elite',
      'Multi-usuário',
      'Webhooks',
      'Relatórios PDF',
      'Monitoramento contínuo',
      'SLA garantido',
    ],
  },
];

/**
 * Criar assinatura no Mercado Pago
 *
 * IMPLEMENTAÇÃO FUTURA:
 * - Usar SDK do Mercado Pago: https://github.com/mercadopago/sdk-nodejs
 * - Criar preferência de pagamento
 * - Retornar URL de checkout
 *
 * Exemplo de implementação:
 *
 * import { MercadoPagoConfig, Preference } from 'mercadopago';
 *
 * const client = new MercadoPagoConfig({
 *   accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
 * });
 *
 * export async function createSubscription(
 *   userId: string,
 *   planId: string
 * ): Promise<PaymentResult> {
 *   const plan = PLANS.find(p => p.id === planId);
 *   if (!plan || plan.price === 0) {
 *     return { success: false, error: 'Plano inválido' };
 *   }
 *
 *   const preference = new Preference(client);
 *   const result = await preference.create({
 *     body: {
 *       items: [{
 *         id: plan.id,
 *         title: `SHANDON ELITE - ${plan.name}`,
 *         quantity: 1,
 *         unit_price: plan.price,
 *         currency_id: 'BRL',
 *       }],
 *       metadata: { userId, planId },
 *       back_urls: {
 *         success: `${process.env.NEXT_PUBLIC_BASE_URL}/premium?status=success`,
 *         failure: `${process.env.NEXT_PUBLIC_BASE_URL}/premium?status=failure`,
 *         pending: `${process.env.NEXT_PUBLIC_BASE_URL}/premium?status=pending`,
 *       },
 *     },
 *   });
 *
 *   return {
 *     success: true,
 *     subscriptionId: result.id,
 *     paymentUrl: result.init_point,
 *   };
 * }
 */

export async function createSubscription(
  _userId: string,
  _planId: string
): Promise<PaymentResult> {
  // TODO: Implementar com SDK do Mercado Pago
  return {
    success: false,
    error: 'Integração de pagamento ainda não implementada',
  };
}

/**
 * Webhook do Mercado Pago
 *
 * IMPLEMENTAÇÃO FUTURA:
 * - Verificar assinatura do webhook
 * - Atualizar status da assinatura no banco
 * - Enviar email de confirmação
 *
 * Exemplo de implementação:
 *
 * export async function handleWebhook(body: unknown, signature: string): Promise<void> {
 *   // Verificar assinatura
 *   const isValid = verifyWebhookSignature(body, signature);
 *   if (!isValid) throw new Error('Invalid signature');
 *
 *   // Processar pagamento
 *   const payment = body as { status: string; metadata: { userId: string; planId: string } };
 *
 *   if (payment.status === 'approved') {
 *     await updateUserTier(payment.metadata.userId, 'premium');
 *   }
 * }
 */

export async function handleWebhook(
  _body: unknown,
  _signature: string
): Promise<void> {
  // TODO: Implementar processamento de webhook
  console.warn('[Payment] Webhook handler não implementado');
}

/**
 * Cancelar assinatura
 *
 * IMPLEMENTAÇÃO FUTURA:
 * - Cancelar no Mercado Pago
 * - Atualizar status no banco
 */
export async function cancelSubscription(
  _subscriptionId: string
): Promise<PaymentResult> {
  // TODO: Implementar cancelamento
  return {
    success: false,
    error: 'Cancelamento ainda não implementado',
  };
}

/**
 * Verificar status da assinatura
 */
export async function getSubscriptionStatus(
  _subscriptionId: string
): Promise<{ status: string; nextBillingDate?: string }> {
  // TODO: Implementar consulta
  return { status: 'unknown' };
}
