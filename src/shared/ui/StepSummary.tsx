import { ReactNode } from 'react'

export interface SummarySectionItem {
  label: string
  value: ReactNode
  secondary?: ReactNode
}

export interface StepSummaryProps {
  title: string
  currentStepLabel: string
  currentStepText: string
  completedText: string
  isDone: boolean
  sections: SummarySectionItem[]
}

/**
 * Generic summary sidebar component for step-by-step wizards.
 * Reutilizable en /subscribe, /register y otros flujos multi-step.
 *
 * Muestra:
 * - Título personalizado
 * - Paso actual con highlight indigo
 * - Secciones de información customizables
 */
export function StepSummary({
  title,
  currentStepLabel,
  currentStepText,
  completedText,
  isDone,
  sections,
}: StepSummaryProps) {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>

      <div className="space-y-4 text-sm">
        {/* Current step highlight */}
        <div className="rounded-xl bg-indigo-50 border-2 border-indigo-500 shadow-md px-3 py-2">
          <p className="text-xs text-indigo-700 mb-1 font-medium">{currentStepText}</p>
          <p className="font-semibold text-indigo-900">
            {isDone ? completedText : currentStepLabel}
          </p>
        </div>

        {/* Summary sections */}
        {sections.map((section, idx) => (
          <div key={idx}>
            <p className="text-xs text-slate-500 font-medium">{section.label}</p>
            <p className="font-semibold text-slate-800">{section.value}</p>
            {section.secondary && <p className="text-slate-500 text-xs">{section.secondary}</p>}
          </div>
        ))}
      </div>
    </aside>
  )
}
