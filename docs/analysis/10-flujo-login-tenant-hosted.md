# 10 — Flujo de Login para Tenant Apps: Análisis y Estándar de Industria

> Cómo KeyGo UI debe funcionar como **Hosted Login** (login central) para aplicaciones de terceros.

---

## Tu planteamiento (reformulado)

> "KeyGo UI tiene un login para sí mismo. Hay que preparar otro para los tenants: cuando una app de un tenant necesita autenticación, debe redirigir a KeyGo, el usuario se autentica, y KeyGo redirige de vuelta al callback de la app con el authorization code."

**Veredicto: tu planteamiento es correcto y se alinea con el estándar de la industria.** Solo necesita precisiones sobre qué actor hace cada redirect. A continuación el análisis detallado.

---

## Estándar de la industria: comparativa de IdPs

Antes de profundizar, veamos cómo resuelven esto los IdPs más importantes:

| IdP | Modelo de login | ¿Backend hace 302? | ¿UI separada? |
|-----|-----------------|---------------------|---------------|
| **Auth0** | Universal Login Page (hosted SPA) | No — el `/authorize` redirige a la *login page*, que es una SPA alojada | Sí — la UI de login es una app separada del backend |
| **Okta** | Sign-In Widget (embedded o hosted) | No — el widget orquesta la API, luego redirige al callback | Sí — el widget es JS independiente |
| **Keycloak** | Server-rendered login | Sí — el endpoint `/auth` renderiza la página y luego hace 302 al callback | No — el backend genera el HTML |
| **Google/GitHub** | Server-rendered | Sí — `/authorize` responde con 302 a la página de login, luego 302 al callback | No — todo es server-side |
| **Firebase Auth** | Client SDK + hosted UI | No — el SDK de frontend maneja todo vía llamadas API | Sí — FirebaseUI es una librería de UI |

**Patrón dominante en el mercado moderno:** El IdP provee una **UI de login separada** (SPA o widget) que orquesta el flujo vía API y luego redirige al callback del cliente. El backend NO necesita hacer 302.

**KeyGo encaja perfectamente en este patrón** — es el modelo Auth0/Okta.

---

## Los dos modos de login que necesita KeyGo UI

### Modo 1: Login propio de KeyGo ("first-party")

KeyGo UI autenticándose a sí misma. Esto ya existe.

```
┌──────────────────┐         ┌──────────────┐
│   KeyGo UI       │         │ KeyGo Server │
│  (SPA, puerto    │         │  (Backend)   │
│   5173)          │         │              │
└───────┬──────────┘         └──────┬───────┘
        │                           │
   1. Genera PKCE                   │
   2. GET /platform/oauth2/authorize ──►
        │◄── 200 JSON (session_id)  │
   3. Muestra formulario            │
   4. POST /platform/account/login ─►
        │◄── 200 JSON (code)        │
   5. POST /platform/oauth2/token ──►
        │◄── 200 JSON (tokens)      │
   6. Guarda tokens en Zustand      │
   7. Navega a /admin/dashboard     │
```

**Identidad:** `platform_users`  
**JWT:** roles de plataforma (`keygo_admin`, `keygo_tenant_admin`)  
**Resultado:** La SPA guarda los tokens y navega internamente.

### Modo 2: Login hospedado para tenant apps ("hosted login")

Una app externa de un tenant redirige a KeyGo UI para que el usuario se autentique. KeyGo UI actúa como intermediario de presentación.

```
┌──────────────┐    ┌──────────────────┐    ┌──────────────┐
│  App Tenant   │    │   KeyGo UI       │    │ KeyGo Server │
│  (acme.com)   │    │  (hosted login)  │    │  (Backend)   │
└──────┬────────┘    └───────┬──────────┘    └──────┬───────┘
       │                     │                      │
  1. Usuario clica           │                      │
     "Iniciar sesión"        │                      │
       │                     │                      │
  2. App genera PKCE         │                      │
     (code_verifier,         │                      │
      code_challenge,        │                      │
      state)                 │                      │
       │                     │                      │
  3. Redirect (302 o ────────►                      │
     window.location)        │                      │
     GET /login?             │                      │
       tenantSlug=acme&      │                      │
       client_id=storefront& │                      │
       redirect_uri=https://acme.com/callback&      │
       scope=openid+profile& │                      │
       state=abc123&         │                      │
       code_challenge=xyz&   │                      │
       code_challenge_method=S256                   │
       │                     │                      │
       │              4. KeyGo UI detecta           │
       │                 parámetros de hosted login  │
       │                     │                      │
       │              5. GET /tenants/acme/oauth2/authorize ──►
       │                     │◄── 200 JSON          │
       │                     │   (session_id)       │
       │                     │                      │
       │              6. Muestra formulario          │
       │                 "Entrar a ACME Store"       │
       │                     │                      │
       │              7. POST /tenants/acme/account/login ───►
       │                     │◄── 200 JSON (code)   │
       │                     │                      │
       │              8. KeyGo UI NO guarda tokens   │
       │                 NO canjea el code           │
       │                     │                      │
       │◄──────────── 9. Redirect al callback       │
       │              window.location.assign(        │
       │              "https://acme.com/callback     │
       │               ?code=AUTH_CODE               │
       │               &state=abc123")               │
       │                     │                      │
  10. App valida state        │                      │
  11. Recupera code_verifier  │                      │
  12. POST /tenants/acme/oauth2/token ──────────────►
       │◄────────────────── 200 JSON (tokens)       │
  13. App guarda tokens       │                      │
  14. Navega a su dashboard   │                      │
```

