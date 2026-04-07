import type { FieldErrors } from 'react-hook-form'
import { IconXCircle } from '@/shared/ui/icons'

interface ServerErrorBannerProps {
  errors: FieldErrors
  className?: string
}

/**
 * Banner que muestra errores del servidor (`errors.root`) provenientes de
 * `applyFieldErrors` cuando hay field_errors que no coinciden con campos del formulario.
 *
 * Uso:
 * ```tsx
 * <ServerErrorBanner errors={errors} />
 * ```
 */
export function ServerErrorBanner({ errors, className }: ServerErrorBannerProps) {
  const rootMessage = errors.root?.message
  if (!rootMessage) return null

  return (
    <div
      role="alert"
      className={`flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300 ${className ?? ''}`}
    >
      <IconXCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{rootMessage}</span>
    </div>
  )
}
