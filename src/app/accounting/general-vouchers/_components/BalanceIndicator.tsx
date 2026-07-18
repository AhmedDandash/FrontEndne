'use client';

import { Alert } from 'antd';
import { CheckCircleFilled, WarningFilled } from '@ant-design/icons';
import { formatMoney, t as tr } from '../_lib/generalVoucherDisplay';

export interface BalanceIndicatorProps {
  totalDebit: number;
  totalCredit: number;
  isAr: boolean;
}

/**
 * Debit/credit balance readout for the multi-line voucher grid.
 *
 * Computed client-side from the current rows rather than from the server's
 * /validate-balance response: the totals must update on every keystroke, and
 * the server endpoint is purely arithmetic anyway (verified live — it accepts
 * bogus accounts and negative amounts), so a round-trip would add latency
 * without adding correctness. The server check still runs on submit.
 */
export default function BalanceIndicator({
  totalDebit,
  totalCredit,
  isAr,
}: BalanceIndicatorProps) {
  const t = (ar: string, en: string) => tr(isAr, ar, en);
  const difference = totalDebit - totalCredit;
  // Tolerance for float drift on 2-decimal money values.
  const isBalanced = Math.abs(difference) < 0.005;

  return (
    <Alert
      type={isBalanced ? 'success' : 'warning'}
      showIcon
      icon={isBalanced ? <CheckCircleFilled /> : <WarningFilled />}
      title={
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
          <span>
            {t('إجمالي المدين', 'Total Debit')}:{' '}
            <strong style={{ fontFamily: 'monospace' }}>{formatMoney(totalDebit)}</strong>
          </span>
          <span>
            {t('إجمالي الدائن', 'Total Credit')}:{' '}
            <strong style={{ fontFamily: 'monospace' }}>{formatMoney(totalCredit)}</strong>
          </span>
          <span>
            {isBalanced ? (
              <strong style={{ color: '#389e0d' }}>{t('متوازن', 'Balanced')}</strong>
            ) : (
              <strong style={{ color: '#d46b08' }}>
                {t('الفرق', 'Difference')}: {formatMoney(Math.abs(difference))}
              </strong>
            )}
          </span>
        </div>
      }
    />
  );
}
