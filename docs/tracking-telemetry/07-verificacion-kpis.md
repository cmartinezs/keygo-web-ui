# 07 - Verificacion y KPIs

## Objetivo

Asegurar que la trazabilidad sea correcta, util y sostenible en produccion.

## Estrategia de Verificacion

1. Unit tests
- Sanitizacion de payload.
- Dedupe local.
- Scheduler de flush.

2. Integration tests
- Interceptor API + cola.
- Flujos login/registro/admin instrumentados.
- Reintentos ante fallos de red.

3. Pruebas manuales
- Navegacion y eventos por ruta.
- Multi-step register.
- Operaciones admin criticas.

4. Resiliencia
- Modo offline/online.
- Cierre de pestana.
- Errores 401/403/5xx.

## KPIs Tecnicos

1. event_delivery_rate
- Porcentaje de eventos enviados y aceptados.

2. event_drop_rate
- Porcentaje de eventos descartados por capacidad o error.

3. duplicate_rate
- Proporcion de eventos ignorados por duplicado.

4. queue_depth_p95
- Profundidad de cola en p95.

5. flush_latency_p95
- Latencia de lote hasta confirmacion backend.

6. telemetry_overhead
- Impacto en CPU/memoria/red percibido por frontend.

## KPIs de Negocio/Producto

1. abandono por paso de registro.
2. tasa de error de login por tipo.
3. frecuencia de acciones admin por tenant.
4. correlacion de errores API con friccion de usuario.

## Criterios de Aceptacion Inicial

1. No se capturan secretos ni tokens.
2. No hay regresion funcional visible para usuario.
3. Pipeline tolera fallas temporales de red.
4. La granularidad permite analisis util sin costo descontrolado.
