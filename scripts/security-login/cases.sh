#!/usr/bin/env bash

set -euo pipefail

# shellcheck disable=SC1091
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

run_case_t01() {
  local body status
  body="$(mktemp)"
  status="$(curl_status_and_body "$body" "$BASE/tenants/$TENANT/oauth2/authorize?redirect_uri=$REDIRECT_URI&response_type=code&scope=openid%20profile&state=$STATE&code_challenge=$CODE_CHALLENGE&code_challenge_method=S256")"

  if is_rejected_response "$status" "$body"; then
    append_report_result "T01" "PASS" "Authorize sin client_id rechazado"
    echo "[PASS] T01"
  else
    append_report_result "T01" "FAIL" "Authorize sin client_id no fue rechazado"
    echo "[FAIL] T01"
  fi

  rm -f "$body"
}

run_case_t02() {
  local body status
  body="$(mktemp)"
  status="$(curl_status_and_body "$body" "$BASE/tenants/$TENANT/oauth2/authorize?client_id=cliente-inexistente&redirect_uri=$REDIRECT_URI&response_type=code&scope=openid%20profile&state=$STATE&code_challenge=$CODE_CHALLENGE&code_challenge_method=S256")"

  if is_rejected_response "$status" "$body"; then
    append_report_result "T02" "PASS" "Authorize con client_id invalido rechazado"
    echo "[PASS] T02"
  else
    append_report_result "T02" "FAIL" "Authorize con client_id invalido no fue rechazado"
    echo "[FAIL] T02"
  fi

  rm -f "$body"
}

run_case_t03() {
  local body status
  body="$(mktemp)"
  status="$(curl_status_and_body "$body" "$BASE/tenants/$TENANT/oauth2/authorize?client_id=$CLIENT_ID&redirect_uri=https://attacker.example/callback&response_type=code&scope=openid%20profile&state=$STATE&code_challenge=$CODE_CHALLENGE&code_challenge_method=S256")"

  if is_rejected_response "$status" "$body"; then
    append_report_result "T03" "PASS" "Authorize con redirect_uri no registrada rechazado"
    echo "[PASS] T03"
  else
    append_report_result "T03" "FAIL" "Authorize con redirect_uri no registrada no fue rechazado"
    echo "[FAIL] T03"
  fi

  rm -f "$body"
}

run_case_t05() {
  local body status
  body="$(mktemp)"
  status="$(curl_status_and_body "$body" -X POST "$BASE/tenants/$TENANT/account/login" -H 'Content-Type: application/json' -d "{\"email_or_username\":\"$USER_OK\",\"password\":\"$PASS_OK\"}")"

  if is_rejected_response "$status" "$body"; then
    append_report_result "T05" "PASS" "Login sin authorize previo rechazado"
    echo "[PASS] T05"
  else
    append_report_result "T05" "FAIL" "Login sin authorize previo no fue rechazado"
    echo "[FAIL] T05"
  fi

  rm -f "$body"
}

run_case_t06() {
  local jar_a jar_b authorize_body login_body login_status
  jar_a="$(new_cookie_jar 't06-a')"
  jar_b="$(new_cookie_jar 't06-b')"
  authorize_body="$(mktemp)"
  login_body="$(mktemp)"

  curl_status_and_body "$authorize_body" -c "$jar_a" "$BASE/tenants/$TENANT/oauth2/authorize?client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URI&response_type=code&scope=openid%20profile&state=$STATE&code_challenge=$CODE_CHALLENGE&code_challenge_method=S256" >/dev/null

  login_status="$(curl_status_and_body "$login_body" -b "$jar_b" -X POST "$BASE/tenants/$TENANT/account/login" -H 'Content-Type: application/json' -d "{\"email_or_username\":\"$USER_OK\",\"password\":\"$PASS_OK\"}")"

  if is_rejected_response "$login_status" "$login_body"; then
    append_report_result "T06" "PASS" "Login con cookie distinta rechazado"
    echo "[PASS] T06"
  else
    append_report_result "T06" "FAIL" "Login con cookie distinta no fue rechazado"
    echo "[FAIL] T06"
  fi

  rm -f "$jar_a" "$jar_b" "$authorize_body" "$login_body"
}

