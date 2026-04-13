# Visión y alcance

KeyGo UI es una SPA para gestión de identidad y acceso multi-tenant. Unifica autenticación, administración de organizaciones, autoservicio de cuenta y contratación de la plataforma.

## Alcance funcional

- **Acceso público**: landing, login, registro, recuperación de acceso y contratación.
- **Operación de plataforma**: dashboard global, tenants, usuarios de plataforma y estado del servicio.
- **Gestión tenant**: aplicaciones cliente, usuarios, memberships, sesiones y billing del tenant.
- **Autoservicio**: perfil, configuración, sesiones y preferencias del usuario autenticado.

## Principios del producto

1. Un solo punto de login con OAuth2/PKCE.
2. La experiencia cambia según el rol resuelto desde el JWT.
3. Los tokens viven en memoria; la UI no persiste secretos en storage.
4. La documentación funcional, técnica y operativa debe tener una única fuente de verdad por tema.
