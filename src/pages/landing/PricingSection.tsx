import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { PlanCatalogGrid } from '@/components/PlanCatalogGrid'
import { getBillingCatalog, BILLING_QUERY_KEYS } from '@/api/billing'
import { TENANT, CLIENT_ID } from '@/api/client'
import {
  NETWORK_MAX_RETRIES,
  NETWORK_REQUEST_TIMEOUT_MS,
  NETWORK_RETRY_DELAY_MS,
} from '@/config/network'
import { runGetWithRecovery } from '@/lib/network/recovery'

export function PricingSection() {
  const { t } = useTranslation()
  const sectionRef = useRef<HTMLElement | null>(null)
  const [shouldLoadPlans, setShouldLoadPlans] = useState(false)

  useEffect(() => {
    if (shouldLoadPlans) return
    const element = sectionRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting)
        if (isVisible) {
          setShouldLoadPlans(true)
          observer.disconnect()
        }
      },
      {
        root: null,
        rootMargin: '200px 0px',
        threshold: 0.1,
      },
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [shouldLoadPlans])

  async function fetchCatalogWithRecovery(signal: AbortSignal) {
    return runGetWithRecovery({
      signal,
      label: 'planes',
      timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
      retryDelayMs: NETWORK_RETRY_DELAY_MS,
      maxRetries: NETWORK_MAX_RETRIES,
      query: () =>
        getBillingCatalog(TENANT, CLIENT_ID, {
          signal,
          timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        }),
    })
  }

  const { data: rawPlans = [], isLoading, isError, refetch } = useQuery({
    queryKey: BILLING_QUERY_KEYS.catalog(TENANT, CLIENT_ID),
    queryFn: ({ signal }) => fetchCatalogWithRecovery(signal),
    enabled: shouldLoadPlans,
    staleTime: 1000 * 60 * 10,
    retry: false,
  })

  const plans = rawPlans.filter((p) => p.is_public && p.status === 'ACTIVE')

  return (
    <section ref={sectionRef} id="pricing" className="py-24 bg-slate-50 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-indigo-600 text-sm font-semibold uppercase tracking-widest">
            {t('landing.pricing.eyebrow')}
          </span>
          <h2 className="mt-3 text-4xl font-extrabold text-slate-900">
            {t('landing.pricing.title')}
          </h2>
          <p className="mt-4 text-slate-500 text-lg max-w-2xl mx-auto">
            {t('landing.pricing.description')}
          </p>
        </div>

        <PlanCatalogGrid
          mode="display"
          plans={plans}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void refetch()}
          ctaBase="/subscribe"
        />

        <div className="mt-12 text-center">
          <p className="text-slate-500 text-sm">
            {t('landing.pricing.footerPrefix')}{' '}
            <a href="#pricing" className="text-indigo-600 font-medium hover:underline">
              {t('landing.pricing.footerLink')}
            </a>{' '}
            {t('landing.pricing.footerSuffix')}
          </p>
        </div>
      </div>
    </section>
  )
}
