/**
 * ZATCA (Saudi e-invoicing / "Fatoora") Module Type Definitions
 * Mirrors the live Sigma API `/api/V1/Zatca/*` (ZatcaDashboard controller).
 *
 * All status/type fields are numeric. Human-readable names are NOT hardcoded
 * here — they come from `GET /api/V1/Zatca/lookups` at runtime (see
 * useZatcaLookups in hooks/api/useZatca.ts) because the numeric→name mapping
 * has changed between backend revisions and must not be guessed client-side.
 */

// ==================== Lookups ====================

export interface ZatcaLookupItem {
  value: number;
  name: string;
}

export interface ZatcaLookups {
  environments: ZatcaLookupItem[];
  invoiceSubTypes: ZatcaLookupItem[];
  submissionStatuses: ZatcaLookupItem[];
  clearanceStatuses: ZatcaLookupItem[];
  certificateTypes: ZatcaLookupItem[];
  certificateStatuses: ZatcaLookupItem[];
  csrRequestStatuses: ZatcaLookupItem[];
  egsUnitStatuses: ZatcaLookupItem[];
  apiRequestTypes: ZatcaLookupItem[];
  sourceEntityTypes: ZatcaLookupItem[];
}

export type ZatcaLookupCategory = keyof ZatcaLookups;

// ==================== Branch Context / Seller Profile ====================

/** GET /api/V1/Zatca/branch-context */
export interface ZatcaBranchContext {
  branchId: string;
  branchNameAr?: string | null;
  branchNameEn?: string | null;
  taxNumber?: string | null;
  commercialRegistrationNumber?: string | null;
  zakaRegistrationNameAr?: string | null;
  zakaTaxNumber?: string | null;
  zakaCityName?: string | null;
  zakaDistrictAr?: string | null;
  zakaStreetAr?: string | null;
  zakaBuildingNumber?: string | null;
  zakaPostalZone?: string | null;
  sellerProfileComplete: boolean;
  sellerProfileMissingFields: string[];
}

/** PUT /api/V1/Zatca/branch-profile */
export interface UpdateZatcaBranchSellerProfileDto {
  branchId: string;
  registrationNameAr?: string | null;
  commercialRegistrationNumber?: string | null;
  taxNumber?: string | null;
  cityName?: string | null;
  districtAr?: string | null;
  streetAr?: string | null;
  buildingNumber?: string | null;
  postalZone?: string | null;
}

// ==================== Settings ====================

/** GET/PUT /api/V1/Zatca/settings/global */
export interface ZatcaGlobalSettings {
  id: string;
  isIntegrationEnabled: boolean;
  sandboxApiBaseUrl: string;
  productionApiBaseUrl: string;
  defaultVatRate: number;
  maxSubmissionRetries: number;
  requestTimeoutSeconds: number;
  encryptionKeyVersion: number;
  updatedDate: string;
  updatedBy?: string | null;
}

export interface UpdateZatcaGlobalSettingsDto {
  isIntegrationEnabled: boolean;
  sandboxApiBaseUrl?: string | null;
  productionApiBaseUrl?: string | null;
  defaultVatRate: number;
  maxSubmissionRetries: number;
  requestTimeoutSeconds: number;
}

/** GET/PUT /api/V1/Zatca/settings/branch — GET 404s until first saved. */
export interface ZatcaBranchSettings {
  id: string;
  branchId: string;
  isEnabled: boolean;
  environment: number;
  defaultInvoiceSubType: number;
  autoSubmitOnIssue: boolean;
  reportingEnabled: boolean;
  clearanceEnabled: boolean;
  sellerNameOverrideAr?: string | null;
  sellerNameOverrideEn?: string | null;
  notes?: string | null;
  createdDate: string;
  updatedDate?: string | null;
}

export interface UpdateZatcaBranchSettingsDto {
  branchId: string;
  isEnabled: boolean;
  environment: number;
  defaultInvoiceSubType: number;
  autoSubmitOnIssue: boolean;
  reportingEnabled: boolean;
  clearanceEnabled: boolean;
  sellerNameOverrideAr?: string | null;
  sellerNameOverrideEn?: string | null;
  notes?: string | null;
}

// ==================== EGS Units ====================

/** GET/POST /api/V1/Zatca/egs-units */
export interface ZatcaEgsUnit {
  id: string;
  branchId: string;
  deviceSerialNumber: string;
  solutionName: string;
  model: string;
  version: string;
  environment: number;
  status: number;
  isDefault: boolean;
  invoiceCounterValue: number;
  previousInvoiceHash?: string | null;
  lastInvoiceUuid?: string | null;
  lastSubmittedAt?: string | null;
}

