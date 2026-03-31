# KeyGo UI — Guía Funcional

> **Audiencia:** usuario final, product owner o cualquier persona que quiera entender qué puede hacer con la aplicación, sin necesidad de conocimiento técnico.
>
> **Última actualización:** 2026-03-31

---

## Índice

1. [Acceso público](#1-acceso-público)
   - 1.1 [Página de inicio (Landing)](#11-página-de-inicio-landing)
   - 1.2 [Iniciar sesión](#12-iniciar-sesión)
   - 1.3 [Contratar un plan (Nuevo contrato)](#13-contratar-un-plan-nuevo-contrato)
   - 1.4 [Registrarse como usuario de una organización](#14-registrarse-como-usuario-de-una-organización)
  - 1.5 [Documentación para desarrolladores](#15-documentación-para-desarrolladores)
2. [Panel de Administrador Global (ADMIN)](#2-panel-de-administrador-global-admin)
   - 2.1 [Dashboard — Panel de control](#21-dashboard--panel-de-control)
   - 2.2 [Gestión de Tenants](#22-gestión-de-tenants)
   - 2.3 [Detalle de un Tenant](#23-detalle-de-un-tenant)
   - 2.4 [Crear un Tenant](#24-crear-un-tenant)
3. [Panel de Administrador de Tenant (ADMIN_TENANT)](#3-panel-de-administrador-de-tenant-admin_tenant)
4. [Panel de Usuario (USER_TENANT)](#4-panel-de-usuario-user_tenant)
5. [Funcionalidades pendientes](#5-funcionalidades-pendientes)

---

## 1. Acceso público

Las siguientes áreas son accesibles **sin necesidad de iniciar sesión**.

---

### 1.1 Página de inicio (Landing)

**Ruta:** `/`

La página de inicio es la presentación pública de KeyGo. Está organizada en secciones verticales a las que se puede navegar mediante el menú superior.

#### Barra de navegación

Fija en la parte superior de la pantalla. Contiene:

- **Logo KeyGo** — vuelve al inicio de la página al hacer clic.
- **Menú de secciones** (solo escritorio): "Características", "Cómo funciona", "Para tu equipo", "Planes", "Desarrolladores" — desplazan la página a cada sección.
- **Acciones principales** (esquina superior derecha):
  - "Regístrate" → lleva al formulario de registro de usuario (`/register`).
  - "Nuevo contrato" → lleva al asistente de contratación (`/subscribe`).
  - "Iniciar sesión" → lleva al login (`/login`).

Un botón flotante en la esquina inferior derecha permite volver al inicio de la página en cualquier momento.

#### Sección Hero

Presentación principal con estadísticas destacadas:
- **Acceso seguro** — comunicación cifrada con OAuth2 y PKCE.
- **Control total** — gestión centralizada de usuarios y permisos.
- **Multi-tenant** — múltiples organizaciones en una sola plataforma.

Dos botones de acción directa: "Empezar ahora" (→ login) y "Ver características" (→ baja a la sección de características).

#### Sección Características (`#features`)

Seis tarjetas que explican las capacidades técnicas principales de la plataforma:

1. **Autenticación estándar** — OAuth2 + PKCE, sin secretos en el navegador.
2. **Control de acceso por roles** — tres roles diferenciados: ADMIN, ADMIN_TENANT, USER_TENANT.
3. **Multi-tenant nativo** — múltiples organizaciones en una misma instancia.
4. **Tokens JWT seguros** — firmados con RS256, renovación silenciosa de sesión.
5. **Gestión de aplicaciones cliente** — URIs de redirección, scopes, ciclo de vida.
6. **API REST documentada** — especificación OpenAPI v3, contratos consistentes.

#### Sección Cómo funciona (`#how-it-works`)

Proceso de tres pasos que explica el flujo de autenticación:

1. El usuario inicia sesión en un único punto de acceso.
2. KeyGo verifica la identidad y renueva la sesión de forma silenciosa.
3. El sistema aplica automáticamente los permisos correctos según el rol.

#### Sección Para tu equipo / Roles (`#roles`)

Tres tarjetas que describen los perfiles disponibles:

| Rol | Color | Qué puede hacer |
|---|---|---|
| **Administrador Global** | Rojo | Gestionar tenants, usuarios globales, apps cliente y logs de auditoría. |
| **Administrador de Tenant** | Ámbar | Gestionar usuarios del tenant, roles, métricas y sesiones activas. |
| **Usuario del sistema** | Verde | Acceder a las apps autorizadas, editar su perfil y gestionar sus sesiones. |

#### Sección Planes (`#pricing`)

Tres planes disponibles, cada uno con un botón "Contratar" que lleva al asistente de contratación (`/subscribe?plan=…`):

| Plan | Precio | Incluye |
|---|---|---|
| **Starter** | Gratis, siempre | 500 usuarios activos, 1 tenant, 2 apps cliente, soporte comunitario. |
| **Business** | 49 €/mes | Usuarios, tenants y apps ilimitados, SSO, soporte prioritario, SLA 99,9 %. |
| **On-Premise** | A medida | Instalación propia, integración LDAP/AD, acceso al código fuente, soporte incluido. |

#### Sección Desarrolladores (`#developers`)

Recursos para integradores:

- **Documentación técnica** — abre una guía pública en `/developers`.
- **SDKs e integraciones** — _Próximamente_.
- **API REST completa** — enlaza a la sección de endpoints esenciales dentro de la guía pública.
- Banner destacado con acceso directo a la guía de integración.

#### Pie de página / CTA final

Sección de cierre con dos acciones: "Contratar ahora" (→ `/subscribe`) e "Iniciar sesión" (→ `/login`). Incluye indicador de estado de la plataforma.

---

### 1.2 Iniciar sesión

**Ruta:** `/login`

Permite autenticarse mediante el flujo OAuth2 Authorization Code + PKCE. El proceso es seguro: nunca se envían credenciales en texto plano desde el navegador.

#### Flujo paso a paso

1. **Preparación de sesión** (automática, invisible) — La aplicación establece un canal seguro con el servidor. Se muestra un spinner animado ("Preparando sesión segura…"). Si falla, se muestra un mensaje descriptivo con opción de reintentar.

2. **Formulario de credenciales:**
   - Campo **email o nombre de usuario**.
   - Campo **contraseña**.
   - Si está configurado: widget de verificación **Turnstile** (Cloudflare) para protección anti-bot.
   - Botón "Iniciar sesión".

3. **Autenticación y redirección** (automática, invisible) — Las credenciales se validan, se obtienen los tokens de sesión y el usuario es llevado automáticamente al área correspondiente a su rol:
   - `ADMIN` → `/admin/dashboard`
   - `ADMIN_TENANT` → `/tenant-admin/dashboard` _(en construcción)_
   - `USER_TENANT` → `/dashboard` _(en construcción)_

#### Mensajes de error posibles

| Situación | Mensaje mostrado |
|---|---|
| Credenciales incorrectas | Error de autenticación |
| Email no verificado | Pendiente de verificación de email |
| Usuario no encontrado | Recurso no encontrado |
| Aplicación o tenant no disponible | Servicio no disponible |
| Acceso suspendido | Acceso temporalmente suspendido |
| Sesión expirada | Re-inicialización automática |

#### Protección de seguridad

- **Límite de intentos fallidos:** tras varios intentos fallidos, el botón se bloquea durante un periodo de espera creciente. Se muestra un banner ámbar con el tiempo restante.
- **Campo honeypot:** trampa invisible para bots automatizados.

---

### 1.3 Contratar un plan (Nuevo contrato)

**Ruta:** `/subscribe`

Asistente de auto-contratación en **5 pasos** conectado al backend de billing. Soporta dos flujos diferenciados según el tipo de suscriptor devuelto por el catálogo de planes:

- **Empresa (B2B)** — `subscriberType = TENANT`: requiere datos de empresa (nombre, identificador, CIF/NIF opcional, dirección).
- **Personal (B2C)** — `subscriberType = TENANT_USER`: solo datos personales.

El indicador de pasos muestra en todo momento la posición dentro del flujo.

#### Paso 1 — Selección de plan

Las tarjetas se cargan dinámicamente desde la API (`GET /billing/catalog`). Cada tarjeta muestra:
- Badge de tipo: **Empresa** o **Personal**.
- Toggle de periodicidad: **Mensual / Anual** (si el plan tiene las dos versiones).
- Precio formateado con divisa, días de prueba y lista de beneficios (entitlements).

Acción: "Continuar →" habilitado al seleccionar una tarjeta.

#### Paso 2 — Datos del suscriptor

**B2C (Personal):** nombre, apellidos y email.

**B2B (Empresa):** además de los datos personales del responsable:

| Campo | Obligatorio | Notas |
|---|---|---|
| Nombre de empresa | Sí | Mín. 2 caracteres |
| Identificador de empresa | Sí | Auto-generado desde el nombre; solo `[a-z0-9-]` |
| CIF / NIF | No | — |
| Dirección fiscal | No | — |

El identificador de empresa se genera automáticamente al escribir el nombre (kebab-case), pero puede editarse manualmente. Se muestra con el prefijo `keygo.io/`.

Acciones: "← Atrás", "Continuar →".

#### Paso 3 — Revisión y condiciones

- Panel de resumen (plan, precio, periodicidad, días de prueba, datos del contratante y empresa si B2B).
- Dos checkboxes obligatorios: **Términos de Servicio** y **Política de Privacidad**.
- Widget Turnstile (si `VITE_TURNSTILE_SITE_KEY` configurado).
- Botón "Confirmar y continuar →" — llama a `POST /billing/contracts` en el backend. Un honeypot invisible filtra envíos automáticos.

#### Paso 4 — Verificación de email

- Se envía un código OTP de 6 dígitos al email introducido.
- Interface de 6 cajas con auto-foco, soporte de pegado y navegación con Retroceso.
- Al confirmar: llama a `POST /billing/contracts/{id}/verify-email`.
- Desde este mismo paso se puede **retomar una contratación existente** ingresando el ID de contrato, sin salir de `/subscribe`.
- Si el contrato ya quedó en pago pendiente/listo para activar, el asistente avanza directamente al paso 5.

#### Paso 5 — Pago

- Resumen del pedido (plan, precio, periodicidad, días de prueba).
- **Modo desarrollo** (`import.meta.env.DEV`): botón "Confirmar pago (simulado) →" que llama a `POST /billing/contracts/{id}/mock-approve-payment` y después a `POST /billing/contracts/{id}/activate`.
- **Modo producción**: aviso informativo de integración PSP pendiente.

#### Resultado exitoso

Pantalla de confirmación con:
- Plan activado.
- Email de acceso.
- **B2B:** identificador de empresa (slug). 
- Enlace "Ir a iniciar sesión →" (`/login`).

---

### 1.4 Registrarse como usuario de una organización

**Ruta:** `/register`

Permite a usuarios finales de una organización ya existente darse de alta en KeyGo. Requiere datos que el administrador del tenant debe proporcionar previamente.

#### Paso 1 — Identificación de la organización

| Campo | Obligatorio | Formato | Ejemplo |
|---|---|---|---|
| Identificador de empresa (slug) | Sí | Solo minúsculas, números y guiones | `acme-corp` |
| ID de la aplicación (client ID) | Sí | Proporcionado por el administrador | — |

#### Paso 2 — Datos personales

_(En desarrollo)_ Formulario con los datos personales del nuevo usuario.

---

### 1.5 Documentación para desarrolladores

**Ruta:** `/developers`

Pantalla pública orientada a equipos técnicos que necesitan integrar KeyGo en una aplicación externa.

#### Qué puede hacer el usuario en esta página

- Comparar dos modelos de integración: **login propio** y **login integrado de keygo-ui**.
- Revisar los prerrequisitos mínimos antes de iniciar el flujo OAuth2/PKCE.
- Consultar una secuencia resumida para implementar un formulario propio de login.
- Consultar la secuencia recomendada para reutilizar keygo-ui como login central hospedado.
- Ver el contrato mínimo de endpoints necesarios para la integración, incluyendo método HTTP, requisitos de sesión/auth y tablas de campos para `queryParams`, `requestBody` y `response`, con ejemplos de `queryParams` en formato URL (`?campo=valor&otro=valor`) y ejemplos JSON para body/response.
- Acceder desde la misma página al login público de KeyGo o volver al landing.

#### Resultado esperado

La página no autentica ni modifica datos. Su objetivo es orientar la integración técnica y servir como punto público de referencia enlazado desde la landing. Al entrar sin hash abre desde el inicio; si la URL contiene un hash como `#endpoints`, la vista se posiciona directamente en esa sección. Cuando el usuario usa la acción "Volver al landing", la home se abre nuevamente desde el inicio de la página.

---

## 2. Panel de Administrador Global (ADMIN)

**Acceso:** exclusivo para cuentas con rol `ADMIN`. El sistema redirige al login si el usuario no tiene este rol.

El panel de administrador incluye una **barra lateral de navegación** y una **cabecera superior** persistentes en todas las pantallas de esta área.

#### Barra lateral (sidebar)

- **Logo KeyGo** en la parte superior. En escritorio: botón para colapsar/expandir la barra (modo solo iconos o con etiquetas).
- **Navegación principal organizada en grupos:**
  - **Plataforma:** Dashboard, Tenants, Apps, Usuarios
  - **Accesos & Registro:** Accesos, Registro
  - **Seguridad:** Claves de firma, Sesiones, Tokens
  - **Sistema:** API, Configuración, Mi cuenta
  - El ítem activo se resalta con fondo índigo. En modo colapsado, los grupos se separan con un divisor horizontal.
- **Perfil de usuario** en la parte inferior: avatar con iniciales, nombre completo y rol.

#### Cabecera superior

- **Menú hamburgesa** (solo móvil) — abre/cierra el sidebar como cajón lateral.
- **Buscador** (escritorio) — decorativo en esta versión, muestra `⌘K`.
- **Selector de tema:** Sistema / Claro / Oscuro (la preferencia persiste entre sesiones).
- **Botón de notificaciones** — decorativo en esta versión.
- **Menú de usuario** (clic en el avatar):
  - Información del usuario (avatar, nombre, rol).
  - "Mi perfil" — _sin acción actualmente_.
  - "Configuración" — _sin acción actualmente_.
  - "Cerrar sesión" — elimina la sesión y redirige al login.

#### Comportamiento en móvil

En pantallas pequeñas, la barra lateral se convierte en un cajón desplegable que se cierra automáticamente al navegar a otra sección.

---

### 2.1 Dashboard — Panel de control

**Ruta:** `/admin/dashboard`

Vista agregada en tiempo real de toda la plataforma, obtenida en una única llamada al endpoint `GET /api/v1/admin/platform/dashboard`.

#### Encabezado

- **Título:** "Panel de control"
- **Subtítulo:** "Vista global de la plataforma KeyGo · datos en tiempo real"
- **Selector de rango:** Hoy | 7 días | 30 días (estado visual, pendiente de integración con backend)
- **Botón Actualizar:** re-ejecuta la query; durante la carga muestra un icono giratorio.
- **Botón Acciones rápidas:** (pendiente de contenido)

#### Filas de datos

| Fila | Sección | Descripción |
|------|---------|-------------|
| 1 | Estado operativo | 4 tarjetas: Servicio, Entorno, Versión, Clave activa |
| 2 | Núcleo IAM | 4 tarjetas: Tenants, Usuarios, Apps, Memberships — cada una con desglose active / pending / suspended |
| 3 | Seguridad | 4 tarjetas: Sesiones, Refresh Tokens, Auth Codes, Alertas |
| 4 | Gestión y actividad | Dos columnas: Pendientes de gestión (izquierda), Actividad reciente (derecha) |
| 5 | Rankings | Top tenants por usuarios (izquierda), Top apps por accesos (derecha) |
| 6 | Salud de onboarding | 4 tarjetas: Pendientes de verificación, Verificaciones expiradas, Registros recientes, Verificaciones exitosas |

#### Estados de carga

- **Cargando:** skeleton animado en cada fila.
- **Error:** alerta roja describiendo el problema.
- **Vacío en listas/rankings:** mensaje en cursiva "Sin datos" o "Sin pendientes".

---

### 2.2 Gestión de Tenants

**Ruta:** `/admin/tenants`

Vista de dos paneles (lista + detalle) para administrar todas las organizaciones registradas en la plataforma.

#### Panel izquierdo — Lista de tenants

- **Botón "Nuevo"** → navega al formulario de creación de tenant (`/admin/tenants/new`).
- **Buscador** (debounce de 350 ms): filtra por nombre de tenant, consulta al servidor en tiempo real.
- **Pestañas de filtro por estado:** Todos / Activo / Suspendido / Pendiente.
- **Lista paginada** (20 tenants por página) — cada ítem muestra:
  - Nombre del tenant.
  - Badge de estado: "Activo" (verde), "Suspendido" (rojo), "Pendiente" (ámbar).
  - Slug del tenant (identificador único).
  - Fecha de creación.
  - Al hacer clic: abre el detalle del tenant en el panel derecho (se resalta en la lista con borde índigo).
- **Estados de carga y vacío**:
  - Cargando: 5 filas skeleton animadas.
  - Sin resultados: mensaje informativo.
- **Paginación** en el pie del panel: total de tenants, página actual, botones anterior/siguiente.

#### Panel derecho — Detalle o estado vacío

Si no hay ningún tenant seleccionado, el panel derecho muestra un ícono instructivo y el botón "Nuevo tenant".

Al seleccionar un tenant, se carga su detalle (ver sección [2.3](#23-detalle-de-un-tenant)).

#### Comportamiento en móvil

En pantallas pequeñas, la lista ocupa toda la pantalla. Al seleccionar un tenant, la lista se oculta y se muestra el detalle con un botón "← Tenants" para volver.

---

### 2.3 Detalle de un Tenant

**Ruta:** `/admin/tenants/:slug`

#### Qué ve el usuario

- **Cargando:** skeleton de detalle animado.
- **Error:** mensaje de error con díre "Volver a la lista".
- **Datos cargados:**
  - **Encabezado:** nombre del tenant + badge de estado.
  - **Slug** del tenant (identificador URL).
  - **Tarjeta de información:**
    - ID interno (UUID).
    - Slug.
    - Email del propietario.
    - Fecha de creación.
  - **Tarjeta de acciones:**

#### Acciones disponibles

| Acción | Condición | Resultado |
|---|---|---|
| "Ver como admin de tenant" | Siempre visible | Navega a `/tenant-admin?tenant={slug}` _(área en construcción)_ |
| "Suspender tenant" | Solo si estado es `ACTIVO` | Pide confirmación → suspende el tenant → actualiza la lista |
| "Reactivar tenant" | Solo si estado es `SUSPENDIDO` | Reactiva el tenant → actualiza la lista ⚠️ _mock pendiente (T-033)_ |

- Las acciones de suspender/reactivar notifican el resultado mediante mensajes toast (éxito o error).
- La acción de reactivar muestra una advertencia de que es un mock hasta que el backend implemente el endpoint T-033.

---

### 2.4 Crear un Tenant

**Ruta:** `/admin/tenants/new`

Formulario simple para registrar una nueva organización en la plataforma.

#### Campos del formulario

| Campo | Obligatorio | Notas |
|---|---|---|
| Nombre de la organización | Sí | Máximo 255 caracteres. El slug (identificador URL) se genera automáticamente. |
| Email del propietario | Sí | Será el contacto principal y se usará para el primer acceso. |

Una nota informativa explica que el slug se derivará del nombre y que los usuarios y apps se podrán configurar una vez creado el tenant.

#### Acciones

- **"Cancelar"** → vuelve a `/admin/tenants` (deshabilitado mientras se crea).
- **"Crear tenant"** → envía el formulario. Durante la creación se muestra spinner ("Creando…").
  - **Éxito:** toast de confirmación y redirección automática al detalle del nuevo tenant.
  - **Error:** toast con el mensaje de error.

---

## 3. Panel de Administrador de Tenant (ADMIN_TENANT)

**Ruta base:** `/tenant-admin/*`
**Acceso:** exclusivo para cuentas con rol `ADMIN_TENANT`.

> **En construcción.** Esta área aún no tiene páginas implementadas. El acceso está planificado pero no disponible en la versión actual.

Funcionalidades previstas:
- Gestión de usuarios del tenant.
- Asignación de roles dentro del tenant.
- Consulta de métricas de uso.
- Gestión de sesiones activas.

---

## 4. Panel de Usuario (USER_TENANT)

**Ruta base:** `/dashboard`
**Acceso:** exclusivo para cuentas con rol `USER_TENANT`.

> **En construcción.** Esta área aún no tiene páginas implementadas.

Funcionalidades previstas:
- Acceso a las aplicaciones autorizadas por la organización.
- Edición del perfil personal.
- Gestión de sesiones activas propias.

---

## 5. Funcionalidades pendientes

Las siguientes funcionalidades están planificadas pero aún no están disponibles:

| Funcionalidad | Área | Estado |
|---|---|---|
| Reactivación de tenants | Detalle de tenant | Mock; endpoint T-033 pendiente en backend |
| Registro de usuarios (paso 2) | `/register` | Formulario parcialmente implementado |
| Panel Administrador de Tenant | `/tenant-admin/*` | Sin páginas implementadas |
| Panel de Usuario | `/dashboard` | Sin páginas implementadas |
| Mi perfil | Menú de usuario (admin) | Botón presente, sin navegación |
| Configuración de cuenta | Menú de usuario (admin) | Botón presente, sin navegación |
| Buscador global | Cabecera admin | Decorativo, sin funcionalidad |
| Notificaciones | Cabecera admin | Decorativo, sin funcionalidad |
| Portal de documentación | Landing › Desarrolladores | Marcado "Próximamente" |
| SDKs e integraciones | Landing › Desarrolladores | Marcado "Próximamente" |
