import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getPublicTenants, getPublicApps } from '../discoveryApi';
import { SearchableSelectDropdown } from '@/shared/ui/SearchableSelectDropdown';
import type { TenantPublicData } from '@/shared/types/tenant';
import type { ClientAppPublicData } from '@/shared/types/clientapp';
import type { PagedData } from '@/shared/types/base';

const EMPTY_PAGED_DATA: PagedData<ClientAppPublicData> = {
  content: [],
  page: 0,
  size: 20,
  total_elements: 0,
  total_pages: 0,
  last: true,
};

interface AppSelfRegisterSelectAppStepProps {
  onNext: (tenantSlug: string, clientId: string, tenantName: string, appName: string) => void;
  initialTenantSlug?: string;
  initialClientId?: string;
}

export function AppSelfRegisterSelectAppStep({
  onNext,
  initialTenantSlug,
  initialClientId,
}: AppSelfRegisterSelectAppStepProps) {
  const { t } = useTranslation();
  const [selectedTenantSlug, setSelectedTenantSlug] = useState<string>(initialTenantSlug ?? '');
  const [selectedClientId, setSelectedClientId] = useState<string>(initialClientId ?? '');
  const [tenantPage, setTenantPage] = useState(0);
  const [appPage, setAppPage] = useState(0);

  // Fetch tenants with pagination
  const {
    data: tenantsData,
    isLoading: tenantsLoading,
    isError: tenantsError,
  } = useQuery({
    queryKey: ['tenants-public', tenantPage],
    queryFn: () => getPublicTenants(tenantPage, 20),
    initialData: { content: [], page: 0, size: 20, total_elements: 0, total_pages: 0, last: true },
    retry: false,
  });

  // Fetch apps with pagination
  const { data: appsData = EMPTY_PAGED_DATA, isLoading: appsLoading } = useQuery({
    queryKey: ['apps-public', selectedTenantSlug, appPage],
    queryFn: () =>
      selectedTenantSlug
        ? getPublicApps(selectedTenantSlug, appPage, 20)
        : Promise.resolve(EMPTY_PAGED_DATA),
    enabled: !!selectedTenantSlug,
    retry: false,
  });

  const allTenants = useMemo(() => tenantsData?.content ?? [], [tenantsData]);
  const allApps = useMemo(() => appsData?.content ?? [], [appsData]);

  const isInitialLoad = tenantsLoading && allTenants.length === 0;

  const registrableApps = useMemo(
    () =>
      allApps.filter(
        (app) =>
          (app.registration_policy === 'OPEN_AUTO_ACTIVE' ||
            app.registration_policy === 'OPEN_AUTO_PENDING') &&
          app.active,
      ),
    [allApps],
  );

  const selectedTenant = useMemo<TenantPublicData | null>(
    () => allTenants.find((tenant) => tenant.slug === selectedTenantSlug) ?? null,
    [allTenants, selectedTenantSlug],
  );

  const selectedApp = useMemo<ClientAppPublicData | null>(
    () => registrableApps.find((app) => app.client_id === selectedClientId) ?? null,
    [registrableApps, selectedClientId],
  );

  const handleNext = () => {
    if (!selectedTenant || !selectedApp) return;
    onNext(selectedTenant.slug, selectedApp.client_id, selectedTenant.name, selectedApp.name);
  };

  const handleLoadMoreTenants = useCallback(() => {
    if (!tenantsData?.last) {
      setTenantPage((prev) => prev + 1);
    }
  }, [tenantsData?.last]);

  const handleLoadMoreApps = useCallback(() => {
    if (!appsData?.last) {
      setAppPage((prev) => prev + 1);
    }
  }, [appsData?.last]);

  const tenantOptions = useMemo(
    () =>
      allTenants.map((tenant) => ({
        value: tenant.slug,
        label: tenant.name,
        description: tenant.description,
      })),
    [allTenants],
  );

  const appOptions = useMemo(
    () =>
      registrableApps.map((app) => ({
        value: app.client_id,
        label: app.name,
        description: app.description,
      })),
    [registrableApps],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          {t('appSelfRegister.steps.selectApp.title')}
        </h2>
        <p className="mt-2 text-slate-500 text-base">
          {t('appSelfRegister.steps.selectApp.description')}
        </p>
      </div>

      {isInitialLoad && (
        <div className="flex items-center justify-center py-12 text-slate-400" role="status">
          <svg
            className="animate-spin w-6 h-6 mr-2"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          {t('appSelfRegister.steps.selectApp.loading')}
        </div>
      )}

      {tenantsError && !isInitialLoad && (
        <div className="flex flex-col items-center gap-4 py-8 text-center" role="alert">
          <svg
            className="w-8 h-8 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <div>
            <p className="text-slate-600 font-medium">
              {t('appSelfRegister.steps.selectApp.errorTitle')}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {t('appSelfRegister.steps.selectApp.errorDescription')}
            </p>
          </div>
        </div>
      )}

      {!isInitialLoad && !tenantsError && (
        <>
          {/* Tenant selection */}
          <SearchableSelectDropdown
            value={selectedTenantSlug}
            onChange={(slug) => {
              setSelectedTenantSlug(slug);
              setSelectedClientId('');
              setAppPage(0);
            }}
            options={tenantOptions}
            label={t('appSelfRegister.steps.selectApp.tenantLabel')}
            placeholder={
              tenantsLoading ? '' : t('appSelfRegister.steps.selectApp.tenantPlaceholder')
            }
            required
            disabled={tenantsLoading}
            isLoading={tenantsLoading}
            onLoadMore={handleLoadMoreTenants}
            hasMore={tenantsData && !tenantsData.last}
            containerClassName="flex flex-col gap-1.5"
          />

          {/* App selection */}
          <SearchableSelectDropdown
            value={selectedClientId}
            onChange={(clientId) => {
              setSelectedClientId(clientId);
            }}
            options={appOptions}
            label={t('appSelfRegister.steps.selectApp.appLabel')}
            placeholder={appsLoading ? '' : t('appSelfRegister.steps.selectApp.appPlaceholder')}
            required
            disabled={!selectedTenant || appsLoading}
            isLoading={appsLoading}
            onLoadMore={handleLoadMoreApps}
            hasMore={appsData && !appsData.last}
            containerClassName="flex flex-col gap-1.5"
            noOptionsMessage={
              selectedTenant && !appsLoading && registrableApps.length === 0
                ? t('appSelfRegister.steps.selectApp.noAppsAvailable')
                : undefined
            }
          />
        </>
      )}

      {!isInitialLoad && !tenantsError && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleNext}
            disabled={!selectedTenant || !selectedApp || appsLoading || tenantsLoading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            {t('appSelfRegister.actions.continue')}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
