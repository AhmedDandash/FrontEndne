/**
 * Accounting Module Type Definitions
 * Mirrors the Sigma Accounting API (Accounting.pdf, base /api/V1).
 *
 * Account code convention — the FIRST digit of `code` determines the type:
 *   1 = Asset, 2 = Liability, 3 = Equity, 4 = Revenue, 5 = OpEx, 6 = AdminEx
 */

// ==================== Chart of Accounts ====================

/** Node returned by GET /account/full-tree-structure and /account/subtree/{id}. */
export interface AccountTreeNode {
  /** GUID account identifier */
  id: string;
  /** Account code (e.g. "1002002001") */
  code: string;
  /** Display name of the account */
  name: string;
  /** True when the account has no children */
  isLeaf: boolean;
  /** Depth in the tree (root = 1) */
  level: number;
  /** Nested child accounts */
  children?: AccountTreeNode[] | null;
}

/** POST /account/create-account */
export interface CreateAccountDto {
  /** Must start with the parent's code when parentId is provided */
  code: string;
  name: string;
  /** Parent account GUID — omit for root accounts */
  parentId?: string | null;
}

/** PUT /account/update-account/{accountId} — only the name is mutable */
export interface UpdateAccountNameDto {
  name: string;
}

/**
 * AccountReportSide — which side an account is presented on in the
 * income-statement / profit-&-loss reports.
 * Backend enum (Sigma.Domain.Enums.Account.AccountReportSide):
 *   Debit = 1, Credit = 2, Hidden = 3
 * Kept permissive on the wire (number | string); display is tolerant.
 */
export type AccountReportSide = number | string;

export interface ReportSideOption {
  value: number;
  ar: string;
  en: string;
}

/** AccountReportSide options (backend: Debit=1, Credit=2, Hidden=3). */
export const ACCOUNT_REPORT_SIDES: ReportSideOption[] = [
  { value: 1, ar: 'مدين', en: 'Debit' },
  { value: 2, ar: 'دائن', en: 'Credit' },
  { value: 3, ar: 'مخفي', en: 'Hidden' },
];

/** Resolve a report-side value to a display label (tolerant of unknown values). */
export function getReportSideLabel(
  value: AccountReportSide | null | undefined,
  isAr: boolean
): string {
  if (value === null || value === undefined || value === '') return '—';
  const match = ACCOUNT_REPORT_SIDES.find((o) => String(o.value) === String(value));
  if (match) return isAr ? match.ar : match.en;
  return String(value);
}

/** PUT /account/reporting/{accountId} (UpdateAccountReportSideDto) */
export interface UpdateAccountReportSideDto {
  incomeStatementSide: AccountReportSide;
  profitLossSide: AccountReportSide;
  isGroupedInTrialBalance: boolean;
}

/** Row in GET /account/settings (PagedResponse<AccountSettingListDto>) */
export interface AccountSettingListDto {
  id: string;
  code: string;
  name: string;
  incomeStatementSide: AccountReportSide;
  profitLossSide: AccountReportSide;
  isGroupedInTrialBalance: boolean;
}

/** Query params for GET /account/settings */
export interface AccountSettingsQuery {
  searchTerm?: string;
  pageNumber?: number;
  pageSize?: number;
}

/** Generic paged envelope used by the settings endpoint */
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

// ==================== Restriction (Journal Entry) Types ====================

/**
 * AccountingEvent — the business event that triggers an automatic (event-driven)
 * journal entry. Backend enum (Sigma.Domain.Enums.Account.AccountingEvent) is
 * declared WITHOUT explicit values, so it is 0-indexed:
 *   ContractSigned=0, CustomerPayment=1, AgentCommission=2, VisaIssued=3,
 *   Arrival=4, Escape=5, Ticket=6, Transfer=7
 */
export enum AccountingEvent {
  ContractSigned = 0,
  CustomerPayment = 1,
  AgentCommission = 2,
  VisaIssued = 3,
  Arrival = 4,
  Escape = 5,
  Ticket = 6,
  Transfer = 7,
}

export interface AccountingEventOption {
  value: number;
  ar: string;
  en: string;
}

/** AccountingEvent options for selectors / labels. */
export const ACCOUNTING_EVENTS: AccountingEventOption[] = [
  { value: AccountingEvent.ContractSigned, ar: 'توقيع العقد', en: 'Contract Signed' },
  { value: AccountingEvent.CustomerPayment, ar: 'دفعة عميل', en: 'Customer Payment' },
  { value: AccountingEvent.AgentCommission, ar: 'عمولة وكيل', en: 'Agent Commission' },
  { value: AccountingEvent.VisaIssued, ar: 'إصدار تأشيرة', en: 'Visa Issued' },
  { value: AccountingEvent.Arrival, ar: 'الوصول', en: 'Arrival' },
  { value: AccountingEvent.Escape, ar: 'هروب', en: 'Escape' },
  { value: AccountingEvent.Ticket, ar: 'تذكرة', en: 'Ticket' },
  { value: AccountingEvent.Transfer, ar: 'نقل الكفالة', en: 'Transfer' },
];

/** Resolve an accounting-event value to a display label (tolerant of unknown values). */
export function getAccountingEventLabel(
  value: number | string | null | undefined,
  isAr: boolean
): string {
  if (value === null || value === undefined || value === '') return '—';
  const match = ACCOUNTING_EVENTS.find((o) => String(o.value) === String(value));
  if (match) return isAr ? match.ar : match.en;
  return String(value);
}

export interface RestrictionType {
  id: string;
  name?: string | null;
  nameAr?: string | null;
  /** Linked AccountingEvent enum value (0-indexed) for event-driven entries */
  accountingEvent?: number | string | null;
  /** True = manually created entry */
  isManual?: boolean | null;
  isActive?: boolean | null;
  defaultDebitAccountId?: string | null;
  defaultCreditAccountId?: string | null;
}

/** POST / PUT body (RestrictionTypeCreateDto) */
export interface RestrictionTypeCreateDto {
  name?: string | null;
  nameAr?: string | null;
  accountingEvent?: number | string | null;
  isManual?: boolean | null;
  isActive?: boolean | null;
  defaultDebitAccountId?: string | null;
  defaultCreditAccountId?: string | null;
}

// ==================== Account-Type Helpers ====================

export interface AccountTypeMeta {
  /** Leading digit of the account code */
  digit: string;
  ar: string;
  en: string;
  /** Colour used for tags / code accents in the UI */
  color: string;
}

/** Map of leading code digit → account-type metadata. */
export const ACCOUNT_TYPES: Record<string, AccountTypeMeta> = {
  '1': { digit: '1', ar: 'أصول', en: 'Assets', color: '#1677ff' },
  '2': { digit: '2', ar: 'خصوم', en: 'Liabilities', color: '#fa8c16' },
  '3': { digit: '3', ar: 'حقوق الملكية', en: 'Equity', color: '#722ed1' },
  '4': { digit: '4', ar: 'الإيرادات', en: 'Revenue', color: '#52c41a' },
  '5': { digit: '5', ar: 'مصاريف تشغيلية', en: 'Operating Expenses', color: '#eb2f96' },
  '6': { digit: '6', ar: 'مصروفات إدارية', en: 'Administrative Expenses', color: '#f5222d' },
};

/** Resolve the account-type metadata from an account code. */
export function getAccountType(code?: string | null): AccountTypeMeta | null {
  const digit = (code ?? '').trim().charAt(0);
  return ACCOUNT_TYPES[digit] ?? null;
}
