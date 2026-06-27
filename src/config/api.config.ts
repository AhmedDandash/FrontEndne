/**
 * API Configuration
 * Centralized configuration for API endpoints and settings
 */

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  TIMEOUT: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

export const API_ENDPOINTS = {
  // Auth — all paths moved to /api/V1/Auth/*
  AUTH: {
    LOGIN: '/api/V1/Auth/login',
    LOGOUT: '/api/V1/Auth/logout',
    REFRESH_TOKEN: '/api/V1/Auth/refresh-token',
    ME: '/api/V1/Auth/me',
    CHANGE_PASSWORD: '/api/V1/Auth/change-password',
    ADD_ADMIN: '/api/V1/Auth/add-admin',
  },

  // Branch — RESTful /api/V1/Branch
  BRANCH: {
    GET_ALL: '/api/V1/Branch',
    GET_BY_ID: (id: number | string) => `/api/V1/Branch/${id}`,
    GET_SUB_BRANCHES: (id: number | string) => `/api/V1/Branch/${id}/sub-branches`,
    CREATE: '/api/V1/Branch',
    UPDATE: (id: number | string) => `/api/V1/Branch/${id}`,
    DELETE: (id: number | string) => `/api/V1/Branch/${id}`,
  },

  // Customers — RESTful /api/V1/Customer
  CUSTOMERS: {
    GET_ALL: '/api/V1/Customer',
    GET_BY_ID: (id: number | string) => `/api/V1/Customer/${id}`,
    CREATE: '/api/V1/Customer',
    UPDATE: (id: number | string) => `/api/V1/Customer/${id}`,
    DELETE: (id: number | string) => `/api/V1/Customer/${id}`,
  },

  // Document
  DOCUMENT: {
    GET_ALL: '/api/Document/GetAllDocument',
    GET_BY_ID: (id: number) => `/api/Document/GetDocumentById/${id}`,
    CREATE: '/api/Document/CreateDocument',
    UPDATE: (id: number) => `/api/Document/UpdateDocument/${id}`,
    DELETE: (id: number) => `/api/Document/DeleteDocument/${id}`,
  },

  // Roles
  ROLES: {
    GET_ALL: '/api/Roles/GetAllRoles',
    GET_BY_ID: (id: number) => `/api/Roles/GetRoleById/${id}`,
    CREATE: '/api/Roles/Create',
    UPDATE: (id: number) => `/api/Roles/Update/${id}`,
    DELETE: (id: number) => `/api/Roles/Delete/${id}`,
  },

  // Users
  USERS: {
    GET_BY_ID: (id: number) => `/api/Users/GetUserById/${id}`,
    GET_ALL: '/api/Users/GetAllUsers',
    CREATE: '/api/Auth/register',
    UPDATE: (id: number) => `/api/Users/UpdateUserById/${id}`,
    DELETE: (id: number) => `/api/Users/DeleteUserById/${id}`,
  },

  // Agent — RESTful /api/V1/Agent
  AGENT: {
    GET_ALL: '/api/V1/Agent',
    GET_BY_ID: (id: number | string) => `/api/V1/Agent/${id}`,
    CREATE: '/api/V1/Agent',
    UPDATE: (id: number | string) => `/api/V1/Agent/${id}`,
    DELETE: (id: number | string) => `/api/V1/Agent/${id}`,
  },

  // Jobs — RESTful /api/V1/Job
  JOB: {
    GET_ALL: '/api/V1/Job',
    GET_BY_ID: (id: number | string) => `/api/V1/Job/${id}`,
    CREATE: '/api/V1/Job',
    UPDATE: (id: number | string) => `/api/V1/Job/${id}`,
    DELETE: (id: number | string) => `/api/V1/Job/${id}`,
  },

  // Workers — RESTful /api/V1/Worker + lifecycle transitions
  WORKERS: {
    GET_ALL: '/api/V1/Worker',
    GET_BY_ID: (id: number | string) => `/api/V1/Worker/${id}`,
    CREATE: '/api/V1/Worker',
    UPDATE: (id: number | string) => `/api/V1/Worker/${id}`,
    DELETE: (id: number | string) => `/api/V1/Worker/${id}`,
    // Lifecycle (replaces old WorkerIsNoActive / WorkerOut / WorkerRefused)
    ACTIVATE: (id: number | string) => `/api/V1/Worker/${id}/activate`,
    MOVE_TO_ACCOMMODATION: (id: number | string) => `/api/V1/Worker/${id}/move-to-accommodation`,
    SET_REFUSAL: (id: number | string) => `/api/V1/Worker/${id}/set-refusal`,
    WANTS_TRANSFER: '/api/V1/Worker/WantsTransfer',
  },

  // Recruitment Request
  RECRUITMENT_REQUEST: {
    GET_ALL: '/api/RecruitmentRequest',
    CREATE: '/api/RecruitmentRequest',
    CHOICE_CUSTOMER: '/api/RecruitmentRequest/ChoiceCusomer',
    CHOICE_WORKER: '/api/RecruitmentRequest/ChoiceWorker',
    DELETE_WORKER: (requestId: number) => `/api/RecruitmentRequest/DeleteWorker/${requestId}`,
    REVIEW_REQUEST: '/api/RecruitmentRequest/ReviewRequest',
    REFUSED_REQUEST: '/api/RecruitmentRequest/RefusedRequest',
    ACCEPT_REQUEST: '/api/RecruitmentRequest/AcceptRequest',
  },

  // Operating Contract Offer (renamed from EmploymentContractOffers)
  OPERATING_CONTRACT_OFFER: {
    GET_ALL: '/api/OperatingContractOffer',
    CREATE: '/api/OperatingContractOffer',
    GET_BY_ID: (id: number | string) => `/api/OperatingContractOffer/${id}`,
    UPDATE: (id: number | string) => `/api/OperatingContractOffer/${id}`,
    DELETE: (id: number | string) => `/api/OperatingContractOffer/${id}`,
  },

  // Employment Operating Contract
  EMPLOYMENT_OPERATING_CONTRACT: {
    GET_ALL: '/api/EmploymentOperatingContract',
    CREATE: '/api/EmploymentOperatingContract',
    GET_BY_ID: (id: number | string) => `/api/EmploymentOperatingContract/${id}`,
    UPDATE: (id: number | string) => `/api/EmploymentOperatingContract/${id}`,
    DELETE: (id: number | string) => `/api/EmploymentOperatingContract/${id}`,
    // Lifecycle transitions (replaces old EndContract)
    SIGN: (id: number | string) => `/api/EmploymentOperatingContract/${id}/sign`,
    START_EXECUTION: (id: number | string) =>
      `/api/EmploymentOperatingContract/${id}/start-execution`,
    RENEW: (id: number | string) => `/api/EmploymentOperatingContract/${id}/renew`,
    TERMINATE: (id: number | string) => `/api/EmploymentOperatingContract/${id}/terminate`,
    // POST /{id}/customer-refund — cash returned to customer after termination
    CUSTOMER_REFUND: (id: number | string) =>
      `/api/EmploymentOperatingContract/${id}/customer-refund`,
    PRINT_RECEIPT_FORM: (id: number | string) =>
      `/api/EmploymentOperatingContract/${id}/print-receipt-form`,
  },

  // Complaint
  COMPLAINT: {
    GET_ALL: '/api/Complaint',
    GET_BY_ID: (id: number | string) => `/api/Complaint/${id}`,
    CREATE: '/api/Complaint',
    DELETE: (id: number | string) => `/api/Complaint/${id}`,
    // POST /api/Complaint/{id}/finish — no request body
    FINISH: (id: number | string) => `/api/Complaint/${id}/finish`,
    // POST /api/Complaint/{id}/toggle-hold?reason=... — reason is required query param
    HOLD: (id: number | string) => `/api/Complaint/${id}/toggle-hold`,
    // POST /api/Complaint/issue — multipart/form-data
    ADD_ISSUE: '/api/Complaint/issue',
    // GET /api/Complaint/{id}/issue
    GET_ISSUE: (id: number | string) => `/api/Complaint/${id}/issue`,
    // POST /api/Complaint/update — add update/note to existing complaint
    ADD_UPDATE: '/api/Complaint/update',
  },

  // Nationality — RESTful /api/V1/Nationality
  NATIONALITY: {
    GET_ALL: '/api/V1/Nationality',
    GET_BY_ID: (id: number | string) => `/api/V1/Nationality/${id}`,
    CREATE: '/api/V1/Nationality',
    UPDATE: (id: number | string) => `/api/V1/Nationality/${id}`,
    DELETE: (id: number | string) => `/api/V1/Nationality/${id}`,
    TOGGLE_STATUS: (id: number | string) => `/api/V1/Nationality/${id}/toggle-status`,
  },

  // Mediation Contract Offer
  MEDIATION_CONTRACT_OFFER: {
    GET_ALL: '/api/Mediation/MediationContractOffer',
    GET_BY_ID: (id: string) => `/api/Mediation/MediationContractOffer/${id}`,
    CREATE: '/api/Mediation/MediationContractOffer',
    UPDATE: '/api/Mediation/MediationContractOffer',
    DELETE: (id: string) => `/api/Mediation/MediationContractOffer/${id}`,
    TOGGLE_ACTIVE: (id: string) => `/api/Mediation/MediationContractOffer/${id}/toggle-active`,
    AUTO_FILL: '/api/Mediation/MediationContractOffer/auto-fill',
  },

  // Mediation Contract — endpoints per PDF spec only
  MEDIATION_CONTRACT: {
    GET_ALL: '/api/Mediation/MediationContract',
    GET_BY_ID: (id: string) => `/api/Mediation/MediationContract/${id}`,
    CREATE: '/api/Mediation/MediationContract',
    CONTRACT_CANCEL: '/api/Mediation/MediationContract/cancel',
    SIGN: '/api/Mediation/MediationContract/sign',
    UPDATE_STATUS: '/api/Mediation/MediationContract/update-status',
    DELIVERY_FORM: '/api/Mediation/MediationContract/delivery-form',
    DELIVERY_FORM_SIGN: '/api/Mediation/MediationContract/delivery-form/sign',
    WARRANTY_RETURN: '/api/Mediation/MediationContract/warranty-return',
    STATUS_HISTORY: (contractId: string) =>
      `/api/Mediation/MediationContract/status-history/${contractId}`,
  },

  // Contract Creation Requirements
  CONTRACT_CREATION_REQUIREMENTS: {
    GET_ALL: '/api/ContractCreationRequirements',
    CREATE: '/api/ContractCreationRequirements',
    GET_BY_ID: (id: number) => `/api/ContractCreationRequirements/${id}`,
    UPDATE: (id: number) => `/api/ContractCreationRequirements/${id}`,
    DELETE: (id: number) => `/api/ContractCreationRequirements/${id}`,
    GET_REQUIREMENT: '/api/ContractCreationRequirements/GetRequirement',
  },

  // Nationality Follow-Up Status
  NATIONALITY_FOLLOWUP: {
    GET_ALL: '/api/Nationality/GetAllNationalityFollowUpStatus',
    GET_BY_NATIONALITY: (nationalityId: number) =>
      `/api/Nationality/GetNationalityFollowUpStatus/${nationalityId}`,
    CREATE: '/api/Nationality/CreateNationalityFollowUpStatus',
    UPDATE: (id: number) => `/api/Nationality/UpdateNationalityFollowUpStatus/${id}`,
    TOGGLE_ACTIVE: (id: number) => `/api/Nationality/NationalityFollowUpStatusIsActive/${id}`,
    DELETE: (id: number) => `/api/Nationality/DeleteNationalityFollowUpStatus/${id}`,
  },

  // Marketer — /api/V1/Marketer
  MARKETER: {
    GET_ALL: '/api/V1/Marketer',
    GET_BY_ID: (id: number | string) => `/api/V1/Marketer/${id}`,
    CREATE: '/api/V1/Marketer',
    UPDATE: (id: number | string) => `/api/V1/Marketer/${id}`,
    DELETE: (id: number | string) => `/api/V1/Marketer/${id}`,
  },

  // ─── Accounting Documents — /api/Accounting/* ─────────────────────────────
  // All documents follow the same shape: GET list/by-id/trace, POST create.
  // Filters: customerId, agentId, contractId, dateFrom, dateTo.

  // Receipt Voucher — /api/Accounting/ReceiptVoucher
  RECEIPT_VOUCHER: {
    GET_ALL: '/api/Accounting/ReceiptVoucher',
    GET_BY_ID: (id: string) => `/api/Accounting/ReceiptVoucher/${id}`,
    TRACE: (id: string) => `/api/Accounting/ReceiptVoucher/${id}/trace`,
    CREATE: '/api/Accounting/ReceiptVoucher',
  },

  // Payment Voucher — /api/Accounting/PaymentVoucher
  PAYMENT_VOUCHER: {
    GET_ALL: '/api/Accounting/PaymentVoucher',
    GET_BY_ID: (id: string) => `/api/Accounting/PaymentVoucher/${id}`,
    TRACE: (id: string) => `/api/Accounting/PaymentVoucher/${id}/trace`,
    CREATE: '/api/Accounting/PaymentVoucher',
  },

  // Credit Note — /api/Accounting/CreditNote
  CREDIT_NOTE: {
    GET_ALL: '/api/Accounting/CreditNote',
    GET_BY_ID: (id: string) => `/api/Accounting/CreditNote/${id}`,
    TRACE: (id: string) => `/api/Accounting/CreditNote/${id}/trace`,
    CREATE: '/api/Accounting/CreditNote',
  },

  // Debit Note — /api/Accounting/DebitNote
  DEBIT_NOTE: {
    GET_ALL: '/api/Accounting/DebitNote',
    GET_BY_ID: (id: string) => `/api/Accounting/DebitNote/${id}`,
    TRACE: (id: string) => `/api/Accounting/DebitNote/${id}/trace`,
    CREATE: '/api/Accounting/DebitNote',
  },

  // ─── Period Closing — /api/V1/PeriodClosing/* ──────────────────────────────
  PERIOD_CLOSING: {
    CLOSE: '/api/V1/PeriodClosing/close',
    STATUS: '/api/V1/PeriodClosing/status',
  },

  // Transfer Contract — /api/TransferContract
  TRANSFER_CONTRACT: {
    GET_ALL: '/api/TransferContract',
    GET_BY_ID: (id: number | string) => `/api/TransferContract/${id}`,
    CREATE: '/api/TransferContract',
    DELETE: (id: number | string) => `/api/TransferContract/${id}`,
    SIGN: (id: number | string) => `/api/TransferContract/${id}/sign`,
    COMPLETE: (id: number | string) => `/api/TransferContract/${id}/complete`,
    AUTHORITY_STATUS: (id: number | string) => `/api/TransferContract/${id}/authority-status`,
  },

  // Medical Examination — /api/V1/MedicalExamination
  MEDICAL_EXAMINATION: {
    GET_ALL: '/api/V1/MedicalExamination',
    GET_BY_ID: (id: number | string) => `/api/V1/MedicalExamination/${id}`,
    CHECK_WORKER: (workerId: number | string) => `/api/V1/MedicalExamination/check-worker/${workerId}`,
    CREATE: '/api/V1/MedicalExamination',
    UPDATE: (id: number | string) => `/api/V1/MedicalExamination/${id}`,
    DELETE: (id: number | string) => `/api/V1/MedicalExamination/${id}`,
    REPORT: (id: number | string) => `/api/V1/MedicalExamination/report/${id}`,
  },

  // ─── Follow-Up Module (new /api/FollowUp/* routes) ───────────────────────

  // Follow-Up Status — master data (settings screen)
  FOLLOWUP_STATUS: {
    GET_ALL: '/api/FollowUp/FollowUpStatus/GetAll',
    GET_BY_ID: (id: number) => `/api/FollowUp/FollowUpStatus/GetById/${id}`,
    CREATE: '/api/FollowUp/FollowUpStatus/Create',
    UPDATE: '/api/FollowUp/FollowUpStatus/Update',
    DELETE: (id: number) => `/api/FollowUp/FollowUpStatus/Delete/${id}`,
  },

  // Contract Nationality — which nationalities are enrolled in the module
  CONTRACT_NATIONALITY: {
    GET_ALL: '/api/FollowUp/ContractNationality/GetAll',
    CREATE: '/api/FollowUp/ContractNationality/Create',
    UPDATE: '/api/FollowUp/ContractNationality/Update',
    DELETE: (id: number) => `/api/FollowUp/ContractNationality/Delete/${id}`,
  },

  // Nationality Follow-Up Config — per-nationality config grid
  NATIONALITY_FOLLOWUP_CONFIG: {
    GET_BY_NATIONALITY: (contractNationalityId: number) =>
      `/api/FollowUp/NationalityFollowUpConfig/GetByNationality/${contractNationalityId}`,
    TOGGLE_ACTIVE: (id: number) => `/api/FollowUp/NationalityFollowUpConfig/ToggleActive/${id}`,
    UPDATE: '/api/FollowUp/NationalityFollowUpConfig/Update',
    BULK_UPDATE: '/api/FollowUp/NationalityFollowUpConfig/BulkUpdate',
  },

  // ─── Mediation Follow-Up Module ──────────────────────────────────────────
  // Endpoints per followup_mediationContract.txt spec

  MEDIATION_FOLLOWUP: {
    DASHBOARD: '/api/Mediation/MediationFollowUp/dashboard',
    ITEMS: (contractId: string) => `/api/Mediation/MediationFollowUp/items/${contractId}`,
    ITEM: (itemId: string) => `/api/Mediation/MediationFollowUp/item/${itemId}`,
    UPDATE_DESCRIPTION: '/api/Mediation/MediationFollowUp/update-description',
  },

  // Contract Follow-Up (per mediation_contract_settings.txt spec)
  CONTRACT_FOLLOWUP: {
    CAN_COMPLETE: (itemId: string) => `/api/FollowUp/ContractFollowUp/CanComplete/${itemId}`,
    COMPLETE_ITEM: '/api/FollowUp/ContractFollowUp/CompleteItem',
  },

  // Contract Creation Requirement (per mediation_contract_settings.txt spec)
  // All IDs are UUIDs. nationalityId = ContractNationality.nationalityId (master UUID).
  CONTRACT_CREATION_REQUIREMENT: {
    GET_BY_NATIONALITY_AND_JOB:
      '/api/FollowUp/ContractCreationRequirement/GetByNationalityAndJob',
    GET_BY_ID: (id: string) =>
      `/api/FollowUp/ContractCreationRequirement/GetById/${id}`,
    CREATE: '/api/FollowUp/ContractCreationRequirement/Create',
    UPDATE: '/api/FollowUp/ContractCreationRequirement/Update',
    DELETE: (id: string) =>
      `/api/FollowUp/ContractCreationRequirement/Delete/${id}`,
  },

  // ─── HR Module (/api/V1/*) ───────────────────────────────────────────────

  HR_EMPLOYEE: {
    GET_ALL: '/api/V1/Employee',
    GET_BY_ID: (id: string) => `/api/V1/Employee/${id}`,
    CREATE: '/api/V1/Employee',
    UPDATE: (id: string) => `/api/V1/Employee/${id}`,
    DELETE: (id: string) => `/api/V1/Employee/${id}`,
    RESET_PASSWORD: (id: string) => `/api/V1/Employee/${id}/reset-password`,
  },

  HR_ATTENDANCE: {
    CHECK_IN: '/api/V1/Attendance/CheckIn',
    CHECK_OUT: '/api/V1/Attendance/CheckOut',
    FILTER: '/api/V1/Attendance/Filter',
  },

  HR_LEAVE: {
    GET_ALL: '/api/V1/Leave',
    CREATE: '/api/V1/Leave',
    GET_BALANCE: (leaveTypeId: string) => `/api/V1/Leave/balance/${leaveTypeId}`,
    EMPLOYEE_BALANCES: '/api/V1/Leave/employee-balances',
    APPROVE: (requestId: string) => `/api/V1/Leave/${requestId}/approve`,
    REJECT: (requestId: string) => `/api/V1/Leave/${requestId}/reject`,
    CANCEL: (requestId: string) => `/api/V1/Leave/${requestId}/cancel`,
  },

  HR_LEAVE_TYPE: {
    GET_ALL: '/api/V1/LeaveType',
    GET_BY_ID: (id: string) => `/api/V1/LeaveType/${id}`,
    CREATE: '/api/V1/LeaveType',
    UPDATE: (id: string) => `/api/V1/LeaveType/${id}`,
    DELETE: (id: string) => `/api/V1/LeaveType/${id}`,
  },

  HR_PAYROLL: {
    GENERATE: '/api/V1/Payroll/generate',
    GET: '/api/V1/Payroll',
    EXPORT: '/api/V1/Payroll/export',
    CLOSE: (id: string) => `/api/V1/Payroll/close/${id}`,
  },

  HR_PERMISSION_REQUEST: {
    GET_ALL: '/api/V1/PermissionRequest/GetAll',
    CREATE: '/api/V1/PermissionRequest/Create',
    APPROVE: (id: string) => `/api/V1/PermissionRequest/Approve/${id}`,
    REJECT: (id: string) => `/api/V1/PermissionRequest/Reject/${id}`,
  },

  HR_RESIGNATION_REQUEST: {
    GET_ALL: '/api/V1/ResignationRequest/GetAll',
    CREATE: '/api/V1/ResignationRequest/Create',
    APPROVE: (id: string) => `/api/V1/ResignationRequest/Approve/${id}`,
    REJECT: (id: string) => `/api/V1/ResignationRequest/Reject/${id}`,
  },

  HR_CUSTODY_REQUEST: {
    GET_ALL: '/api/V1/CustodyRequest/GetAll',
    CREATE: '/api/V1/CustodyRequest/Create',
    APPROVE: (id: string) => `/api/V1/CustodyRequest/Approve/${id}`,
    REJECT: (id: string) => `/api/V1/CustodyRequest/Reject/${id}`,
    GET_TYPES: '/api/V1/CustodyRequest/Types',
    GET_TYPE: (id: string) => `/api/V1/CustodyRequest/Types/${id}`,
    CREATE_TYPE: '/api/V1/CustodyRequest/Types/Create',
  },

  // ─── Department (/api/V1/Department) ─────────────────────────────────────
  // NOTE: POST uses query params (nameAr, nameEn), not a JSON body.

  DEPARTMENT: {
    GET_ALL: '/api/V1/Lookup/Departments',
    CREATE: '/api/V1/Department',
    DELETE: (id: string) => `/api/V1/Department/${id}`,
  },

  // ─── Admin API (/api/V1/Admin/*) ─────────────────────────────────────────
  // Position = Job = JobId = JobName — unified entity referenced by employees

  HR_ADMIN: {
    ADD_USER: '/api/V1/Admin/add-user',
    ASSIGN_ROLE: '/api/V1/Admin/assign-role',
    REMOVE_ROLE: '/api/V1/Admin/remove-role',
    ALL_USERS: '/api/V1/Admin/all-users',
    ALL_ROLES: '/api/V1/Admin/all-roles',
    POSITIONS: '/api/V1/Admin/positions',
    CREATE_POSITION: '/api/V1/Admin/create-position',
    DELETE_POSITION: (id: string) => `/api/V1/Admin/delete-position/${id}`,
  },

  // ─── Housing Management — /api/Housing/* ─────────────────────────────────
  HOUSING: {
    GET_ALL: '/api/Housing/GetAll',
    GET_ACTIVE_LIST: '/api/Housing/GetActiveList',
    CREATE: '/api/Housing',
    UPDATE: (id: string) => `/api/Housing/${id}`,
    TOGGLE_ACTIVE: (id: string) => `/api/Housing/ToggleActive/${id}`,
    DELETE: (id: string) => `/api/Housing/${id}`,
  },

  // ─── Worker Status Log — extends existing Worker routes ──────────────────
  WORKER_STATUS_LOG: {
    CREATE: '/api/V1/Worker/StatusLog',
    DELETE: (id: string) => `/api/V1/Worker/${id}/StatusLog/Last`,
    ACTIVATE_WANTS_WORK: (id: string) => `/api/V1/Worker/${id}/ActivateWantsWork`,
    ACTIVATE_WANTS_TRANSFER: (id: string) => `/api/V1/Worker/${id}/ActivateWantsTransfer`,
  },

  // ─── Worker housing/pathway actions — /api/V1/Worker/* ───────────────────
  WORKER_MASTER: {
    HOUSED: '/api/V1/Worker/Housed',
    DEPORTATION: (workerId: string) => `/api/V1/Worker/${workerId}/Deportation`,
    CANCEL_DEPORTATION: (workerId: string) => `/api/V1/Worker/${workerId}/CancelDeportation`,
    HANDOVER: (workerId: string) => `/api/V1/Worker/${workerId}/Handover`,
    ISSUE_RESIDENCY: (workerId: string) => `/api/V1/Worker/${workerId}/IssueResidency`,
    ADD_UPDATE: (workerId: string) => `/api/V1/Worker/${workerId}/AddUpdate`,
    EXIT_AND_REENTRY: (workerId: string) => `/api/V1/Worker/${workerId}/ExitAndReEntry`,
    EXIT_HOUSING: (workerId: string) => `/api/V1/Worker/${workerId}/ExitHousing`,
  },

  // ─── Accounting: Chart of Accounts — /api/V1/account/* ────────────────────
  // Account code first digit → type: 1=Asset 2=Liability 3=Equity
  // 4=Revenue 5=OpEx 6=AdminEx. All IDs are GUIDs.
  ACCOUNT: {
    // GET full hierarchical account tree (nested children)
    FULL_TREE: '/api/V1/account/full-tree-structure',
    // GET sub-tree rooted at a parent account
    SUBTREE: (parentId: string) => `/api/V1/account/subtree/${parentId}`,
    // POST create a new account (parent becomes a non-leaf node automatically)
    CREATE: '/api/V1/account/create-account',
    // PUT update an account's display name
    UPDATE: (accountId: string) => `/api/V1/account/update-account/${accountId}`,
    // PUT update income-statement / P&L side + trial-balance grouping flag
    REPORTING: (accountId: string) => `/api/V1/account/reporting/${accountId}`,
    // DELETE a leaf account (fails if it has children or financial movements)
    DELETE: (accountId: string) => `/api/V1/account/delete-account/${accountId}`,
    // GET paginated account list with report-side settings
    SETTINGS: '/api/V1/account/settings',
  },

  // ─── Accounting: Restriction (journal entry) Types — /api/V1/restrictiontype/* ──
  // NOTE: POST (create) currently returns 501 Not Implemented server-side.
  RESTRICTION_TYPE: {
    GET_ALL: '/api/V1/restrictiontype',
    GET_BY_ID: (id: string) => `/api/V1/restrictiontype/${id}`,
    CREATE: '/api/V1/restrictiontype',
    UPDATE: (id: string) => `/api/V1/restrictiontype/${id}`,
    DELETE: (id: string) => `/api/V1/restrictiontype/${id}`,
  },

  // ─── Accounting: Journal Entries — /api/V1/JournalEntries/* ───────────────
  // Manual double-entry accounting. Created as Draft; debits must equal credits.
  // Only Draft entries can be updated or deleted. All IDs are GUIDs.
  JOURNAL_ENTRIES: {
    GET_ALL: '/api/V1/JournalEntries',
    GET_BY_ID: (id: string) => `/api/V1/JournalEntries/${id}`,
    CREATE: '/api/V1/JournalEntries',
    UPDATE: (id: string) => `/api/V1/JournalEntries/${id}`,
    DELETE: (id: string) => `/api/V1/JournalEntries/${id}`,
  },

  // ─── Accounting: Posting / Unposting — /api/V1/Posting/* ──────────────────
  // Posting commits a Draft entry to the ledger; unposting reverses it to Draft.
  POSTING: {
    POST: (journalId: string) => `/api/V1/Posting/${journalId}`,
    UNPOST: (id: string) => `/api/V1/Posting/${id}/unpost`,
  },

  // ─── Accounting: Ledger & Reports — /api/V1/Ledger/* ──────────────────────
  // Read-only reports. All return ONLY Posted data and accept from/to (ISO 8601).
  LEDGER: {
    GENERAL: '/api/V1/Ledger/general-ledger',
    AGENT: '/api/V1/Ledger/agent-ledger',
    CUSTOMER: '/api/V1/Ledger/customer-ledger',
    WORKER: '/api/V1/Ledger/worker-ledger',
    TRIAL_BALANCE: '/api/V1/Ledger/trial-balance',
    INCOME_STATEMENT: '/api/V1/Ledger/income-statement',
    BALANCE_SHEET: '/api/V1/Ledger/balance-sheet',
    VAT_REPORT: '/api/V1/Ledger/vat-report',
  },

  // ─── Hourly Workers — /api/V1/HourlyWorkers/* ─────────────────────────────
  // Worker pool. Note: Activate/Deactivate are POST with NO body — pass {} so a
  // Content-Length:0 header is sent (the server returns 411 otherwise).
  HOURLY_WORKERS: {
    GET_ALL: '/api/V1/HourlyWorkers',
    GET_BY_ID: (id: string) => `/api/V1/HourlyWorkers/${id}`,
    CREATE: '/api/V1/HourlyWorkers',
    UPDATE: (id: string) => `/api/V1/HourlyWorkers/${id}`,
    DELETE: (id: string) => `/api/V1/HourlyWorkers/${id}`,
    ACTIVATE: (id: string) => `/api/V1/HourlyWorkers/${id}/Activate`,
    DEACTIVATE: (id: string) => `/api/V1/HourlyWorkers/${id}/Deactivate`,
  },

  // ─── Hourly Worker Requests — /api/V1/HourlyWorkerRequests/* ──────────────
  // Requests originate from mobile (no create endpoint). Dashboard reviews,
  // assigns one worker, and drives the lifecycle. All action POSTs take {} body
  // except Assign ({workerId}) and Reject ({notes?}).
  HOURLY_WORKER_REQUESTS: {
    GET_ALL: '/api/V1/HourlyWorkerRequests',
    GET_BY_ID: (id: string) => `/api/V1/HourlyWorkerRequests/${id}`,
    APPROVE: (id: string) => `/api/V1/HourlyWorkerRequests/${id}/Approve`,
    REJECT: (id: string) => `/api/V1/HourlyWorkerRequests/${id}/Reject`,
    ASSIGN: (id: string) => `/api/V1/HourlyWorkerRequests/${id}/Assign`,
    IN_PROGRESS: (id: string) => `/api/V1/HourlyWorkerRequests/${id}/InProgress`,
    COMPLETE: (id: string) => `/api/V1/HourlyWorkerRequests/${id}/Complete`,
    CANCEL: (id: string) => `/api/V1/HourlyWorkerRequests/${id}/Cancel`,
  },
} as const;
