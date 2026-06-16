/**
 * Journal Entries Module Type Definitions
 * Mirrors the Sigma Accounting API (JournalEntries-endpoint.pdf, base /api/V1).
 *
 * Controllers:
 *   /api/V1/JournalEntries        — CRUD for manual entries
 *   /api/V1/Posting               — post / unpost (commit to ledger)
 *
 * Business rules (enforced server-side, mirrored in the UI):
 *   • Total debits must equal total credits (entry rejected if unbalanced).
 *   • A new entry is saved with Draft status and posted separately.
 *   • Only Draft entries can be edited or deleted.
 *   • Posting commits ledger movements; unposting reverses them back to Draft.
 *   • System-generated entries may not be unpostable (business-rule dependent).
 */

// ==================== Enums ====================

/** Entry status. API serialises as a string ("Draft" | "Posted"). */
export type JournalEntryStatus = 'Draft' | 'Posted';

/** Entry source. "Manual" = user-created, "System" = event-generated. */
export type JournalEntrySource = 'Manual' | 'System';

export interface EnumOption<T extends string> {
  value: T;
  ar: string;
  en: string;
}

export const JOURNAL_STATUSES: EnumOption<JournalEntryStatus>[] = [
  { value: 'Draft', ar: 'غير معمد', en: 'Draft' },
  { value: 'Posted', ar: 'معمد', en: 'Posted' },
];

export const JOURNAL_SOURCES: EnumOption<JournalEntrySource>[] = [
  { value: 'Manual', ar: 'يدوي', en: 'Manual' },
  { value: 'System', ar: 'آلي', en: 'System' },
];

/** Normalise a status that may arrive as a string or numeric enum (0=Draft,1=Posted). */
export function normalizeStatus(value: unknown): JournalEntryStatus {
  if (value === 1 || value === '1' || value === 'Posted' || value === 'posted') return 'Posted';
  return 'Draft';
}

/**
 * Normalise a source that may arrive as a string or numeric enum.
 * Verified against the live API: 0 = Manual (user-created); any other numeric
 * code (1, 10, …) denotes a system/event-generated entry. Treat only the
 * explicit Manual cases as Manual, everything else as System.
 */
export function normalizeSource(value: unknown): JournalEntrySource {
  if (value === 0 || value === '0' || value === 'Manual' || value === 'manual') return 'Manual';
  if (value === null || value === undefined || value === '') return 'Manual';
  return 'System';
}

export function getStatusLabel(value: JournalEntryStatus, isAr: boolean): string {
  const match = JOURNAL_STATUSES.find((s) => s.value === value);
  return match ? (isAr ? match.ar : match.en) : value;
}

export function getSourceLabel(value: JournalEntrySource, isAr: boolean): string {
  const match = JOURNAL_SOURCES.find((s) => s.value === value);
  return match ? (isAr ? match.ar : match.en) : value;
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
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  restrictionTypeId?: string | null;
  customerId?: string | null;
  agentId?: string | null;
  workerId?: string | null;
  employeeId?: string | null;
}

/** Line inside a journal entry detail (GET /JournalEntries/{id} → data.lines[]). */
export interface JournalEntryLineDetail {
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string | null;
}

/** Full detail from GET /JournalEntries/{id}. */
export interface JournalEntryDetail {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  status: JournalEntryStatus;
  source: JournalEntrySource;
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  customerId?: string | null;
  agentId?: string | null;
  workerId?: string | null;
  employeeId?: string | null;
  restrictionTypeId?: string | null;
  createdBy?: string | null;
  createdDate?: string | null;
  lines: JournalEntryLineDetail[];
}

// ==================== Write models ====================

/** A single debit/credit line in the create/update body (JournalEntryLineDto). */
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

/** Query params for GET /JournalEntries. */
export interface JournalEntriesQuery {
  pageNumber?: number;
  pageSize?: number;
  from?: string;
  to?: string;
  status?: JournalEntryStatus;
  source?: JournalEntrySource;
  customerId?: string;
  agentId?: string;
  workerId?: string;
  restrictionTypeId?: string;
  /** Client-only: filter by entryNumber / description (API has no text param). */
  searchTerm?: string;
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
