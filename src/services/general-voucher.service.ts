import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import { unwrap, unwrapList } from '@/utils/api-response';
import { buildListParams } from '@/lib/api/buildListParams';
import type { AccountingDocumentTrace } from '@/types/api.types';
import type {
  GeneralVoucherDto,
  GeneralVoucherPagedResult,
  GeneralVoucherFilterDto,
  CreateGeneralVoucherDto,
  UpdateGeneralVoucherDto,
  GeneralVoucherLineInputDto,
  GeneralVoucherBalanceValidationDto,
  GeneralVoucherPrintDto,
  VoucherLookupOption,
} from '@/types/general-voucher.types';

/**
 * General Voucher service — api/Accounting/GeneralVoucher.
 *
 * Live-verified 2026-07-17. Two behaviours worth knowing before editing:
 *
 * 1. LIST QUERY PARAMS ARE PascalCase on this module (VoucherNumber, DateFrom,
 *    PageNumber, …), unlike the camelCase legacy accounting-document endpoints.
 *    `toQueryParams` does that mapping in one place so the list and its /export
 *    counterpart can never drift.
 *
 * 2. `pageSize` in the list response echoes the RETURNED ROW COUNT rather than
 *    the requested page size (asking for 50 over 8 rows returns pageSize: 8;
 *    an empty list returns 0). Feeding that straight into a pager collapses it,
 *    so `getAll` returns the REQUESTED size and ignores the server's value.
 *    `totalCount` is correct and is what drives the pager.
 */
export class GeneralVoucherService {
  /** camelCase filters → the PascalCase query params this module expects. */
  private static toQueryParams(filters: GeneralVoucherFilterDto = {}) {
    return buildListParams({
      VoucherNumber: filters.voucherNumber,
      VoucherType: filters.voucherType,
      DateFrom: filters.dateFrom,
      DateTo: filters.dateTo,
      ContractId: filters.contractId,
      WorkerId: filters.workerId,
      PaymentMethod: filters.paymentMethod,
      AmountFrom: filters.amountFrom,
      AmountTo: filters.amountTo,
      Status: filters.status,
      BranchId: filters.branchId,
      // Only meaningful alongside a branch — mirrors the legacy voucher services.
      IncludeSubBranches: filters.branchId ? filters.includeSubBranches : undefined,
      Search: filters.search,
      CreatedDateFrom: filters.createdDateFrom,
      CreatedDateTo: filters.createdDateTo,
      UpdatedDateFrom: filters.updatedDateFrom,
      UpdatedDateTo: filters.updatedDateTo,
      PageNumber: filters.pageNumber,
      PageSize: filters.pageSize,
      SortBy: filters.sortBy,
      SortDescending: filters.sortDescending,
    });
  }

  /** Query params for the /export endpoint — same filters, no pagination. */
  static exportParams(filters: GeneralVoucherFilterDto = {}) {
    const { pageNumber: _p, pageSize: _s, ...rest } = filters;
    return this.toQueryParams(rest);
  }

  static async getAll(
    filters: GeneralVoucherFilterDto = {}
  ): Promise<GeneralVoucherPagedResult> {
    const response = await api.get<any>(API_ENDPOINTS.GENERAL_VOUCHER.GET_ALL, {
      params: this.toQueryParams(filters),
    });
    const data = unwrap<any>(response.data);
    return {
      items: unwrapList<GeneralVoucherDto>(data),
      totalCount: data?.totalCount ?? 0,
      pageNumber: data?.pageNumber ?? filters.pageNumber ?? 1,
      // Deliberately NOT data.pageSize — see the class doc comment.
      pageSize: filters.pageSize ?? 20,
    };
  }

  static async getById(id: string): Promise<GeneralVoucherDto> {
    const response = await api.get<any>(API_ENDPOINTS.GENERAL_VOUCHER.GET_BY_ID(id));
    return unwrap<GeneralVoucherDto>(response.data);
  }

  static async getTrace(id: string): Promise<AccountingDocumentTrace> {
    const response = await api.get<any>(API_ENDPOINTS.GENERAL_VOUCHER.TRACE(id));
    return unwrap<AccountingDocumentTrace>(response.data);
  }

  static async getPrintData(id: string): Promise<GeneralVoucherPrintDto> {
    const response = await api.get<any>(API_ENDPOINTS.GENERAL_VOUCHER.PRINT(id));
    return unwrap<GeneralVoucherPrintDto>(response.data);
  }

  /** Voucher-type dropdown metadata (backend supplies nameAr/nameEn). */
  static async getTypes(): Promise<VoucherLookupOption[]> {
    const response = await api.get<any>(API_ENDPOINTS.GENERAL_VOUCHER.TYPES);
    return unwrapList<VoucherLookupOption>(response.data);
  }

  static async getPaymentMethods(): Promise<VoucherLookupOption[]> {
    const response = await api.get<any>(API_ENDPOINTS.GENERAL_VOUCHER.PAYMENT_METHODS);
    return unwrapList<VoucherLookupOption>(response.data);
  }

  static async create(data: CreateGeneralVoucherDto): Promise<GeneralVoucherDto> {
    const response = await api.post<any>(API_ENDPOINTS.GENERAL_VOUCHER.CREATE, data);
    return unwrap<GeneralVoucherDto>(response.data);
  }

  /** Blocked backend-side once the linked journal is Posted. */
  static async update(id: string, data: UpdateGeneralVoucherDto): Promise<GeneralVoucherDto> {
    const response = await api.put<any>(API_ENDPOINTS.GENERAL_VOUCHER.UPDATE(id), data);
    return unwrap<GeneralVoucherDto>(response.data);
  }

  /** Blocked backend-side once the linked journal is Posted. */
  static async delete(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.GENERAL_VOUCHER.DELETE(id));
  }

  static async uploadAttachment(id: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<any>(
      API_ENDPOINTS.GENERAL_VOUCHER.ATTACHMENT(id),
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return unwrap<string>(response.data);
  }

  /**
   * Server-side debit/credit balance check for multi-line vouchers.
   *
   * NOTE: this endpoint is PURELY ARITHMETIC — verified live that it accepts
   * non-existent account ids, non-leaf accounts, and negative amounts
   * (-100/-100 comes back isBalanced: true). Any leaf/existence/sign checking
   * has to happen client-side; see VoucherJournalLines.
   */
  static async validateBalance(
    lines: GeneralVoucherLineInputDto[]
  ): Promise<GeneralVoucherBalanceValidationDto> {
    const response = await api.post<any>(
      API_ENDPOINTS.GENERAL_VOUCHER.VALIDATE_BALANCE,
      lines
    );
    return unwrap<GeneralVoucherBalanceValidationDto>(response.data);
  }
}
