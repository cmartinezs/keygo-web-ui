#!/usr/bin/env node
/**
 * migrate-to-features.mjs
 *
 * Migrates the KeyGo Web UI codebase from a type-first layout (pages/, api/, hooks/, etc.)
 * to a feature-first layout (features/, shared/, app/).
 *
 * Usage:  node scripts/migrate-to-features.mjs
 *
 * What it does:
 *   1. Creates the target directory tree under src/
 *   2. Moves every source file to its new location (git mv)
 *   3. Rewrites all `@/old/path` imports in .ts/.tsx files to `@/new/path`
 *
 * Rollback:  git checkout -- src/
 */

import { execSync } from 'node:child_process'
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'

const ROOT = process.cwd()
const SRC  = join(ROOT, 'src')

// ─── Helpers ─────────────────────────────────────────────────────────────────

function gitMv(from, to) {
  const dir = dirname(to)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  try {
    execSync(`git mv "${from}" "${to}"`, { cwd: ROOT, stdio: 'pipe' })
  } catch {
    // Fallback for edge cases: regular move + git add
    execSync(`mv "${from}" "${to}"`, { cwd: ROOT, stdio: 'pipe' })
    execSync(`git add "${to}"`, { cwd: ROOT, stdio: 'pipe' })
  }
}

function allFiles(dir, ext = ['.ts', '.tsx']) {
  const results = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...allFiles(full, ext))
    } else if (ext.some(e => entry.name.endsWith(e))) {
      results.push(full)
    }
  }
  return results
}

// ─── File Move Mapping ───────────────────────────────────────────────────────
// Key: old path relative to src/   Value: new path relative to src/

const FILE_MOVES = new Map()

// ── app/guards/ ──
FILE_MOVES.set('auth/roleGuard.tsx', 'app/guards/roleGuard.tsx')

// ── app/layouts/ ──
FILE_MOVES.set('layouts/AdminLayout.tsx', 'app/layouts/AdminLayout.tsx')
FILE_MOVES.set('components/dashboard/SidebarMenu.tsx', 'app/layouts/SidebarMenu.tsx')

// ── shared/lib/auth/ ──
for (const f of ['blockingErrorStore.ts', 'jwksVerify.ts', 'jwksVerify.test.ts', 'pkce.ts', 'refresh.ts', 'tokenStore.ts', 'tokenStore.test.ts']) {
  FILE_MOVES.set(`auth/${f}`, `shared/lib/auth/${f}`)
}

// ── shared/lib/config/ ──
FILE_MOVES.set('config/env.ts', 'shared/lib/config/env.ts')
FILE_MOVES.set('config/network.ts', 'shared/lib/config/network.ts')

// ── shared/lib/ (other) ──
FILE_MOVES.set('lib/traceId.ts', 'shared/lib/traceId.ts')
FILE_MOVES.set('lib/featureStatus.ts', 'shared/lib/featureStatus.ts')
FILE_MOVES.set('lib/network/recovery.ts', 'shared/lib/network/recovery.ts')
FILE_MOVES.set('lib/devConsole/commands.ts', 'shared/lib/devConsole/commands.ts')
FILE_MOVES.set('lib/devConsole/httpRunner.ts', 'shared/lib/devConsole/httpRunner.ts')
FILE_MOVES.set('lib/devConsole/store.ts', 'shared/lib/devConsole/store.ts')

// ── shared/lib/i18n/ ──
for (const f of ['config.ts', 'constants.ts', 'localeUtils.ts', 'localeUtils.test.ts', 'useLocale.ts', 'adminDashboardI18n.test.ts', 'userDashboardI18n.test.ts']) {
  FILE_MOVES.set(`i18n/${f}`, `shared/lib/i18n/${f}`)
}
FILE_MOVES.set('i18n/locales/en-US.json', 'shared/lib/i18n/locales/en-US.json')
FILE_MOVES.set('i18n/locales/es-CL.json', 'shared/lib/i18n/locales/es-CL.json')

// ── shared/hooks/ ──
for (const f of ['useCurrentUser.ts', 'useDropdown.ts', 'useHasRole.ts', 'useHoneypot.ts', 'useRateLimit.ts', 'useTheme.ts', 'useTurnstile.ts']) {
  FILE_MOVES.set(`hooks/${f}`, `shared/hooks/${f}`)
}

