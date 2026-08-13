/**
 * Journal Entries Module Type Definitions
 * Mirrors the Sigma Accounting API (live OpenAPI /api/V1).
 *
 * Controllers:
 *   /api/V1/JournalEntries        — CRUD for entries
 *   /api/V1/Posting               — post / unpost (commit to ledger)
 *
 * Business rules (enforced server-side, mirrored in the UI):
 *   • Total debits must equal total credits (entry rejected if unbalanced).
 *   • A new entry is saved with Draft status (0) and posted separately.
 *   • Only Draft entries can be edited or deleted.
 *   • Posting commits ledger movements; unposting reverses them back to Draft.
 *   • System-generated entries may not be unpostable (business-rule dependent).
 *
 * Enum verification (live, 2026-07-12):
 *   • status/source/referenceType arrive as NUMERIC codes — there are NO
 *     `statusName`/`sourceName` companion fields, so labels are mapped here.
 *   • status values 0 and 1 are in live data (Draft / Posted); 2 and 3 exist in
 *     the enum but are unused in live data — meaning unconfirmed (rendered as a
 *     neutral fallback rather than a guessed business label).
 *   • Filtering accepts the numeric code (Status=1, Source=10) reliably; the old
 *     string labels only worked by coincidence (e.g. Source=System returned 0).
 */

// ==================== Enums ====================

/** Entry status (JournalEntryStatus). 0=Draft, 1=Posted, 2/3 reserved/unconfirmed. */
export type JournalEntryStatus = number;

/** Entry source (JournalEntrySource, 0–13). */
export type JournalEntrySource = number;

/** Reference classification (JournalReferenceType, 0–4) — drives source navigation. */
export type JournalReferenceType = number;

export const JE_STATUS = { Draft: 0, Posted: 1 } as const;

export const JE_SOURCE = {
  Manual: 0,
  CustomerPayment: 1,
  AgentPayment: 2,
  Salary: 3,
  Advance: 4,
  Visa: 5,
  Ticket: 6,
  Arrival: 7,
  Escape: 8,
  Transfer: 9,
  Contract: 10,
  Payment: 11,
  Adjustment: 12,
  System: 13,
} as const;

export const JE_REFERENCE_TYPE = {
  Manual: 0,
  Contract: 1,
  Payment: 2,
  Adjustment: 3,
  System: 4,
} as const;

export interface EnumOption {
  value: number;
  ar: string;
  en: string;
}

/** Status options for the filter dropdown (only the live/actionable values). */
export const JOURNAL_STATUSES: EnumOption[] = [
  { value: JE_STATUS.Draft, ar: 'غير معمد', en: 'Draft' },
  { value: JE_STATUS.Posted, ar: 'معمد', en: 'Posted' },
];

/** Full status label map (covers the reserved 2/3 codes for rendering). */
const STATUS_LABELS: Record<number, { ar: string; en: string }> = {
  0: { ar: 'غير معمد', en: 'Draft' },
  1: { ar: 'معمد', en: 'Posted' },
  2: { ar: 'حالة 2', en: 'Status 2' },
  3: { ar: 'حالة 3', en: 'Status 3' },
};

/** All 14 source values, Arabic + English labels. */
export const JOURNAL_SOURCES: EnumOption[] = [
  { value: 0, ar: 'يدوي', en: 'Manual' },
  { value: 1, ar: 'دفعة عميل', en: 'Customer Payment' },
  { value: 2, ar: 'دفع وكيل / عمولة', en: 'Agent Payment' },
  { value: 3, ar: 'راتب / مستحقات', en: 'Salary' },
  { value: 4, ar: 'سلفة', en: 'Advance' },
  { value: 5, ar: 'تأشيرة', en: 'Visa' },
  { value: 6, ar: 'تذكرة ترحيل', en: 'Ticket' },
  { value: 7, ar: 'وصول عاملة', en: 'Arrival' },
  { value: 8, ar: 'هروب', en: 'Escape' },
  { value: 9, ar: 'نقل كفالة', en: 'Transfer' },
  { value: 10, ar: 'عقد', en: 'Contract' },
  { value: 11, ar: 'دفع / سند', en: 'Payment' },
  { value: 12, ar: 'تسوية / إشعار', en: 'Adjustment' },
  { value: 13, ar: 'نظام', en: 'System' },
];

export const JOURNAL_REFERENCE_TYPES: EnumOption[] = [
  { value: 0, ar: 'يدوي', en: 'Manual' },
  { value: 1, ar: 'عقد', en: 'Contract' },
  { value: 2, ar: 'دفع / سند', en: 'Payment' },
  { value: 3, ar: 'تسوية / إشعار', en: 'Adjustment' },
  { value: 4, ar: 'نظام', en: 'System' },
];

/** Coerce an incoming status (number | numeric-string | legacy label) to a code. */
export function normalizeStatus(value: unknown): JournalEntryStatus {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value === 'Posted' || value === 'posted') return JE_STATUS.Posted;
  if (value === 'Draft' || value === 'draft') return JE_STATUS.Draft;
  const n = Number(value);
  return Number.isFinite(n) ? n : JE_STATUS.Draft;
}

/** Coerce an incoming source (number | numeric-string | legacy label) to a code. */
export function normalizeSource(value: unknown): JournalEntrySource {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value === 'Manual' || value === 'manual') return JE_SOURCE.Manual;
  if (value === 'System' || value === 'system') return JE_SOURCE.System;
  const n = Number(value);
  return Number.isFinite(n) ? n : JE_SOURCE.Manual;
}

