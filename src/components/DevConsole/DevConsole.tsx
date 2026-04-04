import { useEffect, useRef, useCallback, useState } from 'react'
import { useDevConsoleStore } from '@/lib/devConsole/store'
import { runCommand } from '@/lib/devConsole/commands'
import type { OutputLine, HttpLogEntry } from '@/lib/devConsole/store'

// ── Constants ─────────────────────────────────────────────────────────────────

const MIN_HEIGHT       = 120
const MAX_HEIGHT_RATIO = 0.65

// ── HTTP helpers ──────────────────────────────────────────────────────────────

const METHOD_COLORS: Record<string, string> = {
  GET:    'text-cyan-400',
  POST:   'text-yellow-400',
  PUT:    'text-blue-300',
  DELETE: 'text-red-400',
  PATCH:  'text-orange-400',
}

function methodColor(method: string): string {
  return METHOD_COLORS[method.toUpperCase()] ?? 'text-slate-400'
}

function statusColor(status?: number): string {
  if (!status)      return 'text-slate-500'
  if (status < 300) return 'text-green-400'
  if (status < 400) return 'text-cyan-400'
  if (status < 500) return 'text-yellow-400'
  return 'text-red-400'
}

function shortUrl(url: string): string {
  try {
    const u = new URL(url)
    return u.pathname + (u.search || '')
  } catch {
    return url
  }
}