// ── shared/types/ ──
for (const f of ['auth.ts', 'base.ts', 'billing.ts', 'clientapp.ts', 'dashboard.ts', 'dropdown.ts', 'membership.ts', 'pendingFeature.ts', 'platform.ts', 'roles.ts', 'tenant.ts', 'user.ts']) {
  FILE_MOVES.set(`types/${f}`, `shared/types/${f}`)
}

// ── shared/mocks/ ──
for (const f of ['browser.ts', 'handlers.ts', 'server.ts']) {
  FILE_MOVES.set(`mocks/${f}`, `shared/mocks/${f}`)
}

// ── shared/api/ (infrastructure) ──
for (const f of ['client.ts', 'errorNormalizer.ts', 'errorNormalizer.test.ts', 'response.ts', 'response.test.ts', 'requestOptions.ts', 'pendingFeatures.ts']) {
  FILE_MOVES.set(`api/${f}`, `shared/api/${f}`)
}

// ── shared/ui/ (components) ──
const SHARED_UI_COMPONENTS = [
  'AppErrorBoundary.tsx', 'AppFooter.tsx', 'BlockingErrorModal.tsx',
  'Dropdown.tsx', 'GlobalLoaderOverlay.tsx', 'HoneypotField.tsx',
  'LocaleSwitcher.tsx', 'PendingFeatureBadge.tsx', 'PlanCard.tsx',
  'PlanCardSelect.tsx', 'PlanCatalogGrid.tsx', 'PolicyModal.tsx',
  'PrivacyPolicyContent.tsx', 'ScrollToTop.tsx', 'SelectDropdown.tsx',
  'TermsOfServiceContent.tsx', 'TurnstileWidget.tsx', 'plans.ts',
]
for (const f of SHARED_UI_COMPONENTS) {
  FILE_MOVES.set(`components/${f}`, `shared/ui/${f}`)
}
FILE_MOVES.set('components/icons/definitions.tsx', 'shared/ui/icons/definitions.tsx')
FILE_MOVES.set('components/icons/index.ts', 'shared/ui/icons/index.ts')
FILE_MOVES.set('components/DevConsole/DevConsole.tsx', 'shared/ui/DevConsole/DevConsole.tsx')
FILE_MOVES.set('components/DevConsole/index.ts', 'shared/ui/DevConsole/index.ts')

// ── Domain API → features ──
FILE_MOVES.set('api/auth.ts', 'features/auth/api.ts')
FILE_MOVES.set('api/account.ts', 'features/account/api.ts')
FILE_MOVES.set('api/account.test.ts', 'features/account/api.test.ts')
FILE_MOVES.set('api/billing.ts', 'features/console/billing/api.ts')
FILE_MOVES.set('api/contracts.ts', 'features/auth/register/contractsApi.ts')
FILE_MOVES.set('api/registration.ts', 'features/auth/register/registrationApi.ts')
FILE_MOVES.set('api/tenants.ts', 'features/ops/tenants/api.ts')
FILE_MOVES.set('api/users.ts', 'features/console/users/api.ts')
FILE_MOVES.set('api/clientApps.ts', 'features/console/apps/api.ts')
FILE_MOVES.set('api/memberships.ts', 'features/console/memberships/api.ts')
FILE_MOVES.set('api/dashboard.ts', 'features/console/dashboard/api.ts')
FILE_MOVES.set('api/serviceInfo.ts', 'features/ops/serviceInfoApi.ts')
FILE_MOVES.set('api/platformBilling.ts', 'features/ops/billing/api.ts')
FILE_MOVES.set('api/platformStats.ts', 'features/ops/stats/api.ts')
FILE_MOVES.set('api/platformUsers.ts', 'features/ops/platform-users/api.ts')

// ── features/public/ ──
for (const f of ['CTASection.tsx', 'DevelopersSection.tsx', 'FeaturesSection.tsx', 'HeroSection.tsx', 'HowItWorksSection.tsx', 'LandingNav.tsx', 'LandingPage.tsx', 'PricingSection.tsx', 'RolesSection.tsx']) {
  FILE_MOVES.set(`pages/landing/${f}`, `features/public/landing/${f}`)
}
FILE_MOVES.set('pages/developers/DeveloperDocsPage.tsx', 'features/public/docs/DeveloperDocsPage.tsx')

