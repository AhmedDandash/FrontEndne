import { useQuery } from '@tanstack/react-query';
import { LedgerService } from '@/services/ledger.service';
import type {
  GeneralLedgerQuery,
  TrialBalanceQuery,
  IncomeStatementQuery,
  BalanceSheetQuery,
  VatReportQuery,
  DateRangeQuery,
  PartyKind,
} from '@/types/ledger.types';

const LEDGER_KEY = 'ledger';

/** 3.1 General Ledger — requires an accountId (query disabled until set). */
export function useGeneralLedger(query: Partial<GeneralLedgerQuery>) {
  return useQuery({
    queryKey: [LEDGER_KEY, 'general', query.accountId, query.from ?? '', query.to ?? ''],
    queryFn: () => LedgerService.getGeneralLedger(query as GeneralLedgerQuery),
    enabled: !!query.accountId,
  });
}

/** 3.2–3.4 Party ledgers — one hook keyed by party kind; disabled until id set. */
export function usePartyLedger(kind: PartyKind, id: string | undefined, range: DateRangeQuery) {
  return useQuery({
    queryKey: [LEDGER_KEY, kind, id, range.from ?? '', range.to ?? ''],
    queryFn: () => {
      if (kind === 'agent') return LedgerService.getAgentLedger(id as string, range);
      if (kind === 'customer') return LedgerService.getCustomerLedger(id as string, range);
      return LedgerService.getWorkerLedger(id as string, range);
    },
    enabled: !!id,
    // "No entries found" comes back as 400 — don't hammer it on retry.
    retry: false,
  });
}

/** 3.5 Trial Balance. */
export function useTrialBalance(query: TrialBalanceQuery) {
  return useQuery({
    queryKey: [LEDGER_KEY, 'trial-balance', query.from ?? '', query.to ?? '', !!query.groupedOnly],
    queryFn: () => LedgerService.getTrialBalance(query),
  });
}

/** 3.6 Income Statement (paginated). */
export function useIncomeStatement(query: IncomeStatementQuery) {
  return useQuery({
    queryKey: [
      LEDGER_KEY,
      'income-statement',
      query.from ?? '',
      query.to ?? '',
      query.pageNumber ?? 1,
      query.pageSize ?? 10,
    ],
    queryFn: () => LedgerService.getIncomeStatement(query),
    placeholderData: (previous) => previous,
  });
}

/** 3.7 Balance Sheet — requires asOfDate. */
export function useBalanceSheet(query: Partial<BalanceSheetQuery>) {
  return useQuery({
    queryKey: [LEDGER_KEY, 'balance-sheet', query.asOfDate],
    queryFn: () => LedgerService.getBalanceSheet(query as BalanceSheetQuery),
    enabled: !!query.asOfDate,
  });
}

/** 3.8 VAT Report — requires year + quarter. */
export function useVatReport(query: Partial<VatReportQuery>) {
  return useQuery({
    queryKey: [LEDGER_KEY, 'vat-report', query.year, query.quarter],
    queryFn: () => LedgerService.getVatReport(query as VatReportQuery),
    enabled: !!query.year && !!query.quarter,
    retry: false,
  });
}
