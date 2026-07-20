import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import {
  normalizeStatus,
  normalizeSource,
  normalizeReferenceType,
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
      referenceType: normalizeReferenceType(raw?.referenceType),
      sourceId: raw?.sourceId ?? null,
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
    // NOTE: status/source/referenceType are sent as NUMERIC codes. Verified live:
    // `Source=System` (string) returned 0 rows, `Source=13` works. `RestrictionTypeId`
    // is NOT a supported query param (ignored server-side) and is intentionally omitted.
    const response = await api.get<any>(API_ENDPOINTS.JOURNAL_ENTRIES.GET_ALL, {
      params: {
        pageNumber: query.pageNumber ?? 1,
        pageSize: query.pageSize ?? 10,
        from: query.from || undefined,
        to: query.to || undefined,
        status: query.status ?? undefined,
        source: query.source ?? undefined,
        referenceType: query.referenceType ?? undefined,
        sourceId: query.sourceId || undefined,
        customerId: query.customerId || undefined,
        agentId: query.agentId || undefined,
        workerId: query.workerId || undefined,
        employeeId: query.employeeId || undefined,
        entryNumber: query.entryNumber || undefined,
        search: query.search || undefined,
        contractNumber: query.contractNumber || undefined,
        branchId: query.branchId || undefined,
        includeSubBranches: query.branchId ? query.includeSubBranches : undefined,
        createdDateFrom: query.createdDateFrom || undefined,
        createdDateTo: query.createdDateTo || undefined,
        updatedDateFrom: query.updatedDateFrom || undefined,
        updatedDateTo: query.updatedDateTo || undefined,
        sortBy: query.sortBy || undefined,
        sortDescending: query.sortDescending ?? undefined,
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
   * The live API returns the generated entry NUMBER (e.g. "JE-2026-0004") in
   * `data`, not the GUID. Posting and getById both need the GUID, so we resolve
   * it via the server-side `EntryNumber` exact-match filter (verified live) and
   * return the GUID to keep callers (Save & Post) working.
   *
   * If `data` already looks like a GUID (backend contract may change), it is
   * returned directly without the extra round-trip.
   */
  static async create(data: JournalEntryInput): Promise<string> {
    const response = await api.post<any>(API_ENDPOINTS.JOURNAL_ENTRIES.CREATE, this.toBody(data));
    const payload = this.unwrap<any>(response.data);
    const value = typeof payload === 'string' ? payload : payload?.id ?? payload?.entryNumber ?? '';
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      return value; // already a GUID
    }
    return this.resolveIdByEntryNumber(value);
  }

  /** Resolve a journal entry's GUID from its server-generated entry number. */
  private static async resolveIdByEntryNumber(entryNumber: string): Promise<string> {
    if (!entryNumber) return '';
    // Exact-match server filter — robust regardless of list ordering / volume.
    const page = await this.getAll({ pageNumber: 1, pageSize: 5, entryNumber });
    const exact = page.items.find((e) => e.entryNumber === entryNumber);
    return (exact ?? page.items[0])?.id ?? '';
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
