import { useEffect, useRef, useCallback, useState } from 'react'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { useDevConsoleStore } from '@/shared/lib/devConsole/store'
import { runCommand, handleWizardInput } from '@/shared/lib/devConsole/commands'
import { IconDocument } from '@/shared/ui/icons'
import type { OutputLine, HttpLogEntry, ConsoleTab } from '@/shared/lib/devConsole/store'

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

function isJsonLike(text: string): boolean {
  const trimmed = text.trimStart()
  return trimmed.startsWith('{') || trimmed.startsWith('[')
}

const highlighterStyle: React.CSSProperties = {
  margin: 0,
  padding: 0,
  background: 'transparent',
  fontSize: 'inherit',
  lineHeight: 'inherit',
}

// ── Sub-components ────────────────────────────────────────────────────────────

// ── TabBar ────────────────────────────────────────────────────────────────────

function TabBar() {
  const tabs         = useDevConsoleStore((s) => s.tabs)
  const activeTabId  = useDevConsoleStore((s) => s.activeTabId)
  const setActiveTab = useDevConsoleStore((s) => s.setActiveTab)
  const addTab       = useDevConsoleStore((s) => s.addTab)
  const closeTab     = useDevConsoleStore((s) => s.closeTab)
  const renameTab    = useDevConsoleStore((s) => s.renameTab)

  const [renamingId,  setRenamingId]  = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const renameRef = useRef<HTMLInputElement>(null)

  function startRename(tab: ConsoleTab) {
    setRenamingId(tab.id)
    setRenameValue(tab.label)
    requestAnimationFrame(() => renameRef.current?.select())
  }

  function commitRename() {
    if (renamingId && renameValue.trim()) renameTab(renamingId, renameValue.trim())
    setRenamingId(null)
  }

  function onRenameKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitRename()
    if (e.key === 'Escape') setRenamingId(null)
    e.stopPropagation()
  }

  return (
    <div
      className="flex items-stretch border-b border-white/10 shrink-0 overflow-x-auto dev-console-scroll"
      role="tablist"
      aria-label="Pestañas de consola"
    >
      {tabs.map((tab) => {
        const isActive   = tab.id === activeTabId
        const isRenaming = tab.id === renamingId
        return (
          <div
            key={tab.id}
            id={`devconsole-tab-${tab.id}`}
            role="tab"
            aria-selected={isActive}
            aria-controls="dev-console-body"
            onClick={() => { if (!isRenaming) setActiveTab(tab.id) }}
            onDoubleClick={() => startRename(tab)}
            className={[
              'group flex items-center gap-1 px-3 h-7 border-r border-white/8',
              'cursor-pointer whitespace-nowrap shrink-0 transition-colors select-none',
              isActive
                ? 'bg-white/8 text-white'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/4',
            ].join(' ')}
          >
            {isRenaming ? (
              <input
                ref={renameRef}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={onRenameKey}
                onBlur={commitRename}
                onClick={(e) => e.stopPropagation()}
                className="bg-transparent text-white outline-none w-24 font-mono text-[11px]"
                autoComplete="off"
                spellCheck={false}
              />
            ) : (
              <span className="font-mono text-[11px]">{tab.label}</span>
            )}
            {tabs.length > 1 && !isRenaming && (
              <button
                onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
                aria-label={`Cerrar ${tab.label}`}
                tabIndex={-1}
                className="opacity-0 group-hover:opacity-100 w-3.5 h-3.5 flex items-center justify-center rounded hover:bg-white/15 text-slate-500 hover:text-white transition-all ml-0.5 shrink-0 text-base leading-none"
              >
                ×
              </button>
            )}
          </div>
        )
      })}
      <button
        onClick={() => addTab()}
        aria-label="Nueva pestaña de consola"
        title="Nueva pestaña (Alt+T)"
        className="px-2.5 h-7 text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-colors shrink-0 text-base leading-none"
      >
        +
      </button>
    </div>
  )
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function HttpTableHeader() {
  return (
    <div className="flex gap-2 py-0.5 border-b border-white/5 mt-1 font-mono text-[12px] text-slate-600 select-none">
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
      className="flex gap-2 py-0.5 font-mono text-[12px] items-center hover:bg-white/5 rounded px-1 -mx-1 transition-colors"
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

// ── Full output modal ─────────────────────────────────────────────────────────

function FullOutputModal({ text, onClose }: { text: string; onClose: () => void }) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === backdropRef.current) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="Salida completa"
    >
      <div className="bg-[#1e1e2e] border border-white/10 rounded-xl shadow-2xl w-[90vw] max-w-4xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <span className="text-sm font-semibold text-slate-300">
            Salida completa ({text.length.toLocaleString()} caracteres)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors px-2 py-1 rounded bg-white/5 hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-indigo-400"
            >
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded focus-visible:ring-1 focus-visible:ring-indigo-400"
              aria-label="Cerrar"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto px-4 py-3 font-mono text-[13px] leading-relaxed dev-console-scroll">
          {isJsonLike(text) ? (
            <SyntaxHighlighter
              language="json"
              style={atomOneDark}
              customStyle={highlighterStyle}
              wrapLongLines
            >
              {text}
            </SyntaxHighlighter>
          ) : (
            <pre className="text-slate-300 whitespace-pre-wrap break-all">{text}</pre>
          )}
        </div>
      </div>
    </div>
  )
}

