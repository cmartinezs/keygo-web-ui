import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTokenStore } from '@/auth/tokenStore'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useTheme } from '@/hooks/useTheme'
import type { ThemePreference } from '@/hooks/useTheme'
import type { SupportedLocale } from '@/i18n/constants'
import { useLocale } from '@/i18n/useLocale'
import { Dropdown } from '@/components/Dropdown'
import { SelectDropdown } from '@/components/SelectDropdown'
import { SidebarMenu } from '@/components/dashboard/SidebarMenu'
import type { SidebarMenuSection } from '@/components/dashboard/SidebarMenu'
import type { DropdownOption } from '@/types/dropdown'
import { resolvePrimaryRole } from '@/types/roles'
import type { AppRole } from '@/types/roles'
import { DevConsole } from '@/components/DevConsole'
import {
  IconKey,
  IconChevronLeft,
  IconChevronRight,
  IconHamburger,
  IconDashboard,
  IconBuilding,
  IconLogout,
  IconApps,
  IconUsers,
  IconShield,
  IconClipboard,
  IconKeySmall,
  IconClock,
  IconTicket,
  IconCloud,
  IconUser,
  IconSearch,
  IconBell,
  IconSettings,
  IconFaq,
  IconFlagChile,
  IconFlagUs,
} from '@/components/icons'


// ── Theme toggle ──────────────────────────────────────────────────────────────

const THEME_META: Record<ThemePreference, { icon: React.ReactNode }> = {
  system: {
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  light: {
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
      </svg>
    ),
  },
  dark: {
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
  },
  'high-contrast': {
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m9-9H3" />
      </svg>
    ),
  },
}

const THEME_OPTIONS: ThemePreference[] = ['system', 'light', 'dark', 'high-contrast']

const THEME_LABEL_KEYS: Record<ThemePreference, string> = {
  system: 'theme.system',
  light: 'theme.light',
  dark: 'theme.dark',
  'high-contrast': 'theme.highContrast',
}

const ROLE_LABEL_KEYS: Record<AppRole, string> = {
  ADMIN: 'roles.adminGlobal',
  ADMIN_TENANT: 'roles.adminTenant',
  USER_TENANT: 'roles.userTenant',
}

const LOCALE_ICONS: Record<SupportedLocale, React.ReactNode> = {
  'es-CL': <IconFlagChile />,
  'en-US': <IconFlagUs />,
}

interface ThemeToggleProps {
  value: ThemePreference
  onChange: (p: ThemePreference) => void
}

function ThemeToggle({ value, onChange }: ThemeToggleProps) {
  const { t } = useTranslation()
  const options: DropdownOption<ThemePreference>[] = THEME_OPTIONS.map((p) => ({
    value: p,
    label: t(THEME_LABEL_KEYS[p]),
    icon: THEME_META[p].icon,
  }))

  return (
    <SelectDropdown
      value={value}
      onChange={onChange}
      options={options}
      label={t('common.theme')}
      icon={THEME_META[value].icon}
      ariaLabel={`${t('common.theme')}: ${t(THEME_LABEL_KEYS[value])}`}
      hideSelectedOption
      selectedValueClassName="text-indigo-600 dark:text-indigo-400"
    />
  )
}

interface RoleSwitcherProps {
  value: AppRole
  availableRoles: AppRole[]
  onChange: (role: AppRole) => void
  containerClassName?: string
  triggerClassName?: string
  panelClassName?: string
  selectedValueClassName?: string
}

// Mapeo de iconos para cada rol
const ROLE_ICONS: Record<AppRole, React.ReactNode> = {
  ADMIN: <IconShield />,
  ADMIN_TENANT: <IconBuilding />,
  USER_TENANT: <IconUser />,
}

