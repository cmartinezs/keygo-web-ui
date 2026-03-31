# 03 - Contrato de Eventos

## Objetivo

Definir un esquema de evento estable para ingestion backend y analisis posterior.

## Envelope Base

Campos obligatorios:
- eventId: string unico para idempotencia.
- eventVersion: string, ejemplo v1.
- occurredAt: timestamp ISO-8601 UTC.
- eventType: categoria del evento.
- action: accion ejecutada.
- outcome: resultado (SUCCESS, FAILURE, PARTIAL).
- actor: metadata del usuario/sesion.
- context: metadata tecnica y funcional.

Campos opcionales:
- supportIdentity: email o username (si politica lo permite).
- error: codigo de error y origen.
- metrics: duracion, reintentos, tamano payload.

## Taxonomia Inicial de eventType

1. auth
- login_attempt
- login_success
- login_failure
- session_restore_attempt
- session_restore_success
- session_restore_failure

2. navigation
- route_change

3. form
- form_submit
- form_validation_failure
- step_transition

4. api
- api_success
- api_failure

5. admin
- tenant_create_attempt
- tenant_create_success
- tenant_suspend
- tenant_activate

## Actor

- userId (obligatorio cuando exista sesion)
- roles
- tenantSlug
- sessionId

Nota: userId puede ser UUID de claim sub. Email/username solo para soporte bajo control.

## Idempotencia

1. eventId unico generado en frontend.
2. Backend debe ignorar duplicados por eventId sin tratarlo como error fatal.
3. Respuesta batch debe informar accepted e ignored.

## Versionado

1. eventVersion obligatorio.
2. Cambios incompatibles requieren nuevo versionado (v2, v3).
3. Backend debe mantener compatibilidad con versiones activas durante ventana de migracion.
