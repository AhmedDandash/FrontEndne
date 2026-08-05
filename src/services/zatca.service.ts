/**
 * ZATCA Services
 * Saudi e-invoicing (Fatoora) compliance module — dashboard, branch setup,
 * CSR/certificate onboarding, invoices (view-only), settings, connection
 * diagnostics and logs. See src/types/zatca.types.ts for DTOs.
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import { unwrap, unwrapList } from '@/utils/api-response';
import type { PagedResponse } from '@/types/filters.types';
import type {
  ZatcaLookups,
  ZatcaDashboardSummary,
  ZatcaHealthStatus,
  ZatcaBranchContext,
  UpdateZatcaBranchSellerProfileDto,
  ZatcaEgsUnit,
  CreateZatcaEgsUnitDto,
  ZatcaCertificate,
  ZatcaCertificateHistory,
  ZatcaCertificateExpiration,
  ImportZatcaCredentialsDto,
  ZatcaCsrRequest,
  GenerateZatcaCsrDto,
  GenerateZatcaCsrResult,
  RequestZatcaComplianceCsidDto,
  RequestZatcaProductionCsidDto,
  RequestZatcaCsidResult,
  ZatcaGlobalSettings,
  UpdateZatcaGlobalSettingsDto,
  ZatcaBranchSettings,
  UpdateZatcaBranchSettingsDto,
  ZatcaInvoiceListItem,
  ZatcaInvoiceDetail,
  ZatcaInvoiceListParams,
  ZatcaApiRequestLog,
  ZatcaApiRequestLogDetail,
  ZatcaRequestLogListParams,
  ZatcaSubmissionLog,
  ZatcaSubmissionLogListParams,
  ZatcaConnectionTestResult,
  ZatcaDiagnostics,
} from '@/types/zatca.types';

/**
 * The backend returns `pageSize: 0` on empty pages (not the requested size),
 * which would otherwise break pagination controls that divide by it.
 */
function unwrapZatcaPaged<T>(payload: any, requested?: { pageNumber?: number; pageSize?: number }): PagedResponse<T> {
  const data = unwrap<any>(payload);
  const items: T[] = Array.isArray(data?.items) ? data.items : [];
  return {
    items,
    totalCount: data?.totalCount ?? items.length,
    pageNumber: data?.pageNumber || requested?.pageNumber || 1,
    pageSize: data?.pageSize || requested?.pageSize || items.length || 10,
  };
}

export class ZatcaLookupService {
  static async getLookups(): Promise<ZatcaLookups> {
    const response = await api.get<any>(API_ENDPOINTS.ZATCA.LOOKUPS);
    return unwrap<ZatcaLookups>(response.data);
  }
}

export class ZatcaDashboardService {
  static async getSummary(branchId: string): Promise<ZatcaDashboardSummary> {
    const response = await api.get<any>(API_ENDPOINTS.ZATCA.DASHBOARD_SUMMARY, { params: { branchId } });
    return unwrap<ZatcaDashboardSummary>(response.data);
  }

  static async getHealth(branchId: string): Promise<ZatcaHealthStatus> {
    const response = await api.get<any>(API_ENDPOINTS.ZATCA.HEALTH, { params: { branchId } });
    return unwrap<ZatcaHealthStatus>(response.data);
  }

  static async getBranchContext(branchId: string): Promise<ZatcaBranchContext> {
    const response = await api.get<any>(API_ENDPOINTS.ZATCA.BRANCH_CONTEXT, { params: { branchId } });
    return unwrap<ZatcaBranchContext>(response.data);
  }

  static async testConnection(branchId: string): Promise<ZatcaConnectionTestResult> {
    const response = await api.post<any>(API_ENDPOINTS.ZATCA.CONNECTION_TEST, {}, { params: { branchId } });
    return unwrap<ZatcaConnectionTestResult>(response.data);
  }

