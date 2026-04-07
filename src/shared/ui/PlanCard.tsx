import { Link } from 'react-router-dom'
import type { PlanInfo } from './plans'

type DisplayMode = { mode: 'display'; ctaTo: string }
type SelectMode = { mode: 'select'; selected: boolean; onSelect: () => void; disabled?: boolean }

type PlanCardProps = { plan: PlanInfo } & (DisplayMode | SelectMode)

function CheckIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

export function PlanCard(props: PlanCardProps) {
  const { plan } = props
  const isSelectMode = props.mode === 'select'
  const isSelected = props.mode === 'select' && props.selected
  const isDisabled = props.mode === 'select' && !!props.disabled
  const highlighted = plan.highlighted && !isSelected && !isDisabled
  const ctaTo = props.mode === 'display' ? props.ctaTo : null

  const cardBaseClasses = `group relative rounded-2xl ${isSelectMode ? 'p-6' : 'p-8'} flex flex-col h-full overflow-hidden transition-all ${
    isDisabled
      ? 'bg-slate-50 border border-slate-200 opacity-60 cursor-not-allowed'
      : highlighted
        ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30 ring-2 ring-indigo-400 ring-offset-2'
        : isSelected
          ? 'bg-indigo-50 border-2 border-indigo-500 shadow-md'
          : 'bg-white border border-slate-200 hover:border-indigo-200'
  }`

  const inner = (
    <>
      {isSelected && (
        <span
          className="absolute top-3 right-3 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center z-10"
          aria-hidden="true"
        >
          <CheckIcon className="w-3.5 h-3.5 text-white" />
        </span>
      )}

      {/* Static content — always visible */}
      <div className="flex-1">
        <h3 className={`font-bold ${isSelectMode ? 'text-lg' : 'text-xl'} mb-1 ${highlighted ? 'text-white' : 'text-slate-900'}`}>
          {plan.name}
        </h3>
        <div className={`${isSelectMode ? 'text-3xl' : 'text-4xl'} font-extrabold mb-1 ${highlighted ? 'text-white' : 'text-slate-900'}`}>
          {plan.price}
        </div>
        <div className={`text-sm mb-1 ${highlighted ? 'text-indigo-200' : 'text-slate-400'}`}>
          {plan.priceNote}
        </div>
        {plan.annualSavingsNote && (
          <div className={`text-xs font-medium mb-4 px-2 py-1 rounded-md w-fit ${
            highlighted ? 'bg-white/20 text-white ring-1 ring-white/40' : 'bg-emerald-50 text-emerald-700'
          }`}>
            {plan.annualSavingsNote}
          </div>
        )}
        {!plan.annualSavingsNote && <div className="mb-4" />}
        <p className={`text-sm leading-relaxed ${highlighted ? 'text-indigo-100' : 'text-slate-500'}`}>
          {plan.description}
        </p>
      </div>

      {/* Features overlay — slides in on hover, clipped by card's overflow-hidden */}
      {plan.features.length > 0 && (
        <div
          aria-hidden="true"
          className={`absolute inset-0 flex flex-col justify-end p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out ${
            highlighted
              ? 'bg-indigo-700/95 backdrop-blur-sm'
              : 'bg-white/95 backdrop-blur-sm border border-slate-200'
          }`}
        >
          <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${highlighted ? 'text-indigo-200' : 'text-slate-400'}`}>
            Incluye
          </p>
          <ul className="space-y-2 overflow-y-auto max-h-64">
            {plan.features.map((feat) => (
              <li key={feat} className="flex items-start gap-2.5 text-sm">
                <CheckIcon
                  className={`w-4 h-4 shrink-0 mt-0.5 ${highlighted ? 'text-indigo-300' : 'text-indigo-500'}`}
                />
                <span className={highlighted ? 'text-indigo-50' : 'text-slate-700'}>{feat}</span>
              </li>
            ))}
          </ul>
          {ctaTo && (
            <Link
              to={ctaTo}
              className={`mt-4 block text-center font-semibold py-3 rounded-xl transition-colors text-sm ${
                highlighted
                  ? 'bg-white text-indigo-700 hover:bg-indigo-50'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500'
              }`}
            >
              {plan.cta}
            </Link>
          )}
        </div>
      )}
    </>
  )

  // Badge lives outside the card so it's not clipped by overflow-hidden
  const badge = plan.badge && (
    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
      <span className="bg-amber-400 text-amber-900 text-xs font-bold px-4 py-1.5 rounded-full shadow-md whitespace-nowrap">
        {plan.badge}
      </span>
    </div>
  )

  if (props.mode === 'select') {
    return (
      <div className="relative h-full">
        {badge}
        <button
          type="button"
          onClick={isDisabled ? undefined : props.onSelect}
          disabled={isDisabled}
          aria-pressed={props.selected}
          aria-disabled={isDisabled}
          className={`${cardBaseClasses} text-left w-full focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2`}
        >
          {inner}
          {isDisabled && (
            <span className="absolute bottom-4 left-0 right-0 text-center text-xs text-slate-400 font-medium">
              Próximamente
            </span>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      {badge}
      <article className={cardBaseClasses}>{inner}</article>
    </div>
  )
}
