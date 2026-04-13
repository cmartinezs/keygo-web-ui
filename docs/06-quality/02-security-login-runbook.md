# Runbook Ejecutable — Pruebas de Seguridad de Login

> Fecha: 2026-03-31  
> Basado en: `docs/06-quality/01-security-login-test-plan.md`

---

## 1. Uso rápido

1. Configurar variables del ambiente.
2. Ejecutar cada bloque de prueba en orden.
3. Marcar `PASS` o `FAIL` según el resultado esperado.
4. Registrar evidencia usando la plantilla final.

Este runbook prioriza validaciones de abuso en OAuth2/PKCE y protección de credenciales.

### Opción recomendada: suite automatizada con menú

Este repositorio incluye scripts para ejecutar los casos automatizables desde un menú central.

```bash
./scripts/security-login.sh
```

Flujo del menú:

1. Seleccionar archivo de entorno (`.env.development`, `.env.staging`, `.env.production`, `.env.local` o personalizado).
2. Cargar credenciales de prueba (`USER_OK`, `PASS_OK`) por prompt o variables de entorno.
3. Ejecutar todos los casos o bloques específicos.
4. Obtener reporte automático en `tmp/security-login-reports/`.

Variables opcionales para evitar prompts:

```bash
export SECURITY_USER_OK="admin@acme.com"
export SECURITY_PASS_OK="P@ssw0rdSeguro!"
export SECURITY_USER_BAD="noexiste@example.invalid"
export SECURITY_PASS_BAD="incorrecta123"

./scripts/security-login.sh
```

---

## 2. Variables base

```bash
# Ajustar según entorno
BASE="http://localhost:8080/keygo-server/api/v1"
TENANT="acme-lab"
CLIENT_ID="acme-web"
REDIRECT_URI="http://localhost:5173/callback"

# Usuario válido con membership activa
USER_OK="admin@acme.com"
PASS_OK="P@ssw0rdSeguro!"

# Usuario inválido o inexistente para pruebas negativas
USER_BAD="noexiste@acme.com"
PASS_BAD="incorrecta123"

# PKCE de prueba (valor placeholder)
CODE_CHALLENGE="bTO4kdrN4w5P8Qxj5QwB_g9ipdN7x0P9S4wKx7wN4VY"
CODE_VERIFIER="qR7k9C0Qw9K0fXf3x6a8vB3nM2hA0vP4zJ1bM9uR2qY"
STATE="state-lab-001"
```

Limpieza sugerida entre casos:

```bash
rm -f jar-A.txt jar-B.txt jar-main.txt
```

---

## 3. Pruebas ejecutables

## 3.1 T01 - Authorize sin `client_id`

```bash
curl -i \
  "$BASE/tenants/$TENANT/oauth2/authorize?redirect_uri=$REDIRECT_URI&response_type=code&scope=openid%20profile&state=$STATE&code_challenge=$CODE_CHALLENGE&code_challenge_method=S256"
```

Esperado: rechazo (4xx o `failure`), sin contexto usable.

## 3.2 T02 - Authorize con `client_id` inválido

```bash
curl -i \
  "$BASE/tenants/$TENANT/oauth2/authorize?client_id=cliente-inexistente&redirect_uri=$REDIRECT_URI&response_type=code&scope=openid%20profile&state=$STATE&code_challenge=$CODE_CHALLENGE&code_challenge_method=S256"
```

Esperado: rechazo de autorización.

## 3.3 T03 - Authorize con `redirect_uri` no registrada

```bash
curl -i \
  "$BASE/tenants/$TENANT/oauth2/authorize?client_id=$CLIENT_ID&redirect_uri=https://attacker.example/callback&response_type=code&scope=openid%20profile&state=$STATE&code_challenge=$CODE_CHALLENGE&code_challenge_method=S256"
```

Esperado: rechazo de autorización.

## 3.4 T05 - Login sin authorize previo

```bash
curl -i -X POST \
  "$BASE/tenants/$TENANT/account/login" \
  -H "Content-Type: application/json" \
  -d '{"email_or_username":"'$USER_OK'","password":"'$PASS_OK'"}'
```

Esperado: rechazo por contexto/sesión faltante.

## 3.5 T06 - Login con cookie distinta

```bash
# 1) Crear sesión A vía authorize
curl -i -c jar-A.txt \
  "$BASE/tenants/$TENANT/oauth2/authorize?client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URI&response_type=code&scope=openid%20profile&state=$STATE&code_challenge=$CODE_CHALLENGE&code_challenge_method=S256"

# 2) Intentar login con sesión B (vacía o distinta)
curl -i -b jar-B.txt -X POST \
  "$BASE/tenants/$TENANT/account/login" \
  -H "Content-Type: application/json" \
  -d '{"email_or_username":"'$USER_OK'","password":"'$PASS_OK'"}'
```

Esperado: rechazo de login por no reutilizar la sesión HTTP correcta.

## 3.6 T08 - Enumeración de usuarios (mensajes)

