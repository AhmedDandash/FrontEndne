/**
 * General Vouchers — unified voucher module (api/Accounting/GeneralVoucher).
 *
 * Replaces nothing: the legacy ReceiptVoucher/PaymentVoucher APIs are preserved
 * and their screens are untouched. This module adds six voucher types under one
 * entity, with account-based journal integration and multi-line support.
 *
 * VERIFIED AGAINST THE LIVE API (2026-07-17) — swagger publishes NO response
 * schema for this module (every read endpoint declares a bare `200: OK`), so
 * every field below was read off real responses, not the spec:
 *   • Enums are NUMBERS, and each comes with a `*Name` string companion
 *     (voucherTypeName, paymentMethodName) already localised by the backend.
 *   • The list envelope is `{ items, totalCount, pageNumber, pageSize }` — but
 *     `pageSize` echoes the RETURNED ROW COUNT, not the requested size
 *     (PageSize=50 over 8 rows → pageSize: 8; empty list → 0). Drive the pager
 *     off `totalCount` and the requested size only. See GeneralVoucherService.
 *   • `journalEntryId` / `accountingDocumentId` / `status` are null until the
 *     backend links a journal entry.
 *   • The trace endpoint reports `documentType: 8` for general vouchers, which
 *     is what distinguishes them from legacy Receipt(1)/Payment(2) documents.
 */

// ── Voucher type (numeric enum, 1-6) ────────────────────────────────────────
export const GENERAL_VOUCHER_TYPE = {
  Receipt: 1,
  Payment: 2,
  ContractPayment: 3,
  MultiplePayment: 4,
  WorkerPayment: 5,
  ForeignCurrencyPayment: 6,
} as const;

export type GeneralVoucherType =
  (typeof GENERAL_VOUCHER_TYPE)[keyof typeof GENERAL_VOUCHER_TYPE];

/** URL slug ⇄ enum, for `/accounting/general-vouchers/new/[type]`. */
export const VOUCHER_TYPE_SLUGS: Record<string, GeneralVoucherType> = {
  receipt: GENERAL_VOUCHER_TYPE.Receipt,
  payment: GENERAL_VOUCHER_TYPE.Payment,
  'contract-payment': GENERAL_VOUCHER_TYPE.ContractPayment,
  'multiple-payment': GENERAL_VOUCHER_TYPE.MultiplePayment,
  'worker-payment': GENERAL_VOUCHER_TYPE.WorkerPayment,
  'foreign-currency': GENERAL_VOUCHER_TYPE.ForeignCurrencyPayment,
};

export const VOUCHER_TYPE_TO_SLUG: Record<number, string> = Object.fromEntries(
  Object.entries(VOUCHER_TYPE_SLUGS).map(([slug, type]) => [type, slug])
);

// ── Payment method (numeric enum, 1-5) ──────────────────────────────────────
// Extended by this module: legacy vouchers only ever emit 1-3.
export const GENERAL_PAYMENT_METHOD = {
  Cash: 1,
  Bank: 2,
  Card: 3,
  Transfer: 4,
  Cheque: 5,
} as const;

// ── Read model ──────────────────────────────────────────────────────────────
export interface GeneralVoucherLine {
  id?: string;
  accountId: string;
  accountCode?: string | null;
  accountName?: string | null;
  debit: number;
  credit: number;
  notes?: string | null;
}

export interface GeneralVoucherDto {
  id: string;
  voucherSerialNumber: number | null;
  voucherNumber: string | null;
  voucherDate: string;
  voucherType: number;
  voucherTypeName: string | null;
  paymentMethod: number | null;
  paymentMethodName: string | null;

  amount: number;
  vatAmount: number | null;
  totalAmount: number | null;
  notes: string | null;
  attachmentPath: string | null;

  beneficiaryId: string | null;
  beneficiaryType: string | null;
  beneficiaryName: string | null;

