import type { BaseResponse } from '@/shared/types/base'
import type { AppPlan, AppSubscription, AppInvoice } from '@/shared/types/billing'
import { apiClient, API_V1 } from '@/shared/api/client'
import { unwrapResponseData } from '@/shared/api/response'
import type { RequestOptions } from '@/shared/api/requestOptions'

// ── Query key constants ────────────────────────────────────────────────────────

export const PLATFORM_BILLING_QUERY_KEYS = {
  catalog: ['platform-billing', 'catalog'] as const,
  planDetail: (planCode: string) => ['platform-billing', 'catalog', planCode] as const,
  subscription: ['platform-billing', 'subscription'] as const,
  invoices: ['platform-billing', 'invoices'] as const,
}

// ── Endpoints ─────────────────────────────────────────────────────────────────

/** GET /api/v1/platform/billing/catalog ✅ — planes disponibles para la plataforma. */
export async function getPlatformBillingCatalog(options?: RequestOptions): Promise<AppPlan[]> {
  const res = await apiClient.get<BaseResponse<AppPlan[]>>(
    `${API_V1}/platform/billing/catalog`,
    { signal: options?.signal, timeout: options?.timeoutMs },
  )
  return unwrapResponseData(res.data, 'Error al obtener catálogo de planes de plataforma')
}

/** GET /api/v1/platform/billing/catalog/{planCode} ✅ — detalle de un plan. */
export async function getPlatformBillingPlanDetail(
  planCode: string,
  options?: RequestOptions,
): Promise<AppPlan> {
  const res = await apiClient.get<BaseResponse<AppPlan>>(
    `${API_V1}/platform/billing/catalog/${planCode}`,
    { signal: options?.signal, timeout: options?.timeoutMs },
  )
  return unwrapResponseData(res.data, 'Error al obtener detalle del plan')
}

/** GET /api/v1/platform/billing/subscription ✅ — suscripción activa. */
export async function getPlatformSubscription(
  options?: RequestOptions,
): Promise<AppSubscription> {
  const res = await apiClient.get<BaseResponse<AppSubscription>>(
    `${API_V1}/platform/billing/subscription`,
    { signal: options?.signal, timeout: options?.timeoutMs },
  )
  return unwrapResponseData(res.data, 'Error al obtener suscripción de plataforma')
}

/** GET /api/v1/platform/billing/invoices ✅ — facturas de plataforma. */
export async function getPlatformInvoices(options?: RequestOptions): Promise<AppInvoice[]> {
  const res = await apiClient.get<BaseResponse<AppInvoice[]>>(
    `${API_V1}/platform/billing/invoices`,
    { signal: options?.signal, timeout: options?.timeoutMs },
  )
  return unwrapResponseData(res.data, 'Error al obtener facturas de plataforma')
}

/** POST /api/v1/platform/billing/subscription/cancel ✅ — cancelar suscripción activa. */
export async function cancelPlatformSubscription(options?: RequestOptions): Promise<void> {
  await apiClient.post(
    `${API_V1}/platform/billing/subscription/cancel`,
    undefined,
    {
      signal: options?.signal,
      timeout: options?.timeoutMs,
      headers: options?.idempotencyKey
        ? { 'X-Idempotency-Key': options.idempotencyKey }
        : undefined,
    },
  )
}
