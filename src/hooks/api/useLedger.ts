import { useQuery } from '@tanstack/react-query';
import { LedgerService } from '@/services/ledger.service';
import { CustomerService } from '@/services/customer.service';
import { AgentService } from '@/services/agent.service';
import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
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

export interface PartyOption {
  value: string;
  label: string;
}

/**
 * Lookup options (GUID + display name) for the party-ledger pickers.
 *
 * The live V1 API returns GUID ids for Customer / Agent / Worker (the local
 * `Agent.id: number` type is stale), and those GUIDs are exactly what the
 * ledger endpoints expect — so a single selection feeds the report directly.
 * Items are typed loosely because the runtime field names lead the stale types.
 */
export function usePartyOptions(kind: PartyKind) {
  return useQuery<PartyOption[]>({
    queryKey: [LEDGER_KEY, 'party-options', kind],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (kind === 'agent') {
        const agents = (await AgentService.getAll()) as any[];
        return agents.map((a) => ({
          value: String(a.id),
          label: a.agentNameAr || a.agentNameEn || String(a.id),
        }));
      }
      if (kind === 'customer') {
        const customers = (await CustomerService.getAll()) as any[];
        return customers.map((c) => ({
          value: String(c.id),
          label: c.arabicName || c.englishName || String(c.id),
        }));
      }
      // Fetch workers directly (GUID id + display name) for the party picker.
      const response = await api.get<any>(API_ENDPOINTS.WORKERS.GET_ALL);
      const body = response.data;
      const workers: any[] =
        (Array.isArray(body?.data?.items) && body.data.items) ||
        (Array.isArray(body?.data) && body.data) ||
        (Array.isArray(body?.items) && body.items) ||
        (Array.isArray(body) && body) ||
        [];
      return workers.map((w) => ({
        value: String(w.id),
        label: w.fullNameAr || w.fullNameEn || w.referenceNo || String(w.id),
      }));
    },
  });
}

/** 3.1 General Ledger — requires an accountId (query disabled until set). */
export function useGeneralLedger(query: Partial<GeneralLedgerQuery>) {
  return useQuery({
    queryKey: [LEDGER_KEY, 'general', query.accountId, query.from ?? '', query.to ?? '', query.branchId ?? ''],
    queryFn: () => LedgerService.getGeneralLedger(query as GeneralLedgerQuery),
    placeholderData: (previous) => previous,
    enabled: !!query.accountId,
  });
}

/** 3.2–3.4 Party ledgers — one hook keyed by party kind; disabled until id set. */
export function usePartyLedger(kind: PartyKind, id: string | undefined, range: DateRangeQuery) {
  return useQuery({
    queryKey: [LEDGER_KEY, kind, id, range.from ?? '', range.to ?? '', range.branchId ?? ''],
    queryFn: () => {
      if (kind === 'agent') return LedgerService.getAgentLedger(id as string, range);
      if (kind === 'customer') return LedgerService.getCustomerLedger(id as string, range);
      return LedgerService.getWorkerLedger(id as string, range);
    },
    placeholderData: (previous) => previous,
    enabled: !!id,
    // "No entries found" comes back as 400 — don't hammer it on retry.
    retry: false,
  });
}

/** 3.5 Trial Balance. */
export function useTrialBalance(query: TrialBalanceQuery) {
  return useQuery({
    queryKey: [
      LEDGER_KEY,
      'trial-balance',
      query.from ?? '',
      query.to ?? '',
      !!query.groupedOnly,
      !!query.excludeZeroBalances,
      query.branchId ?? '',
    ],
    queryFn: () => LedgerService.getTrialBalance(query),
    placeholderData: (previous) => previous,
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
      query.branchId ?? '',
    ],
    queryFn: () => LedgerService.getIncomeStatement(query),
    placeholderData: (previous) => previous,
  });
}

/** 3.7 Balance Sheet — requires asOfDate. */
export function useBalanceSheet(query: Partial<BalanceSheetQuery>) {
  return useQuery({
    queryKey: [
      LEDGER_KEY,
      'balance-sheet',
      query.asOfDate,
      query.branchId ?? '',
      !!query.includeCurrentYearEarnings,
    ],
    queryFn: () => LedgerService.getBalanceSheet(query as BalanceSheetQuery),
    placeholderData: (previous) => previous,
    enabled: !!query.asOfDate,
  });
}

/** 3.8 VAT Report — requires year + quarter. */
export function useVatReport(query: Partial<VatReportQuery>) {
  return useQuery({
    queryKey: [
      LEDGER_KEY,
      'vat-report',
      query.year,
      query.quarter,
      query.branchId ?? '',
      query.from ?? '',
      query.to ?? '',
    ],
    queryFn: () => LedgerService.getVatReport(query as VatReportQuery),
    placeholderData: (previous) => previous,
    enabled: !!query.year && !!query.quarter,
    retry: false,
  });
}
