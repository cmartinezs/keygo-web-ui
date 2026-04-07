import { create } from 'zustand'
import { resolvePrimaryRole } from '@/shared/types/roles'
import type { PlatformRole } from '@/shared/types/roles'

// Imported lazily at call time to avoid circular dependency with refresh.ts
const SESSION_KEY = 'kg_rt'
const ACTIVE_ROLE_KEY = 'kg_ar'

interface TokenState {
  accessToken: string | null
  idToken: string | null
  refreshToken: string | null
  roles: PlatformRole[]
  activeRole: PlatformRole | null
  /** Tenant gestionado activo para ADMIN_TENANT. Persiste durante la sesión; se limpia al cerrar sesión. */
  managedTenantSlug: string | null
}

interface TokenActions {
  setTokens: (tokens: {
    accessToken: string
    idToken: string
    refreshToken: string
    roles: PlatformRole[]
  }) => void
  setActiveRole: (role: PlatformRole) => void
  setManagedTenantSlug: (slug: string | null) => void
  clearTokens: () => void
}

type TokenStore = TokenState & TokenActions

const initialState: TokenState = {
  accessToken: null,
  idToken: null,
  refreshToken: null,
  roles: [],
  activeRole: null,
  managedTenantSlug: null,
}

export const useTokenStore = create<TokenStore>()((set) => ({
  ...initialState,
  setTokens: ({ accessToken, idToken, refreshToken, roles }) => {
    const persisted = sessionStorage.getItem(ACTIVE_ROLE_KEY) as PlatformRole | null
    const activeRole =
      persisted && roles.includes(persisted) ? persisted : resolvePrimaryRole(roles)
    set({ accessToken, idToken, refreshToken, roles, activeRole })
  },
  setActiveRole: (role) =>
    set((state) => {
      if (state.roles.includes(role)) {
        sessionStorage.setItem(ACTIVE_ROLE_KEY, role)
        return { activeRole: role }
      }
      return state.activeRole
        ? { activeRole: state.activeRole }
        : { activeRole: resolvePrimaryRole(state.roles) }
    }),
  setManagedTenantSlug: (slug) => set({ managedTenantSlug: slug }),
  clearTokens: () => {
    sessionStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(ACTIVE_ROLE_KEY)
    set(initialState)
  },
}))
