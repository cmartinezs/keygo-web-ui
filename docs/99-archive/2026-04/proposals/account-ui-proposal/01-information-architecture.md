# Arquitectura de Información — Mi Cuenta y Configuración de Cuenta

## 1) Principios de diseño

1. **Separación conceptual clara**
   - **Mi cuenta (Perfil):** identidad del usuario y su contexto personal.
   - **Configuración de cuenta:** seguridad, preferencias y operación de la cuenta.

2. **Consistencia de navegación**
   - Sidebar y dropdown deben exponer los mismos destinos principales para evitar rutas paralelas con nombres distintos.

3. **Role-aware, no role-fragmented**
   - La estructura base de navegación es igual por rol.
   - Lo que cambia es visibilidad de tabs/acciones dentro de cada vista.

4. **Backend-first**
   - Toda sección indica si está:
     - **Disponible ahora** (endpoint existente)
     - **Parcial** (usable solo para ciertos roles)
     - **Pendiente backend**

---

## 2) Mapa de navegación recomendado

## 2.1 Sidebar

1. Mi cuenta
2. Configuración de cuenta

## 2.2 Dropdown de usuario

1. Mi cuenta
2. Configuración de cuenta
3. Cerrar sesión

## 2.3 Regla de copy

- No mezclar "Mi perfil" y "Mi cuenta" como destinos distintos.
- "Perfil" se usa como nombre de tab/subsección dentro de Mi cuenta.

---

## 3) UI A — Mi cuenta

Propósito: concentrar la identidad y vista personal del usuario.

## 3.1 Tabs propuestas

1. **Resumen**
   - Snapshot de identidad y metadatos relevantes.
   - Campos sugeridos:
     - nombre mostrado
     - email
     - username/preferred_username
     - tenant activo
     - roles activos
   - Estado: **Disponible ahora**

2. **Perfil**
   - Formulario editable de datos personales/extendidos.
   - Campos candidatos:
     - first_name, last_name
     - phone_number
     - locale, zoneinfo
     - website
     - birthdate
     - profile_picture_url
   - Estado: **Disponible ahora**

3. **Accesos**
   - Qué apps/roles tiene el usuario dentro de su tenant.
   - Para ADMIN/ADMIN_TENANT se puede derivar de memberships por `user_id`.
   - Para USER_TENANT idealmente debe ser self-service sin privilegios admin.
   - Estado: **Parcial**

4. **Actividad**
   - Últimas acciones relevantes del usuario en KeyGo.
   - Estado: **Pendiente backend** (si no se reutiliza fuente de auditoría existente por rol)

## 3.2 Comportamiento por rol

1. ADMIN
   - Ve Resumen + Perfil + Accesos.
   - Actividad depende de endpoint de auditoría accesible para cuenta personal.

2. ADMIN_TENANT
   - Ve Resumen + Perfil + Accesos.

3. USER_TENANT
   - Ve Resumen + Perfil.
   - Accesos idealmente visible cuando exista endpoint self-service.

---

## 4) UI B — Configuración de cuenta

Propósito: administrar seguridad y preferencias operativas.

## 4.1 Tabs propuestas

1. **Seguridad**
   - Cambiar contraseña.
   - Ver sesiones activas.
   - Cerrar sesión remota por dispositivo.
   - Estado: **Pendiente backend** (según guía de frontend para account/sessions)

2. **Notificaciones**
   - Preferencias de alertas por canal (email/in-app), severidad y tipo.
   - Estado: **Pendiente backend**

3. **Conexiones**
   - Cuentas vinculadas / integraciones de identidad (si aplica estrategia del producto).
   - Estado: **Pendiente backend**

4. **Facturación**
   - Solo para roles con permisos de facturación (idealmente ADMIN_TENANT).
   - Información sugerida:
     - plan/suscripción activa
     - estado de renovación
     - historial de facturas
     - acción de cancelar suscripción
   - Estado: **Disponible ahora** (para rol con permisos)

## 4.2 Regla de visibilidad

- Facturación solo aparece cuando el rol/permiso lo permite.
- Seguridad debe aparecer para todos los roles autenticados, aunque algunas acciones queden en estado "Próximamente" si backend no está listo.

---

## 5) UI C opcional — Administración (recomendado separar)

Si en el futuro "Configuración" crece con aspectos operativos de tenant/app, conviene separar una tercera vista:

1. **Administración de organización/plataforma**
   - Apps
   - Roles de apps
   - Memberships
   - Políticas del tenant

Esto evita mezclar configuración personal con administración de negocio.

---

## 6) Decisiones UX para resolver la ambigüedad actual

1. Reemplazar etiqueta "Mi perfil" del dropdown por **Mi cuenta**.
2. Agregar **Configuración de cuenta** al dropdown.
3. Mantener equivalencia exacta entre sidebar y dropdown para ambos destinos.
4. Internamente, usar tabs para separar Perfil vs Seguridad vs Facturación.

---

## 7) Rutas sugeridas (sin implementar aún)

1. `/dashboard/account`
   - Tabs: resumen, perfil, accesos, actividad

2. `/dashboard/account/settings`
   - Tabs: seguridad, notificaciones, conexiones, facturación

Notas:

- Si se prefiere, tabs pueden mapearse a subrutas:
  - `/dashboard/account/profile`
  - `/dashboard/account/settings/security`
- La decisión depende del nivel de deep-linking esperado para soporte/producto.
