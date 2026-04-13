# Plan de Pruebas de Seguridad — Login y Protección de Credenciales

> Fecha: 2026-03-31  
> Sistema objetivo: KeyGo Server + keygo-ui (OAuth2 Authorization Code + PKCE)

---

## 1. Objetivo

Validar que el flujo de login no permita autenticación indebida solo por conocer `tenantSlug`, y que resista intentos comunes de robo de credenciales o abuso de sesión.

Este plan cubre, como mínimo:

- Inicio de autorización (`/oauth2/authorize`).
- Captura de credenciales (`/account/login`).
- Intercambio de código y emisión de tokens (`/oauth2/token`).
- Superficie cliente (navegador) para fuga de secretos.

---

## 2. Alcance y reglas de ejecución

- Ejecutar solo en ambientes autorizados (dev/staging/lab), nunca contra producción sin aprobación explícita.
- Usar cuentas de prueba y tenants de prueba.
- No extraer ni persistir datos personales reales fuera del entorno controlado.
- Registrar evidencia reproducible: request, response, timestamp y resultado esperado/obtenido.

---

## 3. Prerrequisitos

- Tenant de prueba activo (ejemplo: `acme-lab`).
- ClientApp de prueba activa en ese tenant.
- `redirect_uri` registrada para esa ClientApp.
- Usuario de prueba con `membership` activa para la ClientApp.
- Usuario de prueba sin membership activa (caso negativo).
- Herramientas: navegador, DevTools, `curl` o Postman, y consola de logs backend.

Variables sugeridas:

```bash
BASE="http://localhost:8080/keygo-server/api/v1"
TENANT="acme-lab"
CLIENT_ID="acme-web"
REDIRECT_URI="http://localhost:5173/callback"
USER_OK="admin@acme.com"
PASS_OK="P@ssw0rdSeguro!"
```

---

## 4. Criterios de aprobación global

Se considera aprobado el flujo si:

- Ninguna prueba crítica permite obtener tokens sin credenciales válidas + contexto OAuth2 válido + PKCE válido.
- No hay filtración de credenciales/tokens en `localStorage`, logs frontend o parámetros inseguros.
- Las respuestas de error no facilitan enumeración de usuarios ni exposición de internals.

---

## 5. Casos de prueba prioritarios

## 5.1. Tenant/client/redirect (evitar autenticación solo por slug)

### T01 — Slug válido sin parámetros OAuth2 completos

- Riesgo: asumir que conocer `tenantSlug` basta para autenticarse.
- Pasos:
  1. Llamar `/oauth2/authorize` con `tenantSlug` pero sin `client_id` o sin `redirect_uri`.
- Esperado:
  1. Respuesta de error (4xx o `failure`), sin crear contexto utilizable.

### T02 — `client_id` inválido para el tenant

- Riesgo: uso de app no registrada.
- Pasos:
  1. Llamar `/oauth2/authorize` con `tenantSlug` válido y `client_id` inexistente.
- Esperado:
  1. Rechazo de autorización.

### T03 — `redirect_uri` no registrada

- Riesgo: open redirect / code leakage.
- Pasos:
  1. Llamar `/oauth2/authorize` con `redirect_uri` distinta a la registrada.
- Esperado:
  1. Rechazo de autorización.

### T04 — Cruce de tenant y client

- Riesgo: usar `client_id` de otro tenant con slug actual.
- Pasos:
  1. Usar `tenantSlug=A` y `client_id` perteneciente a `tenant=B`.
- Esperado:
  1. Rechazo de autorización.

---

## 5.2. Sesión intermedia authorize -> login

### T05 — Login sin authorize previo

- Riesgo: saltarse contexto OAuth2.
- Pasos:
  1. Invocar `POST /account/login` directamente.
- Esperado:
  1. Rechazo por sesión/contexto faltante.

### T06 — Login con cookie distinta a la sesión que inició authorize

- Riesgo: session fixation o secuestro de contexto.
- Pasos:
  1. Ejecutar authorize guardando cookie en `jar-A`.
  2. Ejecutar login con `jar-B`.
- Esperado:
  1. Rechazo de login por contexto inválido.

Ejemplo con `curl`:

```bash
# Paso 1: authorize con jar-A
curl -i -c jar-A.txt \
  "$BASE/tenants/$TENANT/oauth2/authorize?client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URI&scope=openid%20profile%20email&response_type=code&state=abc123&code_challenge=xyz&code_challenge_method=S256"

# Paso 2: login usando jar-B (debe fallar)
curl -i -b jar-B.txt -X POST \
  "$BASE/tenants/$TENANT/account/login" \
  -H "Content-Type: application/json" \
  -d '{"email_or_username":"'$USER_OK'","password":"'$PASS_OK'"}'
```

---

## 5.3. Credenciales y membership

### T07 — Usuario válido sin membership activa en la app

- Riesgo: autenticación fuera de alcance.
- Pasos:
  1. Login con usuario existente pero sin membership activa para esa ClientApp.
- Esperado:
  1. Rechazo de login.

### T08 — Enumeración de usuarios

