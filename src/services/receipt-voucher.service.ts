/**
 * Receipt Voucher Service
 * New module in new API contract: /api/ReceiptVoucher
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import { unwrap, unwrapList } from '@/utils/api-response';
import type { ReceiptVoucher, CreateReceiptVoucherDto, UpdateReceiptVoucherDto } from '@/types/api.types';

export class ReceiptVoucherService {
  /**
   * GET /api/ReceiptVoucher
   */
  static async getAll(params?: Record<string, any>): Promise<ReceiptVoucher[]> {
    const response = await api.get<any>(API_ENDPOINTS.RECEIPT_VOUCHER.GET_ALL, { params });
    return unwrapList<ReceiptVoucher>(response.data);
  }

  /**
   * GET /api/ReceiptVoucher/{id}
   */
  static async getById(id: number | string): Promise<ReceiptVoucher> {
    const response = await api.get<any>(API_ENDPOINTS.RECEIPT_VOUCHER.GET_BY_ID(id));
    return unwrap<ReceiptVoucher>(response.data);
  }

  /**
   * POST /api/ReceiptVoucher
   * Body: { voucherNumber, voucherDate, amount, notes, employmentOperatingContractId (uuid) }
   */
  static async create(data: CreateReceiptVoucherDto): Promise<ReceiptVoucher> {
    const response = await api.post<any>(API_ENDPOINTS.RECEIPT_VOUCHER.CREATE, data);
    return unwrap<ReceiptVoucher>(response.data);
  }

  /**
   * PUT /api/ReceiptVoucher/{id}
   */
  static async update(id: number | string, data: UpdateReceiptVoucherDto): Promise<ReceiptVoucher> {
    const response = await api.put<any>(API_ENDPOINTS.RECEIPT_VOUCHER.UPDATE(id), data);
    return unwrap<ReceiptVoucher>(response.data);
  }

  /**
   * DELETE /api/ReceiptVoucher/{id}
   */
  static async delete(id: number | string): Promise<void> {
    await api.delete(API_ENDPOINTS.RECEIPT_VOUCHER.DELETE(id));
  }
}