function OutputLineItem({ line }: { line: OutputLine }) {
  const [showFull, setShowFull] = useState(false)

  if (line.type === 'divider') {
    return <hr className="border-white/10 my-1" aria-hidden="true" />
  }

  if (line.type === 'http-header') {
    return <HttpTableHeader />
  }

  if (line.type === 'http-row') {
    return <HttpRow entry={line.entry} />
  }

  if (line.type === 'command') {
    const tokens = line.text.trim().split(/\s+/)
    return (
      <div className="py-0.5 font-mono text-[13px] leading-relaxed">
        <span className="text-indigo-300 select-none">❯ </span>
        {tokens.map((token, i) => {
          let cls: string
          if (i === 0) {
            cls = 'text-yellow-300'           // nombre del comando
          } else if (token.startsWith('-')) {
            cls = 'text-emerald-400'           // flag / config
          } else if (tokens[i - 1]?.startsWith('-')) {
            cls = 'text-orange-300'            // valor de flag
          } else {
            cls = 'text-cyan-300'              // argumento posicional
          }
          return (
            <span key={i} className={cls}>
              {token}{i < tokens.length - 1 ? ' ' : ''}
            </span>
          )
        })}
      </div>
    )
  }

  const cls: Record<string, string> = {
    output:  'text-slate-300',
    error:   'text-red-400',
    info:    'text-cyan-400',
  }

  const hasFullText = line.type === 'output' && !!line.fullText
  const isOutput = line.type === 'output'
  const useHighlight = isOutput && isJsonLike(line.text)

  return (
    <>
      <div className={`py-0.5 font-mono text-[13px] leading-relaxed ${cls[line.type] ?? 'text-slate-300'}`}>
        {useHighlight ? (
          <SyntaxHighlighter
            language="json"
            style={atomOneDark}
            customStyle={highlighterStyle}
            wrapLongLines
          >
            {line.text}
          </SyntaxHighlighter>
        ) : (
          <span className="whitespace-pre-wrap break-all">{'  '}{line.text}</span>
        )}
        {hasFullText && (
          <button
            type="button"
            onClick={() => setShowFull(true)}
            className="ml-2 inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold transition-colors focus-visible:ring-1 focus-visible:ring-indigo-400 rounded px-1.5 py-0.5 bg-indigo-400/10 hover:bg-indigo-400/20"
          >
            <IconDocument className="h-3 w-3 shrink-0" aria-hidden="true" />
            Ver completo
          </button>
        )}
      </div>

      {hasFullText && showFull && (
        <FullOutputModal
          text={line.fullText!}
          onClose={() => setShowFull(false)}
        />
      )}
    </>
  )
}

// ── Command input ─────────────────────────────────────────────────────────────

