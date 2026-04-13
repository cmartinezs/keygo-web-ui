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

- Gestionar aplicaciones cliente.
- Gestionar usuarios del tenant.
- Gestionar memberships y roles de app.
- Consultar suscripción, facturas y operación del tenant.

## Usuario final

- Consultar su acceso.
- Gestionar perfil y configuración de cuenta.
- Revisar sesiones y actividad propia.

## Compartido

- Perfil de usuario.
- Cambio de contraseña.
- Preferencias y sesiones.
- Selector de idioma y comportamiento adaptado al rol.