  debitAccountId: string | null;
  debitAccountCode: string | null;
  debitAccountName: string | null;
  creditAccountId: string | null;
  creditAccountCode: string | null;
  creditAccountName: string | null;
  fromAccountId: string | null;
  fromAccountCode: string | null;
  fromAccountName: string | null;
  toAccountId: string | null;
  toAccountCode: string | null;
  toAccountName: string | null;

  contractId: string | null;
  contractType: string | null;
  operationType: string | null;
  workerId: string | null;
  workerName: string | null;

  foreignCurrency: string | null;
  foreignCurrencyAmount: number | null;
  exchangeRate: number | null;
  amountInSar: number | null;
  amountDeducted: number | null;
  exchangeDifference: number | null;

  /** Null until the backend links the draft journal entry. */
  journalEntryId: string | null;
  accountingDocumentId: string | null;
  /** Journal posting status (0=Draft,1=Posted,2=PendingApproval,3=Cancelled). */
  status: number | null;

  lines: GeneralVoucherLine[];
  createdDate: string | null;
  createdBy: string | null;
}

// ── Write model ─────────────────────────────────────────────────────────────
export interface GeneralVoucherLineInputDto {
  accountId: string;
  debit: number;
  credit: number;
  notes?: string;
}

/**
 * Create/update payload. Swagger marks nearly everything nullable, but live
 * FluentValidation makes fields CONDITIONALLY REQUIRED per voucherType:
 *   • types 1/2/5 → beneficiaryId, debitAccountId, creditAccountId
 *   • type 3      → contractType, fromAccountId, toAccountId
 *   • type 4      → balanced `lines`
 * Do not treat `?` here as "the server accepts it missing".
 */
export interface CreateGeneralVoucherDto {
  voucherNumber?: string;
  voucherDate: string;
  voucherType: number;
  paymentMethod?: number | null;
  amount: number;
  vatAmount?: number;
  totalAmount?: number;
  notes?: string;
  attachmentPath?: string;

  beneficiaryId?: string;
  beneficiaryType?: string;
  beneficiaryName?: string;

  debitAccountId?: string;
  creditAccountId?: string;
  fromAccountId?: string;
  toAccountId?: string;

  contractId?: string;
  contractType?: string;
  operationType?: string;
  workerId?: string;

  foreignCurrency?: string;
  foreignCurrencyAmount?: number;
  exchangeRate?: number;
  amountInSar?: number;
  amountDeducted?: number;
  exchangeDifference?: number;

  lines?: GeneralVoucherLineInputDto[];
}

export type UpdateGeneralVoucherDto = CreateGeneralVoucherDto;

// ── Filters ─────────────────────────────────────────────────────────────────
/** Query params are PascalCase on this module's list/export endpoints. */
export interface GeneralVoucherFilterDto {
  voucherNumber?: string;
  voucherType?: number;
  dateFrom?: string;
  dateTo?: string;
  contractId?: string;
  workerId?: string;
  paymentMethod?: number;
  amountFrom?: number;
  amountTo?: number;
  status?: number;
  branchId?: string;
  includeSubBranches?: boolean;
  search?: string;
  createdDateFrom?: string;
  createdDateTo?: string;
  updatedDateFrom?: string;
  updatedDateTo?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
}

// ── Supporting responses ────────────────────────────────────────────────────
export interface GeneralVoucherPagedResult {
  items: GeneralVoucherDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

/** GET /types and /payment-methods — both return this shape. */
export interface VoucherLookupOption {
  value: number;
  nameEn: string;
  nameAr: string;
}

/** POST /validate-balance. Arithmetic only — see the service doc comment. */
export interface GeneralVoucherBalanceValidationDto {
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  errorMessage: string | null;
}

/** GET /{id}/print. */
export interface GeneralVoucherPrintDto {
  voucher: GeneralVoucherDto;
  branchName: string | null;
  printedAt: string | null;
  journalLines: GeneralVoucherLine[];
}
