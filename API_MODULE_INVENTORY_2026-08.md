# API Module Inventory — Sigma Frontend (2026-08)

**Scope:** Complete endpoint + module audit of the Next.js frontend at `D:\sigma\FrontEnd`, which is a pure API consumer calling a live backend at https://sigma-api.runasp.net (proxied same-origin via next.config.js). This inventory captures all 40+ named API blocks from `src/config/api.config.ts` (748 lines), their ~180 constituent endpoints, corresponding service classes in `src/services/`, permission/role mappings from `src/config/pagePermissions.config.ts`, and frontend page usage.

**Primary Sources:**
1. `src/config/api.config.ts` — authoritative endpoint list (40+ named blocks, all inline-commented with quirks)
2. `src/services/*.ts` (44 files) — one service class per module, wraps api.config.ts calls
3. `src/app/**` — frontend pages/routes mapped to services
4. `src/config/pagePermissions.config.ts` — page→role access matrix (140 pages, ~3 groups)
5. `sigma-api.txt` — backend spec dump (used selectively for clarification)

**Auth Context (verified 2026-07-12, may have shifted):**
- Most GETs return 200 with no bearer token
- Writes (POST/PUT/PATCH/DELETE) require valid `X-Branch-Id` GUID header (not JWT)
- `*/me/*` and `HourlyCustomer/*` routes correctly enforce 403 when unauthenticated
- `/Filter` POST routes correctly require auth
- Status: **inconsistent, verify per endpoint in live testing** (marked "unverified" below where uncertain)

---

## Module 1: Authentication

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| AUTH | POST | `/api/V1/Auth/login` | public (POST) | none | none | LoginForm (public page) |
| AUTH | POST | `/api/V1/Auth/logout` | bearer token required | none | none | UserMenu (ubiquitous) |
| AUTH | POST | `/api/V1/Auth/refresh-token` | bearer token required | none | none | ApiClient (automatic renewal) |
| AUTH | POST | `/api/V1/Auth/change-password` | bearer token required | none | none | SettingsPage (user profile) |
| AUTH | GET | `/api/V1/Auth/me` | bearer token required (enforced 403) | none | none | CurrentUserContext (app-wide) |
| AUTH | POST | `/api/V1/Auth/add-admin` | bearer token required | admin | none | RegisterPage (/register) |

---

## Module 2: Branch Management

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| BRANCH | GET | `/api/V1/Branch` | public (unverified) | Core access | none | BranchGate, BranchSelector, BranchSelect dropdowns |
| BRANCH | GET | `/api/V1/Branch/{id}` | public (unverified) | Core access | none | BranchDetailPage |
| BRANCH | GET | `/api/V1/Branch/{id}/sub-branches` | public (unverified) | Core access | none | HierarchyTree, SubBranchList |
| BRANCH | POST | `/api/V1/Branch` | X-Branch-Id header required | /branch/management | none | BranchFormModal (create) |
| BRANCH | PUT | `/api/V1/Branch/{id}` | X-Branch-Id header required | /branch/management | none | BranchFormModal (update) |
| BRANCH | DELETE | `/api/V1/Branch/{id}` | X-Branch-Id header required | /branch/management | none | BranchDeleteAction |

---

## Module 3: Customers

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| CUSTOMERS | GET | `/api/V1/Customer` | public (unverified) | /customers | none | CustomerListPage, CustomerExplorerTable |
| CUSTOMERS | GET | `/api/V1/Customer/{id}` | public (unverified) | /customers | none | CustomerDetailPage |
| CUSTOMERS | POST | `/api/V1/Customer` | X-Branch-Id header required | /customers | none | CustomerCreateModal |
| CUSTOMERS | PUT | `/api/V1/Customer/{id}` | X-Branch-Id header required | /customers | none | CustomerEditModal |
| CUSTOMERS | DELETE | `/api/V1/Customer/{id}` | X-Branch-Id header required | /customers | none | CustomerDeleteAction |
| CUSTOMERS | GET | `/api/V1/Customer/export` | X-Branch-Id header required | /customers | none | CustomerExportButton (query-based) |
| CUSTOMERS | POST | `/api/V1/Customer/generate-english-name` | X-Branch-Id header required | /customers | none | ArabicNameTransliterator (auto-fill) |

---

## Module 4: Agents

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| AGENT | GET | `/api/V1/Agent` | public (unverified) | /agents | Branch | AgentListPage, AgentSelector (dropdowns across modules) |
| AGENT | GET | `/api/V1/Agent/{id}` | public (unverified) | /agents | Branch | AgentDetailPage |
| AGENT | POST | `/api/V1/Agent` | X-Branch-Id header required | /agents | Branch, Customer | AgentCreateModal |
| AGENT | PUT | `/api/V1/Agent/{id}` | X-Branch-Id header required | /agents | Branch, Customer | AgentEditModal |
| AGENT | DELETE | `/api/V1/Agent/{id}` | X-Branch-Id header required | /agents | Branch | AgentDeleteAction |

---

## Module 5: Workers

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| WORKERS | GET | `/api/V1/Worker` | public (unverified) | /applicants | Branch, Job, Nationality | WorkerListPage (/applicants), AvailableWorkersPage |
| WORKERS | GET | `/api/V1/Worker/{id}` | public (unverified) | /applicants | Branch, Job | WorkerDetailPage (/applicants/[id]) |
| WORKERS | POST | `/api/V1/Worker` | X-Branch-Id header required | /applicants | Branch, Nationality, Job | WorkerCreateModal |
| WORKERS | PUT | `/api/V1/Worker/{id}` | X-Branch-Id header required | /applicants | Branch, Nationality, Job | WorkerEditModal |
| WORKERS | DELETE | `/api/V1/Worker/{id}` | X-Branch-Id header required | /applicants | Branch | WorkerDeleteAction |
| WORKERS | POST | `/api/V1/Worker/{id}/activate` | X-Branch-Id header required | /applicants | Branch | WorkerActivateButton |
| WORKERS | POST | `/api/V1/Worker/{id}/move-to-accommodation` | X-Branch-Id header required | /housing/applicants | Branch, Housing | WorkerMoveToHousingButton |
| WORKERS | POST | `/api/V1/Worker/{id}/set-refusal` | X-Branch-Id header required | /applicants | Branch | WorkerRefuseButton |
| WORKERS | POST | `/api/V1/Worker/WantsTransfer` | X-Branch-Id header required | /sponsorship-transfer | Branch | WorkerTransferRequest |
| WORKERS | GET | `/api/V1/Worker/export` | X-Branch-Id header required | /applicants | Branch | WorkerExportButton (query-based) |

---

## Module 6: Jobs

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| JOB | GET | `/api/V1/Job` | public (unverified) | none | Branch | JobSelector (dropdowns across Worker, Contract modules) |
| JOB | GET | `/api/V1/Job/{id}` | public (unverified) | none | Branch | JobDetailPage (no dedicated page, used in modals) |
| JOB | POST | `/api/V1/Job` | X-Branch-Id header required | settings (inferred) | Branch | JobCreateModal (settings only) |
| JOB | PUT | `/api/V1/Job/{id}` | X-Branch-Id header required | settings | Branch | JobEditModal (settings only) |
| JOB | DELETE | `/api/V1/Job/{id}` | X-Branch-Id header required | settings | Branch | JobDeleteAction (settings only) |

---

## Module 7: Nationalities

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| NATIONALITY | GET | `/api/V1/Nationality` | public (unverified) | none | Branch | NationalitySelector (dropdowns across Worker module) |
| NATIONALITY | GET | `/api/V1/Nationality/{id}` | public (unverified) | none | Branch | NationalityDetailPage (no dedicated page, used in modals) |
| NATIONALITY | POST | `/api/V1/Nationality` | X-Branch-Id header required | settings | Branch | NationalityCreateModal (settings only) |
| NATIONALITY | PUT | `/api/V1/Nationality/{id}` | X-Branch-Id header required | settings | Branch | NationalityEditModal (settings only) |
| NATIONALITY | DELETE | `/api/V1/Nationality/{id}` | X-Branch-Id header required | settings | Branch | NationalityDeleteAction (settings only) |
| NATIONALITY | POST | `/api/V1/Nationality/{id}/toggle-status` | X-Branch-Id header required | settings | Branch | NationalityToggleButton (settings only) |

---

## Module 8: Commission

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| COMMISSION | GET | `/api/V1/Commission/GetAll` | public (unverified) | none | none | CommissionSelector (dropdowns, limited use) |

---

## Module 9: Mediation Contracts

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| MEDIATION_CONTRACT | GET | `/api/Mediation/MediationContract` | public (unverified) | /contracts/mediationcontract | Branch, Customer, Worker, Job | MediationContractListPage |
| MEDIATION_CONTRACT | GET | `/api/Mediation/MediationContract/{id}` | public (unverified) | /contracts/mediationcontract | Branch | MediationContractDetailPage (/contracts/mediationcontract/[id]) |
| MEDIATION_CONTRACT | POST | `/api/Mediation/MediationContract` | X-Branch-Id header required | /contracts/mediationcontract | Branch, Customer, Worker, Job, MediationOffer | MediationContractCreateWizard |
| MEDIATION_CONTRACT | GET | `/api/Mediation/MediationContract/export` | X-Branch-Id header required | /contracts/mediationcontract | Branch | MediationContractExportButton (query-based) |
| MEDIATION_CONTRACT | GET | `/api/Mediation/MediationContract/recruitment-requests` | public (unverified) | /contracts/mediationrequests | Branch | RecruitmentRequestsPage |
| MEDIATION_CONTRACT | POST | `/api/Mediation/MediationContract/end-worker-service` | X-Branch-Id header required | /contracts/mediationcontract | Branch, Worker | WorkerServiceEndModal |
| MEDIATION_CONTRACT | POST | `/api/Mediation/MediationContract/assign-worker` | X-Branch-Id header required | /contracts/mediationcontract | Branch, Worker | WorkerAssignModal |
| MEDIATION_CONTRACT | POST | `/api/Mediation/MediationContract/cancel` | X-Branch-Id header required | /contracts/mediationcontract | Branch | ContractCancelButton |
| MEDIATION_CONTRACT | POST | `/api/Mediation/MediationContract/customer-payment` | X-Branch-Id header required | /contracts/mediationcontract | Branch | CustomerPaymentModal |
| MEDIATION_CONTRACT | POST | `/api/Mediation/MediationContract/sign` | X-Branch-Id header required | /contracts/mediationcontract | Branch | ContractSignButton |
| MEDIATION_CONTRACT | POST | `/api/Mediation/MediationContract/update-status` | X-Branch-Id header required | /contracts/mediationcontract | Branch | ContractStatusUpdateModal |
| MEDIATION_CONTRACT | POST | `/api/Mediation/MediationContract/delivery-form` | X-Branch-Id header required | /contracts/mediationcontract | Branch | DeliveryFormSubmit |
| MEDIATION_CONTRACT | POST | `/api/Mediation/MediationContract/delivery-form/sign` | X-Branch-Id header required | /contracts/mediationcontract | Branch | DeliveryFormSignButton |
| MEDIATION_CONTRACT | POST | `/api/Mediation/MediationContract/warranty-return` | X-Branch-Id header required | /contracts/mediationcontract | Branch | WarrantyReturnModal |
| MEDIATION_CONTRACT | GET | `/api/Mediation/MediationContract/status-history/{contractId}` | public (unverified) | /contracts/mediationcontract | Branch | ContractStatusHistoryPanel |

