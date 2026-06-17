'use client';

import { IdcardOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { PartyLedgerView } from '../_components/PartyLedgerView';

export default function WorkerLedgerPage() {
  const isAr = useAuthStore((s) => s.language) !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  return (
    <PartyLedgerView
      kind="worker"
      icon={<IdcardOutlined />}
      title={t('كشف حساب العامل', 'Worker Ledger')}
      subtitle={t(
        'حركات الحسابات المرتبطة بعامل محدد خلال فترة',
        'Account movements linked to a specific worker over a period'
      )}
      idLabel={t('اختر العامل', 'Select a worker')}
    />
  );
}