  static async getDiagnostics(branchId: string): Promise<ZatcaDiagnostics> {
    const response = await api.get<any>(API_ENDPOINTS.ZATCA.DIAGNOSTICS, { params: { branchId } });
    return unwrap<ZatcaDiagnostics>(response.data);
  }
}

export class ZatcaBranchSetupService {
  static async updateSellerProfile(data: UpdateZatcaBranchSellerProfileDto): Promise<ZatcaBranchContext> {
    const response = await api.put<any>(API_ENDPOINTS.ZATCA.UPDATE_BRANCH_PROFILE, data);
    return unwrap<ZatcaBranchContext>(response.data);
  }

  static async getEgsUnits(branchId: string): Promise<ZatcaEgsUnit[]> {
    const response = await api.get<any>(API_ENDPOINTS.ZATCA.EGS_UNITS, { params: { branchId } });
    return unwrapList<ZatcaEgsUnit>(response.data);
  }

  static async createEgsUnit(data: CreateZatcaEgsUnitDto): Promise<ZatcaEgsUnit> {
    const response = await api.post<any>(API_ENDPOINTS.ZATCA.EGS_UNITS, data);
    return unwrap<ZatcaEgsUnit>(response.data);
  }

  static async importCredentials(data: ImportZatcaCredentialsDto): Promise<ZatcaCertificate> {
    const response = await api.post<any>(API_ENDPOINTS.ZATCA.IMPORT_CERTIFICATE, data);
    return unwrap<ZatcaCertificate>(response.data);
  }
}

export class ZatcaCsrService {
  static async getRequests(branchId: string): Promise<ZatcaCsrRequest[]> {
    const response = await api.get<any>(API_ENDPOINTS.ZATCA.CSR_REQUESTS, { params: { branchId } });
    return unwrapList<ZatcaCsrRequest>(response.data);
  }

  static async generate(data: GenerateZatcaCsrDto): Promise<GenerateZatcaCsrResult> {
    const response = await api.post<any>(API_ENDPOINTS.ZATCA.GENERATE_CSR, data);
    return unwrap<GenerateZatcaCsrResult>(response.data);
  }

  static async requestComplianceCsid(data: RequestZatcaComplianceCsidDto): Promise<RequestZatcaCsidResult> {
    const response = await api.post<any>(API_ENDPOINTS.ZATCA.REQUEST_COMPLIANCE_CSID, data);
    return unwrap<RequestZatcaCsidResult>(response.data);
  }

  static async requestProductionCsid(data: RequestZatcaProductionCsidDto): Promise<RequestZatcaCsidResult> {
    const response = await api.post<any>(API_ENDPOINTS.ZATCA.REQUEST_PRODUCTION_CSID, data);
    return unwrap<RequestZatcaCsidResult>(response.data);
  }
}

export class ZatcaCertificateService {
  static async getAll(branchId: string): Promise<ZatcaCertificate[]> {
    const response = await api.get<any>(API_ENDPOINTS.ZATCA.CERTIFICATES, { params: { branchId } });
    return unwrapList<ZatcaCertificate>(response.data);
  }

  static async getHistory(branchId: string): Promise<ZatcaCertificateHistory[]> {
    const response = await api.get<any>(API_ENDPOINTS.ZATCA.CERTIFICATE_HISTORY, { params: { branchId } });
    return unwrapList<ZatcaCertificateHistory>(response.data);
  }

  static async getExpiration(branchId: string): Promise<ZatcaCertificateExpiration[]> {
    const response = await api.get<any>(API_ENDPOINTS.ZATCA.CERTIFICATE_EXPIRATION, { params: { branchId } });
    return unwrapList<ZatcaCertificateExpiration>(response.data);
  }
}

export class ZatcaSettingsService {
  static async getGlobal(): Promise<ZatcaGlobalSettings> {
    const response = await api.get<any>(API_ENDPOINTS.ZATCA.GLOBAL_SETTINGS);
    return unwrap<ZatcaGlobalSettings>(response.data);
  }