---

## Module 10: Mediation Contract Offers

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| MEDIATION_CONTRACT_OFFER | GET | `/api/Mediation/MediationContractOffer` | public (unverified) | /contracts/mediationcontract/offers | Branch, Job, Nationality | MediationOfferListPage |
| MEDIATION_CONTRACT_OFFER | GET | `/api/Mediation/MediationContractOffer/{id}` | public (unverified) | /contracts/mediationcontract/offers | Branch | MediationOfferDetailPage |
| MEDIATION_CONTRACT_OFFER | POST | `/api/Mediation/MediationContractOffer` | X-Branch-Id header required | /contracts/mediationcontract/offers | Branch, Job, Nationality | MediationOfferCreateModal |
| MEDIATION_CONTRACT_OFFER | PUT | `/api/Mediation/MediationContractOffer` | X-Branch-Id header required | /contracts/mediationcontract/offers | Branch | MediationOfferUpdateModal (PUT uses same path) |
| MEDIATION_CONTRACT_OFFER | DELETE | `/api/Mediation/MediationContractOffer/{id}` | X-Branch-Id header required | /contracts/mediationcontract/offers | Branch | MediationOfferDeleteButton |
| MEDIATION_CONTRACT_OFFER | POST | `/api/Mediation/MediationContractOffer/{id}/toggle-active` | X-Branch-Id header required | /contracts/mediationcontract/offers | Branch | MediationOfferToggleButton |
| MEDIATION_CONTRACT_OFFER | POST | `/api/Mediation/MediationContractOffer/auto-fill` | X-Branch-Id header required | /contracts/mediationcontract/offers | Branch, Job, Nationality | MediationOfferAutoFillButton |

---

## Module 11: Employment Operating Contracts (Rental Contracts)

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| EMPLOYMENT_OPERATING_CONTRACT | GET | `/api/EmploymentOperatingContract` | public (unverified) | /contracts/operation/rent | Branch, Customer, Worker | OperatingContractListPage |
| EMPLOYMENT_OPERATING_CONTRACT | GET | `/api/EmploymentOperatingContract/{id}` | public (unverified) | /contracts/operation/rent | Branch | OperatingContractDetailPage (/contracts/operation/rent/[id]) |
| EMPLOYMENT_OPERATING_CONTRACT | POST | `/api/EmploymentOperatingContract` | X-Branch-Id header required | /contracts/operation/rent | Branch, Customer, Worker | OperatingContractCreateWizard |
| EMPLOYMENT_OPERATING_CONTRACT | PUT | `/api/EmploymentOperatingContract/{id}` | X-Branch-Id header required | /contracts/operation/rent | Branch | OperatingContractEditModal |
| EMPLOYMENT_OPERATING_CONTRACT | DELETE | `/api/EmploymentOperatingContract/{id}` | X-Branch-Id header required | /contracts/operation/rent | Branch | OperatingContractDeleteButton |
| EMPLOYMENT_OPERATING_CONTRACT | POST | `/api/EmploymentOperatingContract/{id}/sign` | X-Branch-Id header required | /contracts/operation/rent | Branch | ContractSignButton |
| EMPLOYMENT_OPERATING_CONTRACT | POST | `/api/EmploymentOperatingContract/{id}/start-execution` | X-Branch-Id header required | /contracts/operation/rent | Branch | ContractStartExecutionButton |
| EMPLOYMENT_OPERATING_CONTRACT | POST | `/api/EmploymentOperatingContract/{id}/renew` | X-Branch-Id header required | /contracts/operation/rent | Branch | ContractRenewButton |
| EMPLOYMENT_OPERATING_CONTRACT | POST | `/api/EmploymentOperatingContract/{id}/terminate` | X-Branch-Id header required | /contracts/operation/rent | Branch | ContractTerminateButton |
| EMPLOYMENT_OPERATING_CONTRACT | POST | `/api/EmploymentOperatingContract/{id}/customer-refund` | X-Branch-Id header required | /contracts/operation/rent | Branch | CustomerRefundModal |
| EMPLOYMENT_OPERATING_CONTRACT | GET | `/api/EmploymentOperatingContract/{id}/print-receipt-form` | X-Branch-Id header required (unverified) | /contracts/operation/rent | Branch | ReceiptFormPrintButton |
| EMPLOYMENT_OPERATING_CONTRACT | GET | `/api/EmploymentOperatingContract/{id}/print-delivery-form` | X-Branch-Id header required (unverified) | /contracts/operation/rent | Branch | DeliveryFormPrintButton |
| EMPLOYMENT_OPERATING_CONTRACT | POST | `/api/EmploymentOperatingContract/{id}/delivery-form` | X-Branch-Id header required | /contracts/operation/rent | Branch | DeliveryFormSubmit |

---

## Module 12: Operating Contract Offers (Rental Prices & Offers)

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| OPERATING_CONTRACT_OFFER | GET | `/api/OperatingContractOffer` | public (unverified) | /contracts/operation/rent-prices-offers | Branch, Job, Customer | RentPricesOffersListPage |
| OPERATING_CONTRACT_OFFER | GET | `/api/OperatingContractOffer/{id}` | public (unverified) | /contracts/operation/rent-prices-offers | Branch | RentPriceOfferDetailPage |
| OPERATING_CONTRACT_OFFER | POST | `/api/OperatingContractOffer` | X-Branch-Id header required | /contracts/operation/rent-prices-offers | Branch, Job, Customer | RentPriceOfferCreateModal |
| OPERATING_CONTRACT_OFFER | PUT | `/api/OperatingContractOffer/{id}` | X-Branch-Id header required | /contracts/operation/rent-prices-offers | Branch | RentPriceOfferEditModal |
| OPERATING_CONTRACT_OFFER | DELETE | `/api/OperatingContractOffer/{id}` | X-Branch-Id header required | /contracts/operation/rent-prices-offers | Branch | RentPriceOfferDeleteButton |

---

## Module 13: Worker Delivery Record (Signed Handover Receipt)

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| WORKER_DELIVERY_RECORD | POST | `/api/WorkerDeliveryRecord` | X-Branch-Id header required | /contracts/operation/rent or /contracts/mediationcontract | Branch, Worker | DeliveryReceiptCreateModal |
| WORKER_DELIVERY_RECORD | GET | `/api/WorkerDeliveryRecord/{id}` | X-Branch-Id header required | /contracts/operation/rent or /contracts/mediationcontract | Branch | DeliveryReceiptDetailPage |
| WORKER_DELIVERY_RECORD | PUT | `/api/WorkerDeliveryRecord/{id}` | X-Branch-Id header required | /contracts/operation/rent or /contracts/mediationcontract | Branch | DeliveryReceiptEditModal |
| WORKER_DELIVERY_RECORD | GET | `/api/WorkerDeliveryRecord/{id}/print` | X-Branch-Id header required | /contracts/operation/rent or /contracts/mediationcontract | Branch | DeliveryReceiptPrintButton |

---

## Module 14: Complaints

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| COMPLAINT | GET | `/api/Complaint` | public (unverified) | /complaints | Branch, Customer, Worker | ComplaintListPage |
| COMPLAINT | GET | `/api/Complaint/{id}` | public (unverified) | /complaints | Branch | ComplaintDetailPage (/complaints/[id]) |
| COMPLAINT | POST | `/api/Complaint` | X-Branch-Id header required | /complaints | Branch, Customer, Worker | ComplaintCreateModal |
| COMPLAINT | DELETE | `/api/Complaint/{id}` | X-Branch-Id header required | /complaints | Branch | ComplaintDeleteButton |
| COMPLAINT | POST | `/api/Complaint/{id}/finish` | X-Branch-Id header required | /complaints | Branch | ComplaintFinishButton |
| COMPLAINT | POST | `/api/Complaint/{id}/toggle-hold` | X-Branch-Id header required | /complaints | Branch | ComplaintHoldButton (query param: reason) |
| COMPLAINT | POST | `/api/Complaint/issue` | X-Branch-Id header required (multipart/form-data) | /complaints | Branch | ComplaintIssueUploadForm |
| COMPLAINT | GET | `/api/Complaint/{id}/issue` | public (unverified) | /complaints | Branch | ComplaintIssueViewer |
| COMPLAINT | POST | `/api/Complaint/update` | X-Branch-Id header required | /complaints | Branch | ComplaintAddUpdateModal |

---

## Module 15: Transfer Contracts (Sponsorship Transfer)

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| TRANSFER_CONTRACT | GET | `/api/TransferContract` | public (unverified) | /sponsorship-transfer | Branch, Worker, Customer | TransferContractListPage |
| TRANSFER_CONTRACT | GET | `/api/TransferContract/{id}` | public (unverified) | /sponsorship-transfer | Branch | TransferContractDetailPage (/sponsorship-transfer/[id]) |
| TRANSFER_CONTRACT | POST | `/api/TransferContract` | X-Branch-Id header required | /sponsorship-transfer | Branch, Worker, Customer | TransferContractCreateModal |
| TRANSFER_CONTRACT | GET | `/api/TransferContract/export` | X-Branch-Id header required | /sponsorship-transfer | Branch | TransferContractExportButton (query-based) |
| TRANSFER_CONTRACT | DELETE | `/api/TransferContract/{id}` | X-Branch-Id header required | /sponsorship-transfer | Branch | TransferContractDeleteButton |
| TRANSFER_CONTRACT | POST | `/api/TransferContract/{id}/sign` | X-Branch-Id header required | /sponsorship-transfer | Branch | TransferContractSignButton |
| TRANSFER_CONTRACT | POST | `/api/TransferContract/{id}/complete` | X-Branch-Id header required | /sponsorship-transfer | Branch | TransferContractCompleteButton |
| TRANSFER_CONTRACT | GET | `/api/TransferContract/{id}/authority-status` | public (unverified) | /sponsorship-transfer | Branch | TransferContractAuthorityStatusChecker |

