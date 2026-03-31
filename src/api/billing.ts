// ── Billing API ────────────────────────────────────────────────────────────
// Contract endpoints: /api/v1/billing/contracts/*
// Catalog/Subscription/Invoice endpoints: /api/v1/tenants/{tenantSlug}/apps/{clientId}/billing/*
// Auth: public (catalog + contracts); Bearer required (subscription, invoices)
// Docs: docs/BILLING_FLOW.md  |  docs/api-docs.json §Billing

import { apiClient, appUrl, API_V1, TENANT, CLIENT_ID } from './client'
import type { BaseResponse } from '@/types/base'
import type {
  AppPlan,
  AppContract,
  AppSubscription,
  AppInvoice,
  CreateContractRequest,
  VerifyContractEmailRequest,
  CreateAppPlanRequest,
} from '@/types/billing'

// ── Query keys ────────────────────────────────────────────────────────────────
export const BILLING_QUERY_KEYS = {
  catalog: (tenantSlug: string, clientId: string) =>
    ['billing', 'catalog', tenantSlug, clientId] as const,
  plan: (tenantSlug: string, clientId: string, planCode: string) =>
    ['billing', 'catalog', tenantSlug, clientId, planCode] as const,
  contract: (contractId: string) =>
    ['billing', 'contract', contractId] as const,
  subscription: (tenantSlug: string, clientId: string) =>
    ['billing', 'subscription', tenantSlug, clientId] as const,
  invoices: (tenantSlug: string, clientId: string) =>
    ['billing', 'invoices', tenantSlug, clientId] as const,
} as const

// ── Helpers ───────────────────────────────────────────────────────────────────
const billingBase = (tenantSlug: string, clientId: string) =>
  `${appUrl(tenantSlug, clientId)}/billing`
const contractsBase = `${API_V1}/billing/contracts`

// ── Catalog ───────────────────────────────────────────────────────────────────

/** GET /billing/catalog — returns all public plans for the app. Public endpoint. */
export async function getBillingCatalog(
  tenantSlug: string = TENANT,
  clientId: string = CLIENT_ID,
): Promise<AppPlan[]> {
  const res = await apiClient.get<BaseResponse<AppPlan[]>>(
    `${billingBase(tenantSlug, clientId)}/catalog`,
  )
  return res.data.data ?? []
}

/** GET /billing/catalog/{planCode} — returns a single public plan by code. Public endpoint. */
export async function getBillingCatalogPlan(
  planCode: string,
  tenantSlug: string = TENANT,
  clientId: string = CLIENT_ID,
): Promise<AppPlan> {
  const res = await apiClient.get<BaseResponse<AppPlan>>(
    `${billingBase(tenantSlug, clientId)}/catalog/${planCode}`,
  )
  return res.data.data!
}

// ── Contracts ─────────────────────────────────────────────────────────────────

/**
 * POST /billing/contracts — initiates a subscription contract.
 * Creates the contract in PENDING_EMAIL_VERIFICATION state and sends a
 * 6-digit code to `contractorEmail`.  Public endpoint.
 */
export async function createBillingContract(
  request: CreateContractRequest,
): Promise<AppContract> {
  const res = await apiClient.post<BaseResponse<AppContract>>(
    contractsBase,
    request,
  )
  return res.data.data!
}

/**
 * POST /billing/contracts/{contractId}/verify-email — validates the 6-digit code.
 * Advances contract to PENDING_PAYMENT.  Public endpoint.
 */
export async function verifyContractEmail(
  contractId: string,
  request: VerifyContractEmailRequest,
): Promise<AppContract> {
  const res = await apiClient.post<BaseResponse<AppContract>>(
    `${contractsBase}/${contractId}/verify-email`,
    request,
  )
  return res.data.data!
}

/**
 * POST /billing/contracts/{contractId}/mock-approve-payment — DEV mock only.
 * Advances contract to READY_TO_ACTIVATE.  Public endpoint (requires backend flag).
 */
export async function mockApprovePayment(
  contractId: string,
): Promise<AppContract> {
  const res = await apiClient.post<BaseResponse<AppContract>>(
    `${contractsBase}/${contractId}/mock-approve-payment`,
  )
  return res.data.data!
}

/**
 * POST /billing/contracts/{contractId}/activate — activates the contract.
 * Creates the user + subscription + first invoice.  Public endpoint.
 * Contract must be in READY_TO_ACTIVATE status.
 */
export async function activateBillingContract(
  contractId: string,
): Promise<AppContract> {
  const res = await apiClient.post<BaseResponse<AppContract>>(
    `${contractsBase}/${contractId}/activate`,
  )
  return res.data.data!
}

/**
 * GET /billing/contracts/{contractId} — retrieves the current contract state.
 * Public endpoint.
 */
export async function getBillingContract(
  contractId: string,
): Promise<AppContract> {
  const res = await apiClient.get<BaseResponse<AppContract>>(
    `${contractsBase}/${contractId}`,
  )
  return res.data.data!
}

/**
 * POST /billing/contracts/{contractId}/resend-verification-email — resends the 6-digit
 * verification code to the contractor's email.  Public endpoint.
 * ⏳ Pending backend implementation.
 */
export async function resendContractVerificationEmail(contractId: string): Promise<void> {
  await apiClient.post(`${contractsBase}/${contractId}/resend-verification`)
}

// ── Subscription (authenticated) ──────────────────────────────────────────────

/**
 * GET /billing/subscription — active subscription for the subscriber tenant.
 * Requires Bearer ADMIN or ADMIN_TENANT.
 * Note: tenantSlug = subscriber, clientId = provider app's client_id (global lookup).
 */
export async function getActiveSubscription(
  tenantSlug: string,
  clientId: string,
): Promise<AppSubscription> {
  const res = await apiClient.get<BaseResponse<AppSubscription>>(
    `${billingBase(tenantSlug, clientId)}/subscription`,
  )
  return res.data.data!
}

/**
 * POST /billing/subscription/cancel — schedules cancellation at period end.
 * Requires Bearer ADMIN or ADMIN_TENANT.
 */
export async function cancelSubscription(
  tenantSlug: string,
  clientId: string,
): Promise<AppSubscription> {
  const res = await apiClient.post<BaseResponse<AppSubscription>>(
    `${billingBase(tenantSlug, clientId)}/subscription/cancel`,
  )
  return res.data.data!
}

/**
 * GET /billing/invoices — all invoices for the subscriber's subscription.
 * Requires Bearer ADMIN or ADMIN_TENANT.
 */
export async function listInvoices(
  tenantSlug: string,
  clientId: string,
): Promise<AppInvoice[]> {
  const res = await apiClient.get<BaseResponse<AppInvoice[]>>(
    `${billingBase(tenantSlug, clientId)}/invoices`,
  )
  return res.data.data ?? []
}

// ── Plans management (ADMIN_TENANT) ───────────────────────────────────────────

/**
 * POST /billing/plans — creates a new billing plan with its initial version and entitlements.
 * Requires Bearer ADMIN_TENANT.
 */
export async function createBillingPlan(
  request: CreateAppPlanRequest,
  tenantSlug: string,
  clientId: string,
): Promise<AppPlan> {
  const res = await apiClient.post<BaseResponse<AppPlan>>(
    `${billingBase(tenantSlug, clientId)}/plans`,
    request,
  )
  return res.data.data!
}
