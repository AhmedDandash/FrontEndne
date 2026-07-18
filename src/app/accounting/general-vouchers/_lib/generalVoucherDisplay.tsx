import { Tag } from 'antd';
import {
  WalletOutlined,
  ExportOutlined,
  FileProtectOutlined,
  UnorderedListOutlined,
  UserOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { GENERAL_VOUCHER_TYPE } from '@/types/general-voucher.types';

/**
 * Display helpers for the General Vouchers module.
 *
 * Kept separate from `../_lib/accountingDocDisplay` on purpose: that module is
 * shared by the four legacy document screens and only knows payment methods
 * 1-3, whereas this module adds Transfer(4) and Cheque(5). Journal-status and
 * journal-link rendering are NOT duplicated here — those are imported from the
 * shared helper, since the semantics are identical.
 */

export const t = (isAr: boolean, ar: string, en: string) => (isAr ? ar : en);

// ── Voucher type (1-6) ──────────────────────────────────────────────────────
export const VOUCHER_TYPE_META: Record<
  number,
  { ar: string; en: string; color: string; icon: React.ReactNode }
> = {
  [GENERAL_VOUCHER_TYPE.Receipt]: {
    ar: 'سند قبض',
    en: 'Receipt Voucher',
    color: 'green',
    icon: <WalletOutlined />,
  },
  [GENERAL_VOUCHER_TYPE.Payment]: {
    ar: 'سند صرف',
    en: 'Payment Voucher',
    color: 'volcano',
    icon: <ExportOutlined />,
  },
  [GENERAL_VOUCHER_TYPE.ContractPayment]: {
    ar: 'سند صرف عقد',
    en: 'Contract Payment',
    color: 'blue',
    icon: <FileProtectOutlined />,
  },
  [GENERAL_VOUCHER_TYPE.MultiplePayment]: {
    ar: 'سند صرف متعدد',
    en: 'Multiple Payment',
    color: 'purple',
    icon: <UnorderedListOutlined />,
  },
  [GENERAL_VOUCHER_TYPE.WorkerPayment]: {
    ar: 'سند صرف عامل',
    en: 'Worker Payment',
    color: 'cyan',
    icon: <UserOutlined />,
  },
  [GENERAL_VOUCHER_TYPE.ForeignCurrencyPayment]: {
    ar: 'سند صرف عملة أجنبية',
    en: 'Foreign Currency Payment',
    color: 'gold',
    icon: <DollarOutlined />,
  },
};

export function voucherTypeLabel(type: number | null | undefined, isAr: boolean) {
  if (!type) return '—';
  const meta = VOUCHER_TYPE_META[type];
  return meta ? (isAr ? meta.ar : meta.en) : String(type);
}

/**
 * `typeName` is the backend-supplied label — preferred when present so the UI
 * follows the server's own naming, with the local map as the fallback.
 */
export function renderVoucherType(
  type: number | null | undefined,
  isAr: boolean,
  typeName?: string | null
) {
  if (!type) return <span style={{ color: '#9ca3af' }}>—</span>;
  const meta = VOUCHER_TYPE_META[type];
  if (!meta) return <Tag>{typeName || type}</Tag>;
  return (
    <Tag color={meta.color} icon={meta.icon}>
      {isAr ? meta.ar : meta.en}
    </Tag>
  );
}

export const VOUCHER_TYPE_OPTIONS = (isAr: boolean) =>
  Object.entries(VOUCHER_TYPE_META).map(([value, meta]) => ({
    value: Number(value),
    label: isAr ? meta.ar : meta.en,
  }));

// ── Payment method (1-5 — extends the legacy 1-3) ───────────────────────────
const PAYMENT_METHOD_MAP: Record<number, { ar: string; en: string; color: string }> = {
  1: { ar: 'نقدي', en: 'Cash', color: 'green' },
  2: { ar: 'بنك', en: 'Bank', color: 'blue' },
  3: { ar: 'بطاقة', en: 'Card', color: 'purple' },
  4: { ar: 'تحويل', en: 'Transfer', color: 'geekblue' },
  5: { ar: 'شيك', en: 'Cheque', color: 'orange' },
};

export function renderVoucherPaymentMethod(
  method: number | null | undefined,
  isAr: boolean,
  methodName?: string | null
) {
  if (!method) return <span style={{ color: '#9ca3af' }}>—</span>;
  const m = PAYMENT_METHOD_MAP[method];
  return m ? <Tag color={m.color}>{isAr ? m.ar : m.en}</Tag> : <Tag>{methodName || method}</Tag>;
}

export const VOUCHER_PAYMENT_METHOD_OPTIONS = (isAr: boolean) =>
  Object.entries(PAYMENT_METHOD_MAP).map(([value, m]) => ({
    value: Number(value),
    label: isAr ? m.ar : m.en,
  }));

// ── Contract type (string field on the DTO, not a numeric enum) ─────────────
export const CONTRACT_TYPE_OPTIONS = (isAr: boolean) => [
  { value: 'Operating', label: t(isAr, 'عقد تشغيل', 'Operating') },
  { value: 'Mediation', label: t(isAr, 'عقد استقدام', 'Mediation') },
  { value: 'Transfer', label: t(isAr, 'عقد نقل كفالة', 'Transfer') },
];

export const BENEFICIARY_TYPE_OPTIONS = (isAr: boolean) => [
  { value: 'Customer', label: t(isAr, 'عميل', 'Customer') },
  { value: 'Agent', label: t(isAr, 'وكيل', 'Agent') },
  { value: 'Worker', label: t(isAr, 'عامل', 'Worker') },
  { value: 'Employee', label: t(isAr, 'موظف', 'Employee') },
  { value: 'Other', label: t(isAr, 'أخرى', 'Other') },
];

// ── Money formatting ────────────────────────────────────────────────────────
export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Which fields each voucher type actually uses. Single source of truth for
 * per-type form rendering, DTO construction, and detail display — so a form
 * and its payload can't disagree about what a type requires.
 *
 * Mirrors the live FluentValidation rules verified on 2026-07-17.
 */
export interface VoucherTypeShape {
  beneficiary: boolean;
  debitCreditAccounts: boolean;
  fromToAccounts: boolean;
  contract: boolean;
  operationType: boolean;
  worker: boolean;
  lines: boolean;
  foreignCurrency: boolean;
}

export function getVoucherTypeShape(type: number): VoucherTypeShape {
  const base: VoucherTypeShape = {
    beneficiary: false,
    debitCreditAccounts: false,
    fromToAccounts: false,
    contract: false,
    operationType: false,
    worker: false,
    lines: false,
    foreignCurrency: false,
  };

  switch (type) {
    case GENERAL_VOUCHER_TYPE.Receipt:
    case GENERAL_VOUCHER_TYPE.Payment:
      return { ...base, beneficiary: true, debitCreditAccounts: true };
    case GENERAL_VOUCHER_TYPE.ContractPayment:
      return { ...base, contract: true, fromToAccounts: true, operationType: true };
    case GENERAL_VOUCHER_TYPE.MultiplePayment:
      return { ...base, lines: true };
    case GENERAL_VOUCHER_TYPE.WorkerPayment:
      return { ...base, worker: true, debitCreditAccounts: true };
    case GENERAL_VOUCHER_TYPE.ForeignCurrencyPayment:
      return {
        ...base,
        beneficiary: true,
        contract: true,
        debitCreditAccounts: true,
        foreignCurrency: true,
      };
    default:
      return base;
  }
}
