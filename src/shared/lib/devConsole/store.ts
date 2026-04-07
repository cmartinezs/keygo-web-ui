import { create } from 'zustand'

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_HTTP_LOG = 200
const MAX_OUTPUT   = 500

// ── HTTP log entry ────────────────────────────────────────────────────────────

export interface HttpLogEntry {
  id: string
  timestamp: Date
  method: string
  url: string
  status?: number
  duration?: number   // milliseconds
  requestBody?: unknown
  responseBody?: unknown
  error?: string
  /** Internal: used to compute duration on response. */
  _startMs?: number
}

// ── Output line types ─────────────────────────────────────────────────────────

export type OutputInput =
  | { type: 'command';     text: string }
  | { type: 'output';      text: string; fullText?: string }
  | { type: 'error';       text: string }
  | { type: 'info';        text: string }
  | { type: 'divider' }
  | { type: 'http-header' }
  | { type: 'http-row';    entry: HttpLogEntry }

export type OutputLine = OutputInput & { id: string; ts: Date }

// ── Wizard state ─────────────────────────────────────────────────────────────

export type WizardField = 'method' | 'url' | 'body' | 'headers'

export interface WizardCollected {
  method?: string
  url?: string
  body?: string
  headers?: string
}

export interface WizardState {
  pendingFields: WizardField[]
  collected: WizardCollected
}

// ── Console tab ───────────────────────────────────────────────────────────────

export interface ConsoleTab {
  id: string
  label: string
  output: OutputLine[]
  history: string[]
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface DevConsoleStore {
  open: boolean
  height: number
  /** Opacity of the console panel (10–100). Default: 90. */
  opacity: number
  httpLog: HttpLogEntry[]
  tabs: ConsoleTab[]
  activeTabId: string

  toggle: () => void
  setOpen: (v: boolean) => void
  setHeight: (h: number) => void
  setOpacity: (v: number) => void

  /** Add a new request entry (at bootstrap time — no status/duration yet). */
  logRequest: (entry: HttpLogEntry) => void
  /** Patch an existing entry once the response arrives. */
  finalizeRequest: (id: string, patch: Pick<HttpLogEntry, 'status' | 'duration' | 'responseBody' | 'error'>) => void

  // ── Tab management ──────────────────────────────────────────────────────────
  addTab: (label?: string) => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  renameTab: (id: string, label: string) => void

  // ── Active-tab output operations ────────────────────────────────────────────
  push: (line: OutputInput) => void
  clearOutput: () => void
  addHistory: (cmd: string) => void

  // ── Wizard ──────────────────────────────────────────────────────────────────
  wizard: WizardState | null
  setWizard: (state: WizardState | null) => void
}

// ── ID generator ──────────────────────────────────────────────────────────────

let _seq = 0
function uid() {
  return `dc-${Date.now()}-${++_seq}`
}

// ── Initial tab ───────────────────────────────────────────────────────────────

const INITIAL_TAB_ID = uid()
const INITIAL_TAB: ConsoleTab = { id: INITIAL_TAB_ID, label: 'Console 1', output: [], history: [] }

// ── Zustand store ─────────────────────────────────────────────────────────────

export const useDevConsoleStore = create<DevConsoleStore>()((set) => ({
  open: false,
  height: 280,
  opacity: 90,
  httpLog: [],
  tabs: [INITIAL_TAB],
  activeTabId: INITIAL_TAB_ID,

  toggle: () => set((s) => ({ open: !s.open })),
  setOpen: (v) => set({ open: v }),
  setHeight: (h) => set({ height: h }),
  setOpacity: (v) => set({ opacity: Math.max(10, Math.min(100, v)) }),

  logRequest: (entry) =>
    set((s) => ({
      httpLog: [entry, ...s.httpLog].slice(0, MAX_HTTP_LOG),
    })),

  finalizeRequest: (id, patch) =>
    set((s) => ({
      httpLog: s.httpLog.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    })),

  // ── Tab management ──────────────────────────────────────────────────────────

  addTab: (label) =>
    set((s) => {
      const id = uid()
      return {
        tabs: [...s.tabs, { id, label: label ?? `Console ${s.tabs.length + 1}`, output: [], history: [] }],
        activeTabId: id,
      }
    }),

  closeTab: (id) =>
    set((s) => {
      if (s.tabs.length <= 1) return s
      const idx = s.tabs.findIndex((t) => t.id === id)
      const newTabs = s.tabs.filter((t) => t.id !== id)
      const newActiveId = s.activeTabId === id
        ? (newTabs[Math.max(0, idx - 1)]?.id ?? newTabs[0].id)
        : s.activeTabId
      return { tabs: newTabs, activeTabId: newActiveId }
    }),

  setActiveTab: (id) => set({ activeTabId: id }),

  renameTab: (id, label) =>
    set((s) => ({
      tabs: s.tabs.map((t) => t.id === id ? { ...t, label } : t),
    })),

  // ── Active-tab output operations ────────────────────────────────────────────

  push: (line) =>
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === s.activeTabId
          ? { ...t, output: [...t.output, { ...line, id: uid(), ts: new Date() } as OutputLine].slice(-MAX_OUTPUT) }
          : t
      ),
    })),

  clearOutput: () =>
    set((s) => ({
      tabs: s.tabs.map((t) => t.id === s.activeTabId ? { ...t, output: [] } : t),
    })),

  addHistory: (cmd) =>
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === s.activeTabId
          ? { ...t, history: [cmd, ...t.history.filter((c) => c !== cmd)].slice(0, 100) }
          : t
      ),
    })),

  // ── Wizard ──────────────────────────────────────────────────────────────────
  wizard: null,
  setWizard: (state) => set({ wizard: state }),
}))