export interface CreateZatcaEgsUnitDto {
  branchId: string;
  deviceSerialNumber?: string | null;
  solutionName?: string | null;
  model?: string | null;
  version?: string | null;
  environment: number;
  isDefault: boolean;
}

// ==================== Certificates & CSR ====================

/** GET /api/V1/Zatca/certificates */
export interface ZatcaCertificate {
  id: string;
  egsUnitId: string;
  deviceSerialNumber?: string | null;
  certificateType: number;
  status: number;
  isActive: boolean;
  serialNumber?: string | null;
  thumbprint?: string | null;
  issuedAt?: string | null;
  expiresAt?: string | null;
  daysUntilExpiration: number;
  hasPrivateKey: boolean;
  hasCsid: boolean;
  encryptionKeyVersion: number;
}

/** GET /api/V1/Zatca/certificates/history */
export interface ZatcaCertificateHistory {
  id: string;
  certificateId: string;
  action: string;
  certificateType: number;
  status: number;
  serialNumber?: string | null;
  thumbprint?: string | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  notes?: string | null;
  performedBy?: string | null;
}

/** GET /api/V1/Zatca/certificates/expiration */
export interface ZatcaCertificateExpiration {
  certificateId: string;
  egsUnitId: string;
  deviceSerialNumber?: string | null;
  certificateType: number;
  expiresAt?: string | null;
  daysUntilExpiration: number;
  expirationLevel: 'Healthy' | 'Warning' | 'Critical' | 'Expired' | string;
  isActive: boolean;
}

/** POST /api/V1/Zatca/certificates/import */
export interface ImportZatcaCredentialsDto {
  branchId: string;
  egsUnitId: string;
  certificateType: number;
  certificatePem?: string | null;
  privateKeyPem?: string | null;
  csid?: string | null;
  secret?: string | null;
  activateImmediately?: boolean;
}

/** GET /api/V1/Zatca/csr */
export interface ZatcaCsrRequest {
  id: string;
  egsUnitId: string;
  deviceSerialNumber?: string | null;
  requestType: number;
  status: number;
  environment: number;
  hasCsrPem: boolean;
  hasPrivateKey: boolean;
  complianceRequestId?: string | null;
  errorMessage?: string | null;
  requestedAt: string;
  completedAt?: string | null;
}

/** POST /api/V1/Zatca/csr/generate */
export interface GenerateZatcaCsrDto {
  branchId: string;
  egsUnitId: string;
  requestType: number;
  environment: number;
}

export interface GenerateZatcaCsrResult {
  csrRequestId: string;
  csrPem?: string | null;
}

/** POST /api/V1/Zatca/csr/compliance-csid */
export interface RequestZatcaComplianceCsidDto {
  branchId: string;
  egsUnitId: string;
  csrRequestId: string;
  otp?: string | null;
}

/** POST /api/V1/Zatca/csr/production-csid */
export interface RequestZatcaProductionCsidDto {
  branchId: string;
  egsUnitId: string;
  csrRequestId: string;
  complianceRequestId?: string | null;
}

export interface RequestZatcaCsidResult {
  csid?: string | null;
  requestId?: string | null;
  certificateId?: string | null;
}

// ==================== Invoices ====================

export interface ZatcaInvoiceListItem {
  id: string;
  branchId: string;
  invoiceNumber?: string | null;
  invoiceUuid?: string | null;
  sourceEntityType: number;
  sourceEntityId: string;
  invoiceSubType: number;
  issueDateTime: string;
  totalAmount: number;
  taxAmount: number;
  submissionStatus: number;
  clearanceStatus: number;
  submittedAt?: string | null;
  lastErrorMessage?: string | null;
}

export interface ZatcaInvoiceLine {
  lineNumber: number;
  itemName?: string | null;
  itemDescription?: string | null;
  quantity: number;
  unitPrice: number;
  lineNetAmount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  taxCategoryCode?: string | null;
}

export interface ZatcaInvoiceDetail extends ZatcaInvoiceListItem {
  egsUnitId?: string | null;
  deviceSerialNumber?: string | null;
  invoiceTypeCode?: number | null;
  currencyCode?: string | null;
  subTotal: number;
  invoiceCounterValue?: number | null;
  invoiceHash?: string | null;
  previousInvoiceHash?: string | null;
  hasQrCode: boolean;
  qrCodeBase64?: string | null;
  zatcaValidationStatus?: string | null;
  reportingResult?: string | null;
  clearanceResult?: string | null;
  originalInvoiceUuid?: string | null;
  buyerTaxNumber?: string | null;
  customerId?: string | null;
  retryCount: number;
  clearedAt?: string | null;
  lines: ZatcaInvoiceLine[];
}

