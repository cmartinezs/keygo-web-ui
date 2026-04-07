// ── Billing — TypeScript DTOs ─────────────────────────────────────────────
// Source of truth: docs/api-docs.json  +  docs/BILLING_FLOW.md
// ⚠️ Todos los campos del wire format (request y response) usan snake_case.
//    La doc autogenerada puede mostrar camelCase — es un error del generador.

// ── Catalog ─────────────────────────────────────────────────────────────────

export type SubscriberType = 'TENANT' | 'TENANT_USER'
export type BillingPeriod = 'MONTHLY' | 'YEARLY' | 'ONE_TIME'
export type PlanStatus = 'ACTIVE' | 'INACTIVE' | 'DEPRECATED'
export type MetricType = 'QUOTA' | 'BOOLEAN' | 'RATE'
export type PeriodType = 'NONE' | 'DAY' | 'MONTH'
export type EnforcementMode = 'HARD' | 'SOFT'

export interface AppPlanEntitlement {
  id: string
  metric_code: string
  metric_type: MetricType
  limit_value: number | null
  period_type: PeriodType
  enforcement_mode: EnforcementMode
  is_enabled: boolean
}

export interface AppPlanVersionBillingOption {
  billing_period: BillingPeriod
  base_price: number
  discount_pct: number
  is_default: boolean
}

export interface AppPlanVersion {
  id: string
  version: string
  currency: string
  setup_fee: number
  trial_days: number
  effective_from: string
  effective_to: string | null
  status: PlanStatus
  free: boolean
  billing_options: AppPlanVersionBillingOption[]
}

export interface AppPlan {
  id: string
  client_app_id: string
  code: string
  name: string
  description: string | null
  status: PlanStatus
  is_public: boolean
  sort_order: number
  versions: AppPlanVersion[]
  entitlements: AppPlanEntitlement[]
}

// ── Contracts ────────────────────────────────────────────────────────────────

export type ContractStatus =
  | 'PENDING_EMAIL_VERIFICATION'
  | 'PENDING_PAYMENT'
  | 'READY_TO_ACTIVATE'
  | 'ACTIVE'
  | 'SUPERSEDED'
  | 'FINALIZED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'FAILED'

export interface AppContract {
  id: string
  client_app_id: string
  contractor_id: string | null
  selected_plan_version_id: string
  billing_period: BillingPeriod
  status: ContractStatus
  contractor_email: string
  contractor_first_name: string
  contractor_last_name: string
  company_name: string | null
  email_verified: boolean
  payment_verified: boolean
  expires_at: string
  created_at: string
}

export interface CreateContractRequest {
  client_app_id: string
  plan_version_id: string
  billing_period?: BillingPeriod
  contractor_email: string
  contractor_first_name: string
  contractor_last_name: string
  company_name?: string
  company_tax_id?: string
  company_address?: string
}

// ── Plan management (ADMIN_TENANT) ───────────────────────────────────────────

export interface BillingOptionRequest {
  billing_period: BillingPeriod
  base_price: number
  discount_pct?: number
  is_default?: boolean
}

export interface EntitlementRequest {
  metric_code: string
  metric_type: MetricType
  limit_value?: number
  period_type?: PeriodType
  enforcement_mode?: EnforcementMode
  is_enabled: boolean
}

export interface CreateAppPlanRequest {
  code: string
  name: string
  description?: string
  is_public?: boolean
  sort_order?: number
  version?: string
  currency: string
  trial_days?: number
  effective_from?: string
  billing_options: BillingOptionRequest[]
  entitlements?: EntitlementRequest[]
}

export interface VerifyContractEmailRequest {
  code: string
}

/**
 * Respuesta de GET /billing/contracts/{contractId}/resume
 * Extiende AppContract con campos de orientación al wizard del frontend:
 * `next_action` indica el paso en que debe posicionarse la UI al restaurar.
 * `verification_code_expired` permite ofrecer reenvío inmediato.
 */
export interface AppContractResumeData
  extends Omit<AppContract, 'client_app_id' | 'selected_plan_version_id' | 'billing_period'> {
  client_app_id: string
  selected_plan_version_id: string
  billing_period: BillingPeriod
  verification_code_expired: boolean
  /** Acción sugerida: 'VERIFY_EMAIL' | 'PAYMENT' | 'ACTIVATE' | 'RESUME' */
  next_action: string
}

// ── Subscription ─────────────────────────────────────────────────────────────

export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'SUSPENDED'

export interface AppSubscription {
  id: string
  client_app_id: string
  app_plan_version_id: string
  subscriber_type: SubscriberType
  subscriber_tenant_id: string | null
  subscriber_tenant_user_id: string | null
  status: SubscriptionStatus
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  next_billing_at: string | null
  auto_renew: boolean
  created_at: string
}

// ── Invoices ─────────────────────────────────────────────────────────────────

export type InvoiceStatus = 'ISSUED' | 'PAID' | 'VOID' | 'OVERDUE'

export interface AppInvoice {
  id: string
  subscription_id: string
  invoice_number: string
  status: InvoiceStatus
  issue_date: string
  due_date: string
  period_start: string
  period_end: string
  currency: string
  subtotal: number
  tax_amount: number
  total: number
  billing_name_snapshot: string
  plan_version_snapshot: string
  pdf_url: string | null
  created_at: string
}

