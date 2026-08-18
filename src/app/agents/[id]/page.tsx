'use client';

/**
 * Agent detail route — Phase 3 of the modal→route migration (party/HR
 * entities), mirroring Phase 1's contract routes and Phase 2's accounting
 * documents. Renders the same body the list page's "View Agent Details"
 * modal used to show.
 */
import React from 'react';
import { Result } from 'antd';
import { useAuthStore } from '@/store/authStore';
import { APP_PERMISSIONS } from '@/config/appPermissions';
import { resolveAgentDetailAccess } from '@/config/agentAccess';
import { useHasPermission } from '@/hooks/api/usePagePermissions';
import { useAgent, useAgentMe } from '@/hooks/api/useAgents';
import RecordDetailShell from '@/components/record-detail/RecordDetailShell';
import AccessDenied from '@/components/common/AccessDenied';
import AgentDetailView from '../_components/AgentDetailView';

const LIST_ROUTE = '/agents';

function isNotFoundError(error: unknown): boolean {
  return (error as { response?: { status?: number } } | undefined)?.response?.status === 404;
}

export default function AgentDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const language = useAuthStore((state) => state.language);
  const isAr = language === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const { has, isReady } = useHasPermission();
  const canViewAllAgents = has(APP_PERMISSIONS.AGENTS_VIEW);
  const canViewOwnAgent = has([
    APP_PERMISSIONS.AGENTS_VIEW,
    APP_PERMISSIONS.AGENTS_OWN_DATA_VIEW,
  ]);

  const allAgentQuery = useAgent(id, canViewAllAgents);
  const ownAgentQuery = useAgentMe(!canViewAllAgents && canViewOwnAgent);

  const agent = canViewAllAgents ? allAgentQuery.data : ownAgentQuery.data;
  const isLoading = canViewAllAgents ? allAgentQuery.isLoading : ownAgentQuery.isLoading;
  const isError = canViewAllAgents ? allAgentQuery.isError : ownAgentQuery.isError;
  const error = canViewAllAgents ? allAgentQuery.error : ownAgentQuery.error;
  const refetch = canViewAllAgents ? allAgentQuery.refetch : ownAgentQuery.refetch;

  const notFound = isError && isNotFoundError(error);
  const genericError = isError && !notFound;
  const detailAccess = resolveAgentDetailAccess({
    requestedId: id,
    ownAgentId: ownAgentQuery.data?.id,
    canViewAll: canViewAllAgents,
    canViewOwn: canViewOwnAgent,
    isReady,
    isLoading,
  });

  const displayName = agent ? (isAr ? agent.agentNameAr : agent.agentNameEn || agent.agentNameAr) || `#${id}` : `#${id}`;

  if (detailAccess === 'denied') {
    return <AccessDenied />;
  }

  return (
    <RecordDetailShell
      loading={isLoading}
      error={genericError ? error : undefined}
      notFound={notFound}
      onRetry={() => refetch()}
      breadcrumbs={[
        { label: t('إدارة الوكلاء', 'Agents Management'), href: LIST_ROUTE },
        { label: displayName },
      ]}
      backHref={LIST_ROUTE}
      title={displayName}
    >
      {agent ? (
        <AgentDetailView agent={agent} language={language} />
      ) : (
        <Result
          status="info"
          title={t('لا يوجد ملف وكيل مرتبط بهذا المستخدم', 'No linked agent profile')}
          subTitle={t(
            'يجب ربط حسابك بسجل وكيل قبل ظهور بيانات الوكيل.',
            'Your user account must be linked to an agent record before agent data is available.'
          )}
        />
      )}
    </RecordDetailShell>
  );
}