export interface ZatcaInvoiceListParams {
  branchId?: string;
  pageNumber?: number;
  pageSize?: number;
  submissionStatus?: number;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

// ==================== Logs ====================

export interface ZatcaApiRequestLog {
  id: string;
  egsUnitId?: string | null;
  eInvoiceId?: string | null;
  requestType: number;
  environment: number;
  httpMethod?: string | null;
  endpointUrl?: string | null;
  correlationId?: string | null;
  requestedAt: string;
  durationMs?: number | null;
  hasResponse: boolean;
  responseSuccess?: boolean | null;
  responseStatusCode?: number | null;
}

export interface ZatcaApiResponseLog {
  id: string;
  requestLogId: string;
  httpStatusCode: number;
  responseHeaders?: string | null;
  responseBody?: string | null;
  isSuccess: boolean;
  errorCode?: string | null;
  errorMessage?: string | null;
  receivedAt: string;
}

export interface ZatcaApiRequestLogDetail extends ZatcaApiRequestLog {
  requestHeaders?: string | null;
  requestBody?: string | null;
  response?: ZatcaApiResponseLog | null;
}

export interface ZatcaRequestLogListParams {
  branchId?: string;
  pageNumber?: number;
  pageSize?: number;
  requestType?: number;
  isSuccess?: boolean;
  fromDate?: string;
  toDate?: string;
}

export interface ZatcaSubmissionLog {
  id: string;
  eInvoiceId: string;
  invoiceNumber?: string | null;
  submissionType: number;
  attemptNumber: number;
  status: number;
  invoiceHash?: string | null;
  invoiceCounterValue?: number | null;
  zatcaStatus?: string | null;
  errorMessage?: string | null;
  submittedAt: string;
  completedAt?: string | null;
}

export interface ZatcaSubmissionLogListParams {
  branchId?: string;
  pageNumber?: number;
  pageSize?: number;
  requestType?: number;
  isSuccess?: boolean;
  fromDate?: string;
  toDate?: string;
}

// ==================== Connection / Diagnostics / Health ====================

/** POST /api/V1/Zatca/connection/test */
export interface ZatcaConnectionTestResult {
  branchId: string;
  environment: number;
  targetUrl?: string | null;
  isReachable: boolean;
  httpStatusCode?: number | null;
  responseTimeMs: number;
  message?: string | null;
  testedAt: string;
}

export interface ZatcaDiagnosticItem {
  code: string;
  title: string;
  description: string;
  severity: 'Info' | 'Warning' | 'Error' | string;
  passed: boolean;
}

/** GET /api/V1/Zatca/diagnostics */
export interface ZatcaDiagnostics {
  branchId: string;
  generatedAt: string;
  items: ZatcaDiagnosticItem[];
  passedCount: number;
  failedCount: number;
}

/** GET /api/V1/Zatca/health */
export interface ZatcaHealthStatus {
  branchId: string;
  overallStatus: string;
  overallStatusLevel: 'Healthy' | 'Warning' | 'Critical' | string;
  integrationEnabled: boolean;
  branchEnabled: boolean;
  sellerProfileComplete: boolean;
  hasActiveEgsUnit: boolean;
  hasActiveCertificate: boolean;
  certificateExpiringSoon: boolean;
  hasRecentFailures: boolean;
  lastSuccessfulSubmissionAt?: string | null;
  lastFailedSubmissionAt?: string | null;
  pendingInvoicesCount: number;
  failedInvoicesCount: number;
  clearedInvoicesCount: number;
  reportedInvoicesCount: number;
  lastConnectionTest?: ZatcaConnectionTestResult | null;
}

/** GET /api/V1/Zatca/dashboard/summary */
export interface ZatcaDashboardSummary {
  health: ZatcaHealthStatus;
  branch: ZatcaBranchContext;
  branchSettings?: ZatcaBranchSettings | null;
  globalSettings: ZatcaGlobalSettings;
  defaultEgsUnit?: ZatcaEgsUnit | null;
  activeCertificate?: ZatcaCertificate | null;
  expiringCertificates: ZatcaCertificateExpiration[];
  recentInvoices: ZatcaInvoiceListItem[];
  recentSubmissionLogs: ZatcaSubmissionLog[];
}
