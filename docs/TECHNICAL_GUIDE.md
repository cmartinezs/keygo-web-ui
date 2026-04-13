# KeyGo UI — Guía Técnica

Este archivo quedó como **portal técnico estable**. La documentación viva de arquitectura y operación ahora se encuentra distribuida por tema.

## Punto de entrada recomendado

- [03-architecture/README.md](03-architecture/README.md)

## Documentos técnicos

| Documento                                                                          | Cubre                                                    |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [03-architecture/01-system-overview.md](03-architecture/01-system-overview.md)     | Arquitectura general del frontend y flujo de datos.      |
| [03-architecture/02-project-structure.md](03-architecture/02-project-structure.md) | Organización de módulos y responsabilidades por carpeta. |
| [03-architecture/03-auth-and-session.md](03-architecture/03-auth-and-session.md)   | PKCE, tokens, guards, refresh y logout.                  |
| [03-architecture/04-api-integration.md](03-architecture/04-api-integration.md)     | Contrato `BaseResponse<T>`, clientes API, errores y MSW. |
| [07-operations/01-local-setup.md](07-operations/01-local-setup.md)                 | Setup local, comandos y variables de entorno.            |

## Nota

La guía técnica extensa anterior quedó archivada en `docs/99-archive/legacy-guides/TECHNICAL_GUIDE.md`.
