import type { BaseResponse, PagedData } from '@/shared/types/base';
import type {
  PlatformUserData,
  CreatePlatformUserRequest,
  UpdatePlatformUserRequest,
  AssignPlatformRoleRequest,
  PlatformRoleCatalogData,
  PlatformUserRoleData,
  ListPlatformUsersParams,
} from '@/shared/types/platform';
import { apiClient, API_V1 } from '@/shared/api/client';
import { unwrapResponseData } from '@/shared/api/response';
import type { RequestOptions } from '@/shared/api/requestOptions';

// ── Query key constants ────────────────────────────────────────────────────────

export const PLATFORM_USER_QUERY_KEYS = {
  all: ['platform-users'] as const,
  list: (params: ListPlatformUsersParams) => ['platform-users', 'list', params] as const,
  detail: (userId: string) => ['platform-users', userId] as const,
  roles: (userId: string) => ['platform-users', userId, 'roles'] as const,
};

export const PLATFORM_ROLE_QUERY_KEYS = {
  all: ['platform-roles'] as const,
  catalog: ['platform-roles', 'catalog'] as const,
};

// ── API functions ─────────────────────────────────────────────────────────────

/** GET /api/v1/platform/users ⏳ pendiente backend — usa mock MSW */
export async function listPlatformUsers(
  params?: ListPlatformUsersParams,
  options?: RequestOptions,
): Promise<PagedData<PlatformUserData>> {
  const res = await apiClient.get<BaseResponse<PagedData<PlatformUserData>>>(
    `${API_V1}/platform/users`,
    { params, signal: options?.signal, timeout: options?.timeoutMs },
  );
  return unwrapResponseData(res.data, 'Error al listar usuarios de plataforma');
}

/** GET /api/v1/platform/users/{userId} ✅ */
export async function getPlatformUser(
  userId: string,
  options?: RequestOptions,
): Promise<PlatformUserData> {
  const res = await apiClient.get<BaseResponse<PlatformUserData>>(
    `${API_V1}/platform/users/${userId}`,
    { signal: options?.signal, timeout: options?.timeoutMs },
  );
  return unwrapResponseData(res.data, 'Error al obtener usuario de plataforma');
}

/** POST /api/v1/platform/users ✅ */
export async function createPlatformUser(
  data: CreatePlatformUserRequest,
  options?: RequestOptions,
): Promise<PlatformUserData> {
  const res = await apiClient.post<BaseResponse<PlatformUserData>>(
    `${API_V1}/platform/users`,
    data,
    {
      signal: options?.signal,
      timeout: options?.timeoutMs,
      headers: options?.idempotencyKey
        ? { 'X-Idempotency-Key': options.idempotencyKey }
        : undefined,
    },
  );
  return unwrapResponseData(res.data, 'Error al crear usuario de plataforma');
}

/** PUT /api/v1/platform/users/{userId}/suspend ✅ */
export async function suspendPlatformUser(userId: string, options?: RequestOptions): Promise<void> {
  await apiClient.put(`${API_V1}/platform/users/${userId}/suspend`, undefined, {
    signal: options?.signal,
    timeout: options?.timeoutMs,
    headers: options?.idempotencyKey ? { 'X-Idempotency-Key': options.idempotencyKey } : undefined,
  });
}

/** PUT /api/v1/platform/users/{userId}/activate ✅ */
export async function activatePlatformUser(
  userId: string,
  options?: RequestOptions,
): Promise<void> {
  await apiClient.put(`${API_V1}/platform/users/${userId}/activate`, undefined, {
    signal: options?.signal,
    timeout: options?.timeoutMs,
    headers: options?.idempotencyKey ? { 'X-Idempotency-Key': options.idempotencyKey } : undefined,
  });
}

/** POST /api/v1/platform/users/{userId}/platform-roles ✅ */
export async function assignPlatformRole(
  userId: string,
  data: AssignPlatformRoleRequest,
  options?: RequestOptions,
): Promise<void> {
  await apiClient.post(`${API_V1}/platform/users/${userId}/platform-roles`, data, {
    signal: options?.signal,
    timeout: options?.timeoutMs,
    headers: options?.idempotencyKey ? { 'X-Idempotency-Key': options.idempotencyKey } : undefined,
  });
}

/** DELETE /api/v1/platform/users/{userId}/platform-roles/{roleCode} ✅ */
export async function revokePlatformRole(
  userId: string,
  roleCode: string,
  options?: RequestOptions,
): Promise<void> {
  await apiClient.delete(`${API_V1}/platform/users/${userId}/platform-roles/${roleCode}`, {
    signal: options?.signal,
    timeout: options?.timeoutMs,
  });
}

/** PUT /api/v1/platform/users/{userId} ⏳ pendiente backend — usa mock MSW */
export async function updatePlatformUser(
  userId: string,
  data: UpdatePlatformUserRequest,
  options?: RequestOptions,
): Promise<PlatformUserData> {
  const res = await apiClient.put<BaseResponse<PlatformUserData>>(
    `${API_V1}/platform/users/${userId}`,
    data,
    {
      signal: options?.signal,
      timeout: options?.timeoutMs,
      headers: options?.idempotencyKey
        ? { 'X-Idempotency-Key': options.idempotencyKey }
        : undefined,
    },
  );
  return unwrapResponseData(res.data, 'Error al actualizar usuario de plataforma');
}

/** GET /api/v1/platform/users/{userId}/platform-roles ✅ */
export async function listPlatformUserRoles(
  userId: string,
  options?: RequestOptions,
): Promise<PlatformUserRoleData[]> {
  const res = await apiClient.get<BaseResponse<PlatformUserRoleData[]>>(
    `${API_V1}/platform/users/${userId}/platform-roles`,
    { signal: options?.signal, timeout: options?.timeoutMs },
  );
  return unwrapResponseData(res.data, 'Error al listar roles del usuario');
}

/** GET /api/v1/platform/roles ✅ */
export async function listPlatformRolesCatalog(
  options?: RequestOptions,
): Promise<PlatformRoleCatalogData[]> {
  const res = await apiClient.get<BaseResponse<PlatformRoleCatalogData[]>>(
    `${API_V1}/platform/roles`,
    { signal: options?.signal, timeout: options?.timeoutMs },
  );
  return unwrapResponseData(res.data, 'Error al listar catálogo de roles de plataforma');
}
