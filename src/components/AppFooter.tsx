import { useTranslation } from 'react-i18next'

const KEY_ICON_PATH =
  'M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z'

interface AppFooterProps {
  /** 'dark' for landing (slate-900 bg), 'light' for auth/billing pages */
  variant?: 'dark' | 'light' | 'adaptive'
}

export function AppFooter({ variant = 'light' }: AppFooterProps) {
  const { t } = useTranslation()
  const isDark = variant === 'dark'
  const isAdaptive = variant === 'adaptive'

  return (
    <footer
      role="contentinfo"
      className={isDark
        ? 'border-t border-white/10 px-4 py-8'
        : isAdaptive
          ? 'border-t border-slate-200/80 bg-white/70 px-4 py-5 backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/70 high-contrast:border-white high-contrast:bg-black'
          : 'py-5 px-4'}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <svg
            className={`w-5 h-5 ${isDark ? 'text-indigo-400' : isAdaptive ? 'text-indigo-500 dark:text-indigo-400 high-contrast:text-white' : 'text-indigo-500'}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d={KEY_ICON_PATH} />
          </svg>
          <span className={`font-semibold text-sm ${isDark ? 'text-white' : isAdaptive ? 'text-slate-700 dark:text-white high-contrast:text-white' : 'text-slate-700'}`}>
            KeyGo
          </span>
        </div>

        {/* Copyright */}
        <p className={`text-xs ${isDark ? 'text-slate-500' : isAdaptive ? 'text-slate-500 dark:text-slate-400 high-contrast:text-white/80' : 'text-slate-400'}`}>
          © {new Date().getFullYear()} KeyGo — {t('common.allRightsReserved')}
        </p>

        {/* Status */}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-emerald-400 rounded-full" aria-hidden="true" />
          <span className={`text-xs ${isDark ? 'text-slate-400' : isAdaptive ? 'text-slate-500 dark:text-slate-400 high-contrast:text-white/80' : 'text-slate-400'}`}>
            {t('common.allSystemsOperational')}
          </span>
        </div>
      </div>
    </footer>
  )
}