```bash
# Usuario inexistente
curl -s -i -c jar-main.txt \
  "$BASE/tenants/$TENANT/oauth2/authorize?client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URI&response_type=code&scope=openid%20profile&state=$STATE&code_challenge=$CODE_CHALLENGE&code_challenge_method=S256"

curl -s -i -b jar-main.txt -X POST \
  "$BASE/tenants/$TENANT/account/login" \
  -H "Content-Type: application/json" \
  -d '{"email_or_username":"'$USER_BAD'","password":"'$PASS_BAD'"}'
```

Repetir con usuario real + contraseña incorrecta y comparar respuestas.

Esperado: mensaje equivalente sin revelar si el usuario existe.

## 3.7 T10 + T11 + T12 - Reuso de code / PKCE inválido / redirect inconsistente

Paso A: obtener `code` válido (usa sesión y credenciales correctas).

```bash
# Authorize
curl -s -i -c jar-main.txt \
  "$BASE/tenants/$TENANT/oauth2/authorize?client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URI&response_type=code&scope=openid%20profile&state=$STATE&code_challenge=$CODE_CHALLENGE&code_challenge_method=S256" > /tmp/auth.out

# Login
curl -s -b jar-main.txt -X POST \
  "$BASE/tenants/$TENANT/account/login" \
  -H "Content-Type: application/json" \
  -d '{"email_or_username":"'$USER_OK'","password":"'$PASS_OK'"}'
```

Guardar el `data.code` devuelto como `AUTH_CODE`.

Paso B: canje correcto (control positivo).

```bash
AUTH_CODE="<code_obtenido>"

curl -i -X POST \
  "$BASE/tenants/$TENANT/oauth2/token" \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type":"authorization_code",
    "client_id":"'$CLIENT_ID'",
    "code":"'$AUTH_CODE'",
    "code_verifier":"'$CODE_VERIFIER'",
    "redirect_uri":"'$REDIRECT_URI'"
  }'
```

Paso C: reuso de `AUTH_CODE`.

```bash
curl -i -X POST \
  "$BASE/tenants/$TENANT/oauth2/token" \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type":"authorization_code",
    "client_id":"'$CLIENT_ID'",
    "code":"'$AUTH_CODE'",
    "code_verifier":"'$CODE_VERIFIER'",
    "redirect_uri":"'$REDIRECT_URI'"
  }'
```

Esperado: segundo canje rechazado.

Paso D: PKCE inválido.

```bash
curl -i -X POST \
  "$BASE/tenants/$TENANT/oauth2/token" \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type":"authorization_code",
    "client_id":"'$CLIENT_ID'",
    "code":"'$AUTH_CODE'",
    "code_verifier":"verifier-incorrecto",
    "redirect_uri":"'$REDIRECT_URI'"
  }'
```

Esperado: rechazo del token.

Paso E: redirect URI inconsistente.

```bash
curl -i -X POST \
  "$BASE/tenants/$TENANT/oauth2/token" \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type":"authorization_code",
    "client_id":"'$CLIENT_ID'",
    "code":"'$AUTH_CODE'",
    "code_verifier":"'$CODE_VERIFIER'",
    "redirect_uri":"https://attacker.example/callback"
  }'
```

Esperado: rechazo del token.

---

## 4. Verificación manual en navegador (robo de credenciales/tokens)

## 4.1 T14 - Storage

En DevTools > Application:

- Revisar `localStorage`, `sessionStorage`, `IndexedDB` y cookies.
- Esperado: no exponer `access_token` ni `id_token` en `localStorage`.

## 4.2 T15 - Logs sensibles

En DevTools > Console:

- Ejecutar login completo.
- Esperado: no imprimir password, tokens o PKCE verifier.

## 4.3 T16 - Campo password

En formulario login:

- Confirmar atributo `autocomplete="current-password"`.
- Validar compatibilidad con gestor de contraseñas.

---

## 5. Registro PASS/FAIL

| Caso | Estado    | Evidencia (archivo o link interno) | Observación |
| ---- | --------- | ---------------------------------- | ----------- |
| T01  | PENDIENTE |                                    |             |
| T02  | PENDIENTE |                                    |             |
| T03  | PENDIENTE |                                    |             |
| T05  | PENDIENTE |                                    |             |
| T06  | PENDIENTE |                                    |             |
| T08  | PENDIENTE |                                    |             |
| T10  | PENDIENTE |                                    |             |
| T11  | PENDIENTE |                                    |             |
| T12  | PENDIENTE |                                    |             |
| T14  | PENDIENTE |                                    |             |
| T15  | PENDIENTE |                                    |             |
| T16  | PENDIENTE |                                    |             |

---

## 6. Plantilla de reporte

```md
### Resultado <ID-CASO>

- Fecha/hora:
- Ambiente:
- Comando ejecutado:
- Response (status + body resumido):
- Resultado esperado:
- Resultado obtenido:
- Estado: PASS | FAIL
- Severidad (si falla): Crítica | Alta | Media | Baja
- Acción sugerida:
```

---

## 7. Criterio de escalamiento

Escalar inmediatamente a backend + seguridad cuando:

- Se emiten tokens sin PKCE válido o sin credenciales válidas.
- Se acepta canje repetido del mismo authorization code.
- Se detecta filtración de credenciales/tokens en logs o storage no permitido.
- Existen diferencias de error que permitan enumeración de usuarios a gran escala.
