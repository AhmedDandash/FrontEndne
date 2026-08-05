'use client';

import { useAuthStore } from '@/store/authStore';
import { useZatcaInvoiceDetail } from '@/hooks/api/useZatca';
import RecordDetailShell from '@/components/record-detail/RecordDetailShell';
import InvoiceDetailView from '../_components/InvoiceDetailView';
import { ZatcaLookupTag } from '../../_lib/zatcaDisplay';

const LIST_ROUTE = '/zatca/invoices';

function isNotFoundError(error: unknown): boolean {
  return (error as { response?: { status?: number } } | undefined)?.response?.status === 404;
}

export default function ZatcaInvoiceDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const language = useAuthStore((state) => state.language);
  const branchId = useAuthStore((state) => state.branchId);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const { data: invoice, isLoading, isError, error, refetch } = useZatcaInvoiceDetail(id, branchId ?? undefined);

  const notFound = isError && isNotFoundError(error);
  const genericError = isError && !notFound;

  const displayNumber = invoice?.invoiceNumber || `#${id.slice(0, 8)}`;

  return (
    <RecordDetailShell
      loading={isLoading}
      error={genericError ? error : undefined}
      notFound={notFound}
      onRetry={() => refetch()}
      breadcrumbs={[
        { label: t('فواتير زاتكا', 'ZATCA Invoices'), href: LIST_ROUTE },
        { label: displayNumber },
      ]}
      backHref={LIST_ROUTE}
      title={displayNumber}
      status={invoice && <ZatcaLookupTag category="submissionStatuses" value={invoice.submissionStatus} />}
    >
      {invoice && <InvoiceDetailView invoice={invoice} isAr={isAr} />}
    </RecordDetailShell>
  );
}
