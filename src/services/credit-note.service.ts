import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import { unwrap, unwrapList } from '@/utils/api-response';
import type {
  CreditNote,
  CreateCreditNoteDto,
  AccountingDocumentFilterDto,
  AccountingDocumentTrace,
} from '@/types/api.types';

export class CreditNoteService {
  static async getAll(filters: AccountingDocumentFilterDto = {}): Promise<CreditNote[]> {
    const response = await api.get<any>(API_ENDPOINTS.CREDIT_NOTE.GET_ALL, {
      params: {
        customerId: filters.customerId || undefined,
        agentId: filters.agentId || undefined,
        contractId: filters.contractId || undefined,
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
    return unwrapList<CreditNote>(response.data);
  }

  static async getById(id: string): Promise<CreditNote> {
    const response = await api.get<any>(API_ENDPOINTS.CREDIT_NOTE.GET_BY_ID(id));
    return unwrap<CreditNote>(response.data);
  }

  static async getTrace(id: string): Promise<AccountingDocumentTrace> {
    const response = await api.get<any>(API_ENDPOINTS.CREDIT_NOTE.TRACE(id));
    return unwrap<AccountingDocumentTrace>(response.data);
  }

  static async create(data: CreateCreditNoteDto): Promise<CreditNote> {
    const response = await api.post<any>(API_ENDPOINTS.CREDIT_NOTE.CREATE, data);
    return unwrap<CreditNote>(response.data);
  }
}
