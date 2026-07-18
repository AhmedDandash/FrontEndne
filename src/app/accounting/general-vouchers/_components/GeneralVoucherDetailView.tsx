'use client';

import { Card, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PaperClipOutlined } from '@ant-design/icons';
import { renderJournalLink, renderJournalStatus } from '../../_lib/accountingDocDisplay';
import {
  formatMoney,
  renderVoucherPaymentMethod,
  renderVoucherType,
  getVoucherTypeShape,
  t as tr,
} from '../_lib/generalVoucherDisplay';
import type { GeneralVoucherDto, GeneralVoucherLine } from '@/types/general-voucher.types';
import styles from '../../accounting-doc.module.css';

export interface GeneralVoucherDetailViewProps {
  voucher: GeneralVoucherDto;
  isAr: boolean;
}

/** One labelled fact in the grid. Skipped entirely when it has no value. */
function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.factItem}>
      <div className={styles.factLabel}>{label}</div>
      <div className={styles.factValue}>{children}</div>
    </div>
  );
}

function accountLabel(code: string | null, name: string | null): string {
  if (!code && !name) return '—';
  return [code, name].filter(Boolean).join(' — ');
}

/**
 * Presentational voucher detail body. Takes already-fetched data — no fetching
 * here — mirroring ReceiptVoucherDetailView from the Phase 2 record-detail work.
 *
 * Only the blocks relevant to the voucher's type are rendered, driven by the
 * same `getVoucherTypeShape` the form uses, so a Worker Payment doesn't show
 * empty foreign-currency rows.
 */
