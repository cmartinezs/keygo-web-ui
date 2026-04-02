import { Dropdown } from '@/components/Dropdown'
import { useTranslation } from 'react-i18next'
import type { SelectDropdownProps } from '@/types/dropdown'

export function SelectDropdown<T extends string>({
  value,
  onChange,
  options,
  label,
  icon,
  ariaLabel,
  hideSelectedOption = false,
  selectedValueClassName,
}: SelectDropdownProps<T>) {
  const { t } = useTranslation()
  const current = options.find((option) => option.value === value)
  const menuOptions = hideSelectedOption
    ? options.filter((option) => option.value !== value)
    : options

  return (
    <Dropdown
      ariaLabel={ariaLabel}
      panelRole="listbox"
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={ariaLabel}
          className="flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 text-sm font-medium"
        >
          {icon}
          <span className={current && selectedValueClassName ? selectedValueClassName : ''}>{current?.label ?? label}</span>
          <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
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
            {menuOptions.length === 0 && (
              <li className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400" aria-hidden="true">
                {t('common.noMoreOptions')}
              </li>
            )}

            {menuOptions.map((option) => {
              const active = value === option.value

              return (
                <li key={option.value} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => select(option.value)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                      active
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >
                    {option.icon}
                    {option.label}
                    {active && (
                      <svg className="w-3.5 h-3.5 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )
      }}
    </Dropdown>
  )
}