function RoleSwitcher({
  value,
  availableRoles,
  onChange,
  containerClassName,
  triggerClassName,
  panelClassName,
  selectedValueClassName,
}: RoleSwitcherProps) {
  const { t } = useTranslation()
  const options: DropdownOption<AppRole>[] = availableRoles.map((role) => ({
    value: role,
    label: t(ROLE_LABEL_KEYS[role]),
    icon: ROLE_ICONS[role],
  }))

  return (
    <SelectDropdown
      value={value}
      onChange={onChange}
      options={options}
      label={t('roles.role')}
      ariaLabel={t('roles.activeRole')}
      icon={ROLE_ICONS[value]}
      containerClassName={containerClassName}
      triggerClassName={triggerClassName}
      panelClassName={panelClassName}
      hideSelectedOption
      selectedValueClassName={selectedValueClassName ?? 'text-indigo-600 dark:text-indigo-400'}
    />
  )
}

interface LanguageSwitcherProps {
  value: SupportedLocale
  options: Array<{ value: string; label: string }>
  onChange: (locale: SupportedLocale) => void
}

function LanguageSwitcher({ value, options, onChange }: LanguageSwitcherProps) {
  const { t } = useTranslation()

  const localeOptions: DropdownOption<SupportedLocale>[] = options.map((option) => {
    const localeValue = option.value as SupportedLocale
    return {
      value: localeValue,
      label: option.label,
      icon: LOCALE_ICONS[localeValue],
    }
  })

  return (
    <SelectDropdown
      value={value}
      onChange={onChange}
      options={localeOptions}
      label={t('common.language')}
      icon={LOCALE_ICONS[value]}
      ariaLabel={t('common.language')}
      hideSelectedOption
      selectedValueClassName="text-indigo-600 dark:text-indigo-400"
    />
  )
}

// ── Sidebar nav item ──────────────────────────────────────────────────────────

