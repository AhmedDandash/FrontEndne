import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import { unwrap, unwrapList } from '@/utils/api-response';
import type {
  PaymentVoucher,
  CreatePaymentVoucherDto,
  AccountingDocumentFilterDto,
  AccountingDocumentTrace,
} from '@/types/api.types';

export class PaymentVoucherService {
  static async getAll(filters: AccountingDocumentFilterDto = {}): Promise<PaymentVoucher[]> {
    const response = await api.get<any>(API_ENDPOINTS.PAYMENT_VOUCHER.GET_ALL, {
      params: {
        customerId: filters.customerId || undefined,
        agentId: filters.agentId || undefined,
        contractId: filters.contractId || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        branchId: filters.branchId || undefined,
        includeSubBranches: filters.branchId ? filters.includeSubBranches ?? undefined : undefined,
      },
    });
    return unwrapList<PaymentVoucher>(response.data);
  }

  static async getById(id: string): Promise<PaymentVoucher> {
    const response = await api.get<any>(API_ENDPOINTS.PAYMENT_VOUCHER.GET_BY_ID(id));
    return unwrap<PaymentVoucher>(response.data);
  }

  static async getTrace(id: string): Promise<AccountingDocumentTrace> {
    const response = await api.get<any>(API_ENDPOINTS.PAYMENT_VOUCHER.TRACE(id));
    return unwrap<AccountingDocumentTrace>(response.data);
  }

  static async create(data: CreatePaymentVoucherDto): Promise<PaymentVoucher> {
    const response = await api.post<any>(API_ENDPOINTS.PAYMENT_VOUCHER.CREATE, data);
    return unwrap<PaymentVoucher>(response.data);
  }
}
