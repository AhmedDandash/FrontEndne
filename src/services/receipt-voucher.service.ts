import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import { unwrap, unwrapList } from '@/utils/api-response';
import type {
  ReceiptVoucherDetail,
  CreateReceiptVoucherNewDto,
  AccountingDocumentFilterDto,
  AccountingDocumentTrace,
} from '@/types/api.types';

export class ReceiptVoucherService {
  static async getAll(filters: AccountingDocumentFilterDto = {}): Promise<ReceiptVoucherDetail[]> {
    const response = await api.get<any>(API_ENDPOINTS.RECEIPT_VOUCHER.GET_ALL, {
      params: {
        contractId: filters.contractId || undefined,
        customerId: filters.customerId || undefined,
        // Added for parity with the other 3 accounting-document endpoints
        // (previously missing from ReceiptVoucher entirely — verified live).
        agentId: filters.agentId || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        branchId: filters.branchId || undefined,
        includeSubBranches: filters.branchId ? filters.includeSubBranches ?? undefined : undefined,
        documentType: filters.documentType ?? undefined,
        documentNumber: filters.documentNumber || undefined,
        search: filters.search || undefined,
        createdDateFrom: filters.createdDateFrom || undefined,
        createdDateTo: filters.createdDateTo || undefined,
        updatedDateFrom: filters.updatedDateFrom || undefined,
        updatedDateTo: filters.updatedDateTo || undefined,
        pageNumber: filters.pageNumber ?? undefined,
        pageSize: filters.pageSize ?? undefined,
        sortBy: filters.sortBy || undefined,
        sortDescending: filters.sortDescending ?? undefined,
      },
    });
    return unwrapList<ReceiptVoucherDetail>(response.data);
  }

  static async getById(id: string): Promise<ReceiptVoucherDetail> {
    const response = await api.get<any>(API_ENDPOINTS.RECEIPT_VOUCHER.GET_BY_ID(id));
    return unwrap<ReceiptVoucherDetail>(response.data);
  }

  static async getTrace(id: string): Promise<AccountingDocumentTrace> {
    const response = await api.get<any>(API_ENDPOINTS.RECEIPT_VOUCHER.TRACE(id));
    return unwrap<AccountingDocumentTrace>(response.data);
  }

  static async create(data: CreateReceiptVoucherNewDto): Promise<ReceiptVoucherDetail> {
    const response = await api.post<any>(API_ENDPOINTS.RECEIPT_VOUCHER.CREATE, data);
    return unwrap<ReceiptVoucherDetail>(response.data);
  }
}
