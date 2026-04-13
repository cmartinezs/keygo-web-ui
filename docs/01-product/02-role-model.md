# Modelo de roles

KeyGo UI diferencia la experiencia por rol y por ámbito de gestión.

## Roles principales

| Rol                                   | Responsabilidad principal                |
| ------------------------------------- | ---------------------------------------- |
| `ADMIN` / `KEYGO_ADMIN`               | Operación global de la plataforma KeyGo. |
| `ADMIN_TENANT` / `KEYGO_TENANT_ADMIN` | Gestión de una organización o tenant.    |
| `USER_TENANT` / `KEYGO_USER`          | Uso cotidiano, perfil y acceso personal. |

## Qué cambia por rol

- Navegación y áreas visibles.
- Permisos de lectura y escritura.
- Endpoints disponibles y nivel de administración.
- Layout y contexto de trabajo dentro del dashboard.

## Referencias

- Vista funcional: [../02-functional/02-role-based-areas.md](../02-functional/02-role-based-areas.md)
- Implementación técnica: [../03-architecture/03-auth-and-session.md](../03-architecture/03-auth-and-session.md)
