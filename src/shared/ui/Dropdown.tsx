import { useDropdown } from '@/shared/hooks/useDropdown'
import type { DropdownProps } from '@/shared/types/dropdown'

const DEFAULT_DROPDOWN_PANEL_CLASS =
  'absolute right-0 top-full mt-2 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 py-1 z-50'

export function Dropdown({
  ariaLabel,
  trigger,
  containerClassName,
  panelClassName = DEFAULT_DROPDOWN_PANEL_CLASS,
  panelRole = 'menu',
  children,
}: DropdownProps) {
  const { open, ref, toggle, close } = useDropdown()

  return (
    <div className={['relative', containerClassName ?? ''].join(' ')} ref={ref}>
      {trigger({ open, toggle })}

      {open && (
        <div role={panelRole} aria-label={ariaLabel} className={panelClassName}>
          {typeof children === 'function' ? children({ close }) : children}
        </div>
      )}
    </div>
  )
}
