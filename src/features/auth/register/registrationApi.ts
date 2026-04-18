import type { BaseResponse } from '@/shared/types/base';
import type {
  RegistrationData,
  RegistrationSession,
  RegisterRequest,
  VerifyEmailRequest,
  ResendVerificationRequest,
} from '@/shared/types/user';
import { authClient, API_V1 } from '@/shared/api/client';
import { unwrapResponseData } from '@/shared/api/response';
import type { RequestOptions } from '@/shared/api/requestOptions';

// ── Query key constants ────────────────────────────────────────────────────────

export const REGISTRATION_QUERY_KEYS = {
  all: ['registration'] as const,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function registerUrl(tenantSlug: string, clientId: string) {
  return `${API_V1}/tenants/${tenantSlug}/apps/${clientId}/register`;
}

function getRegistrationUrl(registrationId: string, clientId: string) {
  return `${API_V1}/tenants/registration?registration_id=${registrationId}&client_id=${clientId}`;
}

function verifyEmailUrl(tenantSlug: string, clientId: string) {
  return `${API_V1}/tenants/${tenantSlug}/apps/${clientId}/verify-email`;
}

function resendVerificationUrl(tenantSlug: string, clientId: string) {
  return `${API_V1}/tenants/${tenantSlug}/apps/${clientId}/resend-verification`;
}

// ── API functions ─────────────────────────────────────────────────────────────────

/** GET /api/v1/tenants/registration?registration_id=xxx&client_id=yyy — obtener sesión de registro */
export async function getRegistrationSession(
  registrationId: string,
  clientId: string,
  options?: RequestOptions,
): Promise<RegistrationSession> {
  const res = await authClient.get<BaseResponse<RegistrationSession>>(
    getRegistrationUrl(registrationId, clientId),
    {
      signal: options?.signal,
      timeout: options?.timeoutMs,
    },
  );
  return unwrapResponseData(res.data, 'Error al obtener sesión de registro');
}

/** POST /api/v1/tenants/{slug}/apps/{clientId}/register ✅ — registro de nuevo usuario */
export async function registerUser(
  tenantSlug: string,
  clientId: string,
  data: RegisterRequest,
  options?: RequestOptions,
): Promise<RegistrationData> {
  const res = await authClient.post<BaseResponse<RegistrationData>>(
    registerUrl(tenantSlug, clientId),
    data,
    {
      signal: options?.signal,
      timeout: options?.timeoutMs,
      headers: options?.idempotencyKey
        ? { 'X-Idempotency-Key': options.idempotencyKey }
        : undefined,
    },
  );
  return unwrapResponseData(res.data, 'Error al registrar usuario');
}

/** POST /api/v1/tenants/{slug}/apps/{clientId}/verify-email ✅ — verificar email con código */
export async function verifyEmail(
  tenantSlug: string,
  clientId: string,
  data: VerifyEmailRequest,
  options?: RequestOptions,
): Promise<void> {
  await authClient.post(verifyEmailUrl(tenantSlug, clientId), data, {
    signal: options?.signal,
    timeout: options?.timeoutMs,
  });
}

/** POST /api/v1/tenants/{slug}/apps/{clientId}/resend-verification ✅ — reenviar código */
export async function resendVerification(
  tenantSlug: string,
  clientId: string,
  data: ResendVerificationRequest,
  options?: RequestOptions,
): Promise<void> {
  await authClient.post(resendVerificationUrl(tenantSlug, clientId), data, {
    signal: options?.signal,
    timeout: options?.timeoutMs,
  });
}
