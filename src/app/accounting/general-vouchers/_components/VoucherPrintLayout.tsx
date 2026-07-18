'use client';

import { forwardRef } from 'react';
import {
  formatMoney,
  getVoucherTypeShape,
  t as tr,
  voucherTypeLabel,
} from '../_lib/generalVoucherDisplay';
import type { GeneralVoucherPrintDto } from '@/types/general-voucher.types';

export interface VoucherPrintLayoutProps {
  data: GeneralVoucherPrintDto;
  isAr: boolean;
}

/**
 * Sigma-style printable voucher.
 *
 * Deliberately styled with inline styles and plain table markup rather than
 * antd components or CSS modules: this subtree is rasterised by html2canvas
 * for the PDF, which does not resolve external stylesheets or CSS variables.
 * What you see inline is what lands in the file.
 */
const VoucherPrintLayout = forwardRef<HTMLDivElement, VoucherPrintLayoutProps>(
  function VoucherPrintLayout({ data, isAr }, ref) {
    const t = (ar: string, en: string) => tr(isAr, ar, en);
    const { voucher, branchName, printedAt, journalLines } = data;
    const shape = getVoucherTypeShape(voucher.voucherType);

    const cell: React.CSSProperties = {
      border: '1px solid #d9d9d9',
      padding: '8px 10px',
      fontSize: 13,
    };
    const labelCell: React.CSSProperties = {
      ...cell,
      background: '#fafafa',
      fontWeight: 600,
      width: '22%',
    };

    const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
      <tr>
        <td style={labelCell}>{label}</td>
        <td style={cell}>{value ?? '—'}</td>
      </tr>
    );

    const accountLabel = (code: string | null, name: string | null) =>
      [code, name].filter(Boolean).join(' — ') || '—';

    return (
      <div
        ref={ref}
        dir={isAr ? 'rtl' : 'ltr'}
        style={{
          width: 794, // A4 width at 96dpi — keeps the raster crisp.
          padding: 32,
          background: '#fff',
          color: '#141414',
          fontFamily: 'Tahoma, Arial, sans-serif',
        }}
      >
        {/* ── Header ───────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid #1677ff',
            paddingBottom: 12,
            marginBottom: 20,
          }}
        >
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1677ff' }}>
              {voucherTypeLabel(voucher.voucherType, isAr)}
            </div>
            {branchName && (
              <div style={{ fontSize: 13, color: '#595959', marginTop: 4 }}>{branchName}</div>
            )}
          </div>
          <div style={{ textAlign: isAr ? 'left' : 'right', fontSize: 12, color: '#595959' }}>
            <div>
              {t('رقم السند', 'Voucher No.')}:{' '}
              <strong style={{ color: '#141414' }}>
                {voucher.voucherNumber ||
                  (voucher.voucherSerialNumber != null ? `#${voucher.voucherSerialNumber}` : '—')}
              </strong>
            </div>
            <div style={{ marginTop: 4 }}>
              {t('التاريخ', 'Date')}:{' '}
              <strong style={{ color: '#141414' }}>
                {voucher.voucherDate ? new Date(voucher.voucherDate).toLocaleDateString() : '—'}
              </strong>
            </div>
          </div>
        </div>

        {/* ── Details ──────────────────────────────────────────── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
          <tbody>
            <Row label={t('المبلغ', 'Amount')} value={formatMoney(voucher.amount)} />
            <Row label={t('الضريبة', 'VAT')} value={formatMoney(voucher.vatAmount)} />
            <Row
              label={t('الإجمالي', 'Total')}
              value={<strong>{formatMoney(voucher.totalAmount)}</strong>}
            />
            <Row
              label={t('طريقة الدفع', 'Payment Method')}
              value={voucher.paymentMethodName || '—'}
            />
            {shape.beneficiary && (
              <Row label={t('المستفيد', 'Beneficiary')} value={voucher.beneficiaryName || '—'} />
            )}
            {shape.worker && (
              <Row label={t('العامل', 'Worker')} value={voucher.workerName || '—'} />
            )}
            {shape.contract && (
              <Row label={t('نوع العقد', 'Contract Type')} value={voucher.contractType || '—'} />
            )}
            {shape.debitCreditAccounts && (
              <>
                <Row
                  label={t('الحساب المدين', 'Debit Account')}
                  value={accountLabel(voucher.debitAccountCode, voucher.debitAccountName)}
                />
                <Row
                  label={t('الحساب الدائن', 'Credit Account')}
                  value={accountLabel(voucher.creditAccountCode, voucher.creditAccountName)}
                />
              </>
            )}
            {shape.fromToAccounts && (
              <>
                <Row
                  label={t('من حساب', 'From Account')}
                  value={accountLabel(voucher.fromAccountCode, voucher.fromAccountName)}
                />
                <Row
                  label={t('إلى حساب', 'To Account')}
                  value={accountLabel(voucher.toAccountCode, voucher.toAccountName)}
                />
              </>
            )}
            {shape.foreignCurrency && (
              <>
                <Row label={t('العملة', 'Currency')} value={voucher.foreignCurrency || '—'} />
                <Row
                  label={t('المبلغ بالعملة', 'Foreign Amount')}
                  value={formatMoney(voucher.foreignCurrencyAmount)}
                />
                <Row label={t('سعر الصرف', 'Exchange Rate')} value={voucher.exchangeRate ?? '—'} />
                <Row
                  label={t('المبلغ بالريال', 'Amount in SAR')}
                  value={formatMoney(voucher.amountInSar)}
                />
              </>
            )}
            {voucher.notes && <Row label={t('ملاحظات', 'Notes')} value={voucher.notes} />}
          </tbody>
        </table>

        {/* ── Journal lines ────────────────────────────────────── */}
        {journalLines?.length > 0 && (
          <>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
              {t('سطور القيد', 'Journal Lines')}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
              <thead>
                <tr>
                  <th style={{ ...cell, background: '#fafafa' }}>{t('الحساب', 'Account')}</th>
                  <th style={{ ...cell, background: '#fafafa', width: 120 }}>
                    {t('مدين', 'Debit')}
                  </th>
                  <th style={{ ...cell, background: '#fafafa', width: 120 }}>
                    {t('دائن', 'Credit')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {journalLines.map((line, idx) => (
                  <tr key={line.id ?? idx}>
                    <td style={cell}>{accountLabel(line.accountCode ?? null, line.accountName ?? null)}</td>
                    <td style={{ ...cell, textAlign: 'right' }}>
                      {line.debit ? formatMoney(line.debit) : '—'}
                    </td>
                    <td style={{ ...cell, textAlign: 'right' }}>
                      {line.credit ? formatMoney(line.credit) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* ── Signatures ───────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 48 }}>
          {[
            t('المستلم', 'Received By'),
            t('المحاسب', 'Accountant'),
            t('المدير', 'Manager'),
          ].map((label) => (
            <div key={label} style={{ textAlign: 'center', width: '30%' }}>
              <div style={{ borderTop: '1px solid #8c8c8c', paddingTop: 6, fontSize: 12 }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {printedAt && (
          <div style={{ marginTop: 24, fontSize: 11, color: '#8c8c8c', textAlign: 'center' }}>
            {t('تاريخ الطباعة', 'Printed at')}: {printedAt}
          </div>
        )}
      </div>
    );
  }
);

export default VoucherPrintLayout;
