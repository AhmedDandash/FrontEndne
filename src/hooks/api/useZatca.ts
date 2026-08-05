/**
 * ZATCA hooks — dashboard, branch setup, CSR/certificate onboarding,
 * invoices (view-only), settings, connection/diagnostics, logs.
 * Lookups (status/type names) are fetched once and cached indefinitely —
 * see useZatcaLookups + useZatcaLookupLabel.
 */

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
  ZatcaLookupService,
  ZatcaDashboardService,
  ZatcaBranchSetupService,
  ZatcaCsrService,
  ZatcaCertificateService,
  ZatcaSettingsService,
  ZatcaInvoiceService,
  ZatcaLogsService,
} from '@/services/zatca.service';
import { getApiErrorMessage } from '@/utils/api-error';
import type {
  ZatcaLookupCategory,
  UpdateZatcaBranchSellerProfileDto,
  CreateZatcaEgsUnitDto,
  ImportZatcaCredentialsDto,
  GenerateZatcaCsrDto,
  RequestZatcaComplianceCsidDto,
  RequestZatcaProductionCsidDto,
  UpdateZatcaGlobalSettingsDto,
  UpdateZatcaBranchSettingsDto,
  ZatcaInvoiceListParams,
  ZatcaRequestLogListParams,
  ZatcaSubmissionLogListParams,
} from '@/types/zatca.types';

const LOOKUPS_KEY = ['zatca', 'lookups'];
const DASHBOARD_KEY = ['zatca', 'dashboard'];
const HEALTH_KEY = ['zatca', 'health'];
const BRANCH_CONTEXT_KEY = ['zatca', 'branch-context'];
const EGS_UNITS_KEY = ['zatca', 'egs-units'];
const CSR_KEY = ['zatca', 'csr'];
const CERTIFICATES_KEY = ['zatca', 'certificates'];
const CERT_HISTORY_KEY = ['zatca', 'certificate-history'];
const CERT_EXPIRATION_KEY = ['zatca', 'certificate-expiration'];
const GLOBAL_SETTINGS_KEY = ['zatca', 'settings', 'global'];
const BRANCH_SETTINGS_KEY = ['zatca', 'settings', 'branch'];
const INVOICES_KEY = ['zatca', 'invoices'];
const DIAGNOSTICS_KEY = ['zatca', 'diagnostics'];
const REQUEST_LOGS_KEY = ['zatca', 'logs', 'requests'];
const SUBMISSION_LOGS_KEY = ['zatca', 'logs', 'submissions'];

// ==================== Lookups ====================

export function useZatcaLookups() {
  return useQuery({
    queryKey: LOOKUPS_KEY,
    queryFn: () => ZatcaLookupService.getLookups(),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/** Resolve a numeric enum value to its human name for one lookup category. */
export function useZatcaLookupLabel(category: ZatcaLookupCategory, value: number | null | undefined) {
  const { data } = useZatcaLookups();
  return useMemo(() => {
    if (value === null || value === undefined) return undefined;
    return data?.[category]?.find((item) => item.value === value)?.name;
  }, [data, category, value]);
}

// ==================== Dashboard & Health ====================

export function useZatcaDashboardSummary(branchId: string | undefined) {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, branchId],
    queryFn: () => ZatcaDashboardService.getSummary(branchId!),
    enabled: !!branchId,
  });
}

export function useZatcaHealth(branchId: string | undefined) {
  return useQuery({
    queryKey: [...HEALTH_KEY, branchId],
    queryFn: () => ZatcaDashboardService.getHealth(branchId!),
    enabled: !!branchId,
  });
}

export function useZatcaBranchContext(branchId: string | undefined) {
  return useQuery({
    queryKey: [...BRANCH_CONTEXT_KEY, branchId],
    queryFn: () => ZatcaDashboardService.getBranchContext(branchId!),
    enabled: !!branchId,
  });
}

export function useZatcaConnectionTest() {
  return useMutation({
    mutationFn: (branchId: string) => ZatcaDashboardService.testConnection(branchId),
    onError: (err) =>
      message.error(getApiErrorMessage(err, 'فشل اختبار الاتصال / Connection test failed')),
  });
}

export function useZatcaDiagnostics(branchId: string | undefined) {
  return useQuery({
    queryKey: [...DIAGNOSTICS_KEY, branchId],
    queryFn: () => ZatcaDashboardService.getDiagnostics(branchId!),
    enabled: !!branchId,
  });
}

// ==================== Branch Setup ====================

export function useUpdateZatcaSellerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateZatcaBranchSellerProfileDto) =>
      ZatcaBranchSetupService.updateSellerProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRANCH_CONTEXT_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
      queryClient.invalidateQueries({ queryKey: DIAGNOSTICS_KEY });
      message.success('تم حفظ بيانات البائع / Seller profile saved');
    },
    onError: (err) => message.error(getApiErrorMessage(err, 'فشل حفظ بيانات البائع / Failed to save seller profile')),
  });
}

export function useZatcaEgsUnits(branchId: string | undefined) {
  return useQuery({
    queryKey: [...EGS_UNITS_KEY, branchId],
    queryFn: () => ZatcaBranchSetupService.getEgsUnits(branchId!),
    enabled: !!branchId,
  });
}

export function useCreateZatcaEgsUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateZatcaEgsUnitDto) => ZatcaBranchSetupService.createEgsUnit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EGS_UNITS_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
      message.success('تم إنشاء وحدة EGS / EGS unit created');
    },
    onError: (err) => message.error(getApiErrorMessage(err, 'فشل إنشاء وحدة EGS / Failed to create EGS unit')),
  });
}

