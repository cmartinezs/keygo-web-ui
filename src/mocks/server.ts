// ── MSW Node Server ────────────────────────────────────────────────────────────
// Instancia del servidor MSW para interceptar peticiones en entorno Node (tests).
// Importar en setup de Vitest o en archivos de test individuales.

import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
