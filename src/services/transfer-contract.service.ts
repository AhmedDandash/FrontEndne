/**
 * Transfer Contract Service
 * /api/TransferContract
 *
 * Lifecycle: Draft (1) → sign() → TransferCompleted (8)
 * Authority tracking: PATCH authority-status (4=SentToAuthorities, 5=Approved, 6=Rejected)
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import type {
  TransferContract,
  PaginatedTransferContractsResponse,
  CreateTransferContractDto,
} from '@/types/api.types';

/** Unwrap the standard { success, data, errors, statusCode } envelope */
function unwrap<T>(raw: any): T {
  if (raw?.data !== undefined) return raw.data as T;
  return raw as T;
}

export class TransferContractService {
  /**
   * GET /api/TransferContract?pageNumber=&pageSize=&search=...
   * Accepts any TransferContractQuery field as a plain object (ASP.NET query
   * binding is case-insensitive) — see `useTransferContracts.ts`'s
   * `TransferContractParams` for the full supported filter set, including
   * customerId, workerId, marketerId, updatedDateFrom/To, sortBy, sortDescending.
   */
  static async getAll(
    params?: Record<string, any>
  ): Promise<PaginatedTransferContractsResponse> {
    const response = await api.get<any>(API_ENDPOINTS.TRANSFER_CONTRACT.GET_ALL, { params });
    const envelope = response.data;
    // API returns { success, data: { pageSize, pageNumber, totalCount, items: [...] } }
    const page = envelope?.data ?? envelope;
    return {
      items: page?.items ?? [],
      totalCount: page?.totalCount ?? 0,
      pageNumber: page?.pageNumber ?? 1,
      pageSize: page?.pageSize ?? 10,
    };
  }

  /** GET /api/TransferContract/{id} */
  static async getById(id: string): Promise<TransferContract> {
    const response = await api.get<any>(API_ENDPOINTS.TRANSFER_CONTRACT.GET_BY_ID(id));
    return unwrap<TransferContract>(response.data);
  }

  /** POST /api/TransferContract */
  static async create(data: CreateTransferContractDto): Promise<TransferContract> {
    const response = await api.post<any>(API_ENDPOINTS.TRANSFER_CONTRACT.CREATE, data);
    return unwrap<TransferContract>(response.data);
  }

  /** DELETE /api/TransferContract/{id} — only Draft contracts can be deleted */
  static async delete(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.TRANSFER_CONTRACT.DELETE(id));
  }

  /** POST /api/TransferContract/{id}/sign — Draft → TransferCompleted */
  static async sign(id: string): Promise<void> {
    await api.post(API_ENDPOINTS.TRANSFER_CONTRACT.SIGN(id), null);
  }

  /** POST /api/TransferContract/{id}/complete — manual completion (requires Approved status) */
  static async complete(id: string): Promise<void> {
    await api.post(API_ENDPOINTS.TRANSFER_CONTRACT.COMPLETE(id), null);
  }

  /**
   * PATCH /api/TransferContract/{id}/authority-status?status=&note=
   * status: 4=SentToAuthorities, 5=Approved, 6=Rejected
   */
  static async updateAuthorityStatus(
    id: string,
    params: { status: number; note?: string }
  ): Promise<void> {
    await api.patch(API_ENDPOINTS.TRANSFER_CONTRACT.AUTHORITY_STATUS(id), null, { params });
  }
}
