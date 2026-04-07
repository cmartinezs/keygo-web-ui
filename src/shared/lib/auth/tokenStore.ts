import { create } from 'zustand'
import { resolvePrimaryRole } from '@/shared/types/roles'
import type { AppRole } from '@/shared/types/roles'

// Imported lazily at call time to avoid circular dependency with refresh.ts
const SESSION_KEY = 'kg_rt'

interface TokenState {
  accessToken: string | null
  idToken: string | null
  refreshToken: string | null
  roles: AppRole[]
  activeRole: AppRole | null
  /** Tenant gestionado activo para ADMIN_TENANT. Persiste durante la sesión; se limpia al cerrar sesión. */
  managedTenantSlug: string | null
}

interface TokenActions {
  setTokens: (tokens: {
    accessToken: string
    idToken: string
    refreshToken: string
    roles: AppRole[]
  }) => void
  setActiveRole: (role: AppRole) => void
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
  setTokens: ({ accessToken, idToken, refreshToken, roles }) =>
    set({
      accessToken,
      idToken,
      refreshToken,
      roles,
      activeRole: resolvePrimaryRole(roles),
    }),
  setActiveRole: (role) =>
    set((state) =>
      state.roles.includes(role)
        ? { activeRole: role }
        : state.activeRole
          ? { activeRole: state.activeRole }
          : { activeRole: resolvePrimaryRole(state.roles) },
    ),
  setManagedTenantSlug: (slug) => set({ managedTenantSlug: slug }),
  clearTokens: () => {
    sessionStorage.removeItem(SESSION_KEY)
    set(initialState)
  },
}))
