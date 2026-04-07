import { describe, expect, it } from 'vitest'
import { i18n } from '@/shared/lib/i18n/config'
import {
  getAppApiError,
  getUserMessage,
  isAppApiError,
  normalizeApiError,
  type AppApiError,
  type AxiosErrorWithAppApiError,
} from './errorNormalizer'
import type { ErrorResponse } from '@/shared/types/base'

function createAxiosLikeError(params: {
  status?: number
  data?: ErrorResponse
  message?: string
}): AxiosErrorWithAppApiError {
  return {
    isAxiosError: true,
    name: 'AxiosError',
    message: params.message ?? 'Request failed',
    response:
      params.status !== undefined || params.data !== undefined
        ? {
            status: params.status,
            data: params.data,
            statusText: '',
            headers: {},
            config: {},
          }
        : undefined,
    config: {},
    toJSON: () => ({}),
  } as AxiosErrorWithAppApiError
}

describe('errorNormalizer', () => {
  it('normalizes API error with clientMessage and fieldErrors', () => {
    const error = createAxiosLikeError({
      status: 400,
      data: {
        date: '2026-04-01T00:00:00Z',
        failure: { code: 'INVALID_INPUT', message: 'Validation failed' },
        data: {
          code: 'INVALID_INPUT',
          origin: 'CLIENT_REQUEST',
          clientRequestCause: 'USER_INPUT',
          clientMessage: 'Por favor revisa los campos.',
          fieldErrors: [{ field: 'email', message: 'Email invalido' }],
        },
      },
    })

    const normalized = normalizeApiError(error)

    expect(normalized.clientMessage).toBe('Por favor revisa los campos.')
    expect(normalized.code).toBe('INVALID_INPUT')
    expect(normalized.origin).toBe('CLIENT_REQUEST')
    expect(normalized.clientRequestCause).toBe('USER_INPUT')
    expect(normalized.fieldErrors).toHaveLength(1)
    expect(normalized.retryable).toBe(false)
  })

  it('marks server processing and 5xx errors as retryable', () => {
    const error = createAxiosLikeError({
      status: 503,
      data: {
        date: '2026-04-01T00:00:00Z',
        failure: { code: 'EXTERNAL_SERVICE_ERROR', message: 'Downstream failed' },
        data: {
          code: 'EXTERNAL_SERVICE_ERROR',
          origin: 'SERVER_PROCESSING',
          clientMessage: 'Servicio temporalmente no disponible.',
        },
      },
    })

    const normalized = normalizeApiError(error)

    expect(normalized.retryable).toBe(true)
    expect(normalized.httpStatus).toBe(503)
    expect(normalized.origin).toBe('SERVER_PROCESSING')
  })

  it('normalizes network error with retryable=true', () => {
    const error = createAxiosLikeError({
      message: 'Network Error',
    })

    void i18n.changeLanguage('en-US')
    const normalized = normalizeApiError(error)

    expect(normalized.clientMessage).toContain('could not complete communication with the server')
    expect(normalized.retryable).toBe(true)
    expect(normalized.httpStatus).toBeUndefined()

    void i18n.changeLanguage('es-CL')
  })

  it('returns attached appApiError when present in AxiosError', () => {
    const attached = new Error('Typed') as AppApiError
    attached.name = 'AppApiError'
    attached.kind = 'APP_API_ERROR'
    attached.clientMessage = 'Typed'
    attached.fieldErrors = []
    attached.retryable = false
    attached.raw = null

    const error = createAxiosLikeError({ status: 400 })
    error.appApiError = attached

    const resolved = getAppApiError(error)
    expect(resolved).toBe(attached)
  })

  it('isAppApiError identifies normalized errors', () => {
    const normalized = normalizeApiError(new Error('Boom'))
    expect(isAppApiError(normalized)).toBe(true)
    expect(isAppApiError(new Error('Nope'))).toBe(false)
  })

  describe('getUserMessage', () => {
    it('returns clientMessage for BUSINESS_RULE (detail goes to form root via applyFieldErrors)', () => {
      const error = normalizeApiError(
        createAxiosLikeError({
          status: 409,
          data: {
            date: '2026-04-07T15:43:36Z',
            failure: { code: 'BUSINESS_RULE_VIOLATION', message: 'Business rule validation failed' },
            data: {
              client_message: "This operation can't be completed in the current state.",
              code: 'BUSINESS_RULE_VIOLATION',
              detail: 'Current password is incorrect',
              origin: 'BUSINESS_RULE',
            } as unknown as import('@/shared/types/base').ErrorData,
          },
        }),
      )
      // Toast siempre muestra clientMessage; detail va al ServerErrorBanner
      expect(getUserMessage(error)).toBe("This operation can't be completed in the current state.")
    })

    it('returns clientMessage for BUSINESS_RULE origin when detail is absent', () => {
      const error = normalizeApiError(
        createAxiosLikeError({
          status: 409,
          data: {
            date: '2026-04-07T15:43:36Z',
            failure: { code: 'BUSINESS_RULE_VIOLATION', message: 'Business rule validation failed' },
            data: {
              client_message: 'Cannot perform this action.',
              code: 'BUSINESS_RULE_VIOLATION',
              origin: 'BUSINESS_RULE',
            } as unknown as import('@/shared/types/base').ErrorData,
          },
        }),
      )
      expect(getUserMessage(error)).toBe('Cannot perform this action.')
    })

    it('returns clientMessage for SERVER_PROCESSING even if detail exists', () => {
      const error = normalizeApiError(
        createAxiosLikeError({
          status: 500,
          data: {
            date: '2026-04-07T15:43:36Z',
            failure: { code: 'OPERATION_FAILED', message: 'Operation failed' },
            data: {
              client_message: "We couldn't complete the request.",
              code: 'OPERATION_FAILED',
              detail: 'SQL constraint violation on table xyz',
              origin: 'SERVER_PROCESSING',
            } as unknown as import('@/shared/types/base').ErrorData,
          },
        }),
      )
      expect(getUserMessage(error)).toBe("We couldn't complete the request.")
    })

    it('returns clientMessage for CLIENT_REQUEST origin', () => {
      const error = normalizeApiError(
        createAxiosLikeError({
          status: 400,
          data: {
            date: '2026-04-07T15:43:36Z',
            failure: { code: 'INVALID_INPUT', message: 'Invalid input' },
            data: {
              client_message: 'Revisa los datos que enviaste.',
              code: 'INVALID_INPUT',
              detail: 'Validation failed for fields',
              origin: 'CLIENT_REQUEST',
            } as unknown as import('@/shared/types/base').ErrorData,
          },
        }),
      )
      expect(getUserMessage(error)).toBe('Revisa los datos que enviaste.')
    })
  })

  it('maps snake_case backend fields: client_message and trace_id', () => {
    // Real backend 500 payload uses snake_case inside data
    const error = createAxiosLikeError({
      status: 500,
      data: {
        date: '2026-04-05T20:51:47.740944735',
        failure: { code: 'OPERATION_FAILED', message: 'Operation failed to complete' },
        data: {
          client_message: "We couldn't complete the request. Try again in a few moments.",
          code: 'OPERATION_FAILED',
          detail: "Contract cannot perform 'verifyCode' in state: PENDING_PAYMENT",
          exception: 'ContractStateViolationException',
          layer: 'DOMAIN',
          origin: 'SERVER_PROCESSING',
          trace_id: 'a5c9268a-0ca5-4d1c-b712-3f3b7b4e4cb7',
        } as unknown as import('@/shared/types/base').ErrorData,
      },
    })

    const normalized = normalizeApiError(error)

    // client_message must win over failure.message
    expect(normalized.clientMessage).toBe("We couldn't complete the request. Try again in a few moments.")
    expect(normalized.traceId).toBe('a5c9268a-0ca5-4d1c-b712-3f3b7b4e4cb7')
    expect(normalized.origin).toBe('SERVER_PROCESSING')
    expect(normalized.code).toBe('OPERATION_FAILED')
    expect(normalized.retryable).toBe(true)
  })

  it('full chain: interceptor → getAppApiError → applyFieldErrors with exact backend payload', async () => {
    // Exact payload from backend for change-password 400 error (real response)
    const axiosError = createAxiosLikeError({
      status: 400,
      data: {
        date: '2026-04-07T14:49:20.476704538',
        failure: { code: 'INVALID_INPUT', message: 'Invalid input data provided' },
        data: {
          client_message: 'Please review the data you sent and try again.',
          client_request_cause: 'USER_INPUT',
          code: 'INVALID_INPUT',
          detail: 'Invalid input data provided',
          exception: 'MethodArgumentNotValidException',
          field_errors: [
            { field: 'confirm_new_password', message: 'must not be blank' },
            { field: 'password_match', message: 'new_password and confirm_new_password must match', rejected_value: false },
          ],
          origin: 'CLIENT_REQUEST',
          trace_id: '916987bc-1a49-42de-b301-3c9873d0d68a',
        } as unknown as import('@/shared/types/base').ErrorData,
      },
    })

    // Step 1: Simulate interceptor — normalizeApiError + attach to AxiosError
    const appApiError = normalizeApiError(axiosError)
    axiosError.appApiError = appApiError

    // Step 2: Simulate onError — getAppApiError extracts from AxiosError
    const resolved = getAppApiError(axiosError)

    // Verify the resolved error has all needed properties
    expect(resolved.origin).toBe('CLIENT_REQUEST')
    expect(resolved.clientRequestCause).toBe('USER_INPUT')
    expect(resolved.fieldErrors).toHaveLength(2)
    expect(resolved.fieldErrors[0].field).toBe('confirm_new_password')
    expect(resolved.fieldErrors[1].field).toBe('password_match')

    // Step 3: Simulate applyFieldErrors with ChangePasswordForm config
    const { applyFieldErrors } = await import('@/shared/hooks/useFieldErrors')
    const setErrorCalls: Array<[string, { type: string; message: string }]> = []
    const mockSetError = (name: string, error: { type: string; message: string }) => {
      setErrorCalls.push([name, error])
    }

    const result = applyFieldErrors(resolved, mockSetError as never, {
      knownFields: ['current_password', 'new_password', 'confirm_new_password'],
    })

    // hasErrors MUST be true
    expect(result.hasErrors).toBe(true)

    // confirm_new_password → directly matched to confirm_new_password field
    expect(setErrorCalls).toContainEqual([
      'confirm_new_password',
      { type: 'server', message: 'must not be blank' },
    ])

    // password_match → unmatched, should go to root
    expect(result.unmatchedErrors).toHaveLength(1)
    expect(result.unmatchedErrors[0].field).toBe('password_match')
    expect(setErrorCalls).toContainEqual([
      'root',
      { type: 'serverValidation', message: 'new_password and confirm_new_password must match' },
    ])
  })

  it('maps snake_case field_errors, client_request_cause and reject_value', () => {
    const error = createAxiosLikeError({
      status: 400,
      data: {
        date: '2026-04-07T17:00:00Z',
        failure: { code: 'INVALID_INPUT', message: 'Invalid input data provided' },
        data: {
          client_message: 'Please review the data you sent and try again.',
          client_request_cause: 'USER_INPUT',
          code: 'INVALID_INPUT',
          origin: 'CLIENT_REQUEST',
          field_errors: [
            { field: 'email', message: 'email cannot be null or blank', rejected_value: '' },
            { field: 'organization_name', message: 'must not be empty' },
          ],
          trace_id: 'abc-123',
        } as unknown as import('@/shared/types/base').ErrorData,
      },
    })

    const normalized = normalizeApiError(error)

    expect(normalized.httpStatus).toBe(400)
    expect(normalized.clientMessage).toBe('Please review the data you sent and try again.')
    expect(normalized.clientRequestCause).toBe('USER_INPUT')
    expect(normalized.origin).toBe('CLIENT_REQUEST')
    expect(normalized.traceId).toBe('abc-123')
    expect(normalized.retryable).toBe(false)
    expect(normalized.fieldErrors).toHaveLength(2)
    expect(normalized.fieldErrors[0]).toEqual({
      field: 'email',
      message: 'email cannot be null or blank',
      rejectedValue: '',
    })
    expect(normalized.fieldErrors[1]).toEqual({
      field: 'organization_name',
      message: 'must not be empty',
      rejectedValue: undefined,
    })
  })

  it('applyFieldErrors sets BUSINESS_RULE detail as root form error', async () => {
    const error = normalizeApiError(
      createAxiosLikeError({
        status: 409,
        data: {
          date: '2026-04-07T15:43:36Z',
          failure: { code: 'BUSINESS_RULE_VIOLATION', message: 'Business rule validation failed' },
          data: {
            client_message: "This operation can't be completed in the current state.",
            code: 'BUSINESS_RULE_VIOLATION',
            detail: 'Current password is incorrect',
            origin: 'BUSINESS_RULE',
          } as unknown as import('@/shared/types/base').ErrorData,
        },
      }),
    )

    const { applyFieldErrors } = await import('@/shared/hooks/useFieldErrors')
    const setErrorCalls: Array<[string, { type: string; message: string }]> = []
    const mockSetError = (name: string, err: { type: string; message: string }) => {
      setErrorCalls.push([name, err])
    }

    const result = applyFieldErrors(error, mockSetError as never, {
      knownFields: ['current_password', 'new_password', 'confirm_new_password'],
    })

    expect(result.hasErrors).toBe(true)
    expect(result.unmatchedErrors).toHaveLength(0)
    // detail debe ir al root del formulario (ServerErrorBanner)
    expect(setErrorCalls).toContainEqual([
      'root',
      { type: 'server', message: 'Current password is incorrect' },
    ])
  })

  it('applyFieldErrors sets CLIENT_REQUEST detail as root when no field_errors', async () => {
    // Caso: verification code inválido — detail pero sin field_errors
    const error = normalizeApiError(
      createAxiosLikeError({
        status: 400,
        data: {
          date: '2026-04-07T16:12:32Z',
          failure: { code: 'INVALID_INPUT', message: 'Invalid input data provided' },
          data: {
            client_message: 'Please review the data you sent and try again.',
            client_request_cause: 'USER_INPUT',
            code: 'INVALID_INPUT',
            detail: 'Verification code is invalid or does not exist for purpose: PASSWORD_RESET',
            exception: 'VerificationCodeInvalidException',
            layer: 'DOMAIN',
            origin: 'CLIENT_REQUEST',
          } as unknown as import('@/shared/types/base').ErrorData,
        },
      }),
    )

    const { applyFieldErrors } = await import('@/shared/hooks/useFieldErrors')
    const setErrorCalls: Array<[string, { type: string; message: string }]> = []
    const mockSetError = (name: string, err: { type: string; message: string }) => {
      setErrorCalls.push([name, err])
    }

    const result = applyFieldErrors(error, mockSetError as never, {
      knownFields: ['request_id', 'verification_code', 'new_password', 'confirm_new_password'],
    })

    expect(result.hasErrors).toBe(true)
    expect(result.unmatchedErrors).toHaveLength(0)
    expect(setErrorCalls).toContainEqual([
      'root',
      { type: 'server', message: 'Verification code is invalid or does not exist for purpose: PASSWORD_RESET' },
    ])
  })
})