---

## Module 16: Medical Examination

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| MEDICAL_EXAMINATION | GET | `/api/V1/MedicalExamination` | public (unverified) | none (implied /applicants) | Branch, Worker | MedicalExaminationListPage (no dedicated page, used in dropdowns) |
| MEDICAL_EXAMINATION | GET | `/api/V1/MedicalExamination/{id}` | public (unverified) | none | Branch | MedicalExaminationDetailPage (no dedicated page) |
| MEDICAL_EXAMINATION | GET | `/api/V1/MedicalExamination/check-worker/{workerId}` | public (unverified) | none | Branch, Worker | WorkerMedicalExaminationChecker |
| MEDICAL_EXAMINATION | POST | `/api/V1/MedicalExamination` | X-Branch-Id header required | none | Branch, Worker | MedicalExaminationCreateModal |
| MEDICAL_EXAMINATION | PUT | `/api/V1/MedicalExamination/{id}` | X-Branch-Id header required | none | Branch | MedicalExaminationEditModal |
| MEDICAL_EXAMINATION | DELETE | `/api/V1/MedicalExamination/{id}` | X-Branch-Id header required | none | Branch | MedicalExaminationDeleteButton |
| MEDICAL_EXAMINATION | GET | `/api/V1/MedicalExamination/report/{id}` | public (unverified) | none | Branch | MedicalExaminationReportViewer |

---

## Module 17: Marketer

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| MARKETER | GET | `/api/V1/Marketer` | public (unverified) | /settings/marketer | Branch | MarketerListPage |
| MARKETER | GET | `/api/V1/Marketer/{id}` | public (unverified) | /settings/marketer | Branch | MarketerDetailPage (no dedicated page) |
| MARKETER | POST | `/api/V1/Marketer` | X-Branch-Id header required | /settings/marketer | Branch | MarketerCreateModal |
| MARKETER | PUT | `/api/V1/Marketer/{id}` | X-Branch-Id header required | /settings/marketer | Branch | MarketerEditModal |
| MARKETER | DELETE | `/api/V1/Marketer/{id}` | X-Branch-Id header required | /settings/marketer | Branch | MarketerDeleteButton |

---

## Module 18: Mediation Follow-Up

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| MEDIATION_FOLLOWUP | GET | `/api/Mediation/MediationFollowUp/dashboard` | public (unverified) | /contracts/mediationcontract/automaticfollowup | Branch | AutomaticFollowupDashboard |
| MEDIATION_FOLLOWUP | GET | `/api/Mediation/MediationFollowUp/items/{contractId}` | public (unverified) | /contracts/mediationcontract/automaticfollowup | Branch | FollowupItemsList |
| MEDIATION_FOLLOWUP | GET | `/api/Mediation/MediationFollowUp/item/{itemId}` | public (unverified) | /contracts/mediationcontract/automaticfollowup | Branch | FollowupItemDetail |
| MEDIATION_FOLLOWUP | POST | `/api/Mediation/MediationFollowUp/update-description` | X-Branch-Id header required | /contracts/mediationcontract/automaticfollowup | Branch | FollowupItemUpdateModal |

---

## Module 19: Contract Follow-Up (Follow-Up Status & Item Completion)

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| FOLLOWUP_STATUS | GET | `/api/FollowUp/FollowUpStatus/GetAll` | public (unverified) | /settings/mediation | Branch | FollowupStatusSelector |
| FOLLOWUP_STATUS | GET | `/api/FollowUp/FollowUpStatus/GetById/{id}` | public (unverified) | /settings/mediation | Branch | FollowupStatusDetailPage (no dedicated page) |
| FOLLOWUP_STATUS | POST | `/api/FollowUp/FollowUpStatus/Create` | X-Branch-Id header required | /settings/mediation | Branch | FollowupStatusCreateModal |
| FOLLOWUP_STATUS | PUT | `/api/FollowUp/FollowUpStatus/Update` | X-Branch-Id header required | /settings/mediation | Branch | FollowupStatusUpdateModal |
| FOLLOWUP_STATUS | DELETE | `/api/FollowUp/FollowUpStatus/Delete/{id}` | X-Branch-Id header required | /settings/mediation | Branch | FollowupStatusDeleteButton |
| CONTRACT_FOLLOWUP | GET | `/api/FollowUp/ContractFollowUp/CanComplete/{itemId}` | public (unverified) | /contracts/mediationcontract/automaticfollowup | Branch | FollowupItemCompletionChecker |
| CONTRACT_FOLLOWUP | POST | `/api/FollowUp/ContractFollowUp/CompleteItem` | X-Branch-Id header required | /contracts/mediationcontract/automaticfollowup | Branch | FollowupItemCompleteButton |

---

## Module 20: Contract Nationality & Nationality Follow-Up Config

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| CONTRACT_NATIONALITY | GET | `/api/FollowUp/ContractNationality/GetAll` | public (unverified) | /settings/mediation | Branch | ContractNationalitySelector |
| CONTRACT_NATIONALITY | POST | `/api/FollowUp/ContractNationality/Create` | X-Branch-Id header required | /settings/mediation | Branch, Nationality | ContractNationalityCreateModal |
| CONTRACT_NATIONALITY | PUT | `/api/FollowUp/ContractNationality/Update` | X-Branch-Id header required | /settings/mediation | Branch | ContractNationalityUpdateModal |
| CONTRACT_NATIONALITY | DELETE | `/api/FollowUp/ContractNationality/Delete/{id}` | X-Branch-Id header required | /settings/mediation | Branch | ContractNationalityDeleteButton |
| NATIONALITY_FOLLOWUP_CONFIG | GET | `/api/FollowUp/NationalityFollowUpConfig/GetByNationality/{contractNationalityId}` | public (unverified) | /settings/mediation | Branch | NationalityFollowupConfigGrid |
| NATIONALITY_FOLLOWUP_CONFIG | POST | `/api/FollowUp/NationalityFollowUpConfig/ToggleActive/{id}` | X-Branch-Id header required | /settings/mediation | Branch | NationalityFollowupConfigToggle |
| NATIONALITY_FOLLOWUP_CONFIG | PUT | `/api/FollowUp/NationalityFollowUpConfig/Update` | X-Branch-Id header required | /settings/mediation | Branch | NationalityFollowupConfigUpdateRow |
| NATIONALITY_FOLLOWUP_CONFIG | PUT | `/api/FollowUp/NationalityFollowUpConfig/BulkUpdate` | X-Branch-Id header required | /settings/mediation | Branch | NationalityFollowupConfigBulkSave |

---

## Module 21: Contract Creation Requirements (Follow-Up Requirements)

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| CONTRACT_CREATION_REQUIREMENT | GET | `/api/FollowUp/ContractCreationRequirement/GetByNationalityAndJob` | public (unverified) | /settings/mediation | Branch, Nationality, Job | FollowupRequirementSelector (query-based) |
| CONTRACT_CREATION_REQUIREMENT | GET | `/api/FollowUp/ContractCreationRequirement/GetById/{id}` | public (unverified) | /settings/mediation | Branch | FollowupRequirementDetailPage (no dedicated page) |
| CONTRACT_CREATION_REQUIREMENT | POST | `/api/FollowUp/ContractCreationRequirement/Create` | X-Branch-Id header required | /settings/mediation | Branch, Nationality, Job | FollowupRequirementCreateModal |
| CONTRACT_CREATION_REQUIREMENT | PUT | `/api/FollowUp/ContractCreationRequirement/Update` | X-Branch-Id header required | /settings/mediation | Branch | FollowupRequirementUpdateModal |
| CONTRACT_CREATION_REQUIREMENT | DELETE | `/api/FollowUp/ContractCreationRequirement/Delete/{id}` | X-Branch-Id header required | /settings/mediation | Branch | FollowupRequirementDeleteButton |

---

## Module 22: Accounting — General Voucher (Unified Voucher Module)

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| GENERAL_VOUCHER | GET | `/api/Accounting/GeneralVoucher` | public (unverified) | /accounting/general-vouchers | Branch, Account, Agent, Customer | GeneralVoucherListPage |
| GENERAL_VOUCHER | GET | `/api/Accounting/GeneralVoucher/{id}` | public (unverified) | /accounting/general-vouchers | Branch | GeneralVoucherDetailPage (/accounting/general-vouchers/[id]) |
| GENERAL_VOUCHER | GET | `/api/Accounting/GeneralVoucher/{id}/trace` | public (unverified) | /accounting/general-vouchers | Branch | GeneralVoucherTracePanel |
| GENERAL_VOUCHER | GET | `/api/Accounting/GeneralVoucher/{id}/print` | public (unverified) | /accounting/general-vouchers | Branch | GeneralVoucherPrintButton |
| GENERAL_VOUCHER | GET | `/api/Accounting/GeneralVoucher/types` | public (unverified) | /accounting/general-vouchers | Branch | VoucherTypeSelector (lookup) |
| GENERAL_VOUCHER | GET | `/api/Accounting/GeneralVoucher/payment-methods` | public (unverified) | /accounting/general-vouchers | Branch | PaymentMethodSelector (lookup) |
| GENERAL_VOUCHER | GET | `/api/Accounting/GeneralVoucher/export` | X-Branch-Id header required | /accounting/general-vouchers | Branch | GeneralVoucherExportButton (query-based) |
| GENERAL_VOUCHER | POST | `/api/Accounting/GeneralVoucher` | X-Branch-Id header required | /accounting/general-vouchers | Branch, Account, Agent, Customer | GeneralVoucherCreateModal |
| GENERAL_VOUCHER | PUT | `/api/Accounting/GeneralVoucher/{id}` | X-Branch-Id header required | /accounting/general-vouchers | Branch | GeneralVoucherEditModal |
| GENERAL_VOUCHER | DELETE | `/api/Accounting/GeneralVoucher/{id}` | X-Branch-Id header required | /accounting/general-vouchers | Branch | GeneralVoucherDeleteButton |
| GENERAL_VOUCHER | POST | `/api/Accounting/GeneralVoucher/{id}/attachment` | X-Branch-Id header required (multipart/form-data) | /accounting/general-vouchers | Branch | VoucherAttachmentUpload |
| GENERAL_VOUCHER | POST | `/api/Accounting/GeneralVoucher/validate-balance` | X-Branch-Id header required | /accounting/general-vouchers | Branch | BalanceValidationChecker |