function fmtMs(ms?: number): string {
  if (ms === undefined) return '—'
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`
}

// ── Sub-components ────────────────────────────────────────────────────────────

function HttpTableHeader() {
  return (
    <div className="flex gap-2 py-0.5 border-b border-white/5 mt-1 font-mono text-[10px] text-slate-600 select-none">
      <span className="w-[68px] shrink-0">Hora</span>
      <span className="w-12   shrink-0">Metodo</span>
      <span className="flex-1 min-w-0">URL</span>
      <span className="w-10   shrink-0 text-right">Est.</span>
      <span className="w-[52px] shrink-0 text-right">Dur.</span>
    </div>
  )
}

function HttpRow({ entry }: { entry: HttpLogEntry }) {
  const time = entry.timestamp.toLocaleTimeString('es-CL', { hour12: false })
  const status = entry.status
  const errTag = entry.error && !status ? 'ERR' : undefined
  const pending = !status && !entry.error

  return (
    <div
      className="flex gap-2 py-0.5 font-mono text-[10px] items-center hover:bg-white/5 rounded px-1 -mx-1 transition-colors"
      title={entry.url}
    >
      <span className="w-[68px] shrink-0 text-slate-500">{time}</span>
      <span className={`w-12 shrink-0 font-bold ${methodColor(entry.method)}`}>
        {entry.method.slice(0, 6)}
      </span>
      <span className="flex-1 min-w-0 text-slate-300 truncate">
        {shortUrl(entry.url)}
      </span>
      <span className={`w-10 shrink-0 text-right ${statusColor(status)}`}>
        {errTag ?? (pending ? <span className="text-slate-600">…</span> : status)}
      </span>
      <span className="w-[52px] shrink-0 text-right text-slate-500">{fmtMs(entry.duration)}</span>
    </div>
  )
}

function OutputLineItem({ line }: { line: OutputLine }) {
  if (line.type === 'divider') {
    return <hr className="border-white/10 my-1" aria-hidden="true" />
  }

  if (line.type === 'http-header') {
    return <HttpTableHeader />
  }

  if (line.type === 'http-row') {
    return <HttpRow entry={line.entry} />
  }

  const cls: Record<string, string> = {
    command: 'text-indigo-300',
    output:  'text-slate-300',
    error:   'text-red-400',
    info:    'text-cyan-400',
  }
  const prefix = line.type === 'command' ? '❯ ' : '  '

  return (
    <div className={`py-0.5 font-mono text-[11px] whitespace-pre-wrap break-all leading-relaxed ${cls[line.type] ?? 'text-slate-300'}`}>
      {prefix}{line.text}
    </div>
  )
}

// ── Command input ─────────────────────────────────────────────────────────────

function CommandInput({ focusRef }: { focusRef: React.RefObject<HTMLInputElement> }) {
  const push        = useDevConsoleStore((s) => s.push)
  const clearOutput = useDevConsoleStore((s) => s.clearOutput)
  const httpLog     = useDevConsoleStore((s) => s.httpLog)
  const addHistory  = useDevConsoleStore((s) => s.addHistory)
  const history     = useDevConsoleStore((s) => s.history)

  const [value,   setValue]   = useState('')
  const [histIdx, setHistIdx] = useState(-1)

  function submit() {
    const cmd = value.trim()
    if (!cmd) return
    addHistory(cmd)
    runCommand(cmd, { httpLog, push, clear: clearOutput })
    setValue('')
    setHistIdx(-1)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      submit()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const next = Math.min(histIdx + 1, history.length - 1)
      setHistIdx(next)
      setValue(history[next] ?? '')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = Math.max(histIdx - 1, -1)
      setHistIdx(next)
      setValue(next === -1 ? '' : (history[next] ?? ''))
    }
  }

  return (
    <div className="flex items-center gap-2 border-t border-white/10 px-3 py-1.5 shrink-0">
      <span className="text-indigo-400 font-mono text-xs select-none" aria-hidden="true">❯</span>
      <input
        ref={focusRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        className="flex-1 bg-transparent text-slate-200 font-mono text-xs outline-none placeholder:text-slate-600 caret-indigo-400"
        placeholder="Escribe un comando… (help para ver opciones)"
        aria-label="Entrada de comando de consola"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────

function RequestsBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span
      className="inline-flex items-center px-1.5 py-[1px] rounded font-mono text-[10px] font-bold bg-indigo-900/50 text-indigo-300 border border-indigo-700/40"
      aria-label={`${count} requests registrados`}
    >
      {count}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function DevConsole() {
  const open      = useDevConsoleStore((s) => s.open)
  const height    = useDevConsoleStore((s) => s.height)
  const output    = useDevConsoleStore((s) => s.output)
  const httpLog   = useDevConsoleStore((s) => s.httpLog)
  const toggle    = useDevConsoleStore((s) => s.toggle)
  const setOpen   = useDevConsoleStore((s) => s.setOpen)
  const setHeight = useDevConsoleStore((s) => s.setHeight)

  const outputRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLInputElement>(null) as React.RefObject<HTMLInputElement>
  const dragging   = useRef(false)
  const dragStartY = useRef(0)
  const dragStartH = useRef(0)

  // ── Auto-scroll output ──────────────────────────────────────────────────────
  useEffect(() => {
    if (open && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output, open])

  // ── Focus input when opening ────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  // ── Keyboard shortcut Ctrl+` ────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle])

  // ── Drag-to-resize ──────────────────────────────────────────────────────────
  const maxHeight = typeof window !== 'undefined'
    ? Math.floor(window.innerHeight * MAX_HEIGHT_RATIO)
    : 500

  const onDragStart = useCallback((e: React.MouseEvent) => {
    dragging.current   = true
    dragStartY.current = e.clientY
    dragStartH.current = height
    e.preventDefault()
  }, [height])

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragging.current) return
      const diff = dragStartY.current - e.clientY
      const next = Math.max(MIN_HEIGHT, Math.min(maxHeight, dragStartH.current + diff))
      setHeight(next)
    }
    function onUp() { dragging.current = false }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [setHeight, maxHeight])

  return (
    <div
      className="shrink-0 bg-[#0d1117] border-t border-white/10 flex flex-col overflow-hidden"
      style={{ height: open ? height : 28 }}
      role="region"
      aria-label="Consola de desarrollo KeyGo"
    >
      {/* Drag handle — only when open */}
      {open && (
        <div
          className="h-1 w-full cursor-ns-resize bg-transparent hover:bg-indigo-500/30 shrink-0 transition-colors"
          onMouseDown={onDragStart}
          aria-hidden="true"
          title="Arrastrar para redimensionar"
        />
      )}

      {/* ── Header bar ── */}
      <div
        className="h-7 flex items-center gap-2 px-3 shrink-0 border-b border-white/8"
        onDoubleClick={toggle}
      >
        {/* Terminal icon */}
        <svg
          className="w-3.5 h-3.5 text-indigo-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>

        <span className="text-[11px] font-semibold text-slate-300 tracking-wide select-none">
          KeyGo Console
        </span>

        <RequestsBadge count={httpLog.length} />

        <div className="flex-1" />

        {/* Keyboard hint */}
        <kbd className="text-[10px] text-slate-600 font-mono select-none border border-white/10 rounded px-1 py-px">
          Ctrl+`
        </kbd>

        {/* Minimize / Expand button */}
        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Minimizar consola' : 'Abrir consola'}
          aria-expanded={open}
          aria-controls="dev-console-body"
          className="w-5 h-5 flex items-center justify-center rounded text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-colors focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:outline-none"
        >
          {open ? (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Body (output + input) — only when open ── */}
      {open && (
        <div id="dev-console-body" className="flex flex-col flex-1 min-h-0">
          {/* Output area */}
          <div
            ref={outputRef}
            className="flex-1 overflow-y-auto px-3 py-2 min-h-0 scroll-smooth"
            role="log"
            aria-live="polite"
            aria-atomic="false"
            aria-label="Salida de la consola"
          >
            {output.length === 0 ? (
              <p className="text-slate-600 text-[11px] font-mono italic">
                Consola lista. Escribe{' '}
                <span className="text-indigo-400 not-italic">help</span>
                {' '}para ver los comandos disponibles.
              </p>
            ) : (
              output.map((line) => <OutputLineItem key={line.id} line={line} />)
            )}
          </div>

          {/* Command input */}
          <CommandInput focusRef={inputRef} />
        </div>
      )}
    </div>
  )
}
