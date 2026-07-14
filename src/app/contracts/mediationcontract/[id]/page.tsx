'use client';

/**
 * Mediation contract detail route — Phase 1 of the modal→route migration.
 * Renders the same `MediationContractDetailView` the list page's Journal
 * Entry "Go to source" flow used to open in a full-screen modal.
 */
import React from 'react';
import { Badge } from 'antd';
import { useAuthStore } from '@/store/authStore';
import { useMediationContract } from '@/hooks/api/useMediationContracts';
import RecordDetailShell from '@/components/record-detail/RecordDetailShell';
import MediationContractDetailView from '../_components/MediationContractDetailView';
import { getStatusConfigFromName } from '../_lib/format';

const LIST_ROUTE = '/contracts/mediationcontract';

function isNotFoundError(error: unknown): boolean {
  return (error as { response?: { status?: number } } | undefined)?.response?.status === 404;
}

export default function MediationContractDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const language = useAuthStore((state) => state.language);
  const isRtl = language === 'ar';

  const { data: contract, isLoading, isError, error, refetch } = useMediationContract(id);

  const t = {
    contracts: isRtl ? 'عقود الاستقدام' : 'Mediation Contracts',
  };

  const notFound = isError && isNotFoundError(error);
  const genericError = isError && !notFound;

  return (
    <RecordDetailShell
      loading={isLoading}
      error={genericError ? error : undefined}
      notFound={notFound}
      onRetry={() => refetch()}
      breadcrumbs={[
        { label: t.contracts, href: LIST_ROUTE },
        { label: contract?.contractNumber ? `#${contract.contractNumber}` : `#${id}` },
      ]}
      backHref={LIST_ROUTE}
      title={contract?.contractNumber ? `#${contract.contractNumber}` : `#${id}`}
      status={
        contract?.statusName ? (
          <Badge
            status={getStatusConfigFromName(contract.statusName, language).color}
            text={contract.statusName}
          />
        ) : undefined
      }
    >
      {contract && <MediationContractDetailView contract={contract} language={language} />}
    </RecordDetailShell>
  );
}
