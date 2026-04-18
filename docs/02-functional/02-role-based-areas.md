# Áreas por rol

Resumen funcional de lo que cada rol puede hacer dentro de KeyGo UI.

## Administrador global

- Ver estado general de la plataforma.
- Ejecutar acciones rápidas expuestas por el backend directamente desde el dashboard cuando el endpoint las entregue.
- Gestionar tenants.
- Gestionar usuarios de plataforma.
- Consultar información global del servicio.
- Revisar en el detalle de usuario la identidad priorizando nombre completo y correo, con foto de perfil cuando exista `picture_url`.
- Revisar en el detalle de usuario los roles asignados con nombre, código, descripción, alcance, fecha e identificadores de asignación.
- Asignar nuevos roles de plataforma desde el catálogo vigente entregado por backend, evitando ofrecer roles ya asignados al usuario.
- Al asignar `KEYGO_ADMIN` a otro usuario, la UI muestra una advertencia de privilegio global, exige escribir una frase consciente basada en el `username` objetivo, luego solicita la contraseña del operador y mantiene un estado de carga visible hasta completar la elevación.
- Al suspender un usuario, la UI exige el mismo flujo reforzado: advertencia explícita, frase consciente asociada al `username`, reingreso de contraseña y espera visible hasta completar la suspensión.
- Al reactivar un usuario, la UI exige confirmación consciente con frase asociada al `username` y espera visible hasta completar la reactivación, pero sin reingreso de contraseña.
- Si el usuario ya está `SUSPENDED`, el detalle queda en modo casi solo lectura: no se habilitan acciones, formularios ni enlaces interactivos en esa vista, salvo la acción explícita de reactivación.

## Administrador de tenant

- Acceder al menú de tenants asociados y ver solo las organizaciones vinculadas a su cuenta.
- Seleccionar uno de sus tenants asociados para fijarlo como contexto de gestión y continuar hacia usuarios, aplicaciones, memberships y billing.
- Si el backend todavía niega un recurso asociado con `403`, la UI debe mantener al usuario en contexto y mostrar un estado explícito de acceso denegado, sin expulsarlo a login ni disfrazarlo como falla técnica.
- Desde ese estado, el usuario puede reportar que considera el rechazo un posible error y enviar comentario + contexto técnico/funcional al circuito de soporte/incidentes.
- Gestionar aplicaciones cliente.
- Gestionar usuarios del tenant.
- Gestionar memberships y roles de app.
- Consultar suscripción, facturas y operación del tenant.

## Usuario final

- Consultar su acceso.
- Gestionar perfil y configuración de cuenta.
- En "Mi cuenta", si la sesión es de plataforma, la UI usa `GET/PATCH /api/v1/platform/account/profile` para leer y editar el perfil personal sin depender del tenant `keygo`; en ese contexto solo permite editar nombre, teléfono, locale, zona horaria y foto.
- Revisar sesiones y actividad propia.

## Compartido

- Perfil de usuario.
- Cambio de contraseña.
- En el shell autenticado, el bloque de identidad del encabezado/sidebar debe recuperar nombre y correo desde el perfil de cuenta cuando el token restaurado tras `F5` no trae claims amigables, evitando mostrar UUIDs o identificadores técnicos.
- Preferencias y sesiones.
- Selector de idioma y comportamiento adaptado al rol.
