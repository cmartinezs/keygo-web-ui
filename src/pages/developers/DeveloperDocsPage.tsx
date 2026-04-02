import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { AppFooter } from '@/components/AppFooter'
import { ScrollToTop } from '@/components/ScrollToTop'

const prerequisites = [
  'Un tenant activo con slug conocido.',
  'Una ClientApp activa con su client_id y redirect_uri registrada.',
  'Usuarios o memberships activos para probar el flujo de punta a punta.',
  'Un flujo OAuth2 Authorization Code + PKCE sin client_secret en el navegador.',
]

const securityChecks = [
  'Genera code_verifier y state por intento de login; no los reutilices.',
  'Mantén los tokens en memoria y valida el id_token vía JWKS.',
  'No guardes access_token ni id_token en localStorage.',
  'El refresh token debe rotarse y viajar solo por el flujo previsto por el backend.',
]

type JsonMap = Record<string, unknown>

interface EndpointExample {
  label: string
  payload: JsonMap
}

interface EndpointPayloadDoc {
  fields: Record<string, string>
  examples: EndpointExample[]
}

interface EndpointResponseDoc {
  format: string
  fields: Record<string, string>
  examples: EndpointExample[]
}

interface EndpointDoc {
  method: 'GET' | 'POST'
  tabLabel: string
  path: string
  purpose: string
  auth: string
  queryParams?: EndpointPayloadDoc
  requestBody?: EndpointPayloadDoc
  response: EndpointResponseDoc
}

