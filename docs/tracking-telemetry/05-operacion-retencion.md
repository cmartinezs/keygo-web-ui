# 05 - Operacion y Retencion

## Parametros Operativos Base

- Retencion backend: 90 dias.
- Flush frontend: cada 10 a 15 minutos.
- Batch por umbral: configurable (ejemplo 50 a 200 eventos por lote).
- Retry: backoff exponencial con jitter y max intentos.

## Politica de Retencion

1. Backend mantiene eventos 90 dias.
2. Purge automatico diario por antiguedad.
3. Politica especial para eventos de seguridad puede extenderse bajo norma interna.

## Politica de Envio

1. Flush por tiempo (10-15 min).
2. Flush por volumen cuando se alcanza umbral de cola.
3. Flush al cerrar pestana para minimizar perdida.
4. Si no hay conectividad, encolar para reintento.

## Capacidad y Costos

Variables a monitorear:
- eventos por sesion
- eventos por minuto
- tamano promedio por evento
- lotes por hora
- tasa de reintentos
- tasa de descarte

Practicas de eficiencia:
1. Debounce para eventos de alta frecuencia.
2. Muestreo opcional en clicks repetitivos.
3. Compresion de payload si backend lo soporta.

## SLO Operativo Recomendado

1. Entrega de eventos criticos >= 99.5%.
2. Latencia p95 de ingest <= 60 segundos por lote en condiciones normales.
3. Tasa de duplicados efectivos <= 1% (gracias a idempotencia).
