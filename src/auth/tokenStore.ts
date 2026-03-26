import { create } from 'zustand'
import type { AppRole } from '@/types/roles'

interface TokenState {
  accessToken: string | null
  idToken: string | null
  refreshToken: string | null
  roles: AppRole[]
}

interface TokenActions {
  setTokens: (tokens: {
    accessToken: string
    idToken: string
    refreshToken: string
    roles: AppRole[]
  }) => void
  clearTokens: () => void
}

type TokenStore = TokenState & TokenActions

const initialState: TokenState = {
  accessToken: null,
  idToken: null,
  refreshToken: null,
  roles: [],
}

export const useTokenStore = create<TokenStore>()((set) => ({
  ...initialState,
  setTokens: ({ accessToken, idToken, refreshToken, roles }) =>
    set({ accessToken, idToken, refreshToken, roles }),
  clearTokens: () => set(initialState),
}))
