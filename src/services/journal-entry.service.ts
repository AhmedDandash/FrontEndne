import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import {
  normalizeStatus,
  normalizeSource,
  type JournalEntriesQuery,
  type JournalEntriesPage,
  type JournalEntryListItem,
  type JournalEntryDetail,
  type JournalEntryLineDetail,
  type JournalEntryInput,
} from '@/types/journal-entry.types';

/**
 * Journal Entries service.
 *
 * The backend wraps every payload in an ApiResponse envelope
 * `{ success, statusCode, message, data }` and may serialise nested arrays as
 * `{ $values: [...] }` (System.Text.Json reference handling). Both shapes are
 * normalised here. See JournalEntries-endpoint.pdf for the full contract.
 */
export class JournalEntryService {
  /** Pull the meaningful payload out of the ApiResponse envelope. */
  private static unwrap<T>(payload: any): T {
    const inner = payload?.data?.value ?? payload?.value ?? payload?.data ?? payload;
    return inner as T;
  }

  /** Coerce a value that may be an array or a `{ $values: [] }` wrapper. */
  private static asArray(value: any): any[] {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.$values)) return value.$values;
    return [];
  }

  private static num(value: any): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  /** Map a raw list/detail summary into a clean JournalEntryListItem. */
  private static toListItem(raw: any): JournalEntryListItem {
    const totalDebit = this.num(raw?.totalDebit);
    const totalCredit = this.num(raw?.totalCredit);
    return {
      id: raw?.id,
      entryNumber: raw?.entryNumber ?? '',
      date: raw?.date ?? '',
      description: raw?.description ?? '',
      status: normalizeStatus(raw?.status),
      source: normalizeSource(raw?.source),
      totalDebit,
      totalCredit,
      isBalanced:
        typeof raw?.isBalanced === 'boolean'
          ? raw.isBalanced
          : Math.round((totalDebit - totalCredit) * 100) === 0,
      restrictionTypeId: raw?.restrictionTypeId ?? null,
      customerId: raw?.customerId ?? null,
      agentId: raw?.agentId ?? null,
      workerId: raw?.workerId ?? null,
      employeeId: raw?.employeeId ?? null,
    };
  }

  private static toLine(raw: any): JournalEntryLineDetail {
    return {
      accountId: raw?.accountId,
      accountCode: raw?.accountCode ?? '',
      accountName: raw?.accountName ?? '',
      debit: this.num(raw?.debit),
      credit: this.num(raw?.credit),
      description: raw?.description ?? null,
    };
  }

  // ==================== Reads ====================

  /** GET /JournalEntries — paginated + filtered list. */
  static async getAll(query: JournalEntriesQuery = {}): Promise<JournalEntriesPage> {
    const response = await api.get<any>(API_ENDPOINTS.JOURNAL_ENTRIES.GET_ALL, {
      params: {
        pageNumber: query.pageNumber ?? 1,
        pageSize: query.pageSize ?? 10,
        from: query.from || undefined,
        to: query.to || undefined,
        status: query.status || undefined,
        source: query.source || undefined,
        customerId: query.customerId || undefined,
        agentId: query.agentId || undefined,
        workerId: query.workerId || undefined,
        employeeId: query.employeeId || undefined,
        restrictionTypeId: query.restrictionTypeId || undefined,
        branchId: query.branchId || undefined,
        includeSubBranches: query.branchId ? query.includeSubBranches : undefined,
      },
    });
    const data = this.unwrap<any>(response.data);
    const rawItems = this.asArray(data?.items ?? data?.$values ?? data);
    return {
      items: rawItems.map((r) => this.toListItem(r)),
      totalCount: data?.totalCount ?? data?.total ?? rawItems.length,
      pageNumber: data?.pageNumber ?? query.pageNumber ?? 1,
      pageSize: data?.pageSize ?? query.pageSize ?? 10,
    };
  }

  /** GET /JournalEntries/{id} — full detail including lines. */
  static async getById(id: string): Promise<JournalEntryDetail> {
    const response = await api.get<any>(API_ENDPOINTS.JOURNAL_ENTRIES.GET_BY_ID(id));
    const raw = this.unwrap<any>(response.data);
    const summary = this.toListItem(raw);
    return {
      ...summary,
      customerId: raw?.customerId ?? null,
      agentId: raw?.agentId ?? null,
      workerId: raw?.workerId ?? null,
      employeeId: raw?.employeeId ?? null,
      restrictionTypeId: raw?.restrictionTypeId ?? null,
      createdBy: raw?.createdBy ?? null,
      createdDate: raw?.createdDate ?? null,
      lines: this.asArray(raw?.lines ?? raw?.lines?.$values).map((l) => this.toLine(l)),
    };
  }

  // ==================== Writes ====================

  /** Normalise the create/update request body. */
  private static toBody(data: JournalEntryInput) {
    return {
      date: data.date,
      description: data.description,
      customerId: data.customerId ?? null,
      agentId: data.agentId ?? null,
      workerId: data.workerId ?? null,
      employeeId: data.employeeId ?? null,
      restrictionTypeId: data.restrictionTypeId ?? null,
      lines: (data.lines ?? []).map((line) => ({
        accountId: line.accountId,
        debit: Number(line.debit) || 0,
        credit: Number(line.credit) || 0,
        description: line.description ?? null,
      })),
    };
  }

  /**
   * POST /JournalEntries — create a Draft entry.
   *
   * NOTE: the live API returns the generated entry NUMBER (e.g. "JE-2026-0004")
   * in `data`, not the GUID (despite the PDF stating "data: Guid"). Posting and
   * getById both need the GUID, so we resolve it from the list by matching the
   * entry number, and return the GUID to keep callers (Save & Post) working.
   */
  static async create(data: JournalEntryInput): Promise<string> {
    const response = await api.post<any>(API_ENDPOINTS.JOURNAL_ENTRIES.CREATE, this.toBody(data));
    const entryNumber = this.unwrap<string>(response.data);
    return this.resolveIdByEntryNumber(entryNumber);
  }

  /** Resolve a journal entry's GUID from its server-generated entry number. */
  private static async resolveIdByEntryNumber(entryNumber: string): Promise<string> {
    if (!entryNumber) return '';
    // New entries come back newest-first; a generous page size makes the match safe.
    const page = await this.getAll({ pageNumber: 1, pageSize: 50 });
    return page.items.find((e) => e.entryNumber === entryNumber)?.id ?? '';
  }

  /** PUT /JournalEntries/{id} — update a Draft entry. */
  static async update(id: string, data: JournalEntryInput): Promise<void> {
    await api.put(API_ENDPOINTS.JOURNAL_ENTRIES.UPDATE(id), this.toBody(data));
  }

  /** DELETE /JournalEntries/{id} — delete a Draft entry. */
  static async delete(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.JOURNAL_ENTRIES.DELETE(id));
  }

  // ==================== Posting ====================

  /** POST /Posting/{journalId} — commit a Draft entry to the ledger. */
  static async post(journalId: string): Promise<void> {
    await api.post(API_ENDPOINTS.POSTING.POST(journalId));
  }

  /** POST /Posting/{id}/unpost — reverse a posted entry back to Draft. */
  static async unpost(id: string): Promise<void> {
    await api.post(API_ENDPOINTS.POSTING.UNPOST(id));
  }
}
