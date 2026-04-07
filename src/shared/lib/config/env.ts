import { z } from 'zod'

const envSchema = z.object({
  VITE_KEYGO_BASE: z.string().url(),
  VITE_TENANT_SLUG: z.string().min(1),
  VITE_CLIENT_ID: z.string().min(1),
  VITE_REDIRECT_URI: z.string().url(),
  VITE_TURNSTILE_SITE_KEY: z.string().min(1).optional(),
  // Número de reintentos automáticos para queries fallidas y reconexión en login.
  // Cuando se agotan, se muestra un botón de reintento manual.  Default: 2.
  VITE_QUERY_RETRY_COUNT: z.coerce.number().int().min(0).default(2),
  // Activa MSW (Mock Service Worker) para endpoints temporales sin contrato backend.
  // Usar solo en desarrollo: VITE_MOCK_CONNECTIONS=true npm run dev
  VITE_MOCK_CONNECTIONS: z
    .string()
    .transform((v) => v === 'true')
    .optional()
    .default('false'),
})

const parsedEnv = envSchema.safeParse(import.meta.env)

if (!parsedEnv.success) {
  const message = parsedEnv.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n')
  throw new Error(`Invalid environment variables:\n${message}`)
}

export const env = Object.freeze({
  KEYGO_BASE: parsedEnv.data.VITE_KEYGO_BASE,
  TENANT_SLUG: parsedEnv.data.VITE_TENANT_SLUG,
  CLIENT_ID: parsedEnv.data.VITE_CLIENT_ID,
  REDIRECT_URI: parsedEnv.data.VITE_REDIRECT_URI,
  TURNSTILE_SITE_KEY: parsedEnv.data.VITE_TURNSTILE_SITE_KEY,
  QUERY_RETRY_COUNT: parsedEnv.data.VITE_QUERY_RETRY_COUNT,
  MOCK_CONNECTIONS: parsedEnv.data.VITE_MOCK_CONNECTIONS,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
})
