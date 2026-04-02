export interface RequestOptions {
  signal?: AbortSignal
  timeoutMs?: number
  idempotencyKey?: string
}