---

## Module 23: Accounting — Receipt Voucher (Legacy Document Type)

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| RECEIPT_VOUCHER | GET | `/api/Accounting/ReceiptVoucher` | public (unverified) | /accounting/receipt-vouchers | Branch, Agent, Customer | ReceiptVoucherListPage |
| RECEIPT_VOUCHER | GET | `/api/Accounting/ReceiptVoucher/{id}` | public (unverified) | /accounting/receipt-vouchers | Branch | ReceiptVoucherDetailPage (/accounting/receipt-vouchers/[id]) |
| RECEIPT_VOUCHER | GET | `/api/Accounting/ReceiptVoucher/{id}/trace` | public (unverified) | /accounting/receipt-vouchers | Branch | ReceiptVoucherTracePanel |
| RECEIPT_VOUCHER | POST | `/api/Accounting/ReceiptVoucher` | X-Branch-Id header required | /accounting/receipt-vouchers | Branch, Agent, Customer | ReceiptVoucherCreateModal |

---

## Module 24: Accounting — Payment Voucher (Legacy Document Type)

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| PAYMENT_VOUCHER | GET | `/api/Accounting/PaymentVoucher` | public (unverified) | /accounting/payment-vouchers | Branch, Agent, Customer | PaymentVoucherListPage |
| PAYMENT_VOUCHER | GET | `/api/Accounting/PaymentVoucher/{id}` | public (unverified) | /accounting/payment-vouchers | Branch | PaymentVoucherDetailPage (/accounting/payment-vouchers/[id]) |
| PAYMENT_VOUCHER | GET | `/api/Accounting/PaymentVoucher/{id}/trace` | public (unverified) | /accounting/payment-vouchers | Branch | PaymentVoucherTracePanel |
| PAYMENT_VOUCHER | POST | `/api/Accounting/PaymentVoucher` | X-Branch-Id header required | /accounting/payment-vouchers | Branch, Agent, Customer | PaymentVoucherCreateModal |

---

## Module 25: Accounting — Credit Note (Legacy Document Type)

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| CREDIT_NOTE | GET | `/api/Accounting/CreditNote` | public (unverified) | /accounting/credit-notes | Branch, Agent, Customer | CreditNoteListPage |
| CREDIT_NOTE | GET | `/api/Accounting/CreditNote/{id}` | public (unverified) | /accounting/credit-notes | Branch | CreditNoteDetailPage (/accounting/credit-notes/[id]) |
| CREDIT_NOTE | GET | `/api/Accounting/CreditNote/{id}/trace` | public (unverified) | /accounting/credit-notes | Branch | CreditNoteTracePanel |
| CREDIT_NOTE | POST | `/api/Accounting/CreditNote` | X-Branch-Id header required | /accounting/credit-notes | Branch, Agent, Customer | CreditNoteCreateModal |

---

## Module 26: Accounting — Debit Note (Legacy Document Type)

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| DEBIT_NOTE | GET | `/api/Accounting/DebitNote` | public (unverified) | /accounting/debit-notes | Branch, Agent, Customer | DebitNoteListPage |
| DEBIT_NOTE | GET | `/api/Accounting/DebitNote/{id}` | public (unverified) | /accounting/debit-notes | Branch | DebitNoteDetailPage (/accounting/debit-notes/[id]) |
| DEBIT_NOTE | GET | `/api/Accounting/DebitNote/{id}/trace` | public (unverified) | /accounting/debit-notes | Branch | DebitNoteTracePanel |
| DEBIT_NOTE | POST | `/api/Accounting/DebitNote` | X-Branch-Id header required | /accounting/debit-notes | Branch, Agent, Customer | DebitNoteCreateModal |

---

## Module 27: Accounting — Chart of Accounts & Ledger Reports

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| ACCOUNT | GET | `/api/V1/account/full-tree-structure` | public (unverified) | /accounting/chart-of-accounts | Branch | ChartOfAccountsTreePage (hierarchical view) |
| ACCOUNT | GET | `/api/V1/account/subtree/{parentId}` | public (unverified) | /accounting/chart-of-accounts | Branch | AccountSubtreePanel (lazy-loaded children) |
| ACCOUNT | POST | `/api/V1/account/create-account` | X-Branch-Id header required | /accounting/chart-of-accounts | Branch | AccountCreateModal |
| ACCOUNT | PUT | `/api/V1/account/update-account/{accountId}` | X-Branch-Id header required | /accounting/chart-of-accounts | Branch | AccountUpdateModal (name only) |
| ACCOUNT | PUT | `/api/V1/account/reporting/{accountId}` | X-Branch-Id header required | /accounting/account-settings | Branch | AccountReportingSettingsModal |
| ACCOUNT | DELETE | `/api/V1/account/delete-account/{accountId}` | X-Branch-Id header required | /accounting/chart-of-accounts | Branch | AccountDeleteButton |
| ACCOUNT | GET | `/api/V1/account/settings` | public (unverified) | /accounting/account-settings | Branch | AccountSettingsPage (paginated list with report flags) |
| LEDGER | GET | `/api/V1/Ledger/general-ledger` | public (unverified) | /accounting/ledger/general-ledger | Branch, Account | GeneralLedgerReportPage |
| LEDGER | GET | `/api/V1/Ledger/agent-ledger` | public (unverified) | /accounting/ledger/agent-ledger | Branch, Agent | AgentLedgerReportPage |
| LEDGER | GET | `/api/V1/Ledger/customer-ledger` | public (unverified) | /accounting/ledger/customer-ledger | Branch, Customer | CustomerLedgerReportPage |
| LEDGER | GET | `/api/V1/Ledger/worker-ledger` | public (unverified) | /accounting/ledger/worker-ledger | Branch, Worker | WorkerLedgerReportPage |
| LEDGER | GET | `/api/V1/Ledger/trial-balance` | public (unverified) | /accounting/ledger/trial-balance | Branch, Account | TrialBalanceReportPage |
| LEDGER | GET | `/api/V1/Ledger/income-statement` | public (unverified) | /accounting/ledger/income-statement | Branch, Account | IncomeStatementReportPage |
| LEDGER | GET | `/api/V1/Ledger/balance-sheet` | public (unverified) | /accounting/ledger/balance-sheet | Branch, Account | BalanceSheetReportPage |
| LEDGER | GET | `/api/V1/Ledger/vat-report` | public (unverified) | /accounting/ledger/vat-report | Branch, Account | VATReportPage |

---

## Module 28: Accounting — Journal Entries & Posting

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| JOURNAL_ENTRIES | GET | `/api/V1/JournalEntries` | public (unverified) | /accounting/journal-entries | Branch, Account, RestrictionType | JournalEntryListPage |
| JOURNAL_ENTRIES | GET | `/api/V1/JournalEntries/{id}` | public (unverified) | /accounting/journal-entries | Branch | JournalEntryDetailPage (/accounting/journal-entries/[id]) |
| JOURNAL_ENTRIES | POST | `/api/V1/JournalEntries` | X-Branch-Id header required | /accounting/journal-entries | Branch, Account, RestrictionType | JournalEntryCreateModal |
| JOURNAL_ENTRIES | PUT | `/api/V1/JournalEntries/{id}` | X-Branch-Id header required | /accounting/journal-entries | Branch, Account | JournalEntryEditModal |
| JOURNAL_ENTRIES | DELETE | `/api/V1/JournalEntries/{id}` | X-Branch-Id header required | /accounting/journal-entries | Branch | JournalEntryDeleteButton |
| POSTING | POST | `/api/V1/Posting/{journalId}` | X-Branch-Id header required | /accounting/journal-entries | Branch | JournalEntryPostButton (draft→posted) |
| POSTING | POST | `/api/V1/Posting/{id}/unpost` | X-Branch-Id header required | /accounting/journal-entries | Branch | JournalEntryUnpostButton (posted→draft) |

---

## Module 29: Accounting — Restriction Types & Period Closing

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| RESTRICTION_TYPE | GET | `/api/V1/restrictiontype` | public (unverified) | /accounting/restriction-types | Branch | RestrictionTypeListPage |
| RESTRICTION_TYPE | GET | `/api/V1/restrictiontype/{id}` | public (unverified) | /accounting/restriction-types | Branch | RestrictionTypeDetailPage (no dedicated page) |
| RESTRICTION_TYPE | POST | `/api/V1/restrictiontype` | X-Branch-Id header required | /accounting/restriction-types | Branch | RestrictionTypeCreateModal (501 Not Implemented backend) |
| RESTRICTION_TYPE | PUT | `/api/V1/restrictiontype/{id}` | X-Branch-Id header required | /accounting/restriction-types | Branch | RestrictionTypeEditModal |
| RESTRICTION_TYPE | DELETE | `/api/V1/restrictiontype/{id}` | X-Branch-Id header required | /accounting/restriction-types | Branch | RestrictionTypeDeleteButton |
| PERIOD_CLOSING | GET | `/api/V1/PeriodClosing` | public (unverified) | /accounting/period-closing | Branch | PeriodClosingListPage |
| PERIOD_CLOSING | POST | `/api/V1/PeriodClosing/close` | X-Branch-Id header required | /accounting/period-closing | Branch | PeriodClosingCloseButton |
| PERIOD_CLOSING | POST | `/api/V1/PeriodClosing/open` | X-Branch-Id header required | /accounting/period-closing | Branch | PeriodClosingOpenButton |
| PERIOD_CLOSING | GET | `/api/V1/PeriodClosing/status` | public (unverified) | /accounting/period-closing | Branch | PeriodClosingStatusChecker |

---

