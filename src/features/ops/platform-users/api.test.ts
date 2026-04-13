import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiClientMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('@/shared/api/client', () => ({
  apiClient: apiClientMock,
  API_V1: '/api/v1',
}));

import {
  PLATFORM_ROLE_QUERY_KEYS,
  PLATFORM_USER_QUERY_KEYS,
  listPlatformRolesCatalog,
} from './api';

describe('platform users api wrappers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes stable query keys for platform users and role catalog', () => {
    expect(PLATFORM_USER_QUERY_KEYS.detail('user-1')).toEqual(['platform-users', 'user-1']);
    expect(PLATFORM_USER_QUERY_KEYS.roles('user-1')).toEqual(['platform-users', 'user-1', 'roles']);
    expect(PLATFORM_ROLE_QUERY_KEYS.catalog).toEqual(['platform-roles', 'catalog']);
  });

  it('returns the platform role catalog from backend response', async () => {
    apiClientMock.get.mockResolvedValueOnce({
      data: {
        date: '2026-04-13T12:00:00Z',
        data: [
          {
            id: '10000000-0000-0000-0000-000000000001',
            code: 'keygo_admin',
            name: 'KeyGo Admin',
            description: 'Global administration',
          },
          {
            id: '10000000-0000-0000-0000-000000000002',
            code: 'keygo_tenant_admin',
            name: 'KeyGo Tenant Admin',
            description: 'Tenant administration across managed organizations',
          },
        ],
      },
    });

    const result = await listPlatformRolesCatalog({ timeoutMs: 10_000 });

    expect(apiClientMock.get).toHaveBeenCalledWith('/api/v1/platform/roles', {
      signal: undefined,
      timeout: 10_000,
    });
    expect(result).toEqual([
      {
        id: '10000000-0000-0000-0000-000000000001',
        code: 'keygo_admin',
        name: 'KeyGo Admin',
        description: 'Global administration',
      },
      {
        id: '10000000-0000-0000-0000-000000000002',
        code: 'keygo_tenant_admin',
        name: 'KeyGo Tenant Admin',
        description: 'Tenant administration across managed organizations',
      },
    ]);
  });
});