// ── features/auth/ ──
for (const f of ['LoginPage.tsx', 'LogoutPage.tsx', 'ForgotPasswordPage.tsx', 'RecoverPasswordPage.tsx', 'ResetPasswordPage.tsx']) {
  FILE_MOVES.set(`pages/login/${f}`, `features/auth/login/${f}`)
}
for (const f of ['NewContractPage.tsx', 'ResumeContractPage.tsx', 'UserRegisterPage.tsx']) {
  FILE_MOVES.set(`pages/register/${f}`, `features/auth/register/${f}`)
}
for (const f of ['ContractorStep.tsx', 'EmailVerificationStep.tsx', 'PaymentStep.tsx', 'PlanStep.tsx', 'SuccessStep.tsx', 'TermsStep.tsx']) {
  FILE_MOVES.set(`pages/register/steps/${f}`, `features/auth/register/steps/${f}`)
}

// ── features/account/ ──
FILE_MOVES.set('pages/dashboard/account/AccountPanelPrimitives.tsx', 'features/account/ui/AccountPanelPrimitives.tsx')
FILE_MOVES.set('pages/dashboard/account/AccountSessionsPage.tsx', 'features/account/sessions/AccountSessionsPage.tsx')
FILE_MOVES.set('pages/dashboard/account/AccountSettingsPage.tsx', 'features/account/settings/AccountSettingsPage.tsx')
FILE_MOVES.set('pages/dashboard/account/ChangePasswordForm.tsx', 'features/account/security/ChangePasswordForm.tsx')
FILE_MOVES.set('pages/dashboard/account/ConnectionsPanel.tsx', 'features/account/connections/ConnectionsPanel.tsx')
FILE_MOVES.set('pages/dashboard/account/NotificationsPreferencesForm.tsx', 'features/account/notifications/NotificationsPreferencesForm.tsx')
FILE_MOVES.set('pages/dashboard/account/SessionsList.tsx', 'features/account/sessions/SessionsList.tsx')
FILE_MOVES.set('pages/dashboard/user/UserProfilePage.tsx', 'features/account/profile/UserProfilePage.tsx')
FILE_MOVES.set('pages/dashboard/user/UserMyAccessPage.tsx', 'features/account/access/UserMyAccessPage.tsx')
FILE_MOVES.set('pages/dashboard/user/UserActivityPage.tsx', 'features/account/activity/UserActivityPage.tsx')
FILE_MOVES.set('pages/dashboard/user/UserSessionsPage.tsx', 'features/account/sessions/UserSessionsPage.tsx')

// ── features/console/ ──
FILE_MOVES.set('pages/dashboard/DashboardHomePage.tsx', 'features/console/dashboard/DashboardHomePage.tsx')
FILE_MOVES.set('pages/dashboard/FaqCenterPage.tsx', 'features/console/dashboard/FaqCenterPage.tsx')
FILE_MOVES.set('pages/dashboard/FeaturePlaceholderPage.tsx', 'features/console/dashboard/FeaturePlaceholderPage.tsx')
FILE_MOVES.set('pages/dashboard/tenant/TenantAppsPage.tsx', 'features/console/apps/TenantAppsPage.tsx')
FILE_MOVES.set('pages/dashboard/tenant/TenantMembershipsPage.tsx', 'features/console/memberships/TenantMembershipsPage.tsx')
FILE_MOVES.set('pages/dashboard/tenant/TenantUsersPage.tsx', 'features/console/users/TenantUsersPage.tsx')

// ── features/ops/ ──
FILE_MOVES.set('pages/admin/DashboardPage.tsx', 'features/ops/dashboard/DashboardPage.tsx')
FILE_MOVES.set('pages/admin/PlatformStatsPage.tsx', 'features/ops/stats/PlatformStatsPage.tsx')
FILE_MOVES.set('pages/admin/TenantsPage.tsx', 'features/ops/tenants/TenantsPage.tsx')
FILE_MOVES.set('pages/admin/TenantCreatePage.tsx', 'features/ops/tenants/TenantCreatePage.tsx')
FILE_MOVES.set('pages/admin/TenantDetailPage.tsx', 'features/ops/tenants/TenantDetailPage.tsx')
for (const f of ['DashboardPrimitives.tsx', 'IamCoreRow.tsx', 'OnboardingHealthRow.tsx', 'PendingAndActivityRow.tsx', 'RankingsRow.tsx', 'SecurityRow.tsx', 'ServiceStatusRow.tsx']) {
  FILE_MOVES.set(`pages/admin/dashboard/${f}`, `features/ops/dashboard/components/${f}`)
}

