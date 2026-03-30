import { z } from 'zod'

const envSchema = z.object({
  VITE_KEYGO_BASE: z.string().url(),
  VITE_TENANT_SLUG: z.string().min(1),
  VITE_CLIENT_ID: z.string().min(1),
  VITE_REDIRECT_URI: z.string().url(),
  VITE_TURNSTILE_SITE_KEY: z.string().min(1).optional(),
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
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
})
