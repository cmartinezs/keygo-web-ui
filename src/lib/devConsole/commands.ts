import type { HttpLogEntry, OutputInput } from './store'

// ── Types ─────────────────────────────────────────────────────────────────────

type PushFn = (line: OutputInput) => void

export interface CommandContext {
  httpLog: HttpLogEntry[]
  push: PushFn
  clear: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDuration(ms?: number): string {
  if (ms === undefined) return '—'
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`
}

// ── Command handlers ──────────────────────────────────────────────────────────

function cmdHelp(push: PushFn): void {
  push({ type: 'divider' })
  push({ type: 'info',   text: 'Comandos disponibles:' })
  push({ type: 'output', text: '  req [N]             Ultimos N requests HTTP (default: 10, max: 50)' })
  push({ type: 'output', text: '  requests [N]        Alias de req' })
  push({ type: 'output', text: '  filter <METHOD>     Filtra por metodo: GET, POST, PUT, DELETE, PATCH' })
  push({ type: 'output', text: '  status              Resumen de requests agrupados por codigo de estado' })
  push({ type: 'output', text: '  detail <N>          Detalle completo del N-esimo request mas reciente' })
  push({ type: 'output', text: '  clear / cls         Limpia la salida de la consola' })
  push({ type: 'output', text: '  help / ?            Muestra esta ayuda' })
  push({ type: 'divider' })
}

function cmdRequests(n: number, ctx: CommandContext): void {
  const count = isNaN(n) || n < 1 ? 10 : Math.min(n, 50)
  const entries = ctx.httpLog.slice(0, count)

  if (entries.length === 0) {
    ctx.push({ type: 'info', text: 'No hay requests registrados aun.' })
    return
  }

  ctx.push({ type: 'info', text: `Ultimos ${entries.length} request(s):` })
  ctx.push({ type: 'http-header' })
  entries.forEach((e) => ctx.push({ type: 'http-row', entry: e }))
}

function cmdStatus(ctx: CommandContext): void {
  if (ctx.httpLog.length === 0) {
    ctx.push({ type: 'info', text: 'No hay requests registrados aun.' })
    return
  }

  const groups: Record<string, number> = {
    '2xx': 0,
    '3xx': 0,
    '4xx': 0,
    '5xx': 0,
    'pendiente': 0,
    'error de red': 0,
  }

  for (const e of ctx.httpLog) {
    if (e.error && !e.status)  groups['error de red']++
    else if (!e.status)         groups['pendiente']++
    else if (e.status < 300)    groups['2xx']++
    else if (e.status < 400)    groups['3xx']++
    else if (e.status < 500)    groups['4xx']++
    else                        groups['5xx']++
  }

  ctx.push({ type: 'info', text: `Resumen de ${ctx.httpLog.length} request(s):` })
  for (const [k, v] of Object.entries(groups)) {
    if (v > 0) {
      ctx.push({ type: 'output', text: `  ${k.padEnd(14)} ${v}` })
    }
  }
}

function cmdFilter(method: string | undefined, ctx: CommandContext): void {
  if (!method) {
    ctx.push({ type: 'error', text: 'Uso: filter <METHOD>  (ej: filter GET)' })
    return
  }

  const upper    = method.toUpperCase()
  const filtered = ctx.httpLog.filter((e) => e.method.toUpperCase() === upper)

  if (filtered.length === 0) {
    ctx.push({ type: 'info', text: `No hay requests con metodo ${upper}.` })
    return
  }

  ctx.push({ type: 'info', text: `${filtered.length} request(s) con metodo ${upper}:` })
  ctx.push({ type: 'http-header' })
  filtered.slice(0, 50).forEach((e) => ctx.push({ type: 'http-row', entry: e }))
}

function cmdDetail(n: number, ctx: CommandContext): void {
  const idx   = isNaN(n) || n < 1 ? 1 : n
  const entry = ctx.httpLog[idx - 1]

  if (!entry) {
    ctx.push({ type: 'error', text: `No existe el request #${idx}. Total registrado: ${ctx.httpLog.length}.` })
    return
  }

  ctx.push({ type: 'info',   text: `─── Request #${idx} ───────────────────────` })
  ctx.push({ type: 'output', text: `  Timestamp  ${entry.timestamp.toLocaleString('es-CL')}` })
  ctx.push({ type: 'output', text: `  Metodo     ${entry.method}` })
  ctx.push({ type: 'output', text: `  URL        ${entry.url}` })
  ctx.push({ type: 'output', text: `  Estado     ${entry.status ?? '—'}` })
  ctx.push({ type: 'output', text: `  Duracion   ${fmtDuration(entry.duration)}` })

  if (entry.requestBody !== undefined) {
    const body = JSON.stringify(entry.requestBody, null, 2)
    ctx.push({ type: 'output', text: `  Body req\n${body}` })
  }

  if (entry.responseBody !== undefined) {
    const raw  = JSON.stringify(entry.responseBody, null, 2)
    const body = raw.length > 800 ? raw.slice(0, 800) + '\n  … (truncado)' : raw
    ctx.push({ type: 'output', text: `  Body res\n${body}` })
  }

  if (entry.error) {
    ctx.push({ type: 'error', text: `  Error      ${entry.error}` })
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────

export function runCommand(raw: string, ctx: CommandContext): void {
  const trimmed = raw.trim()
  if (!trimmed) return

  ctx.push({ type: 'command', text: trimmed })

  const [cmd, ...args] = trimmed.split(/\s+/)
  const lower = cmd.toLowerCase()

  if (lower === 'help' || lower === '?') {
    cmdHelp(ctx.push)
  } else if (lower === 'req' || lower === 'requests') {
    cmdRequests(parseInt(args[0] ?? '10', 10), ctx)
  } else if (lower === 'clear' || lower === 'cls') {
    ctx.clear()
  } else if (lower === 'status') {
    cmdStatus(ctx)
  } else if (lower === 'filter') {
    cmdFilter(args[0], ctx)
  } else if (lower === 'detail') {
    cmdDetail(parseInt(args[0] ?? '1', 10), ctx)
  } else {
    ctx.push({
      type: 'error',
      text: `Comando desconocido: '${cmd}'. Escribe 'help' para ver los disponibles.`,
    })
  }
}
