import type { HttpLogEntry, OutputInput, ConsoleTab, WizardState, WizardField, WizardCollected } from './store'
import { executeHttpRequest, type HttpMethod } from './httpRunner'

// ── Types ─────────────────────────────────────────────────────────────────────

type PushFn = (line: OutputInput) => void

export interface CommandContext {
  httpLog: HttpLogEntry[]
  push: PushFn
  clear: () => void
  setOpacity: (v: number) => void
  opacity: number
  addTab: (label?: string) => void
  closeTab: () => void
  renameActiveTab: (name: string) => void
  tabs: ConsoleTab[]
  activeTabId: string
  setActiveTab: (id: string) => void
  wizard: WizardState | null
  setWizard: (state: WizardState | null) => void
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
  push({ type: 'output', text: '  http [METHOD] [URL]  Ejecuta una llamada HTTP. Sin args inicia wizard.' })
  push({ type: 'output', text: '    GET, POST, PUT, PATCH, DELETE soportados.' })
  push({ type: 'output', text: '    GET/DELETE con method+url ejecutan directo.' })
  push({ type: 'output', text: '    POST/PUT/PATCH inician wizard para body y headers.' })
  push({ type: 'output', text: '  req [N]             Ultimos N requests HTTP (default: 10, max: 50)' })
  push({ type: 'output', text: '  requests [N]        Alias de req' })
  push({ type: 'output', text: '  filter <METHOD>     Filtra por metodo: GET, POST, PUT, DELETE, PATCH' })
  push({ type: 'output', text: '  status              Resumen de requests agrupados por codigo de estado' })
  push({ type: 'output', text: '  detail <N>          Detalle completo del N-esimo request mas reciente' })
  push({ type: 'output', text: '  clear / cls         Limpia la salida de la consola' })
  push({ type: 'output', text: '  opacity [10-100]    Ajusta la transparencia del panel (default: 90)' })
  push({ type: 'output', text: '  tab [sub]           Pestañas: list, new [nombre], close, rename <nombre>, <N>' })
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

function cmdTab(args: string[], ctx: CommandContext): void {
  const sub = args[0]?.toLowerCase()

  if (!sub || sub === 'list') {
    ctx.push({ type: 'info', text: `Pestañas (${ctx.tabs.length}):` })
    ctx.tabs.forEach((t, i) => {
      const marker = t.id === ctx.activeTabId ? '▶ ' : '  '
      ctx.push({ type: 'output', text: `${marker}${i + 1}. ${t.label}` })
    })
    return
  }

  if (sub === 'new') {
    const label = args.slice(1).join(' ') || undefined
    ctx.addTab(label)
    ctx.push({ type: 'info', text: 'Nueva pestaña creada.' })
    return
  }

  if (sub === 'close') {
    if (ctx.tabs.length <= 1) {
      ctx.push({ type: 'error', text: 'No se puede cerrar la única pestaña.' })
      return
    }
    ctx.closeTab()
    ctx.push({ type: 'info', text: 'Pestaña cerrada.' })
    return
  }

  if (sub === 'rename') {
    const name = args.slice(1).join(' ')
    if (!name) {
      ctx.push({ type: 'error', text: 'Uso: tab rename <nombre>' })
      return
    }
    ctx.renameActiveTab(name)
    ctx.push({ type: 'info', text: `Pestaña renombrada a "${name}".` })
    return
  }

  const n = parseInt(sub, 10)
  if (!isNaN(n)) {
    const tab = ctx.tabs[n - 1]
    if (!tab) {
      ctx.push({ type: 'error', text: `No existe la pestaña ${n}. Total: ${ctx.tabs.length}.` })
      return
    }
    ctx.setActiveTab(tab.id)
    ctx.push({ type: 'info', text: `Cambiado a "${tab.label}".` })
    return
  }

  ctx.push({ type: 'error', text: 'Uso: tab [list | new [nombre] | close | rename <nombre> | <N>]' })
}

// ── HTTP command helpers ───────────────────────────────────────────────────────

const VALID_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

const FIELD_LABELS: Record<WizardField, string> = {
  method:  'Método',
  url:     'URL',
  body:    'Body JSON',
  headers: 'Headers',
}

function computePendingFields(collected: WizardCollected): WizardField[] {
  const fields: WizardField[] = []
  if (!collected.method) fields.push('method')
  if (!collected.url)    fields.push('url')

  const method      = collected.method?.toUpperCase() as HttpMethod | undefined
  const isBodyless  = method === 'GET' || method === 'DELETE'

  // Ask for body only for methods that carry a body
  if (!isBodyless && collected.body === undefined) fields.push('body')

  // Ask for headers only when already entering wizard (other fields were missing)
  if (fields.length > 0 && collected.headers === undefined) fields.push('headers')

  return fields
}

function cmdHttp(args: string[], ctx: CommandContext): void {
  const collected: WizardCollected = {}

  // Parse positional args [METHOD] [URL]
  if (args[0]) {
    const upper = args[0].toUpperCase() as HttpMethod
    if (!VALID_METHODS.includes(upper)) {
      ctx.push({ type: 'error', text: `Método inválido: '${args[0]}'. Usa: ${VALID_METHODS.join(' | ')}` })
      return
    }
    collected.method = upper
  }

  if (args[1]) collected.url = args[1]

  const pending = computePendingFields(collected)

  if (pending.length === 0) {
    // All required fields present — execute immediately
    void executeHttpRequest(
      { method: collected.method as HttpMethod, url: collected.url! },
      ctx.push,
    )
    return
  }

  // Start wizard for missing fields
  ctx.push({ type: 'info', text: '  HTTP Wizard — completa cada campo en el input (ESC para cancelar):' })
  ctx.setWizard({ pendingFields: pending, collected })
}

// ── Wizard input handler (exported for CommandInput) ──────────────────────────

/**
 * Processes one wizard step. Validates the input, advances the wizard state,
 * and executes the request when all required fields have been collected.
 *
 * Called from CommandInput when `wizard !== null`.
 */
export async function handleWizardInput(
  input: string,
  wizard: WizardState,
  deps: { push: PushFn; setWizard: (s: WizardState | null) => void },
): Promise<void> {
  const [currentField, ...nextFields] = wizard.pendingFields
  if (!currentField) {
    deps.setWizard(null)
    return
  }

  const updated: WizardCollected  = { ...wizard.collected }
  let   remaining: WizardField[]  = [...nextFields]

  switch (currentField) {
    case 'method': {
      const upper = input.trim().toUpperCase() as HttpMethod
      if (!VALID_METHODS.includes(upper)) {
        deps.push({ type: 'error', text: `  Método inválido. Elige: ${VALID_METHODS.join(' | ')}` })
        return
      }
      updated.method = upper
      // Drop body step if not applicable for the chosen method
      if (upper === 'GET' || upper === 'DELETE') {
        remaining = remaining.filter((f) => f !== 'body')
      }
      break
    }
    case 'url': {
      const trimmed = input.trim()
      if (!trimmed) {
        deps.push({ type: 'error', text: '  La URL es obligatoria.' })
        return
      }
      updated.url = trimmed
      break
    }
    case 'body': {
      const trimmed = input.trim()
      if (trimmed) {
        try {
          JSON.parse(trimmed)
          updated.body = trimmed
        } catch {
          deps.push({ type: 'error', text: '  JSON inválido. Corrígelo o presiona Enter para omitir.' })
          return
        }
      }
      // Empty input → skip (body stays undefined)
      break
    }
    case 'headers': {
      const trimmed = input.trim()
      if (trimmed) updated.headers = trimmed
      break
    }
  }

  // Push combined label: value line
  const displayValue = input.trim() || '(omitido)'
  deps.push({ type: 'info', text: `  ${FIELD_LABELS[currentField]}: ${displayValue}` })

  // Wizard complete?
  if (remaining.length === 0) {
    deps.setWizard(null)
    await executeHttpRequest(
      {
        method:  updated.method as HttpMethod,
        url:     updated.url!,
        body:    updated.body,
        headers: updated.headers,
      },
      deps.push,
    )
    return
  }

  // Advance to next step
  deps.setWizard({ pendingFields: remaining, collected: updated })
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
  } else if (lower === 'opacity') {
    const val = parseInt(args[0] ?? '', 10)
    if (isNaN(val) || val < 0 || val > 100) {
      ctx.push({ type: 'error', text: 'Uso: opacity <0-100>  (ej: opacity 80)' })
    } else {
      ctx.setOpacity(val)
      ctx.push({ type: 'info', text: `Transparencia ajustada a ${Math.max(10, val)}%.` })
    }
  } else if (lower === 'tab') {
    cmdTab(args, ctx)
  } else if (lower === 'http') {
    cmdHttp(args, ctx)
  } else {
    ctx.push({
      type: 'error',
      text: `Comando desconocido: '${cmd}'. Escribe 'help' para ver los disponibles.`,
    })
  }
}
