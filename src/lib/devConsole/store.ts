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
  | { type: 'output';      text: string }
  | { type: 'error';       text: string }
  | { type: 'info';        text: string }
  | { type: 'divider' }
  | { type: 'http-header' }
  | { type: 'http-row';    entry: HttpLogEntry }

export type OutputLine = OutputInput & { id: string; ts: Date }

// ── Store ─────────────────────────────────────────────────────────────────────

interface DevConsoleStore {
  open: boolean
  height: number
  httpLog: HttpLogEntry[]
  output: OutputLine[]
  history: string[]

  toggle: () => void
  setOpen: (v: boolean) => void
  setHeight: (h: number) => void

  /** Add a new request entry (at bootstrap time — no status/duration yet). */
  logRequest: (entry: HttpLogEntry) => void
  /** Patch an existing entry once the response arrives. */
  finalizeRequest: (id: string, patch: Pick<HttpLogEntry, 'status' | 'duration' | 'responseBody' | 'error'>) => void

  push: (line: OutputInput) => void
  clearOutput: () => void
  addHistory: (cmd: string) => void
}

// ── ID generator ──────────────────────────────────────────────────────────────

let _seq = 0
function uid() {
  return `dc-${Date.now()}-${++_seq}`
}

// ── Zustand store ─────────────────────────────────────────────────────────────

export const useDevConsoleStore = create<DevConsoleStore>()((set) => ({
  open: false,
  height: 280,
  httpLog: [],
  output: [],
  history: [],

  toggle: () => set((s) => ({ open: !s.open })),
  setOpen: (v) => set({ open: v }),
  setHeight: (h) => set({ height: h }),

  logRequest: (entry) =>
    set((s) => ({
      httpLog: [entry, ...s.httpLog].slice(0, MAX_HTTP_LOG),
    })),

  finalizeRequest: (id, patch) =>
    set((s) => ({
      httpLog: s.httpLog.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    })),

  push: (line) =>
    set((s) => ({
      output: [...s.output, { ...line, id: uid(), ts: new Date() } as OutputLine].slice(-MAX_OUTPUT),
    })),

  clearOutput: () => set({ output: [] }),

  addHistory: (cmd) =>
    set((s) => ({
      history: [cmd, ...s.history.filter((c) => c !== cmd)].slice(0, 100),
    })),
}))