**Identidad:** `tenant_users` (dentro del tenant de la app)  
**JWT:** roles de membresía (`admin_tenant`, `user_tenant`)  
**Resultado:** La app origen recibe el code y canjea los tokens por su cuenta.

---

## Correcciones a tu planteamiento original

| Lo que dijiste | Corrección/Precisión |
|----------------|---------------------|
| "el backend deberá redireccionar a la página de login tenant de keygo" | **No es el backend quien hace el redirect.** Es la **app del tenant** la que redirige al usuario hacia KeyGo UI. El backend de KeyGo no emite 302 en ningún punto — responde siempre con 200 + JSON. Este es el patrón Auth0/Okta, no Keycloak/Google. |
| "cuando las credenciales del usuario sean validadas, el backend debe redireccionar al callback url del tenant" | **El redirect lo hace KeyGo UI, no el backend.** Después de que `POST /account/login` devuelve `{code, redirect_uri}` en JSON, es la **SPA de KeyGo** la que ejecuta `window.location.assign(redirect_uri + '?code=...')`. El backend nunca emite 302. |
| "y que este retome el flujo" | ✅ **Correcto.** La app del tenant retoma el flujo al recibir el `code` en su callback, valida `state`, y canjea el code por tokens llamando directamente al backend de KeyGo. |

### ¿Por qué el backend NO hace 302?

Porque el modelo actual de KeyGo Server está diseñado como **API pura** (JSON in, JSON out):

1. `GET /oauth2/authorize` → devuelve 200 + JSON (no 302 a login page)
2. `POST /account/login` → devuelve 200 + JSON con `code` (no 302 a callback)
3. `POST /oauth2/token` → devuelve 200 + JSON con tokens

Esto es **correcto y moderno**. Es el mismo patrón que Auth0 y Okta usan internamente. La ventaja: el frontend tiene control total sobre la UX (loading states, errores inline, animaciones, branding), en lugar de depender de redirects del servidor.

---

## ¿Qué necesita KeyGo UI para soportar hosted login?

### 1. Nueva ruta: `/login` con detección de parámetros

La página de login actual ya existe en `/login`. Necesita detectar si hay parámetros de hosted login:

```tsx
// Pseudocódigo — la lógica de decisión
function LoginPage() {
  const params = useSearchParams()
  
  // ¿Tiene parámetros de hosted login?
  const isHostedLogin = params.has('tenantSlug') 
    && params.has('client_id') 
    && params.has('redirect_uri')
  
  if (isHostedLogin) {
    // Modo hosted: usar parámetros del query string
    // NO guardar tokens al final — redirigir al callback
    return <HostedLoginFlow params={params} />
  }
  
  // Modo propio: usar config de env (VITE_TENANT_SLUG, VITE_CLIENT_ID)
  // Guardar tokens en Zustand al final
  return <PlatformLoginFlow />
}
```

### 2. Lógica diferenciada según el modo

| Aspecto | Login propio (platform) | Hosted login (tenant app) |
|---------|------------------------|---------------------------|
| **Endpoint authorize** | `/platform/oauth2/authorize` | `/tenants/{slug}/oauth2/authorize` |
| **Endpoint login** | `/platform/account/login` | `/tenants/{slug}/account/login` |
| **Endpoint token** | `/platform/oauth2/token` (SPA lo hace) | La app origen lo hace, no KeyGo UI |
| **client_id** | `env.CLIENT_ID` (hardcoded de KeyGo UI) | Parámetro recibido del query string |
| **redirect_uri** | `env.REDIRECT_URI` (callback local) | Parámetro recibido del query string |
| **PKCE** | KeyGo UI genera y mantiene | La app origen genera; KeyGo UI solo pasa el `code_challenge` al backend |
| **Después del login** | Canjear code → guardar tokens → navegar | Redirigir a `redirect_uri?code=...&state=...` |
| **Tokens finales** | KeyGo UI los guarda en Zustand | KeyGo UI NUNCA toca los tokens finales |

### 3. UX del hosted login

La pantalla de login hospedado debería:

