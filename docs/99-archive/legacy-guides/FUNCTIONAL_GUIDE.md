# KeyGo UI — Guía Funcional

> **Audiencia:** usuario final, product owner o cualquier persona que quiera entender qué puede hacer con la aplicación, sin necesidad de conocimiento técnico.
>
> **Última actualización:** 2026-04-03

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
  - 2.5 [Sistema > API](#25-sistema--api)
3. [Panel de Administrador de Tenant (ADMIN_TENANT)](#3-panel-de-administrador-de-tenant-admin_tenant)
4. [Panel de Usuario (USER_TENANT)](#4-panel-de-usuario-user_tenant)
5. [Funcionalidades pendientes](#5-funcionalidades-pendientes)

---

## 1. Acceso público

Las siguientes áreas son accesibles **sin necesidad de iniciar sesión**.

---

### 1.1 Página de inicio (Landing)

**Ruta:** `/`

Si ya existe una sesión activa, la aplicación redirige automáticamente a `/dashboard` y no muestra la landing.

La página de inicio es la presentación pública de KeyGo. Está organizada en secciones verticales a las que se puede navegar mediante el menú superior.

#### Barra de navegación

Fija en la parte superior de la pantalla. Contiene:

- **Logo KeyGo** — vuelve al inicio de la página al hacer clic.
- **Menú de secciones** (solo escritorio): "Características", "Cómo funciona", "Para tu equipo", "Planes", "Desarrolladores" — desplazan la página a cada sección.
- **Acciones principales** (esquina superior derecha):
  - "Regístrate" → lleva al formulario de registro de usuario (`/register`).
  - "Nuevo contrato" → lleva al asistente de contratación (`/subscribe`).
  - "Iniciar sesión" → lleva al login (`/login`).
- **Selector de idioma** integrado en la barra superior (ES/EN) para cambiar idioma sin salir de la landing.
- El cambio de idioma aplica en runtime sobre toda la landing: menu superior, hero, caracteristicas, como funciona, roles, planes, desarrolladores y CTA final.
- En movil y tablet (incluyendo iPad Air), la marca del header de landing se muestra solo con el icono de llave y el selector de idioma muestra solo bandera (sin texto ES/EN); los textos reaparecen en `lg`.
- En movil, el bloque inicial del hero agrega separacion superior adicional para evitar que el badge de plataforma quede pegado al header fijo.

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

Comportamiento en red lenta (carga diferida del catalogo):
- La sección carga planes al entrar en viewport (no bloquea el render inicial de la landing).
- Si la consulta supera 10 segundos, se aborta ese intento y se reintenta automáticamente cada 5 segundos (máximo 3).
- Si se agotan los reintentos automáticos, se informa el fallo y se mantiene opción de reintento desde el bloque local.

#### Sección Desarrolladores (`#developers`)

Recursos para integradores:

- **Documentación técnica** — abre una guía pública en `/developers`.
- **SDKs e integraciones** — _Próximamente_.
- **API REST completa** — enlaza a la sección de endpoints esenciales dentro de la guía pública.
- Banner destacado con acceso directo a la guía de integración.

#### Pie de página / CTA final

Sección de cierre con dos acciones: "Contratar ahora" (→ `/subscribe`) e "Iniciar sesión" (→ `/login`). Incluye indicador de estado de la plataforma.

El texto del indicador de estado del footer tambien se traduce en runtime segun el idioma activo (ES/EN).

---

### 1.2 Iniciar sesión

**Ruta:** `/login`

Si ya existe una sesión activa, la aplicación redirige automáticamente a `/dashboard` y no muestra el formulario de login.

Permite autenticarse mediante el flujo OAuth2 Authorization Code + PKCE. El proceso es seguro: nunca se envían credenciales en texto plano desde el navegador.

Ruta de salida segura:
- `/logout` — limpia la sesión en memoria (tokens y estado bloqueante) y redirige a `/login`. Sirve como salida directa ante contextos de sesión inconsistentes.

Rutas publicas de recuperacion de acceso:
- `/forgot-password` — solicitud de recuperacion por correo (respuesta neutral para evitar enumeracion de usuarios).
- `/recover-password` — recuperacion por token one-time recibido por correo.
- `/reset-password` — reset con contrasena temporal entregada por administrador.

#### Flujo paso a paso

0. **Pantalla de carga global** (automática, previa a cualquier ruta) — Al abrir o recargar la aplicación, se muestra una capa de carga visual mientras se valida o restaura la sesión. Evita que el usuario vea la pantalla en blanco en conexiones lentas.

1. **Preparación de sesión** (automática, invisible) — La aplicación establece un canal seguro con el servidor. Se muestra un spinner animado ("Preparando sesión segura…"). Si falla, se muestra un mensaje descriptivo con opción de reintentar.

  Comportamiento en red lenta (implementación actual):
  - Cada intento de preparación tiene timeout de 10 segundos.
  - Si expira, la app reintenta automáticamente cada 5 segundos, con un máximo de 3 intentos.
  - El contador de auto-reintentos se reinicia solo cuando el usuario fuerza un reintento manual o el flujo reinicia explícitamente la preparación de sesión.
  - Al agotarse los intentos automáticos, el usuario puede reintentar manualmente.

2. **Formulario de credenciales:**
   - Campo **email o nombre de usuario**.
  - Campo **contraseña** con control de visibilidad (icono de ojo para mostrar/ocultar).
   - Si está configurado: widget de verificación **Turnstile** (Cloudflare) para protección anti-bot.
   - Botón "Iniciar sesión".
  - Enlace "Olvide mi contrasena" hacia `/forgot-password`.
  - Pie de soporte con CTA "Olvide mi contrasena" y "Registrate" en tamano legible para lectura continua.

4. **Recuperacion de acceso (publico):**
  - En `/forgot-password`, el usuario ingresa su correo y recibe mensaje neutral de confirmacion.
  - En `/recover-password`, el usuario ingresa token de recuperacion y define nueva contrasena.
  - En `/reset-password`, el usuario confirma correo + contrasena temporal y define nueva contrasena.

Idioma de interfaz en login:
- Los textos del flujo de login se renderizan en el idioma activo de la app.
- Si no hay selección manual previa, login usa el idioma detectado del dispositivo.
- El login incluye selector de idioma visible en la cabecera de la tarjeta para cambiar idioma en el mismo contexto de autenticación.

3. **Autenticación y redirección** (automática, invisible) — Las credenciales se validan, se obtienen los tokens de sesión y el usuario es llevado automáticamente al área correspondiente a su rol:
  - `ADMIN` → `/dashboard`
  - `ADMIN_TENANT` → `/dashboard`
  - `USER_TENANT` → `/dashboard`
  - **Sin rol compatible en JWT** → modal de asistencia bloqueante (se superpone a la pantalla actual)

    Comportamiento en red lenta para autenticación/token:
    - Las operaciones de login e intercambio de token usan timeout de 10 segundos por intento.
    - No se aplican reintentos automáticos en estos pasos; el usuario conserva control de reintento manual.

#### Caso especial: login exitoso sin rol compatible

**Presentación:** Modal bloqueante sobre la pantalla actual (no es una página separada).

Si el inicio de sesión fue correcto pero la cuenta no tiene permisos disponibles para usar la interfaz, el sistema levanta un modal de asistencia sobre cualquier pantalla que estuviera activa, sin navegar a ninguna ruta. El usuario no puede cerrar el modal con Escape ni haciendo clic fuera; solo puede actuar con las acciones explícitas.

La pantalla muestra:
- Confirmación de que la autenticación fue exitosa.
- Instrucciones para contactar soporte técnico o administrador.
- Un código de referencia visible (`KG-NO-ROLE`) para reportar el caso rápidamente.
- Datos de referencia para soporte (ID de usuario `sub`, usuario, correo, roles detectados, tenant del JWT, tenant esperado por la UI, client ID de la UI e issuer).

Cuando ocurre un error de render no controlado a nivel de aplicación, la UI muestra una pantalla de contingencia con acción de retorno al dashboard. Esa pantalla:
- respeta el idioma activo y el theme efectivo del usuario/sistema,
- mantiene el footer institucional visible,
- y, si el detalle técnico es largo, desplaza el contenido dentro del panel sin extender toda la página.

La recuperación ya no depende de volver siempre al dashboard:
- permite recargar la ruta actual,
- y ofrece una salida segura contextual según la zona donde ocurrió el error.
- Botón para copiar los datos al portapapeles.
- Acciones configurables según el problema (por ejemplo: cerrar mensaje, cerrar sesión, navegar a login).

#### Mensajes de error posibles

| Situación | Mensaje mostrado |
|---|---|
| Credenciales incorrectas | Error de autenticación |
| Email no verificado | Pendiente de verificación de email |
| Usuario no encontrado | Recurso no encontrado |
| Aplicación o tenant no disponible | Servicio no disponible |
| Acceso suspendido | Acceso temporalmente suspendido |
| Sesión expirada | Re-inicialización automática |

#### Comportamiento ante cargas lentas en cualquier pantalla

- El loader global no se muestra por cualquier llamada de red; solo escala cuando la vista está en una ventana de renderización crítica (por ejemplo, transición de ruta).
- Si la red responde antes de 5 segundos, el loader global no aparece.
- Si una operación crítica supera 5 segundos durante la ventana de renderización, aparece el loader global.
- Si la vista ya tiene contenido útil en pantalla, el loader global no interviene para cargas de fondo.

#### Contrato funcional aprobado (Paso 0) — Loader global

Estado: **Aprobado el 2026-04-02**.

- El loader global solo interviene cuando la renderización de la vista está afectada (pantalla sin contenido útil o bloqueada para continuar).
- Si la vista ya cargó contenido útil, el loader global no debe mostrarse.
- Si un componente ya tiene loader local, el loader global no debe aparecer en cargas normales.
- Umbral de intervención global: si una llamada crítica de backend supera **5 segundos**, se permite mostrar loader global.
- Umbral de corte: si la misma llamada supera **10 segundos**, se debe abortar la solicitud en curso.
- Al abortar por timeout: mostrar toast, esperar **5 segundos** y reintentar automáticamente.
- Política de reintento automático: máximo **3 reintentos** por operación.
- Si se agotan los 3 reintentos: detener nuevos intentos automáticos y mostrar toast final de fallo.

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

La cabecera del flujo incluye selector de idioma (ES/EN) visible durante todo `/subscribe`, incluyendo modo de retomar contrato.
Los textos del wizard (pasos, formularios, mensajes de estado y acciones) tambien cambian en runtime segun el idioma activo.
En movil, la marca del header del flujo se muestra solo con el icono de llave (sin texto "KeyGo") para ahorrar ancho util.
En movil, el selector de idioma del header muestra solo la bandera del idioma activo; la etiqueta textual (ES/EN) aparece desde `sm` en adelante.
En movil, el acceso a login del header muestra solo la accion (**Sign in / Iniciar sesion**), ocultando el texto introductorio; en `sm+` se vuelve a mostrar la frase completa.

En pantallas desktop, el flujo usa layout de tres columnas: pasos a la izquierda, contenido del paso al centro y resumen en vivo a la derecha con los datos seleccionados/ingresados.
El bloque "Current step" del resumen en vivo usa resaltado visual de seleccion para identificar claramente el estado actual del wizard.

#### Paso 1 — Selección de plan

Las tarjetas se cargan dinámicamente desde la API (`GET /billing/catalog`). Cada tarjeta muestra:
- Badge de tipo: **Empresa** o **Personal**.
- Toggle de periodicidad: **Mensual / Anual** (si el plan tiene las dos versiones).
- El toggle de periodicidad se traduce en runtime segun el idioma activo (ES/EN).
- Precio formateado con divisa, días de prueba y lista de beneficios (entitlements).

Mejoras de visualizacion del paso:
- En `subscribe` el carrusel prioriza tarjetas mas anchas en desktop intermedio para mejorar legibilidad.
- En movil, la seleccion de plan muestra una sola tarjeta por vista para mantener legibilidad y evitar cards comprimidas.
- Se corrigio el desborde horizontal del carrusel cuando los planes ya estan cargados, manteniendo el contenido dentro del viewport en telefono y tablet.
- El indicador de pasos en movil se compacto para evitar desborde horizontal y mantener centrado el contenido del wizard.
- El badge de popularidad mantiene una sola linea y evita quiebre de texto.
- El contenedor principal y paneles laterales se compactaron/ajustaron para reducir la sensacion de pagina excesivamente larga.
- El boton "Continuar" del paso de plan se acerco al carrusel para mantener una separacion consistente con los demas formularios del wizard.
- El CTA de retoma de contratacion al pie del wizard incremento su tamano/peso visual para alinearse con otros textos de accion del producto.

Acción: "Continuar →" habilitado al seleccionar una tarjeta.

Comportamiento en red lenta (implementación actual):
- Si la carga del catálogo supera 10 segundos, la app corta la solicitud de ese intento.
- Al cortar por timeout, se muestra una notificación y se reintenta automáticamente luego de 5 segundos.
- Se realizan hasta 3 reintentos automáticos; si todos fallan, se detienen y se notifica al usuario.

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
- Los modales de **Términos** y **Política** se muestran directamente en el idioma global activo de la app (ES/EN), sin selector de idioma interno.
- En esos modales, el mensaje de ayuda de scroll y las acciones **Cerrar / Acepto** también se traducen en runtime según el idioma activo.
- Widget Turnstile (si `VITE_TURNSTILE_SITE_KEY` configurado).
- Botón "Confirmar y continuar →" — llama a `POST /billing/contracts` en el backend. Un honeypot invisible filtra envíos automáticos.

#### Paso 4 — Verificación de email

- Se envía un código OTP de 6 dígitos al email introducido.
- Interface de 6 cajas con auto-foco, soporte de pegado y navegación con Retroceso.
- Al confirmar: llama a `POST /billing/contracts/{id}/verify-email`.
- Desde este mismo paso se puede **retomar una contratación existente** ingresando el ID de contrato, sin salir de `/subscribe`.
- Si el contrato ya quedó en pago pendiente/listo para activar, el asistente avanza directamente al paso 5.

Comportamiento en red lenta al retomar contrato por ID:
- Si la consulta del contrato supera 10 segundos, ese intento se corta por timeout.
- Tras timeout se muestra notificación y se reintenta en 5 segundos.
- Se permiten hasta 3 reintentos automáticos antes de detenerse y notificar fallo final.

Comportamiento en operaciones de confirmación (crear contrato, verificar código, reenviar código, aprobar/activar):
- Cada intento tiene timeout de 10 segundos.
- Si se supera el tiempo, se informa al usuario y no se ejecutan reintentos automáticos.
- El usuario mantiene control para reintentar manualmente desde la misma pantalla.

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
  - En rutas base con subrutas (como `Dashboard` y `Mi cuenta`), el resaltado activo es exacto para evitar que queden seleccionadas al navegar a otras secciones.
- **Perfil de usuario** en la parte inferior: avatar con iniciales, nombre completo y rol.

#### Cabecera superior

- **Menú hamburgesa** (solo móvil) — abre/cierra el sidebar como cajón lateral.
- **Buscador** (escritorio) — decorativo en esta versión, muestra `⌘K`.
- **Selector de idioma** (dropdown con bandera):
  - Disponible en la cabecera para cambio rapido de idioma en cualquier pantalla autenticada.
  - Permite alternar entre `es-CL` y `en-US`.
  - El cambio impacta inmediatamente toda la interfaz del dashboard.
- **Selector de tema:** Sistema / Claro / Oscuro / Alto contraste (la preferencia persiste entre sesiones).
  - Al desplegarse, oculta la opcion actualmente seleccionada.
  - En estado cerrado, el valor seleccionado se muestra con color destacado para mejorar la lectura del contexto activo.
- **Botón de notificaciones** — decorativo en esta versión.
- **Menú de usuario** (clic en el avatar):
  - Información del usuario (avatar y nombre visible).
    - El nombre prioriza nombre + apellido; si no existe, usa username como fallback.
    - No muestra la etiqueta de rol en ese bloque.
  - Selector de rol activo (dropdown), ubicado sobre "Mi cuenta".
    - Muestra solo los roles incluidos en el claim `roles` del usuario autenticado.
    - Al desplegarse, oculta el rol que ya esta seleccionado.
    - El panel del selector se abre hacia la izquierda.
    - Al cambiar de rol, la UI vuelve a `/dashboard` y se refrescan menú, vistas y permisos visibles.
  - "Mi cuenta" — navega a `/dashboard/account`.
  - "Configuración de cuenta" — navega a `/dashboard/account/settings`.
  - "FAQs" — navega a `/dashboard/faq`.
  - "Cerrar sesión" — elimina la sesión y redirige al login.

#### Comportamiento en móvil

En pantallas pequeñas, la barra lateral se convierte en un cajón desplegable que se cierra automáticamente al navegar a otra sección.

#### Consola de desarrollo (KeyGo Console) — solo ADMIN

Una franja fija en la parte inferior de la pantalla, visible exclusivamente para cuentas con rol `ADMIN`. Permite inspeccionar el tráfico HTTP del panel sin abrir las DevTools del navegador.

- **Estado colapsado (por defecto):** muestra solo la barra de 28px con el título "KeyGo Console" y un contador de requests registrados.
- **Estado expandido:** muestra la salida de comandos (zona de log) y un campo de entrada de comandos en la parte inferior.
- **Altura ajustable:** el borde superior se puede arrastrar para redimensionar la consola (mínimo 120px, máximo 65% de la altura de pantalla).

**Cómo abrir/cerrar:**
- Clic en el botón `▲` / `▼` de la cabecera de la consola.
- Doble clic sobre la barra de título.
- Atajo de teclado `Ctrl+`` (acento grave).

**Comandos disponibles:**

| Comando | Descripción |
|---|---|
| `req [N]` | Muestra los últimos N requests HTTP (N por defecto: 10, máximo 50) |
| `requests [N]` | Alias de `req` |
| `filter METODO` | Filtra requests por método HTTP: `GET`, `POST`, `PUT`, `DELETE`, `PATCH` |
| `status` | Resumen de todos los requests agrupados por código de estado (2xx, 4xx, etc.) |
| `detail N` | Muestra el detalle completo del N-ésimo request más reciente (URL, estado, duración, body) |
| `clear` / `cls` | Limpia la salida de la consola |
| `help` / `?` | Lista todos los comandos disponibles |

El campo de entrada soporta historial de comandos con las teclas `↑` / `↓`.

---

### 2.1 Dashboard — Panel de control

Comportamiento en red lenta (implementación actual):
- Si la carga del dashboard supera 10 segundos, se corta ese intento por timeout.
- La aplicación reintenta automáticamente cada 5 segundos, hasta 3 veces.
- Si no se logra respuesta tras los 3 reintentos, se detiene la secuencia automática y se informa al usuario.

**Ruta:** `/dashboard`

Vista agregada en tiempo real de toda la plataforma, obtenida en una única llamada al endpoint `GET /api/v1/admin/platform/dashboard`.

#### Encabezado

- **Título:** "Panel de control"
- **Subtítulo:** "Vista global de la plataforma KeyGo · datos en tiempo real"
- **Selector de rango:** Hoy | 7 días | 30 días (estado visual, pendiente de integración con backend)
- **Botón Actualizar:** re-ejecuta la query; durante la carga muestra un icono giratorio.
- **Botón Acciones rápidas:** (pendiente de contenido)

Idioma de interfaz:
- Todos los textos del dashboard admin (encabezado, botones, títulos de sección, tarjetas y estados vacíos) se renderizan con el idioma activo (`es-CL` o `en-US`).

#### Filas de datos

| Fila | Sección | Descripción |
|------|---------|-------------|
| 1 | Estado operativo | 4 tarjetas: Servicio, Entorno, Versión, Clave activa |
| 2 | Núcleo IAM | 4 tarjetas: Tenants, Usuarios, Apps, Memberships — cada una con desglose active / pending / suspended |
| 3 | Seguridad | 4 tarjetas: Sesiones, Refresh Tokens, Auth Codes, Alertas |
| 4 | Gestión y actividad | Dos columnas: Pendientes de gestión (izquierda), Actividad reciente (derecha) |
| 5 | Rankings | Top tenants por usuarios (izquierda), Top apps por memberships (derecha) |
| 6 | Salud de onboarding | 4 tarjetas: Pendientes de verificación, Verificaciones expiradas, Registros recientes, Verificaciones exitosas |

Iconografía visible:
- Las tarjetas del dashboard usan iconos contextuales por bloque para facilitar lectura rápida de métricas.
- El patrón se mantiene en modo claro/oscuro y no depende solo de color para comunicar estado.

#### Estados de carga

- **Cargando:** skeleton animado en cada fila.
- **Error:** alerta roja describiendo el problema.
- **Vacío en listas/rankings:** mensaje en cursiva "Sin datos" o "Sin pendientes".

---

### 2.2 Gestión de Tenants

Comportamiento en red lenta (listado principal):
- Si el listado de tenants supera 10 segundos, se corta ese intento por timeout.
- Se reintenta automáticamente cada 5 segundos, hasta 3 intentos.
- Si se agotan los intentos, se notifica el fallo y el usuario puede volver a intentar manualmente.

**Ruta:** `/dashboard/tenants` (solo rol `ADMIN`)

Vista de dos paneles (lista + detalle) para administrar todas las organizaciones registradas en la plataforma.

Idioma de interfaz:
- Los textos de lista, filtros, estados, paginacion y acciones se renderizan en el idioma activo (`es-CL` o `en-US`).

#### Panel izquierdo — Lista de tenants

- **Botón "Nuevo"** → navega al formulario de creación de tenant (`/dashboard/tenants/new`).
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

**Ruta:** `/dashboard/tenants/:slug`

Idioma de interfaz:
- Estados, etiquetas de informacion, confirmaciones y botones de accion usan el idioma activo.

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

Comportamiento en red lenta:
- La carga del detalle del tenant usa timeout de 10 segundos por intento.
- Ante timeout, se reintenta automáticamente cada 5 segundos, con máximo 3 intentos.
- Si se agotan los reintentos automáticos, se informa al usuario y queda disponible reintento manual.
- Las acciones de suspender/reactivar usan timeout de 10 segundos sin reintento automático.

---

### 2.4 Crear un Tenant

**Ruta:** `/dashboard/tenants/new`

Formulario simple para registrar una nueva organización en la plataforma.

Idioma de interfaz:
- Labels, hints, validaciones y mensajes de exito/error del formulario usan el idioma activo.

#### Campos del formulario

| Campo | Obligatorio | Notas |
|---|---|---|
| Nombre de la organización | Sí | Máximo 255 caracteres. El slug (identificador URL) se genera automáticamente. |
| Email del propietario | Sí | Será el contacto principal y se usará para el primer acceso. |

Una nota informativa explica que el slug se derivará del nombre y que los usuarios y apps se podrán configurar una vez creado el tenant.

#### Acciones

- **"Cancelar"** → vuelve a `/dashboard/tenants` (deshabilitado mientras se crea).
- **"Crear tenant"** → envía el formulario. Durante la creación se muestra spinner ("Creando…").
  - **Éxito:** toast de confirmación y redirección automática al detalle del nuevo tenant.
  - **Error:** toast con el mensaje de error.

Comportamiento en red lenta:
- La creación usa timeout de 10 segundos por intento.
- No se aplican reintentos automáticos en esta operación; el usuario controla el reintento manual.

### 2.5 Sistema > API

**Ruta:** `/dashboard/feature/api` (solo rol `ADMIN`)

Vista de estado rápido para consumo operativo de la API de plataforma.

Qué muestra:
- **Tenants:** total global y cantidad activa.
- **Usuarios:** total global y cantidad activa.
- **Apps:** total de aplicaciones cliente registradas.
- **Claves activas:** cantidad de llaves de firma habilitadas.

Fuente de datos:
- `GET /api/v1/platform/stats`.

Comportamiento en red lenta:
- La vista usa carga local por bloque (sin overlay global de pantalla completa).
- La consulta aplica timeout de 10 segundos y reintentos automáticos cada 5 segundos (máximo 3).
- Si se agotan reintentos, se muestra alerta local de error y el resto del dashboard sigue navegable.

---

## 3. Panel de Administrador de Tenant (ADMIN_TENANT)

**Ruta base:** `/dashboard`
**Acceso:** exclusivo para cuentas con rol `ADMIN_TENANT`.

Esta área usa el mismo layout del dashboard global (misma cabecera y mismo esqueleto visual), con sidebar propio para el rol `ADMIN_TENANT`.

### 3.1 Dashboard base

**Ruta:** `/dashboard`

Muestra una vista resumida inicial para administración de tenant con tarjetas conectadas a datos reales:
- **Usuarios activos:** conteo de usuarios en estado activo del tenant.
- **Aplicaciones:** total de client apps registradas en el tenant.
- **Accesos del día:** sesiones del usuario actual con último acceso en el día vigente.

Comportamiento en red lenta:
- Cada tarjeta se resuelve con carga local (sin bloquear toda la pantalla).
- Las consultas GET usan timeout de 10 segundos y reintentos automáticos cada 5 segundos (máximo 3).
- Si una consulta falla tras reintentos, la tarjeta afectada muestra `N/D` y mensaje local de error.

Comportamiento de contexto de sesión:
- Si la sesión no permite resolver tenant activo, la vista no ejecuta consultas tenant-scoped y muestra una alerta local solicitando volver a iniciar sesión.
- Ese mensaje respeta el idioma activo de la interfaz (`es-CL` / `en-US`).

### 3.2 Usuarios del tenant

**Ruta:** `/dashboard/tenant/users`

Gestión completa de usuarios del tenant con operaciones de lectura y escritura:

**Lectura:**
- Tabla con todos los usuarios: username, email, nombre, estado
- Filtrado visible por estado

**Escritura:**
- **Crear usuario:** botón "+Crear usuario" abre modal con formulario (username, email, password requeridos; nombre y apellido opcionales)
- **Resetear contraseña:** botón en cada fila permite establecer nueva contraseña

Comportamiento en red lenta:
- La carga de usuarios (GET) usa timeout de 10 segundos y reintentos automáticos cada 5 segundos (máximo 3).
- Las operaciones de crear/editar/resetear contraseña usan timeout de 10 segundos sin auto-retry.

### 3.3 Aplicaciones del tenant

**Ruta:** `/dashboard/tenant/apps`

Gestión de aplicaciones client del tenant con lectura y escritura:

**Lectura:**
- Tabla con todas las apps: nombre, client_id, tipo (PUBLIC/CONFIDENTIAL), estado, grants

**Escritura:**
- **Crear aplicación:** botón "+Crear aplicación" abre modal con formulario (nombre requerido; tipo, grants requeridos; descripción, redirect_uris, scopes opcionales). Los campos de tipo y grants usan dropdowns reutilizables del sistema.
- **Rotar secret:** botón en cada fila permite generar nuevo client_secret; muestra el nuevo secret una sola vez con opción copiar

Comportamiento en red lenta:
- La carga de aplicaciones (GET) usa timeout de 10 segundos y reintentos automáticos cada 5 segundos (máximo 3).
- Crear aplicación y rotar secret usan timeout de 10 segundos sin auto-retry.

### 3.4 Memberships por usuario

**Ruta:** `/dashboard/tenant/memberships`

Gestión de asignaciones usuario-app (memberships) con lectura y escritura:

**Lectura:**
- Selector de usuario (dropdown) para elegir usuario del tenant
- Tabla con memberships del usuario: app, estado, roles asignados, fecha de creación

**Escritura:**
- **Crear membership:** botón "+Crear membership" abre modal para seleccionar usuario, aplicación y roles; crea la asignación. La selección de usuario y aplicación se resuelve con dropdowns reutilizables del sistema.
- **Revocar membership:** botón en cada fila con confirmación; elimina la asignación inmediatamente

Comportamiento en red lenta:
- Las cargas GET de usuarios, aplicaciones, memberships y roles usan timeout de 10 segundos y reintentos automáticos cada 5 segundos (máximo 3).
- Crear/revocar membership usa timeout de 10 segundos sin reintento automático.

---

## 4. Panel de Usuario (USER_TENANT)

**Ruta base:** `/dashboard`
**Acceso:** exclusivo para cuentas con rol `USER_TENANT`.

Esta area usa el mismo layout del dashboard global (misma cabecera y mismo esqueleto visual), con sidebar propio para el rol `USER_TENANT`.

### 4.1 Dashboard base

**Ruta:** `/dashboard`

Vista inicial con resumen personal conectado a datos reales:
- **Sesiones activas:** número de sesiones abiertas de la cuenta.
- **Último acceso:** fecha/hora más reciente detectada en sesiones de la cuenta.
- **Aplicaciones con acceso:** total de apps en las que el usuario mantiene membresía.

Comportamiento en red lenta:
- Cada tarjeta se resuelve con carga local (sin bloquear toda la pantalla).
- Las consultas GET usan timeout de 10 segundos y reintentos automáticos cada 5 segundos (máximo 3).
- Si una consulta falla tras reintentos, la tarjeta afectada muestra `N/D` y mensaje local de error.

Comportamiento de contexto de sesión:
- Si la sesión no permite resolver tenant activo, la vista no ejecuta consultas tenant-scoped y muestra una alerta local solicitando volver a iniciar sesión.
- Ese mensaje respeta el idioma activo de la interfaz (`es-CL` / `en-US`).

### 4.2 Mi acceso

**Ruta:** `/dashboard/user/my-access`

Muestra las asignaciones de acceso del usuario autenticado:
- Aplicacion asociada
- Estado de la asignacion
- Roles asignados
- Fecha de asignacion

Idioma de interfaz:
- Esta vista usa el idioma activo para titulo, subtitulo, columnas, estados y mensajes de carga/error/vacio.
- Las fechas de asignacion se formatean segun locale activo (`es-CL` o `en-US`).

Comportamiento en red lenta:
- Las consultas de accesos y aplicaciones usan timeout de 10 segundos y reintentos automáticos cada 5 segundos (máximo 3).

### 4.3 Actividad

**Ruta:** `/dashboard/user/activity`

Muestra actividad reciente de la cuenta:
- Ultimo inicio de sesion (desde token)
- Linea de tiempo de asignaciones de acceso por aplicacion

Comportamiento en red lenta:
- Las consultas de actividad (memberships/apps) usan timeout de 10 segundos y reintentos automáticos cada 5 segundos (máximo 3).

### 4.6 Idioma y navegación del dashboard

**Ruta base:** `/dashboard`

Comportamiento:
- El shell autenticado (menú lateral, cabecera y menú de usuario) utiliza el idioma activo de i18n.
- El selector de idioma en configuración de cuenta impacta inmediatamente la navegación del dashboard.
- El modo automático mantiene el idioma del dispositivo; la selección manual se conserva en el navegador.

### 4.4 Mi cuenta

**Ruta:** `/dashboard/account`

Vista unificada de cuenta personal (todos los roles autenticados) con tabs:
- **Resumen:** identidad base, estado y tenant (icono de dashboard).
  - Cuando no existe `first_name` ni `last_name`, el nombre mostrado usa `username` como fallback.
  - En esta vista de resumen no se muestra correo ni rol activo.
- **Perfil:** formulario self-service para actualizar perfil (icono de usuario).
- **Accesos:** listado real de memberships/roles por aplicación (icono de seguridad).
- **Actividad:** vista real de sesiones recientes de la cuenta (icono de reloj), con estado de sesión actual, IP, último acceso y expiración.

Campos editables en la tab Perfil:
- Nombre y apellido
- Telefono
- Locale y zona horaria
- Fecha de nacimiento
- Sitio web
- URL de foto de perfil

Idioma de interfaz:
- Tabs, resumen, labels de formulario y mensajes de carga/error se muestran en el idioma activo.
- La validacion del campo URL de foto de perfil y el toast de guardado tambien se localizan por idioma activo.

Comportamiento en red lenta:
- La carga del perfil usa timeout de 10 segundos y reintentos automáticos cada 5 segundos (máximo 3).
- La carga de accesos usa timeout de 10 segundos y reintentos automáticos cada 5 segundos (máximo 3).
- La carga de actividad (sesiones de cuenta) usa timeout de 10 segundos y reintentos automáticos cada 5 segundos (máximo 3).
- Guardar cambios usa timeout de 10 segundos sin auto-retry.

Compatibilidad:
- La ruta legacy `/dashboard/user/profile` redirige a `/dashboard/account`.

### 4.5 Configuración de cuenta

**Ruta:** `/dashboard/account/settings`

Vista de configuraciones personales y operativas por tabs:
- **Seguridad:** cambio de contraseña (icono de escudo).
- **Notificaciones:** preferencias por canal/tipo (correo, in-app, digest semanal) (icono de campana).
- **Conexiones:** gestión de cuentas externas implementada en modo temporal con MSW (pendiente contrato backend oficial F-042) (icono de enlace).
  - La selección del proveedor a vincular se realiza mediante dropdown reutilizable compartido con el resto del dashboard.
- **Idioma de la interfaz:** selector de idioma local por navegador con modo automático/manual (icono de globo).
- **Facturacion:** suscripción y facturas para rol `ADMIN_TENANT` (datos reales); para otros roles se muestra acceso restringido (icono de tarjeta).
  - En suscripción activa con renovación automática, se habilita la acción "Cancelar renovación" con confirmación previa.
  - Al cancelar, la suscripción sigue activa hasta el fin del período actual y queda programada sin renovación.

Idioma de interfaz (nuevo):
- Se incorpora selector de idioma como tab dedicada dentro de configuración.
- Idiomas disponibles en esta fase: `es-CL` y `en-US`.
- Comportamiento por defecto: si el usuario no define preferencia manual, la app toma la configuración del dispositivo cliente.
- Si el usuario cambia idioma manualmente, la preferencia queda guardada en el navegador y prevalece en futuras sesiones de ese dispositivo.
- Existe acción para volver al modo automático (idioma del dispositivo).
- Se muestra una ayuda contextual que aclara que el modo automático usa `navigator.languages` del navegador.
- Regla de implementación: los selectores de la app deben reutilizar el componente `Dropdown` compartido (via `SelectDropdown`) para mantener consistencia de UX.

Sesiones activas (nuevo):
- Se reubican fuera de Configuración de cuenta en una vista dedicada.
- Ruta principal: `/dashboard/account/sessions`.
- Incluye listado de sesiones activas/remotas y acción de cierre remoto.

Comportamiento en red lenta:
- Suscripción y facturas usan timeout de 10 segundos y reintentos automáticos cada 5 segundos (máximo 3).

Compatibilidad:
- La ruta legacy `/dashboard/user/sessions` redirige a `/dashboard/account/sessions`.

### 4.6 FAQs del sistema

**Ruta:** `/dashboard/faq`

Centro de ayuda incremental para guiar al usuario con preguntas frecuentes de todo el sistema.

Estado actual:
- Incluye contenidos por menú principal del dashboard (según rol), no solo de cuenta.
- Se organiza en pestañas alineadas al menú sidebar visible para el rol activo.
- Dentro de cada pestaña, las preguntas se ordenan de menor a mayor complejidad para facilitar onboarding y auto-soporte.
- Incluye buscador local para filtrar preguntas y respuestas por palabra clave dentro de cada pestaña.
- Está diseñada para crecer orgánicamente a medida que se habiliten nuevas funcionalidades.

Acceso:
- Disponible para cualquier usuario autenticado.
- Accesible desde el sidebar, menú de usuario y desde Configuración de cuenta.

---

## 5. Funcionalidades pendientes

Las siguientes funcionalidades tienen implementación visible en UI, pero aún dependen de backend parcial o inexistente. En cada pantalla se muestra un badge de estado con el detalle de lo pendiente.

| Funcionalidad | Área | Estado |
|---|---|---|
| Reactivación de tenants | Detalle de tenant | Mock temporal; endpoint backend pendiente |
| Registro de usuarios (paso 2) | `/register` | Formulario parcialmente implementado |
| Módulos admin cross-tenant en placeholder (`audit`, `signing-keys`, `tokens`) | `/dashboard/feature/:featureId` | UI funcional mockeada (tabla, KPIs y acciones); backend real pendiente por módulo |
| Módulos tenant/user auxiliares (`members`, `services`, `my-access`, `activity`) | `/dashboard/feature/:featureId` | UI funcional mockeada; falta contrato backend definitivo |
| Panel Administrador de Tenant | `/dashboard` + `/dashboard/tenant/*` | Usuarios, Apps y Memberships implementados; sesiones por usuario y cambios de estado integrados con backend real |
| Panel de Usuario | `/dashboard` + `/dashboard/user/*` + `/dashboard/account*` | Mi acceso y actividad base disponibles; historial avanzado depende de contrato dedicado |
| Seguridad de cuenta (change-password/sesiones remotas) | `/dashboard/account/settings` | Implementada (cambio de contraseña y revocación remota de sesiones) |
| Buscador global | Cabecera admin | Decorativo, sin funcionalidad |
| Notificaciones | Cabecera admin | Decorativo, sin funcionalidad |
| Portal de documentación | Landing › Desarrolladores | Marcado "Próximamente" |
| SDKs e integraciones | Landing › Desarrolladores | Marcado "Próximamente" |
