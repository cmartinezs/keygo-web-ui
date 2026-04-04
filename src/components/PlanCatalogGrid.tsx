import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { AppPlan, AppPlanVersion, AppPlanVersionBillingOption, BillingPeriod } from '@/types/billing'
import { PlanCard } from './PlanCard'
import { PlanCardSelect } from './PlanCardSelect'
import { computePlanInfoForPeriod } from './plans'

type DisplayMode = {
  mode: 'display'
  ctaBase?: string
}

type SelectMode = {
  mode: 'select'
  selectedVersionId: string | null
  activePeriod: BillingPeriod
  onPeriodChange: (period: BillingPeriod) => void
  onSelect: (plan: AppPlan, version: AppPlanVersion, billingOption: AppPlanVersionBillingOption | null) => void
}

type PlanCatalogGridProps = {
  plans: AppPlan[]
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
} & (DisplayMode | SelectMode)

function hasMultiplePeriods(plans: AppPlan[]): boolean {
  return plans.some((p) => {
    const opts = p.versions?.[0]?.billing_options ?? []
    return opts.some((o) => o.billing_period === 'MONTHLY') && opts.some((o) => o.billing_period === 'YEARLY')
  })
}

export function PlanCatalogGrid(props: PlanCatalogGridProps) {
  const { t } = useTranslation()
  const { plans, isLoading = false, isError = false, onRetry } = props
  const [displayPeriod, setDisplayPeriod] = useState<BillingPeriod>('MONTHLY')
  const activePeriod = props.mode === 'select' ? props.activePeriod : displayPeriod
  const setActivePeriod = props.mode === 'select' ? props.onPeriodChange : setDisplayPeriod
  const showPeriodToggle = hasMultiplePeriods(plans)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400" role="status" aria-live="polite">
        <svg className="animate-spin w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
        Cargando planes…
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center" role="alert">
        <svg className="w-8 h-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <div>
          <p className="text-slate-600 font-medium">No se pudo cargar el catálogo de planes.</p>
          <p className="text-sm text-slate-400 mt-1">Revisa tu conexión e inténtalo de nuevo.</p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 underline-offset-2 hover:underline transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
          >
            Reintentar
          </button>
        )}
      </div>
    )
  }

  if (plans.length === 0) {
    return <p className="text-center text-slate-500 py-12">No hay planes disponibles en este momento.</p>
  }

  return (
    <div className="flex flex-col gap-6">
      {showPeriodToggle && (
        <div className="flex justify-center">
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setActivePeriod('MONTHLY')}
              className={`text-sm font-medium px-5 py-2 rounded-lg transition-colors ${
                activePeriod === 'MONTHLY'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t('subscribe.period.monthly')}
            </button>
            <button
              type="button"
              onClick={() => setActivePeriod('YEARLY')}
              className={`text-sm font-medium px-5 py-2 rounded-lg transition-colors ${
                activePeriod === 'YEARLY'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t('subscribe.period.yearly')}
            </button>
          </div>
        </div>
      )}

      <PlanCarousel plans={plans} activePeriod={activePeriod} mode={props} />
    </div>
  )
}

// ── Carousel ──────────────────────────────────────────────────────────────────

interface PlanCarouselProps {
  plans: AppPlan[]
  activePeriod: BillingPeriod
  mode: PlanCatalogGridProps
}

function PlanCarousel({ plans, activePeriod, mode }: PlanCarouselProps) {
  const total = plans.length
  const [index, setIndex] = useState(0)
  const [visibleCount, setVisibleCount] = useState(3)
  const isSelectMode = mode.mode === 'select'

  useEffect(() => {
    function update() {
      // In subscribe select mode, keep cards wider to avoid cramped content.
      if (isSelectMode) {
        if (window.innerWidth >= 1536) setVisibleCount(3)
        else if (window.innerWidth >= 1200) setVisibleCount(2)
        else setVisibleCount(1)
        return
      }

      if (window.innerWidth >= 1024) setVisibleCount(3)
      else if (window.innerWidth >= 640) setVisibleCount(2)
      else setVisibleCount(1)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [isSelectMode])

  // Clamp index when visible count or total changes
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIndex((i) => Math.min(i, Math.max(0, total - visibleCount)))
    })
    return () => window.cancelAnimationFrame(frame)
  }, [visibleCount, total])

  // Auto-scroll to the selected plan when it changes (e.g. pre-selected from URL)
  useEffect(() => {
    if (mode.mode !== 'select' || !mode.selectedVersionId) return
    const selectedIdx = plans.findIndex((p) =>
      p.versions?.some((v) => v.id === mode.selectedVersionId)
    )
    if (selectedIdx === -1) return
    const maxIdx = Math.max(0, total - visibleCount)
    const frame = window.requestAnimationFrame(() => {
      setIndex(Math.min(selectedIdx, maxIdx))
    })
    return () => window.cancelAnimationFrame(frame)
  }, [mode.mode === 'select' ? mode.selectedVersionId : null, visibleCount, total]) // eslint-disable-line react-hooks/exhaustive-deps

  const maxIndex = Math.max(0, total - visibleCount)
  const cardPct = 100 / visibleCount
  const prev = () => setIndex((i) => Math.max(0, i - 1))
  const next = () => setIndex((i) => Math.min(maxIndex, i + 1))

  // A card is "visible" if it's within the current window
  const isVisible = (i: number) => i >= index && i < index + visibleCount

  return (
    <div className="flex flex-col gap-4">
      {/* Track — pt-5 for badge above, pb-4 for shadow/border below */}
      {/* min-w-0 + w-full prevent the flex row's min-content (5 × card) from bubbling up */}
      <div className="w-full min-w-0 overflow-hidden pt-5 pb-4">
        <div
          className="flex transition-transform duration-500 ease-in-out items-stretch gap-0"
          style={{ transform: `translateX(-${index * cardPct}%)` }}
          role={mode.mode === 'select' ? 'radiogroup' : undefined}
          aria-label={mode.mode === 'select' ? 'Planes disponibles' : undefined}
        >
          {plans.map((plan, i) => (
            <div
              key={plan.id}
              className="shrink-0 px-2 self-stretch box-border"
              style={{ width: `${cardPct}%` }}
              aria-hidden={!isVisible(i)}
            >
              {mode.mode === 'display' ? (
                <PlanCard
                  plan={computePlanInfoForPeriod(plan, activePeriod)}
                  mode="display"
                  ctaTo={`${mode.ctaBase ?? '/subscribe'}?plan=${plan.code.toLowerCase()}&period=${activePeriod.toLowerCase()}`}
                />
              ) : (
                <PlanCardSelect
                  plan={plan}
                  selectedVersionId={mode.selectedVersionId}
                  activePeriod={activePeriod}
                  onSelect={(p, v, b) => { mode.onSelect(p, v, b) }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Controls — only shown when there's something to navigate */}
      {total > visibleCount && (
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={prev}
            disabled={index === 0}
            aria-label="Plan anterior"
            className="w-9 h-9 rounded-full border border-slate-200 bg-white shadow-sm flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Dots — one per "position" */}
          <div className="flex gap-2" role="tablist" aria-label="Selección de plan">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Posición ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`rounded-full transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none ${
                  i === index
                    ? 'w-6 h-2.5 bg-indigo-600'
                    : 'w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={next}
            disabled={index === maxIndex}
            aria-label="Plan siguiente"
            className="w-9 h-9 rounded-full border border-slate-200 bg-white shadow-sm flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
