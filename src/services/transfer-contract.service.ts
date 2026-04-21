/**
 * Transfer Contract Service
 * New module in new API contract: /api/TransferContract
 *
 * Lifecycle: Draft → sign() → Signed → complete() → Completed
 * authority-status: updates submission authority status
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import type { TransferContract, CreateTransferContractDto, UpdateTransferContractDto } from '@/types/api.types';

export class TransferContractService {
  /**
   * GET /api/TransferContract
   */
  static async getAll(params?: Record<string, any>): Promise<TransferContract[]> {
    const response = await api.get<any>(API_ENDPOINTS.TRANSFER_CONTRACT.GET_ALL, { params });

    if (Array.isArray(response.data)) return response.data;
    if (response.data?.data && Array.isArray(response.data.data)) return response.data.data;
    if (response.data?.result && Array.isArray(response.data.result)) return response.data.result;
    if (response.data?.items && Array.isArray(response.data.items)) return response.data.items;
    return [];
  }

  /**
   * GET /api/TransferContract/{id}
   */
  static async getById(id: number | string): Promise<TransferContract> {
    const response = await api.get<TransferContract>(API_ENDPOINTS.TRANSFER_CONTRACT.GET_BY_ID(id));
    return response.data;
  }

  /**
   * POST /api/TransferContract
   * Body: { customerId, workerId, marketerId, transferFees, governmentFees, totalAmount, notes }
   */
  static async create(data: CreateTransferContractDto): Promise<TransferContract> {
    const response = await api.post<TransferContract>(API_ENDPOINTS.TRANSFER_CONTRACT.CREATE, data);
    return response.data;
  }

  /**
   * PUT /api/TransferContract/{id}
   */
  static async update(id: number | string, data: UpdateTransferContractDto): Promise<TransferContract> {
    const response = await api.put<TransferContract>(API_ENDPOINTS.TRANSFER_CONTRACT.UPDATE(id), data);
    return response.data;
  }

  /**
   * DELETE /api/TransferContract/{id}
   */
  static async delete(id: number | string): Promise<void> {
    await api.delete(API_ENDPOINTS.TRANSFER_CONTRACT.DELETE(id));
  }

  /**
   * POST /api/TransferContract/{id}/sign
   * Transition: Draft → Signed. No request body.
   */
  static async sign(id: number | string): Promise<void> {
    await api.post(API_ENDPOINTS.TRANSFER_CONTRACT.SIGN(id), null);
  }

  /**
   * POST /api/TransferContract/{id}/complete
   * Transition: Signed → Completed. No request body.
   */
  static async complete(id: number | string): Promise<void> {
    await api.post(API_ENDPOINTS.TRANSFER_CONTRACT.COMPLETE(id), null);
  }

  /**
   * PATCH /api/TransferContract/{id}/authority-status?status=&note=
   * Updates submission authority status.
   * @param status — TransferContractStatus enum value (1-7)
   * @param note   — optional note string
   */
  static async updateAuthorityStatus(
    id: number | string,
    params?: { status?: number; note?: string }
  ): Promise<void> {
    await api.patch(API_ENDPOINTS.TRANSFER_CONTRACT.AUTHORITY_STATUS(id), null, {
      params: params ?? {},
    });
  }
}