export function useImportZatcaCredentials() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ImportZatcaCredentialsDto) => ZatcaBranchSetupService.importCredentials(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CERTIFICATES_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
      queryClient.invalidateQueries({ queryKey: DIAGNOSTICS_KEY });
      message.success('تم استيراد بيانات الاعتماد / Credentials imported');
    },
    onError: (err) => message.error(getApiErrorMessage(err, 'فشل استيراد بيانات الاعتماد / Failed to import credentials')),
  });
}

// ==================== CSR Workflow ====================

export function useZatcaCsrRequests(branchId: string | undefined) {
  return useQuery({
    queryKey: [...CSR_KEY, branchId],
    queryFn: () => ZatcaCsrService.getRequests(branchId!),
    enabled: !!branchId,
  });
}

export function useGenerateZatcaCsr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateZatcaCsrDto) => ZatcaCsrService.generate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CSR_KEY });
      message.success('تم إنشاء طلب CSR / CSR request generated');
    },
    onError: (err) => message.error(getApiErrorMessage(err, 'فشل إنشاء CSR / Failed to generate CSR')),
  });
}

export function useRequestZatcaComplianceCsid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RequestZatcaComplianceCsidDto) => ZatcaCsrService.requestComplianceCsid(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CSR_KEY });
      queryClient.invalidateQueries({ queryKey: CERTIFICATES_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
      message.success('تم إصدار شهادة الالتزام / Compliance CSID issued');
    },
    onError: (err) => message.error(getApiErrorMessage(err, 'فشل طلب شهادة الالتزام / Failed to request compliance CSID')),
  });
}

export function useRequestZatcaProductionCsid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RequestZatcaProductionCsidDto) => ZatcaCsrService.requestProductionCsid(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CSR_KEY });
      queryClient.invalidateQueries({ queryKey: CERTIFICATES_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
      message.success('تم إصدار شهادة الإنتاج / Production CSID issued');
    },
    onError: (err) => message.error(getApiErrorMessage(err, 'فشل طلب شهادة الإنتاج / Failed to request production CSID')),
  });
}

// ==================== Certificates ====================

export function useZatcaCertificates(branchId: string | undefined) {
  return useQuery({
    queryKey: [...CERTIFICATES_KEY, branchId],
    queryFn: () => ZatcaCertificateService.getAll(branchId!),
    enabled: !!branchId,
  });
}

export function useZatcaCertificateHistory(branchId: string | undefined) {
  return useQuery({
    queryKey: [...CERT_HISTORY_KEY, branchId],
    queryFn: () => ZatcaCertificateService.getHistory(branchId!),
    enabled: !!branchId,
  });
}

export function useZatcaCertificateExpiration(branchId: string | undefined) {
  return useQuery({
    queryKey: [...CERT_EXPIRATION_KEY, branchId],
    queryFn: () => ZatcaCertificateService.getExpiration(branchId!),
    enabled: !!branchId,
  });
}

// ==================== Settings ====================

export function useZatcaGlobalSettings() {
  return useQuery({
    queryKey: GLOBAL_SETTINGS_KEY,
    queryFn: () => ZatcaSettingsService.getGlobal(),
  });
}

export function useUpdateZatcaGlobalSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateZatcaGlobalSettingsDto) => ZatcaSettingsService.updateGlobal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GLOBAL_SETTINGS_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
      message.success('تم حفظ الإعدادات العامة / Global settings saved');
    },
    onError: (err) => message.error(getApiErrorMessage(err, 'فشل حفظ الإعدادات / Failed to save settings')),
  });
}

export function useZatcaBranchSettings(branchId: string | undefined) {
  return useQuery({
    queryKey: [...BRANCH_SETTINGS_KEY, branchId],
    queryFn: () => ZatcaSettingsService.getBranch(branchId!),
    enabled: !!branchId,
  });
}

export function useUpdateZatcaBranchSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateZatcaBranchSettingsDto) => ZatcaSettingsService.updateBranch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRANCH_SETTINGS_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
      queryClient.invalidateQueries({ queryKey: DIAGNOSTICS_KEY });
      message.success('تم حفظ إعدادات الفرع / Branch settings saved');
    },
    onError: (err) => message.error(getApiErrorMessage(err, 'فشل حفظ إعدادات الفرع / Failed to save branch settings')),
  });
}

// ==================== Invoices (view-only) ====================

export function useZatcaInvoices(params: ZatcaInvoiceListParams) {
  return useQuery({
    queryKey: [...INVOICES_KEY, params],
    queryFn: () => ZatcaInvoiceService.getAll(params),
    enabled: !!params.branchId,
  });
}

export function useZatcaInvoiceDetail(id: string | undefined, branchId: string | undefined) {
  return useQuery({
    queryKey: [...INVOICES_KEY, id, branchId],
    queryFn: () => ZatcaInvoiceService.getById(id!, branchId!),
    enabled: !!id && !!branchId,
  });
}

// ==================== Logs ====================

export function useZatcaRequestLogs(params: ZatcaRequestLogListParams) {
  return useQuery({
    queryKey: [...REQUEST_LOGS_KEY, params],
    queryFn: () => ZatcaLogsService.getRequestLogs(params),
    enabled: !!params.branchId,
  });
}

export function useZatcaRequestLogDetail(id: string | undefined, branchId: string | undefined) {
  return useQuery({
    queryKey: [...REQUEST_LOGS_KEY, id, branchId],
    queryFn: () => ZatcaLogsService.getRequestLogById(id!, branchId!),
    enabled: !!id && !!branchId,
  });
}

export function useZatcaSubmissionLogs(params: ZatcaSubmissionLogListParams) {
  return useQuery({
    queryKey: [...SUBMISSION_LOGS_KEY, params],
    queryFn: () => ZatcaLogsService.getSubmissionLogs(params),
    enabled: !!params.branchId,
  });
}
