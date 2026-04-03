# Definiciones Frontend para Habilitar Implementacion Backend

- Estado: En curso (F-042 aprobado por Frontend)
- Fecha: 2026-04-03
- Owner funcional: Frontend
- Consumidor principal: Backend
- Documento relacionado 1: docs/imcomplete-sections/03-implementation-plan.md
- Documento relacionado 2: docs/RFC-PANTALLAS-SECCIONES-INCOMPLETAS-BACKEND-2026-04-02.md

---

## 1. Objetivo

Definir con precision las decisiones que Frontend debe cerrar para que Backend implemente sin retrabajo los items F-042, F-043/T-104 y T-110.

Este documento transforma "pendiente de definir" en contrato de trabajo verificable entre equipos.

---

## 2. Alcance

Incluye:

1. Modelo funcional y de datos esperado por UI.
2. Decisiones de UX que impactan contrato API.
3. Criterios de aceptacion por item.
4. Checklist de handoff Frontend -> Backend.

No incluye:

1. Implementacion de componentes o rutas en frontend.
2. Implementacion de endpoints en backend.
3. Definiciones de negocio fuera de los items listados.

---

## 3. Convenciones de decision

- Cada decision usa estado: PENDIENTE, PROPUESTA, APROBADA.
- Si no hay decision APROBADA, backend no inicia implementacion del item afectado.
- Cuando exista discrepancia, se prioriza este orden:
  1. docs/api-docs.json (contrato tecnico publicado)
  2. Este documento (acuerdo operativo Front/Back)
  3. docs/imcomplete-sections/03-implementation-plan.md (plan por fases)

---

## 4. F-042 Conexiones de cuenta

## 4.1 Decisiones de contrato

| ID | Decision | Estado | Impacto backend |
|---|---|---|---|
| F042-D1 | Shape final de AccountConnectionData | APROBADA | Define DTO, entity y mapper |
| F042-D2 | providerName enum fijo vs string libre | APROBADA | Define validaciones y migraciones futuras |
| F042-D3 | Alcance V1 solo GET/DELETE o tambien POST | APROBADA | Define superficie de API |
| F042-D4 | Semantica UX de DELETE idempotente | APROBADA | Define codigos/respuestas y mensajes |

## 4.2 Propuesta de shape V1 para UI

Propuesta (frontend) para lista de conexiones:

```json
{
  "id": "uuid",
  "providerName": "GOOGLE",
  "displayName": "Carlos Martinez",
  "avatarUrl": "https://...",
  "scopes": ["openid", "profile", "email"],
  "status": "ACTIVE",
  "connectedAt": "2026-04-03T10:12:00Z",
  "lastUsedAt": "2026-04-03T12:40:00Z"
}
```

Campos minimos obligatorios V1:

1. id
2. providerName
3. status
4. connectedAt

Campos recomendados V1 (si estan disponibles sin costo alto):

1. displayName
2. avatarUrl
3. scopes
4. lastUsedAt

## 4.3 Reglas propuestas de comportamiento

1. GET /account/connections:
   - Debe devolver [] cuando no existan conexiones.
   - No debe fallar por ausencia de avatar o lastUsedAt.
2. DELETE /account/connections/{connectionId}:
   - Debe ser idempotente.
   - Si el recurso no existe o ya fue revocado, frontend mantiene mensaje de exito neutral.
   - Frontend siempre hace refetch de la lista tras DELETE exitoso.

## 4.4 Decisiones aprobadas por Frontend

1. Provider catalog (APROBADA):
   - Opcion A: enum cerrado en backend (GOOGLE, GITHUB, MICROSOFT, SLACK).
   - Politica de compatibilidad frontend: si llega un provider fuera de catalogo, UI lo mostrara como string sin bloquear render.
2. Alcance endpoint V1 (APROBADA):
   - GET + DELETE + POST /{provider}/link.
   - Justificacion: la pantalla de conexiones ya expone accion de vinculacion, por lo que POST no puede quedar fuera de V1.
3. Orden de listado (APROBADA):
   - connectedAt DESC.

## 4.5 Criterio de cierre F-042

Se considera "Frontend definido" cuando:

1. Existe shape APROBADO de AccountConnectionData.
2. Existe decision APROBADA sobre providerName.
3. Existe decision APROBADA sobre alcance GET/DELETE/POST.
4. Existe decision APROBADA de UX para DELETE idempotente.

---

## 5. F-043 + T-104 Recuperacion y reset de contrasena

## 5.1 Problema de diseno a resolver

El backend expone dos flujos distintos:

1. Reset por contrasena temporal:
   - POST /account/reset-password
2. Recover por token de email:
   - POST /account/forgot-password
   - POST /account/recover-password

Frontend debe definir como conviven ambos sin confusion para usuario final.

## 5.2 Decisiones de UX/flujo

