/**
 * Worker Delivery Record Service — signed handover receipt (FEdits-2 §5).
 * Mirrors employment-operating-contract.service.ts's conventions.
 *
 * No list/by-contract lookup endpoint exists server-side (confirmed against
 * live swagger, 2026-08-03) — callers must track the created id themselves
 * (see useWorkerDeliveryRecord.ts's localStorage-backed lookup).
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import { unwrap } from '@/utils/api-response';
import type {
  CreateWorkerDeliveryRecordDto,
  UpdateWorkerDeliveryRecordDto,
  WorkerDeliveryRecordDto,
  WorkerDeliveryRecordPrintDto,
} from '@/types/api.types';

export class WorkerDeliveryRecordService {
  /** POST /api/WorkerDeliveryRecord */
  static async create(data: CreateWorkerDeliveryRecordDto): Promise<WorkerDeliveryRecordDto> {
    const response = await api.post<any>(API_ENDPOINTS.WORKER_DELIVERY_RECORD.CREATE, data);
    return unwrap<WorkerDeliveryRecordDto>(response.data);
  }

  /** GET /api/WorkerDeliveryRecord/{id} */
  static async getById(id: string): Promise<WorkerDeliveryRecordDto> {
    const response = await api.get<any>(API_ENDPOINTS.WORKER_DELIVERY_RECORD.GET_BY_ID(id));
    return unwrap<WorkerDeliveryRecordDto>(response.data);
  }

  /** PUT /api/WorkerDeliveryRecord/{id} */
  static async update(
    id: string,
    data: UpdateWorkerDeliveryRecordDto
  ): Promise<WorkerDeliveryRecordDto> {
    const response = await api.put<any>(API_ENDPOINTS.WORKER_DELIVERY_RECORD.UPDATE(id), data);
    return unwrap<WorkerDeliveryRecordDto>(response.data);
  }

  /** GET /api/WorkerDeliveryRecord/{id}/print */
  static async print(id: string): Promise<WorkerDeliveryRecordPrintDto> {
    const response = await api.get<any>(API_ENDPOINTS.WORKER_DELIVERY_RECORD.PRINT(id));
    return unwrap<WorkerDeliveryRecordPrintDto>(response.data);
  }
}
