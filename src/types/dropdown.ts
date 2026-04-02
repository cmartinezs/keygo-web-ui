import type { ReactNode } from 'react'

export type DropdownPanelRole = 'listbox' | 'menu'

export interface DropdownTriggerParams {
  open: boolean
  toggle: () => void
}

export interface DropdownChildrenParams {
  close: () => void
}

export interface DropdownProps {
  ariaLabel: string
  trigger: (params: DropdownTriggerParams) => ReactNode
  panelClassName?: string
  panelRole?: DropdownPanelRole
  children: ReactNode | ((params: DropdownChildrenParams) => ReactNode)
}

export interface DropdownOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

export interface SelectDropdownProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: DropdownOption<T>[]
  label: string
  icon?: ReactNode
  ariaLabel: string
  hideSelectedOption?: boolean
  selectedValueClassName?: string
}