run_case_t08() {
  local jar body_a body_b status_a status_b msg_a msg_b
  jar="$(new_cookie_jar 't08')"
  body_a="$(mktemp)"
  body_b="$(mktemp)"

  curl_status_and_body /dev/null -c "$jar" "$BASE/tenants/$TENANT/oauth2/authorize?client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URI&response_type=code&scope=openid%20profile&state=$STATE&code_challenge=$CODE_CHALLENGE&code_challenge_method=S256" >/dev/null

  status_a="$(curl_status_and_body "$body_a" -b "$jar" -X POST "$BASE/tenants/$TENANT/account/login" -H 'Content-Type: application/json' -d "{\"email_or_username\":\"$USER_BAD\",\"password\":\"$PASS_BAD\"}")"

  status_b="$(curl_status_and_body "$body_b" -b "$jar" -X POST "$BASE/tenants/$TENANT/account/login" -H 'Content-Type: application/json' -d "{\"email_or_username\":\"$USER_OK\",\"password\":\"$PASS_BAD\"}")"

  msg_a="$(extract_failure_message "$body_a")"
  msg_b="$(extract_failure_message "$body_b")"

  if is_rejected_response "$status_a" "$body_a" && is_rejected_response "$status_b" "$body_b" && [[ -n "$msg_a" && "$msg_a" == "$msg_b" ]]; then
    append_report_result "T08" "PASS" "Mensajes equivalentes para usuario inexistente vs password incorrecta"
    echo "[PASS] T08"
  else
    append_report_result "T08" "FAIL" "Posible enumeracion de usuarios (mensajes distintos o respuestas inconsistentes)"
    echo "[FAIL] T08"
  fi

  rm -f "$jar" "$body_a" "$body_b"
}

