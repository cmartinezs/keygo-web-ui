import { Link } from 'react-router-dom'
import type { PlanInfo } from './plans'

type DisplayMode = { mode: 'display'; ctaTo: string }
type SelectMode = { mode: 'select'; selected: boolean; onSelect: () => void }

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
  const isSelected = props.mode === 'select' && props.selected
  const highlighted = plan.highlighted && !isSelected
  // Resolved early to avoid TypeScript narrowing issues inside JSX
  const ctaTo = props.mode === 'display' ? props.ctaTo : null

  const cardBaseClasses = `relative rounded-2xl p-8 flex flex-col transition-all ${
    highlighted
      ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30 ring-2 ring-indigo-400 ring-offset-2'
      : isSelected
        ? 'bg-indigo-50 border-2 border-indigo-500 shadow-md'
        : 'bg-white border border-slate-200 hover:border-indigo-200'
  }`

  const inner = (
    <>
      {plan.badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-amber-400 text-amber-900 text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
            {plan.badge}
          </span>
        </div>
      )}

      {isSelected && (
        <span
          className="absolute top-3 right-3 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center"
          aria-hidden="true"
        >
          <CheckIcon className="w-3.5 h-3.5 text-white" />
        </span>
      )}

      <div className="mb-6">
        <h3 className={`font-bold text-xl mb-1 ${highlighted ? 'text-white' : 'text-slate-900'}`}>
          {plan.name}
        </h3>
        <div className={`text-4xl font-extrabold mb-1 ${highlighted ? 'text-white' : 'text-slate-900'}`}>
          {plan.price}
        </div>
        <div className={`text-sm mb-4 ${highlighted ? 'text-indigo-200' : 'text-slate-400'}`}>
          {plan.priceNote}
        </div>
        <p className={`text-sm leading-relaxed ${highlighted ? 'text-indigo-100' : 'text-slate-500'}`}>
          {plan.description}
        </p>
      </div>

      <ul className={`space-y-3 flex-1 ${ctaTo ? 'mb-8' : 'mb-4'}`}>
        {plan.features.map((feat) => (
          <li key={feat} className="flex items-start gap-3 text-sm">
            <CheckIcon
              className={`w-5 h-5 shrink-0 mt-0.5 ${highlighted ? 'text-indigo-200' : 'text-indigo-500'}`}
            />
            <span className={highlighted ? 'text-indigo-50' : 'text-slate-600'}>{feat}</span>
          </li>
        ))}
      </ul>

      {ctaTo && (
        <Link
          to={ctaTo}
          className={`block text-center font-semibold py-3.5 rounded-xl transition-colors focus-visible:ring-2 ${
            highlighted
              ? 'bg-white text-indigo-700 hover:bg-indigo-50 focus-visible:ring-white'
              : 'bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-indigo-400'
          }`}
        >
          {plan.cta}
        </Link>
      )}
    </>
  )

  if (props.mode === 'select') {
    return (
      <button
        type="button"
        onClick={props.onSelect}
        aria-pressed={props.selected}
        className={`${cardBaseClasses} text-left w-full focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2`}
      >
        {inner}
      </button>
    )
  }

  return <article className={cardBaseClasses}>{inner}</article>
}
