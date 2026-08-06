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

/**
 * Optional server-side filters for GET /api/OperatingContractOffer.
 * This is bounded reference/picker data so the service still fetches "all"
 * (PageSize=9999, PageNumber=1) — but sending these cheap query params
 * server-side is strictly better than fetching everything and filtering
 * client-side.
 */
export interface OperatingContractOfferQuery {
  SearchTitle?: string;
  OfferType?: number;
  BranchId?: string;
  NationalityId?: string;
  JobId?: string;
  IsActive?: boolean;
  // Extra range filters (gap audit — verified live).
  NumberOfDaysMin?: number;
  NumberOfDaysMax?: number;
  CostMin?: number;
  CostMax?: number;
  WorkerSalaryMin?: number;
  WorkerSalaryMax?: number;
}

export class OperatingContractOfferService {
  /**
   * GET /api/OperatingContractOffer
   */
  static async getAll(
    params?: OperatingContractOfferQuery | Record<string, any>
  ): Promise<OperatingContractOffer[]> {
    // Always fetch all items — API defaults to pageSize=1 which would hide data
    const mergedParams = { PageSize: 9999, PageNumber: 1, ...params };
    const response = await api.get<any>(API_ENDPOINTS.OPERATING_CONTRACT_OFFER.GET_ALL, {
      params: mergedParams,
    });
    const d = response.data;

    // flat array
    if (Array.isArray(d)) return d;
    // { data: { items: [...] } }  ← actual API shape confirmed from network tab
    if (Array.isArray(d?.data?.items)) return d.data.items;
    // { data: [...] }
    if (Array.isArray(d?.data)) return d.data;
    // { items: [...] }
    if (Array.isArray(d?.items)) return d.items;
    // { result: [...] }
    if (Array.isArray(d?.result)) return d.result;

    console.warn('[OperatingContractOfferService] Unexpected response shape:', d);
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
