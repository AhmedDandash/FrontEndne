'use client';

import { UserOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { PartyLedgerView } from '../_components/PartyLedgerView';

export default function AgentLedgerPage() {
  const isAr = useAuthStore((s) => s.language) !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  return (
    <PartyLedgerView
      kind="agent"
      icon={<UserOutlined />}
      title={t('كشف حساب الوكيل', 'Agent Ledger')}
      subtitle={t(
        'حركات الحسابات المرتبطة بوكيل محدد خلال فترة',
        'Account movements linked to a specific agent over a period'
      )}
      idLabel={t('اختر الوكيل', 'Select an agent')}
    />
  );
}
