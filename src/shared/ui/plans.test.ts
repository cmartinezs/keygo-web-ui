import { afterAll, describe, expect, it } from 'vitest'
import { i18n } from '@/shared/lib/i18n/config'
import type { AppPlan } from '@/shared/types/billing'
import { computePlanInfoForPeriod, planSupportsPeriod } from './plans'

const samplePlan: AppPlan = {
  id: 'plan-business',
  client_app_id: 'client-1',
  code: 'BUSINESS',
  name: 'Plan negocio backend',
  description: 'Descripcion backend sin traducir',
  status: 'ACTIVE',
  is_public: true,
  sort_order: 1,
  entitlements: [
    {
      id: 'ent-1',
      metric_code: 'MAX_TENANTS',
      metric_type: 'QUOTA',
      limit_value: 5,
      period_type: 'NONE',
      enforcement_mode: 'HARD',
      is_enabled: true,
    },
    {
      id: 'ent-2',
      metric_code: 'CUSTOM_DOMAIN',
      metric_type: 'BOOLEAN',
      limit_value: null,
      period_type: 'NONE',
      enforcement_mode: 'HARD',
      is_enabled: true,
    },
  ],
  versions: [
    {
      id: 'ver-1',
      version: '1',
      currency: 'USD',
      setup_fee: 0,
      trial_days: 14,
      effective_from: '2026-01-01T00:00:00Z',
      effective_to: null,
      status: 'ACTIVE',
      free: false,
      billing_options: [
        {
          billing_period: 'MONTHLY',
          base_price: 25,
          discount_pct: 0,
          is_default: true,
        },
        {
          billing_period: 'YEARLY',
          base_price: 240,
          discount_pct: 20,
          is_default: false,
        },
      ],
    },
  ],
}

describe('plan catalog i18n', () => {
  const originalLanguage = i18n.language

  afterAll(async () => {
    await i18n.changeLanguage(originalLanguage)
  })

  it('localizes plan metadata in es-CL', async () => {
    await i18n.changeLanguage('es-CL')

    const plan = computePlanInfoForPeriod(samplePlan, 'YEARLY')

    expect(plan.name).toBe('Business')
    expect(plan.description).toBe(
      'Para organizaciones que necesitan escalar con control, trazabilidad y soporte.',
    )
    expect(plan.badge).toBe('Más popular')
    expect(plan.features).toEqual(['Hasta 5 tenants', 'Dominio personalizado'])
    expect(plan.cta).toBe('Iniciar prueba de 14 días')
    expect(plan.priceNote).toBe('por mes')
    expect(plan.annualSavingsNote).toBe('Pagas US$240/año · ahorras US$60 vs mensual')
  })

  it('switches plan metadata to en-US at runtime', async () => {
    await i18n.changeLanguage('en-US')

    const plan = computePlanInfoForPeriod(samplePlan, 'YEARLY')

    expect(plan.name).toBe('Business')
    expect(plan.description).toBe(
      'For organizations that need to scale with control, traceability, and support.',
    )
    expect(plan.badge).toBe('Most popular')
    expect(plan.features).toEqual(['Up to 5 tenants', 'Custom domain'])
    expect(plan.cta).toBe('Start 14-day trial')
    expect(plan.priceNote).toBe('per month')
    expect(plan.annualSavingsNote).toBe('You pay $240/year · save $60 vs monthly')
  })
})

describe('plan period support', () => {
  it('shows plans with no billing options for any selected period', () => {
    const planWithoutBillingOptions: AppPlan = {
      ...samplePlan,
      id: 'plan-no-options',
      code: 'FLEX',
      versions: [
        {
          ...samplePlan.versions[0],
          id: 'ver-no-options',
          billing_options: [],
        },
      ],
    }

    expect(planSupportsPeriod(planWithoutBillingOptions, 'MONTHLY')).toBe(true)
    expect(planSupportsPeriod(planWithoutBillingOptions, 'YEARLY')).toBe(true)
  })

  it('filters out plans that do not declare the selected period', () => {
    const yearlyOnlyPlan: AppPlan = {
      ...samplePlan,
      id: 'plan-yearly-only',
      code: 'TEAM',
      versions: [
        {
          ...samplePlan.versions[0],
          id: 'ver-yearly-only',
          billing_options: [
            {
              billing_period: 'YEARLY',
              base_price: 240,
              discount_pct: 0,
              is_default: true,
            },
          ],
        },
      ],
    }

    expect(planSupportsPeriod(yearlyOnlyPlan, 'YEARLY')).toBe(true)
    expect(planSupportsPeriod(yearlyOnlyPlan, 'MONTHLY')).toBe(false)
  })
})

describe('plan CTA resolution', () => {
  it('prioritizes trial days over a hardcoded price for personal plans', async () => {
    await i18n.changeLanguage('es-CL')

    const personalPlan: AppPlan = {
      ...samplePlan,
      id: 'plan-personal',
      code: 'PERSONAL',
      versions: [
        {
          ...samplePlan.versions[0],
          id: 'ver-personal',
          trial_days: 14,
          billing_options: [
            {
              billing_period: 'MONTHLY',
              base_price: 19,
              discount_pct: 0,
              is_default: true,
            },
          ],
        },
      ],
    }

    const plan = computePlanInfoForPeriod(personalPlan, 'MONTHLY')

    expect(plan.price).toBe('US$19')
    expect(plan.cta).toBe('Iniciar prueba de 14 días')
  })

  it('uses the real endpoint price when a paid plan has no trial', async () => {
    await i18n.changeLanguage('en-US')

    const personalPlanWithoutTrial: AppPlan = {
      ...samplePlan,
      id: 'plan-personal-no-trial',
      code: 'PERSONAL',
      versions: [
        {
          ...samplePlan.versions[0],
          id: 'ver-personal-no-trial',
          trial_days: 0,
          billing_options: [
            {
              billing_period: 'MONTHLY',
              base_price: 19,
              discount_pct: 0,
              is_default: true,
            },
          ],
        },
      ],
    }

    const plan = computePlanInfoForPeriod(personalPlanWithoutTrial, 'MONTHLY')

    expect(plan.price).toBe('$19')
    expect(plan.cta).toBe('Start at $19/month')
  })
})
