import { useState } from 'react';
import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { platformDirectLogin } from '@/features/auth/api';
import {
  getPlatformUser,
  suspendPlatformUser,
  activatePlatformUser,
  listPlatformUserRoles,
  listPlatformRolesCatalog,
  assignPlatformRole,
  revokePlatformRole,
  PLATFORM_USER_QUERY_KEYS,
  PLATFORM_ROLE_QUERY_KEYS,
} from '@/features/ops/platform-users/api';
import { getAppApiError, getUserMessage } from '@/shared/api/errorNormalizer';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import {
  IconShield,
  IconXCircle,
  IconCheckCircle,
  IconAlertTriangle,
  IconPlus,
  IconTrash,
} from '@/shared/ui/icons';
import {
  CriticalActionConfirmationModal,
} from '@/shared/ui/CriticalActionConfirmationModal';
import type {
  CriticalActionConfirmationTexts,
} from '@/shared/ui/CriticalActionConfirmationModal';
import { requiresSensitivePlatformRoleConfirmation } from './roleAssignmentGuards';
import { matchesSensitiveConfirmationPhrase } from './roleAssignmentGuards';
import {
  NETWORK_REQUEST_TIMEOUT_MS,
  NETWORK_MAX_RETRIES,
  NETWORK_RETRY_DELAY_MS,
} from '@/shared/lib/config/network';
import {
  runGetWithRecovery,
  isRequestTimeout,
  notifyMutationTimeout,
} from '@/shared/lib/network/recovery';
import type {
  PlatformRoleCatalogData,
  PlatformUserData,
  PlatformUserStatus,
} from '@/shared/types/platform';
import { PLATFORM_ROLE_LABELS } from '@/shared/types/roles';
import { normalizePlatformRoleCode } from '@/shared/types/roles';
import type { PlatformRole } from '@/shared/types/roles';

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<PlatformUserStatus, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  SUSPENDED: 'bg-red-500/10 text-red-600 dark:text-red-400',
  PENDING: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
};

const STATUS_ICONS: Record<PlatformUserStatus, ReactNode> = {
  ACTIVE: <IconCheckCircle className="w-4 h-4 text-emerald-500" aria-hidden="true" />,
  SUSPENDED: <IconXCircle className="w-4 h-4 text-red-500" aria-hidden="true" />,
  PENDING: <IconAlertTriangle className="w-4 h-4 text-amber-500" aria-hidden="true" />,
};

function getPlatformUserDisplayName(user: PlatformUserData) {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  return fullName || user.username || user.email || user.id;
}

