// ── Billing — TypeScript DTOs ─────────────────────────────────────────────
// Source of truth: docs/api-docs.json  +  docs/BILLING_FLOW.md

// ── Catalog ─────────────────────────────────────────────────────────────────

export type SubscriberType = 'TENANT' | 'TENANT_USER'
export type BillingPeriod = 'MONTHLY' | 'ANNUAL' | 'ONE_TIME'
export type PlanStatus = 'ACTIVE' | 'INACTIVE' | 'DEPRECATED'
export type MetricType = 'QUOTA' | 'BOOLEAN' | 'UNLIMITED'
export type PeriodType = 'NONE' | 'DAILY' | 'MONTHLY'
export type EnforcementMode = 'HARD' | 'SOFT'

export interface AppPlanEntitlement {
  id: string
  metricCode: string
  metricType: MetricType
  limitValue: number | null
  periodType: PeriodType
  enforcementMode: EnforcementMode
  isEnabled: boolean
}

export interface AppPlanVersion {
  id: string
  version: string
  currency: string
  billingPeriod: BillingPeriod
  basePrice: number
  setupFee: number
  trialDays: number
  effectiveFrom: string
  effectiveTo: string | null
  status: PlanStatus
}

export interface AppPlan {
  id: string
  clientAppId: string
  code: string
  name: string
  description: string | null
  subscriberType: SubscriberType
  status: PlanStatus
  isPublic: boolean
  versions: AppPlanVersion[]
  entitlements: AppPlanEntitlement[]
}

// ── Contracts ────────────────────────────────────────────────────────────────

export type ContractStatus =
  | 'PENDING_EMAIL_VERIFICATION'
  | 'PENDING_PAYMENT'
  | 'READY_TO_ACTIVATE'
  | 'ACTIVATED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'FAILED'

export interface AppContract {
  id: string
  clientAppId: string
  selectedPlanVersionId: string
  billingPeriod: BillingPeriod
  subscriberType: SubscriberType
  status: ContractStatus
  contractorEmail: string
  contractorFirstName: string
  contractorLastName: string
  companyName: string | null
  companySlug: string | null
  emailVerified: boolean
  paymentVerified: boolean
  expiresAt: string
  createdAt: string
}

export interface CreateContractRequest {
  planVersionId: string
  billingPeriod: BillingPeriod
  subscriberType: SubscriberType
  contractorEmail: string
  contractorFirstName: string
  contractorLastName: string
  companyName?: string
  companySlug?: string
  companyTaxId?: string
  companyAddress?: string
}

export interface VerifyContractEmailRequest {
  code: string
}

// ── Subscription ─────────────────────────────────────────────────────────────

export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'SUSPENDED'

export interface AppSubscription {
  id: string
  clientAppId: string
  appPlanVersionId: string
  subscriberType: SubscriberType
  subscriberTenantId: string | null
  subscriberTenantUserId: string | null
  status: SubscriptionStatus
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  nextBillingAt: string | null
  autoRenew: boolean
  createdAt: string
}

// ── Invoices ─────────────────────────────────────────────────────────────────

export type InvoiceStatus = 'ISSUED' | 'PAID' | 'VOID' | 'OVERDUE'

export interface AppInvoice {
  id: string
  subscriptionId: string
  invoiceNumber: string
  status: InvoiceStatus
  issueDate: string
  dueDate: string
  periodStart: string
  periodEnd: string
  currency: string
  subtotal: number
  taxAmount: number
  total: number
  billingNameSnapshot: string
  planVersionSnapshot: string
  pdfUrl: string | null
  createdAt: string
}
