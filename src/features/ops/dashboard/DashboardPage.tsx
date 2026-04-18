import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { getPlatformDashboard, DASHBOARD_QUERY_KEYS } from '@/features/console/dashboard/api';
import {
  NETWORK_MAX_RETRIES,
  NETWORK_REQUEST_TIMEOUT_MS,
  NETWORK_RETRY_DELAY_MS,
} from '@/shared/lib/config/network';
import { runGetWithRecovery } from '@/shared/lib/network/recovery';
import {
  IconRefresh,
  IconPlus,
  IconBuilding,
  IconUsers,
  IconTicket,
  IconClock,
  IconCheckCircle,
  IconXCircle,
} from '@/shared/ui/icons';
import { CardSkeleton, ErrorAlert } from './components/DashboardPrimitives';

// ── Metric Card ───────────────────────────────────────────────────────────

interface MetricProps {
  icon: React.ReactNode;
  label: string;
  value: string | number | null | undefined;
  delta?: string;
  deltaDown?: boolean;
}

function Metric({ icon, label, value, delta, deltaDown }: MetricProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-indigo-600 dark:text-indigo-400 w-5 h-5">{icon}</span>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white">
        {value ?? '—'}
      </div>
      {delta && (
        <div className={`text-xs font-medium ${deltaDown ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
          {delta}
        </div>
      )}
    </div>
  );
}

// ── Tenant Avatar ──────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-600',
  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-600',
  'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-600',
  'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-600',
  'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-600',
];

function TenantAvatar({ name, index }: { name: string; index: number }) {
  const initials = name
    .split(/[\s\-_]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

  return (
    <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold shrink-0 ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}>
      {initials}
    </div>
  );
}

// ── Status Badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' }) {
  const { t } = useTranslation();
  const styles = {
    ACTIVE: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    PENDING: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    SUSPENDED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${styles[status]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
      {t(`adminDashboard.status.${status}`)}
    </span>
  );
}

// ── Activity Feed ──────────────────────────────────────────────────────────

function ActivityFeedItem({ item }: { item: { code: string; title: string; timestamp: string; success?: boolean } }) {
  const iconStyle = item.success
    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
    : item.success === false
      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
      : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400';

  return (
    <div className="flex gap-3 py-3 border-b border-slate-100 dark:border-white/5 last:border-0">
      <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${iconStyle}`}>
        {item.success ? (
          <IconCheckCircle className="w-4 h-4" />
        ) : item.success === false ? (
          <IconXCircle className="w-4 h-4" />
        ) : (
          <IconPlus className="w-4 h-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-900 dark:text-white">{item.title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
          {item.code} · {item.timestamp}
        </p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { t } = useTranslation();

  async function fetchDashboardWithRecovery(signal: AbortSignal) {
    return runGetWithRecovery({
      signal,
      label: 'dashboard',
      timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
      retryDelayMs: NETWORK_RETRY_DELAY_MS,
      maxRetries: NETWORK_MAX_RETRIES,
      query: () =>
        getPlatformDashboard({
          signal,
          timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        }),
    });
  }

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.platformDashboard,
    queryFn: ({ signal }) => fetchDashboardWithRecovery(signal),
    retry: false,
  });

  function handleRefresh() {
    void refetch().then(() => {
      toast.success(t('adminDashboard.refreshedToast'));
    });
  }

  const displayName = 'Sofía'; // TODO: Get from useCurrentUser

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
            {t('adminDashboard.breadcrumb', { defaultValue: 'Home / Dashboard' })}
          </p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
            {t('adminDashboard.welcome', { name: displayName, defaultValue: `Welcome back, ${displayName}.` })}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {t('adminDashboard.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
          >
            <IconRefresh className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            {t('adminDashboard.refresh', { defaultValue: 'Refresh' })}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400 outline-none">
            <IconPlus className="w-4 h-4" />
            {t('adminDashboard.newTenant', { defaultValue: 'New tenant' })}
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {isError && <ErrorAlert message={t('adminDashboard.loadError')} />}

      {/* ── Metrics (4 cards) ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Metric
            icon={<IconBuilding className="w-5 h-5" />}
            label={t('adminDashboard.metrics.tenants', { defaultValue: 'Tenants' })}
            value={data?.tenants?.total ?? 0}
            delta={t('adminDashboard.metrics.tenantsThisWeek', { defaultValue: '+3 this week' })}
          />
          <Metric
            icon={<IconUsers className="w-5 h-5" />}
            label={t('adminDashboard.metrics.activeUsers', { defaultValue: 'Active users (24h)' })}
            value={data?.users?.active_24h ?? 0}
            delta={t('adminDashboard.metrics.activeUsersDelta', { defaultValue: '+12.4%' })}
          />
          <Metric
            icon={<IconTicket className="w-5 h-5" />}
            label={t('adminDashboard.metrics.tokensIssued', { defaultValue: 'Tokens issued (24h)' })}
            value={data?.security?.tokens_issued_24h ?? 0}
            delta={t('adminDashboard.metrics.tokensIssuedDelta', { defaultValue: '+4.1%' })}
          />
          <Metric
            icon={<IconClock className="w-5 h-5" />}
            label={t('adminDashboard.metrics.failedAuth', { defaultValue: 'Failed auth (24h)' })}
            value={data?.security?.failed_auth_24h ?? 0}
            delta={t('adminDashboard.metrics.failedAuthDelta', { defaultValue: '+8 vs. yesterday' })}
            deltaDown
          />
        </div>
      )}

      {/* ── Grid 2 columnas: Tabla + Feed ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CardSkeleton />
          </div>
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top tenants table (2/3 width) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                {t('adminDashboard.topTenants.title', { defaultValue: 'Top tenants by activity' })}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('adminDashboard.topTenants.subtitle', { defaultValue: 'Last 24 hours · sorted by active users' })}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-white/5">
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-white/10">
                      {t('adminDashboard.table.tenant', { defaultValue: 'Tenant' })}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-white/10">
                      {t('adminDashboard.table.plan', { defaultValue: 'Plan' })}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-white/10">
                      {t('adminDashboard.table.users', { defaultValue: 'Users' })}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-white/10">
                      {t('adminDashboard.table.status', { defaultValue: 'Status' })}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.rankings?.top_tenants ?? []).map((tenant: any, idx: number) => (
                    <tr key={tenant.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 last:border-0">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <TenantAvatar name={tenant.name} index={idx} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{tenant.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{tenant.domain}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-mono font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                          {tenant.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-600 dark:text-slate-400">
                        {tenant.users_count?.toLocaleString?.() ?? '—'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={tenant.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity feed (1/3 width) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                {t('adminDashboard.auditActivity.title', { defaultValue: 'Audit activity' })}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('adminDashboard.auditActivity.subtitle', { defaultValue: 'Most recent events' })}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {(data?.recent_activity ?? []).map((activity: any) => (
                <ActivityFeedItem
                  key={activity.id}
                  item={{
                    code: activity.code,
                    title: activity.title,
                    timestamp: activity.timestamp,
                    success: activity.status === 'success' ? true : activity.status === 'error' ? false : undefined,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
