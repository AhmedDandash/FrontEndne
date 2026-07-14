'use client';

/**
 * Sponsorship-transfer contract detail route — Phase 1 of the modal→route
 * migration. Renders the same `SponsorshipTransferDetailView` the list
 * page's card modal used to show.
 */
import React from 'react';
import { Badge } from 'antd';
import { useAuthStore } from '@/store/authStore';
import { useTransferContract } from '@/hooks/api/useTransferContracts';
import { TRANSFER_CONTRACT_STATUS, getEnumLabel } from '@/constants/enums';
import RecordDetailShell from '@/components/record-detail/RecordDetailShell';
import SponsorshipTransferDetailView from '../_components/SponsorshipTransferDetailView';
import { getStatusConfig } from '../_lib/format';

const LIST_ROUTE = '/sponsorship-transfer';

function isNotFoundError(error: unknown): boolean {
  return (error as { response?: { status?: number } } | undefined)?.response?.status === 404;
}

export default function SponsorshipTransferDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const language = useAuthStore((state) => state.language);
  const isRtl = language === 'ar';

  const { data: contract, isLoading, isError, error, refetch } = useTransferContract(id);

  const t = {
    contracts: isRtl ? 'عقود نقل الكفالة' : 'Sponsorship Transfer Contracts',
  };

  const notFound = isError && isNotFoundError(error);
  const genericError = isError && !notFound;
  const status = contract?.contractStatus ?? 1;

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
        contract ? (
          <Badge
            status={getStatusConfig(status).color}
            text={getEnumLabel(TRANSFER_CONTRACT_STATUS, status, language)}
          />
        ) : undefined
      }
    >
      {contract && <SponsorshipTransferDetailView contract={contract} language={language} />}
    </RecordDetailShell>
  );
}
