import { IconAlertTriangle } from '@/shared/ui/icons'

interface LoadErrorStateProps {
  title: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
}

export function LoadErrorState({ title, description, onRetry, retryLabel = 'Retry' }: LoadErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 px-4 text-center" role="alert">
      <IconAlertTriangle className="w-6 h-6 text-slate-400 shrink-0" aria-hidden="true" />
      <div>
        <p className="text-slate-600 font-medium text-sm">{title}</p>
        {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 underline-offset-2 hover:underline transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
        >
          {retryLabel}
        </button>
      )}
    </div>
  )
}