// ── Misc ──
FILE_MOVES.set('pages/home/Home.tsx', 'features/auth/login/Home.tsx')

// ─── Import Rewrite Rules ────────────────────────────────────────────────────
// Ordered from most specific to least specific to prevent partial matches.
// Format: [oldImportPath, newImportPath]
// These are EXACT prefix matches against the path after `@/`.

const IMPORT_REWRITES = [
  // Domain API modules (exact match — must come before generic @/api/)
  ['@/api/auth', '@/features/auth/api'],
  ['@/api/account.test', '@/features/account/api.test'],
  ['@/api/account', '@/features/account/api'],
  ['@/api/billing', '@/features/console/billing/api'],
  ['@/api/contracts', '@/features/auth/register/contractsApi'],
  ['@/api/registration', '@/features/auth/register/registrationApi'],
  ['@/api/tenants', '@/features/ops/tenants/api'],
  ['@/api/users', '@/features/console/users/api'],
  ['@/api/clientApps', '@/features/console/apps/api'],
  ['@/api/memberships', '@/features/console/memberships/api'],
  ['@/api/dashboard', '@/features/console/dashboard/api'],
  ['@/api/serviceInfo', '@/features/ops/serviceInfoApi'],
  ['@/api/platformBilling', '@/features/ops/billing/api'],
  ['@/api/platformStats', '@/features/ops/stats/api'],
  ['@/api/platformUsers', '@/features/ops/platform-users/api'],

  // Infrastructure API
  ['@/api/', '@/shared/api/'],

  // Auth infrastructure (roleGuard → app/guards, rest → shared/lib/auth)
  ['@/auth/roleGuard', '@/app/guards/roleGuard'],
  ['@/auth/', '@/shared/lib/auth/'],

  // Components with specific destinations
  ['@/components/dashboard/SidebarMenu', '@/app/layouts/SidebarMenu'],
  ['@/components/icons', '@/shared/ui/icons'],
  ['@/components/DevConsole', '@/shared/ui/DevConsole'],
  ['@/components/', '@/shared/ui/'],

  // Pages → Features (specific before generic)
  // Admin pages
  ['@/pages/admin/dashboard/', '@/features/ops/dashboard/components/'],
  ['@/pages/admin/PlatformStatsPage', '@/features/ops/stats/PlatformStatsPage'],
  ['@/pages/admin/DashboardPage', '@/features/ops/dashboard/DashboardPage'],
  ['@/pages/admin/TenantsPage', '@/features/ops/tenants/TenantsPage'],
  ['@/pages/admin/TenantCreatePage', '@/features/ops/tenants/TenantCreatePage'],
  ['@/pages/admin/TenantDetailPage', '@/features/ops/tenants/TenantDetailPage'],

  // Dashboard account pages
  ['@/pages/dashboard/account/AccountPanelPrimitives', '@/features/account/ui/AccountPanelPrimitives'],
  ['@/pages/dashboard/account/AccountSessionsPage', '@/features/account/sessions/AccountSessionsPage'],
  ['@/pages/dashboard/account/AccountSettingsPage', '@/features/account/settings/AccountSettingsPage'],
  ['@/pages/dashboard/account/ChangePasswordForm', '@/features/account/security/ChangePasswordForm'],
  ['@/pages/dashboard/account/ConnectionsPanel', '@/features/account/connections/ConnectionsPanel'],
  ['@/pages/dashboard/account/NotificationsPreferencesForm', '@/features/account/notifications/NotificationsPreferencesForm'],
  ['@/pages/dashboard/account/SessionsList', '@/features/account/sessions/SessionsList'],

  // Dashboard tenant pages
  ['@/pages/dashboard/tenant/TenantAppsPage', '@/features/console/apps/TenantAppsPage'],
  ['@/pages/dashboard/tenant/TenantMembershipsPage', '@/features/console/memberships/TenantMembershipsPage'],
  ['@/pages/dashboard/tenant/TenantUsersPage', '@/features/console/users/TenantUsersPage'],

  // Dashboard user pages
  ['@/pages/dashboard/user/UserProfilePage', '@/features/account/profile/UserProfilePage'],
  ['@/pages/dashboard/user/UserMyAccessPage', '@/features/account/access/UserMyAccessPage'],
  ['@/pages/dashboard/user/UserActivityPage', '@/features/account/activity/UserActivityPage'],
  ['@/pages/dashboard/user/UserSessionsPage', '@/features/account/sessions/UserSessionsPage'],

  // Dashboard shared pages
  ['@/pages/dashboard/DashboardHomePage', '@/features/console/dashboard/DashboardHomePage'],
  ['@/pages/dashboard/FaqCenterPage', '@/features/console/dashboard/FaqCenterPage'],
  ['@/pages/dashboard/FeaturePlaceholderPage', '@/features/console/dashboard/FeaturePlaceholderPage'],

  // Landing pages
  ['@/pages/landing/', '@/features/public/landing/'],

  // Developer docs
  ['@/pages/developers/', '@/features/public/docs/'],

  // Login pages
  ['@/pages/login/', '@/features/auth/login/'],

  // Register pages
  ['@/pages/register/steps/', '@/features/auth/register/steps/'],
  ['@/pages/register/', '@/features/auth/register/'],

  // Home redirect
  ['@/pages/home/Home', '@/features/auth/login/Home'],

  // Layouts
  ['@/layouts/', '@/app/layouts/'],

  // Simple prefix replacements
  ['@/hooks/', '@/shared/hooks/'],
  ['@/config/', '@/shared/lib/config/'],
  ['@/lib/', '@/shared/lib/'],
  ['@/i18n/', '@/shared/lib/i18n/'],
  ['@/mocks/', '@/shared/mocks/'],
  ['@/types/', '@/shared/types/'],
]

