# 08 - Backend y Contrato Pendiente

## Contexto

Actualmente existe referencia a auditoria global de lectura, pero no implementacion final para ingestion de trazabilidad desde frontend.

Referencia actual:
- F-034: GET /api/v1/platform/audit (pendiente).

## Gap Actual

1. Falta endpoint de ingestion batch.
2. Falta respuesta estandar de accepted/ignored.
3. Falta contrato de versionado de eventos.
4. Falta reglas de idempotencia y dedupe en servidor.

## Propuesta de Contrato Minimo

Endpoint sugerido:
- POST /api/v1/platform/audit/batch

Request body sugerido:
- events: arreglo de eventos normalizados.
- schemaVersion: version del contrato.
- source: keygo-ui.

Response body sugerido:
- accepted: cantidad insertada.
- ignored: cantidad duplicada/descartada por idempotencia.
- failed: cantidad con error de validacion.
- errors: detalle resumido por codigo.

## Reglas Funcionales Recomendadas

1. Idempotencia por eventId.
2. Validacion schema estricta.
3. Rechazo de campos sensibles no permitidos.
4. Trazabilidad de quien consulta/exporta auditoria.
5. Retencion efectiva de 90 dias con purge.

## Checklist de Cierre con Backend

1. Confirmar endpoint definitivo y payload final.
2. Confirmar codigos de error y origen clasificado.
3. Confirmar limites de lote y timeout.
4. Confirmar politica de retencion y purge.
5. Confirmar politica de acceso para datos de soporte.
6. Actualizar api-docs.json y guias frontend al cerrar contrato.
