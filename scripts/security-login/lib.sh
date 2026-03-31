#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd -- "$SCRIPT_DIR/../.." && pwd)"

REPORTS_DIR="$ROOT_DIR/tmp/security-login-reports"
mkdir -p "$REPORTS_DIR"

timestamp() {
  date '+%Y-%m-%d %H:%M:%S'
}

trim_trailing_slash() {
  local value="$1"
  echo "${value%/}"
}

load_env_file() {
  local env_file="$1"

  if [[ ! -f "$env_file" ]]; then
    echo "[ERROR] No existe el archivo de entorno: $env_file"
    return 1
  fi

  set -a
  # shellcheck disable=SC1090
  source "$env_file"
  set +a

  if [[ -z "${VITE_KEYGO_BASE:-}" || -z "${VITE_TENANT_SLUG:-}" || -z "${VITE_CLIENT_ID:-}" || -z "${VITE_REDIRECT_URI:-}" ]]; then
    echo "[ERROR] Faltan variables requeridas en $env_file"
    echo "        Requeridas: VITE_KEYGO_BASE, VITE_TENANT_SLUG, VITE_CLIENT_ID, VITE_REDIRECT_URI"
    return 1
  fi

  KEYGO_BASE="$(trim_trailing_slash "$VITE_KEYGO_BASE")"
  BASE="$KEYGO_BASE/api/v1"
  TENANT="$VITE_TENANT_SLUG"
  CLIENT_ID="$VITE_CLIENT_ID"
  REDIRECT_URI="$VITE_REDIRECT_URI"

  export KEYGO_BASE BASE TENANT CLIENT_ID REDIRECT_URI
}

ensure_credentials() {
  USER_OK="${USER_OK:-${SECURITY_USER_OK:-}}"
  PASS_OK="${PASS_OK:-${SECURITY_PASS_OK:-}}"

  if [[ -z "$USER_OK" ]]; then
    read -r -p "Usuario valido (USER_OK): " USER_OK
  fi

  if [[ -z "$PASS_OK" ]]; then
    read -r -s -p "Password valida (PASS_OK): " PASS_OK
    echo
  fi

  USER_BAD="${USER_BAD:-${SECURITY_USER_BAD:-noexiste@example.invalid}}"
  PASS_BAD="${PASS_BAD:-${SECURITY_PASS_BAD:-incorrecta123}}"

  export USER_OK PASS_OK USER_BAD PASS_BAD
}

setup_pkce_defaults() {
  CODE_CHALLENGE="${CODE_CHALLENGE:-${SECURITY_CODE_CHALLENGE:-bTO4kdrN4w5P8Qxj5QwB_g9ipdN7x0P9S4wKx7wN4VY}}"
  CODE_VERIFIER="${CODE_VERIFIER:-${SECURITY_CODE_VERIFIER:-qR7k9C0Qw9K0fXf3x6a8vB3nM2hA0vP4zJ1bM9uR2qY}}"
  STATE="${STATE:-${SECURITY_STATE:-state-lab-001}}"

  export CODE_CHALLENGE CODE_VERIFIER STATE
}

init_report() {
  local env_name="$1"
  local report_name="security-login-report-$(date '+%Y%m%d-%H%M%S')-${env_name}.md"
  REPORT_FILE="$REPORTS_DIR/$report_name"

  cat > "$REPORT_FILE" <<EOF
# Reporte de Pruebas de Seguridad de Login

- Fecha inicio: $(timestamp)
- Entorno: $env_name
- Base URL: $BASE
- Tenant: $TENANT
- Client ID: $CLIENT_ID
- Redirect URI: $REDIRECT_URI

## Resultados

| Caso | Estado | Detalle |
|---|---|---|
EOF

  export REPORT_FILE
}

append_report_result() {
  local case_id="$1"
  local status="$2"
  local detail="$3"

  printf '| %s | %s | %s |\n' "$case_id" "$status" "$detail" >> "$REPORT_FILE"
}

finish_report() {
  cat >> "$REPORT_FILE" <<EOF

## Cierre

- Fecha fin: $(timestamp)
EOF

  echo
  echo "Reporte generado: $REPORT_FILE"
}

print_context() {
  echo
  echo "Contexto cargado"
  echo "- BASE: $BASE"
  echo "- TENANT: $TENANT"
  echo "- CLIENT_ID: $CLIENT_ID"
  echo "- REDIRECT_URI: $REDIRECT_URI"
  echo
}

new_cookie_jar() {
  local name="$1"
  echo "$REPORTS_DIR/${name}-$(date '+%s').cookie"
}

curl_status_and_body() {
  local body_file="$1"
  shift
  curl -sS -o "$body_file" -w '%{http_code}' "$@"
}

is_rejected_response() {
  local status="$1"
  local body_file="$2"

  if [[ "$status" -ge 400 ]]; then
    return 0
  fi

  if grep -qi '"failure"' "$body_file"; then
    return 0
  fi

  return 1
}

extract_failure_message() {
  local body_file="$1"
  sed -n 's/.*"failure"[[:space:]]*:[[:space:]]*{[^}]*"message"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$body_file" | head -n 1
}

extract_authorization_code() {
  local body_file="$1"
  sed -n 's/.*"code"[[:space:]]*:[[:space:]]*"\([^"]\+\)".*/\1/p' "$body_file" | head -n 1
}
