import { useCallback } from 'react'
import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form'
import type { AppApiError } from '@/shared/api/errorNormalizer'
import type { FieldValidationError } from '@/shared/types/base'

function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
}

export interface ApplyFieldErrorsOptions<T extends FieldValues> {
  /** Mapeo explícito de campo backend → campo del formulario */
  fieldMapping?: Record<string, FieldPath<T>>
  /**
   * Lista de campos registrados en el formulario.
   * Si se provee, los campos no reconocidos se acumulan en `root.serverValidation`.
   * Si no se provee, se intenta setear todos (puede fallar silenciosamente).
   */
  knownFields?: readonly string[]
}

export interface ApplyFieldErrorsResult {
  /** `true` si existían field errors del backend (coincidan o no con el form) */
  hasErrors: boolean
  /** Errores que no pudieron mapearse a ningún campo conocido del formulario */
  unmatchedErrors: FieldValidationError[]
}

/**
 * Aplica errores de validación por campo del backend a un formulario react-hook-form.
 *
 * - Campos reconocidos → `setError(field, { type: 'server', message })`
 * - Campos no reconocidos → `setError('root', { type: 'serverValidation', message })` con mensajes combinados
 * - Retorna detalle para que el llamador decida si mostrar toast adicional
 *
 * @param fieldMapping — mapeo opcional de nombre de campo backend → nombre de campo del form.
 *   Si no se provee, se intenta: exact match → snake_case → camelCase.
 */
export function applyFieldErrors<T extends FieldValues>(
  error: AppApiError,
  setError: UseFormSetError<T>,
  options?: ApplyFieldErrorsOptions<T>,
): ApplyFieldErrorsResult {
  const noErrors: ApplyFieldErrorsResult = { hasErrors: false, unmatchedErrors: [] }

  // detail sin field_errors → error contextual del formulario (root).
  // Excluir SERVER_PROCESSING porque detail puede ser técnico (SQL, stack traces).
  if (error.detail && !error.fieldErrors?.length && error.origin !== 'SERVER_PROCESSING') {
    setError('root' as FieldPath<T>, { type: 'server', message: error.detail })
    return { hasErrors: true, unmatchedErrors: [] }
  }

  if (!error.fieldErrors?.length) return noErrors
  if (error.origin !== 'CLIENT_REQUEST' || error.clientRequestCause !== 'USER_INPUT') return noErrors

  const knownFields = options?.knownFields
  const fieldMapping = options?.fieldMapping
  const unmatchedErrors: FieldValidationError[] = []

  for (const fe of error.fieldErrors) {
    if (!fe.field || !fe.message) continue

    // Resolver nombre: mapping explícito → exacto → camelCase
    const mappedField = fieldMapping?.[fe.field]
    const camelField = snakeToCamel(fe.field)
    const resolvedField = mappedField ?? fe.field

    if (knownFields) {
      const isKnown =
        (mappedField && knownFields.includes(mappedField)) ||
        knownFields.includes(fe.field) ||
        knownFields.includes(camelField)

      if (!isKnown) {
        unmatchedErrors.push(fe)
        continue
      }
    }

    // Intentar match: mapping → exacto → camelCase
    const finalField = mappedField ??
      (knownFields?.includes(fe.field) ? fe.field : camelField)

    setError(finalField as FieldPath<T>, { type: 'server', message: fe.message })
  }

  // Campos no reconocidos → error de formulario general (root)
  if (unmatchedErrors.length > 0) {
    const combinedMessage = unmatchedErrors
      .map((e) => e.message)
      .join('. ')
    setError('root' as FieldPath<T>, {
      type: 'serverValidation',
      message: combinedMessage,
    })
  }

  return { hasErrors: true, unmatchedErrors }
}

/**
 * Hook que devuelve una función estable para aplicar field errors del backend
 * a un formulario react-hook-form.
 *
 * Uso típico en `onError` de `useMutation`:
 * ```ts
 * const handleFieldErrors = useApplyFieldErrors(setError, {
 *   knownFields: ['email', 'username', 'password'],
 * })
 *
 * const mutation = useMutation({
 *   mutationFn: createUser,
 *   onError: (error) => {
 *     const appError = getAppApiError(error)
 *     toast.error(appError.clientMessage)
 *     handleFieldErrors(appError)
 *   },
 * })
 * ```
 */
export function useApplyFieldErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  options?: ApplyFieldErrorsOptions<T>,
) {
  return useCallback(
    (error: AppApiError): ApplyFieldErrorsResult =>
      applyFieldErrors(error, setError, options),
    [setError, options],
  )
}

