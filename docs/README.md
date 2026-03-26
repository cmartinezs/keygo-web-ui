# KeyGo UI — Documentación

Índice de toda la documentación técnica y de negocio del proyecto `keygo-ui`.

---

## Documentos disponibles

### [`FRONTEND_DEVELOPER_GUIDE.md`](FRONTEND_DEVELOPER_GUIDE.md)
**Audiencia:** Desarrolladores frontend.

Guía completa de desarrollo: stack tecnológico, estructura del proyecto, flujo OAuth2/PKCE detallado, gestión de roles y routing condicional, manejo seguro de tokens, interceptores HTTP, convenciones de error, inventario de endpoints (disponibles vs. pendientes), guía de mocking con MSW y checklist de seguridad.

> Consultar **siempre** antes de implementar o modificar una llamada al backend.

---

### [`AUTH_FLOW.md`](AUTH_FLOW.md)
**Audiencia:** Desarrolladores frontend y backend, arquitectos de seguridad.

Referencia del flujo OAuth 2.0 Authorization Code + PKCE implementado en KeyGo Server. Incluye:
- Prerrequisitos del sistema (tenant, ClientApp, JSESSIONID)
- Diagrama y descripción paso a paso del flujo
- Escenario de login central multi-tenant
- Grants soportados (`authorization_code`, `refresh_token`, `client_credentials`)
- Tablas de errores por endpoint con `clientMessage` específico por excepción
- Comportamiento adaptativo en dev/local vs. producción
- Checklist para clientes SPA

---

### [`api-docs.json`](api-docs.json)
**Audiencia:** Desarrolladores frontend y herramientas de generación de código.

Especificación **OpenAPI v3** del backend KeyGo Server. Es la **fuente técnica de verdad** para paths, métodos HTTP, schemas de request/response, parámetros y esquemas de autenticación requerida.

> Si hay discrepancia entre este JSON y cualquier otro documento, prevalece este archivo.

---

### [`BACKLOG.md`](BACKLOG.md)
**Audiencia:** Equipo de desarrollo y producto.

Registro vivo de features pendientes, mejoras planificadas, deuda técnica detectada y endpoints de backend aún no disponibles. Organizado por prioridad:

| Sección | Descripción |
|---|---|
| 🚧 En desarrollo | Ítems activos en la iteración actual |
| 🔴 Features críticas | Bloqueantes para uso en producción |
| 🟡 Features planificadas | Próximas iteraciones |
| 🔵 Mejoras y refactorizaciones | Calidad y mantenibilidad |
| 🟠 Deuda técnica | Compromisos técnicos pendientes de resolver |
| ⏳ Endpoints pendientes | Endpoints de backend aún no implementados |
| ✅ Completados | Historial de lo entregado |

> **No implementar sin validación del equipo.** Este documento lo actualiza el agente automáticamente al final de cada implementación.

---

## Convenciones de actualización

- `FRONTEND_DEVELOPER_GUIDE.md` y `AUTH_FLOW.md` son **documentos vivos** — se actualizan cada vez que el backend introduce cambios.
- `api-docs.json` se reemplaza por el equipo de backend al publicar nuevas versiones.
- `BACKLOG.md` lo actualiza el agente al detectar mejoras, bugs o features fuera de scope durante la implementación.