const endpoints: EndpointDoc[] = [
  {
    method: 'GET',
    tabLabel: 'Authorize',
    path: '/api/v1/tenants/{tenantSlug}/oauth2/authorize',
    purpose: 'Inicia el contexto OAuth2, valida tenant/app/redirect URI y crea la sesión HTTP.',
    auth: 'Pública. Debes enviar query params OAuth2 completos.',
    queryParams: {
      fields: {
        client_id: 'Identificador público de la ClientApp registrada en ese tenant.',
        redirect_uri: 'URL de callback previamente registrada para esa ClientApp.',
        response_type: 'Debe ser "code" para Authorization Code.',
        scope: 'Scopes solicitados, por ejemplo "openid profile email".',
        state: 'Nonce anti-CSRF que luego debes validar en el callback.',
        code_challenge: 'Hash PKCE derivado desde code_verifier.',
        code_challenge_method: 'Debe ser "S256".',
      },
      examples: [
        {
          label: 'Authorization Code + PKCE',
          payload: {
            client_id: 'acme-web',
            redirect_uri: 'https://app.acme.com/auth/callback',
            response_type: 'code',
            scope: 'openid profile email',
            state: '0f5f0f2d-3bce-4d09-a6b8-5a0c1d7f7af8',
            code_challenge: 'bTO4kdrN4w5P8Qxj5QwB_g9ipdN7x0P9S4wKx7wN4VY',
            code_challenge_method: 'S256',
          },
        },
      ],
    },
    response: {
      format: 'BaseResponse<AuthorizeData>',
      fields: {
        date: 'Timestamp del backend.',
        success: 'Resultado exitoso del inicio del contexto OAuth2.',
        data: 'Contexto asociado a la sesión HTTP para continuar con /account/login.',
        'data.requestId': 'Identificador de trazabilidad para soporte/auditoría.',
      },
      examples: [
        {
          label: 'Success',
          payload: {
            date: '2026-03-31T18:20:42.204Z',
            success: {
              code: 'SUCCESS',
              message: 'Authorization context created',
            },
            data: {
              requestId: 'a6b4532f-3a3d-4b1a-b7a4-8f9cbaf6b478',
            },
          },
        },
      ],
    },
  },
  {
    method: 'POST',
    tabLabel: 'Login',
    path: '/api/v1/tenants/{tenantSlug}/account/login',
    purpose: 'Valida credenciales y devuelve el authorization code dentro de BaseResponse<LoginData>.',
    auth: 'Requiere la misma sesión HTTP creada en /oauth2/authorize (credentials: include).',
    requestBody: {
      fields: {
        email_or_username: 'Usuario o email del tenant.',
        password: 'Contraseña del usuario.',
      },
      examples: [
        {
          label: 'Credenciales válidas',
          payload: {
            email_or_username: 'admin@acme.com',
            password: 'P@ssw0rdSeguro!',
          },
        },
      ],
    },
    response: {
      format: 'BaseResponse<LoginData>',
      fields: {
        date: 'Timestamp del backend.',
        success: 'Resultado de autenticación.',
        'data.code': 'Authorization code de un solo uso.',
        'data.state': 'Debe coincidir con el state original enviado en authorize.',
      },
      examples: [
        {
          label: 'Success',
          payload: {
            date: '2026-03-31T18:21:30.301Z',
            success: {
              code: 'SUCCESS',
              message: 'User authenticated',
            },
            data: {
              code: 'SplxlOBeZQQYbYS6WxSbIA',
              state: '0f5f0f2d-3bce-4d09-a6b8-5a0c1d7f7af8',
            },
          },
        },
      ],
    },
  },
  {
    method: 'POST',
    tabLabel: 'Token',
    path: '/api/v1/tenants/{tenantSlug}/oauth2/token',
    purpose: 'Canjea el code con PKCE o rota el refresh token para obtener nuevos tokens.',
    auth: 'Pública para OAuth2. Sin bearer previo; depende del grant_type.',
    requestBody: {
      fields: {
        grant_type: '"authorization_code" o "refresh_token".',
        client_id: 'Identificador público de la ClientApp.',
        code: 'Requerido con grant_type=authorization_code.',
        code_verifier: 'Requerido con grant_type=authorization_code (valor PKCE original).',
        redirect_uri: 'Requerido con grant_type=authorization_code y debe calzar con authorize.',
        refresh_token: 'Requerido con grant_type=refresh_token.',
      },
      examples: [
        {
          label: 'Flujo authorization_code',
          payload: {
            grant_type: 'authorization_code',
            client_id: 'acme-web',
            code: 'SplxlOBeZQQYbYS6WxSbIA',
            code_verifier: 'qR7k9C0Qw9K0fXf3x6a8vB3nM2hA0vP4zJ1bM9uR2qY',
            redirect_uri: 'https://app.acme.com/auth/callback',
          },
        },
        {
          label: 'Flujo refresh_token',
          payload: {
            grant_type: 'refresh_token',
            client_id: 'acme-web',
            refresh_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.refresh',
          },
        },
      ],
    },
    response: {
      format: 'BaseResponse<TokenData>',
      fields: {
        date: 'Timestamp del backend.',
        success: 'Resultado del canje/renovación.',
        'data.access_token': 'JWT para consumir APIs protegidas.',
        'data.id_token': 'JWT OIDC con claims de identidad.',
        'data.refresh_token': 'Token para renovación silenciosa.',
        'data.expires_in': 'TTL del access_token en segundos.',
        'data.token_type': 'Normalmente "Bearer".',
      },
      examples: [
        {
          label: 'Success',
          payload: {
            date: '2026-03-31T18:22:10.901Z',
            success: {
              code: 'SUCCESS',
              message: 'Tokens issued',
            },
            data: {
              access_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.access',
              id_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.id',
              refresh_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.refresh',
              expires_in: 900,
              token_type: 'Bearer',
            },
          },
        },
      ],
    },
  },
  {
    method: 'GET',
    tabLabel: 'JWKS',
    path: '/api/v1/tenants/{tenantSlug}/.well-known/jwks.json',
    purpose: 'Expone las claves públicas para verificar access_token e id_token firmados con RS256.',
    auth: 'Pública. Sin sesión ni token. Usa tenantSlug en el path (no recibe query params).',
    response: {
      format: 'JWKS JSON (raw, no BaseResponse)',
      fields: {
        keys: 'Arreglo de claves públicas JWK disponibles para validar firmas RS256.',
        'keys[].kty': 'Tipo de clave, por ejemplo "RSA".',
        'keys[].kid': 'Identificador de clave para seleccionar la firma correcta.',
        'keys[].alg': 'Algoritmo esperado, por ejemplo "RS256".',
        'keys[].n / keys[].e': 'Componentes públicos RSA.',
      },
      examples: [
        {
          label: 'JWKS actual',
          payload: {
            keys: [
              {
                kty: 'RSA',
                kid: 'f4e8d9ac-2e01-4e88-a0f7-6ca69e03a9c8',
                use: 'sig',
                alg: 'RS256',
                n: 'wW6v3G4n0z9fW7qHc3...',
                e: 'AQAB',
              },
            ],
          },
        },
      ],
    },
  },
]