function CommandInput({ focusRef }: { focusRef: React.RefObject<HTMLInputElement> }) {
  const push         = useDevConsoleStore((s) => s.push)
  const clearOutput  = useDevConsoleStore((s) => s.clearOutput)
  const httpLog      = useDevConsoleStore((s) => s.httpLog)
  const addHistory   = useDevConsoleStore((s) => s.addHistory)
  const setOpacity   = useDevConsoleStore((s) => s.setOpacity)
  const opacity      = useDevConsoleStore((s) => s.opacity)
  const addTab       = useDevConsoleStore((s) => s.addTab)
  const closeTab     = useDevConsoleStore((s) => s.closeTab)
  const renameTab    = useDevConsoleStore((s) => s.renameTab)
  const tabs         = useDevConsoleStore((s) => s.tabs)
  const activeTabId  = useDevConsoleStore((s) => s.activeTabId)
  const setActiveTab = useDevConsoleStore((s) => s.setActiveTab)
  const history      = useDevConsoleStore((s) => s.tabs.find((t) => t.id === s.activeTabId)?.history ?? [])
  const wizard       = useDevConsoleStore((s) => s.wizard)
  const setWizard    = useDevConsoleStore((s) => s.setWizard)

  const [value,   setValue]   = useState('')
  const [histIdx, setHistIdx] = useState(-1)

  // Wizard placeholders per field
  const wizardPlaceholders: Record<string, string> = {
    method:  'GET | POST | PUT | PATCH | DELETE',
    url:     '/api/v1/...  o  https://...',
    body:    'JSON body  (Enter para omitir)',
    headers: 'Clave:Valor, Clave2:Valor2  (Enter para omitir)',
  }
  const currentWizardField = wizard?.pendingFields[0]
  const inputPlaceholder = currentWizardField
    ? (wizardPlaceholders[currentWizardField] ?? 'Responde...')
    : 'Escribe un comando… (help para ver opciones)'

  async function submit() {
    const cmd = value.trim()
    setValue('')
    setHistIdx(-1)

    if (wizard) {
      await handleWizardInput(cmd, wizard, { push, setWizard })
      return
    }

    if (!cmd) return
    addHistory(cmd)
    runCommand(cmd, {
      httpLog, push, clear: clearOutput, setOpacity, opacity,
      addTab,
      closeTab: () => closeTab(activeTabId),
      renameActiveTab: (name) => renameTab(activeTabId, name),
      tabs, activeTabId, setActiveTab,
      wizard, setWizard,
    })
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      void submit()
    } else if (e.key === 'Escape' && wizard) {
      e.preventDefault()
      setWizard(null)
      push({ type: 'info', text: '  Wizard cancelado.' })
      setValue('')
    } else if (e.key === 'ArrowUp' && !wizard) {
      e.preventDefault()
      const next = Math.min(histIdx + 1, history.length - 1)
      setHistIdx(next)
      setValue(history[next] ?? '')
    } else if (e.key === 'ArrowDown' && !wizard) {
      e.preventDefault()
      const next = Math.max(histIdx - 1, -1)
      setHistIdx(next)
      setValue(next === -1 ? '' : (history[next] ?? ''))
    }
  }

  return (
    <div className="flex items-center gap-2 border-t border-white/10 px-3 py-1.5 shrink-0">
      <span
        className={`font-mono text-sm select-none transition-colors ${wizard ? 'text-yellow-400' : 'text-indigo-400'}`}
        aria-hidden="true"
      >
        {wizard ? '?' : '❯'}
      </span>
      <input
        ref={focusRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        className="flex-1 bg-transparent text-slate-200 font-mono text-sm outline-none placeholder:text-slate-600 caret-indigo-400"
        placeholder={inputPlaceholder}
        aria-label={wizard ? `Wizard HTTP — ${currentWizardField}` : 'Entrada de comando de consola'}
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
  const open         = useDevConsoleStore((s) => s.open)
  const height       = useDevConsoleStore((s) => s.height)
  const opacity      = useDevConsoleStore((s) => s.opacity)
  const activeOutput = useDevConsoleStore((s) => s.tabs.find((t) => t.id === s.activeTabId)?.output ?? [])
  const activeTabId  = useDevConsoleStore((s) => s.activeTabId)
  const httpLog      = useDevConsoleStore((s) => s.httpLog)
  const tabs         = useDevConsoleStore((s) => s.tabs)
  const toggle       = useDevConsoleStore((s) => s.toggle)
  const addTab       = useDevConsoleStore((s) => s.addTab)
  const closeTab     = useDevConsoleStore((s) => s.closeTab)
  const setActiveTab = useDevConsoleStore((s) => s.setActiveTab)
  const setHeight    = useDevConsoleStore((s) => s.setHeight)

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
  }, [activeOutput, open])

  // ── Focus input when opening ────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  // ── Keyboard shortcut Ctrl+` / Alt+T / Alt+W / Alt+] Alt+[ ─────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault()
        toggle()
      } else if (e.altKey && e.key === 't') {
        e.preventDefault()
        addTab()
      } else if (e.altKey && e.key === 'w') {
        e.preventDefault()
        if (tabs.length > 1) closeTab(activeTabId)
      } else if (e.altKey && e.key === ']') {
        e.preventDefault()
        const idx = tabs.findIndex((t) => t.id === activeTabId)
        const next = tabs[(idx + 1) % tabs.length]
        if (next) setActiveTab(next.id)
      } else if (e.altKey && e.key === '[') {
        e.preventDefault()
        const idx = tabs.findIndex((t) => t.id === activeTabId)
        const prev = tabs[(idx - 1 + tabs.length) % tabs.length]
        if (prev) setActiveTab(prev.id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle, addTab, closeTab, tabs, activeTabId, setActiveTab])

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
      className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-stretch"
      role="region"
      aria-label="Consola de desarrollo KeyGo"
    >
      {/* ── Panel — visible when open, grows upward ── */}
      {open && (
        <div
          className="flex flex-col border border-b-0 border-white/10 rounded-t-lg overflow-hidden shadow-2xl shadow-black/60"
          style={{ height, backgroundColor: `color-mix(in srgb, #0d1117 ${opacity}%, transparent)` }}
        >
          {/* Drag handle */}
          <div
            className="h-1 w-full cursor-ns-resize bg-transparent hover:bg-indigo-500/30 shrink-0 transition-colors"
            onMouseDown={onDragStart}
            aria-hidden="true"
            title="Arrastrar para redimensionar"
          />

          {/* Tab bar */}
          <TabBar />

          {/* Output + input */}
          <div id="dev-console-body" className="flex flex-col flex-1 min-h-0" role="tabpanel" aria-labelledby={`devconsole-tab-${activeTabId}`}>
            <div
              ref={outputRef}
              className="flex-1 overflow-y-auto px-3 py-2 min-h-0 scroll-smooth dev-console-scroll"
              role="log"
              aria-live="polite"
              aria-atomic="false"
              aria-label="Salida de la consola"
            >
              {activeOutput.length === 0 ? (
                <p className="text-slate-600 text-[11px] font-mono italic">
                  Consola lista. Escribe{' '}
                  <span className="text-indigo-400 not-italic">help</span>
                  {' '}para ver los comandos disponibles.
                </p>
              ) : (
                activeOutput.map((line) => <OutputLineItem key={line.id} line={line} />)
              )}
            </div>

            <CommandInput focusRef={inputRef} />
          </div>
        </div>
      )}

      {/* ── Tab trigger — always visible ── */}
      <button
        onClick={toggle}
        aria-label={open ? 'Cerrar consola' : 'Abrir consola'}
        aria-expanded={open}
        aria-controls={open ? 'dev-console-body' : undefined}
        className={[
          'flex items-center gap-2 px-3 h-7 w-full',
          'bg-[#0d1117]/92 backdrop-blur-md',
          'border border-white/10',
          open ? 'border-t-white/5 rounded-none' : 'rounded-t-lg',
          'text-slate-300 hover:text-white',
          'transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-indigo-500',
          'select-none',
        ].join(' ')}
      >
        <svg
          className="w-3.5 h-3.5 text-indigo-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>

        <span className="text-[11px] font-semibold tracking-wide font-mono">KeyGo Console</span>

        <RequestsBadge count={httpLog.length} />

        <div className="flex-1" />

        <kbd className="text-[10px] text-slate-600 font-mono border border-white/10 rounded px-1 py-px">
          Ctrl+`
        </kbd>

        {open ? (
          <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        )}
      </button>
    </div>
  )
}