## Module 30: Human Resources — Employees, Attendance, Leave

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| HR_EMPLOYEE | GET | `/api/V1/Employee` | public (unverified) | /hr/employees | Branch | EmployeeListPage |
| HR_EMPLOYEE | GET | `/api/V1/Employee/{id}` | public (unverified) | /hr/employees | Branch | EmployeeDetailPage (/hr/employees/[id]) |
| HR_EMPLOYEE | POST | `/api/V1/Employee` | X-Branch-Id header required | /hr/employees | Branch, Department, Job | EmployeeCreateModal |
| HR_EMPLOYEE | PUT | `/api/V1/Employee/{id}` | X-Branch-Id header required | /hr/employees | Branch | EmployeeEditModal |
| HR_EMPLOYEE | DELETE | `/api/V1/Employee/{id}` | X-Branch-Id header required | /hr/employees | Branch | EmployeeDeleteButton |
| HR_EMPLOYEE | POST | `/api/V1/Employee/{id}/reset-password` | X-Branch-Id header required | /hr/employees | Branch | EmployeeResetPasswordButton |
| HR_ATTENDANCE | POST | `/api/V1/Attendance/CheckIn` | bearer token required (self-checkin via /me endpoint) | none | Branch | AttendanceCheckInButton (geofenced) |
| HR_ATTENDANCE | POST | `/api/V1/Attendance/CheckOut` | bearer token required (self-checkout via /me endpoint) | none | Branch | AttendanceCheckOutButton (geofenced) |
| HR_ATTENDANCE | POST | `/api/V1/Attendance/Filter` | public (unverified) | /hr/attendance | Branch, Employee | AttendanceFilterForm (query-based listing) |
| HR_LEAVE | GET | `/api/V1/Leave` | public (unverified) | /hr/leave | Branch, Employee | LeaveRequestListPage |
| HR_LEAVE | POST | `/api/V1/Leave` | X-Branch-Id header required | /hr/leave | Branch, Employee, LeaveType | LeaveRequestCreateModal |
| HR_LEAVE | GET | `/api/V1/Leave/balance/{leaveTypeId}` | public (unverified) | /hr/leave | Branch, LeaveType | LeaveBalanceChecker |
| HR_LEAVE | GET | `/api/V1/Leave/employee-balances` | public (unverified) | /hr/leave | Branch, Employee | EmployeeLeaveBalancesGrid |
| HR_LEAVE | POST | `/api/V1/Leave/{requestId}/approve` | X-Branch-Id header required | /hr/leave | Branch | LeaveRequestApproveButton |
| HR_LEAVE | POST | `/api/V1/Leave/{requestId}/reject` | X-Branch-Id header required | /hr/leave | Branch | LeaveRequestRejectButton |
| HR_LEAVE | POST | `/api/V1/Leave/{requestId}/cancel` | X-Branch-Id header required | /hr/leave | Branch | LeaveRequestCancelButton |

---

## Module 31: Human Resources — Leave Types, Payroll, Permissions

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| HR_LEAVE_TYPE | GET | `/api/V1/LeaveType` | public (unverified) | /hr/leave-types | Branch | LeaveTypeListPage |
| HR_LEAVE_TYPE | GET | `/api/V1/LeaveType/{id}` | public (unverified) | /hr/leave-types | Branch | LeaveTypeDetailPage (no dedicated page) |
| HR_LEAVE_TYPE | POST | `/api/V1/LeaveType` | X-Branch-Id header required | /hr/leave-types | Branch | LeaveTypeCreateModal |
| HR_LEAVE_TYPE | PUT | `/api/V1/LeaveType/{id}` | X-Branch-Id header required | /hr/leave-types | Branch | LeaveTypeEditModal |
| HR_LEAVE_TYPE | DELETE | `/api/V1/LeaveType/{id}` | X-Branch-Id header required | /hr/leave-types | Branch | LeaveTypeDeleteButton |
| HR_PAYROLL | POST | `/api/V1/Payroll/generate` | X-Branch-Id header required | /hr/payroll | Branch, Employee | PayrollGenerateButton |
| HR_PAYROLL | GET | `/api/V1/Payroll` | public (unverified) | /hr/payroll | Branch | PayrollListPage |
| HR_PAYROLL | GET | `/api/V1/Payroll/history` | public (unverified) | /hr/payroll | Branch | PayrollHistoryPage |
| HR_PAYROLL | GET | `/api/V1/Payroll/export` | X-Branch-Id header required | /hr/payroll | Branch | PayrollExportButton (query-based) |
| HR_PAYROLL | POST | `/api/V1/Payroll/{id}/approve` | X-Branch-Id header required | /hr/payroll | Branch | PayrollApproveButton |
| HR_PAYROLL | POST | `/api/V1/Payroll/close/{id}` | X-Branch-Id header required | /hr/payroll | Branch | PayrollCloseButton (requires approval) |
| HR_PERMISSION_REQUEST | GET | `/api/V1/PermissionRequest/GetAll` | public (unverified) | /hr/permission-requests | Branch, Employee | PermissionRequestHistoryPage |
| HR_PERMISSION_REQUEST | POST | `/api/V1/PermissionRequest/Create` | X-Branch-Id header required | /hr/permission-request | Branch, Employee | PermissionRequestCreateModal |
| HR_PERMISSION_REQUEST | POST | `/api/V1/PermissionRequest/Approve/{id}` | X-Branch-Id header required | /hr/permission-requests | Branch | PermissionRequestApproveButton |
| HR_PERMISSION_REQUEST | POST | `/api/V1/PermissionRequest/Reject/{id}` | X-Branch-Id header required | /hr/permission-requests | Branch | PermissionRequestRejectButton |

---

## Module 32: Human Resources — Resignation, Custody, Admin Functions

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| HR_RESIGNATION_REQUEST | GET | `/api/V1/ResignationRequest/GetAll` | public (unverified) | /hr/resignation-requests | Branch, Employee | ResignationRequestHistoryPage |
| HR_RESIGNATION_REQUEST | POST | `/api/V1/ResignationRequest/Create` | X-Branch-Id header required | /hr/resignation-request | Branch, Employee | ResignationRequestCreateModal |
| HR_RESIGNATION_REQUEST | POST | `/api/V1/ResignationRequest/Approve/{id}` | X-Branch-Id header required | /hr/resignation-requests | Branch | ResignationRequestApproveButton |
| HR_RESIGNATION_REQUEST | POST | `/api/V1/ResignationRequest/Reject/{id}` | X-Branch-Id header required | /hr/resignation-requests | Branch | ResignationRequestRejectButton |
| HR_CUSTODY_REQUEST | GET | `/api/V1/CustodyRequest/GetAll` | public (unverified) | /hr/custody-requests | Branch, Employee | CustodyRequestHistoryPage |
| HR_CUSTODY_REQUEST | POST | `/api/V1/CustodyRequest/Create` | X-Branch-Id header required | /hr/custody-request | Branch, Employee, CustodyType | CustodyRequestCreateModal |
| HR_CUSTODY_REQUEST | POST | `/api/V1/CustodyRequest/Approve/{id}` | X-Branch-Id header required | /hr/custody-requests | Branch | CustodyRequestApproveButton |
| HR_CUSTODY_REQUEST | POST | `/api/V1/CustodyRequest/Reject/{id}` | X-Branch-Id header required | /hr/custody-requests | Branch | CustodyRequestRejectButton |
| HR_CUSTODY_REQUEST | GET | `/api/V1/CustodyRequest/Types` | public (unverified) | /settings/custody-types | Branch | CustodyTypeListPage |
| HR_CUSTODY_REQUEST | GET | `/api/V1/CustodyRequest/Types/{id}` | public (unverified) | /settings/custody-types | Branch | CustodyTypeDetailPage (no dedicated page) |
| HR_CUSTODY_REQUEST | POST | `/api/V1/CustodyRequest/Types/Create` | X-Branch-Id header required | /settings/custody-types | Branch | CustodyTypeCreateModal |
| HR_REQUESTS_INBOX | POST | `/api/V1/RequestsInbox/Filter` | public (unverified) | none (plumbing only) | Branch | HRRequestsInboxPage (no UI yet) |
| HR_REQUESTS_OUTBOX | POST | `/api/HR/RequestsOutbox/Filter` | public (unverified) | none (plumbing only) | Branch | HRRequestsOutboxPage (no UI yet) |
| HR_ADMIN | POST | `/api/V1/Admin/add-user` | X-Branch-Id header required | /hr/admin-users | Branch | AdminUserCreateModal |
| HR_ADMIN | POST | `/api/V1/Admin/assign-role` | X-Branch-Id header required | /hr/admin-users | Branch, Role | AdminUserAssignRoleButton |
| HR_ADMIN | POST | `/api/V1/Admin/remove-role` | X-Branch-Id header required | /hr/admin-users | Branch, Role | AdminUserRemoveRoleButton |
| HR_ADMIN | GET | `/api/V1/Admin/all-users` | public (unverified) | /hr/admin-users | Branch | AdminUserListPage |
| HR_ADMIN | GET | `/api/V1/Admin/all-roles` | public (unverified) | /hr/admin-users | Branch | RoleSelector (dropdowns) |
| HR_ADMIN | GET | `/api/V1/Admin/positions` | public (unverified) | /hr/positions | Branch | PositionListPage (alias: Job) |
| HR_ADMIN | POST | `/api/V1/Admin/create-position` | X-Branch-Id header required | /hr/positions | Branch | PositionCreateModal |
| HR_ADMIN | DELETE | `/api/V1/Admin/delete-position/{id}` | X-Branch-Id header required | /hr/positions | Branch | PositionDeleteButton |

---

## Module 33: Human Resources — Departments

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| DEPARTMENT | GET | `/api/V1/Lookup/Departments` | public (unverified) | none | Branch | DepartmentSelector (dropdowns) |
| DEPARTMENT | POST | `/api/V1/Department` | X-Branch-Id header required | /hr/departments | Branch | DepartmentCreateButton (query params: nameAr, nameEn) |
| DEPARTMENT | DELETE | `/api/V1/Department/{id}` | X-Branch-Id header required | /hr/departments | Branch | DepartmentDeleteButton |

---

## Module 34: Housing Management

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| HOUSING | GET | `/api/Housing/GetAll` | public (unverified) | /housing/management | Branch | HousingListPage (full list, inactive too) |
| HOUSING | GET | `/api/Housing/GetActiveList` | public (unverified) | /housing/applicants | Branch | ActiveHousingSelector (dropdowns for active housing only) |
| HOUSING | POST | `/api/Housing` | X-Branch-Id header required | /housing/management | Branch, Worker | HousingCreateModal |
| HOUSING | PUT | `/api/Housing/{id}` | X-Branch-Id header required | /housing/management | Branch | HousingEditModal |
| HOUSING | POST | `/api/Housing/ToggleActive/{id}` | X-Branch-Id header required | /housing/management | Branch | HousingToggleActiveButton |
| HOUSING | DELETE | `/api/Housing/{id}` | X-Branch-Id header required | /housing/management | Branch | HousingDeleteButton |

---

