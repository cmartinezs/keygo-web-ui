import { Component, createRef, type ErrorInfo, type ReactNode } from 'react'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { AppFooter } from '@/shared/ui/AppFooter'
import { IconClipboard, IconRefresh, IconChevronLeft } from '@/shared/ui/icons'

interface AppErrorBoundaryProps {
  children: ReactNode
  title: string
  description: string
  reloadLabel: string
  safeExitLabel: string
  debugTitle: string
  debugStackTitle: string
  debugRuntimeStackTitle: string
  debugSourceTitle: string
  debugSourceUnavailable: string
  debugCopyStackLabel: string
  debugCopySuccess: string
  debugCopyError: string
}

interface SourceLocation {
  file: string
  line: number
  column: number
}

interface SourcePreview {
  startLine: number
  line: number
  column: number
  lines: string[]
}

interface AppErrorBoundaryState {
  hasError: boolean
  errorMessage: string | null
  runtimeStack: string | null
  componentStack: string | null
  sourceLocation: SourceLocation | null
  sourcePreview: SourcePreview | null
  componentCopyStatus: 'idle' | 'success' | 'error'
  runtimeCopyStatus: 'idle' | 'success' | 'error'
}

function extractSourceLocation(runtimeStack: string): SourceLocation | null {
  const rowMatch = /(?:https?:\/\/[^\s)]+|\/src\/[^\s)]+):(\d+):(\d+)/.exec(runtimeStack)
  if (!rowMatch?.[0] || !rowMatch[1] || !rowMatch[2]) {
    return null
  }

  const line = Number(rowMatch[1])
  const column = Number(rowMatch[2])
  if (!Number.isInteger(line) || !Number.isInteger(column)) {
    return null
  }

  return {
    file: rowMatch[0].replace(/:\d+:\d+$/, ''),
    line,
    column,
  }
}

function toSourceUrl(rawFile: string): string | null {
  if (/^https?:\/\//.test(rawFile)) {
    return rawFile
  }
  if (rawFile.startsWith('/')) {
    return rawFile
  }
  return null
}