function formatJson(value: JsonMap) {
  return JSON.stringify(value, null, 2)
}

function formatQueryString(value: JsonMap) {
  const searchParams = new URLSearchParams()

  Object.entries(value).forEach(([key, rawValue]) => {
    searchParams.set(key, String(rawValue))
  })

  return `?${searchParams.toString()}`
}

const customLoginSnippet = `const verifier = generateCodeVerifier()
const challenge = await generateCodeChallenge(verifier)
const state = generateState()

const authorizeUrl = new URL(\`${'{'}baseUrl{'}'}/api/v1/tenants/${'{'}tenantSlug{'}'}/oauth2/authorize\`)
authorizeUrl.searchParams.set('client_id', clientId)
authorizeUrl.searchParams.set('redirect_uri', redirectUri)
authorizeUrl.searchParams.set('scope', 'openid profile email')
authorizeUrl.searchParams.set('response_type', 'code')
authorizeUrl.searchParams.set('code_challenge', challenge)
authorizeUrl.searchParams.set('code_challenge_method', 'S256')
authorizeUrl.searchParams.set('state', state)

await fetch(authorizeUrl.toString(), { credentials: 'include' })

const loginResponse = await fetch(
  \`${'{'}baseUrl{'}'}/api/v1/tenants/${'{'}tenantSlug{'}'}/account/login\`,
  {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email_or_username,
      password,
    }),
  },
)

const { data } = await loginResponse.json()

const tokenResponse = await fetch(
  \`${'{'}baseUrl{'}'}/api/v1/tenants/${'{'}tenantSlug{'}'}/oauth2/token\`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: clientId,
      code: data.code,
      code_verifier: verifier,
      redirect_uri: redirectUri,
    }),
  },
)

const tokens = await tokenResponse.json()`

const hostedLoginSnippet = `const verifier = generateCodeVerifier()
const challenge = await generateCodeChallenge(verifier)
const state = generateState()

const hostedLoginUrl = new URL('https://login.tu-dominio-keygo.com/login')
hostedLoginUrl.searchParams.set('tenantSlug', tenantSlug)
hostedLoginUrl.searchParams.set('client_id', clientId)
hostedLoginUrl.searchParams.set('redirect_uri', redirectUri)
hostedLoginUrl.searchParams.set('scope', 'openid profile email')
hostedLoginUrl.searchParams.set('response_type', 'code')
hostedLoginUrl.searchParams.set('state', state)
hostedLoginUrl.searchParams.set('code_challenge', challenge)
hostedLoginUrl.searchParams.set('code_challenge_method', 'S256')

sessionStorage.setItem('pkce_verifier', verifier)
sessionStorage.setItem('oauth_state', state)

window.location.assign(hostedLoginUrl.toString())

// En el callback de tu aplicación:
// 1. validar state
// 2. recuperar code_verifier
// 3. canjear el code en /oauth2/token`

interface CodePanelProps {
  title: string
  code: string
}

