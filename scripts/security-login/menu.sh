#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/lib.sh"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/cases.sh"

choose_env_file() {
  local options labels env_file selection

  options=(
    "$ROOT_DIR/.env.development"
    "$ROOT_DIR/.env.staging"
    "$ROOT_DIR/.env.production"
    "$ROOT_DIR/.env.local"
    "CUSTOM"
  )

  labels=(
    ".env.development"
    ".env.staging"
    ".env.production"
    ".env.local"
    "Ruta personalizada"
  )

  echo
  echo "Selecciona archivo de entorno:"
  local i
  for i in "${!labels[@]}"; do
    printf '  %d) %s\n' "$((i + 1))" "${labels[$i]}"
  done

  read -r -p "Opcion: " selection

  if ! [[ "$selection" =~ ^[1-5]$ ]]; then
    echo "[ERROR] Opcion invalida"
    return 1
  fi

  env_file="${options[$((selection - 1))]}"

  if [[ "$env_file" == "CUSTOM" ]]; then
    read -r -p "Ruta absoluta del .env: " env_file
  fi

  load_env_file "$env_file"
  ENV_NAME="$(basename "$env_file")"
  export ENV_NAME
}

confirm_non_local_env() {
  if [[ "$ENV_NAME" == ".env.production" || "$ENV_NAME" == ".env.staging" ]]; then
    echo
    read -r -p "Estas en $ENV_NAME. Confirmas pruebas defensivas controladas? (yes/no): " answer
    if [[ "$answer" != "yes" ]]; then
      echo "Operacion cancelada por seguridad."
      exit 0
    fi
  fi
}

show_menu() {
  echo
  echo "=== Security Login Test Menu ==="
  echo "1) Ejecutar TODOS los casos automatizados"
  echo "2) Ejecutar bloque tenant/client/redirect (T01-T03)"
  echo "3) Ejecutar bloque sesion intermedia (T05-T06)"
  echo "4) Ejecutar bloque enumeracion (T08)"
  echo "5) Ejecutar bloque PKCE/code/redirect (T10-T12)"
  echo "6) Ejecutar un caso puntual"
  echo "7) Salir"
}

run_single_case_menu() {
  echo
  echo "Casos disponibles: T01 T02 T03 T05 T06 T08 T10"
  read -r -p "Ingresa ID de caso: " case_id
  case "$case_id" in
    T01) run_case_t01 ;;
    T02) run_case_t02 ;;
    T03) run_case_t03 ;;
    T05) run_case_t05 ;;
    T06) run_case_t06 ;;
    T08) run_case_t08 ;;
    T10) run_case_t10_t11_t12 ;;
    *)
      echo "[ERROR] Caso no soportado"
      ;;
  esac
}

main() {
  echo "Sistema de Pruebas de Seguridad de Login (OAuth2/PKCE)"

  choose_env_file
  confirm_non_local_env
  ensure_credentials
  setup_pkce_defaults
  print_context
  init_report "$ENV_NAME"

  while true; do
    show_menu
    read -r -p "Selecciona una opcion: " option

    case "$option" in
      1)
        run_all_automated_cases
        ;;
      2)
        run_case_t01
        run_case_t02
        run_case_t03
        ;;
      3)
        run_case_t05
        run_case_t06
        ;;
      4)
        run_case_t08
        ;;
      5)
        run_case_t10_t11_t12
        ;;
      6)
        run_single_case_menu
        ;;
      7)
        finish_report
        exit 0
        ;;
      *)
        echo "[ERROR] Opcion invalida"
        ;;
    esac
  done
}

main "$@"
