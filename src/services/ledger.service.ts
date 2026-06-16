import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import type {
  GeneralLedger,
  GeneralLedgerLine,
  GeneralLedgerQuery,
  PartyLedger,
  PartyLedgerLine,
  TrialBalance,
  TrialBalanceLine,
  TrialBalanceQuery,
  IncomeStatementPage,
  IncomeStatementLine,
  IncomeStatementQuery,
  BalanceSheet,
  BalanceSheetSection,
  BalanceSheetLine,
  BalanceSheetQuery,
  VatReport,
  VatReportQuery,
  DateRangeQuery,
} from '@/types/ledger.types';

/**
 * Ledger & Reports service.
 *
 * Read-only endpoints under /api/V1/Ledger. The backend wraps payloads in the
 * ApiResponse envelope `{ success, data, errors, statusCode }` and may serialise
 * nested arrays as `{ $values: [] }`; both are normalised here. All amounts are
 * coerced to finite numbers so the UI never renders NaN.
 */
export class LedgerService {
  private static unwrap<T>(payload: any): T {
    const inner = payload?.data?.value ?? payload?.value ?? payload?.data ?? payload;
    return inner as T;
  }

  private static asArray(value: any): any[] {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.$values)) return value.$values;
    return [];
  }

  private static num(value: any): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  private static dateParams(q: DateRangeQuery) {
    return { from: q.from || undefined, to: q.to || undefined };
  }

  // ==================== 3.1 General Ledger ====================

  static async getGeneralLedger(query: GeneralLedgerQuery): Promise<GeneralLedger> {
    const response = await api.get<any>(API_ENDPOINTS.LEDGER.GENERAL, {
      params: { accountId: query.accountId, ...this.dateParams(query) },
    });
    const d = this.unwrap<any>(response.data);
    return {
      accountId: d?.accountId,
      accountCode: d?.accountCode ?? '',
      accountName: d?.accountName ?? '',
      openingBalance: this.num(d?.openingBalance),
      totalDebit: this.num(d?.totalDebit),
      totalCredit: this.num(d?.totalCredit),
      closingBalance: this.num(d?.closingBalance),
      lines: this.asArray(d?.lines).map(
        (l): GeneralLedgerLine => ({
          date: l?.date ?? '',
          entryNumber: l?.entryNumber ?? '',
          description: l?.description ?? '',
          debit: this.num(l?.debit),
          credit: this.num(l?.credit),
          balanceAfter: this.num(l?.balanceAfter),
        })
      ),
    };
  }

  // ==================== 3.2–3.4 Party Ledgers ====================

  private static toPartyLedger(d: any, idKey: string): PartyLedger {
    return {
      entityId: d?.[idKey] ?? d?.entityId ?? '',
      totalDebit: this.num(d?.totalDebit),
      totalCredit: this.num(d?.totalCredit),
      balance: this.num(d?.balance),
      lines: this.asArray(d?.lines).map(
        (l): PartyLedgerLine => ({
          date: l?.date ?? '',
          entryNumber: l?.entryNumber ?? '',
          description: l?.description ?? '',
          accountCode: l?.accountCode ?? '',
          accountName: l?.accountName ?? '',
          debit: this.num(l?.debit),
          credit: this.num(l?.credit),
          source: l?.source ?? '',
          sourceId: l?.sourceId ?? null,
        })
      ),
    };
  }

  static async getAgentLedger(agentId: string, range: DateRangeQuery = {}): Promise<PartyLedger> {
    const response = await api.get<any>(API_ENDPOINTS.LEDGER.AGENT, {
      params: { agentId, ...this.dateParams(range) },
    });
    return this.toPartyLedger(this.unwrap<any>(response.data), 'agentId');
  }

  static async getCustomerLedger(
    customerId: string,
    range: DateRangeQuery = {}
  ): Promise<PartyLedger> {
    const response = await api.get<any>(API_ENDPOINTS.LEDGER.CUSTOMER, {
      params: { customerId, ...this.dateParams(range) },
    });
    return this.toPartyLedger(this.unwrap<any>(response.data), 'customerId');
  }

  static async getWorkerLedger(
    workerId: string,
    range: DateRangeQuery = {}
  ): Promise<PartyLedger> {
    const response = await api.get<any>(API_ENDPOINTS.LEDGER.WORKER, {
      params: { workerId, ...this.dateParams(range) },
    });
    return this.toPartyLedger(this.unwrap<any>(response.data), 'workerId');
  }

  // ==================== 3.5 Trial Balance ====================

  static async getTrialBalance(query: TrialBalanceQuery = {}): Promise<TrialBalance> {
    const response = await api.get<any>(API_ENDPOINTS.LEDGER.TRIAL_BALANCE, {
      params: { ...this.dateParams(query), groupedOnly: query.groupedOnly || undefined },
    });
    const d = this.unwrap<any>(response.data);
    return {
      totalDebit: this.num(d?.totalDebit),
      totalCredit: this.num(d?.totalCredit),
      lines: this.asArray(d?.lines).map(
        (l): TrialBalanceLine => ({
          accountId: l?.accountId,
          accountCode: l?.accountCode ?? '',
          accountName: l?.accountName ?? '',
          openingBalance: this.num(l?.openingBalance),
          debit: this.num(l?.debit),
          credit: this.num(l?.credit),
          closingBalance: this.num(l?.closingBalance),
        })
      ),
    };
  }

  // ==================== 3.6 Income Statement ====================

  static async getIncomeStatement(query: IncomeStatementQuery = {}): Promise<IncomeStatementPage> {
    const response = await api.get<any>(API_ENDPOINTS.LEDGER.INCOME_STATEMENT, {
      params: {
        ...this.dateParams(query),
        pageNumber: query.pageNumber ?? 1,
        pageSize: query.pageSize ?? 10,
      },
    });
    const d = this.unwrap<any>(response.data);
    const items = this.asArray(d?.items ?? d?.$values).map(
      (l): IncomeStatementLine => ({
        accountId: l?.accountId,
        accountCode: l?.accountCode ?? '',
        accountName: l?.accountName ?? '',
        level: this.num(l?.level),
        openingBalance: this.num(l?.openingBalance),
        debit: this.num(l?.debit),
        credit: this.num(l?.credit),
        closingBalance: this.num(l?.closingBalance),
      })
    );
    return {
      items,
      totalCount: d?.totalCount ?? items.length,
      pageNumber: d?.pageNumber ?? query.pageNumber ?? 1,
      pageSize: d?.pageSize ?? query.pageSize ?? 10,
    };
  }

  // ==================== 3.7 Balance Sheet ====================

  private static toSection(s: any): BalanceSheetSection {
    return {
      sectionName: s?.sectionName ?? '',
      total: this.num(s?.total),
      lines: this.asArray(s?.lines).map(
        (l): BalanceSheetLine => ({
          accountId: l?.accountId,
          accountCode: l?.accountCode ?? '',
          accountName: l?.accountName ?? '',
          closingBalance: this.num(l?.closingBalance),
          openingBalance: l?.openingBalance != null ? this.num(l.openingBalance) : undefined,
          debit: l?.debit != null ? this.num(l.debit) : undefined,
          credit: l?.credit != null ? this.num(l.credit) : undefined,
        })
      ),
    };
  }

  static async getBalanceSheet(query: BalanceSheetQuery): Promise<BalanceSheet> {
    const response = await api.get<any>(API_ENDPOINTS.LEDGER.BALANCE_SHEET, {
      params: { asOfDate: query.asOfDate },
    });
    const d = this.unwrap<any>(response.data);
    return {
      assets: this.toSection(d?.assets),
      liabilities: this.toSection(d?.liabilities),
      equity: this.toSection(d?.equity),
      totalAssets: this.num(d?.totalAssets),
      totalLiabilities: this.num(d?.totalLiabilities),
      totalEquity: this.num(d?.totalEquity),
    };
  }

  // ==================== 3.8 VAT Report ====================

  static async getVatReport(query: VatReportQuery): Promise<VatReport> {
    const response = await api.get<any>(API_ENDPOINTS.LEDGER.VAT_REPORT, {
      params: { year: query.year, quarter: query.quarter },
    });
    const d = this.unwrap<any>(response.data);
    return {
      year: this.num(d?.year),
      quarter: this.num(d?.quarter),
      periodStart: d?.periodStart ?? '',
      periodEnd: d?.periodEnd ?? '',
      outputVat: this.num(d?.outputVat),
      inputVat: this.num(d?.inputVat),
      netVatPayable: this.num(d?.netVatPayable),
    };
  }
}
