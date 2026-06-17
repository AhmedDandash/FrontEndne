'use client';

import { TeamOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { PartyLedgerView } from '../_components/PartyLedgerView';

export default function CustomerLedgerPage() {
  const isAr = useAuthStore((s) => s.language) !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  return (
    <PartyLedgerView
      kind="customer"
      icon={<TeamOutlined />}
      title={t('كشف حساب العميل', 'Customer Ledger')}
      subtitle={t(
        'حركات الحسابات المرتبطة بعميل محدد خلال فترة',
        'Account movements linked to a specific customer over a period'
      )}
      idLabel={t('اختر العميل', 'Select a customer')}
    />
  );
}
