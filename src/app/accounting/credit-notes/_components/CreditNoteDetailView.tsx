'use client';

/**
 * Presentational credit-note detail body — extracted from the former inline
 * "Detail Drawer" in page.tsx so it has exactly one implementation, shared by
 * the `[id]` route page (Phase 2, mirroring Phase 1's contracts). Takes
 * already-fetched data — no fetching here.
 */
import React from 'react';
import { Button } from 'antd';
import { AuditOutlined } from '@ant-design/icons';
import type { CreditNote } from '@/types/api.types';
import { renderJournalLink, t as tr } from '../../_lib/accountingDocDisplay';
import styles from '../../accounting-doc.module.css';

export interface CreditNoteDetailViewProps {
  note: CreditNote;
  isAr: boolean;
  /** Optional — pass to also render an inline "View Audit Trail" button here. */
  onOpenTrace?: (id: string) => void;
}

export default function CreditNoteDetailView({ note, isAr, onOpenTrace }: CreditNoteDetailViewProps) {
  const t = (ar: string, en: string) => tr(isAr, ar, en);

  return (
    <>
      <div className={styles.facts}>
        <div className={styles.factItem}>
          <div className={styles.factLabel}>{t('رقم الإشعار', 'Note No.')}</div>
          <div className={styles.factValue}>{note.creditNoteNumber || '—'}</div>
        </div>
        <div className={styles.factItem}>
          <div className={styles.factLabel}>{t('التاريخ', 'Date')}</div>
          <div className={styles.factValue}>
            {note.creditNoteDate ? new Date(note.creditNoteDate).toLocaleDateString() : '—'}
          </div>
        </div>
        <div className={styles.factItem}>
          <div className={styles.factLabel}>{t('المبلغ', 'Amount')}</div>
          <div className={styles.factValue}>{note.amount?.toLocaleString()}</div>
        </div>
        <div className={styles.factItem}>
          <div className={styles.factLabel}>{t('ضريبة القيمة', 'VAT')}</div>
          <div className={styles.factValue}>{note.vatAmount?.toLocaleString() || '—'}</div>
        </div>
        <div className={styles.factItem}>
          <div className={styles.factLabel}>{t('السبب', 'Reason')}</div>
          <div className={styles.factValue}>{note.reason || '—'}</div>
        </div>
        <div className={styles.factItem}>
          <div className={styles.factLabel}>{t('القيد المحاسبي', 'Journal')}</div>
          <div className={styles.factValue}>{renderJournalLink(note.journalEntryId, isAr)}</div>
        </div>
      </div>
      {note.notes && (
        <div style={{ marginBottom: 12, padding: '8px 12px', background: '#e6f4ff', borderRadius: 6, color: '#0958d9', fontSize: 13 }}>
          {note.notes}
        </div>
      )}
      {onOpenTrace && (
        <Button block icon={<AuditOutlined />} onClick={() => onOpenTrace(note.id)} style={{ marginTop: 8 }}>
          {t('عرض سلسلة التتبع', 'View Audit Trail')}
        </Button>
      )}
    </>
  );
}