function inferCodeLanguage(path: string): string {
  if (path.endsWith('.tsx') || path.endsWith('.ts')) return 'typescript'
  if (path.endsWith('.jsx') || path.endsWith('.js')) return 'javascript'
  if (path.endsWith('.json')) return 'json'
  if (path.endsWith('.css')) return 'css'
  if (path.endsWith('.html')) return 'xml'
  return 'typescript'
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  private sourcePreviewRef = createRef<HTMLDivElement>()
  private pointerRafId: number | null = null

  constructor(props: AppErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      errorMessage: null,
      runtimeStack: null,
      componentStack: null,
      sourceLocation: null,
      sourcePreview: null,
      componentCopyStatus: 'idle',
      runtimeCopyStatus: 'idle',
    }
  }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: null,
      runtimeStack: null,
      componentStack: null,
      sourceLocation: null,
      sourcePreview: null,
      componentCopyStatus: 'idle',
      runtimeCopyStatus: 'idle',
    }
  }

  componentDidUpdate(
    _prevProps: AppErrorBoundaryProps,
    prevState: AppErrorBoundaryState,
  ) {
    if (
      this.state.sourcePreview !== prevState.sourcePreview
      || this.state.sourceLocation?.column !== prevState.sourceLocation?.column
    ) {
      this.queueRenderSourcePointer()
    }
  }

  componentWillUnmount() {
    if (this.pointerRafId !== null) {
      window.cancelAnimationFrame(this.pointerRafId)
      this.pointerRafId = null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled render error', error, errorInfo)
    const runtimeStack = typeof error.stack === 'string' && error.stack.trim().length > 0
      ? error.stack
      : null
    const sourceLocation = runtimeStack ? extractSourceLocation(runtimeStack) : null

    this.setState({
      errorMessage: error.message || 'Unknown render error',
      runtimeStack,
      componentStack: errorInfo.componentStack || null,
      sourceLocation,
      sourcePreview: null,
      componentCopyStatus: 'idle',
      runtimeCopyStatus: 'idle',
    })

    if (!import.meta.env.PROD && sourceLocation) {
      void this.loadSourcePreview(sourceLocation)
    }
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleSafeExit = () => {
    const path = window.location.pathname
    if (path.startsWith('/dashboard') || path.startsWith('/admin')) {
      window.location.assign('/logout')
      return
    }
    window.location.assign('/')
  }

  private copyText = async (
    textToCopy: string | null,
    target: 'component' | 'runtime',
  ) => {
    if (!textToCopy) return

    try {
      await navigator.clipboard.writeText(textToCopy)
      if (target === 'component') {
        this.setState({ componentCopyStatus: 'success' })
      } else {
        this.setState({ runtimeCopyStatus: 'success' })
      }
    } catch {
      if (target === 'component') {
        this.setState({ componentCopyStatus: 'error' })
      } else {
        this.setState({ runtimeCopyStatus: 'error' })
      }
    }
  }

  private handleCopyComponentStack = async () => {
    await this.copyText(this.state.componentStack?.trim() ?? null, 'component')
  }

  private handleCopyRuntimeStack = async () => {
    await this.copyText(this.state.runtimeStack?.trim() ?? null, 'runtime')
  }

  private async loadSourcePreview(location: SourceLocation) {
    const sourceUrl = toSourceUrl(location.file)
    if (!sourceUrl) return

    try {
      const response = await fetch(sourceUrl)
      if (!response.ok) return
      const fileText = await response.text()
      const allLines = fileText.split('\n')

      if (location.line < 1 || location.line > allLines.length) return

      const start = Math.max(1, location.line - 2)
      const end = Math.min(allLines.length, location.line + 2)
      const windowLines = allLines.slice(start - 1, end)
      this.setState({
        sourcePreview: {
          startLine: start,
          line: location.line,
          column: location.column,
          lines: windowLines,
        },
      })
    } catch {
      // Ignore preview failures; stack text is still useful.
    }
  }

  private queueRenderSourcePointer() {
    if (this.pointerRafId !== null) {
      window.cancelAnimationFrame(this.pointerRafId)
    }

    this.pointerRafId = window.requestAnimationFrame(() => {
      this.pointerRafId = null
      this.renderSourcePointer()
    })
  }

  private renderSourcePointer() {
    const previewContainer = this.sourcePreviewRef.current
    if (!previewContainer || !this.state.sourcePreview) return

    previewContainer
      .querySelectorAll('[data-source-pointer="true"]')
      .forEach((node) => node.remove())

    const errorLine = previewContainer.querySelector('[data-error-line="true"]') as HTMLElement | null
    if (!errorLine) return

    const marker = document.createElement('div')
    marker.setAttribute('data-source-pointer', 'true')
    marker.setAttribute('aria-hidden', 'true')
    marker.textContent = '^'
    marker.style.position = 'absolute'
    marker.style.top = `${errorLine.offsetTop + errorLine.offsetHeight - 2}px`
    marker.style.color = 'rgb(253 224 71)'
    marker.style.fontWeight = '700'
    marker.style.pointerEvents = 'none'
    marker.style.lineHeight = '1'
    marker.style.height = '0.75rem'

    const left = this.measurePointerLeft(errorLine, this.state.sourcePreview.column)
    marker.style.left = `${Math.max(0, left)}px`
    previewContainer.appendChild(marker)
  }

  private measurePointerLeft(lineElement: HTMLElement, column: number): number {
    const lineRect = lineElement.getBoundingClientRect()
    const targetOffset = Math.max(0, column - 1)
    const walker = document.createTreeWalker(lineElement, NodeFilter.SHOW_TEXT)

    let consumed = 0
    let lastEligibleNode: Text | null = null

    while (walker.nextNode()) {
      const textNode = walker.currentNode as Text
      const parent = textNode.parentElement
      if (!parent) continue
      if (parent.closest('.react-syntax-highlighter-line-number')) {
        continue
      }

      const value = textNode.textContent ?? ''
      lastEligibleNode = textNode

      if (consumed + value.length >= targetOffset) {
        const localOffset = Math.max(0, Math.min(value.length, targetOffset - consumed))
        const range = document.createRange()
        range.setStart(textNode, localOffset)
        range.setEnd(textNode, localOffset)
        const rect = range.getBoundingClientRect()
        return rect.left - lineRect.left
      }

      consumed += value.length
    }

    if (lastEligibleNode) {
      const fallbackRange = document.createRange()
      const size = (lastEligibleNode.textContent ?? '').length
      fallbackRange.setStart(lastEligibleNode, size)
      fallbackRange.setEnd(lastEligibleNode, size)
      const fallbackRect = fallbackRange.getBoundingClientRect()
      return fallbackRect.left - lineRect.left
    }

    return 0
  }

  render() {
    const shouldShowDebugDetails = !import.meta.env.PROD

    if (this.state.hasError) {
      return (
        <main
          className="h-dvh overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white high-contrast:bg-black high-contrast:text-white"
          role="main"
        >
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-hidden px-4 py-4 sm:px-6 sm:py-6">
              <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-center">
                <section
                  role="alert"
                  aria-live="assertive"
                  className="flex h-full max-h-full w-full flex-col overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm dark:border-red-500/30 dark:bg-slate-900 high-contrast:border-white high-contrast:bg-black"
                >
                  <div className="flex-1 overflow-auto p-5 sm:p-6 lg:p-8">
                    <h1 className="text-lg font-semibold text-slate-900 dark:text-white high-contrast:text-white">
                      {this.props.title}
                    </h1>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 high-contrast:text-white/90">
                      {this.props.description}
                    </p>

                    {shouldShowDebugDetails ? (
                      <section className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-400/40 dark:bg-amber-950/20 high-contrast:border-white high-contrast:bg-neutral-950">
                        <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-200 high-contrast:text-white">
                          {this.props.debugTitle}
                        </h2>
                        <p className="mt-2 text-xs text-amber-900 dark:text-amber-200 high-contrast:text-white/90">
                          {this.state.errorMessage ?? 'Unknown render error'}
                        </p>

                        {this.state.sourceLocation ? (
                          <>
                            <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-200 high-contrast:text-white">
                              {this.props.debugSourceTitle}
                            </h3>
                            <p className="mt-1 break-all text-xs text-amber-900 dark:text-amber-100 high-contrast:text-white/90">
                              {`${this.state.sourceLocation.file}:${this.state.sourceLocation.line}:${this.state.sourceLocation.column}`}
                            </p>

                            {this.state.sourcePreview ? (
                              <div
                                ref={this.sourcePreviewRef}
                                className="relative mt-1 overflow-auto rounded-md bg-slate-900/80 text-xs leading-6 high-contrast:border high-contrast:border-white"
                              >
                                <SyntaxHighlighter
                                  language={inferCodeLanguage(this.state.sourceLocation.file)}
                                  style={atomOneDark}
                                  customStyle={{
                                    margin: 0,
                                    padding: '0.75rem',
                                    background: 'transparent',
                                    fontSize: 'inherit',
                                    lineHeight: 'inherit',
                                  }}
                                  showLineNumbers
                                  wrapLines
                                  lineNumberStyle={{
                                    minWidth: '3.5em',
                                    width: '3.5em',
                                    display: 'inline-block',
                                    opacity: 0.65,
                                  }}
                                  startingLineNumber={this.state.sourcePreview.startLine}
                                  lineProps={(lineNumber) => {
                                    if (lineNumber === this.state.sourcePreview?.line) {
                                      return {
                                        style: {
                                          backgroundColor: 'rgba(245, 158, 11, 0.2)',
                                          position: 'relative',
                                          marginBottom: '0.75rem',
                                        },
                                        'data-error-line': 'true',
                                      }
                                    }
                                    return {}
                                  }}
                                  wrapLongLines={false}
                                >
                                  {this.state.sourcePreview.lines.join('\n')}
                                </SyntaxHighlighter>
                              </div>
                            ) : (
                              <p className="mt-1 text-xs text-amber-900 dark:text-amber-100 high-contrast:text-white/90">
                                {this.props.debugSourceUnavailable}
                              </p>
                            )}
                          </>
                        ) : null}

                        {this.state.componentStack ? (
                          <>
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                              <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-200 high-contrast:text-white">
                                {this.props.debugStackTitle}
                              </h3>
                              <button
                                type="button"
                                onClick={this.handleCopyComponentStack}
                                className="inline-flex items-center gap-1.5 rounded-md border border-amber-400/60 bg-white px-2.5 py-1 text-xs font-medium text-amber-900 transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-amber-300/50 dark:bg-slate-900/70 dark:text-amber-100 dark:hover:bg-slate-800 high-contrast:border-white high-contrast:bg-black high-contrast:text-white high-contrast:hover:bg-neutral-900"
                                aria-label={this.props.debugCopyStackLabel}
                              >
                                <span aria-hidden="true"><IconClipboard /></span>
                                <span>{this.props.debugCopyStackLabel}</span>
                              </button>
                            </div>

                            {this.state.componentCopyStatus !== 'idle' ? (
                              <p role="status" aria-live="polite" className="mt-2 text-xs text-amber-900 dark:text-amber-100 high-contrast:text-white/90">
                                {this.state.componentCopyStatus === 'success'
                                  ? this.props.debugCopySuccess
                                  : this.props.debugCopyError}
                              </p>
                            ) : null}

                            <pre className="mt-1 max-h-56 overflow-auto whitespace-pre-wrap rounded-md bg-white/80 p-3 text-xs text-amber-950 dark:bg-slate-900/70 dark:text-amber-100 high-contrast:border high-contrast:border-white high-contrast:bg-black high-contrast:text-white">
                              {this.state.componentStack.trim()}
                            </pre>
                          </>
                        ) : null}

                        {this.state.runtimeStack ? (
                          <>
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                              <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-200 high-contrast:text-white">
                                {this.props.debugRuntimeStackTitle}
                              </h3>
                              <button
                                type="button"
                                onClick={this.handleCopyRuntimeStack}
                                className="inline-flex items-center gap-1.5 rounded-md border border-amber-400/60 bg-white px-2.5 py-1 text-xs font-medium text-amber-900 transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-amber-300/50 dark:bg-slate-900/70 dark:text-amber-100 dark:hover:bg-slate-800 high-contrast:border-white high-contrast:bg-black high-contrast:text-white high-contrast:hover:bg-neutral-900"
                                aria-label={this.props.debugCopyStackLabel}
                              >
                                <span aria-hidden="true"><IconClipboard /></span>
                                <span>{this.props.debugCopyStackLabel}</span>
                              </button>
                            </div>

                            {this.state.runtimeCopyStatus !== 'idle' ? (
                              <p role="status" aria-live="polite" className="mt-2 text-xs text-amber-900 dark:text-amber-100 high-contrast:text-white/90">
                                {this.state.runtimeCopyStatus === 'success'
                                  ? this.props.debugCopySuccess
                                  : this.props.debugCopyError}
                              </p>
                            ) : null}

                            <pre className="mt-1 max-h-56 overflow-auto whitespace-pre-wrap rounded-md bg-white/80 p-3 text-xs text-amber-950 dark:bg-slate-900/70 dark:text-amber-100 high-contrast:border high-contrast:border-white high-contrast:bg-black high-contrast:text-white">
                              {this.state.runtimeStack}
                            </pre>
                          </>
                        ) : null}
                      </section>
                    ) : null}
                  </div>

                  <div className="border-t border-slate-200 px-5 py-4 dark:border-white/10 high-contrast:border-white sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={this.handleReload}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 high-contrast:border high-contrast:border-white high-contrast:bg-white high-contrast:text-black high-contrast:hover:bg-white/90"
                      >
                        <IconRefresh className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {this.props.reloadLabel}
                      </button>
                      <button
                        type="button"
                        onClick={this.handleSafeExit}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:border-white/15 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 high-contrast:border-white high-contrast:bg-black high-contrast:text-white high-contrast:hover:bg-neutral-900"
                      >
                        <IconChevronLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {this.props.safeExitLabel}
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <AppFooter variant="adaptive" />
          </div>
        </main>
      )
    }

    return this.props.children
  }
}