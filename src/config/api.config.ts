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

  // Receipt Voucher — /api/ReceiptVoucher
  RECEIPT_VOUCHER: {
    GET_ALL: '/api/ReceiptVoucher',
    GET_BY_ID: (id: number | string) => `/api/ReceiptVoucher/${id}`,
    CREATE: '/api/ReceiptVoucher',
    UPDATE: (id: number | string) => `/api/ReceiptVoucher/${id}`,
    DELETE: (id: number | string) => `/api/ReceiptVoucher/${id}`,
  },

  // Transfer Contract — /api/TransferContract
  TRANSFER_CONTRACT: {
    GET_ALL: '/api/TransferContract',
    GET_BY_ID: (id: number | string) => `/api/TransferContract/${id}`,
    CREATE: '/api/TransferContract',
    UPDATE: (id: number | string) => `/api/TransferContract/${id}`,
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

  // ─── HR Module ───────────────────────────────────────────────────────────
  // Paths aligned with swagger-Hr-Api.json (RESTful style)

  // HR Employees — GET /api/HR/Employee, POST /api/HR/Employee,
  //                GET|PUT|DELETE /api/HR/Employee/{id}
  HR_EMPLOYEES: {
    GET_ALL: '/api/HR/Employee',
    GET_BY_ID: (id: string) => `/api/HR/Employee/${id}`,
    CREATE: '/api/HR/Employee',
    UPDATE: (id: string) => `/api/HR/Employee/${id}`,
    DELETE: (id: string) => `/api/HR/Employee/${id}`,
  },

  // HR Department — POST /api/HR/Department
  HR_DEPARTMENT: {
    CREATE: '/api/HR/Department',
  },

  // HR Lookups — GET /api/HR/Lookup/{resource}
  HR_LOOKUPS: {
    DEPARTMENTS: '/api/HR/Lookup/Departments',
    SALARY_SCALES: '/api/HR/Lookup/SalaryScales',
    CUSTODY_TYPES: '/api/HR/Lookup/CustodyTypes',
  },

  // Vacation Request
  HR_VACATION: {
    GET_BY_ID: (id: string) => `/api/HR/VacationRequest/${id}`,
    CREATE: '/api/HR/VacationRequest/Create',
    APPROVE: (id: string) => `/api/HR/VacationRequest/Approve/${id}`,
    REJECT: (id: string) => `/api/HR/VacationRequest/Reject/${id}`,
  },

  // Permission Request
  HR_PERMISSION: {
    GET_ALL: '/api/HR/PermissionRequest/GetAll',
    CREATE: '/api/HR/PermissionRequest/Create',
    APPROVE: (id: string) => `/api/HR/PermissionRequest/Approve/${id}`,
    REJECT: (id: string) => `/api/HR/PermissionRequest/Reject/${id}`,
  },

  // Custody Request
  HR_CUSTODY: {
    GET_ALL: '/api/HR/CustodyRequest/GetAll',
    CREATE: '/api/HR/CustodyRequest/Create',
    APPROVE: (id: string) => `/api/HR/CustodyRequest/Approve/${id}`,
    REJECT: (id: string) => `/api/HR/CustodyRequest/Reject/${id}`,
  },

  // Job Modification Request
  HR_JOB_MODIFICATION: {
    GET_ALL: '/api/HR/JobModificationRequest/GetAll',
    CREATE: '/api/HR/JobModificationRequest/Create',
    APPROVE: (id: string) => `/api/HR/JobModificationRequest/Approve/${id}`,
    REJECT: (id: string) => `/api/HR/JobModificationRequest/Reject/${id}`,
  },

  // Resignation Request
  HR_RESIGNATION: {
    GET_ALL: '/api/HR/ResignationRequest/GetAll',
    CREATE: '/api/HR/ResignationRequest/Create',
    APPROVE: (id: string) => `/api/HR/ResignationRequest/Approve/${id}`,
    REJECT: (id: string) => `/api/HR/ResignationRequest/Reject/${id}`,
  },

  // Entitlements Request
  HR_ENTITLEMENTS: {
    GET_ALL: '/api/HR/EntitlementsRequest/GetAll',
    CREATE: '/api/HR/EntitlementsRequest/Create',
    APPROVE: (id: string) => `/api/HR/EntitlementsRequest/Approve/${id}`,
    REJECT: (id: string) => `/api/HR/EntitlementsRequest/Reject/${id}`,
  },

  // Loans Request
  HR_LOANS: {
    GET_ALL: '/api/HR/LoanRequest/GetAll',
    CREATE: '/api/HR/LoanRequest/Create',
    APPROVE: (id: string) => `/api/HR/LoanRequest/Approve/${id}`,
    REJECT: (id: string) => `/api/HR/LoanRequest/Reject/${id}`,
  },

  // Requests Follow-up (filter via POST)
  HR_REQUESTS_INBOX: {
    FILTER: '/api/HR/RequestsInbox/Filter',
  },

  HR_REQUESTS_OUTBOX: {
    FILTER: '/api/HR/RequestsOutbox/Filter',
  },

  // Employee Commission
  HR_COMMISSION: {
    GET_ALL: '/api/HR/Commission/GetAll',
    CREATE: '/api/HR/Commission/Create',
    DELETE: (id: number) => `/api/HR/Commission/Delete/${id}`,
  },

  // Commission Slices
  HR_COMMISSION_SLICES: {
    GET_ALL: '/api/HR/CommissionSlice/GetAll',
    CREATE: '/api/HR/CommissionSlice/Create',
    DELETE: (id: number) => `/api/HR/CommissionSlice/Delete/${id}`,
  },

  // Attendance — filter via POST
  HR_ATTENDANCE: {
    FILTER: '/api/HR/Attendance/Filter',
  },

  // Leave Balance — filter via POST
  HR_LEAVE_BALANCE: {
    FILTER: '/api/HR/LeaveBalance/Filter',
  },

  // HR Complaints
  HR_COMPLAINTS: {
    CREATE: '/api/HR/Complaint/Create',
    REPLY: '/api/HR/Complaint/Reply',
    CLOSE: (id: string) => `/api/HR/Complaint/Close/${id}`,
    DELETE: (id: string) => `/api/HR/Complaint/Delete/${id}`,
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
} as const;