// ─── Phase 1: Move files ────────────────────────────────────────────────────

console.log('📦 Phase 1: Moving files...\n')
let moveCount = 0
let skipCount = 0

for (const [oldRel, newRel] of FILE_MOVES) {
  const oldAbs = join(SRC, oldRel)
  const newAbs = join(SRC, newRel)

  if (!existsSync(oldAbs)) {
    console.log(`  ⚠️  SKIP (not found): ${oldRel}`)
    skipCount++
    continue
  }

  if (existsSync(newAbs)) {
    console.log(`  ⚠️  SKIP (target exists): ${newRel}`)
    skipCount++
    continue
  }

  gitMv(oldAbs, newAbs)
  moveCount++
}

console.log(`\n✅ Moved ${moveCount} files (${skipCount} skipped)\n`)

// ─── Phase 2: Rewrite imports ────────────────────────────────────────────────

console.log('🔄 Phase 2: Rewriting imports...\n')

// Collect all .ts/.tsx files in src/ (after moves)
const tsFiles = allFiles(SRC, ['.ts', '.tsx'])
let rewriteCount = 0

for (const filePath of tsFiles) {
  let content = readFileSync(filePath, 'utf-8')
  let changed = false

  for (const [oldPath, newPath] of IMPORT_REWRITES) {
    // Match: from '@/old/path...' or import '@/old/path...'
    // We need to match the import path string, handling both ' and "
    const escaped = oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    // Pattern: captures the quote, replaces the path prefix
    const regex = new RegExp(`(['"])${escaped}`, 'g')

    if (regex.test(content)) {
      content = content.replace(regex, `$1${newPath}`)
      changed = true
    }
  }

  if (changed) {
    writeFileSync(filePath, content, 'utf-8')
    rewriteCount++
  }
}

console.log(`✅ Rewrote imports in ${rewriteCount} files\n`)

// ─── Phase 3: Clean up empty directories ─────────────────────────────────────

console.log('🧹 Phase 3: Cleaning empty directories...\n')

function removeEmptyDirs(dir) {
  if (!existsSync(dir)) return
  const entries = readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.isDirectory()) {
      removeEmptyDirs(join(dir, entry.name))
    }
  }

  // Re-read after recursive cleanup
  const remaining = readdirSync(dir)
  if (remaining.length === 0 && dir !== SRC) {
    execSync(`rmdir "${dir}"`, { stdio: 'pipe' })
    console.log(`  Removed: ${relative(ROOT, dir)}/`)
  }
}

// Only clean old directories that should now be empty
for (const old of ['src/pages', 'src/api', 'src/auth', 'src/components', 'src/config', 'src/hooks', 'src/i18n', 'src/layouts', 'src/lib', 'src/mocks', 'src/types']) {
  removeEmptyDirs(join(ROOT, old))
}

console.log('\n🎉 Migration complete! Run: npx tsc --noEmit && npx vitest run\n')
