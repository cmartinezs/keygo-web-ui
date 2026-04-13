# 06 - Rollout por Fases

## Fase A - Captura y Buffer

Objetivo: habilitar captura transversal sin depender aun del backend final.

Entregables:
1. Provider y hook de tracking.
2. Listener global de navegacion.
3. Interceptor API para outcomes.
4. Cola y scheduler local.

Riesgo principal:
- Sobrecarga de eventos.
Mitigacion:
- Debounce y presupuesto por tipo.

## Fase B - Envio Backend

Objetivo: habilitar pipeline de ingestion periodica.

Entregables:
1. Cliente API de telemetria batch.
2. Reintentos y dedupe.
3. Respuesta accepted/ignored.
4. Monitoreo de drops y retries.

Riesgo principal:
- Contrato backend incompleto.
Mitigacion:
- Documento de contrato pendiente y versionado de evento.

## Fase C - Hardening y Observabilidad

Objetivo: consolidar calidad de dato y operacion continua.

Entregables:
1. Feature flags por entorno.
2. Dashboard de salud del pipeline.
3. Ajuste de granularidad por costo/valor.
4. Playbook de incidentes de telemetria.

Riesgo principal:
- Costo operativo por granularidad alta.
Mitigacion:
- Muestreo selectivo y eventos criticos siempre on.

## Criterios de Salida por Fase

Fase A:
- Eventos visibles en cola local, sin degradacion UX.

Fase B:
- Entrega estable a backend con retries controlados.

Fase C:
- KPI de calidad y performance en rango objetivo.
