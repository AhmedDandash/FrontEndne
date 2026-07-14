'use client';

/**
 * Agent detail route — Phase 3 of the modal→route migration (party/HR
 * entities), mirroring Phase 1's contract routes and Phase 2's accounting
 * documents. Renders the same body the list page's "View Agent Details"
 * modal used to show.
 */
import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { useAgent } from '@/hooks/api/useAgents';
import RecordDetailShell from '@/components/record-detail/RecordDetailShell';
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

  const { data: agent, isLoading, isError, error, refetch } = useAgent(id);

  const notFound = isError && isNotFoundError(error);
  const genericError = isError && !notFound;

  const displayName = agent ? (isAr ? agent.agentNameAr : agent.agentNameEn || agent.agentNameAr) || `#${id}` : `#${id}`;

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
      {agent && <AgentDetailView agent={agent} language={language} />}
    </RecordDetailShell>
  );
}
