/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KEYGO_BASE: string
  readonly VITE_TENANT_SLUG: string
  readonly VITE_CLIENT_ID: string
  readonly VITE_REDIRECT_URI: string
  /** Cloudflare Turnstile site key. When absent, CAPTCHA is disabled entirely. */
  readonly VITE_TURNSTILE_SITE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
