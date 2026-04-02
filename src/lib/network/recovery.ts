import axios from 'axios'
import { toast } from 'sonner'
import {
  NETWORK_MAX_RETRIES,
  NETWORK_REQUEST_TIMEOUT_MS,
  NETWORK_RETRY_DELAY_MS,
} from '@/config/network'

interface GetRecoveryOptions<T> {
  signal: AbortSignal
  label: string
  query: () => Promise<T>
  timeoutMs?: number
  retryDelayMs?: number
  maxRetries?: number
}

interface MutationTimeoutOptions {
  timeoutMs?: number
  retryHint?: string
}

interface TimeoutStateMessageOptions {
  timeoutMs?: number
  retryHint?: string
  includeRetryExhaustedNote?: boolean
}

export function isRequestTimeout(error: unknown): boolean {
  return axios.isAxiosError(error) && error.code === 'ECONNABORTED'
}

function getSeconds(ms: number): number {
  return Math.floor(ms / 1000)
}

export function buildMutationTimeoutMessage(
  actionLabel: string,
  options?: MutationTimeoutOptions,
): string {
  const timeoutMs = options?.timeoutMs ?? NETWORK_REQUEST_TIMEOUT_MS
  const retryHint = options?.retryHint ?? 'Intenta nuevamente.'
  return `La ${actionLabel} supero ${getSeconds(timeoutMs)} segundos. ${retryHint}`
}

export function notifyMutationTimeout(
  actionLabel: string,
  options?: MutationTimeoutOptions,
): void {
  toast.error(buildMutationTimeoutMessage(actionLabel, options))
}

export function buildTimeoutStateMessage(
  actionLabel: string,
  options?: TimeoutStateMessageOptions,
): string {
  const timeoutMs = options?.timeoutMs ?? NETWORK_REQUEST_TIMEOUT_MS
  const retryHint = options?.retryHint ?? 'Intenta nuevamente.'
  const retryExhaustedNote = options?.includeRetryExhaustedNote
    ? ' incluso despues de reintentos'
    : ''

  return `La ${actionLabel} supero ${getSeconds(timeoutMs)} segundos${retryExhaustedNote}. ${retryHint}`
}

export async function waitForAbortableDelay(ms: number, signal: AbortSignal): Promise<void> {
  await new Promise<void>((resolve) => {
    const timer = window.setTimeout(() => resolve(), ms)
    if (signal.aborted) {
      window.clearTimeout(timer)
      resolve()
      return
    }

    signal.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        resolve()
      },
      { once: true },
    )
  })
}

export async function runGetWithRecovery<T>({
  signal,
  label,
  query,
  timeoutMs = NETWORK_REQUEST_TIMEOUT_MS,
  retryDelayMs = NETWORK_RETRY_DELAY_MS,
  maxRetries = NETWORK_MAX_RETRIES,
}: GetRecoveryOptions<T>): Promise<T> {
  let attempt = 0

  while (attempt <= maxRetries) {
    const isRetry = attempt > 0
    const retryLeft = maxRetries - attempt

    if (isRetry) {
      toast.info(`Reintentando ${label} (${attempt}/${maxRetries})...`)
    }

    try {
      return await query()
    } catch (error: unknown) {
      if (signal.aborted) throw error
      if (!isRequestTimeout(error)) throw error

      const timeoutSeconds = getSeconds(timeoutMs)
      const retryDelaySeconds = getSeconds(retryDelayMs)
      toast.error(`La carga de ${label} supero ${timeoutSeconds} segundos. Reintentaremos en ${retryDelaySeconds} segundos.`)

      if (retryLeft <= 0) {
        toast.error(`No se pudo cargar ${label} tras ${maxRetries} reintentos. Intenta nuevamente.`)
        throw error
      }

      await waitForAbortableDelay(retryDelayMs, signal)
      if (signal.aborted) throw error
    }

    attempt += 1
  }

  throw new Error(`No se pudo cargar ${label}`)
}
