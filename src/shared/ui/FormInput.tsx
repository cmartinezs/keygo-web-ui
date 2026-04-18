import type { InputHTMLAttributes, ReactNode } from 'react'

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helperText?: ReactNode
}

/** Componente input reutilizable para formularios */
export function FormInput({ label, error, helperText, disabled, ...props }: FormInputProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={props.id} className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <input
        {...props}
        disabled={disabled}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-500 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50 dark:placeholder-slate-400"
      />
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      {helperText && <div className="text-xs text-slate-600 dark:text-slate-400">{helperText}</div>}
    </div>
  )
}
