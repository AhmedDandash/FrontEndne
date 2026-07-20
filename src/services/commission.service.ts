/**
 * Commission Service
 * GET /api/V1/Commission/GetAll — filters: empId, comDate, comDateTo.
 *
 * Service + type only (per architectural decision) — no list UI yet. A
 * Commission list page is a separate feature-build recommendation.
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';

function extractArray<T>(responseData: any): T[] {
  if (Array.isArray(responseData)) return responseData;
  if (responseData && typeof responseData === 'object') {
    for (const key of ['data', 'result', 'items']) {
      if (Array.isArray(responseData[key])) return responseData[key];
    }
  }
  return [];
}

export interface Commission {
  id: number | string;
  empId?: number | string | null;
  comDate?: string | null;
  [key: string]: unknown;
}

export interface CommissionQuery {
  empId?: number | string;
  comDate?: string;
  comDateTo?: string;
}

export class CommissionService {
  static async getAll(params?: CommissionQuery): Promise<Commission[]> {
    const clean = params
      ? Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
        )
      : undefined;
    const res = await api.get<any>(API_ENDPOINTS.COMMISSION.GET_ALL, { params: clean });
    return extractArray<Commission>(res.data);
  }
}
