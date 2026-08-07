/**
 * Employment Operating Contract Service
 * Migrated to new API contract.
 *
 * Key changes from old API:
 *  - EndContract removed → replaced by sign / start-execution / renew / terminate
 *  - New lifecycle: Draft → sign() → Signed → start-execution() → Executing
 *                   → renew() (extends end date) OR terminate() → Finished
 *  - terminate() now takes a { note, refundAmount } DTO (was a raw string)
 *  - recordCustomerRefund(): pays cash back to the customer after termination
 *  - printReceiptForm() for fetching print data
 *  - GET params renamed: SearchWorkerName, WorkerPhone, IdentityNumber, ContractStatus, etc.
 *
 * Response unwrapping is delegated to the shared `@/utils/api-response` helpers.
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import { unwrap, unwrapList } from '@/utils/api-response';
import { buildListParams } from '@/lib/api/buildListParams';
import type {
  EmploymentOperatingContract,
  CreateEmploymentOperatingContractDto,
  UpdateEmploymentOperatingContractDto,
  TerminateContractDto,
  CustomerRefundDto,
  ContractPrintReceiptData,
  OperatingContractDeliveryFormDto,
  SaveDeliveryFormDto,
} from '@/types/api.types';
import type { PagedResponse } from '@/types/filters.types';

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
  // NOTE: the page currently fetches all rows (PageSize=9999) and filters
  // client-side — these fields are accepted as pass-through for callers that
  // want to send them server-side, but the rent page applies them locally
  // instead (see contracts/operation/rent/page.tsx `filteredContracts`).
  ContractNumber?: string | number;
  MarketerId?: string | number;
  NationalityId?: string | number;
  JobId?: string | number;
  OperationType?: number;
  LaborManagement?: number;
  ContractDateFrom?: string;
  ContractDateTo?: string;
  // Additive range/date filters (see contracts/operation/rent/page.tsx filter
  // card) — all sent server-side alongside ContractNumber/MarketerId/ContractDate above.
  ContractEndDateFrom?: string;
  ContractEndDateTo?: string;
  FinishDateFrom?: string;
  FinishDateTo?: string;
  MinDuration?: number;
  MaxDuration?: number;
  MinPreviousExperience?: number;
  MaxPreviousExperience?: number;
  MinOfferPrice?: number;
  MaxOfferPrice?: number;
  MinWorkersCount?: number;
  MaxWorkersCount?: number;
  MinCost?: number;
  MaxCost?: number;
  MinInsurance?: number;
  MaxInsurance?: number;
  Search?: string;
  CreatedDateFrom?: string;
  CreatedDateTo?: string;
  UpdatedDateFrom?: string;
  UpdatedDateTo?: string;
  SortBy?: string;
  SortDescending?: boolean;
}

export class EmploymentOperatingContractService {
  /**
   * GET /api/EmploymentOperatingContract
   * Query params now use PascalCase keys per swagger.
   */
  static async getAll(
    params?: GetContractsParams | Record<string, any>
  ): Promise<EmploymentOperatingContract[]> {
    // Always fetch every item — the API defaults to a tiny page size which hides data.
    // Spread caller params first, then force the pagination keys so a caller passing
    // `PageSize: undefined` (or omitting it) can never shrink the page back down.
    const mergedParams: Record<string, any> = {
      ...params,
      PageNumber: (params as any)?.PageNumber ?? 1,
      PageSize: (params as any)?.PageSize ?? 9999,
    };
    const response = await api.get<any>(API_ENDPOINTS.EMPLOYMENT_OPERATING_CONTRACT.GET_ALL, {
      params: mergedParams,
    });
    return unwrapList<EmploymentOperatingContract>(response.data);
  }

  /**
   * GET /api/EmploymentOperatingContract — real server-side pagination.
   * Kept separate from `getAll()` (which several other pages use as an
   * unpaginated reference list) so this is purely additive. Only the rent
   * contracts list page uses this for its primary table.
   */
  static async getPaged(
    params?: GetContractsParams
  ): Promise<PagedResponse<EmploymentOperatingContract>> {
    const query = buildListParams(params as Record<string, unknown>);
    const response = await api.get<any>(API_ENDPOINTS.EMPLOYMENT_OPERATING_CONTRACT.GET_ALL, {
      params: query,
    });
    const page = unwrap<any>(response.data);
    return {
      items: Array.isArray(page?.items) ? page.items : Array.isArray(page) ? page : [],
      totalCount: page?.totalCount ?? 0,
      pageNumber: page?.pageNumber ?? params?.PageNumber ?? 1,
      pageSize: page?.pageSize ?? params?.PageSize ?? 10,
    };
  }

  /**
   * GET /api/EmploymentOperatingContract/{id}
   */
  static async getById(id: number | string): Promise<EmploymentOperatingContract> {
    const response = await api.get<any>(
      API_ENDPOINTS.EMPLOYMENT_OPERATING_CONTRACT.GET_BY_ID(id)
    );
    return unwrap<EmploymentOperatingContract>(response.data);
  }

  /**
   * POST /api/EmploymentOperatingContract
   */
  static async create(
    data: CreateEmploymentOperatingContractDto
  ): Promise<EmploymentOperatingContract> {
    const response = await api.post<any>(
      API_ENDPOINTS.EMPLOYMENT_OPERATING_CONTRACT.CREATE,
      data
    );
    return unwrap<EmploymentOperatingContract>(response.data);
  }

  /**
   * PUT /api/EmploymentOperatingContract/{id}
   */
  static async update(
    id: number | string,
    data: UpdateEmploymentOperatingContractDto
  ): Promise<EmploymentOperatingContract> {
    const response = await api.put<any>(
      API_ENDPOINTS.EMPLOYMENT_OPERATING_CONTRACT.UPDATE(id),
      data
    );
    return unwrap<EmploymentOperatingContract>(response.data);
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
   * Body: raw date-time string e.g. "2025-12-31T00:00:00"
   */
  static async renew(id: number | string, newEndDate: string): Promise<void> {
    await api.post(API_ENDPOINTS.EMPLOYMENT_OPERATING_CONTRACT.RENEW(id), JSON.stringify(newEndDate), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * POST /api/EmploymentOperatingContract/{id}/terminate
   * Transition: Executing → Finished.
   * Backend automatically sets WorkerStatus → 3 (InAccommodation) and IsFinish → true,
   * and generates a Draft credit note (revenue reversal). When `refundAmount` > 0 the
   * credit note also credits Customer Payable.
   * Body: { note?, refundAmount? }
   */
  static async terminate(id: number | string, data: TerminateContractDto): Promise<void> {
    await api.post(API_ENDPOINTS.EMPLOYMENT_OPERATING_CONTRACT.TERMINATE(id), {
      note: data.note ?? null,
      refundAmount: data.refundAmount ?? 0,
    });
  }

  /**
   * POST /api/EmploymentOperatingContract/{id}/customer-refund
   * Records the cash refund paid back to the customer after termination.
   * Call this once the business is ready to pay out the `refundAmount` set on terminate.
   * Body: { amount, paymentMethod?, description? }
   */
  static async recordCustomerRefund(
    id: number | string,
    data: CustomerRefundDto
  ): Promise<void> {
    await api.post(API_ENDPOINTS.EMPLOYMENT_OPERATING_CONTRACT.CUSTOMER_REFUND(id), {
      amount: data.amount,
      paymentMethod: data.paymentMethod ?? 1,
      description: data.description ?? null,
    });
  }

  /**
   * GET /api/EmploymentOperatingContract/{id}/print-receipt-form
   * Returns `{ message, contract }`; we normalise to `{ message, contract }`
   * regardless of whether the API wraps it in the standard envelope.
   */
  static async printReceiptForm(id: number | string): Promise<ContractPrintReceiptData> {
    const response = await api.get<any>(
      API_ENDPOINTS.EMPLOYMENT_OPERATING_CONTRACT.PRINT_RECEIPT_FORM(id)
    );
    const payload = unwrap<any>(response.data);
    const contract = payload?.contract ?? payload;
    return { message: payload?.message ?? null, contract };
  }

  /**
   * GET /api/EmploymentOperatingContract/{id}/print-delivery-form
   * Returns the OperatingContractDeliveryFormDto (customer + worker + signatures).
   */
  static async printDeliveryForm(id: number | string): Promise<OperatingContractDeliveryFormDto> {
    const response = await api.get<any>(
      API_ENDPOINTS.EMPLOYMENT_OPERATING_CONTRACT.PRINT_DELIVERY_FORM(id)
    );
    return unwrap<OperatingContractDeliveryFormDto>(response.data);
  }

  /**
   * POST /api/EmploymentOperatingContract/{id}/delivery-form
   * Saves the delivery date / employee name / signatures.
   */
  static async saveDeliveryForm(
    id: number | string,
    data: SaveDeliveryFormDto
  ): Promise<OperatingContractDeliveryFormDto> {
    const response = await api.post<any>(
      API_ENDPOINTS.EMPLOYMENT_OPERATING_CONTRACT.DELIVERY_FORM(id),
      {
        deliveryDate: data.deliveryDate ?? null,
        employeeName: data.employeeName ?? null,
        notes: data.notes ?? null,
        customerSignedAt: data.customerSignedAt ?? null,
        workerSignedAt: data.workerSignedAt ?? null,
        companyRepresentativeSignedAt: data.companyRepresentativeSignedAt ?? null,
      }
    );
    return unwrap<OperatingContractDeliveryFormDto>(response.data);
  }
}
