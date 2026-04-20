/**
 * Employment Operating Contract Service
 * Migrated to new API contract.
 *
 * Key changes from old API:
 *  - EndContract removed → replaced by sign / start-execution / renew / terminate
 *  - New lifecycle: Draft → sign() → Signed → start-execution() → Executing
 *                   → renew() (extends end date) OR terminate() → Finished
 *  - New: printReceiptForm() for fetching print data
 *  - GET params renamed: SearchWorkerName, WorkerPhone, IdentityNumber, ContractStatus, etc.
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import type {
  EmploymentOperatingContract,
  CreateEmploymentOperatingContractDto,
  UpdateEmploymentOperatingContractDto,
  RenewContractDto,
  TerminateContractDto,
  ContractPrintReceiptData,
} from '@/types/api.types';

export interface GetContractsParams {
  SearchWorkerName?: string;
  WorkerPhone?: string;
  IdentityNumber?: string;
  CustomerId?: string | number;
  WorkerId?: string | number;
  /** ContractStatus enum: 1=Draft, 2=Signed, 3=Executing, 4=Finished */
  ContractStatus?: number;
  IsFinish?: boolean;
  PageNumber?: number;
  PageSize?: number;
}

export class EmploymentOperatingContractService {
  /**
   * GET /api/EmploymentOperatingContract
   * Query params now use PascalCase keys per swagger.
   */
  static async getAll(
    params?: GetContractsParams | Record<string, any>
  ): Promise<EmploymentOperatingContract[]> {
    const response = await api.get<any>(API_ENDPOINTS.EMPLOYMENT_OPERATING_CONTRACT.GET_ALL, {
      params,
    });

    if (Array.isArray(response.data)) return response.data;
    if (response.data?.data && Array.isArray(response.data.data)) return response.data.data;
    if (response.data?.result && Array.isArray(response.data.result)) return response.data.result;
    if (response.data?.items && Array.isArray(response.data.items)) return response.data.items;
    return [];
  }

  /**
   * GET /api/EmploymentOperatingContract/{id}
   */
  static async getById(id: number | string): Promise<EmploymentOperatingContract> {
    const response = await api.get<EmploymentOperatingContract>(
      API_ENDPOINTS.EMPLOYMENT_OPERATING_CONTRACT.GET_BY_ID(id)
    );
    return response.data;
  }

  /**
   * POST /api/EmploymentOperatingContract
   */
  static async create(
    data: CreateEmploymentOperatingContractDto
  ): Promise<EmploymentOperatingContract> {
    const response = await api.post<EmploymentOperatingContract>(
      API_ENDPOINTS.EMPLOYMENT_OPERATING_CONTRACT.CREATE,
      data
    );
    return response.data;
  }

  /**
   * PUT /api/EmploymentOperatingContract/{id}
   */
  static async update(
    id: number | string,
    data: UpdateEmploymentOperatingContractDto
  ): Promise<EmploymentOperatingContract> {
    const response = await api.put<EmploymentOperatingContract>(
      API_ENDPOINTS.EMPLOYMENT_OPERATING_CONTRACT.UPDATE(id),
      data
    );
    return response.data;
  }

  /**
   * DELETE /api/EmploymentOperatingContract/{id}
   */
  static async delete(id: number | string): Promise<void> {
    await api.delete(API_ENDPOINTS.EMPLOYMENT_OPERATING_CONTRACT.DELETE(id));
  }

  // ─── Lifecycle Transitions ─────────────────────────────────────────────────

  /**
   * POST /api/EmploymentOperatingContract/{id}/sign
   * Transition: Draft → Signed. No request body.
   */
  static async sign(id: number | string): Promise<void> {
    await api.post(API_ENDPOINTS.EMPLOYMENT_OPERATING_CONTRACT.SIGN(id), null);
  }

  /**
   * POST /api/EmploymentOperatingContract/{id}/start-execution
   * Transition: Signed → Executing.
   * Backend automatically sets WorkerStatus → 4 (AtCustomer).
   * No request body.
   */
  static async startExecution(id: number | string): Promise<void> {
    await api.post(API_ENDPOINTS.EMPLOYMENT_OPERATING_CONTRACT.START_EXECUTION(id), null);
  }

  /**
   * POST /api/EmploymentOperatingContract/{id}/renew
   * Extends contractEndDate while keeping status as Executing.
   * Body: { newEndDate: "YYYY-MM-DD" }
   */
  static async renew(id: number | string, data: RenewContractDto): Promise<void> {
    await api.post(API_ENDPOINTS.EMPLOYMENT_OPERATING_CONTRACT.RENEW(id), data);
  }

  /**
   * POST /api/EmploymentOperatingContract/{id}/terminate
   * Transition: Executing → Finished.
   * Backend automatically sets WorkerStatus → 3 (InAccommodation) and IsFinish → true.
   * Body: { note: string }
   */
  static async terminate(id: number | string, data: TerminateContractDto): Promise<void> {
    await api.post(API_ENDPOINTS.EMPLOYMENT_OPERATING_CONTRACT.TERMINATE(id), data);
  }

  /**
   * GET /api/EmploymentOperatingContract/{id}/print-receipt-form
   * Returns complete contract data (customer, worker, pricing, dates) for print UI.
   */
  static async printReceiptForm(id: number | string): Promise<ContractPrintReceiptData> {
    const response = await api.get<ContractPrintReceiptData>(
      API_ENDPOINTS.EMPLOYMENT_OPERATING_CONTRACT.PRINT_RECEIPT_FORM(id)
    );
    return response.data;
  }
}
