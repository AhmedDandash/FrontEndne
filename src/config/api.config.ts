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
    START_EXECUTION: (id: number | string) => `/api/EmploymentOperatingContract/${id}/start-execution`,
    RENEW: (id: number | string) => `/api/EmploymentOperatingContract/${id}/renew`,
    TERMINATE: (id: number | string) => `/api/EmploymentOperatingContract/${id}/terminate`,
    PRINT_RECEIPT_FORM: (id: number | string) => `/api/EmploymentOperatingContract/${id}/print-receipt-form`,
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
    GET_SUMMARY: '/api/MediationContractOffer/GetSummeryOffer',
    GET_ALL: '/api/MediationContractOffer/GetAllOffer',
    GET_BY_ID: (id: number) => `/api/MediationContractOffer/GetOfferById/${id}`,
    CREATE: '/api/MediationContractOffer/CreateOffer',
    UPDATE: (id: number) => `/api/MediationContractOffer/UpdateOffer/${id}`,
    DELETE: (id: number) => `/api/MediationContractOffer/DeleteOffer/${id}`,
  },

  // Mediation Contract
  MEDIATION_CONTRACT: {
    GET_ALL: '/api/MediationContract',
    CREATE: '/api/MediationContract',
    GET_BY_ID: (id: number) => `/api/MediationContract/${id}`,
    UPDATE: (id: number) => `/api/MediationContract/${id}`,
    DELETE: (id: number) => `/api/MediationContract/${id}`,
    ADD_NOTE: '/api/MediationContract/AddNote',
    ALL_NOTES: '/api/MediationContract/AllNotes',
    ADD_DOMESTIC_WORKER: '/api/MediationContract/Addingdomesticworker',
    CONTRACT_TYPE_CHANGE: '/api/MediationContract/ContractTypeChange',
    CONTRACT_CANCEL: '/api/MediationContract/ContractCancel',
    GET_INVOICE_BY_ID: (id: number) => `/api/MediationContract/GetInvoiceById/${id}`,
    CREATE_INVOICE: '/api/MediationContract/CreateInvoice',
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

  // Mediation Follow-Up Statuses
  MEDIATION_FOLLOWUP_STATUSES: {
    GET_ALL_PARENTS: '/api/MediationFollowUpStatuses/GetAllFollowUpStatuses',
    CREATE_PARENT: '/api/MediationFollowUpStatuses/CreateFollowUpStatuses',
    GET_SUB_STATUSES: (parentId: number) =>
      `/api/MediationFollowUpStatuses/GetAllSubFollowUpStatus/${parentId}`,
    CREATE_SUB: '/api/MediationFollowUpStatuses/CreateSubFollowUpStatus',
    UPDATE_SUB: (id: number) => `/api/MediationFollowUpStatuses/UpdateSubFollowUpStatus/${id}`,
    TOGGLE_ACTIVE: '/api/MediationFollowUpStatuses/SubFollowUpStatusIsActive',
    TOGGLE_FINISH: '/api/MediationFollowUpStatuses/SubFollowUpStatusIsActionFinish',
    UPDATE_CASE_ORDER: '/api/MediationFollowUpStatuses/SubFollowUpStatusCaseOrder',
  },

  // Mediation Contract Follow-Up
  MEDIATION_CONTRACT_FOLLOWUP: {
    GET_BY_CONTRACT: '/api/MediationContractFollowUp/GetByContract',
    CREATE: '/api/MediationContractFollowUp/Create',
  },

  // Mediation Contract Messages
  MEDIATION_CONTRACT_MESSAGES: {
    GET_BY_CONTRACT: (contractId: number) =>
      `/api/MediationContractMessages/ByContract/${contractId}`,
    CREATE: '/api/MediationContractMessages',
    DELETE: (id: number) => `/api/MediationContractMessages/${id}`,
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
    CREATE: '/api/V1/MedicalExamination',
    UPDATE: (id: number | string) => `/api/V1/MedicalExamination/${id}`,
    DELETE: (id: number | string) => `/api/V1/MedicalExamination/${id}`,
    REPORT: (id: number | string) => `/api/V1/MedicalExamination/report/${id}`,
  },

  // ─── HR Module ───────────────────────────────────────────────────────────

  // HR Employees
  HR_EMPLOYEES: {
    GET_ALL: '/api/HR/Employee/GetAll',
    GET_BY_ID: (id: string) => `/api/HR/Employee/GetById/${id}`,
    GET_CURRENT: '/api/HR/Employee/GetCurrent',
    SEARCH: '/api/HR/Employee/Search',
  },

  // HR Lookups
  HR_LOOKUPS: {
    DEPARTMENTS: '/api/HR/Lookup/Departments',
    SALARY_SCALES: '/api/HR/Lookup/SalaryScales',
    CUSTODY_TYPES: '/api/HR/Lookup/CustodyTypes',
    VACATION_TYPES: '/api/HR/Lookup/VacationTypes',
  },

  // Vacation Request
  HR_VACATION: {
    GET_ALL: '/api/HR/VacationRequest/GetAll',
    GET_BY_ID: (id: number) => `/api/HR/VacationRequest/GetById/${id}`,
    CREATE: '/api/HR/VacationRequest/Create',
    APPROVE: (id: number) => `/api/HR/VacationRequest/Approve/${id}`,
    REJECT: (id: number) => `/api/HR/VacationRequest/Reject/${id}`,
  },

  // Permission Request
  HR_PERMISSION: {
    GET_ALL: '/api/HR/PermissionRequest/GetAll',
    GET_BY_ID: (id: number) => `/api/HR/PermissionRequest/GetById/${id}`,
    CREATE: '/api/HR/PermissionRequest/Create',
    APPROVE: (id: number) => `/api/HR/PermissionRequest/Approve/${id}`,
    REJECT: (id: number) => `/api/HR/PermissionRequest/Reject/${id}`,
  },

  // Custody Request
  HR_CUSTODY: {
    GET_ALL: '/api/HR/CustodyRequest/GetAll',
    GET_BY_ID: (id: number) => `/api/HR/CustodyRequest/GetById/${id}`,
    CREATE: '/api/HR/CustodyRequest/Create',
    APPROVE: (id: number) => `/api/HR/CustodyRequest/Approve/${id}`,
    REJECT: (id: number) => `/api/HR/CustodyRequest/Reject/${id}`,
  },

  // Job Modification Request
  HR_JOB_MODIFICATION: {
    GET_ALL: '/api/HR/JobModificationRequest/GetAll',
    GET_BY_ID: (id: number) => `/api/HR/JobModificationRequest/GetById/${id}`,
    CREATE: '/api/HR/JobModificationRequest/Create',
    APPROVE: (id: number) => `/api/HR/JobModificationRequest/Approve/${id}`,
    REJECT: (id: number) => `/api/HR/JobModificationRequest/Reject/${id}`,
  },

  // Resignation Request
  HR_RESIGNATION: {
    GET_ALL: '/api/HR/ResignationRequest/GetAll',
    GET_BY_ID: (id: number) => `/api/HR/ResignationRequest/GetById/${id}`,
    CREATE: '/api/HR/ResignationRequest/Create',
    APPROVE: (id: number) => `/api/HR/ResignationRequest/Approve/${id}`,
    REJECT: (id: number) => `/api/HR/ResignationRequest/Reject/${id}`,
  },

  // Entitlements Request
  HR_ENTITLEMENTS: {
    GET_ALL: '/api/HR/EntitlementsRequest/GetAll',
    GET_BY_ID: (id: number) => `/api/HR/EntitlementsRequest/GetById/${id}`,
    CREATE: '/api/HR/EntitlementsRequest/Create',
    APPROVE: (id: number) => `/api/HR/EntitlementsRequest/Approve/${id}`,
    REJECT: (id: number) => `/api/HR/EntitlementsRequest/Reject/${id}`,
  },

  // Loans Request
  HR_LOANS: {
    GET_ALL: '/api/HR/LoanRequest/GetAll',
    GET_BY_ID: (id: number) => `/api/HR/LoanRequest/GetById/${id}`,
    CREATE: '/api/HR/LoanRequest/Create',
    APPROVE: (id: number) => `/api/HR/LoanRequest/Approve/${id}`,
    REJECT: (id: number) => `/api/HR/LoanRequest/Reject/${id}`,
  },

  // Requests Follow-up
  HR_REQUESTS_INBOX: {
    GET_ALL: '/api/HR/RequestsInbox/GetAll',
    FILTER: '/api/HR/RequestsInbox/Filter',
  },

  HR_REQUESTS_OUTBOX: {
    GET_ALL: '/api/HR/RequestsOutbox/GetAll',
    FILTER: '/api/HR/RequestsOutbox/Filter',
  },

  // Employee Commission
  HR_COMMISSION: {
    GET_ALL: '/api/HR/Commission/GetAll',
    GET_BY_EMPLOYEE: (empId: string) => `/api/HR/Commission/GetByEmployee/${empId}`,
    CREATE: '/api/HR/Commission/Create',
    UPDATE: (id: number) => `/api/HR/Commission/Update/${id}`,
    DELETE: (id: number) => `/api/HR/Commission/Delete/${id}`,
  },

  // Commission Slices
  HR_COMMISSION_SLICES: {
    GET_ALL: '/api/HR/CommissionSlice/GetAll',
    GET_BY_ID: (id: number) => `/api/HR/CommissionSlice/GetById/${id}`,
    CREATE: '/api/HR/CommissionSlice/Create',
    UPDATE: (id: number) => `/api/HR/CommissionSlice/Update/${id}`,
    DELETE: (id: number) => `/api/HR/CommissionSlice/Delete/${id}`,
  },

  // Attendance
  HR_ATTENDANCE: {
    GET_ALL: '/api/HR/Attendance/GetAll',
    GET_BY_EMPLOYEE: (empId: string) => `/api/HR/Attendance/GetByEmployee/${empId}`,
    FILTER: '/api/HR/Attendance/Filter',
  },

  // Leave Balance
  HR_LEAVE_BALANCE: {
    GET_ALL: '/api/HR/LeaveBalance/GetAll',
    GET_BY_EMPLOYEE: (empId: string) => `/api/HR/LeaveBalance/GetByEmployee/${empId}`,
    FILTER: '/api/HR/LeaveBalance/Filter',
  },

  // HR Complaints
  HR_COMPLAINTS: {
    GET_ALL: '/api/HR/Complaint/GetAll',
    GET_BY_ID: (id: number) => `/api/HR/Complaint/GetById/${id}`,
    CREATE: '/api/HR/Complaint/Create',
    REPLY: '/api/HR/Complaint/Reply',
    CLOSE: (id: number) => `/api/HR/Complaint/Close/${id}`,
    DELETE: (id: number) => `/api/HR/Complaint/Delete/${id}`,
  },
} as const;