export function normalizeReferenceType(value: unknown): JournalReferenceType {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : JE_REFERENCE_TYPE.Manual;
}

export function getStatusLabel(value: JournalEntryStatus, isAr: boolean): string {
  const m = STATUS_LABELS[value];
  return m ? (isAr ? m.ar : m.en) : (isAr ? `حالة ${value}` : `Status ${value}`);
}

export function getSourceLabel(value: JournalEntrySource, isAr: boolean): string {
  const m = JOURNAL_SOURCES.find((s) => s.value === value);
  return m ? (isAr ? m.ar : m.en) : (isAr ? `مصدر ${value}` : `Source ${value}`);
}

export function getReferenceTypeLabel(value: JournalReferenceType, isAr: boolean): string {
  const m = JOURNAL_REFERENCE_TYPES.find((s) => s.value === value);
  return m ? (isAr ? m.ar : m.en) : (isAr ? `مرجع ${value}` : `Ref ${value}`);
}

// ==================== Read models ====================

/** Row in GET /JournalEntries (data.items[] — JournalEntryDto). */
export interface JournalEntryListItem {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  status: JournalEntryStatus;
  source: JournalEntrySource;
  /** Reference classification — see JE_REFERENCE_TYPE. Drives source navigation. */
  referenceType: JournalReferenceType;
  /** Primary id of the document that generated this entry (null for manual). */
  sourceId: string | null;
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  restrictionTypeId?: string | null;
  /** Source contract's human serial/contract number when returned by the API. */
  sourceContractNumber?: number | string | null;
  customerId?: string | null;
  agentId?: string | null;
  workerId?: string | null;
  employeeId?: string | null;
}

/** Line inside a journal entry detail (GET /JournalEntries/{id} → data.lines[]). */
export interface JournalEntryLineDetail {
  id?: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string | null;
  restrictionTypeId?: number | null;
}

/** Full detail from GET /JournalEntries/{id}. */
export interface JournalEntryDetail extends JournalEntryListItem {
  createdBy?: string | null;
  createdDate?: string | null;
  lines: JournalEntryLineDetail[];
}

// ==================== Write models ====================

/** A single debit/credit line in the create/update body (JournalEntryLineCreateDto). */
export interface JournalEntryLineInput {
  accountId: string;
  /** Debit amount (0 if this is a credit line). */
  debit: number;
  /** Credit amount (0 if this is a debit line). */
  credit: number;
  description?: string | null;
}

/** POST / PUT body (shared). Minimum 2 lines; debits must equal credits. */
export interface JournalEntryInput {
  date: string;
  description: string;
  customerId?: string | null;
  agentId?: string | null;
  workerId?: string | null;
  employeeId?: string | null;
  restrictionTypeId?: string | null;
  lines: JournalEntryLineInput[];
}

// ==================== Query / paging ====================

/** Query params for GET /JournalEntries (mirrors the live OpenAPI param set). */
export interface JournalEntriesQuery {
  pageNumber?: number;
  pageSize?: number;
  from?: string;
  to?: string;
  /** Numeric status code (Status=1). */
  status?: JournalEntryStatus;
  /** Numeric source code (Source=10). */
  source?: JournalEntrySource;
  /** Numeric reference-type code (ReferenceType=1). */
  referenceType?: JournalReferenceType;
  /** Filter by the generating document's id. */
  sourceId?: string;
  customerId?: string;
  agentId?: string;
  workerId?: string;
  employeeId?: string;
  /** Exact-match on the server-generated entry number (EntryNumber=JE-2026-0042). */
  entryNumber?: string;
  /** Free-text server-side search (Search=…). */
  search?: string;
  /** Filter by the source contract's sequential number (int, AND-ed with others). */
  contractNumber?: number;
  /** Branch scoping — filters journal entries by BranchId. */
  branchId?: string;
  includeSubBranches?: boolean;
  createdDateFrom?: string;
  createdDateTo?: string;
  updatedDateFrom?: string;
  updatedDateTo?: string;
  /** Numeric amount bounds on the entry's total debit (NOT dates, despite the From/To naming). */
  totalDebitFrom?: number;
  totalDebitTo?: number;
  /** Numeric amount bounds on the entry's total credit (NOT dates, despite the From/To naming). */
  totalCreditFrom?: number;
  totalCreditTo?: number;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface JournalEntriesPage {
  items: JournalEntryListItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

// ==================== Helpers ====================

/** Sum debits and credits across input lines (tolerant of blanks). */
export function sumLines(lines: Pick<JournalEntryLineInput, 'debit' | 'credit'>[]): {
  totalDebit: number;
  totalCredit: number;
  difference: number;
  isBalanced: boolean;
} {
  let totalDebit = 0;
  let totalCredit = 0;
  for (const line of lines ?? []) {
    totalDebit += Number(line?.debit) || 0;
    totalCredit += Number(line?.credit) || 0;
  }
  // Round to 2dp to avoid float artefacts when comparing.
  totalDebit = Math.round(totalDebit * 100) / 100;
  totalCredit = Math.round(totalCredit * 100) / 100;
  const difference = Math.round((totalDebit - totalCredit) * 100) / 100;
  return { totalDebit, totalCredit, difference, isBalanced: difference === 0 && totalDebit > 0 };
}
