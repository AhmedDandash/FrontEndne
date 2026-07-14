'use client';

/**
 * Debit note detail route — Phase 2 of the modal→route migration (the 4
 * accounting documents), mirroring Phase 1's contract routes. Renders the
 * same `DebitNoteDetailView` the list page's detail drawer used to show;
 * the audit-trail trace stays a secondary drawer opened from this page
 * (not a route — see DocumentTraceDrawer below).
 */
import React, { useState } from 'react';
import { Button } from 'antd';
import { AuditOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useDebitNote, useDebitNoteTrace } from '@/hooks/api/useDebitNotes';
import RecordDetailShell from '@/components/record-detail/RecordDetailShell';
import DebitNoteDetailView from '../_components/DebitNoteDetailView';
import { DocumentTraceDrawer } from '../../_lib/DocumentTraceDrawer';

const LIST_ROUTE = '/accounting/debit-notes';

function isNotFoundError(error: unknown): boolean {
  return (error as { response?: { status?: number } } | undefined)?.response?.status === 404;
}

export default function DebitNoteDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const language = useAuthStore((state) => state.language);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const { data: note, isLoading, isError, error, refetch } = useDebitNote(id);

  const [traceOpen, setTraceOpen] = useState(false);
  const { data: traceData, isLoading: isTraceLoading } = useDebitNoteTrace(traceOpen ? id : undefined);

  const notFound = isError && isNotFoundError(error);
  const genericError = isError && !notFound;

  const displayNumber = note?.debitNoteNumber || `#${id}`;

  return (
    <>
      <RecordDetailShell
        loading={isLoading}
        error={genericError ? error : undefined}
        notFound={notFound}
        onRetry={() => refetch()}
        breadcrumbs={[
          { label: t('إشعارات المدين', 'Debit Notes'), href: LIST_ROUTE },
          { label: displayNumber },
        ]}
        backHref={LIST_ROUTE}
        title={displayNumber}
        actions={
          note && (
            <Button icon={<AuditOutlined />} onClick={() => setTraceOpen(true)}>
              {t('عرض سلسلة التتبع', 'View Audit Trail')}
            </Button>
          )
        }
      >
        {note && <DebitNoteDetailView note={note} isAr={isAr} />}
      </RecordDetailShell>

      <DocumentTraceDrawer
        open={traceOpen}
        onClose={() => setTraceOpen(false)}
        trace={traceData}
        loading={isTraceLoading}
      />
    </>
  );
}
