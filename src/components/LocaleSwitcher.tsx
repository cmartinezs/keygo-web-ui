import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { SelectDropdown } from '@/components/SelectDropdown'
import type { SupportedLocale } from '@/i18n/constants'
import { useLocale } from '@/i18n/useLocale'

interface LocaleSwitcherProps {
  compact?: boolean
  containerClassName?: string
  triggerClassName?: string
  panelClassName?: string
  selectedValueClassName?: string
  optionClassName?: string
  activeOptionClassName?: string
  emptyStateClassName?: string
}

function IconFlagChile() {
  return (
    <svg className="w-4 h-4 shrink-0 rounded-sm" viewBox="0 0 20 14" aria-hidden="true">
      <rect width="20" height="7" fill="#ffffff" />
      <rect y="7" width="20" height="7" fill="#d52b1e" />
      <rect width="8" height="7" fill="#0039a6" />
      <path d="M4 1.4l.67 1.99h2.1L5.08 4.6l.65 1.99L4 5.36 2.27 6.59l.65-1.99L1.23 3.39h2.1L4 1.4z" fill="#ffffff" />
    </svg>
  )
}

function IconFlagUs() {
  return (
    <svg className="w-4 h-4 shrink-0 rounded-sm" viewBox="0 0 20 14" aria-hidden="true">
      <rect width="20" height="14" fill="#ffffff" />
      <rect y="0" width="20" height="1.2" fill="#b22234" />
      <rect y="2.4" width="20" height="1.2" fill="#b22234" />
      <rect y="4.8" width="20" height="1.2" fill="#b22234" />
      <rect y="7.2" width="20" height="1.2" fill="#b22234" />
      <rect y="9.6" width="20" height="1.2" fill="#b22234" />
      <rect y="12" width="20" height="1.2" fill="#b22234" />
      <rect width="8.6" height="6.8" fill="#3c3b6e" />
      <circle cx="1.4" cy="1.2" r="0.35" fill="#ffffff" />
      <circle cx="3" cy="1.2" r="0.35" fill="#ffffff" />
      <circle cx="4.6" cy="1.2" r="0.35" fill="#ffffff" />
      <circle cx="6.2" cy="1.2" r="0.35" fill="#ffffff" />
      <circle cx="2.2" cy="2.2" r="0.35" fill="#ffffff" />
      <circle cx="3.8" cy="2.2" r="0.35" fill="#ffffff" />
      <circle cx="5.4" cy="2.2" r="0.35" fill="#ffffff" />
      <circle cx="7" cy="2.2" r="0.35" fill="#ffffff" />
      <circle cx="1.4" cy="3.2" r="0.35" fill="#ffffff" />
      <circle cx="3" cy="3.2" r="0.35" fill="#ffffff" />
      <circle cx="4.6" cy="3.2" r="0.35" fill="#ffffff" />
      <circle cx="6.2" cy="3.2" r="0.35" fill="#ffffff" />
      <circle cx="2.2" cy="4.2" r="0.35" fill="#ffffff" />
      <circle cx="3.8" cy="4.2" r="0.35" fill="#ffffff" />
      <circle cx="5.4" cy="4.2" r="0.35" fill="#ffffff" />
      <circle cx="7" cy="4.2" r="0.35" fill="#ffffff" />
      <circle cx="1.4" cy="5.2" r="0.35" fill="#ffffff" />
      <circle cx="3" cy="5.2" r="0.35" fill="#ffffff" />
      <circle cx="4.6" cy="5.2" r="0.35" fill="#ffffff" />
      <circle cx="6.2" cy="5.2" r="0.35" fill="#ffffff" />
    </svg>
  )
}

const LOCALE_ICONS: Record<SupportedLocale, ReactNode> = {
  'es-CL': <IconFlagChile />,
  'en-US': <IconFlagUs />,
}

const LOCALE_COMPACT_LABELS: Record<SupportedLocale, string> = {
  'es-CL': 'ES',
  'en-US': 'EN',
}

export function LocaleSwitcher({
  compact = false,
  containerClassName,
  triggerClassName,
  panelClassName,
  selectedValueClassName,
  optionClassName,
  activeOptionClassName,
  emptyStateClassName,
}: LocaleSwitcherProps) {
  const { t } = useTranslation()
  const { locale, setLocale, supportedLocales } = useLocale()
  const currentLocale = locale as SupportedLocale

  return (
    <SelectDropdown
      value={currentLocale}
      onChange={(nextLocale) => {
        void setLocale(nextLocale)
      }}
      options={supportedLocales.map((option) => {
        const value = option.value as SupportedLocale
        return {
          value,
          label: compact ? LOCALE_COMPACT_LABELS[value] : option.label,
          icon: LOCALE_ICONS[value],
        }
      })}
      label={t('common.language')}
      icon={LOCALE_ICONS[currentLocale]}
      ariaLabel={t('common.language')}
      containerClassName={containerClassName}
      triggerClassName={triggerClassName}
      panelClassName={panelClassName}
      selectedValueClassName={selectedValueClassName}
      optionClassName={optionClassName}
      activeOptionClassName={activeOptionClassName}
      emptyStateClassName={emptyStateClassName}
      hideSelectedOption
    />
  )
}