// ── User avatar initials ──────────────────────────────────────────────────────

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(/[\s@._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')

  return (
    <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold shrink-0 select-none">
      {initials}
    </div>
  )
}

function createSidebarByRole(t: (key: string) => string): Record<AppRole, SidebarMenuSection[]> {
  return {
    ADMIN: [
    {
      label: t('dashboard.platform'),
      items: [
        { to: '/dashboard', exact: true, icon: <IconDashboard />, label: t('dashboard.dashboard') },
        { to: '/dashboard/tenants', icon: <IconBuilding />, label: t('dashboard.tenants') },
        { to: '/dashboard/tenant/apps', icon: <IconApps />, label: t('dashboard.apps') },
        { to: '/dashboard/tenant/users', icon: <IconUsers />, label: t('dashboard.users') },
      ],
    },
    {
      label: t('dashboard.accessAndAudit'),
      items: [
        { to: '/dashboard/tenant/memberships', icon: <IconShield />, label: t('dashboard.access') },
        { to: '/dashboard/feature/audit', icon: <IconClipboard />, label: t('dashboard.audit') },
      ],
    },
    {
      label: t('dashboard.security'),
      items: [
        { to: '/dashboard/feature/signing-keys', icon: <IconKeySmall />, label: t('dashboard.signingKeys') },
        { to: '/dashboard/account/sessions', icon: <IconClock />, label: t('dashboard.sessions') },
        { to: '/dashboard/feature/tokens', icon: <IconTicket />, label: t('dashboard.tokens') },
      ],
    },
    {
      label: t('dashboard.system'),
      items: [
        { to: '/dashboard/feature/api', icon: <IconCloud />, label: t('dashboard.api') },
        { to: '/dashboard/account/sessions', icon: <IconClock />, label: t('dashboard.sessions') },
        { to: '/dashboard/account/settings', icon: <IconSettings />, label: t('common.accountSettings') },
        { to: '/dashboard/faq', icon: <IconFaq />, label: t('common.faq') },
        { to: '/dashboard/account', exact: true, icon: <IconUser />, label: t('common.myAccount') },
      ],
    },
  ],
    ADMIN_TENANT: [
    {
      label: t('dashboard.myOrganization'),
      items: [
        { to: '/dashboard', exact: true, icon: <IconDashboard />, label: t('dashboard.dashboard') },
        { to: '/dashboard/tenant/users', icon: <IconUsers />, label: t('dashboard.users') },
        { to: '/dashboard/tenant/apps', icon: <IconApps />, label: t('dashboard.apps') },
      ],
    },
    {
      label: t('dashboard.access'),
      items: [
        { to: '/dashboard/tenant/memberships', icon: <IconShield />, label: t('dashboard.memberships') },
        { to: '/dashboard/account/sessions', icon: <IconClock />, label: t('dashboard.sessions') },
      ],
    },
    {
      label: t('dashboard.account'),
      items: [
        { to: '/dashboard/account', exact: true, icon: <IconUser />, label: t('common.myAccount') },
        { to: '/dashboard/account/sessions', icon: <IconClock />, label: t('dashboard.sessions') },
        { to: '/dashboard/account/settings', icon: <IconSettings />, label: t('common.accountSettings') },
        { to: '/dashboard/faq', icon: <IconFaq />, label: t('common.faq') },
      ],
    },
  ],
    USER_TENANT: [
    {
      label: t('dashboard.home'),
      items: [
        { to: '/dashboard', exact: true, icon: <IconDashboard />, label: t('dashboard.dashboard') },
        { to: '/dashboard/user/my-access', icon: <IconShield />, label: t('dashboard.myAccess') },
        { to: '/dashboard/user/activity', icon: <IconClipboard />, label: t('dashboard.activity') },
      ],
    },
    {
      label: t('dashboard.account'),
      items: [
        { to: '/dashboard/account', exact: true, icon: <IconUser />, label: t('common.myAccount') },
        { to: '/dashboard/account/sessions', icon: <IconClock />, label: t('dashboard.sessions') },
        { to: '/dashboard/account/settings', icon: <IconSettings />, label: t('common.accountSettings') },
        { to: '/dashboard/faq', icon: <IconFaq />, label: t('common.faq') },
      ],
    },
  ],
  }
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function AdminLayout() {
  const { t } = useTranslation()
  const { locale, setLocale, supportedLocales } = useLocale()
  const roles = useTokenStore((s) => s.roles)
  const activeRole = useTokenStore((s) => s.activeRole)
  const setActiveRole = useTokenStore((s) => s.setActiveRole)
  const navigate = useNavigate()
  const user = useCurrentUser()
  const { preference, setPreference } = useTheme()

  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile drawer on route change
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMobileOpen(false))
    return () => window.cancelAnimationFrame(frame)
  }, [location.pathname])

  function handleLogout() {
    navigate('/logout', { replace: true })
  }

  function handleRoleChange(nextRole: AppRole) {
    setActiveRole(nextRole)
    navigate('/dashboard', { replace: true })
  }

  function handleOpenAccount() {
    navigate('/dashboard/account')
  }

  function handleOpenAccountSettings() {
    navigate('/dashboard/account/settings')
  }

  function handleOpenAccountFaq() {
    navigate('/dashboard/faq')
  }

  function handleLocaleChange(nextLocale: SupportedLocale) {
    void setLocale(nextLocale)
  }

  const displayName = user?.displayName ?? t('common.admin')
  const userMenuFullName = [user?.firstName?.trim(), user?.lastName?.trim()]
    .filter(Boolean)
    .join(' ')
  const userMenuDisplayName = userMenuFullName || user?.username || displayName
  const sidebarRole = activeRole ?? resolvePrimaryRole(roles) ?? 'USER_TENANT'
  const roleLabel = t(ROLE_LABEL_KEYS[sidebarRole])
  const sidebarSections = createSidebarByRole(t)[sidebarRole]

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">

      {/* ── Mobile backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={[
          'flex flex-col bg-slate-900 border-r border-white/10 h-full overflow-hidden',
          'fixed inset-y-0 left-0 z-40 w-64',
          'transition-[transform,width] duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'md:static md:inset-auto md:z-auto md:translate-x-0 md:shrink-0',
          collapsed ? 'md:w-16' : 'md:w-64',
        ].join(' ')}
      >

        {/* Logo + collapse toggle */}
        <div className="h-16 flex items-center border-b border-white/10 shrink-0">
          {/* Logo: always visible in drawer, hidden when collapsed on desktop */}
          <div className={`flex items-center gap-2.5 flex-1 min-w-0 px-5 ${collapsed ? 'md:hidden' : ''}`}>
            <IconKey />
            <span className="text-white font-bold text-lg tracking-tight whitespace-nowrap">KeyGo</span>
          </div>
          {/* Collapse toggle: desktop only */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? t('theme.expandMenu') : t('theme.collapseMenu')}
            className={`hidden md:flex shrink-0 w-8 h-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 ${collapsed ? 'mx-auto' : 'mr-2'}`}
          >
            {collapsed ? <IconChevronRight /> : <IconChevronLeft />}
          </button>
        </div>

        {/* Navigation */}
        <SidebarMenu
          sections={sidebarSections}
          collapsed={collapsed}
          onNavigate={() => setMobileOpen(false)}
        />

        {/* Sidebar user strip */}
        <div className="px-2 py-4 border-t border-white/10">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : 'px-2'}`}>
            <UserAvatar name={displayName} />
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{displayName}</p>
                <p className="text-xs text-indigo-400 truncate">{roleLabel}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Right column: header + content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top header */}
        <header className="h-16 bg-white dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 flex items-center px-4 gap-3 shrink-0">

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={t('theme.openMenu')}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 shrink-0"
          >
            <IconHamburger />
          </button>

          {/* Search — hidden on mobile */}
          <div className="hidden min-[550px]:flex items-center gap-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 w-64">
            <IconSearch />
            <span className="text-sm text-slate-400 select-none">{t('common.search')}...</span>
            <kbd className="ml-auto text-[10px] text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-white/20 rounded px-1">⌘K</kbd>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          <LanguageSwitcher
            value={locale as SupportedLocale}
            options={supportedLocales}
            onChange={handleLocaleChange}
          />

          {/* Theme toggle + Notifications */}
          <ThemeToggle value={preference} onChange={setPreference} />

          {/* Notifications */}
          <button
            className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label={t('common.notifications')}
          >
            <IconBell />
          </button>

          {/* User menu */}
          <Dropdown
            ariaLabel={t('common.userMenu')}
            panelRole="menu"
            panelClassName="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 py-1 z-50"
            trigger={({ open, toggle }) => (
              <button
                onClick={toggle}
                className="flex items-center gap-2.5 rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={t('common.userMenu')}
              >
                <UserAvatar name={userMenuDisplayName} />
                <div className="text-left hidden min-[550px]:block">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white leading-tight">{userMenuDisplayName}</p>
                </div>
                <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 hidden min-[550px]:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          >
            {roles.length > 0 && (
              <div className="px-3 py-2 border-b border-slate-100 dark:border-white/10" role="none">
                <RoleSwitcher
                  availableRoles={roles}
                  value={sidebarRole}
                  onChange={handleRoleChange}
                  containerClassName="w-full"
                  triggerClassName="w-full justify-between h-10 px-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                  selectedValueClassName="text-slate-700 dark:text-slate-300"
                  panelClassName="absolute right-full top-0 mr-2 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 py-1 z-50"
                />
              </div>
            )}

            {/* Menu items */}
            <div className="py-1" role="none">
              {[
                { key: 'account', label: t('common.myAccount'), icon: <IconUser />, onClick: handleOpenAccount },
                { key: 'settings', label: t('common.accountSettings'), icon: <IconSettings />, onClick: handleOpenAccountSettings },
                { key: 'faq', label: t('common.faq'), icon: <IconFaq />, onClick: handleOpenAccountFaq },
              ].map((item) => (
                <button
                  key={item.key}
                  role="menuitem"
                  onClick={item.onClick}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors text-left"
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>

            {/* Logout */}
            <div className="pt-1 border-t border-slate-200 dark:border-white/10 px-3 pb-2" role="none">
              <button
                role="menuitem"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                <IconLogout />
                {t('common.logout')}
              </button>
            </div>
          </Dropdown>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
          <Outlet />
        </main>

        {/* DevConsole — visible only for ADMIN role */}
        {sidebarRole === 'ADMIN' && <DevConsole />}
      </div>
    </div>
  )
}