## Module 35: Worker Master & Status Log (Lifecycle Management)

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| WORKER_STATUS_LOG | POST | `/api/V1/Worker/StatusLog` | X-Branch-Id header required | /applicants | Branch, Worker | WorkerStatusLogCreateButton |
| WORKER_STATUS_LOG | DELETE | `/api/V1/Worker/{id}/StatusLog/Last` | X-Branch-Id header required | /applicants | Branch | WorkerStatusLogDeleteLastButton |
| WORKER_STATUS_LOG | POST | `/api/V1/Worker/{id}/ActivateWantsWork` | X-Branch-Id header required | /applicants | Branch | WorkerActivateWantsWorkButton |
| WORKER_STATUS_LOG | POST | `/api/V1/Worker/{id}/ActivateWantsTransfer` | X-Branch-Id header required | /applicants | Branch | WorkerActivateWantsTransferButton |
| WORKER_MASTER | POST | `/api/V1/Worker/Housed` | X-Branch-Id header required | /housing/applicants | Branch, Worker, Housing | WorkerHousedButton |
| WORKER_MASTER | POST | `/api/V1/Worker/{workerId}/Deportation` | X-Branch-Id header required | /applicants | Branch | WorkerDeportationButton |
| WORKER_MASTER | POST | `/api/V1/Worker/{workerId}/CancelDeportation` | X-Branch-Id header required | /applicants | Branch | WorkerCancelDeportationButton |
| WORKER_MASTER | POST | `/api/V1/Worker/{workerId}/Handover` | X-Branch-Id header required | /applicants | Branch | WorkerHandoverButton |
| WORKER_MASTER | POST | `/api/V1/Worker/{workerId}/IssueResidency` | X-Branch-Id header required | /applicants | Branch | WorkerIssueResidencyButton |
| WORKER_MASTER | POST | `/api/V1/Worker/{workerId}/AddUpdate` | X-Branch-Id header required | /applicants | Branch | WorkerAddUpdateButton |
| WORKER_MASTER | POST | `/api/V1/Worker/{workerId}/ExitAndReEntry` | X-Branch-Id header required | /applicants | Branch | WorkerExitAndReEntryButton |
| WORKER_MASTER | POST | `/api/V1/Worker/{workerId}/ExitHousing` | X-Branch-Id header required | /housing/applicants | Branch | WorkerExitHousingButton |

---

## Module 36: Hourly Workers — Core (Workers Pool, Requests, Orders, Drivers)

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| HOURLY_WORKERS | GET | `/api/V1/HourlyWorkers` | public (unverified) | /hourly-workers | Branch | HourlyWorkerListPage |
| HOURLY_WORKERS | GET | `/api/V1/HourlyWorkers/{id}` | public (unverified) | /hourly-workers | Branch | HourlyWorkerDetailPage (/hourly-workers/[id]) |
| HOURLY_WORKERS | POST | `/api/V1/HourlyWorkers` | X-Branch-Id header required | /hourly-workers | Branch | HourlyWorkerCreateModal |
| HOURLY_WORKERS | PUT | `/api/V1/HourlyWorkers/{id}` | X-Branch-Id header required | /hourly-workers | Branch | HourlyWorkerEditModal |
| HOURLY_WORKERS | DELETE | `/api/V1/HourlyWorkers/{id}` | X-Branch-Id header required | /hourly-workers | Branch | HourlyWorkerDeleteButton |
| HOURLY_WORKERS | POST | `/api/V1/HourlyWorkers/{id}/Activate` | X-Branch-Id header required (empty body) | /hourly-workers | Branch | HourlyWorkerActivateButton |
| HOURLY_WORKERS | POST | `/api/V1/HourlyWorkers/{id}/Deactivate` | X-Branch-Id header required (empty body) | /hourly-workers | Branch | HourlyWorkerDeactivateButton |
| HOURLY_WORKERS | GET | `/api/V1/HourlyWorkers/Available` | public (unverified) | none (stub) | Branch | HourlyWorkerAvailableSelector (no UI) |

---

## Module 37: Hourly Workers — Requests (Service Requests Workflow)

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| HOURLY_WORKER_REQUESTS | GET | `/api/V1/HourlyWorkerRequests` | public (unverified) | /hourly-workers/requests | Branch | HourlyWorkerRequestListPage |
| HOURLY_WORKER_REQUESTS | GET | `/api/V1/HourlyWorkerRequests/{id}` | public (unverified) | /hourly-workers/requests | Branch | HourlyWorkerRequestDetailPage (/hourly-workers/requests/[id]) |
| HOURLY_WORKER_REQUESTS | GET | `/api/V1/HourlyWorkerRequests/{id}/Detail` | public (unverified) | /hourly-workers/requests | Branch | HourlyWorkerRequestDetailPanel |
| HOURLY_WORKER_REQUESTS | GET | `/api/V1/HourlyWorkerRequests/{id}/Timeline` | public (unverified) | /hourly-workers/requests | Branch | HourlyWorkerRequestTimelinePanel |
| HOURLY_WORKER_REQUESTS | GET | `/api/V1/HourlyWorkerRequests/{id}/Logs` | public (unverified) | /hourly-workers/requests | Branch | HourlyWorkerRequestLogsPanel |
| HOURLY_WORKER_REQUESTS | GET | `/api/V1/HourlyWorkerRequests/{id}/Payments` | public (unverified) | /hourly-workers/requests | Branch | HourlyWorkerRequestPaymentsPanel |
| HOURLY_WORKER_REQUESTS | GET | `/api/V1/HourlyWorkerRequests/{id}/Assignments` | public (unverified) | /hourly-workers/requests | Branch | HourlyWorkerRequestAssignmentsPanel |
| HOURLY_WORKER_REQUESTS | PUT | `/api/V1/HourlyWorkerRequests/{id}/Assignments/{assignmentId}/Status` | X-Branch-Id header required | /hourly-workers/requests | Branch | HourlyWorkerAssignmentStatusButton |
| HOURLY_WORKER_REQUESTS | DELETE | `/api/V1/HourlyWorkerRequests/{id}/Assignments/{assignmentId}` | X-Branch-Id header required | /hourly-workers/requests | Branch | HourlyWorkerAssignmentDeleteButton |
| HOURLY_WORKER_REQUESTS | POST | `/api/V1/HourlyWorkerRequests/{id}/InternalNotes` | X-Branch-Id header required | /hourly-workers/requests | Branch | HourlyWorkerRequestAddNoteButton |
| HOURLY_WORKER_REQUESTS | GET | `/api/V1/HourlyWorkerRequests/Track/{ticketNumber}` | public (unverified) | none | Branch | HourlyWorkerRequestTrackingPage (public tracking) |
| HOURLY_WORKER_REQUESTS | POST | `/api/V1/HourlyWorkerRequests/{id}/Approve` | X-Branch-Id header required (empty body) | /hourly-workers/requests | Branch | HourlyWorkerRequestApproveButton |
| HOURLY_WORKER_REQUESTS | POST | `/api/V1/HourlyWorkerRequests/{id}/Reject` | X-Branch-Id header required | /hourly-workers/requests | Branch | HourlyWorkerRequestRejectButton |
| HOURLY_WORKER_REQUESTS | POST | `/api/V1/HourlyWorkerRequests/{id}/Assign` | X-Branch-Id header required | /hourly-workers/requests | Branch, HourlyWorker | HourlyWorkerRequestAssignButton |
| HOURLY_WORKER_REQUESTS | POST | `/api/V1/HourlyWorkerRequests/{id}/InProgress` | X-Branch-Id header required (empty body) | /hourly-workers/requests | Branch | HourlyWorkerRequestInProgressButton |
| HOURLY_WORKER_REQUESTS | POST | `/api/V1/HourlyWorkerRequests/{id}/Complete` | X-Branch-Id header required (empty body) | /hourly-workers/requests | Branch | HourlyWorkerRequestCompleteButton |
| HOURLY_WORKER_REQUESTS | POST | `/api/V1/HourlyWorkerRequests/{id}/Cancel` | X-Branch-Id header required (empty body) | /hourly-workers/requests | Branch | HourlyWorkerRequestCancelButton |

---

