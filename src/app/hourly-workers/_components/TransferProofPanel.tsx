'use client';

/**
 * Bank-transfer proof viewer. Shows the customer-uploaded screenshot alongside
 * the payment method / reference / amount so staff can verify before approving.
 * R2 CDN images are routed through the in-app proxy for caching + CORS.
 */

import { Image } from 'antd';
import { fmtMoney } from '../_lib/hourlyDisplay';
import styles from '../hourly-workers.module.css';

function proxied(url: string): string {
  try {
    const host = new URL(url).hostname;
    if (host.endsWith('.r2.dev')) return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  } catch {
    /* fall through */
  }
  return url;
}

interface Props {
  transferProofUrl?: string | null;
  paymentMethodName?: string | null;
  transactionReference?: string | null;
  amount?: number | null;
  isAr: boolean;
}

export default function TransferProofPanel({
  transferProofUrl,
  paymentMethodName,
  transactionReference,
  amount,
  isAr,
}: Props) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  if (!transferProofUrl) return null;

  return (
    <div className={styles.proofPanel}>
      <div className={styles.proofHeader}>{t('إثبات التحويل البنكي', 'Bank Transfer Proof')}</div>
      <div className={styles.proofFacts}>
        <div>
          <span className={styles.proofLabel}>{t('طريقة الدفع', 'Method')}: </span>
          <span className={styles.proofValue}>{paymentMethodName || t('تحويل بنكي', 'Bank Transfer')}</span>
        </div>
        <div>
          <span className={styles.proofLabel}>{t('الرقم المرجعي', 'Reference')}: </span>
          <span className={styles.proofValue}>{transactionReference || '—'}</span>
        </div>
        <div>
          <span className={styles.proofLabel}>{t('المبلغ', 'Amount')}: </span>
          <span className={styles.proofValue}>{fmtMoney(amount)}</span>
        </div>
      </div>
      <Image
        src={proxied(transferProofUrl)}
        alt={t('صورة التحويل', 'Transfer screenshot')}
        className={styles.proofImage}
        fallback="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiM5OTkiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBpbWFnZTwvdGV4dD48L3N2Zz4="
      />
    </div>
  );
}
