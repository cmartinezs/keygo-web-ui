import type { BaseResponse } from '@/shared/types/base'
import type {
  RegistrationData,
  RegisterRequest,
  VerifyEmailRequest,
  ResendVerificationRequest,
} from '@/shared/types/user'
import { apiClient, API_V1 } from '@/shared/api/client'
import { unwrapResponseData } from '@/shared/api/response'
import type { RequestOptions } from '@/shared/api/requestOptions'

// ── Query key constants ────────────────────────────────────────────────────────

export const REGISTRATION_QUERY_KEYS = {
  all: ['registration'] as const,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function registerUrl(tenantSlug: string, clientId: string) {
  return `${API_V1}/tenants/${tenantSlug}/apps/${clientId}/register`
}

function verifyEmailUrl(tenantSlug: string, clientId: string) {
  return `${API_V1}/tenants/${tenantSlug}/apps/${clientId}/verify-email`
}

function resendVerificationUrl(tenantSlug: string, clientId: string) {
  return `${API_V1}/tenants/${tenantSlug}/apps/${clientId}/resend-verification`
}

// ── API functions ─────────────────────────────────────────────────────────────

/** POST /api/v1/tenants/{slug}/apps/{clientId}/register ✅ — registro de nuevo usuario */
export async function registerUser(
  tenantSlug: string,
  clientId: string,
  data: RegisterRequest,
  options?: RequestOptions,
): Promise<RegistrationData> {
  const res = await apiClient.post<BaseResponse<RegistrationData>>(
    registerUrl(tenantSlug, clientId),
    data,
    {
      signal: options?.signal,
      timeout: options?.timeoutMs,
      headers: options?.idempotencyKey
        ? { 'X-Idempotency-Key': options.idempotencyKey }
        : undefined,
    },
  )
  return unwrapResponseData(res.data, 'Error al registrar usuario')
}

/** POST /api/v1/tenants/{slug}/apps/{clientId}/verify-email ✅ — verificar email con código */
export async function verifyEmail(
  tenantSlug: string,
  clientId: string,
  data: VerifyEmailRequest,
  options?: RequestOptions,
): Promise<void> {
  await apiClient.post(verifyEmailUrl(tenantSlug, clientId), data, {
    signal: options?.signal,
    timeout: options?.timeoutMs,
  })
}

/** POST /api/v1/tenants/{slug}/apps/{clientId}/resend-verification ✅ — reenviar código */
export async function resendVerification(
  tenantSlug: string,
  clientId: string,
  data: ResendVerificationRequest,
  options?: RequestOptions,
): Promise<void> {
  await apiClient.post(resendVerificationUrl(tenantSlug, clientId), data, {
    signal: options?.signal,
    timeout: options?.timeoutMs,
  })
}