  static async updateGlobal(data: UpdateZatcaGlobalSettingsDto): Promise<ZatcaGlobalSettings> {
    const response = await api.put<any>(API_ENDPOINTS.ZATCA.GLOBAL_SETTINGS, data);
    return unwrap<ZatcaGlobalSettings>(response.data);
  }

  /** Returns null on first-time 404 (no branch settings saved yet) rather than throwing. */
  static async getBranch(branchId: string): Promise<ZatcaBranchSettings | null> {
    try {
      const response = await api.get<any>(API_ENDPOINTS.ZATCA.BRANCH_SETTINGS, { params: { branchId } });
      return unwrap<ZatcaBranchSettings>(response.data);
    } catch (err: any) {
      if (err?.response?.status === 404) return null;
      throw err;
    }
  }

  /** PUT also creates the branch settings row on first save (no separate POST). */
  static async updateBranch(data: UpdateZatcaBranchSettingsDto): Promise<ZatcaBranchSettings> {
    const response = await api.put<any>(API_ENDPOINTS.ZATCA.BRANCH_SETTINGS, data);
    return unwrap<ZatcaBranchSettings>(response.data);
  }
}

export class ZatcaInvoiceService {
  static async getAll(params: ZatcaInvoiceListParams): Promise<PagedResponse<ZatcaInvoiceListItem>> {
    const response = await api.get<any>(API_ENDPOINTS.ZATCA.INVOICES, {
      params: {
        branchId: params.branchId,
        pageNumber: params.pageNumber ?? 1,
        pageSize: params.pageSize ?? 20,
        submissionStatus: params.submissionStatus,
        fromDate: params.fromDate || undefined,
        toDate: params.toDate || undefined,
        search: params.search || undefined,
      },
    });
    return unwrapZatcaPaged<ZatcaInvoiceListItem>(response.data, params);
  }

  static async getById(id: string, branchId: string): Promise<ZatcaInvoiceDetail> {
    const response = await api.get<any>(API_ENDPOINTS.ZATCA.INVOICE_BY_ID(id), { params: { branchId } });
    return unwrap<ZatcaInvoiceDetail>(response.data);
  }
}

export class ZatcaLogsService {
  static async getRequestLogs(params: ZatcaRequestLogListParams): Promise<PagedResponse<ZatcaApiRequestLog>> {
    const response = await api.get<any>(API_ENDPOINTS.ZATCA.REQUEST_LOGS, {
      params: {
        branchId: params.branchId,
        pageNumber: params.pageNumber ?? 1,
        pageSize: params.pageSize ?? 20,
        requestType: params.requestType,
        isSuccess: params.isSuccess,
        fromDate: params.fromDate || undefined,
        toDate: params.toDate || undefined,
      },
    });
    return unwrapZatcaPaged<ZatcaApiRequestLog>(response.data, params);
  }

  static async getRequestLogById(id: string, branchId: string): Promise<ZatcaApiRequestLogDetail> {
    const response = await api.get<any>(API_ENDPOINTS.ZATCA.REQUEST_LOG_BY_ID(id), { params: { branchId } });
    return unwrap<ZatcaApiRequestLogDetail>(response.data);
  }

  static async getSubmissionLogs(params: ZatcaSubmissionLogListParams): Promise<PagedResponse<ZatcaSubmissionLog>> {
    const response = await api.get<any>(API_ENDPOINTS.ZATCA.SUBMISSION_LOGS, {
      params: {
        branchId: params.branchId,
        pageNumber: params.pageNumber ?? 1,
        pageSize: params.pageSize ?? 20,
        requestType: params.requestType,
        isSuccess: params.isSuccess,
        fromDate: params.fromDate || undefined,
        toDate: params.toDate || undefined,
      },
    });
    return unwrapZatcaPaged<ZatcaSubmissionLog>(response.data, params);
  }
}
