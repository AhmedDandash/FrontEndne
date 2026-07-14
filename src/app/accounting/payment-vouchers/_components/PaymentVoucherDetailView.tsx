'use client';

/**
 * Presentational payment-voucher detail body — extracted from the former
 * inline "Detail Drawer" in page.tsx so it has exactly one implementation,
 * shared by the `[id]` route page (Phase 2, mirroring Phase 1's contracts).
 * Takes already-fetched data — no fetching here.
 */
import React from 'react';
import { Button, Tag } from 'antd';
import { AuditOutlined } from '@ant-design/icons';
import type { PaymentVoucher } from '@/types/api.types';
import { renderPaymentMethod, renderJournalLink, t as tr } from '../../_lib/accountingDocDisplay';
import styles from '../../accounting-doc.module.css';

export interface PaymentVoucherDetailViewProps {
  voucher: PaymentVoucher;
  isAr: boolean;
  /** Optional — pass to also render an inline "View Audit Trail" button here. */
  onOpenTrace?: (id: string) => void;
}

export default function PaymentVoucherDetailView({
  voucher,
  isAr,
  onOpenTrace,
}: PaymentVoucherDetailViewProps) {
  const t = (ar: string, en: string) => tr(isAr, ar, en);

  return (
    <>
      <div className={styles.facts}>
        <div className={styles.factItem}>
          <div className={styles.factLabel}>{t('رقم السند', 'Voucher No.')}</div>
          <div className={styles.factValue}>{voucher.voucherNumber || '—'}</div>
        </div>
        <div className={styles.factItem}>
          <div className={styles.factLabel}>{t('التاريخ', 'Date')}</div>
          <div className={styles.factValue}>
            {voucher.voucherDate ? new Date(voucher.voucherDate).toLocaleDateString() : '—'}
          </div>
        </div>
        <div className={styles.factItem}>
          <div className={styles.factLabel}>{t('المبلغ', 'Amount')}</div>
          <div className={styles.factValue}>{voucher.amount?.toLocaleString()}</div>
        </div>
        <div className={styles.factItem}>
          <div className={styles.factLabel}>{t('طريقة الدفع', 'Payment')}</div>
          <div className={styles.factValue}>{renderPaymentMethod(voucher.paymentMethod, isAr)}</div>
        </div>
        <div className={styles.factItem}>
          <div className={styles.factLabel}>{t('نوع المستفيد', 'Payee Type')}</div>
          <div className={styles.factValue}>{voucher.payeeType ? <Tag>{voucher.payeeType}</Tag> : '—'}</div>
        </div>
        <div className={styles.factItem}>
          <div className={styles.factLabel}>{t('القيد المحاسبي', 'Journal')}</div>
          <div className={styles.factValue}>{renderJournalLink(voucher.journalEntryId, isAr)}</div>
        </div>
      </div>
      {voucher.notes && (
        <div style={{ marginBottom: 12, padding: '8px 12px', background: '#e6f4ff', borderRadius: 6, color: '#0958d9', fontSize: 13 }}>
          {voucher.notes}
        </div>
      )}
      {onOpenTrace && (
        <Button block icon={<AuditOutlined />} onClick={() => onOpenTrace(voucher.id)} style={{ marginTop: 8 }}>
          {t('عرض سلسلة التتبع', 'View Audit Trail')}
        </Button>
      )}
    </>
  );
}