## Module 38: Hourly Workers — Orders, Drivers, Catalog, Payments, Notifications

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| HOURLY_WORKER_ORDERS | GET | `/api/V1/HourlyWorkerOrders/{orderId}/RecommendedWorkers` | public (unverified) | /hourly-workers (inferred) | Branch | HourlyWorkerRecommendationPanel |
| HOURLY_WORKER_ORDERS | POST | `/api/V1/HourlyWorkerOrders/{orderId}/AssignDriver` | X-Branch-Id header required | /hourly-workers (inferred) | Branch, HourlyDriver | HourlyDriverAssignButton |
| HOURLY_WORKER_ORDERS | GET | `/api/V1/HourlyWorkerOrders/{orderId}/Tracking` | public (unverified) | /hourly-workers (inferred) | Branch | OrderTrackingPanel |
| HOURLY_WORKER_ORDERS | POST | `/api/V1/HourlyWorkerOrders/{orderId}/Tracking` | X-Branch-Id header required | /hourly-workers (inferred) | Branch | OrderTrackingUpdateButton |
| HOURLY_WORKER_ORDERS | GET | `/api/V1/HourlyWorkerOrders/{orderId}/Invoices` | public (unverified) | /hourly-workers (inferred) | Branch | OrderInvoicesPanel |
| HOURLY_WORKER_ORDERS | POST | `/api/V1/HourlyWorkerOrders/{orderId}/Invoices` | X-Branch-Id header required | /hourly-workers (inferred) | Branch | OrderInvoiceCreateButton |
| HOURLY_WORKER_ORDERS | GET | `/api/V1/HourlyWorkerOrders/{orderId}/Accommodation` | public (unverified) | /hourly-workers (inferred) | Branch | OrderAccommodationPanel |
| HOURLY_WORKER_ORDERS | POST | `/api/V1/HourlyWorkerOrders/{orderId}/Accommodation` | X-Branch-Id header required | /hourly-workers (inferred) | Branch | OrderAccommodationCreateButton |
| HOURLY_WORKER_ORDERS | PUT | `/api/V1/HourlyWorkerOrders/{orderId}/Accommodation/{accommodationId}/Status` | X-Branch-Id header required | /hourly-workers (inferred) | Branch | OrderAccommodationStatusButton |
| HOURLY_DRIVERS | GET | `/api/V1/HourlyDrivers` | public (unverified) | /hourly-workers/drivers | Branch | HourlyDriverListPage |
| HOURLY_DRIVERS | GET | `/api/V1/HourlyDrivers/{id}` | public (unverified) | /hourly-workers/drivers | Branch | HourlyDriverDetailPage (/hourly-workers/drivers/[id]) |
| HOURLY_DRIVERS | POST | `/api/V1/HourlyDrivers` | X-Branch-Id header required | /hourly-workers/drivers | Branch | HourlyDriverCreateModal |
| HOURLY_DRIVERS | PUT | `/api/V1/HourlyDrivers/{id}` | X-Branch-Id header required | /hourly-workers/drivers | Branch | HourlyDriverEditModal |
| HOURLY_DRIVERS | DELETE | `/api/V1/HourlyDrivers/{id}` | X-Branch-Id header required | /hourly-workers/drivers | Branch | HourlyDriverDeleteButton |
| HOURLY_DRIVERS | POST | `/api/V1/HourlyDrivers/{id}/Activate` | X-Branch-Id header required | /hourly-workers/drivers | Branch | HourlyDriverActivateButton |
| HOURLY_DRIVERS | POST | `/api/V1/HourlyDrivers/{id}/Deactivate` | X-Branch-Id header required | /hourly-workers/drivers | Branch | HourlyDriverDeactivateButton |
| HOURLY_DRIVERS | GET | `/api/V1/HourlyDrivers/{driverId}/Orders` | public (unverified) | /hourly-workers/drivers | Branch | DriverOrdersPanel |
| HOURLY_DRIVERS | POST | `/api/V1/HourlyDrivers/{driverId}/Orders/{orderId}/TransportStatus` | X-Branch-Id header required | /hourly-workers/drivers | Branch | DriverOrderTransportStatusButton |
| HOURLY_CATALOG | GET | `/api/V1/HourlyCatalog/Packages` | public (unverified) | none (customer-facing) | Branch | PackageSelector (mobile storefront) |
| HOURLY_CATALOG | GET | `/api/V1/HourlyCatalog/ServingAreas` | public (unverified) | none (customer-facing) | Branch | ServingAreaSelector (mobile storefront) |
| HOURLY_CATALOG | GET | `/api/V1/HourlyCatalog/Admin/Packages` | public (unverified) | /hourly-workers/packages | Branch | AdminPackageListPage |
| HOURLY_CATALOG | GET | `/api/V1/HourlyCatalog/Admin/Packages/{id}` | public (unverified) | /hourly-workers/packages | Branch | AdminPackageDetailPage (no dedicated page) |
| HOURLY_CATALOG | PUT | `/api/V1/HourlyCatalog/Admin/Packages/{id}` | X-Branch-Id header required | /hourly-workers/packages | Branch | AdminPackageEditModal |
| HOURLY_CATALOG | DELETE | `/api/V1/HourlyCatalog/Admin/Packages/{id}` | X-Branch-Id header required | /hourly-workers/packages | Branch | AdminPackageDeleteButton |
| HOURLY_CATALOG | GET | `/api/V1/HourlyCatalog/Admin/ServingAreas` | public (unverified) | /hourly-workers/serving-areas | Branch | AdminServingAreaListPage |
| HOURLY_CATALOG | GET | `/api/V1/HourlyCatalog/Admin/ServingAreas/{id}` | public (unverified) | /hourly-workers/serving-areas | Branch | AdminServingAreaDetailPage (no dedicated page) |
| HOURLY_CATALOG | PUT | `/api/V1/HourlyCatalog/Admin/ServingAreas/{id}` | X-Branch-Id header required | /hourly-workers/serving-areas | Branch | AdminServingAreaEditModal |
| HOURLY_CATALOG | DELETE | `/api/V1/HourlyCatalog/Admin/ServingAreas/{id}` | X-Branch-Id header required | /hourly-workers/serving-areas | Branch | AdminServingAreaDeleteButton |
| HOURLY_ORDER_PAYMENTS | GET | `/api/V1/HourlyOrderPayments` | public (unverified) | /hourly-workers/payments | Branch | HourlyPaymentListPage |
| HOURLY_ORDER_PAYMENTS | POST | `/api/V1/HourlyOrderPayments/{id}/Refund` | X-Branch-Id header required | /hourly-workers/payments | Branch | HourlyPaymentRefundButton |
| HOURLY_ORDER_NOTIFICATIONS | GET | `/api/V1/HourlyOrderNotifications` | public (unverified) | /hourly-workers/notifications | Branch | HourlyNotificationListPage |
| HOURLY_ORDER_NOTIFICATIONS | POST | `/api/V1/HourlyOrderNotifications/{id}/Retry` | X-Branch-Id header required | /hourly-workers/notifications | Branch | HourlyNotificationRetryButton |
| HOURLY_REPORTS | GET | `/api/V1/HourlyWorkerReports/OrdersSummary` | public (unverified) | /hourly-workers/reports | Branch | OrdersSummaryReportPage |
| HOURLY_REPORTS | GET | `/api/V1/HourlyWorkerReports/Revenue` | public (unverified) | /hourly-workers/reports | Branch | RevenueReportPage |
| HOURLY_REPORTS | GET | `/api/V1/HourlyWorkerReports/WorkerUtilization` | public (unverified) | /hourly-workers/reports | Branch | WorkerUtilizationReportPage |
| HOURLY_REPORTS | GET | `/api/V1/HourlyWorkerReports/DriverPerformance` | public (unverified) | /hourly-workers/reports | Branch | DriverPerformanceReportPage |

---

## Module 39: Hourly Workers — Customer & Portal (Stubs — No UI)

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| HOURLY_CUSTOMER | GET | `/api/V1/HourlyCustomer/Orders` | bearer token required (enforced 403) | none (stub) | none | HourlyCustomerOrdersPage (no UI, mobile-only) |
| HOURLY_WORKER_PORTAL | GET | `/api/V1/HourlyWorkerPortal/{workerId}/Assignments` | public (unverified) | none (stub) | Branch | HourlyWorkerPortalAssignmentsPage (no UI) |
| HOURLY_WORKER_PORTAL | GET | `/api/V1/HourlyWorkerPortal/me/Assignments` | bearer token required (enforced 403) | none (stub) | none | HourlyWorkerPortalMyAssignmentsPage (no UI, mobile self-service) |
| HOURLY_WORKER_PORTAL | PUT | `/api/V1/HourlyWorkerPortal/{workerId}/Assignments/{assignmentId}/Status` | public (unverified) | none (stub) | Branch | HourlyWorkerPortalAssignmentStatusButton (no UI) |
| HOURLY_WORKER_PORTAL | GET | `/api/V1/HourlyWorkerPortal/{workerId}/Schedule` | public (unverified) | none (stub) | Branch | HourlyWorkerPortalSchedulePage (no UI) |

---

## Module 40: ZATCA (Saudi E-Invoicing / Fatoora)

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| ZATCA | GET | `/api/V1/Zatca/lookups` | bearer token required (enforced by controller) | /zatca | Branch | ZatcaLookupsCache (static enum resolution) |
| ZATCA | GET | `/api/V1/Zatca/dashboard/summary` | bearer token required | /zatca | Branch | ZatcaDashboardSummaryPanel |
| ZATCA | GET | `/api/V1/Zatca/health` | bearer token required | /zatca/connection | Branch | ZatcaHealthIndicator |
| ZATCA | GET | `/api/V1/Zatca/branch-context` | bearer token required | /zatca/branch-setup | Branch | ZatcaBranchContextPanel |
| ZATCA | PUT | `/api/V1/Zatca/branch-profile` | bearer token required | /zatca/branch-setup | Branch | ZatcaBranchProfileEditModal |
| ZATCA | GET | `/api/V1/Zatca/egs-units` | bearer token required | /zatca/branch-setup | Branch | ZatcaEGSUnitsPanel |
| ZATCA | POST | `/api/V1/Zatca/certificates/import` | bearer token required (multipart/form-data) | /zatca/certificates | Branch | ZatcaCertificateImportForm |
| ZATCA | POST | `/api/V1/Zatca/csr/generate` | bearer token required | /zatca/csr | Branch | ZatcaCSRGenerateButton |
| ZATCA | POST | `/api/V1/Zatca/csr/compliance-csid` | bearer token required | /zatca/csr | Branch | ZatcaComplianceCSIDRequestButton |
| ZATCA | POST | `/api/V1/Zatca/csr/production-csid` | bearer token required | /zatca/csr | Branch | ZatcaProductionCSIDRequestButton |
| ZATCA | GET | `/api/V1/Zatca/settings/global` | bearer token required | /zatca/settings | Branch | ZatcaGlobalSettingsPage |
| ZATCA | PUT | `/api/V1/Zatca/settings/global` (inferred update) | bearer token required | /zatca/settings | Branch | ZatcaGlobalSettingsEditModal |
| ZATCA | GET | `/api/V1/Zatca/settings/branch` | bearer token required | /zatca/settings | Branch | ZatcaBranchSettingsPage |
| ZATCA | PUT | `/api/V1/Zatca/settings/branch` (inferred update) | bearer token required | /zatca/settings | Branch | ZatcaBranchSettingsEditModal |
| ZATCA | GET | `/api/V1/Zatca/invoices` | bearer token required | /zatca/invoices | Branch | ZatcaInvoiceListPage |
| ZATCA | GET | `/api/V1/Zatca/invoices/{id}` | bearer token required | /zatca/invoices | Branch | ZatcaInvoiceDetailPage (/zatca/invoices/[id]) |
| ZATCA | GET | `/api/V1/Zatca/csr` | bearer token required | /zatca/csr | Branch | ZatcaCSRRequestsPanel |
| ZATCA | GET | `/api/V1/Zatca/certificates` | bearer token required | /zatca/certificates | Branch | ZatcaCertificateListPanel |
| ZATCA | GET | `/api/V1/Zatca/certificates/history` | bearer token required | /zatca/certificates | Branch | ZatcaCertificateHistoryPanel |
| ZATCA | GET | `/api/V1/Zatca/certificates/expiration` | bearer token required | /zatca/certificates | Branch | ZatcaCertificateExpirationChecker |
| ZATCA | POST | `/api/V1/Zatca/connection/test` | bearer token required | /zatca/connection | Branch | ZatcaConnectionTestButton |
| ZATCA | GET | `/api/V1/Zatca/logs/requests` | bearer token required | /zatca/logs | Branch | ZatcaRequestLogsPage |
| ZATCA | GET | `/api/V1/Zatca/logs/requests/{id}` | bearer token required | /zatca/logs | Branch | ZatcaRequestLogDetailPage (/zatca/logs/requests/[id]) |
| ZATCA | GET | `/api/V1/Zatca/logs/submissions` | bearer token required | /zatca/logs | Branch | ZatcaSubmissionLogsPage |
| ZATCA | GET | `/api/V1/Zatca/diagnostics` | bearer token required | /zatca/connection | Branch | ZatcaDiagnosticsPanel |

---