run_case_t10_t11_t12() {
  local jar auth_body login_body token_ok_body token_reuse_body token_pkce_body token_redirect_body
  local auth_status login_status token_ok_status token_reuse_status token_pkce_status token_redirect_status auth_code

  jar="$(new_cookie_jar 't10')"
  auth_body="$(mktemp)"
  login_body="$(mktemp)"
  token_ok_body="$(mktemp)"
  token_reuse_body="$(mktemp)"
  token_pkce_body="$(mktemp)"
  token_redirect_body="$(mktemp)"

  auth_status="$(curl_status_and_body "$auth_body" -c "$jar" "$BASE/tenants/$TENANT/oauth2/authorize?client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URI&response_type=code&scope=openid%20profile&state=$STATE&code_challenge=$CODE_CHALLENGE&code_challenge_method=S256")"

  if is_rejected_response "$auth_status" "$auth_body"; then
    append_report_result "T10" "FAIL" "No fue posible iniciar authorize para obtener code"
    append_report_result "T11" "FAIL" "No ejecutado por fallo previo de authorize"
    append_report_result "T12" "FAIL" "No ejecutado por fallo previo de authorize"
    echo "[FAIL] T10/T11/T12"
    rm -f "$jar" "$auth_body" "$login_body" "$token_ok_body" "$token_reuse_body" "$token_pkce_body" "$token_redirect_body"
    return
  fi

  login_status="$(curl_status_and_body "$login_body" -b "$jar" -X POST "$BASE/tenants/$TENANT/account/login" -H 'Content-Type: application/json' -d "{\"email_or_username\":\"$USER_OK\",\"password\":\"$PASS_OK\"}")"

  if is_rejected_response "$login_status" "$login_body"; then
    append_report_result "T10" "FAIL" "Login valido fue rechazado; no se obtuvo code"
    append_report_result "T11" "FAIL" "No ejecutado por fallo previo de login"
    append_report_result "T12" "FAIL" "No ejecutado por fallo previo de login"
    echo "[FAIL] T10/T11/T12"
    rm -f "$jar" "$auth_body" "$login_body" "$token_ok_body" "$token_reuse_body" "$token_pkce_body" "$token_redirect_body"
    return
  fi

  auth_code="$(extract_authorization_code "$login_body")"
  if [[ -z "$auth_code" ]]; then
    append_report_result "T10" "FAIL" "No se pudo extraer authorization code desde login"
    append_report_result "T11" "FAIL" "No ejecutado por falta de code"
    append_report_result "T12" "FAIL" "No ejecutado por falta de code"
    echo "[FAIL] T10/T11/T12"
    rm -f "$jar" "$auth_body" "$login_body" "$token_ok_body" "$token_reuse_body" "$token_pkce_body" "$token_redirect_body"
    return
  fi

  token_ok_status="$(curl_status_and_body "$token_ok_body" -X POST "$BASE/tenants/$TENANT/oauth2/token" -H 'Content-Type: application/json' -d "{\"grant_type\":\"authorization_code\",\"client_id\":\"$CLIENT_ID\",\"code\":\"$auth_code\",\"code_verifier\":\"$CODE_VERIFIER\",\"redirect_uri\":\"$REDIRECT_URI\"}")"

  token_reuse_status="$(curl_status_and_body "$token_reuse_body" -X POST "$BASE/tenants/$TENANT/oauth2/token" -H 'Content-Type: application/json' -d "{\"grant_type\":\"authorization_code\",\"client_id\":\"$CLIENT_ID\",\"code\":\"$auth_code\",\"code_verifier\":\"$CODE_VERIFIER\",\"redirect_uri\":\"$REDIRECT_URI\"}")"

  token_pkce_status="$(curl_status_and_body "$token_pkce_body" -X POST "$BASE/tenants/$TENANT/oauth2/token" -H 'Content-Type: application/json' -d "{\"grant_type\":\"authorization_code\",\"client_id\":\"$CLIENT_ID\",\"code\":\"$auth_code\",\"code_verifier\":\"verifier-incorrecto\",\"redirect_uri\":\"$REDIRECT_URI\"}")"

  token_redirect_status="$(curl_status_and_body "$token_redirect_body" -X POST "$BASE/tenants/$TENANT/oauth2/token" -H 'Content-Type: application/json' -d "{\"grant_type\":\"authorization_code\",\"client_id\":\"$CLIENT_ID\",\"code\":\"$auth_code\",\"code_verifier\":\"$CODE_VERIFIER\",\"redirect_uri\":\"https://attacker.example/callback\"}")"

  if is_rejected_response "$token_reuse_status" "$token_reuse_body"; then
    append_report_result "T10" "PASS" "Reuso de authorization code rechazado"
    echo "[PASS] T10"
  else
    append_report_result "T10" "FAIL" "Reuso de authorization code no fue rechazado"
    echo "[FAIL] T10"
  fi

  if is_rejected_response "$token_pkce_status" "$token_pkce_body"; then
    append_report_result "T11" "PASS" "Token con code_verifier invalido rechazado"
    echo "[PASS] T11"
  else
    append_report_result "T11" "FAIL" "Token con code_verifier invalido no fue rechazado"
    echo "[FAIL] T11"
  fi

  if is_rejected_response "$token_redirect_status" "$token_redirect_body"; then
    append_report_result "T12" "PASS" "Token con redirect_uri inconsistente rechazado"
    echo "[PASS] T12"
  else
    append_report_result "T12" "FAIL" "Token con redirect_uri inconsistente no fue rechazado"
    echo "[FAIL] T12"
  fi

  if is_rejected_response "$token_ok_status" "$token_ok_body"; then
    append_report_result "CTRL-AUTH" "WARN" "Control positivo no emitio tokens; revisar credenciales o PKCE"
  fi

  rm -f "$jar" "$auth_body" "$login_body" "$token_ok_body" "$token_reuse_body" "$token_pkce_body" "$token_redirect_body"
}

run_all_automated_cases() {
  run_case_t01
  run_case_t02
  run_case_t03
  run_case_t05
  run_case_t06
  run_case_t08
  run_case_t10_t11_t12
}
