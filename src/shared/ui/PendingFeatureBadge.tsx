import { useState } from 'react'
import type { FeatureStatus } from '@/shared/lib/featureStatus'

interface PendingFeatureBadgeProps {
  /** Código de la feature (T-033, F-042, etc.) */
  featureCode?: string
  /** Título/nombre de lo que falta */
  title?: string
  /** Descripción detallada de qué falta en el backend */
  description?: string
  /** O pasar un objeto FeatureStatus completo */
  featureStatus?: FeatureStatus
  /** Clase CSS adicional opcional */
  className?: string
}

/**
 * Badge visual para marcar funcionalidades con backend pendiente o parcial.
 * Al click, muestra un popover con detalles de qué falta.
 *
 * Cumple con WCAG 2.2 AA (norma chilena):
 * - Accesible por teclado (Focus, Enter/Space)
 * - ARIA labels descriptivos
 * - Contraste suficiente sobre fondo dark/light
 */
export function PendingFeatureBadge({
  featureCode: propCode,
  title: propTitle,
  description: propDescription,
  featureStatus,
  className = '',
}: PendingFeatureBadgeProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Usar featureStatus si se proporciona, sino los props individuales
  const featureCode = featureStatus?.featureCode ?? propCode ?? 'UNKNOWN'
  const title = featureStatus?.title ?? propTitle ?? 'Feature pendiente'
  const description =
    featureStatus?.description ?? propDescription ?? 'Backend en desarrollo'
  const status = featureStatus?.status ?? 'TEMP_MSW'

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setIsOpen(false)
        }}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`Backend pendiente: ${title}. Presiona para más detalle.`}
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 ${
          status === 'GAP_BACKEND'
            ? 'bg-red-100 text-red-800 hover:bg-red-200 focus-visible:ring-red-500 dark:bg-red-500/20 dark:text-red-300 dark:hover:bg-red-500/30'
            : status === 'PLACEHOLDER'
              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 focus-visible:ring-yellow-500 dark:bg-yellow-500/20 dark:text-yellow-300 dark:hover:bg-yellow-500/30'
              : status === 'PARTIAL'
                ? 'bg-orange-100 text-orange-800 hover:bg-orange-200 focus-visible:ring-orange-500 dark:bg-orange-500/20 dark:text-orange-300 dark:hover:bg-orange-500/30'
                : // TEMP_MSW (default)
                  'bg-amber-100 text-amber-800 hover:bg-amber-200 focus-visible:ring-amber-500 dark:bg-amber-500/20 dark:text-amber-300 dark:hover:bg-amber-500/30'
        }`}
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <span>{featureCode}</span>
      </button>

      {/* Popover con detalle */}
      {isOpen ? (
        <>
          {/* Overlay para cerrar al click fuera */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Popover */}
          <div
            className={`absolute right-0 top-full z-50 mt-2 w-64 origin-top-right rounded-lg border shadow-lg ${
              status === 'GAP_BACKEND'
                ? 'border-red-300 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10'
                : status === 'PLACEHOLDER'
                  ? 'border-yellow-300 bg-yellow-50 dark:border-yellow-500/30 dark:bg-yellow-500/10'
                  : status === 'PARTIAL'
                    ? 'border-orange-300 bg-orange-50 dark:border-orange-500/30 dark:bg-orange-500/10'
                    : // TEMP_MSW (default)
                      'border-amber-300 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10'
            } dark:shadow-2xl`}
            role="dialog"
            aria-label={`Detalle: ${title}`}
          >
            <div className="space-y-2 p-3">
              <div className="flex items-start gap-2">
                <svg
                  className={`h-5 w-5 flex-shrink-0 ${
                    status === 'GAP_BACKEND'
                      ? 'text-red-600 dark:text-red-400'
                      : status === 'PLACEHOLDER'
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : status === 'PARTIAL'
                          ? 'text-orange-600 dark:text-orange-400'
                          : // TEMP_MSW
                            'text-amber-600 dark:text-amber-400'
                  }`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className={`font-semibold ${
                    status === 'GAP_BACKEND'
                      ? 'text-red-900 dark:text-red-200'
                      : status === 'PLACEHOLDER'
                        ? 'text-yellow-900 dark:text-yellow-200'
                        : status === 'PARTIAL'
                          ? 'text-orange-900 dark:text-orange-200'
                          : // TEMP_MSW
                            'text-amber-900 dark:text-amber-200'
                  }`}>
                    {title}
                  </p>
                  <p className={`text-xs ${
                    status === 'GAP_BACKEND'
                      ? 'text-red-800 dark:text-red-300'
                      : status === 'PLACEHOLDER'
                        ? 'text-yellow-800 dark:text-yellow-300'
                        : status === 'PARTIAL'
                          ? 'text-orange-800 dark:text-orange-300'
                          : // TEMP_MSW
                            'text-amber-800 dark:text-amber-300'
                  }`}>
                    {featureCode}
                  </p>
                </div>
              </div>

              <p className={`text-xs leading-relaxed ${
                status === 'GAP_BACKEND'
                  ? 'text-red-800 dark:text-red-300'
                  : status === 'PLACEHOLDER'
                    ? 'text-yellow-800 dark:text-yellow-300'
                    : status === 'PARTIAL'
                      ? 'text-orange-800 dark:text-orange-300'
                      : // TEMP_MSW
                        'text-amber-800 dark:text-amber-300'
              }`}>
                {description}
              </p>

              <p className={`text-xs ${
                status === 'GAP_BACKEND'
                  ? 'text-red-700 dark:text-red-400'
                  : status === 'PLACEHOLDER'
                    ? 'text-yellow-700 dark:text-yellow-400'
                    : status === 'PARTIAL'
                      ? 'text-orange-700 dark:text-orange-400'
                      : // TEMP_MSW
                        'text-amber-700 dark:text-amber-400'
              }`}>
                {status === 'GAP_BACKEND' && (
                  <>
                    🔴 <strong>Estado:</strong> No existe contrato backend. Requiere diseño y
                    especificación. No es implementable en frontend sin información del backend.
                  </>
                )}
                {status === 'TEMP_MSW' && (
                  <>
                    ⏳ <strong>Estado:</strong> Backend en desarrollo. Funcionalidad cubierta con
                    mocks.
                  </>
                )}
                {status === 'PLACEHOLDER' && (
                  <>
                    🟡 <strong>Estado:</strong> Modulo sin especifiación funcional ni endpoint
                    backend. Requiere definición de producto.
                  </>
                )}
                {status === 'PARTIAL' && (
                  <>
                    🟠 <strong>Estado:</strong> Funcionalidad parcial. Datos básicos disponibles; faltan
                    filtros avanzados o histórico.
                  </>
                )}
              </p>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
