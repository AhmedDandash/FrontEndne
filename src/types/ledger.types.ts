/**
 * Ledger & Reports Module Type Definitions
 * Mirrors the Sigma Accounting API (Ledger-endpoints.pdf, base /api/V1/Ledger).
 *
 * All ledger endpoints are READ-ONLY, return ONLY Posted data, and accept
 * `from` / `to` date-range filters (ISO 8601) unless noted. Shapes below were
 * validated against the live API on 2026-06-15.
 *
 * Envelope: success `{ success, data, statusCode }`;
 *           error   `{ success:false, data:null, errors:[...], statusCode }`.
 */

// ==================== Shared ====================

/** Common date-range filter shared by most reports. */
export interface DateRangeQuery {
  from?: string;
  to?: string;
  /** Branch scoping (DTO-ready; ledger aggregation partially applied backend-side). */
  branchId?: string;
  includeSubBranches?: boolean;
}

// ==================== 3.1 General Ledger ====================

export interface GeneralLedgerLine {
  date: string;
  entryNumber: string;
  description: string;
  debit: number;
  credit: number;
  /** Running balance after this movement. */
  balanceAfter: number;
}

export interface GeneralLedger {
  accountId: string;
  accountCode: string;
  accountName: string;
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
  lines: GeneralLedgerLine[];
}

export interface GeneralLedgerQuery extends DateRangeQuery {
  accountId: string;
}

// ==================== 3.2–3.4 Party Ledgers (Agent / Customer / Worker) ====================

/** The three party ledgers share one line + summary shape (only the id differs). */
export interface PartyLedgerLine {
  date: string;
  entryNumber: string;
  description: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  /** "Manual" | "System". */
  source: string;
  sourceId?: string | null;
}

export interface PartyLedger {
  /** Normalised id (agentId / customerId / workerId on the wire). */
  entityId: string;
  totalDebit: number;
  totalCredit: number;
  /** Net balance = totalDebit - totalCredit. */
  balance: number;
  lines: PartyLedgerLine[];
}

export type PartyKind = 'agent' | 'customer' | 'worker';

// ==================== 3.5 Trial Balance ====================

export interface TrialBalanceLine {
  accountId: string;
  accountCode: string;
  accountName: string;
  openingBalance: number;
  debit: number;
  credit: number;
  closingBalance: number;
}

export interface TrialBalance {
  totalDebit: number;
  totalCredit: number;
  lines: TrialBalanceLine[];
}

export interface TrialBalanceQuery extends DateRangeQuery {
  /** If true, only accounts flagged for grouped trial-balance display. */
  groupedOnly?: boolean;
}

// ==================== 3.6 Income Statement ====================

export interface IncomeStatementLine {
  accountId: string;
  accountCode: string;
  accountName: string;
  /** Account depth in the chart-of-accounts tree. */
  level: number;
  openingBalance: number;
  debit: number;
  credit: number;
  closingBalance: number;
}

export interface IncomeStatementPage {
  items: IncomeStatementLine[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface IncomeStatementQuery extends DateRangeQuery {
  pageNumber?: number;
  pageSize?: number;
}

// ==================== 3.7 Balance Sheet ====================

export interface BalanceSheetLine {
  accountId: string;
  accountCode: string;
  accountName: string;
  closingBalance: number;
  openingBalance?: number;
  debit?: number;
  credit?: number;
}

export interface BalanceSheetSection {
  sectionName: string;
  total: number;
  lines: BalanceSheetLine[];
}

export interface BalanceSheet {
  assets: BalanceSheetSection;
  liabilities: BalanceSheetSection;
  equity: BalanceSheetSection;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

export interface BalanceSheetQuery {
  /** Required. The as-of date; the period always starts Jan 1 of that year. */
  asOfDate: string;
  branchId?: string;
  includeSubBranches?: boolean;
}

// ==================== 3.8 VAT Report ====================

export interface VatReport {
  year: number;
  quarter: number;
  periodStart: string;
  periodEnd: string;
  /** VAT collected on sales (VAT Payable credits). */
  outputVat: number;
  /** VAT paid on purchases (VAT Receivable debits). */
  inputVat: number;
  /** outputVat - inputVat (amount due to the tax authority). */
  netVatPayable: number;
}

export interface VatReportQuery {
  year: number;
  /** 1–4 (the API returns 400 otherwise). */
  quarter: number;
  branchId?: string;
  includeSubBranches?: boolean;
}
