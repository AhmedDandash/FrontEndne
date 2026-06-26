import { Tag } from 'antd';
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  LinkOutlined,
  StopOutlined,
  FileExclamationOutlined,
} from '@ant-design/icons';

/**
 * Shared display helpers for the four accounting-document screens
 * (Receipt / Payment / Credit / Debit).
 *
 * IMPORTANT — verified against the live API (2026-06):
 *  • The LIST and GET-BY-ID responses do NOT include a `journalStatus` field.
 *    They only expose `journalEntryId` (null until a journal is linked).
 *  • The real Draft/Posted status lives in the TRACE response, under
 *    `document.journalStatus` (number) and `journalEntry.status` (number).
 *  • `paymentMethod` and journal `status` are numeric enums.
 */

export const t = (isAr: boolean, ar: string, en: string) => (isAr ? ar : en);

// ── Payment method (1=Cash, 2=Bank, 3=Card) ─────────────────────────────────
export const PAYMENT_METHOD_OPTIONS = (isAr: boolean) => [
  { value: 1, label: t(isAr, 'نقدي', 'Cash') },
  { value: 2, label: t(isAr, 'بنك', 'Bank') },
  { value: 3, label: t(isAr, 'بطاقة', 'Card') },
];

const PAYMENT_METHOD_MAP: Record<number, { ar: string; en: string; color: string }> = {
  1: { ar: 'نقدي', en: 'Cash', color: 'green' },
  2: { ar: 'بنك', en: 'Bank', color: 'blue' },
  3: { ar: 'بطاقة', en: 'Card', color: 'purple' },
};

export function renderPaymentMethod(method: number | null | undefined, isAr: boolean) {
  if (!method) return <span style={{ color: '#9ca3af' }}>—</span>;
  const m = PAYMENT_METHOD_MAP[method];
  return m ? <Tag color={m.color}>{isAr ? m.ar : m.en}</Tag> : <Tag>{method}</Tag>;
}

// ── Journal linkage (derived from journalEntryId — list/detail level) ────────
/**
 * The list endpoints can only tell us whether a draft journal entry was
 * created (journalEntryId present). The actual Draft/Posted state requires the
 * trace endpoint, so the list shows linkage, not posting status.
 */
export function renderJournalLink(journalEntryId: string | null | undefined, isAr: boolean) {
  return journalEntryId ? (
    <Tag icon={<LinkOutlined />} color="processing">
      {t(isAr, 'مرتبط بقيد', 'Journal linked')}
    </Tag>
  ) : (
    <Tag icon={<FileExclamationOutlined />} color="default">
      {t(isAr, 'بدون قيد', 'No journal')}
    </Tag>
  );
}

// ── Journal posting status (0=Draft,1=Posted,2=PendingApproval,3=Cancelled) ──
export function renderJournalStatus(status: number | null | undefined, isAr: boolean) {
  switch (status) {
    case 1:
      return (
        <Tag icon={<CheckCircleFilled />} color="success">
          {t(isAr, 'معمد', 'Posted')}
        </Tag>
      );
    case 2:
      return (
        <Tag icon={<ClockCircleOutlined />} color="warning">
          {t(isAr, 'بانتظار الاعتماد', 'Pending Approval')}
        </Tag>
      );
    case 3:
      return (
        <Tag icon={<StopOutlined />} color="error">
          {t(isAr, 'ملغي', 'Cancelled')}
        </Tag>
      );
    case 0:
    default:
      return (
        <Tag icon={<ClockCircleOutlined />} color="default">
          {t(isAr, 'مسودة', 'Draft')}
        </Tag>
      );
  }
}

// ── Document type (1=Receipt,2=Payment,3=Credit,4=Debit) ─────────────────────
export function documentTypeLabel(type: number | null | undefined, isAr: boolean) {
  switch (type) {
    case 1:
      return t(isAr, 'سند قبض', 'Receipt Voucher');
    case 2:
      return t(isAr, 'سند صرف', 'Payment Voucher');
    case 3:
      return t(isAr, 'إشعار دائن', 'Credit Note');
    case 4:
      return t(isAr, 'إشعار مدين', 'Debit Note');
    default:
      return '—';
  }
}
