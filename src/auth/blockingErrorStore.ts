import { create } from 'zustand'

export type BlockingErrorActionKind = 'close' | 'go-login' | 'logout'

export interface BlockingErrorAction {
  id: string
  label: string
  kind: BlockingErrorActionKind
  variant?: 'primary' | 'secondary'
}

/**
 * Error bloqueante: el usuario autenticó correctamente pero no tiene
 * ningún rol compatible con esta UI.
 * El modal lo enriquece con datos reales del perfil vía API.
 */
export interface NoRoleError {
  kind: 'NO_ROLE'
  supportCode: string
  userId: string
  /** Nombre de usuario extraído del token; puede ser 'N/D'. */
  usernameHint: string
  rolesDetected: string
  tenantClaim: string
  issuer: string
  timestamp: string
  /**
   * Acciones de UI configurables para este error.
   * Si no se envían, el modal usa acciones por defecto.
   */
  actions?: BlockingErrorAction[]
}

/**
 * Unión extensible de errores bloqueantes.
 * Para añadir uno nuevo: | { kind: 'CONNECTION'; message: string; timestamp: string }
 */
export type BlockingError = NoRoleError

interface BlockingErrorState {
  error: BlockingError | null
  setError: (error: BlockingError) => void
  clearError: () => void
}

export const useBlockingErrorStore = create<BlockingErrorState>()((set) => ({
  error: null,
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}))
