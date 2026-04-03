import { Component, type ErrorInfo, type ReactNode } from 'react'

interface AppErrorBoundaryProps {
  children: ReactNode
  title: string
  description: string
  actionLabel: string
}

interface AppErrorBoundaryState {
  hasError: boolean
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  constructor(props: AppErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled render error', error, errorInfo)
  }

  private handleReload = () => {
    window.location.assign('/dashboard')
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-slate-50 p-6 dark:bg-slate-950" role="main">
          <section
            role="alert"
            aria-live="assertive"
            className="mx-auto mt-16 max-w-xl rounded-xl border border-red-200 bg-white p-6 shadow-sm dark:border-red-500/30 dark:bg-slate-900"
          >
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{this.props.title}</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {this.props.description}
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {this.props.actionLabel}
            </button>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}