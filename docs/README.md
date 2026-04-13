# KeyGo UI — Documentación

Índice maestro de la documentación del proyecto. La documentación viva se organiza por secciones; el material histórico y las decisiones ya cerradas viven en `99-archive/`.

## Cómo navegar

| Sección           | Propósito                                                        | Punto de entrada                                       |
| ----------------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| `01-product`      | Visión del producto, alcance y capacidades por rol.              | [01-product/README.md](01-product/README.md)           |
| `02-functional`   | Flujos funcionales, áreas de la UI y recorridos del usuario.     | [02-functional/README.md](02-functional/README.md)     |
| `03-architecture` | Arquitectura frontend, módulos, autenticación e integración API. | [03-architecture/README.md](03-architecture/README.md) |
| `04-decisions`    | ADRs vigentes y registro de decisiones relevantes.               | [04-decisions/README.md](04-decisions/README.md)       |
| `05-delivery`     | Backlog vivo y seguimiento de trabajo.                           | [05-delivery/README.md](05-delivery/README.md)         |
| `06-quality`      | Accesibilidad, planes de prueba y runbooks de calidad.           | [06-quality/README.md](06-quality/README.md)           |
| `07-operations`   | Setup local, variables de entorno y operación del proyecto.      | [07-operations/README.md](07-operations/README.md)     |
| `08-reference`    | Matrices, referencias cruzadas y fuentes técnicas de verdad.     | [08-reference/README.md](08-reference/README.md)       |
| `09-ai`           | Convenciones para agentes y gobierno documental.                 | [09-ai/README.md](09-ai/README.md)                     |
| `99-archive`      | Documentación histórica, análisis y propuestas supersedidas.     | [99-archive/README.md](99-archive/README.md)           |

## Entradas estables

Estas rutas se mantienen en la raíz de `docs/` como puntos de entrada estables y de compatibilidad:

| Documento                                                            | Uso                                               |
| -------------------------------------------------------------------- | ------------------------------------------------- |
| [FRONTEND_DEVELOPER_GUIDE.md](FRONTEND_DEVELOPER_GUIDE.md)           | Portal para desarrollo frontend.                  |
| [TECHNICAL_GUIDE.md](TECHNICAL_GUIDE.md)                             | Portal de arquitectura y operación.               |
| [FUNCTIONAL_GUIDE.md](FUNCTIONAL_GUIDE.md)                           | Portal funcional para producto y UX.              |
| [BACKLOG.md](BACKLOG.md)                                             | Portal al backlog vivo.                           |
| [ACCESSIBILITY-CHILE.md](ACCESSIBILITY-CHILE.md)                     | Portal a la política de accesibilidad.            |
| [api-docs.json](api-docs.json)                                       | Especificación OpenAPI del backend.               |
| [00-documentation-instructions.md](00-documentation-instructions.md) | Regla de organización y mantenimiento documental. |

## Fuentes de verdad

- Contrato backend: [api-docs.json](api-docs.json)
- Flujos funcionales principales: [02-functional/README.md](02-functional/README.md)
- Arquitectura frontend: [03-architecture/README.md](03-architecture/README.md)
- Política de accesibilidad: [06-quality/03-accessibility-chile.md](06-quality/03-accessibility-chile.md)
- Backlog vivo: [05-delivery/01-backlog-live.md](05-delivery/01-backlog-live.md)

## Reglas de ubicación

- La documentación viva se edita en las carpetas numeradas, no en `99-archive/`.
- Los documentos históricos se archivan; no se dejan mezclados con las guías activas.
- Si una guía cubre varios temas, se divide y el archivo raíz pasa a ser un índice o portal.
- `api-docs.json` permanece en la raíz de `docs/` por compatibilidad con tooling e instrucciones del proyecto.
