'use client';

/**
 * Worker (applicant) detail route — Phase 3 of the modal→route migration
 * (party/HR entities), mirroring Phase 1's contract routes and Phase 2's
 * accounting documents. Renders the same body the list page's "View Worker
 * Details" modal used to show.
 */
import React from 'react';
import { Tag } from 'antd';
import { useAuthStore } from '@/store/authStore';
import { useWorker } from '@/hooks/api/useWorkers';
import RecordDetailShell from '@/components/record-detail/RecordDetailShell';
import WorkerDetailView from '../_components/WorkerDetailView';
import { WORKER_SATUS, getEnumLabel } from '@/constants/enums';

const LIST_ROUTE = '/applicants';

const STATUS_COLOR: Record<number, string> = {
  1: 'success',
  2: 'processing',
  3: 'warning',
  4: 'error',
  5: 'cyan',
  6: 'default',
};

function isNotFoundError(error: unknown): boolean {
  return (error as { response?: { status?: number } } | undefined)?.response?.status === 404;
}

export default function WorkerDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const language = useAuthStore((state) => state.language);
  const isAr = language === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const { data: worker, isLoading, isError, error, refetch } = useWorker(id);

  const notFound = isError && isNotFoundError(error);
  const genericError = isError && !notFound;

  const displayName = worker
    ? (isAr ? worker.fullNameAr : worker.fullNameEn || worker.fullNameAr) || `#${id}`
    : `#${id}`;

  return (
    <RecordDetailShell
      loading={isLoading}
      error={genericError ? error : undefined}
      notFound={notFound}
      onRetry={() => refetch()}
      breadcrumbs={[
        { label: t('ادارة العمالة', 'Workers Management'), href: LIST_ROUTE },
        { label: displayName },
      ]}
      backHref={LIST_ROUTE}
      title={displayName}
      status={
        worker?.workerStatus != null ? (
          <Tag color={STATUS_COLOR[worker.workerStatus] ?? 'default'}>
            {getEnumLabel([...WORKER_SATUS], worker.workerStatus, language)}
          </Tag>
        ) : undefined
      }
    >
      {worker && <WorkerDetailView worker={worker} language={language} />}
    </RecordDetailShell>
  );
}
