# Análisis de Documentación y RFCs — KeyGo Web UI

> **Fecha:** 2026-04-07  
> **Autor:** Copilot (Claude Opus 4.6)  
> **Alcance:** Revisión integral de la documentación actualizada, RFCs de billing/contractor, modelo RBAC T-111, restructuración multitenant y propuesta de account UI.

---

## Contexto

Este análisis cubre los cambios más recientes en la documentación del proyecto KeyGo, incluyendo:

- Actualización profunda del **Frontend Developer Guide** (3.896 líneas, fases 0–9b completadas).
- **RFC Billing Contractor Refactor** — separación de identidad contractor de tenant, billing en dos niveles.
- **T-111 Implementation** — modelo RBAC de 3 capas (platform → tenant → app).
- **RFC Restructure Multitenant** — reestructuración del modelo base con `platform_users`, dos flujos de auth independientes.
- **Account UI Proposal** — arquitectura de información para "Mi cuenta" y "Configuración".
- Actualización de los flujos **AUTH_FLOW.md** y **BILLING_FLOW.md**.

## Índice de documentos

| # | Documento | Contenido |
|---|-----------|-----------|
| 01 | [Resumen Ejecutivo](./01-resumen-ejecutivo.md) | Visión global de todos los cambios y su impacto en el frontend |
| 02 | [Frontend Developer Guide](./02-frontend-developer-guide.md) | Análisis de la guía actualizada: modelo unificado, dual auth, endpoints |
| 03 | [RFC Billing Contractor](./03-rfc-billing-contractor.md) | Separación contractor↔tenant, billing platform vs app, nuevos endpoints |
| 04 | [T-111 Modelo RBAC](./04-t111-modelo-rbac.md) | 3 capas de roles: platform, tenant, app — impacto en JWT y frontend |
| 05 | [RFC Restructure Multitenant](./05-rfc-restructure-multitenant.md) | `platform_users`, dos flujos auth, migración de sesiones, seeds |
| 06 | [Account UI Proposal](./06-account-ui-proposal.md) | Arquitectura de información, cobertura de endpoints, gaps backend |
| 07 | [Impacto en Tipos Frontend](./07-impacto-tipos-frontend.md) | Análisis de gap entre tipos actuales y modelo nuevo — DTOs requeridos |
| 08 | [Visión de Implementación](./08-vision-implementacion.md) | Cómo veo la implementación: fases, riesgos, dependencias, recomendaciones |
| 09 | [Restructuración del Repositorio](./09-restructuracion-repositorio.md) | Análisis de la estructura feature-first propuesta: mapeo de archivos, 5 contextos, compatibilidad dual-auth |
| 10 | [Flujo Login Tenant (Hosted Login)](./10-flujo-login-tenant-hosted.md) | Cómo KeyGo UI actúa como hosted login para apps de terceros: estándar de industria, diagrama de flujo, qué falta implementar |
| 11 | [Gaps y Dependencias Backend](./11-gaps-y-dependencias-backend.md) | Auditoría completa: 18 endpoints bloqueantes, 12 módulos frontend cojos, 8 preguntas abiertas de diseño |

## Estado del backend

Según la Endpoint Status Matrix (2026-04-03):

- **56 endpoints productivos** de 58 totales
- **2 parciales** (pendientes de decisión de producto)
- **0 endpoints sin implementar** en el core

## Decisiones clave pendientes del frontend

1. **Dual auth stack** — implementar ambos flujos PKCE (platform y tenant app) en la misma SPA.
2. **Compatibilidad de roles** — reconocer formatos legacy (`ADMIN`) y nuevos (`KEYGO_ADMIN`) en paralelo.
3. **Billing platform** — nuevos endpoints de catálogo, suscripción e invoices a nivel plataforma.
4. **Tipos wire format** — migrar DTOs a `snake_case` real del backend (corregir camelCase del generador).
5. **Restructuración de rutas** — separar contexto platform de contexto tenant en la SPA.
6. **Restructuración del repositorio** — migrar de organización type-first a feature-first con 5 contextos semánticos.

## Cómo usar este análisis

- **Para planificar:** Leer `01-resumen-ejecutivo.md` + `08-vision-implementacion.md`.
- **Para implementar tipos:** Leer `07-impacto-tipos-frontend.md`.
- **Para entender un RFC específico:** Leer el documento correspondiente (03, 04, o 05).
- **Para diseñar pantallas de cuenta:** Leer `06-account-ui-proposal.md`.
- **Para evaluar la restructuración del repo:** Leer `09-restructuracion-repositorio.md`.
