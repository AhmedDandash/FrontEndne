/**
 * Shared list-filter types for the branch-scoping / advanced-filter / export
 * feature (see `new edits2.md`). These mirror the backend `PagedFilterQueryBase`
 * and per-module query DTOs. Field names are camelCase — ASP.NET query-string
 * binding is case-insensitive, so `branchId` binds to `BranchId`, etc.
 *
 * IMPORTANT pagination quirk: most modules use `pageNumber`, but Mediation
 * contracts and HR Employees use `page`. `buildListParams` handles this.
 */

/** Base filter shared by most list + report + export endpoints. */
export interface PagedFilterQuery {
  branchId?: string;
  includeSubBranches?: boolean;
  search?: string;
  createdDateFrom?: string; // ISO date
  createdDateTo?: string;
  updatedDateFrom?: string;
  updatedDateTo?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
}

/** Standard paged envelope returned under `data`. */
export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

// ─── Branches — GET /api/V1/Branch ────────────────────────────────────────────
// Backend supports SearchName, Email, Mobile, PageNumber, PageSize only — no
// branch scoping / date-range / sort on this endpoint, so this does NOT extend
// PagedFilterQuery.
export interface BranchQuery {
  SearchName?: string;
  Id?: string;
  NameAr?: string;
  NameArMatch?: number;
  NameEn?: string;
  NameEnMatch?: number;
  AddressAr?: string;
  AddressArMatch?: number;
  AddressEn?: string;
  AddressEnMatch?: number;
  Phone?: string;
  PhoneMatch?: number;
  Mobile?: string;
  MobileMatch?: number;
  Email?: string;
  EmailMatch?: number;
  BranchLicense?: string;
  BranchLicenseMatch?: number;
  CommercialRegistrationNumber?: string;
  CommercialRegistrationNumberMatch?: number;
  CommercialRegistrationDateFrom?: string;
  CommercialRegistrationDateTo?: string;
  LaborLicenseNumber?: string;
  LaborLicenseNumberMatch?: number;
  LaborLicenseDateFrom?: string;
  LaborLicenseDateTo?: string;
  TaxNumber?: string;
  TaxNumberMatch?: number;
  Domain?: string;
  DomainMatch?: number;
  ManagerNameAr?: string;
  ManagerNameArMatch?: number;
  OrganizationTypeAr?: number;
  CityAr?: number;
  MainBranch?: number;
  ParentBranchId?: string;
  IsRootOnly?: boolean;
  BranchId?: string;
  IncludeSubBranches?: boolean;
  Search?: string;
  CreatedDateFrom?: string;
  CreatedDateTo?: string;
  UpdatedDateFrom?: string;
  UpdatedDateTo?: string;
  PageNumber?: number;
  PageSize?: number;
  SortBy?: string;
  SortDescending?: boolean;
}

export interface AgentQuery {
  AgentNameAr?: string;
  AgentNameArMatch?: number;
  AgentNameEn?: string;
  AgentNameEnMatch?: number;
  Username?: string;
  UsernameMatch?: number;
  AgentLicense?: string;
  AgentLicenseMatch?: number;
  Phone?: string;
  PhoneMatch?: number;
  Mobile?: string;
  MobileMatch?: number;
  Email?: string;
  EmailMatch?: number;
  CompanyNameAr?: string;
  CompanyNameArMatch?: number;
  CompanyNameEn?: string;
  CompanyNameEnMatch?: number;
  NationalityId?: number;
  ContractType?: number;
  SendAllEmails?: boolean;
  IsActive?: boolean;
  BranchId?: string;
  IncludeSubBranches?: boolean;
  Search?: string;
  CreatedDateFrom?: string;
  CreatedDateTo?: string;
  UpdatedDateFrom?: string;
  UpdatedDateTo?: string;
  PageNumber?: number;
  PageSize?: number;
  SortBy?: string;
  SortDescending?: boolean;
}

// ─── Workers — GET /api/V1/Worker (+ /export) ────────────────────────────────
export interface WorkerQuery extends PagedFilterQuery {
  searchName?: string;
  nationalId?: string;
  passportNo?: string;
  mobile?: string;
  nationalityId?: string;
  jobId?: string;
  workerStatus?: number;
  minAge?: number;
  maxAge?: number;
  agentId?: string;
}

// ─── Customers — GET /api/V1/Customer (+ /export) ────────────────────────────
export interface CustomerQuery extends PagedFilterQuery {
  searchName?: string;
  idNumber?: string;
  mobile?: string;
  email?: string;
  nationality?: string;
  agentId?: string;
  marketerId?: string;
  // Extra range/date filters (gap-audit addition — see simga-api.txt Customer GET).
  monthlyIncomeMin?: number;
  monthlyIncomeMax?: number;
  familyMembersMin?: number;
  familyMembersMax?: number;
  childrenCountMin?: number;
  childrenCountMax?: number;
  birthDateFrom?: string;
  birthDateTo?: string;
  identityIssueDateFrom?: string;
  identityIssueDateTo?: string;
  // Text fields with no live filter UI yet (found on a follow-up audit — the
  // first pass's "covered" check false-positived on these because the field
  // names already appear elsewhere, e.g. on the create/edit form, without
  // actually being wired as filters). Each pairs with a `*Match` mode field —
  // see TextMatchFilter / StringMatchMode in `components/filters`.
  arabicName?: string;
  arabicNameMatch?: number;
  englishName?: string;
  englishNameMatch?: number;
  username?: string;
  usernameMatch?: number;
  idNumberMatch?: number;
  nationalId?: string;
  nationalIdMatch?: number;
  identityNumber?: string;
  identityNumberMatch?: number;
  identityType?: number;
  mobileMatch?: number;
  secondaryMobileNumber?: string;
  secondaryMobileNumberMatch?: number;
  emailMatch?: number;
  nationalityMatch?: number;
  maritalStatus?: number;
  housingType?: number;
  cityAr?: string;
  cityArMatch?: number;
  cityEn?: string;
  cityEnMatch?: number;
  districtAr?: string;
  districtArMatch?: number;
  districtEn?: string;
  districtEnMatch?: number;
  addressAr?: string;
  addressArMatch?: number;
  addressEn?: string;
  addressEnMatch?: number;
  taxNumber?: string;
  taxNumberMatch?: number;
  iban?: string;
  ibanMatch?: number;
  bankName?: string;
  bankNameMatch?: number;
}

// ─── Transfer Contracts — GET /api/TransferContract (+ /export) ──────────────
export interface TransferContractQuery extends PagedFilterQuery {
  contractNumber?: number;
  customerId?: string;
  workerId?: string;
  marketerId?: string;
  contractStatus?: number;
  customerNationalId?: string;
  workerPassportNo?: string;
  customerPhone?: string;
  requestDateFrom?: string;
  requestDateTo?: string;
}

// ─── Mediation Contracts — GET /api/Mediation/MediationContract (+ /export) ──
// NOTE: mediation paginates with `page` (not `pageNumber`).
export interface FilterMediationContractQuery {
  branchId?: string;
  includeSubBranches?: boolean;
  search?: string;
  contractNumber?: number;
  customerNationalId?: string;
  workerPassportNumber?: string;
  contractId?: string;
  customerId?: string;
  workerId?: string;
  agentId?: string;
  marketerId?: string;
  statusId?: number;
  contractType?: number;
  nationalityId?: string;
  workerType?: number;
  customerPhone?: string;
  visaNumber?: string;
  dateFrom?: string;
  dateTo?: string;
  createdDateFrom?: string;
  createdDateTo?: string;
  updatedDateFrom?: string;
  updatedDateTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
}