export default function GeneralVoucherDetailView({
  voucher,
  isAr,
}: GeneralVoucherDetailViewProps) {
  const t = (ar: string, en: string) => tr(isAr, ar, en);
  const shape = getVoucherTypeShape(voucher.voucherType);

  const lineColumns: ColumnsType<GeneralVoucherLine> = [
    { title: '#', key: 'index', width: 48, render: (_, __, idx) => idx + 1 },
    {
      title: t('الحساب', 'Account'),
      key: 'account',
      render: (_, record) => accountLabel(record.accountCode ?? null, record.accountName ?? null),
    },
    {
      title: t('مدين', 'Debit'),
      dataIndex: 'debit',
      key: 'debit',
      width: 140,
      align: 'right',
      render: (v: number) => (v ? formatMoney(v) : <span className={styles.muted}>—</span>),
    },
    {
      title: t('دائن', 'Credit'),
      dataIndex: 'credit',
      key: 'credit',
      width: 140,
      align: 'right',
      render: (v: number) => (v ? formatMoney(v) : <span className={styles.muted}>—</span>),
    },
    {
      title: t('ملاحظات', 'Notes'),
      dataIndex: 'notes',
      key: 'notes',
      render: (v: string | null) => v || <span className={styles.muted}>—</span>,
    },
  ];

  return (
    <>
      {/* ── Core facts ─────────────────────────────────────────── */}
      <div className={styles.facts}>
        <Fact label={t('المسلسل', 'Serial')}>
          {voucher.voucherSerialNumber != null ? `#${voucher.voucherSerialNumber}` : '—'}
        </Fact>
        <Fact label={t('رقم السند', 'Voucher No.')}>{voucher.voucherNumber || '—'}</Fact>
        <Fact label={t('التاريخ', 'Date')}>
          {voucher.voucherDate ? new Date(voucher.voucherDate).toLocaleDateString() : '—'}
        </Fact>
        <Fact label={t('النوع', 'Type')}>
          {renderVoucherType(voucher.voucherType, isAr, voucher.voucherTypeName)}
        </Fact>
        <Fact label={t('المبلغ', 'Amount')}>{formatMoney(voucher.amount)}</Fact>
        <Fact label={t('الضريبة', 'VAT')}>{formatMoney(voucher.vatAmount)}</Fact>
        <Fact label={t('الإجمالي', 'Total')}>
          <strong>{formatMoney(voucher.totalAmount)}</strong>
        </Fact>
        <Fact label={t('طريقة الدفع', 'Payment Method')}>
          {renderVoucherPaymentMethod(voucher.paymentMethod, isAr, voucher.paymentMethodName)}
        </Fact>
        <Fact label={t('الحالة', 'Status')}>
          {voucher.status != null
            ? renderJournalStatus(voucher.status, isAr)
            : renderJournalLink(voucher.journalEntryId, isAr)}
        </Fact>
      </div>

      {/* ── Beneficiary / worker / contract ────────────────────── */}
      {(shape.beneficiary || shape.worker || shape.contract) && (
        <Card size="small" title={t('الأطراف', 'Parties')} style={{ marginBottom: 16 }}>
          <div className={styles.facts}>
            {shape.beneficiary && (
              <>
                <Fact label={t('المستفيد', 'Beneficiary')}>{voucher.beneficiaryName || '—'}</Fact>
                <Fact label={t('نوع المستفيد', 'Beneficiary Type')}>
                  {voucher.beneficiaryType || '—'}
                </Fact>
              </>
            )}
            {shape.worker && (
              <Fact label={t('العامل', 'Worker')}>{voucher.workerName || '—'}</Fact>
            )}
            {shape.contract && (
              <>
                <Fact label={t('نوع العقد', 'Contract Type')}>{voucher.contractType || '—'}</Fact>
                {shape.operationType && (
                  <Fact label={t('نوع العملية', 'Operation Type')}>
                    {voucher.operationType || '—'}
                  </Fact>
                )}
              </>
            )}
          </div>
        </Card>
      )}

      {/* ── Accounts ───────────────────────────────────────────── */}
      {(shape.debitCreditAccounts || shape.fromToAccounts) && (
        <Card size="small" title={t('الحسابات', 'Accounts')} style={{ marginBottom: 16 }}>
          <div className={styles.facts}>
            {shape.debitCreditAccounts && (
              <>
                <Fact label={t('الحساب المدين', 'Debit Account')}>
                  {accountLabel(voucher.debitAccountCode, voucher.debitAccountName)}
                </Fact>
                <Fact label={t('الحساب الدائن', 'Credit Account')}>
                  {accountLabel(voucher.creditAccountCode, voucher.creditAccountName)}
                </Fact>
              </>
            )}
            {shape.fromToAccounts && (
              <>
                <Fact label={t('من حساب', 'From Account')}>
                  {accountLabel(voucher.fromAccountCode, voucher.fromAccountName)}
                </Fact>
                <Fact label={t('إلى حساب', 'To Account')}>
                  {accountLabel(voucher.toAccountCode, voucher.toAccountName)}
                </Fact>
              </>
            )}
          </div>
        </Card>
      )}

      {/* ── Foreign currency ───────────────────────────────────── */}
      {shape.foreignCurrency && (
        <Card size="small" title={t('العملة الأجنبية', 'Foreign Currency')} style={{ marginBottom: 16 }}>
          <div className={styles.facts}>
            <Fact label={t('العملة', 'Currency')}>{voucher.foreignCurrency || '—'}</Fact>
            <Fact label={t('المبلغ بالعملة', 'Foreign Amount')}>
              {formatMoney(voucher.foreignCurrencyAmount)}
            </Fact>
            <Fact label={t('سعر الصرف', 'Exchange Rate')}>{voucher.exchangeRate ?? '—'}</Fact>
            <Fact label={t('المبلغ بالريال', 'Amount in SAR')}>
              {formatMoney(voucher.amountInSar)}
            </Fact>
            <Fact label={t('المبلغ المخصوم', 'Amount Deducted')}>
              {formatMoney(voucher.amountDeducted)}
            </Fact>
            <Fact label={t('فرق العملة', 'Exchange Difference')}>
              {formatMoney(voucher.exchangeDifference)}
            </Fact>
          </div>
        </Card>
      )}

      {/* ── Journal lines ──────────────────────────────────────── */}
      {shape.lines && (
        <Card size="small" title={t('سطور القيد', 'Journal Lines')} style={{ marginBottom: 16 }}>
          <Table<GeneralVoucherLine>
            rowKey={(record, index) => record.id ?? `line-${index}`}
            size="small"
            bordered
            pagination={false}
            columns={lineColumns}
            dataSource={voucher.lines ?? []}
            scroll={{ x: 600 }}
          />
        </Card>
      )}

      {/* ── Notes / attachment ─────────────────────────────────── */}
      {voucher.notes && (
        <div
          style={{
            marginBottom: 12,
            padding: '8px 12px',
            background: '#e6f4ff',
            borderRadius: 6,
            color: '#0958d9',
            fontSize: 13,
          }}
        >
          {voucher.notes}
        </div>
      )}
      {voucher.attachmentPath && (
        <Tag icon={<PaperClipOutlined />} color="blue">
          {t('يوجد مرفق', 'Attachment available')}
        </Tag>
      )}
    </>
  );
}