## Module 41: Document Management (Legacy, Limited Use)

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| DOCUMENT | GET | `/api/Document/GetAllDocument` | public (unverified) | none | Branch | DocumentSelector (no dedicated page) |
| DOCUMENT | GET | `/api/Document/GetDocumentById/{id}` | public (unverified) | none | Branch | DocumentDetailPage (no dedicated page) |
| DOCUMENT | POST | `/api/Document/CreateDocument` | X-Branch-Id header required | none (inferred settings) | Branch | DocumentCreateModal (no dedicated page) |
| DOCUMENT | PUT | `/api/Document/UpdateDocument/{id}` | X-Branch-Id header required | none | Branch | DocumentEditModal (no dedicated page) |
| DOCUMENT | DELETE | `/api/Document/DeleteDocument/{id}` | X-Branch-Id header required | none | Branch | DocumentDeleteButton (no dedicated page) |

---

## Module 42: Roles & Privileges (Legacy, Limited Use)

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| ROLES | GET | `/api/Roles/GetAllRoles` | public (unverified) | /hr/admin-users | Branch | RoleListPage (via HR Admin) |
| ROLES | GET | `/api/Roles/GetRoleById/{id}` | public (unverified) | /hr/admin-users | Branch | RoleDetailPage (no dedicated page) |
| ROLES | POST | `/api/Roles/Create` | X-Branch-Id header required | /hr/admin-users (inferred) | Branch | RoleCreateModal (no dedicated page) |
| ROLES | PUT | `/api/Roles/Update/{id}` | X-Branch-Id header required | /hr/admin-users (inferred) | Branch | RoleEditModal (no dedicated page) |
| ROLES | DELETE | `/api/Roles/Delete/{id}` | X-Branch-Id header required | /hr/admin-users (inferred) | Branch | RoleDeleteButton (no dedicated page) |

---

## Module 43: Users (Legacy Registration)

| Module | Method | Endpoint | Auth | Permission | Dependencies | Frontend Usage |
|--------|--------|----------|------|------------|--------------|---|
| USERS | GET | `/api/Users/GetUserById/{id}` | public (unverified) | none | Branch | UserDetailPage (no dedicated page) |
| USERS | GET | `/api/Users/GetAllUsers` | public (unverified) | none | Branch | UserListPage (no dedicated page) |
| USERS | POST | `/api/Auth/register` | public (no auth) | none | none | RegisterPage (/register, mapped to /api/Auth/register not /api/Users) |
| USERS | PUT | `/api/Users/UpdateUserById/{id}` | bearer token required | none | Branch | UserEditModal (no dedicated page) |
| USERS | DELETE | `/api/Users/DeleteUserById/{id}` | bearer token required | none | Branch | UserDeleteButton (no dedicated page) |

---

## Module Summary

| Module | Endpoint Count | Frontend Pages | Notable Dependencies |
|--------|---|---|---|
| Authentication (AUTH) | 6 | LoginPage, UserMenu, SettingsPage, CurrentUserContext | none |
| Branch Management (BRANCH) | 6 | BranchGate, BranchSelector, /branch/management | none |
| Customers (CUSTOMERS) | 7 | /customers | Branch, Job, Nationality, Worker (in contract context) |
| Agents (AGENT) | 5 | /agents, AgentSelector (ubiquitous) | Branch, Customer |
| Workers (WORKERS) | 10 | /applicants, /applicants/available, /housing/applicants, /sponsorship-transfer | Branch, Job, Nationality, Housing |
| Jobs (JOB) | 5 | JobSelector (dropdowns), Settings (implied) | Branch |
| Nationalities (NATIONALITY) | 6 | NationalitySelector (dropdowns), Settings (implied) | Branch |
| Commission (COMMISSION) | 1 | CommissionSelector (limited use) | none |
| Mediation Contracts (MEDIATION_CONTRACT) | 15 | /contracts/mediationcontract, /contracts/mediationrequests | Branch, Customer, Worker, Job, MediationOffer |
| Mediation Contract Offers (MEDIATION_CONTRACT_OFFER) | 7 | /contracts/mediationcontract/offers | Branch, Job, Nationality |
| Operating Contracts (EMPLOYMENT_OPERATING_CONTRACT) | 13 | /contracts/operation/rent | Branch, Customer, Worker |
| Operating Contract Offers (OPERATING_CONTRACT_OFFER) | 5 | /contracts/operation/rent-prices-offers | Branch, Job, Customer |
| Worker Delivery Record (WORKER_DELIVERY_RECORD) | 4 | /contracts/operation/rent, /contracts/mediationcontract | Branch, Worker |
| Complaints (COMPLAINT) | 9 | /complaints | Branch, Customer, Worker |
| Transfer Contracts (TRANSFER_CONTRACT) | 8 | /sponsorship-transfer | Branch, Worker, Customer |
| Medical Examination (MEDICAL_EXAMINATION) | 7 | /applicants, MedicalExaminationChecker | Branch, Worker |
| Marketer (MARKETER) | 5 | /settings/marketer | Branch |
| Mediation Follow-Up (MEDIATION_FOLLOWUP) | 4 | /contracts/mediationcontract/automaticfollowup | Branch, ContractFollowUp |
| Follow-Up Status & Config (FOLLOWUP_STATUS, NATIONALITY_FOLLOWUP_CONFIG) | 9 | /settings/mediation | Branch, Nationality |
| Contract Creation Requirements (CONTRACT_CREATION_REQUIREMENT) | 5 | /settings/mediation | Branch, Nationality, Job |
| General Voucher (GENERAL_VOUCHER) | 12 | /accounting/general-vouchers | Branch, Account, Agent, Customer |
| Receipt Voucher (RECEIPT_VOUCHER) | 4 | /accounting/receipt-vouchers | Branch, Agent, Customer |
| Payment Voucher (PAYMENT_VOUCHER) | 4 | /accounting/payment-vouchers | Branch, Agent, Customer |
| Credit Note (CREDIT_NOTE) | 4 | /accounting/credit-notes | Branch, Agent, Customer |
| Debit Note (DEBIT_NOTE) | 4 | /accounting/debit-notes | Branch, Agent, Customer |
| Chart of Accounts & Ledger (ACCOUNT, LEDGER) | 23 | /accounting/chart-of-accounts, /accounting/account-settings, /accounting/ledger/* | Branch, Account |
| Journal Entries & Posting (JOURNAL_ENTRIES, POSTING) | 7 | /accounting/journal-entries | Branch, Account, RestrictionType |
| Restriction Types (RESTRICTION_TYPE) | 5 | /accounting/restriction-types | Branch |
| Period Closing (PERIOD_CLOSING) | 4 | /accounting/period-closing | Branch |
| HR — Employees, Attendance, Leave (HR_EMPLOYEE, HR_ATTENDANCE, HR_LEAVE) | 22 | /hr/employees, /hr/attendance, /hr/leave, /hr/leave-types | Branch, Department, Job, LeaveType, Employee |
| HR — Payroll, Permissions, Resignation (HR_PAYROLL, HR_PERMISSION_REQUEST, HR_RESIGNATION_REQUEST) | 13 | /hr/payroll, /hr/permission-request(s), /hr/resignation-request(s) | Branch, Employee |
| HR — Custody, Admin, Departments (HR_CUSTODY_REQUEST, HR_ADMIN, DEPARTMENT) | 16 | /hr/custody-request(s), /hr/admin-users, /hr/positions, /hr/departments, /settings/custody-types | Branch, Role, Job, CustodyType |
| Housing Management (HOUSING) | 6 | /housing/management, /housing/applicants | Branch, Worker |
| Worker Master & Status Log (WORKER_MASTER, WORKER_STATUS_LOG) | 11 | /applicants, /housing/applicants | Branch, Worker, Housing |
| Hourly Workers — Core (HOURLY_WORKERS) | 8 | /hourly-workers | Branch |
| Hourly Workers — Requests (HOURLY_WORKER_REQUESTS) | 18 | /hourly-workers/requests | Branch, HourlyWorker |
| Hourly Workers — Orders, Drivers, Catalog, Payments (HOURLY_WORKER_ORDERS, HOURLY_DRIVERS, HOURLY_CATALOG, HOURLY_ORDER_PAYMENTS, HOURLY_ORDER_NOTIFICATIONS) | 33 | /hourly-workers/drivers, /hourly-workers/packages, /hourly-workers/serving-areas, /hourly-workers/payments, /hourly-workers/notifications | Branch, HourlyWorker, HourlyDriver |
| Hourly Reports (HOURLY_REPORTS) | 4 | /hourly-workers/reports | Branch |
| Hourly Customer & Portal (HOURLY_CUSTOMER, HOURLY_WORKER_PORTAL) | 5 | none (stubs) | none (mobile-only) |
| ZATCA (ZATCA) | 27 | /zatca, /zatca/invoices, /zatca/branch-setup, /zatca/csr, /zatca/certificates, /zatca/settings, /zatca/connection, /zatca/logs | Branch (auth-required module) |
| Document Management (DOCUMENT) | 5 | none (legacy, limited use) | Branch |
| Roles & Privileges (ROLES) | 5 | /hr/admin-users (via HR Admin), none (legacy) | Branch |
| Users (USERS) | 5 | /register (via AUTH.ADD_ADMIN), none (legacy) | Branch |

---

## Total Endpoint Count: **~186 endpoints** across **43 API modules/blocks**

## Verification Notes

- **Auth Status (2026-07-12):** Most GETs return 200 without bearer token; all writes require `X-Branch-Id` GUID header (not JWT). `*/me/*` and `HourlyCustomer/*` routes enforce 403. Mark auth as "unverified" in live testing.
- **Stubs (No Frontend UI):** COMMISSION, HOURLY_CUSTOMER, HOURLY_WORKER_PORTAL, DOCUMENT (legacy), ROLES (legacy), USERS (legacy), HR_REQUESTS_INBOX, HR_REQUESTS_OUTBOX — these have service + type definitions but no dedicated frontend pages; marked "no UI" in usage columns.
- **Backend Quirks:** RESTRICTION_TYPE POST returns 501 Not Implemented (flagged in-code); WORKER_DELIVERY_RECORD GET requires manual UUID tracking (no list endpoint).
- **Legacy Paths:** `/api/Users/` (GetAll, GetById), `/api/Roles/`, `/api/Document/` paths use inconsistent naming (CamelCase suffixes) vs. newer V1 RESTful style.
- **Cross-Module Dependencies:** Most modules depend on Branch; Contracts depend on Customer, Worker, Job; Accounting depends on Account, Agent, Customer; HR depends on Department, Job, Employee, LeaveType.

**Generated:** 2026-08-11 by API Module Inventory Audit (Phase 1 — Discovery)
"
