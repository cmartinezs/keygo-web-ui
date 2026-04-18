import { Dropdown } from '@/shared/ui/Dropdown'
import { useTranslation } from 'react-i18next'
import { IconChevronDown, IconCheckmark } from '@/shared/ui/icons'
import type { ReactNode } from 'react'

export interface FormSelectOption<T extends string> {
  value: T
  label: string
  description?: string
  icon?: ReactNode
}

export interface FormSelectDropdownProps<T extends string> {
  value: T | ''
  onChange: (value: T) => void
  options: FormSelectOption<T>[]
  label: string
  placeholder?: string
  ariaLabel?: string
  disabled?: boolean
  required?: boolean
  error?: string
  containerClassName?: string
  triggerClassName?: string
  panelClassName?: string
  optionClassName?: string
  activeOptionClassName?: string
  emptyStateClassName?: string
}

export function FormSelectDropdown<T extends string>({
  value,
  onChange,
  options,
  label,
  placeholder,
  ariaLabel,
  disabled = false,
  required = false,
  error,
  containerClassName,
  triggerClassName,
  panelClassName,
  optionClassName,
  activeOptionClassName,
  emptyStateClassName,
}: FormSelectDropdownProps<T>) {
  const { t } = useTranslation()
  const current = options.find((option) => option.value === value)
  const displayLabel = current 
    ? current.description 
      ? `${current.label} — ${current.description}`
      : current.label
    : placeholder || label

  return (
    <div className={containerClassName || 'flex flex-col gap-1.5'}>
      <label className="text-sm font-medium text-slate-700">
        {label}
        {required && <span aria-hidden="true" className="text-red-500 ml-1">*</span>}
      </label>

      <Dropdown
        ariaLabel={ariaLabel || label}
        panelRole="listbox"
        panelClassName={panelClassName || 'absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 py-1 z-50'}
        containerClassName="w-full"
        trigger={({ open, toggle }) => (
          <button
            type="button"
            onClick={toggle}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label={ariaLabel || label}
            aria-invalid={!!error}
            className={[
              'w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left text-sm',
              error
                ? 'border-red-300 bg-red-50 text-red-900'
                : 'border-slate-300 bg-white text-slate-900 hover:border-slate-400',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500',
              'disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed',
              triggerClassName ?? '',
            ].join(' ')}
          >
            <span>{displayLabel}</span>
            <span className="opacity-60 shrink-0" aria-hidden="true">
              <IconChevronDown />
            </span>
          </button>
        )}
      >
        {({ close }) => {
          function select(nextValue: T) {
            onChange(nextValue)
            close()
          }

          return (
            <ul>
              {options.length === 0 && (
                <li
                  className={[
                    'px-3 py-2 text-sm text-slate-500 dark:text-slate-400',
                    emptyStateClassName ?? '',
                  ].join(' ')}
                  aria-hidden="true"
                >
                  {t('common.noMoreOptions')}
                </li>
              )}

              {options.map((option) => {
                const active = value === option.value

                return (
                  <li key={option.value} role="option" aria-selected={active} className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => select(option.value)}
                      className={[
                        'w-full flex items-start gap-2.5 px-3 py-2 text-sm transition-colors',
                        active
                          ? (activeOptionClassName ?? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 font-semibold')
                          : (optionClassName ?? 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'),
                      ].join(' ')}
                    >
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        {option.icon && <span className="shrink-0 mt-0.5">{option.icon}</span>}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{option.label}</div>
                          {option.description && (
                            <div className="text-xs opacity-75 line-clamp-2">{option.description}</div>
                          )}
                        </div>
                      </div>
                      {active && (
                        <span className="ml-auto shrink-0 mt-0.5" aria-hidden="true">
                          <IconCheckmark />
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )
        }}
      </Dropdown>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