| ID | Decision | Estado | Impacto backend |
|---|---|---|---|
| AUTH-D1 | Rutas publicas definitivas del flujo | PENDIENTE | OpenAPI examples, docs y QA E2E |
| AUTH-D2 | Entrada principal: forgot-password o reset-password temporal | PENDIENTE | Priorizacion de mensajes y validaciones |
| AUTH-D3 | Copy anti-enumeracion para forgot-password | PENDIENTE | Mensajes de exito/fracaso consistentes |
| AUTH-D4 | Criterio de uso de reset-password temporal | PENDIENTE | Reglas de soporte y onboarding |

## 5.3 Propuesta operativa (recomendada)

1. Ruta publica principal:
   - /forgot-password
2. Ruta de recuperacion por token:
   - /recover-password
3. Flujo reset temporal:
   - Expuesto en pantalla separada orientada a casos de aprovisionamiento admin.
4. Mensaje de forgot-password (siempre neutral):
   - "Si el correo existe, enviaremos instrucciones para recuperar tu acceso."

## 5.4 Reglas minimas para payload UI

1. forgot-password:
   - email
2. recover-password:
   - recoveryToken
   - newPassword
3. reset-password temporal:
   - email
   - temporaryPassword
   - newPassword

## 5.5 Casos de borde que frontend debe aprobar

1. Usuario intenta recuperar con token expirado:
   - Confirmar texto final de error.
2. Usuario no recuerda si tiene password temporal o token email:
   - Confirmar estrategia de ayuda en UI.
3. Convivencia con login bloqueado por RESET_PASSWORD:
   - Confirmar CTA de redireccion hacia flujo correcto.

## 5.6 Criterio de cierre F-043/T-104

1. Rutas APROBADAS.
2. Copy APROBADO para anti-enumeracion.
3. Payload APROBADO por pantalla.
4. Mapa de navegacion APROBADO para los 2 flujos.

---

## 6. T-110 Sesiones por usuario para admin

## 6.1 Decisiones requeridas

| ID | Decision | Estado | Impacto backend |
|---|---|---|---|
| T110-D1 | Filtro V1: ACTIVE o ACTIVE+EXPIRED | PENDIENTE | Query y response size |
| T110-D2 | Columnas minimas de tabla UI | PENDIENTE | DTO final y mapping |
| T110-D3 | Acciones V1: solo lectura o acciones sobre sesion | PENDIENTE | Alcance endpoint |

## 6.2 Propuesta de columnas minimas V1

1. sessionId
2. createdAt
3. expiresAt
4. status
5. ipAddress (si existe)
6. userAgentResumen (si existe)

## 6.3 Propuesta de alcance V1

1. Solo lectura.
2. Filtro por defecto ACTIVE.
3. Opcion de incluir EXPIRED via query param opcional.

## 6.4 Criterio de cierre T-110

1. Decision APROBADA sobre filtro V1.
2. Lista APROBADA de columnas minimas.
3. Confirmacion APROBADA de acciones V1 (lectura).

---

## 7. Matriz de decisiones para aprobacion

| Item | Decision | Responsable | Fecha limite sugerida | Estado |
|---|---|---|---|---|
| F-042 | Shape AccountConnectionData | Frontend Lead | 2026-04-05 | APROBADA |
| F-042 | providerName enum vs string | Frontend + Backend | 2026-04-05 | APROBADA |
| F-042 | Alcance endpoints V1 | Frontend Product + Backend | 2026-04-05 | APROBADA |
| F-043/T-104 | Mapa de rutas publicas | Frontend | 2026-04-05 | PENDIENTE |
| F-043/T-104 | Copy anti-enumeracion | Frontend UX/Producto | 2026-04-05 | PENDIENTE |
| T-110 | Filtros y columnas V1 | Frontend + Backend | 2026-04-05 | PENDIENTE |

---

## 8. Checklist de handoff Frontend -> Backend

Antes de pedir implementacion backend, frontend debe entregar:

1. Este documento con decisiones en estado APROBADA.
2. Ejemplos de request/response por endpoint impactado.
3. Flujo de navegacion final por pantalla (ruta -> accion -> resultado).
4. Mensajes de error/estado final aprobados por UX.
5. Lista de fuera de alcance V1 explicitada.

---

## 9. Riesgos si no se define ahora

1. Retrabajo de DTOs y mapeos.
2. Incompatibilidad entre copy UX y semantica de errores.
3. Reapertura de endpoints por cambios tardios de alcance.
4. Aumento de deuda tecnica en mocks y adapters temporales.

---

## 10. Estado inicial sugerido para iniciar aprobacion

Se recomienda partir con las siguientes propuestas base:

1. F-042: GET + DELETE, providerName enum fijo, listado por connectedAt DESC.
2. F-043/T-104: entrada principal /forgot-password, recover por token en /recover-password, reset temporal en flujo separado.
3. T-110: solo lectura, filtro ACTIVE por defecto con opcion EXPIRED.

Este estado inicial reduce ambiguedad y permite que backend avance en paralelo con UI sin bloqueos de contrato.