function getPlatformUserInitials(name: string) {
  return (
    name
      .split(/[\s@._-]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'KG'
  );
}

function getFallbackRoleLabel(roleCode: string) {
  return PLATFORM_ROLE_LABELS[roleCode as PlatformRole] ?? roleCode;
}

function getCatalogRoleLabel(role: PlatformRoleCatalogData) {
  return role.name?.trim() || getFallbackRoleLabel(role.code);
}

interface CriticalActionFlowConfig {
  type: 'assign-keygo-admin' | 'suspend-user' | 'activate-user';
  requirePassword: boolean;
  requireTypedConfirmation: boolean;
  texts: CriticalActionConfirmationTexts;
  actionIcon: ReactNode;
  confirmationRequiredMessage?: string;
  confirmationMismatchMessage?: string;
  passwordRequiredMessage?: string;
  execute: () => void;
}

// ── Detail skeleton ───────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div
      className="p-6 max-w-2xl space-y-6 animate-pulse"
      role="status"
      aria-label="Cargando detalle"
    >
      <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-48" />
      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-64" />
      <div className="grid grid-cols-2 gap-4 mt-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-20" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-36" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PlatformUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const { t } = useTranslation();
  const currentUser = useCurrentUser();
  const queryClient = useQueryClient();
  const timeoutMs = NETWORK_REQUEST_TIMEOUT_MS;

  const [roleToAssign, setRoleToAssign] = useState('');
  const [criticalActionConfig, setCriticalActionConfig] = useState<CriticalActionFlowConfig | null>(null);
  const [criticalActionStep, setCriticalActionStep] = useState<'warning' | 'password'>('warning');
  const [criticalActionConfirmationValue, setCriticalActionConfirmationValue] = useState('');
  const [criticalActionConfirmationError, setCriticalActionConfirmationError] = useState<string | null>(null);
  const [criticalActionPassword, setCriticalActionPassword] = useState('');
  const [criticalActionPasswordError, setCriticalActionPasswordError] = useState<string | null>(null);

  function resetCriticalActionFlow() {
    setCriticalActionConfig(null);
    setCriticalActionStep('warning');
    setCriticalActionConfirmationValue('');
    setCriticalActionConfirmationError(null);
    setCriticalActionPassword('');
    setCriticalActionPasswordError(null);
  }

  // ── User detail query ───────────────────────────────────────────────
  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: PLATFORM_USER_QUERY_KEYS.detail(userId!),
    queryFn: ({ signal }) =>
      runGetWithRecovery({
        signal,
        label: 'detalle de usuario',
        timeoutMs,
        retryDelayMs: NETWORK_RETRY_DELAY_MS,
        maxRetries: NETWORK_MAX_RETRIES,
        query: () => getPlatformUser(userId!, { signal, timeoutMs }),
      }),
    enabled: !!userId,
    retry: false,
  });

  // ── Roles query ─────────────────────────────────────────────────────
  const { data: userRoles = [], isLoading: isRolesLoading } = useQuery({
    queryKey: PLATFORM_USER_QUERY_KEYS.roles(userId!),
    queryFn: ({ signal }) =>
      runGetWithRecovery({
        signal,
        label: 'roles del usuario',
        timeoutMs,
        retryDelayMs: NETWORK_RETRY_DELAY_MS,
        maxRetries: NETWORK_MAX_RETRIES,
        query: () => listPlatformUserRoles(userId!, { signal, timeoutMs }),
      }),
    enabled: !!userId,
    retry: false,
  });

  const {
    data: platformRoleCatalog = [],
    isLoading: isRoleCatalogLoading,
    isError: isRoleCatalogError,
  } = useQuery({
    queryKey: PLATFORM_ROLE_QUERY_KEYS.catalog,
    queryFn: ({ signal }) =>
      runGetWithRecovery({
        signal,
        label: 'catálogo de roles de plataforma',
        timeoutMs,
        retryDelayMs: NETWORK_RETRY_DELAY_MS,
        maxRetries: NETWORK_MAX_RETRIES,
        query: () => listPlatformRolesCatalog({ signal, timeoutMs }),
      }),
    retry: false,
  });

  // ── Mutations ───────────────────────────────────────────────────────
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: PLATFORM_USER_QUERY_KEYS.all });
    queryClient.invalidateQueries({ queryKey: PLATFORM_USER_QUERY_KEYS.detail(userId!) });
    queryClient.invalidateQueries({ queryKey: PLATFORM_USER_QUERY_KEYS.roles(userId!) });
  };

  const suspendMutation = useMutation({
    mutationFn: () => suspendPlatformUser(userId!, { timeoutMs }),
    onSuccess: () => {
      resetCriticalActionFlow();
      toast.success(t('platformUserDetail.suspendSuccess'));
      invalidateAll();
    },
    onError: (err) => {
      if (isRequestTimeout(err)) notifyMutationTimeout('suspensión del usuario');
      else toast.error(t('platformUserDetail.suspendError'));
    },
  });

  const activateMutation = useMutation({
    mutationFn: () => activatePlatformUser(userId!, { timeoutMs }),
    onSuccess: () => {
      resetCriticalActionFlow();
      toast.success(t('platformUserDetail.activateSuccess'));
      invalidateAll();
    },
    onError: (err) => {
      if (isRequestTimeout(err)) notifyMutationTimeout('activación del usuario');
      else toast.error(t('platformUserDetail.activateError'));
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: (roleCode: string) =>
      assignPlatformRole(userId!, { role_code: roleCode }, { timeoutMs }),
    onSuccess: () => {
      resetCriticalActionFlow();
      toast.success(t('platformUserDetail.roleAssigned'));
      setRoleToAssign('');
      invalidateAll();
    },
    onError: (err) => {
      if (isRequestTimeout(err)) notifyMutationTimeout('asignación de rol');
      else toast.error(t('platformUserDetail.roleAssignError'));
    },
  });

  const verifyCriticalActionMutation = useMutation({
    mutationFn: (password: string) =>
      platformDirectLogin(
        {
          emailOrUsername: currentUser?.email ?? currentUser?.username ?? '',
          password,
        },
        { timeoutMs },
      ),
    onSuccess: () => {
      criticalActionConfig?.execute();
    },
    onError: (err) => {
      if (isRequestTimeout(err)) {
        notifyMutationTimeout('confirmación de contraseña');
        return;
      }

      const appError = getAppApiError(err);
      setCriticalActionPasswordError(getUserMessage(appError));
    },
  });

  const revokeRoleMutation = useMutation({
    mutationFn: (roleCode: string) => revokePlatformRole(userId!, roleCode, { timeoutMs }),
    onSuccess: () => {
      toast.success(t('platformUserDetail.roleRevoked'));
      invalidateAll();
    },
    onError: (err) => {
      if (isRequestTimeout(err)) notifyMutationTimeout('revocación de rol');
      else toast.error(t('platformUserDetail.roleRevokeError'));
    },
  });

  // ── Loading / Error states ──────────────────────────────────────────
  if (isLoading) return <DetailSkeleton />;

  if (isError || !user) {
    return (
      <div className="p-6 max-w-2xl">
        <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-6 space-y-3">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <IconXCircle className="w-5 h-5" aria-hidden="true" />
            <span className="font-semibold">{t('platformUserDetail.errorTitle')}</span>
          </div>
          <p className="text-sm text-red-600/80 dark:text-red-400/80">
            {t('platformUserDetail.errorDescription')}
          </p>
        </div>
      </div>
    );
  }

  const assignedRoleCodes = new Set(
    userRoles.map((role) => normalizePlatformRoleCode(role.role_code) ?? role.role_code),
  );
  const isCurrentUserKeygoAdmin = currentUser?.roles.includes('keygo_admin') ?? false;
  const availableRoles = platformRoleCatalog.filter(
    (role) =>
      !assignedRoleCodes.has(normalizePlatformRoleCode(role.code) ?? role.code)
      && (normalizePlatformRoleCode(role.code) !== 'keygo_admin' || isCurrentUserKeygoAdmin),
  );
  const displayName = getPlatformUserDisplayName(user);
  const displayInitials = getPlatformUserInitials(displayName);
  const targetUsername = user.username || displayName;
  const isSuspendedReadOnly = user.status === 'SUSPENDED';
  const isCriticalActionPending =
    verifyCriticalActionMutation.isPending
    || (criticalActionConfig?.type === 'assign-keygo-admin' && assignRoleMutation.isPending)
    || (criticalActionConfig?.type === 'suspend-user' && suspendMutation.isPending)
    || (criticalActionConfig?.type === 'activate-user' && activateMutation.isPending);
  const isAssigningKeygoAdminToAnotherUser = requiresSensitivePlatformRoleConfirmation({
    selectedRoleCode: roleToAssign,
    actorUserId: currentUser?.sub,
    targetUserId: user.id,
  });

  function closeCriticalActionModal() {
    if (isCriticalActionPending) return;
    resetCriticalActionFlow();
  }

  function openCriticalAction(config: CriticalActionFlowConfig) {
    const actorCredential = currentUser?.email ?? currentUser?.username;
    if (config.requirePassword && !actorCredential) {
      toast.error(t('platformUserDetail.criticalActionCredentialUnavailable'));
      return;
    }

    setCriticalActionConfig(config);
    setCriticalActionStep('warning');
    setCriticalActionConfirmationValue('');
    setCriticalActionConfirmationError(null);
    setCriticalActionPassword('');
    setCriticalActionPasswordError(null);
  }

  function buildAssignKeygoAdminAction(roleCode: string): CriticalActionFlowConfig {
    return {
      type: 'assign-keygo-admin',
      requirePassword: true,
      requireTypedConfirmation: true,
      actionIcon: <IconShield className="h-4 w-4 shrink-0" aria-hidden="true" />,
      confirmationRequiredMessage: t('platformUserDetail.keygoAdminConfirmationRequired'),
      confirmationMismatchMessage: t('platformUserDetail.keygoAdminConfirmationMismatch'),
      passwordRequiredMessage: t('platformUserDetail.criticalActionPasswordRequired'),
      texts: {
        warningTitle: t('platformUserDetail.keygoAdminWarningTitle'),
        warningDescription: t('platformUserDetail.keygoAdminWarningDescription', { target: displayName }),
        confirmationHelpText: t('platformUserDetail.keygoAdminConfirmationHelp'),
        confirmationPhrase: t('platformUserDetail.keygoAdminConfirmationPhrase', { username: targetUsername }),
        confirmationLabel: t('platformUserDetail.keygoAdminConfirmationLabel', {
          username: targetUsername,
        }),
        confirmationPlaceholder: t('platformUserDetail.criticalActionConfirmationPlaceholder'),
        confirmationExactMatchHint: t('platformUserDetail.criticalActionConfirmationExactMatch'),
        continueLabel: t('platformUserDetail.keygoAdminWarningContinue'),
        cancelLabel: t('common.comeBackLater'),
        passwordTitle: t('platformUserDetail.keygoAdminPasswordTitle'),
        passwordDescription: t('platformUserDetail.keygoAdminPasswordDescription'),
        passwordLabel: t('platformUserDetail.criticalActionPasswordLabel'),
        passwordBackLabel: t('platformUserDetail.criticalActionBack'),
        submitLabel: t('platformUserDetail.keygoAdminPasswordSubmit'),
      },
      execute: () => assignRoleMutation.mutate(roleCode),
    };
  }

  function buildSuspendUserAction(): CriticalActionFlowConfig {
    return {
      type: 'suspend-user',
      requirePassword: true,
      requireTypedConfirmation: true,
      actionIcon: <IconXCircle className="h-4 w-4 shrink-0" aria-hidden="true" />,
      confirmationRequiredMessage: t('platformUserDetail.suspendConfirmationRequired'),
      confirmationMismatchMessage: t('platformUserDetail.suspendConfirmationMismatch'),
      passwordRequiredMessage: t('platformUserDetail.criticalActionPasswordRequired'),
      texts: {
        warningTitle: t('platformUserDetail.suspendWarningTitle'),
        warningDescription: t('platformUserDetail.suspendWarningDescription', { target: displayName }),
        confirmationHelpText: t('platformUserDetail.suspendConfirmationHelp'),
        confirmationPhrase: t('platformUserDetail.suspendConfirmationPhrase', { username: targetUsername }),
        confirmationLabel: t('platformUserDetail.suspendConfirmationLabel', {
          username: targetUsername,
        }),
        confirmationPlaceholder: t('platformUserDetail.criticalActionConfirmationPlaceholder'),
        confirmationExactMatchHint: t('platformUserDetail.criticalActionConfirmationExactMatch'),
        continueLabel: t('platformUserDetail.suspendWarningContinue'),
        cancelLabel: t('common.comeBackLater'),
        passwordTitle: t('platformUserDetail.suspendPasswordTitle'),
        passwordDescription: t('platformUserDetail.suspendPasswordDescription'),
        passwordLabel: t('platformUserDetail.criticalActionPasswordLabel'),
        passwordBackLabel: t('platformUserDetail.criticalActionBack'),
        submitLabel: t('platformUserDetail.suspendPasswordSubmit'),
      },
      execute: () => suspendMutation.mutate(),
    };
  }

  function buildActivateUserAction(): CriticalActionFlowConfig {
    return {
      type: 'activate-user',
      requirePassword: false,
      requireTypedConfirmation: true,
      actionIcon: <IconCheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />,
      confirmationRequiredMessage: t('platformUserDetail.activateConfirmationRequired'),
      confirmationMismatchMessage: t('platformUserDetail.activateConfirmationMismatch'),
      texts: {
        warningTitle: t('platformUserDetail.activateWarningTitle'),
        warningDescription: t('platformUserDetail.activateWarningDescription', { target: displayName }),
        confirmationHelpText: t('platformUserDetail.activateConfirmationHelp'),
        confirmationPhrase: t('platformUserDetail.activateConfirmationPhrase', { username: targetUsername }),
        confirmationLabel: t('platformUserDetail.activateConfirmationLabel', {
          username: targetUsername,
        }),
        confirmationPlaceholder: t('platformUserDetail.criticalActionConfirmationPlaceholder'),
        confirmationExactMatchHint: t('platformUserDetail.criticalActionConfirmationExactMatch'),
        continueLabel: t('platformUserDetail.activateWarningContinue'),
        cancelLabel: t('common.comeBackLater'),
        submitLabel: t('platformUserDetail.activateWarningContinue'),
      },
      execute: () => activateMutation.mutate(),
    };
  }

  function handleAssignRole() {
    if (!roleToAssign || isSuspendedReadOnly) return;

    if (isAssigningKeygoAdminToAnotherUser) {
      openCriticalAction(buildAssignKeygoAdminAction(roleToAssign));
      return;
    }

    assignRoleMutation.mutate(roleToAssign);
  }

  function handleOpenSuspendAction() {
    if (isSuspendedReadOnly) return;
    openCriticalAction(buildSuspendUserAction());
  }

  function handleOpenActivateAction() {
    openCriticalAction(buildActivateUserAction());
  }

  function handleContinueCriticalAction() {
    if (!criticalActionConfig) return;

    if (
      criticalActionConfig.requireTypedConfirmation
      && criticalActionConfig.texts.confirmationPhrase
    ) {
      if (criticalActionConfirmationValue.trim().length === 0) {
        setCriticalActionConfirmationError(
          criticalActionConfig.confirmationRequiredMessage
            ?? t('platformUserDetail.criticalActionConfirmationRequired'),
        );
        return;
      }

      if (
        !matchesSensitiveConfirmationPhrase(
          criticalActionConfig.texts.confirmationPhrase,
          criticalActionConfirmationValue,
        )
      ) {
        setCriticalActionConfirmationError(
          criticalActionConfig.confirmationMismatchMessage
            ?? t('platformUserDetail.criticalActionConfirmationMismatch'),
        );
        return;
      }
    }

    setCriticalActionConfirmationError(null);

    if (criticalActionConfig.requirePassword) {
      setCriticalActionStep('password');
      return;
    }

    criticalActionConfig.execute();
  }

  function handleConfirmCriticalActionPassword() {
    if (criticalActionPassword.trim().length === 0) {
      setCriticalActionPasswordError(
        criticalActionConfig?.passwordRequiredMessage
          ?? t('platformUserDetail.criticalActionPasswordRequired'),
      );
      return;
    }

    setCriticalActionPasswordError(null);
    verifyCriticalActionMutation.mutate(criticalActionPassword);
  }

  return (
    <>
      <div className="p-6 max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              {user.picture_url ? (
                <img
                  src={user.picture_url}
                  alt={t('platformUserDetail.profilePictureAlt', { name: displayName })}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                  {displayInitials}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{displayName}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">@{user.username}</p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${STATUS_STYLES[user.status]}`}
          >
            {STATUS_ICONS[user.status]}
            {t(`platformUsers.status.${user.status}`)}
          </span>
        </div>

        {/* Info card */}
        <div className="rounded-lg border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 p-5">
          {isSuspendedReadOnly && (
            <div
              role="status"
              aria-live="polite"
              className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
            >
              <IconAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{t('platformUserDetail.suspendedReadonlyNotice')}</span>
            </div>
          )}
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            {t('platformUserDetail.infoTitle')}
          </h3>
          <dl className="space-y-4 text-sm">
            <div className="rounded-md bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
              <dt className="text-slate-400 dark:text-slate-500">
                {t('platformUserDetail.fullName')}
              </dt>
              <dd className="mt-1 text-base font-semibold text-slate-700 dark:text-slate-200">
                {displayName}
              </dd>
              <dd className="mt-1 text-sm text-slate-500 dark:text-slate-400">{user.email}</dd>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
              <div>
                <dt className="text-slate-400 dark:text-slate-500">
                  {t('platformUserDetail.username')}
                </dt>
                <dd className="mt-0.5 text-slate-600 dark:text-slate-300">{user.username}</dd>
              </div>
              {user.picture_url && (
                <div>
                  <dt className="text-slate-400 dark:text-slate-500">
                    {t('platformUserDetail.profilePictureUrl')}
                  </dt>
                  <dd className="mt-0.5 break-all">
                    {isSuspendedReadOnly ? (
                      <span className="text-slate-600 dark:text-slate-300">{user.picture_url}</span>
                    ) : (
                      <a
                        href={user.picture_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        {user.picture_url}
                      </a>
                    )}
                  </dd>
                </div>
              )}
              <div className={user.picture_url ? '' : 'md:col-span-2'}>
                <dt className="text-slate-400 dark:text-slate-500">{t('platformUserDetail.id')}</dt>
                <dd className="mt-0.5 font-mono text-xs text-slate-600 dark:text-slate-300 break-all">
                  {user.id}
                </dd>
              </div>
            </div>
          </dl>
        </div>

      {/* Roles card */}
      <div className="rounded-lg border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 p-5">
        <div className="flex items-center gap-2 mb-4">
          <IconShield className="w-5 h-5 text-indigo-500" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t('platformUserDetail.rolesTitle')}
          </h3>
        </div>

        {isRolesLoading ? (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-3 rounded-md bg-slate-50 px-3 py-3 text-sm text-slate-500 dark:bg-slate-800/50 dark:text-slate-400"
          >
            <span
              className="h-4 w-4 shrink-0 rounded-full border-2 border-slate-300 border-t-indigo-500 animate-spin dark:border-slate-600 dark:border-t-indigo-400"
              aria-hidden="true"
            />
            <span>{t('platformUserDetail.loadingRoles')}</span>
          </div>
        ) : userRoles.length === 0 ? (
          <p className="text-sm text-slate-400">{t('platformUserDetail.noRoles')}</p>
        ) : (
          <ul className="space-y-2">
            {userRoles.map((role) => (
              <li
                key={role.assignment_id}
                className="flex items-start justify-between gap-3 rounded-md bg-slate-50 px-3 py-3 dark:bg-slate-800/50"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {role.role_name || getFallbackRoleLabel(role.role_code)}
                    </span>
                    <span className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[11px] text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      {role.role_code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{role.description}</p>
                  {(role.contractor || role.contractor_id || role.tenant_id) && (
                    <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                      {role.contractor?.display_name && (
                        <>
                          <p>
                            {t('platformUserDetail.contractorName', {
                              value: role.contractor.display_name,
                            })}
                          </p>
                        </>
                      )}
                      {role.contractor?.billing_email && (
                        <>
                          <p>
                            {t('platformUserDetail.contractorBillingEmail', {
                              value: role.contractor.billing_email,
                            })}
                          </p>
                        </>
                      )}
                      {role.contractor_id && (
                        <p className="font-mono">
                          {t('platformUserDetail.contractorId', { id: role.contractor_id })}
                        </p>
                      )}
                      {role.tenant_id && (
                        <p className="font-mono">
                          {t('platformUserDetail.tenantId', { id: role.tenant_id })}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 dark:text-slate-500">
                    <span>
                      {t('platformUserDetail.roleAssignedAt', {
                        date: new Date(role.assigned_at).toLocaleDateString(),
                      })}
                    </span>
                    <span>{t('platformUserDetail.roleScope', { scope: role.scope_type })}</span>
                    <span className="font-mono">
                      {t('platformUserDetail.roleId', { id: role.role_id })}
                    </span>
                    <span className="font-mono">
                      {t('platformUserDetail.assignmentId', { id: role.assignment_id })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => revokeRoleMutation.mutate(role.role_code)}
                  disabled={isSuspendedReadOnly || revokeRoleMutation.isPending}
                  className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-red-500"
                  aria-label={t('platformUserDetail.revokeRole', { role: role.role_code })}
                >
                  <IconTrash className="w-4 h-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Assign new role */}
        <div className="mt-4">
          {isRoleCatalogLoading ? (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-3 rounded-md bg-slate-50 px-3 py-3 text-sm text-slate-500 dark:bg-slate-800/50 dark:text-slate-400"
            >
              <span
                className="h-4 w-4 shrink-0 rounded-full border-2 border-slate-300 border-t-indigo-500 animate-spin dark:border-slate-600 dark:border-t-indigo-400"
                aria-hidden="true"
              />
              <span>{t('platformUserDetail.loadingRoleCatalog')}</span>
            </div>
          ) : isRoleCatalogError ? (
            <div
              role="alert"
              aria-live="assertive"
              className="flex items-center gap-3 rounded-md border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300"
            >
              <IconXCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{t('platformUserDetail.roleCatalogError')}</span>
            </div>
          ) : isSuspendedReadOnly ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {t('platformUserDetail.suspendedReadonlyNotice')}
            </p>
          ) : availableRoles.length > 0 ? (
            <div className="flex items-center gap-2">
              <select
                value={roleToAssign}
                onChange={(e) => setRoleToAssign(e.target.value)}
                disabled={isSuspendedReadOnly}
                className="flex-1 text-sm rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label={t('platformUserDetail.selectRole')}
              >
                <option value="">{t('platformUserDetail.selectRolePlaceholder')}</option>
                {availableRoles.map((role) => (
                  <option key={role.id} value={role.code}>
                    {`${getCatalogRoleLabel(role)} (${role.code})`}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAssignRole}
                disabled={isSuspendedReadOnly || !roleToAssign || assignRoleMutation.isPending || isCriticalActionPending}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                aria-label={t('platformUserDetail.assignRole')}
              >
                <IconPlus className="w-3.5 h-3.5" aria-hidden="true" />
                {t('platformUserDetail.assignRoleButton')}
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {t('platformUserDetail.noAssignableRoles')}
            </p>
          )}
        </div>
      </div>

        {/* Actions */}
        <div className="flex gap-3">
          {user.status === 'ACTIVE' && (
            <button
              onClick={handleOpenSuspendAction}
              disabled={suspendMutation.isPending || isCriticalActionPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              <IconXCircle className="w-4 h-4" aria-hidden="true" />
              {t('platformUserDetail.suspendAction')}
            </button>
          )}
          {(user.status === 'SUSPENDED' || user.status === 'PENDING') && (
            <button
              onClick={handleOpenActivateAction}
              disabled={activateMutation.isPending || isCriticalActionPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              <IconCheckCircle className="w-4 h-4" aria-hidden="true" />
              {t('platformUserDetail.activateAction')}
            </button>
          )}
        </div>
      </div>
      <CriticalActionConfirmationModal
        isOpen={criticalActionConfig !== null}
        step={criticalActionStep}
        requirePassword={criticalActionConfig?.requirePassword ?? false}
        requireTypedConfirmation={criticalActionConfig?.requireTypedConfirmation ?? false}
        texts={
          criticalActionConfig?.texts ?? {
            warningTitle: '',
            warningDescription: '',
            continueLabel: '',
            cancelLabel: '',
            submitLabel: '',
          }
        }
        actionIcon={criticalActionConfig?.actionIcon}
        confirmationValue={criticalActionConfirmationValue}
        confirmationErrorMessage={criticalActionConfirmationError}
        password={criticalActionPassword}
        passwordErrorMessage={criticalActionPasswordError}
        isPending={isCriticalActionPending}
        onConfirmationChange={(value) => {
          setCriticalActionConfirmationValue(value);
          if (criticalActionConfirmationError) setCriticalActionConfirmationError(null);
        }}
        onPasswordChange={(value) => {
          setCriticalActionPassword(value);
          if (criticalActionPasswordError) setCriticalActionPasswordError(null);
        }}
        onClose={closeCriticalActionModal}
        onBack={() => {
          setCriticalActionStep('warning');
          setCriticalActionPassword('');
          setCriticalActionPasswordError(null);
        }}
        onContinue={handleContinueCriticalAction}
        onSubmit={handleConfirmCriticalActionPassword}
      />
    </>
  );
}