function CodePanel({ title, code }: CodePanelProps) {
  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-slate-950/70 shadow-lg shadow-slate-950/20 overflow-hidden">
      <div className="flex-shrink-0 border-b border-white/10 px-5 py-3 text-sm font-semibold text-slate-200">
        {title}
      </div>
      <div className="max-h-[480px] overflow-auto text-xs leading-6">
        <SyntaxHighlighter
          language="javascript"
          style={atomOneDark}
          customStyle={{
            margin: 0,
            padding: '1rem 1.25rem',
            background: 'transparent',
            fontSize: 'inherit',
            lineHeight: 'inherit',
          }}
          wrapLongLines={false}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

interface JsonPanelProps {
  title: string
  data: JsonMap
}

function JsonPanel({ title, data }: JsonPanelProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/70">
      <p className="border-b border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
        {title}
      </p>
      <div className="max-h-64 overflow-auto text-xs leading-6">
        <SyntaxHighlighter
          language="json"
          style={atomOneDark}
          customStyle={{
            margin: 0,
            padding: '0.75rem',
            background: 'transparent',
            fontSize: 'inherit',
            lineHeight: 'inherit',
          }}
          wrapLongLines={false}
        >
          {formatJson(data)}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

interface QueryStringPanelProps {
  title: string
  queryString: string
}

function QueryStringPanel({ title, queryString }: QueryStringPanelProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/70">
      <p className="border-b border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
        {title}
      </p>
      <div className="max-h-32 overflow-auto text-xs leading-6">
        <SyntaxHighlighter
          language="bash"
          style={atomOneDark}
          customStyle={{
            margin: 0,
            padding: '0.75rem',
            background: 'transparent',
            fontSize: 'inherit',
            lineHeight: 'inherit',
          }}
          wrapLongLines={false}
        >
          {queryString}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

interface FieldTableProps {
  title: string
  fields: Record<string, string>
}

function FieldTable({ title, fields }: FieldTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/40">
      <p className="border-b border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
        {title}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-slate-300">
              <th scope="col" className="px-3 py-2 font-semibold text-white">
                Campo
              </th>
              <th scope="col" className="px-3 py-2 font-semibold text-white">
                Descripción
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(fields).map(([field, description]) => (
              <tr key={field} className="border-b border-white/5 align-top last:border-b-0">
                <td className="px-3 py-2 font-mono text-xs text-indigo-200">{field}</td>
                <td className="px-3 py-2 text-slate-300">{description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

type EndpointIoTab = 'request' | 'response'

interface EndpointIoTabsProps {
  endpointKey: string
  queryParams?: EndpointPayloadDoc
  requestBody?: EndpointPayloadDoc
  response: EndpointResponseDoc
}

function EndpointIoTabs({ endpointKey, queryParams, requestBody, response }: EndpointIoTabsProps) {
  const shouldShowRequest = Boolean(queryParams || requestBody)
  const [manuallySelectedTab, setManuallySelectedTab] = useState<EndpointIoTab | null>(null)
  const activeTab = manuallySelectedTab ?? (shouldShowRequest ? 'request' : 'response')
  
  const baseId = `endpoint-${endpointKey.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`
  const requestTabId = `${baseId}-tab-request`
  const responseTabId = `${baseId}-tab-response`
  const requestPanelId = `${baseId}-panel-request`
  const responsePanelId = `${baseId}-panel-response`

  return (
    <section className="mt-4 space-y-4">
      <div
        role="tablist"
        aria-label="Detalle de request y response"
        className="inline-flex rounded-xl border border-white/10 bg-slate-900/60 p-1"
      >
        {shouldShowRequest ? (
          <button
            id={requestTabId}
            role="tab"
            type="button"
            aria-selected={activeTab === 'request'}
            aria-controls={requestPanelId}
            onClick={() => setManuallySelectedTab('request')}
            className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
              activeTab === 'request'
                ? 'bg-indigo-500 text-white'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            Request
          </button>
        ) : null}

        <button
          id={responseTabId}
          role="tab"
          type="button"
          aria-selected={activeTab === 'response'}
          aria-controls={responsePanelId}
          onClick={() => setManuallySelectedTab('response')}
          className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
            activeTab === 'response' ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          Response
        </button>
      </div>

      {shouldShowRequest ? (
        <div
          id={requestPanelId}
          role="tabpanel"
          aria-labelledby={requestTabId}
          hidden={activeTab !== 'request'}
          className="space-y-4"
        >
          {queryParams ? (
            <section className="grid gap-3 lg:grid-cols-2 lg:items-start">
              <FieldTable title="Query params - campos" fields={queryParams.fields} />
              <div className="space-y-3">
                {queryParams.examples.map(({ label, payload }) => (
                  <QueryStringPanel
                    key={label}
                    title={`Query params - ${label}`}
                    queryString={formatQueryString(payload)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {requestBody ? (
            <section className="grid gap-3 lg:grid-cols-2 lg:items-start">
              <FieldTable title="Request body - campos" fields={requestBody.fields} />
              <div className="space-y-3">
                {requestBody.examples.map(({ label, payload }) => (
                  <JsonPanel key={label} title={`Request body - ${label}`} data={payload} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      <div
        id={responsePanelId}
        role="tabpanel"
        aria-labelledby={responseTabId}
        hidden={activeTab !== 'response'}
        className="space-y-4"
      >
        <section className="grid gap-3 border-t border-white/10 pt-4 lg:grid-cols-2 lg:items-start">
            <FieldTable title="Response - campos" fields={response.fields} />
          <div className="space-y-3">
            {response.examples.map(({ label, payload }) => (
              <JsonPanel key={label} title={`Response - ${label}`} data={payload} />
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}

interface EndpointCatalogTabsProps {
  endpoints: EndpointDoc[]
}

function EndpointCatalogTabs({ endpoints }: EndpointCatalogTabsProps) {
  const [activeEndpointIndex, setActiveEndpointIndex] = useState(0)
  const activeEndpoint = endpoints[activeEndpointIndex]
  const endpointTablistId = 'endpoints-tablist'

  return (
    <section className="mt-10 space-y-4">
      <div
        id={endpointTablistId}
        role="tablist"
        aria-label="Endpoints disponibles"
        className="flex flex-wrap gap-2"
      >
        {endpoints.map(({ method, path, tabLabel }, index) => {
          const tabId = `endpoint-tab-${index}`
          const panelId = `endpoint-panel-${index}`
          const isActive = index === activeEndpointIndex

          return (
            <button
              key={path}
              id={tabId}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-controls={panelId}
              onClick={() => setActiveEndpointIndex(index)}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                isActive
                  ? 'border-indigo-400/60 bg-indigo-500/20 text-indigo-100'
                  : 'border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/20 hover:text-white'
              }`}
            >
              <span className="rounded-md border border-emerald-300/40 bg-emerald-400/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-200">
                {method}
              </span>
              <span>{tabLabel}</span>
            </button>
          )
        })}
      </div>

      <article
        id={`endpoint-panel-${activeEndpointIndex}`}
        role="tabpanel"
        aria-labelledby={`endpoint-tab-${activeEndpointIndex}`}
        className="rounded-2xl border border-white/10 bg-slate-950/70 p-6"
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex rounded-md border border-emerald-300/40 bg-emerald-400/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-emerald-200">
            {activeEndpoint.method}
          </span>
          <p className="font-mono text-sm text-indigo-200">{activeEndpoint.path}</p>
        </div>
        <p className="mt-3 text-sm leading-7 text-slate-300">{activeEndpoint.purpose}</p>

        <dl className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
          <div>
            <dt className="font-semibold text-white">Auth / sesión</dt>
            <dd>{activeEndpoint.auth}</dd>
          </div>
        </dl>

        <EndpointIoTabs
          key={activeEndpoint.path}
          endpointKey={activeEndpoint.path}
          queryParams={activeEndpoint.queryParams}
          requestBody={activeEndpoint.requestBody}
          response={activeEndpoint.response}
        />
      </article>
    </section>
  )
}

export default function DeveloperDocsPage() {
  const location = useLocation()

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: 'auto' })
      return
    }

    const targetId = decodeURIComponent(location.hash.slice(1))
    const target = document.getElementById(targetId)

    if (!target) {
      window.scrollTo({ top: 0, behavior: 'auto' })
      return
    }

    requestAnimationFrame(() => {
      target.scrollIntoView({ block: 'start', behavior: 'auto' })
    })
  }, [location.hash, location.pathname])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            state={{ scrollToTop: true }}
            className="inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-slate-200 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            <span aria-hidden="true">←</span>
            Volver al landing
          </Link>

          <nav aria-label="Secciones de la guía" className="hidden items-center gap-5 md:flex">
            <a
              href="#comparativa"
              className="text-sm text-slate-400 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Comparativa
            </a>
            <a
              href="#login-propio"
              className="text-sm text-slate-400 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Login propio
            </a>
            <a
              href="#login-integrado"
              className="text-sm text-slate-400 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Login integrado
            </a>
            <a
              href="#endpoints"
              className="text-sm text-slate-400 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Endpoints
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.24),_transparent_32%),linear-gradient(180deg,_rgba(15,23,42,1)_0%,_rgba(2,6,23,1)_100%)] px-4 py-20 sm:px-6 lg:px-8">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/70 to-transparent" />
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <span className="inline-flex rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-200">
                Documentación para desarrolladores
              </span>
              <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Integra KeyGo con tu propia pantalla o con un login central hospedado.
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
                El backend de KeyGo soporta Authorization Code + PKCE y entrega el authorization code en JSON.
                Desde ahí tienes dos caminos válidos: construir tu propio formulario de acceso o reutilizar una
                instancia de keygo-ui como login integrado para varias aplicaciones.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <a
                  href="#login-propio"
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  Ver integración con login propio
                </a>
                <a
                  href="#login-integrado"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-white/30 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  Ver login integrado de keygo-ui
                </a>
              </div>
            </div>

            <aside className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <h2 className="text-lg font-bold text-white">Antes de comenzar</h2>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
                {prerequisites.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-1 text-indigo-300" aria-hidden="true">
                      •
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <section id="comparativa" className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <span className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">
                Elige el modelo correcto
              </span>
              <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">
                La diferencia está en quién controla la pantalla y quién conserva el contexto OAuth2.
              </h2>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <article className="rounded-3xl border border-emerald-400/20 bg-emerald-500/5 p-7">
                <div className="inline-flex rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                  Login propio
                </div>
                <h3 className="mt-5 text-2xl font-bold text-white">Tu aplicación renderiza el formulario.</h3>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  Recomendado cuando necesitas branding propio, instrumentación de analytics, UX específica
                  o control fino sobre el tratamiento de errores antes del callback OAuth2.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-slate-300">
                  <li>Tu frontend genera PKCE, llama authorize, captura credenciales y canjea el code.</li>
                  <li>La cookie de sesión intermedia debe preservarse entre authorize y account/login.</li>
                  <li>Los tokens finales quedan íntegramente bajo tu aplicación cliente.</li>
                </ul>
              </article>

              <article className="rounded-3xl border border-indigo-400/20 bg-indigo-500/5 p-7">
                <div className="inline-flex rounded-full bg-indigo-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">
                  Login integrado de keygo-ui
                </div>
                <h3 className="mt-5 text-2xl font-bold text-white">keygo-ui hospeda la captura de credenciales.</h3>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  Recomendado cuando varias aplicaciones comparten la misma experiencia de acceso y quieres
                  centralizar el login sin transferir la propiedad de PKCE, state ni del canje final del code.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-slate-300">
                  <li>La app origen sigue siendo el cliente OAuth2 efectivo.</li>
                  <li>keygo-ui recibe tenantSlug, client_id, redirect_uri, scope, state y code_challenge.</li>
                  <li>La UI hospedada debe redirigir al callback origen con code y state, sin guardar tokens finales.</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section id="login-propio" className="border-y border-white/10 bg-slate-900/70 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl items-start gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <span className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Integración A
              </span>
              <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">Implementar un login propio</h2>
              <ol className="mt-8 space-y-5 text-sm leading-7 text-slate-300">
                <li>
                  <strong className="text-white">1. Genera PKCE y state.</strong> Crea un code_verifier por intento y deriva
                  el code_challenge con SHA-256.
                </li>
                <li>
                  <strong className="text-white">2. Llama a authorize.</strong> Usa tenantSlug, client_id y redirect_uri
                  de tu ClientApp real para iniciar la sesión HTTP intermedia.
                </li>
                <li>
                  <strong className="text-white">3. Envía credenciales al login.</strong> Reutiliza la misma sesión
                  HTTP para que KeyGo pueda emitir el authorization code en JSON.
                </li>
                <li>
                  <strong className="text-white">4. Canjea el code.</strong> Envía code_verifier y redirect_uri a
                  oauth2/token, luego valida el id_token y monta tu sesión local.
                </li>
              </ol>

              <div className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5 text-sm leading-7 text-emerald-50">
                Este modelo es el más directo si tu producto necesita un formulario a medida o si tu callback,
                tus métricas y tu almacenamiento de tokens viven completamente fuera de keygo-ui.
              </div>
            </div>

            <CodePanel title="Secuencia mínima con fetch" code={customLoginSnippet} />
          </div>
        </section>

        <section id="login-integrado" className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl items-start gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <span className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-300">
                Integración B
              </span>
              <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">
                Usar el login integrado de keygo-ui como hosted login
              </h2>
              <ol className="mt-8 space-y-5 text-sm leading-7 text-slate-300">
                <li>
                  <strong className="text-white">1. Genera PKCE y state en tu app origen.</strong> La aplicación que
                  protege la ruta sigue siendo responsable del contexto OAuth2 completo.
                </li>
                <li>
                  <strong className="text-white">2. Redirige al login hospedado.</strong> Envía tenantSlug, client_id,
                  redirect_uri, scope, state y code_challenge a tu despliegue de keygo-ui.
                </li>
                <li>
                  <strong className="text-white">3. keygo-ui autentica al usuario.</strong> La UI hospedada llama a
                  authorize y account/login usando el tenant y la ClientApp de la app origen.
                </li>
                <li>
                  <strong className="text-white">4. Tu callback recibe code y state.</strong> El canje final ocurre de
                  vuelta en tu aplicación, usando el code_verifier que guardaste antes del redirect.
                </li>
              </ol>

              <div className="mt-8 rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-5 text-sm leading-7 text-indigo-50">
                El backend ya soporta este patrón. Para exponerlo correctamente, tu instancia hospedada de keygo-ui
                debe aceptar esos parámetros en la URL del login y actuar solo como capa de presentación, no como
                propietaria de los tokens finales.
              </div>
            </div>

            <CodePanel title="Redirect hacia un login hospedado" code={hostedLoginSnippet} />
          </div>
        </section>

        <section id="endpoints" className="border-y border-white/10 bg-slate-900/70 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <span className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">
                Contrato mínimo
              </span>
              <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">
                Endpoints que toda integración debe dominar
              </h2>
            </div>

            <EndpointCatalogTabs endpoints={endpoints} />
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 rounded-3xl border border-white/10 bg-white/5 p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <span className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-300">
                Checklist de seguridad
              </span>
              <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-300">
                {securityChecks.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-1 text-rose-300" aria-hidden="true">
                      •
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                Ir al login de KeyGo
              </Link>
              <Link
                to="/"
                state={{ scrollToTop: true }}
                className="inline-flex items-center justify-center rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-white/30 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                Volver al landing
              </Link>
            </div>
          </div>
        </section>
      </main>

      <AppFooter variant="dark" />
      <ScrollToTop />
    </div>
  )
}