- Riesgo: detectar qué usuarios existen por diferencias en mensajes.
- Pasos:
  1. Probar usuario inexistente.
  2. Probar usuario existente con contraseña incorrecta.
- Esperado:
  1. Mensaje equivalente para ambos casos (sin revelar existencia del usuario).

### T09 — Fuerza bruta / rate limiting

- Riesgo: intento masivo de credenciales.
- Pasos:
  1. Realizar múltiples intentos fallidos consecutivos.
- Esperado:
  1. Activación de controles (rate limit, bloqueo temporal, challenge adicional o latencia defensiva).

---

## 5.4. PKCE, state y authorization code

### T10 — Reuso de authorization code

- Riesgo: replay.
- Pasos:
  1. Completar login y obtener `code`.
  2. Canjear `code` una vez (éxito esperado).
  3. Repetir canje con el mismo `code`.
- Esperado:
  1. Segundo canje rechazado.

### T11 — `code_verifier` incorrecto

- Riesgo: bypass PKCE.
- Pasos:
  1. Obtener `code` válido.
  2. Llamar token con `code_verifier` incorrecto.
- Esperado:
  1. Rechazo del token.

### T12 — `redirect_uri` distinta en token

- Riesgo: sustitución de callback.
- Pasos:
  1. Hacer authorize/login con `redirect_uri` A.
  2. Hacer token con `redirect_uri` B.
- Esperado:
  1. Rechazo del token.

### T13 — `state` alterado en callback

- Riesgo: CSRF/login injection.
- Pasos:
  1. Simular callback con `state` distinto al almacenado por cliente.
- Esperado:
  1. Cliente rechaza el callback y reinicia flujo.

---

## 5.5. Intentos de robo de credenciales y tokens

### T14 — Verificar almacenamiento inseguro en navegador

- Riesgo: exfiltración por XSS o extensión maliciosa.
- Pasos:
  1. Login exitoso.
  2. Revisar `localStorage`, `sessionStorage`, `indexedDB` y cookies legibles por JS.
- Esperado:
  1. No hay `access_token` ni `id_token` en `localStorage`.
  2. `refresh_token` solo donde el diseño lo permita.

### T15 — Exposición en logs frontend

- Riesgo: credenciales/tokens visibles en consola.
- Pasos:
  1. Ejecutar flujo completo con DevTools abierto.
- Esperado:
  1. No se imprime `password`, `access_token`, `id_token`, `refresh_token`, `code_verifier` en logs.

### T16 — Autocompletado y gestión de contraseña

- Riesgo: UX insegura o bloqueo de gestor de contraseñas.
- Pasos:
  1. Revisar input de password con password manager.
- Esperado:
  1. Campo usa `autocomplete="current-password"` en login.

### T17 — Transporte seguro

- Riesgo: interceptación en tránsito.
- Pasos:
  1. Revisar entorno de despliegue.
- Esperado:
  1. Solo HTTPS en ambientes no locales.
  2. Cookies de sesión con flags seguros según entorno (`Secure`, `HttpOnly`, `SameSite`).

---

## 5.6. CORS, CSRF y origen

### T18 — CORS restrictivo en endpoints sensibles

- Riesgo: abuso cross-origin.
- Pasos:
  1. Probar origen no permitido contra endpoints OAuth.
- Esperado:
  1. Origen rechazado por política CORS.

### T19 — Solicitud de login desde origen tercero

- Riesgo: CSRF/login CSRF.
- Pasos:
  1. Intentar request `POST /account/login` desde un sitio no confiable.
- Esperado:
  1. Controles de sesión + origen + cookies impiden completar el flujo.

---

## 6. Matriz de severidad

| Severidad | Criterio                                                         |
| --------- | ---------------------------------------------------------------- |
| Crítica   | Permite emitir tokens sin credenciales válidas o sin PKCE válido |
| Alta      | Permite robo de credenciales/tokens o secuestro de sesión        |
| Media     | Facilita enumeración de usuarios o debilita defensas de abuso    |
| Baja      | Inconsistencia menor de hardening sin impacto directo inmediato  |

---

## 7. Formato de evidencia recomendado

Usar esta plantilla por caso:

```md
### Resultado TXX - <nombre>

- Fecha/hora:
- Ambiente:
- Request:
- Response (status + body):
- Resultado esperado:
- Resultado obtenido:
- Estado: PASS | FAIL
- Observaciones:
```

---

## 8. Acciones de remediación sugeridas (si falla una prueba)

- Fallas T01-T04: reforzar validación estricta tenant/client/redirect en authorize.
- Fallas T05-T06: reforzar acoplamiento sesión HTTP entre authorize y login.
- Fallas T10-T13: reforzar one-time code, validación PKCE y verificación estricta de `state`.
- Fallas T14-T17: eliminar exposición de secretos en frontend, endurecer storage, logs y headers.
- Fallas T18-T19: ajustar allowlist CORS, política de cookies y controles anti-CSRF.

---

## 9. Nota operativa

Este plan está orientado a pruebas defensivas de hardening. No reemplaza una auditoría externa formal ni un pentest de caja negra completo, pero sí cubre los riesgos más probables del flujo de login y robo de credenciales en una SPA OAuth2/PKCE.
