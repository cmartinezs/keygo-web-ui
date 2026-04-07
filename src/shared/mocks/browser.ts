// ── MSW Browser Worker ─────────────────────────────────────────────────────────
// Instancia del Service Worker para interceptar peticiones en el navegador (dev).
// Solo se activa cuando VITE_MOCK_CONNECTIONS=true en el entorno de desarrollo.

import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
