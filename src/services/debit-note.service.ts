import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import { unwrap, unwrapList } from '@/utils/api-response';
import type {
  DebitNote,
  CreateDebitNoteDto,
  AccountingDocumentFilterDto,
  AccountingDocumentTrace,
} from '@/types/api.types';

export class DebitNoteService {
  static async getAll(filters: AccountingDocumentFilterDto = {}): Promise<DebitNote[]> {
    const response = await api.get<any>(API_ENDPOINTS.DEBIT_NOTE.GET_ALL, {
      params: {
        customerId: filters.customerId || undefined,
        agentId: filters.agentId || undefined,
        contractId: filters.contractId || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
      },
    });
    return unwrapList<DebitNote>(response.data);
  }

  static async getById(id: string): Promise<DebitNote> {
    const response = await api.get<any>(API_ENDPOINTS.DEBIT_NOTE.GET_BY_ID(id));
    return unwrap<DebitNote>(response.data);
  }

  static async getTrace(id: string): Promise<AccountingDocumentTrace> {
    const response = await api.get<any>(API_ENDPOINTS.DEBIT_NOTE.TRACE(id));
    return unwrap<AccountingDocumentTrace>(response.data);
  }

  static async create(data: CreateDebitNoteDto): Promise<DebitNote> {
    const response = await api.post<any>(API_ENDPOINTS.DEBIT_NOTE.CREATE, data);
    return unwrap<DebitNote>(response.data);
  }
}