- Mostrar el nombre de la app destino ("Entrar a **ACME Store**")
- Opcionalmente mostrar el logo del tenant (si existe metadata)
- Usar el mismo formulario de credenciales (email/usuario + password)
- Mostrar errores inline como el login propio
- NO mostrar opciones de "Registrarse en KeyGo" ni "Recuperar contraseña de plataforma" — el contexto es el tenant

### 4. Seguridad del hosted login

- **Nunca modificar** `tenantSlug`, `client_id`, `redirect_uri` o `state` — pasarlos tal cual al backend
- **No almacenar** el `code_verifier` — la app origen lo mantiene
- **No canjear** el code — solo redirigir con `code` + `state` al callback
- **Validar** que el backend no rechazó los parámetros en el paso de authorize (si 400 → mostrar error, no redirigir)
- **Cross-origin cookies**: si KeyGo UI y KeyGo Server están en distintos dominios, configurar `SameSite=None; Secure` y `withCredentials: true`

---

## Dónde encaja en la estructura propuesta

Con la reorganización feature-first:

```
src/features/auth/
  login/
    LoginPage.tsx             ← Detecta modo y renderiza el flujo correcto
    PlatformLoginFlow.tsx     ← Login propio de KeyGo (usa platform endpoints)
    HostedLoginFlow.tsx       ← Login hospedado para tenant apps
    components/
      LoginForm.tsx           ← Formulario compartido (email/pass)
      HostedLoginBanner.tsx   ← "Entrar a ACME Store"
    hooks/
      useHostedLoginParams.ts ← Parsea y valida query params del hosted login
      usePlatformAuth.ts      ← Flujo PKCE de plataforma
      useHostedAuth.ts        ← Flujo authorize+login para hosted (sin token exchange)
```

### Flujo de datos

```
App origen (acme.com)
  └─ genera PKCE + state
  └─ redirect → KeyGo UI /login?tenantSlug=acme&client_id=...

KeyGo UI /login
  └─ useHostedLoginParams() → detecta modo hosted
  └─ HostedLoginFlow
       └─ GET /tenants/acme/oauth2/authorize (con client_id + redirect_uri de params)
       └─ muestra LoginForm
       └─ POST /tenants/acme/account/login
       └─ recibe { code, redirect_uri, state }
       └─ window.location.assign(redirect_uri + ?code=...&state=...)

App origen (acme.com/callback)
  └─ valida state
  └─ POST /tenants/acme/oauth2/token (con code + code_verifier guardado)
  └─ recibe tokens → sesión activa
```

---

## Lo que ya está documentado

La buena noticia es que **AUTH_FLOW.md ya documenta este escenario completo** en la sección "Escenario recomendado: login central (KeyGo-UI) para múltiples tenants" (líneas 713–806). Incluye:

- ✅ Los 7 pasos de la secuencia
- ✅ Diagrama Mermaid del flujo
- ✅ Qué parámetros viajan desde la app origen
- ✅ Regla de oro: qué se comparte y qué no
- ✅ Ejemplo de URL
- ✅ Validaciones de seguridad

Además, **DeveloperDocsPage.tsx** ya documenta las dos integraciones:
- **Integración A:** Login propio (la app implementa su propio formulario)
- **Integración B:** Login integrado de keygo-ui como hosted login

---

## Lo que falta implementar en KeyGo UI

| Componente | Estado | Prioridad |
|-----------|--------|-----------|
| Detección de parámetros hosted login en `/login` | ❌ No existe | Alta |
| `HostedLoginFlow` (flujo sin token exchange, con redirect al callback) | ❌ No existe | Alta |
| `useHostedLoginParams` hook | ❌ No existe | Alta |
| Banner de branding del tenant ("Entrar a ACME Store") | ❌ No existe | Media |
| Ruta para platform login (`/platform/login` o detectar ausencia de params) | ❌ No existe (hoy usa tenant keygo) | Alta |
| Cross-origin cookie handling (si dominios distintos) | ⚠️ Parcial (`withCredentials` existe) | Media |
| Validación visual de errores del authorize con params externos | ❌ No existe | Media |

---

## Resumen

| Aspecto | Estado |
|---------|--------|
| **Estándar de industria** | ✅ El modelo Auth0/Okta — backend API puro + UI hosted que orquesta |
| **Backend preparado** | ✅ Todos los endpoints necesarios existen y responden JSON |
| **Documentación** | ✅ AUTH_FLOW.md y DeveloperDocsPage.tsx ya documentan el flujo |
| **Frontend implementado** | ❌ Solo existe el login propio de KeyGo; falta el modo hosted |
| **Tu planteamiento** | ✅ Correcto en concepto; solo ajustar quién hace cada redirect |

La implementación del hosted login es una de las piezas más importantes para que KeyGo funcione como IdP real. Afortunadamente, el backend ya soporta todo lo necesario y la documentación está completa — falta construir la UI.
