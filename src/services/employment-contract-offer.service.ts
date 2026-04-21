/**
 * Operating Contract Offer Service
 * Migrated to new API contract.
 *
 * Breaking changes from old API:
 *  - Renamed from EmploymentContractOffers → OperatingContractOffer
 *  - New endpoint: /api/OperatingContractOffer
 *  - SUMMARY endpoint removed
 *  - nationalityId, jobId, branchId are now UUID strings
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import type {
  OperatingContractOffer,
  CreateOperatingContractOfferDto,
  UpdateOperatingContractOfferDto,
} from '@/types/api.types';

export class OperatingContractOfferService {
  /**
   * GET /api/OperatingContractOffer
   */
  static async getAll(params?: Record<string, any>): Promise<OperatingContractOffer[]> {
    const response = await api.get<any>(API_ENDPOINTS.OPERATING_CONTRACT_OFFER.GET_ALL, { params });

    if (Array.isArray(response.data)) return response.data;
    if (response.data?.data && Array.isArray(response.data.data)) return response.data.data;
    if (response.data?.result && Array.isArray(response.data.result)) return response.data.result;
    if (response.data?.items && Array.isArray(response.data.items)) return response.data.items;
    return [];
  }

  /**
   * GET /api/OperatingContractOffer/{id}
   */
  static async getById(id: number | string): Promise<OperatingContractOffer> {
    const response = await api.get<OperatingContractOffer>(
      API_ENDPOINTS.OPERATING_CONTRACT_OFFER.GET_BY_ID(id)
    );
    return response.data;
  }

  /**
   * POST /api/OperatingContractOffer
   */
  static async create(data: CreateOperatingContractOfferDto): Promise<OperatingContractOffer> {
    const response = await api.post<OperatingContractOffer>(
      API_ENDPOINTS.OPERATING_CONTRACT_OFFER.CREATE,
      data
    );
    return response.data;
  }

  /**
   * PUT /api/OperatingContractOffer/{id}
   */
  static async update(
    id: number | string,
    data: UpdateOperatingContractOfferDto
  ): Promise<OperatingContractOffer> {
    const response = await api.put<OperatingContractOffer>(
      API_ENDPOINTS.OPERATING_CONTRACT_OFFER.UPDATE(id),
      data
    );
    return response.data;
  }

  /**
   * DELETE /api/OperatingContractOffer/{id}
   */
  static async delete(id: number | string): Promise<void> {
    await api.delete(API_ENDPOINTS.OPERATING_CONTRACT_OFFER.DELETE(id));
  }
}

/** @deprecated Use OperatingContractOfferService */
export const EmploymentContractOfferService = OperatingContractOfferService;
