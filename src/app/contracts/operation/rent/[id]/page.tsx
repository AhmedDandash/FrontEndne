'use client';

/**
 * Operating (rent) contract detail route — Phase 1 of the modal→route migration.
 * Fetches a single contract + the lookups needed to map it, then renders the
 * same `RentContractDetailView` the list page's card modal used to show.
 */
import React, { useMemo, useState } from 'react';
import { Badge, Button } from 'antd';
import { SafetyCertificateOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useEmploymentOperatingContract } from '@/hooks/api/useEmploymentOperatingContracts';
import { useNationalities } from '@/hooks/api/useNationalities';
import { useJobs } from '@/hooks/api/useJobs';
import { useCustomers } from '@/hooks/api/useCustomers';
import RecordDetailShell from '@/components/record-detail/RecordDetailShell';
import RentContractDetailView from '../_components/RentContractDetailView';
import WorkerDeliveryRecordModal from '../_components/WorkerDeliveryRecordModal';
import { useContractActionGates } from '@/hooks/useActionPermissionGates';
import { buildNationalityResolver, buildJobResolver, buildCustomerResolver, mapContract, getStatusMeta } from '../_components/mapping';

const LIST_ROUTE = '/contracts/operation/rent';

function isNotFoundError(error: unknown): boolean {
  return (error as { response?: { status?: number } } | undefined)?.response?.status === 404;
}

export default function RentContractDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const language = useAuthStore((state) => state.language);
  const isRtl = language === 'ar';
  const contractGates = useContractActionGates();

  const { data: rawContract, isLoading, isError, error, refetch } = useEmploymentOperatingContract(id);
  const { data: jobs = [] } = useJobs();
  const { data: nationalities = [] } = useNationalities();
  const { customers = [] } = useCustomers();
  const [handoverOpen, setHandoverOpen] = useState(false);

  const contract = useMemo(() => {
    if (!rawContract) return null;
    const resolveNationality = buildNationalityResolver(nationalities as any[]);
    const resolveJob = buildJobResolver(jobs as any[]);
    const resolveCustomer = buildCustomerResolver(customers as any[]);
    return mapContract(rawContract, resolveNationality, resolveJob, resolveCustomer);
  }, [rawContract, nationalities, jobs, customers]);

  const t = {
    contracts: isRtl ? 'عقود العاملات المقيمة' : 'Operation Contracts',
    handoverReceipt: isRtl ? 'إيصال استلام موقّع' : 'Signed Handover Receipt',
  };

  const notFound = isError && isNotFoundError(error);
  const genericError = isError && !notFound;
  // Same enablement guard as the list card action: needs an assigned worker
  // and a Signed/Executing contract.
  const canCreateHandoverReceipt =
    contractGates.canUpdate &&
    !!contract?.workerId &&
    (contract?.contractStatus === 2 || contract?.contractStatus === 3);

  return (
    <>
      <RecordDetailShell
        loading={isLoading}
        error={genericError ? error : undefined}
        notFound={notFound}
        onRetry={() => refetch()}
        breadcrumbs={[
          { label: t.contracts, href: LIST_ROUTE },
          { label: contract ? `#${contract.contractNumber}` : `#${id}` },
        ]}
        backHref={LIST_ROUTE}
        title={contract ? `#${contract.contractNumber}` : `#${id}`}
        status={
          contract ? (
            <Badge
              status={getStatusMeta(contract.status, isRtl).color as any}
              text={getStatusMeta(contract.status, isRtl).label}
            />
          ) : undefined
        }
        actions={
          contract && canCreateHandoverReceipt ? (
            <Button icon={<SafetyCertificateOutlined />} onClick={() => setHandoverOpen(true)}>
              {t.handoverReceipt}
            </Button>
          ) : undefined
        }
      >
        {contract && <RentContractDetailView contract={contract} isRtl={isRtl} />}
      </RecordDetailShell>

      {contractGates.canUpdate && (
        <WorkerDeliveryRecordModal
          open={handoverOpen}
          isRtl={isRtl}
          contract={contract}
          onClose={() => setHandoverOpen(false)}
        />
      )}
    </>
  );
}
