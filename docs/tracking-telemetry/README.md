# Tracking y Telemetria de Usuario - KeyGo UI

Esta carpeta define la estrategia de trazabilidad de acciones de usuario en keygo-web-ui para analisis posterior de patrones, soporte operativo y auditoria tecnica.

## Resumen Ejecutivo

Objetivo: capturar la mayor cantidad de informacion util de interaccion y resultados del sistema con impacto minimo en el codigo existente y bajo costo operativo.

Decisiones cerradas:
- Retencion en backend: 90 dias.
- Envio desde frontend a backend: cada 10 a 15 minutos.
- Granularidad inicial: alta (incluye clicks extensivos), con controles de volumen.
- Implementacion: 2 fases principales (A captura/buffer, B envio backend) y una fase C de hardening.
- Datos de soporte: se permite email/username para casos de soporte, sujeto a politica de acceso y auditoria.

## Estado

- Estado actual: Planificado.
- Endpoint de auditoria global de lectura: pendiente en backend (F-034).
- Endpoint de ingesta batch de telemetria: pendiente de contrato definitivo.

## Indice

1. [01-vision-alcance.md](./01-vision-alcance.md)
2. [02-arquitectura.md](./02-arquitectura.md)
3. [03-contrato-eventos.md](./03-contrato-eventos.md)
4. [04-privacidad-seguridad.md](./04-privacidad-seguridad.md)
5. [05-operacion-retencion.md](./05-operacion-retencion.md)
6. [06-rollout-fases.md](./06-rollout-fases.md)
7. [07-verificacion-kpis.md](./07-verificacion-kpis.md)
8. [08-backend-contrato-pendiente.md](./08-backend-contrato-pendiente.md)
9. [09-plan-prs.md](./09-plan-prs.md)

## Alcance de Esta Carpeta

Incluye:
- Modelo tecnico de captura y envio.
- Gobierno de datos y reglas de sanitizacion.
- Operacion, retencion y control de calidad del dato.
- Plan de despliegue y mitigacion de riesgos.

No incluye:
- Implementacion de codigo en src/.
- Cambios backend productivos.
- Definicion legal final de privacidad (solo lineamientos tecnicos).

## Referencias

- [FRONTEND_DEVELOPER_GUIDE.md](../FRONTEND_DEVELOPER_GUIDE.md)
- [TECHNICAL_GUIDE.md](../TECHNICAL_GUIDE.md)
- [BACKLOG.md](../BACKLOG.md)
- [api-docs.json](../api-docs.json)
