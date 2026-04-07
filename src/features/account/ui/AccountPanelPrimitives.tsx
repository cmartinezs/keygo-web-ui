import type { ReactNode } from 'react'

interface PanelCardProps {
  title: string
  subtitle?: string
  titleId?: string
  badge?: ReactNode
  children: ReactNode
}

export function PanelCard({ title, subtitle, titleId, badge, children }: PanelCardProps) {
  return (
    <article
      aria-labelledby={titleId}
      className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id={titleId} className="text-base font-semibold text-slate-900 dark:text-white">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
          ) : null}
        </div>
        {badge}
      </div>

      {children}
    </article>
  )
}

export function LoadingMessage({ message, withMargin = false }: { message: string; withMargin?: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`${withMargin ? 'mt-4 ' : ''}text-sm text-slate-500 dark:text-slate-400`}
    >
      {message}
    </div>
  )
}

export function ErrorMessage({ message, withMargin = false }: { message: string; withMargin?: boolean }) {
  return (
    <div
      role="alert"
      className={`${withMargin ? 'mt-4 ' : ''}rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300`}
    >
      {message}
    </div>
  )
}

export function PrimaryActionButton({
  label,
  pendingLabel,
  pending,
  disabled,
  onClick,
  type = 'button',
}: {
  label: string
  pendingLabel: string
  pending: boolean
  disabled: boolean
  onClick?: () => void
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-busy={pending}
      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-900"
    >
      {pending ? pendingLabel : label}
    </button>
  )
}

export function DangerActionButton({
  label,
  pendingLabel,
  pending,
  disabled,
  onClick,
}: {
  label: string
  pendingLabel: string
  pending: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={pending}
      className="shrink-0 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10 dark:focus-visible:ring-offset-slate-900"
    >
      {pending ? pendingLabel : label}
    </button>
  )
}
