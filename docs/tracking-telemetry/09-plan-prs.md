# 09 - Plan de PRs

## Objetivo

Definir una secuencia de PRs pequena, segura y trazable para implementar tracking de usuario de alta granularidad en keygo-web-ui sin regresiones de UX ni seguridad.

## Supuestos

1. Retencion backend cerrada en 90 dias.
2. Envio periodico frontend cerrado en ventana 10 a 15 minutos.
3. Endpoint de lectura de auditoria global sigue pendiente (F-034).
4. El contrato de ingestion batch se define durante esta ejecucion por fases.

## Estrategia de Rama

1. Rama base sugerida: feat/tracking-telemetry.
2. Un PR por fase para facilitar revision y rollback.
3. Merge secuencial (PR1 -> PR2 -> PR3 -> PR4).

## PR1 - Base de tracking local (sin backend)

Objetivo:
- Crear infraestructura transversal de captura y cola local sin envio externo.

Alcance tecnico:
1. Crear modulo tracking (tipos, sanitizer, queue, scheduler local).
2. Integrar provider/listener en raiz de la app.
3. Integrar listener de navegacion y eventos base de auth.
4. Feature flag para activar/desactivar tracking por entorno.

Archivos objetivo (estimado):
- src/main.tsx
- src/App.tsx
- src/config/env.ts
- src/auth/refresh.ts
- src/auth/tokenStore.ts
- src/hooks/ (nuevo hook de tracking)
- src/types/ (tipos de evento)

Criterios de aceptacion:
1. Se generan eventos base en memoria.
2. No se capturan secretos ni tokens.
3. Si falla tracking, la app no se rompe.
4. Lint y tests unitarios de sanitizer/queue en verde.

Riesgos:
- Sobrecaptura inicial.
Mitigacion:
- Whitelist de campos y limites de cola.

Rollback:
- Desactivar flag de tracking sin revertir codigo.

## PR2 - Instrumentacion de flujos criticos

Objetivo:
- Capturar eventos de alto valor funcional sin cambiar comportamiento de negocio.

Alcance tecnico:
1. Login: attempt/success/failure/session restore.
2. Registro multi-step: step_transition, submit, verify_email, payment mock, activate.
3. Admin: dashboard refresh/filter, create/suspend/activate tenant.
4. Captura de outcomes API (success/failure clasificado).

Archivos objetivo (estimado):
- src/pages/login/LoginPage.tsx
- src/pages/register/NewContractPage.tsx
- src/pages/register/steps/*.tsx
- src/pages/admin/DashboardPage.tsx
- src/pages/admin/TenantCreatePage.tsx
- src/pages/admin/TenantDetailPage.tsx
- src/api/client.ts

Criterios de aceptacion:
1. Eventos criticos emitidos con metadata consistente.
2. Sin regresiones visuales ni de accesibilidad en componentes tocados.
3. Sin duplicacion excesiva de eventos en acciones repetidas.

Riesgos:
- Ruido de eventos por granularidad alta.
Mitigacion:
- Debounce por tipo y presupuesto de eventos por sesion.

Rollback:
- Desactivar solo familias de eventos via config sin revert total.

## PR3 - Envio batch al backend

Objetivo:
- Habilitar transporte periodico y resiliente hacia endpoint de ingestion.

Alcance tecnico:
1. Crear cliente API de telemetry batch.
2. Flush por tiempo (10 a 15 min) y por umbral de cola.
3. Retry con backoff y jitter.
4. Dedupe local por eventId.
5. Flush en cierre de pestana (sendBeacon/fallback).

Archivos objetivo (estimado):
- src/api/ (nuevo modulo telemetry)
- src/hooks/queue o servicio de transporte
- src/config/env.ts
- src/main.tsx o provider tracking

Criterios de aceptacion:
1. Lotes enviados y confirmados (accepted/ignored).
2. Reintentos acotados sin loops infinitos.
3. No perdida masiva en reconexion basica.

Riesgos:
- Contrato backend incompleto o cambiante.
Mitigacion:
- Versionado de schema de evento + capa adaptadora.

Rollback:
- Mantener captura local y apagar solo transporte remoto.

## PR4 - Hardening operativo y calidad de dato

Objetivo:
- Estabilizar operacion, costo y observabilidad del pipeline.

Alcance tecnico:
1. KPIs tecnicos (delivery, drop, duplicate, queue depth, flush latency).
2. Ajustes de muestreo/debounce para eventos de alta frecuencia.
3. Politica de descarte controlado y alertas de salud.
4. Playbook tecnico de incidentes de telemetria.

Archivos objetivo (estimado):
- docs/tracking-telemetry/07-verificacion-kpis.md
- docs/TECHNICAL_GUIDE.md
- Config y modulos de tracking afectados por tuning

Criterios de aceptacion:
1. KPIs en rango objetivo inicial.
2. Overhead del frontend controlado.
3. Procedimiento de diagnostico documentado.

Riesgos:
- Costo de infraestructura por alto volumen.
Mitigacion:
- Muestreo selectivo y pruning de eventos de bajo valor.

Rollback:
- Volver a perfil de captura de PR3.

## Checklist transversal por PR

1. Cumplimiento de seguridad: sin tokens/passwords en eventos.
2. Cumplimiento de accesibilidad en componentes tocados.
3. Tests de unidad e integracion relevantes.
4. Actualizacion de docs tecnicas y funcionales cuando aplique.
5. Registro en backlog de mejoras detectadas fuera de scope.

## Orden de ejecucion recomendado

1. PR1
2. PR2
3. PR3
4. PR4

Este orden reduce riesgo porque separa infraestructura local, instrumentacion funcional, transporte remoto y optimizacion operativa.
