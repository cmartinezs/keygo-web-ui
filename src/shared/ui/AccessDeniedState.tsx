import { useTranslation } from 'react-i18next'
import { IconShield } from '@/shared/ui/icons'

interface AccessDeniedStateProps {
  title?: string
  message: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  children?: React.ReactNode
}

export function AccessDeniedState({
  title,
  message,
  description,
  actionLabel,
  onAction,
  children,
}: AccessDeniedStateProps) {
  const { t } = useTranslation()

  return (
    <section
      role="alert"
      aria-live="assertive"
      className="flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-xl border border-amber-300 bg-amber-50 p-8 text-center dark:border-amber-500/30 dark:bg-amber-500/10"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
        <IconShield className="h-8 w-8" aria-hidden="true" />
      </div>
      <div className="max-w-xl space-y-2">
        <h2 className="text-lg font-semibold text-amber-950 dark:text-amber-100">
          {title ?? t('common.accessDeniedTitle')}
        </h2>
        <p className="text-sm text-amber-900 dark:text-amber-200">{message}</p>
        {description ? (
          <p className="text-sm text-amber-800 dark:text-amber-300">{description}</p>
        ) : null}
      </div>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center justify-center rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
        >
          {actionLabel}
        </button>
      ) : null}
      {children ? <div className="w-full max-w-xl">{children}</div> : null}
    </section>
  )
}
