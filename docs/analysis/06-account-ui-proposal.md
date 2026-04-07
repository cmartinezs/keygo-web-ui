# 06 — Account UI Proposal: Análisis

> Arquitectura de información para "Mi cuenta" y "Configuración de cuenta". Estado de implementación.

---

## Diseño de navegación

La propuesta unifica la navegación de cuenta bajo dos destinos principales:

```
Sidebar + User Dropdown
├── Mi cuenta (/dashboard/account)
│   ├── Tab: Resumen     → snapshot de identidad
│   ├── Tab: Perfil      → datos editables
│   ├── Tab: Accesos     → apps y roles del usuario
│   └── Tab: Actividad   → log de acciones recientes
│
└── Configuración (/dashboard/account/settings)
    ├── Tab: Seguridad       → contraseña, sesiones, logout remoto
    ├── Tab: Notificaciones  → preferencias por canal
    ├── Tab: Conexiones      → cuentas vinculadas (Google, GitHub, etc.)
    └── Tab: Facturación     → suscripción, facturas, cancelación (solo ADMIN_TENANT)
```

### Principios de diseño

1. **Separación conceptual clara**: Mi cuenta = identidad personal; Configuración = seguridad y operaciones.
2. **Navegación consistente**: sidebar y dropdown exponen los mismos destinos.
3. **Role-aware, no role-fragmented**: misma estructura base para todos los roles; visibilidad de tabs cambia por rol.
4. **Backend-first**: cada sección indica si está disponible, parcial o pendiente.

---

## Visibilidad por rol

| Tab | ADMIN | ADMIN_TENANT | USER_TENANT |
|-----|-------|-------------|-------------|
| Resumen | ✅ | ✅ | ✅ |
| Perfil | ✅ | ✅ | ✅ |
| Accesos | ✅ | ✅ | ⏳ (requiere endpoint self-service) |
| Actividad | ⏳ | ⏳ | ⏳ |
| Seguridad | ✅ | ✅ | ✅ |
| Notificaciones | ✅ | ✅ | ✅ |
| Conexiones | ⏳ (MSW temporal) | ⏳ | ⏳ |
| Facturación | ❌ | ✅ | ❌ |

---

## Cobertura de endpoints

### Mi Cuenta

| Sección | Endpoint | Estado |
|---------|----------|--------|
| Resumen | `GET /account/profile` | ✅ Disponible |
| Resumen | `GET /userinfo` | ✅ Disponible |
| Perfil editable | `PATCH /account/profile` | ✅ Disponible |
| Accesos (admin) | `GET /memberships?user_id={uuid}` | ✅ Parcial (solo admin) |
| Accesos (self) | `GET /account/access` | ✅ Disponible |
| Actividad | (no confirmado) | ⏳ Pendiente |

### Configuración

| Sección | Endpoint | Estado |
|---------|----------|--------|
| Cambiar contraseña | `POST /account/change-password` | ✅ Disponible |
| Sesiones activas | `GET /account/sessions` | ✅ Disponible |
| Cerrar sesión remota | `DELETE /account/sessions/{id}` | ✅ Disponible |
| Notificaciones GET | `GET /account/notification-preferences` | ✅ Disponible |
| Notificaciones PATCH | `PATCH /account/notification-preferences` | ✅ Disponible |
| Conexiones | `GET/POST/DELETE /account/connections` | ⏳ MSW temporal (F-042) |
| Facturación | Billing endpoints | ✅ Disponible |

---

## Estado de implementación

La propuesta se implementó en 12 fases, todas completadas:

| Fase | Contenido | Estado |
|------|-----------|--------|
| 1 | Baseline y contract matrix | ✅ |
| 2 | API account extendida | ✅ |
| 3 | Tipos y mapping wire format | ✅ |
| 4 | MSW temporal para conexiones | ✅ |
| 5 | UI tab seguridad (ChangePasswordForm, SessionsList) | ✅ |
| 6 | UI tab notificaciones | ✅ |
| 7 | UI tab conexiones (temporal MSW) | ✅ |
| 8 | Wiring del tab accesos con datos reales | ✅ |
| 9 | Arquitectura reutilizable (AccountPanelPrimitives) | ✅ |
| 10 | Tests (7 casos en account.test.ts) | ✅ |
| 11 | Verificación integral (lint + test + build) | ✅ |
| 12 | Documentación y cierre | ✅ |

---

## Gaps identificados en el RFC de backend

### Prioridad 1: Seguridad de cuenta (ya implementado)

- **Change password**: `POST /account/change-password` — política de contraseña ≥12 chars, mixed case, digit, special.
- **Sessions**: `GET /account/sessions` + `DELETE /account/sessions/{id}` — incluye `is_current` para evitar auto-revocación.

### Prioridad 2: Notificaciones (ya implementado)

- 5 toggles: `security_alerts_email`, `security_alerts_in_app`, `billing_alerts_email`, `product_updates_email`, `weekly_digest`.

### Prioridad 3: Conexiones (MSW temporal, pendiente F-042)

- GET/POST/DELETE para cuentas vinculadas (Google, Microsoft, GitHub).
- Modelo: `{ id, provider, provider_account, linked_at, is_primary }`.

### Prioridad 4: Self-service access (implementado)

- `GET /account/access` — acceso del usuario sin query params de admin.

---

## Cómo se relaciona con la restructuración por roles

La propuesta de account es **compatible** con la nueva arquitectura de plataforma:

1. **Endpoints self-service** (`/account/*`) no requieren `X-KEYGO-ADMIN` header — el sujeto autenticado determina ownership.
2. **La estructura de tabs es idéntica para todos los roles** — solo cambia visibilidad.
3. **Facturación** solo aparece para roles con permisos de billing (idealmente ADMIN_TENANT/KEYGO_TENANT_ADMIN).
4. **Post-restructuración**: si "Configuración" crece con aspectos operativos del tenant, se recomienda separar una tercera vista "Administración" para no mezclar config personal con admin de negocio.

---

## Impacto del cambio a platform_users

Cuando el auth migre a `platform_users`:

| Endpoint actual | Ruta actual | Ruta posible post-migración |
|-----------------|-------------|------------------------------|
| `GET /account/profile` | `/tenants/{slug}/account/profile` | `/platform/account/me` |
| `POST /account/change-password` | `/tenants/{slug}/account/change-password` | `/platform/account/change-password` |
| `GET /account/sessions` | `/tenants/{slug}/account/sessions` | `/platform/account/sessions` |

**Decisión pendiente:** ¿Las pantallas de cuenta usan endpoints de **plataforma** o de **tenant**? Depende del contexto de auth activo. Si el usuario está logueado como platform user, las llamadas van a `/platform/...`. Si está en contexto tenant, van a `/tenants/{slug}/...`.

---

## Observaciones

1. **AccountPanelPrimitives** (`PanelCard`, `LoadingMessage`, `ErrorMessage`, `PrimaryActionButton`, `DangerActionButton`) — patrón reutilizable ya extraído.
2. **Wire format**: Los tipos usan mappers explícitos (`toWireChangePassword`, `fromWireSession`) para la conversión camelCase ↔ snake_case.
3. **El RFC de account** propuso contratos que el backend luego implementó. El frontend ya consume la mayoría de estos endpoints.
4. **Conexiones** es el único gap real: esperando contrato backend oficial (F-042).
