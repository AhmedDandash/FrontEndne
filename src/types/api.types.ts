/**
 * API Type Definitions
 * Auto-generated TypeScript types from Swagger specification
 */

// ==================== Auth Types ====================
export interface LoginDto {
  email?: string | null;
  username?: string | null;
  password?: string | null;
}

export interface RegisterDto {
  username?: string | null;
  password?: string | null;
  roles?: number[] | null;
}

export interface AddAdmin {
  email?: string | null;
  password?: string | null;
  fullName?: string | null;
}

export interface ChangePasswordRequestDTO {
  currentPassword?: string | null;
  newPassword?: string | null;
  confirmNewPassword?: string | null;
}

export interface RefreshTokenRequestDTO {
  refreshToken?: string | null;
}

export interface RevokeRefreshTokenRequestDTO {
  refreshToken?: string | null;
}

export interface AuthResponse {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  message?: string;
}

export interface MeResponse {
  id?: string | null;
  username?: string | null;
  email?: string | null;
  fullName?: string | null;
  roles?: string[] | null;
}

// ==================== Branch Types ====================
export interface Branch {
  id: number | string;
  nameAr?: string | null;
  nameEn?: string | null;
  organizationTypeAr?: number | null;
  addressAr?: string | null;
  addressEn?: string | null;
  cityAr?: number | null;
  phone?: string | null;
  mobile?: string | null;
  email?: string | null;
  branchLicense?: string | null;
  commercialRegistrationNumber?: string | null;
  commercialRegistrationDate?: string | null;
  commercialRegistrationIssuedByAr?: string | null;
  laborLicenseNumber?: string | null;
  laborLicenseDate?: string | null;
  poBox?: string | null;
  postalCode?: string | null;
  managerNameAr?: string | null;
  /** renamed from EmbassyBranch */
  philippineEmbassyBranch?: string | null;
  openingConversation?: string | null;
  whatsAppWelcomeTemplate?: string | null;
  mainBranch?: number | null;
  parentBranchId?: string | null;
  parentBranchNameAr?: string | null;
  parentBranchNameEn?: string | null;
  subBranches?: Branch[];
  taxNumber?: string | null;
  domain?: string | null;
  appUrl?: string | null;
  zaka_RegistrationNameAr?: string | null;
  zaka_Commercial_Registration_Number?: string | null;
  zaka_TaxNumber?: string | null;
  zaka_Postal_Zone?: string | null;
  zaka_City_Name?: string | null;
  zaka_DistrictAr?: string | null;
  zaka_BuildingNumber?: string | null;
  zaka_StreetAr?: string | null;
  createdAt?: string | null;
  createdDate?: string | null;
  createdBy?: string | null;
}

export interface BranchDto {
  parentBranchId?: string | null;
  nameAr?: string | null;
  nameEn?: string | null;
  organizationTypeAr?: number | null;
  addressAr?: string | null;
  addressEn?: string | null;
  cityAr?: number | null;
  phone?: string | null;
  mobile?: string | null;
  email?: string | null;
  branchLicense?: string | null;
  commercialRegistrationNumber?: string | null;
  commercialRegistrationDate?: string | null;
  commercialRegistrationIssuedByAr?: string | null;
  laborLicenseNumber?: string | null;
  laborLicenseDate?: string | null;
  poBox?: string | null;
  postalCode?: string | null;
  managerNameAr?: string | null;
  /** renamed from EmbassyBranch */
  philippineEmbassyBranch?: string | null;
  openingConversation?: string | null;
  whatsAppWelcomeTemplate?: string | null;
  mainBranch?: number | null;
  taxNumber?: string | null;
  domain?: string | null;
  appUrl?: string | null;
  zaka_RegistrationNameAr?: string | null;
  zaka_Commercial_Registration_Number?: string | null;
  zaka_TaxNumber?: string | null;
  zaka_Postal_Zone?: string | null;
  zaka_City_Name?: string | null;
  zaka_DistrictAr?: string | null;
  zaka_BuildingNumber?: string | null;
  zaka_StreetAr?: string | null;
}

// ==================== Privilege/Role Types ====================
export interface Privilege {
  id: number;
  name?: string | null;
  nameAr?: string | null;
  nameEn?: string | null;
  type?: number | null; // 0 = Employee, 1 = Agent
  typeName?: string | null;
  permissions?: string[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface UpdateRoleDto {
  name?: string | null;
  relatedTp?: number | null;
  nameEn?: string | null;
  type?: number | null;
  permissions?: string[] | null;
}

// ==================== Customer Types ====================
export interface Customer {
  id: number | string;
  arabicName?: string | null;
  englishName?: string | null;
  /** UUID string — userId removed in new API */
  nationality?: string | null;
  identityType?: number | null;
  identityNumber?: string | null;
  identityIssueDate?: string | null;
  birthDate?: string | null;
  maritalStatus?: number | null;
  housingType?: number | null;
  email?: string | null;
  fax?: string | null;
  poBox?: string | null;
  districtAr?: string | null;
  districtEn?: string | null;
  addressAr?: string | null;
  addressEn?: string | null;
  cityAr?: string | null;
  cityEn?: string | null;
  streetAr?: string | null;
  streetEn?: string | null;
  buildingNumber?: string | null;
  additionalNumber?: string | null;
  postalCode?: string | null;
  familyMembers?: number | null;
  childrenCount?: number | null;
  domesticWorkers?: number | null;
  floorsCount?: number | null;
  roomsPerFloor?: number | null;
  bathroomsCount?: number | null;
  emergencyContactNameAr?: string | null;
  emergencyContactNameEn?: string | null;
  emergencyContactMobile?: string | null;
  emergencyJobTitle?: string | null;
  emergencyCity?: string | null;
  emergencyCompany?: string | null;
  monthlyIncome?: number | null;
  accountOwnerName?: string | null;
  bankName?: string | null;
  iban?: string | null;
  bankAccountNumber?: string | null;
  taxNumber?: string | null;
  phones?: CustomerPhoneDto[] | null;
}

export interface CreateCustomerDto {
  arabicName?: string | null;
  englishName?: string | null;
  /** UUID string — userId removed in new API */
  nationality?: string | null;
  identityType?: number | null;
  identityNumber?: string | null;
  identityIssueDate?: string | null;
  birthDate?: string | null;
  maritalStatus?: number | null;
  housingType?: number | null;
  email?: string | null;
  districtAr?: string | null;
  districtEn?: string | null;
  addressAr?: string | null;
  addressEn?: string | null;
  cityAr?: string | null;
  cityEn?: string | null;
  familyMembers?: number | null;
  childrenCount?: number | null;
  domesticWorkers?: number | null;
  monthlyIncome?: number | null;
  phones?: CustomerPhoneDto[] | null;
}

export interface UpdateCustomerDto {
  arabicName?: string | null;
  englishName?: string | null;
  nationality?: string | null;
  identityType?: number | null;
  identityNumber?: string | null;
  identityIssueDate?: string | null;
  birthDate?: string | null;
  maritalStatus?: number | null;
  housingType?: number | null;
  email?: string | null;
  districtAr?: string | null;
  districtEn?: string | null;
  addressAr?: string | null;
  addressEn?: string | null;
  cityAr?: string | null;
  cityEn?: string | null;
  familyMembers?: number | null;
  childrenCount?: number | null;
  domesticWorkers?: number | null;
  monthlyIncome?: number | null;
  phones?: CustomerPhoneDto[] | null;
}

export interface CustomerPhoneDto {
  phoneNumber?: string | null;
  /** PhoneType enum — integer 1-7 */
  type?: number | null;
  isPrimary?: boolean;
}

// ==================== Document Types ====================
export interface Document {
  id: number;
  documentNameAr?: string | null;
  documentNameEn?: string | null;
  documentTypeId?: number | null;
  dateType?: number | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  reminderPeriodMonths?: number | null;
  fileNameAr?: string | null;
  fileNameEn?: string | null;
  filePath?: string | null;
}

export interface DocumentDto {
  documentNameAr?: string | null;
  documentNameEn?: string | null;
  documentTypeId?: number | null;
  dateType?: number | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  reminderPeriodMonths?: number | null;
  fileNameAr?: string | null;
  fileNameEn?: string | null;
  filePath?: string | null;
}

// ==================== Role Types ====================
export interface Role {
  id: number;
  name?: string | null;
  relatedTo?: number | null;
}

export interface CreateRoleDto {
  name?: string | null;
  relatedTo?: number | null;
}

export interface UpdateRoleDto {
  name?: string | null;
  relatedTo?: number | null;
}

// ==================== User Types ====================
export interface User {
  id: number;
  fullName?: string | null;
  username?: string | null;
  isActive?: boolean;
  roles?: string[] | null;
}

export interface UpdateUserDto {
  username?: string | null;
  isActive: boolean;
  roleIds?: number[] | null;
}

// ==================== Common Response Types ====================
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  success?: boolean;
  errors?: string[];
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

// ==================== Worker/Applicant Types ====================
export interface WorkerActionDto {
  id: number | string;
  date: string;
}

export interface MedicalExaminationDto {
  /** UUID string in new API */
  workerId: string;
  examDate?: string | null;
  medicalStatus: number;
  notes?: string | null;
}

export interface MedicalExamination extends MedicalExaminationDto {
  id: number | string;
  createdAt: string;
}

export interface WorkerDto {
  referenceNo?: string | null;
  fullNameAr?: string | null;
  fullNameEn?: string | null;
  /** renamed from workerSatus (typo fix) */
  workerStatus?: number | null;
  religion?: number | null;
  /** UUID string in new API */
  jobId?: string | null;
  gender?: number | null; // 0 = Male, 1 = Female
  /** UUID string in new API */
  nationalityId?: string | null;
  basicSalary?: number | null;
  /** UUID string in new API */
  agentId?: string | null;
  responsibleUserId?: string | null;
  boxNumber?: string | null;
  borderNumber?: string | null;
  birthDate?: string | null;
  age?: number | null;
  addressAr?: string | null;
  addressEn?: string | null;
  maritalStatus?: number | null; // 0 = Single, 1 = Married
  childrenCount?: number | null;
  weight?: number | null;
  height?: number | null;
  educationLevelAr?: string | null;
  educationLevelEn?: string | null;
  mobile?: string | null;
  phone?: string | null;
  nationalId?: string | null;
  passportNo?: string | null;
  passportIssueDate?: string | null;
  passportExpiryDate?: string | null;
  passportIssuePlaceAr?: string | null;
  passportIssuePlaceEn?: string | null;
  relativeNameAr?: string | null;
  relativeNameEn?: string | null;
  relativeMobile?: string | null;
  hasExperience?: boolean | null;
  /** Single string in new API (was string[]) */
  skills?: string | null;
  arabicLanguageLevel?: number | null;
  englishLanguageLevel?: number | null;
  workerType?: number | null;
  /** renamed from uploadimage; create/update sends File via multipart/form-data */
  uploadImage?: string | File | null;
  /** Worker intro video; create/update sends File via multipart/form-data */
  uploadVideo?: string | File | null;
  /** Additional document/image uploads for create/update */
  attachments?: (string | File)[] | null;
  isActive?: boolean | null;
}

export interface Worker extends WorkerDto {
  id: number | string;
  uploadImage?: string | null;
  uploadVideo?: string | null;
  attachments?: string[] | null;
  // Read-only fields from GET response
  agentName?: string | null;
  userName?: string | null;
  /** API returns as jobName (capital N) */
  jobName?: string | null;
  /** legacy lowercase alias — prefer jobName */
  jobname?: string | null;
  /** API returns nationality name directly */
  nationalityName?: string | null;
  workerEscape?: boolean;
  workerRefusedWork?: boolean;
  workerOut?: boolean;
  workerSick?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

// ==================== Agent Types ====================
export interface Agent {
  id: number;
  agentNameAr?: string | null;
  agentNameEn?: string | null;
  username?: string | null;
  nationalityId?: number | null;
  nationalityNameAr?: string | null;
  nationalityNameEn?: string | null;
  agentLicense?: string | null;
  contractType?: number | null;
  phone?: string | null;
  mobile?: string | null;
  email?: string | null;
  addressAr?: string | null;
  addressEn?: string | null;
  companyNameAr?: string | null;
  companyNameEn?: string | null;
  followUpEmails?: string | null;
  warrantyEmails?: string | null;
  accountingEmails?: string | null;
  sendAllEmails?: boolean;
  isActive?: boolean;
  contractsCount?: number;
  filesCount?: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreateAgentDto {
  agentNameAr?: string | null;
  agentNameEn?: string | null;
  username?: string | null;
  nationalityId?: number | null;
  agentLicense?: string | null;
  contractType?: number | null;
  phone?: string | null;
  mobile?: string | null;
  email?: string | null;
  addressAr?: string | null;
  addressEn?: string | null;
  companyNameAr?: string | null;
  companyNameEn?: string | null;
  followUpEmails?: string | null;
  warrantyEmails?: string | null;
  accountingEmails?: string | null;
  sendAllEmails?: boolean;
  isActive?: boolean;
}

export interface UpdateAgentDto {
  /** UUID — required by new PUT /api/V1/Agent/{id} body */
  id: string;
  agentNameAr?: string | null;
  agentNameEn?: string | null;
  username?: string | null;
  nationalityId?: number | null;
  agentLicense?: string | null;
  contractType?: number | null;
  phone?: string | null;
  mobile?: string | null;
  email?: string | null;
  addressAr?: string | null;
  addressEn?: string | null;
  companyNameAr?: string | null;
  companyNameEn?: string | null;
  followUpEmails?: string | null;
  warrantyEmails?: string | null;
  accountingEmails?: string | null;
  sendAllEmails?: boolean | null;
  isActive?: boolean | null;
}

// ==================== Job Types ====================
export interface Job {
  id: number;
  jobNameAr?: string | null;
  jobNameEn?: string | null;
  hasWorkCard?: boolean;
  workCardFees?: number | null;
  isActive?: boolean;
}

export interface CreateJobDto {
  jobNameAr?: string | null;
  jobNameEn?: string | null;
  hasWorkCard?: boolean;
  workCardFees?: number | null;
  isActive?: boolean;
}

export interface UpdateJobDto {
  jobNameAr?: string | null;
  jobNameEn?: string | null;
  hasWorkCard?: boolean;
  workCardFees?: number | null;
  isActive?: boolean;
}

// ==================== Nationality Types ====================
export interface Nationality {
  /** UUID string per swagger */
  id: string;
  nationalityId?: number | null;
  nationalityNameAr?: string | null;
  nationalityNameEn?: string | null;
  isActive?: boolean;
}

// ==================== Recruitment Request Types ====================
export interface RecruitmentRequest {
  id: number;
  requestCode?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  workerAge?: number | null;
  customerId?: number | null;
  workerName?: string | null;
  workerReligion?: number | null; // 1 = Muslim, 2 = Non-Muslim
  nationalityId?: number | null;
  jobName?: string | null;
  jobId?: number | null;
  requestType?: number | null; // 0 = Pending, 1 = Review, 2 = Accepted, etc.
  requestStats?: number | null;
  specialSpecifications?: string | null;
  createdAt?: string | null;
  workerId?: number | null;
}

export interface CreateRecruitmentRequestDto {
  requestCode?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerNationalId?: string | null;
  workerAge?: number | null;
  workerReligion?: number | null;
  workerNationalityId?: number | null;
  jobId?: number | null;
  specialSpecifications?: string | null;
}

export interface ChoiceCustomerDto {
  customerId: number;
  requestId: number;
}

export interface ChoiceWorkerDto {
  workerId: number;
  requestId: number;
}

export interface RequestActionDto {
  // `type` historically used; some endpoints use `requestStats` now.
  // Keep both to accept either shape from callers.
  type?: number;
  requestStats?: number;
  requestId: number;
}

// ==================== Operating Contract Offer Types ====================
// (renamed from EmploymentContractOffer — endpoint is now /api/OperatingContractOffer)
export interface OperatingContractOffer {
  id: number | string;
  offerType?: number | null;
  offerContractType?: number | null;
  offerTitle?: string | null;
  numberOfDays?: number | null;
  /** UUID string in new API */
  nationalityId?: string | null;
  nationalityName?: string | null;
  /** UUID string in new API */
  jobId?: string | null;
  jobName?: string | null;
  duration?: number | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  showForExternalCustomers?: boolean | null;
  showForReception?: boolean | null;
  isActive?: boolean | null;
  cost?: number | null;
  costTax?: number | null;
  promissoryNoteAmount?: number | null;
  insurance?: number | null;
  previousExperience?: number | null;
  dailyPriceWithoutTax?: number | null;
  workerSalary?: number | null;
  totalCostWithTax?: number | null;
  /** UUID string in new API */
  branchId?: string | null;
  branchName?: string | null;
  offersCount?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/** @deprecated Use OperatingContractOffer */
export type EmploymentContractOffer = OperatingContractOffer;

export interface CreateOperatingContractOfferDto {
  offerType?: number | null;
  offerContractType?: number | null;
  offerTitle?: string | null;
  numberOfDays?: number | null;
  /** UUID string */
  nationalityId?: string | null;
  /** UUID string */
  jobId?: string | null;
  duration?: number | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  showForExternalCustomers?: boolean | null;
  showForReception?: boolean | null;
  isActive?: boolean | null;
  cost?: number | null;
  costTax?: number | null;
  promissoryNoteAmount?: number | null;
  insurance?: number | null;
  previousExperience?: number | null;
  dailyPriceWithoutTax?: number | null;
  workerSalary?: number | null;
  totalCostWithTax?: number | null;
  /** UUID string */
  branchId?: string | null;
}

/** @deprecated Use CreateOperatingContractOfferDto */
export type CreateEmploymentContractOfferDto = CreateOperatingContractOfferDto;

export interface UpdateOperatingContractOfferDto extends CreateOperatingContractOfferDto {}

/** @deprecated Use UpdateOperatingContractOfferDto */
export type UpdateEmploymentContractOfferDto = UpdateOperatingContractOfferDto;

export interface EmploymentContractOfferSummary {
  nationalityId?: string | null;
  nationalityName?: string | null;
  jobId?: string | null;
  jobName?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  availableOffersCount?: number | null;
  offersCount?: number | null;
}

// ==================== Employment Operating Contract Types ====================
// ContractStatus enum: 1=Draft, 2=Signed, 3=Executing, 4=Finished
export const CONTRACT_STATUS_VALUES = {
  Draft: 1,
  Signed: 2,
  Executing: 3,
  Finished: 4,
} as const;

export interface EmploymentOperatingContract {
  id: number | string;
  contractNumber?: number | string | null;
  createdBy?: number | string | null;
  createdAt?: string | null;
  customerId?: number | string | null;
  customerNameAr?: string | null;
  mobile?: string | null;
  customerIdentiy?: string | null;
  marketerId?: number | string | null;
  contractCategory?: number | null;
  offerId?: number | string | null;
  offerContractType?: number | null;
  offerType?: number | null;
  operationType?: number | null;
  paymentMethod?: number | null;
  /** UUID string per swagger */
  nationalityId?: string | null;
  nationalityName?: string | null;
  /** UUID string per swagger */
  jobId?: string | null;
  jobName?: string | null;
  duration?: number | null;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
  previousExperience?: number | null;
  offerPrice?: number | null;
  workerId?: number | string | null;
  laborManagement?: number | null;
  workerNameEn?: string | null;
  workerNameAr?: string | null;
  workerPhone?: string | null;
  workersCount?: number | null;
  customerAddress?: string | null;
  cost?: number | null;
  insurance?: number | null;
  costTax?: number | null;
  totalCostWithTax?: number | null;
  // ContractStatus: 1=Draft, 2=Signed, 3=Executing, 4=Finished
  contractStatus?: number | null;
  isFinish?: boolean | null;
  finishBy?: string | null;
  finishDate?: string | null;
  noteFinish?: string | null;
}

export interface CreateEmploymentOperatingContractDto {
  customerId?: number | null;
  marketerId?: number | null;
  contractCategory?: number | null;
  offerId?: number | null;
  operationType?: number | null;
  paymentMethod?: number | null;
  /** UUID string per swagger */
  nationalityId?: string | null;
  /** UUID string per swagger */
  jobId?: string | null;
  duration?: number | null;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
  previousExperience?: number | null;
  offerPrice?: number | null;
  /** UUID string per swagger — links the contract to an existing worker record */
  workerId?: string | null;
  laborManagement?: number | null;
  workerNameEn?: string | null;
  workerNameAr?: string | null;
  workerPhone?: string | null;
  workersCount?: number | null;
  cost?: number | null;
  insurance?: number | null;
  customerAddress?: string | null;
}

export interface UpdateEmploymentOperatingContractDto {
  customerId?: number | null;
  marketerId?: number | null;
  contractCategory?: number | null;
  offerId?: number | null;
  operationType?: number | null;
  paymentMethod?: number | null;
  /** UUID string per swagger */
  nationalityId?: string | null;
  /** UUID string per swagger */
  jobId?: string | null;
  duration?: number | null;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
  previousExperience?: number | null;
  offerPrice?: number | null;
  /** UUID string per swagger — links the contract to an existing worker record */
  workerId?: string | null;
  laborManagement?: number | null;
  workerNameEn?: string | null;
  workerNameAr?: string | null;
  workerPhone?: string | null;
  workersCount?: number | null;
  cost?: number | null;
  insurance?: number | null;
  customerAddress?: string | null;
}

/** POST /api/EmploymentOperatingContract/{id}/renew */
export interface RenewContractDto {
  newEndDate: string;
}

/**
 * POST /api/EmploymentOperatingContract/{id}/terminate
 * Creates a Draft credit note (revenue reversal). When `refundAmount` > 0 the
 * credit note also credits Customer Payable; the cash is paid out separately via
 * the customer-refund endpoint.
 */
export interface TerminateContractDto {
  /** Termination reason / notes */
  note?: string | null;
  /** Amount owed back to the customer (defaults to 0) */
  refundAmount?: number | null;
}

/**
 * POST /api/EmploymentOperatingContract/{id}/customer-refund
 * Records the cash refund payment to the customer after termination.
 */
export interface CustomerRefundDto {
  /** Cash refund amount — required */
  amount: number;
  /** 1=Cash, 2=Bank, 3=Card (default 1) */
  paymentMethod?: number | null;
  /** Journal description */
  description?: string | null;
}

/**
 * GET /api/EmploymentOperatingContract/{id}/print-receipt-form
 * The endpoint returns `{ message, contract }` where `contract` is the full
 * EmploymentOperatingContract. Lookup names (customer/nationality/job) are not
 * included, so the client merges them into `display` before rendering.
 */
export interface ContractPrintReceiptData {
  message?: string | null;
  contract: EmploymentOperatingContract;
  /** Resolved display names merged client-side from the lookups */
  display?: {
    customerName?: string;
    customerPhone?: string;
    nationalityName?: string;
    jobName?: string;
  };
}

// ==================== Complaint Types ====================
// ComplaintSource enum (new API): 1=Customer, 2=Worker, 3=Agent, 4=Embassy, 5=Ministry, 6=Contract
// ComplaintPriority enum: 1=Green, 2=Yellow, 3=Red
// ComplaintStatus enum: 1=Open, 2=Hold, 3=Finished
export interface Complaint {
  id: number | string;
  complaintNumber?: string | null;
  // new field name (replaces old complaintFrom)
  source?: number | null;
  sourceName?: string | null;
  priority?: number | null;
  priorityName?: string | null;
  customerId?: number | string | null;
  workerId?: number | string | null;
  workerLocation?: number | null;
  workerLocationName?: string | null;
  // renamed from contractType / contractId
  relatedContractType?: number | null;
  relatedContractId?: number | string | null;
  notesAr?: string | null;
  notesEn?: string | null;
  createdAt?: string | null;
  createdDate?: string | null;
  createdBy?: number | string | null;
  updatedAt?: string | null;
  updatedBy?: number | string | null;
  // Read-only joined fields from API response
  customerName?: string | null;
  workerName?: string | null;
  contractNumber?: string | null;
  // Status flags from API
  isFinish?: boolean | null;
  finishNote?: string | null;
  ishold?: boolean | null;
  holdReason?: string | null;
  statusName?: string | null;
  hasIssue?: boolean | null;
  // GET /api/Complaint/{id} returns array of updates
  updates?: ComplaintUpdate[] | null;
  status?: number | null;
}

/** POST /api/Complaint — create a new complaint */
export interface CreateComplaintDto {
  // ComplaintSource: 1=Customer, 2=Worker, 3=Agent, 4=Embassy, 5=Ministry, 6=Contract
  source?: number | null;
  // ComplaintPriority: 1=Green, 2=Yellow, 3=Red
  priority?: number | null;
  customerId?: number | string | null;
  workerId?: number | string | null;
  workerLocation?: number | null;
  relatedContractType?: number | null;
  relatedContractId?: number | string | null;
  notesAr?: string | null;
  notesEn?: string | null;
}

/** POST /api/Complaint/update — add a note/update to an existing complaint */
export interface CreateComplaintUpdateDto {
  complaintId: number | string;
  noteAr?: string | null;
  noteEn?: string | null;
}

export interface ComplaintUpdate {
  id: number | string;
  complaintId?: number | string | null;
  noteAr?: string | null;
  noteEn?: string | null;
  createdAt?: string | null;
  createdByName?: string | null;
}

/** POST /api/Complaint/issue — multipart/form-data */
export interface AddIssueDto {
  complaintId: number | string;
  incomingNumber?: string | null;
  // SubmissionAuthority: 1=LaborOffice, 2=Court, 3=Police, 4=LaborCommittee
  submissionAuthority?: number | null;
  transactionDate?: string | null;
  // Binary file objects for multipart upload
  file1?: File | null;
  file2?: File | null;
}

export interface ComplaintIssue {
  id: number | string;
  complaintParentId?: number | string | null;
  incomingNumber?: string | null;
  submissionAuthority?: number | null;
  submissionAuthorityName?: string | null;
  submissionAuthorityNameAr?: string | null;
  submissionAuthorityNameEn?: string | null;
  transactionDate?: string | null;
  attachmentPath1?: string | null;
  attachmentPath2?: string | null;
  status?: number | null;
  createdAt?: string | null;
  createdBy?: number | string | null;
}

// ==================== Nationality Extended Types ====================
/** @deprecated Legacy — use Nationality from new API */
export interface NationalityExtended {
  id: number | string;
  nationalityNameAr?: string | null;
  nationalityNameEn?: string | null;
  isActive?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreateNationalityDto {
  nationalityNameAr?: string | null;
  nationalityNameEn?: string | null;
  isActive?: boolean | null;
}

export interface UpdateNationalityDto {
  /** UUID — required in new PUT body */
  id: string;
  nationalityNameAr?: string | null;
  nationalityNameEn?: string | null;
  isActive?: boolean | null;
}

// ==================== Mediation Contract Offer Types ====================
export interface MediationContractOffer {
  id: string;
  offerNumber?: number | null;
  /** ContractNationality.id (integer PK from /api/FollowUp/ContractNationality/GetAll) */
  nationalityId?: string | null;
  /** UUID string */
  jobId?: string | null;
  workerType?: number | null;
  workerTypeName?: string | null;
  previousExperience?: number | null;
  previousExperienceName?: string | null;
  salary?: number | null;
  localCost?: number | null;
  taxLocalCost?: number | null;
  agentCostSAR?: number | null;
  totalOfferCost?: number | null;
  showForExternalCustomers?: boolean | null;
  showForReception?: boolean | null;
  isActive?: boolean | null;
  // Read-only joined fields from API response
  nationalityName?: string | null;
  nationalityNameAr?: string | null;
  nationalityNameEn?: string | null;
  jobName?: string | null;
  jobNameAr?: string | null;
  createdAt?: string | null;
  createdDate?: string | null;
  updatedAt?: string | null;
}

/** POST /api/Mediation/MediationContractOffer/auto-fill */
export interface MediationOfferAutoFillDto {
  /** ContractNationality.id (integer PK from /api/FollowUp/ContractNationality/GetAll) */
  nationalityId?: string | null;
  /** UUID string */
  jobId?: string | null;
  workerType?: number | null;
  previousExperience?: number | null;
}

export interface CreateMediationContractOfferDto {
  /** ContractNationality.id (integer PK from /api/FollowUp/ContractNationality/GetAll), sent as string */
  nationalityId?: string | null;
  /** UUID string */
  jobId?: string | null;
  workerType?: number | null;
  previousExperience?: number | null;
  localCost?: number | null;
  agentCostSAR?: number | null;
  salary?: number | null;
  taxLocalCost?: number | null;
  showForExternalCustomers?: boolean;
  showForReception?: boolean;
}

export interface UpdateMediationContractOfferDto {
  /** UUID — required in request body per swagger (PUT /MediationContractOffer) */
  id: string;
  /** ContractNationality.id (integer PK from /api/FollowUp/ContractNationality/GetAll), sent as string */
  nationalityId?: string | null;
  /** UUID string */
  jobId?: string | null;
  workerType?: number | null;
  previousExperience?: number | null;
  localCost?: number | null;
  agentCostSAR?: number | null;
  salary?: number | null;
  taxLocalCost?: number | null;
  showForExternalCustomers?: boolean;
  showForReception?: boolean;
}

// ==================== Mediation Contract Types ====================
export interface MediationContract {
  id: string;
  contractNumber?: number | null;
  statusId?: number | null;
  statusName?: string | null;
  contractType?: number | null;
  contractTypeName?: string | null;
  customerId?: string | null;
  workerId?: string | null;
  workerName?: string | null;
  workerPassportNumber?: string | null;
  workerNationalityAr?: string | null;
  workerTypeName?: string | null;
  nationalityId?: number | null;
  customerNationalId?: string | null;
  musanedContractNumber?: string | null;
  musanedDocumentationNumber?: string | null;
  marketerId?: string | null;
  contractCategory?: number | null;
  offerId?: string | null;
  offerAmount?: number | null;
  visaType?: number | null;
  visaNumber?: string | null;
  visaStatusName?: string | null;
  visaDateHijri?: string | null;
  visaDate?: string | null;
  isComprehensiveQualificationVisa?: boolean | null;
  arrivalDestinationId?: number | null;
  arrivalDestinationName?: string | null;
  localCost?: number | null;
  agentCostSAR?: number | null;
  salary?: number | null;
  otherCosts?: number | null;
  totalTaxValue?: number | null;
  managerDiscount?: number | null;
  costDiscount?: number | null;
  totalCost?: number | null;
  costDescription?: string | null;
  hasContractInsurance?: boolean | null;
  domesticWorkerInsurance?: number | null;
  // Read-only / joined fields from API
  customerName?: string | null;
  customerNameAr?: string | null;
  customerPhone?: string | null;
  nationalityName?: string | null;
  nationalityNameAr?: string | null;
  jobName?: string | null;
  jobNameAr?: string | null;
  agentName?: string | null;
  branchName?: string | null;
  createdByName?: string | null;
  daysSinceCreation?: number | null;
  contractEndNote?: string | null;
  cancelBy?: number | null;
  cancelNote?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreateMediationContractDto {
  contractType?: number | null;
  customerId?: string | null;
  /** Required per swagger — worker UUID */
  workerId?: string | null;
  /** Required per swagger — used for identity verification on create */
  workerPassportNumber?: string | null;
  /** Required per swagger — offer UUID */
  offerId?: string | null;
  marketerId?: string | null;
  contractCategory?: number | null;
  visaNumber?: string | null;
  visaDate?: string | null;
  visaType?: number | null;
  visaDateHijri?: string | null;
  isComprehensiveQualificationVisa?: boolean | null;
  arrivalDestinationId?: number | null;
  otherCosts?: number | null;
  managerDiscount?: number | null;
  costDiscount?: number | null;
  costDescription?: string | null;
  hasContractInsurance?: boolean | null;
  domesticWorkerInsurance?: number | null;
  musanedContractNumber?: string | null;
  musanedDocumentationNumber?: string | null;
  attachments?: File[];
}

export interface ContractCancelDto {
  contractId: string;
  cancelBy?: number | null;
  cancelNote?: string | null;
}

// ==================== Mediation Contract Lifecycle DTOs ====================

/** POST /api/Mediation/MediationContract/sign */
export interface SignMediationContractDto {
  contractId: string;
  musanedContractNumber: string;
  /** ISO datetime string — optional per swagger */
  invoicePaymentDate?: string | null;
}

/** POST /api/Mediation/MediationContract/delivery-form */
export interface DeliveryFormDto {
  contractId: string;
  deliveryDate?: string | null;
  notes?: string | null;
}

/** POST /api/Mediation/MediationContract/delivery-form/sign — customer receives worker */
export interface DeliveryFormSignDto {
  contractId: string;
  customerSignedAt?: string | null;
}

/** POST /api/Mediation/MediationContract/warranty-return */
export interface WarrantyReturnDto {
  contractId: string;
  returnDate: string;
  /** Enum — required */
  returnReason: number;
  /** Days worker was with customer — required (> 0) */
  daysWithCustomer: number;
  newWorkerLocation?: string | null;
  notes?: string | null;
}

/** PUT /api/Mediation/MediationContract/update-status */
export interface UpdateContractStatusDto {
  contractId: string;
  newStatus: number;
  notes?: string | null;
}

/** GET /api/Mediation/MediationContract/status-history/{contractId} */
export interface ContractStatusHistory {
  id?: string | null;
  contractId?: string | null;
  oldStatus?: number | null;
  oldStatusName?: string | null;
  newStatus?: number | null;
  newStatusName?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  createdByName?: string | null;
}

export interface ContractFollowUpItem {
  id?: string | null;
  mediationContractId?: string | null;
  followUpStatusId?: string | null;
  statusNameAr?: string | null;
  statusNameEn?: string | null;
  sortOrder?: number | null;
  dependsOnStatusName?: string | null;
  fileNameAr?: string | null;
  fileNameEn?: string | null;
  whatsappName?: string | null;
  maxDays?: number | null;
  result?: number | null;
  resultName?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  canComplete?: boolean | null;
}

export interface ContractDeliveryForm {
  id?: string | null;
  contractId?: string | null;
  deliveryDate?: string | null;
  notes?: string | null;
  customerSignedAt?: string | null;
  createdAt?: string | null;
}

export interface ContractWarrantyReturn {
  id?: string | null;
  contractId?: string | null;
  returnDate?: string | null;
  returnReason?: number | null;
  returnReasonName?: string | null;
  daysWithCustomer?: number | null;
  refundAmount?: number | null;
  newWorkerLocation?: string | null;
  notes?: string | null;
  createdAt?: string | null;
}

/** GET /api/Mediation/MediationContract/{id} — full detail response */
export interface MediationContractDetail extends MediationContract {
  isCancel?: boolean | null;
  contractCategoryName?: string | null;
  followUpItems?: ContractFollowUpItem[] | null;
  deliveryForm?: ContractDeliveryForm | null;
  warrantyReturn?: ContractWarrantyReturn | null;
  statusHistories?: ContractStatusHistory[] | null;
  attachments?: string[] | null;
}

// ==================== Contract Creation Requirement ====================
export interface ContractCreationRequirement {
  id: number;
  nationalityId?: number | null;
  nationality_in_system?: number | null;
  jobNameAr?: string | null;
  jobId?: number | null;
  contractRequirements?: string | null;
  createdAt?: string | null;
  createdBy?: number | null;
  updatedAt?: string | null;
  updatedBy?: number | null;
  // Joined fields
  nationalityNameAr?: string | null;
  nationalityNameEn?: string | null;
  jobNameEn?: string | null;
}

export interface CreateContractCreationRequirementDto {
  nationalityId: number;
  jobId: number;
  contractRequirements: string;
}

export interface UpdateContractCreationRequirementDto {
  nationalityId?: number | null;
  jobId?: number | null;
  contractRequirements?: string | null;
}

export interface GetRequirementFilterDto {
  nationalityId?: string | null;
  jobId?: string | null;
}


// ==================== Nationality Follow-Up Status ====================
export interface NationalityFollowUpStatus {
  id: number;
  nationalityId?: number | null;
  followUpStatusId?: number | null;
  nameAr?: string | null;
  statusOrder?: number | null;
  dependsOnStatusId?: number | null;
  fileNameEn?: string | null;
  fileNameAr?: string | null;
  whatsAppStatusName?: string | null;
  maxDays?: number | null;
  isActive?: boolean | null;
  createdAt?: string | null;
  createdBy?: number | null;
  updatedAt?: string | null;
  updatedBy?: number | null;
  // Joined fields (kept for backward compat)
  nationalityNameAr?: string | null;
  nationalityNameEn?: string | null;
}

export interface CreateNationalityFollowUpStatusDto {
  nationalityId: number;
  followUpStatusId: number;
  statusOrder?: number;
  dependsOnStatusId?: number | null;
  fileNameEn?: string;
  fileNameAr?: string;
  whatsAppStatusName?: string;
  maxDays?: number;
}

export interface UpdateNationalityFollowUpStatusDto {
  nationalityId?: number | null;
  followUpStatusId?: number | null;
  statusOrder?: number | null;
  dependsOnStatusId?: number | null;
  fileNameEn?: string | null;
  fileNameAr?: string | null;
  whatsAppStatusName?: string | null;
  maxDays?: number | null;
}

// ==================== Follow-Up Status (Master Data) ====================
export interface FollowUpStatus {
  id: number;
  nameAr?: string | null;
  nameEn?: string | null;
  defaultSortOrder?: number | null;
}

export interface CreateFollowUpStatusDto {
  nameAr: string;
  nameEn: string;
  defaultSortOrder?: number | null;
}

export interface UpdateFollowUpStatusDto {
  id: number;
  nameAr?: string | null;
  nameEn?: string | null;
  defaultSortOrder?: number | null;
}

// ==================== Contract Nationality ====================
export interface ContractNationality {
  id: number;
  nationalityId?: string | null;
  nameAr?: string | null;
  nameEn?: string | null;
  configuredStatusCount?: number | null;
  isActive?: boolean | null;
}

export interface CreateContractNationalityDto {
  nationalityId: string;
}

export interface UpdateContractNationalityDto {
  id: number;
  isActive: boolean;
}

// ==================== Nationality Follow-Up Config ====================
export interface NationalityFollowUpConfig {
  id: number;
  contractNationalityId?: number | null;
  followUpStatusId?: number | null;
  statusNameAr?: string | null;
  statusNameEn?: string | null;
  sortOrder?: number | null;
  dependsOnStatusId?: number | null;
  fileNameAr?: string | null;
  fileNameEn?: string | null;
  whatsAppStatusName?: string | null;
  maxDays?: number | null;
  isActive?: boolean | null;
}

export interface UpdateNationalityFollowUpConfigDto {
  id: number;
  sortOrder?: number | null;
  dependsOnStatusId?: number | null;
  fileNameAr?: string | null;
  fileNameEn?: string | null;
  whatsAppStatusName?: string | null;
  maxDays?: number | null;
  isActive?: boolean | null;
}

export interface BulkUpdateNationalityFollowUpConfigDto {
  nationalityId: number;
  configs: UpdateNationalityFollowUpConfigDto[];
}

// ==================== Marketer Types ====================
export interface Marketer {
  id: number | string;
  nameAr?: string | null;
  nameEn?: string | null;
  createdAt?: string | null;
}

export interface CreateMarketerDto {
  nameAr?: string | null;
  nameEn?: string | null;
}

export interface UpdateMarketerDto {
  nameAr?: string | null;
  nameEn?: string | null;
}

// ==================== Receipt Voucher Types ====================
export interface ReceiptVoucher {
  id: number | string;
  /** Per-contract running serial (assigned by the backend) */
  voucherSerialNumber?: number | null;
  voucherNumber?: string | null;
  voucherDate?: string | null;
  amount?: number | null;
  notes?: string | null;
  /** UUID string */
  employmentOperatingContractId?: string | null;
  /** 1=Cash, 2=Bank, 3=Card */
  paymentMethod?: number | null;
  /** VAT portion of `amount` — computed by the backend (15% inclusive) */
  vatAmount?: number | null;
  bankFees?: number | null;
  journalEntryId?: number | string | null;
  createdAt?: string | null;
}

export interface CreateReceiptVoucherDto {
  voucherNumber?: string | null;
  voucherDate: string;
  amount: number;
  notes?: string | null;
  /** UUID string */
  employmentOperatingContractId: string;
  /** 1=Cash, 2=Bank, 3=Card */
  paymentMethod?: number | null;
  /** Optional — backend computes VAT from `amount` when omitted */
  vatAmount?: number | null;
  /** Bank transfer fees, when paid by bank/card */
  bankFees?: number | null;
}

export interface UpdateReceiptVoucherDto {
  voucherNumber?: string | null;
  voucherDate?: string | null;
  amount?: number | null;
  notes?: string | null;
  employmentOperatingContractId?: string | null;
}

// ==================== Mediation Follow-Up Module Types ====================

/** Query params for GET /api/Mediation/MediationFollowUp/dashboard */
export interface MediationFollowUpDashboardParams {
  ContractNumber?: number | null;
  CustomerNationalId?: string | null;
  WorkerPassportNumber?: string | null;
  ContractId?: string | null;
  MusanedContractNumber?: string | null;
  StatusId?: number | null;
  NationalityId?: string | null;
  WorkerType?: number | null;
  DateFrom?: string | null;
  DateTo?: string | null;
  Page?: number;
  PageSize?: number;
}

/**
 * Single row returned by GET /dashboard.
 * Response shape not defined in spec — fields mirror MediationContract + follow-up status.
 */
export interface MediationFollowUpDashboardRow {
  id?: string | null;
  contractId?: string | null;
  contractNumber?: number | null;
  workerName?: string | null;
  workerPassportNumber?: string | null;
  workerNationalityAr?: string | null;
  workerTypeName?: string | null;
  customerName?: string | null;
  customerNationalId?: string | null;
  customerPhone?: string | null;
  musanedContractNumber?: string | null;
  statusId?: number | null;
  statusName?: string | null;
  contractTypeName?: string | null;
  visaNumber?: string | null;
  visaDate?: string | null;
  totalCost?: number | null;
  salary?: number | null;
  offerAmount?: number | null;
  daysSinceCreation?: number | null;
  createdAt?: string | null;
  workerType?: number | null;
}

/**
 * Paginated wrapper that the dashboard endpoint may return.
 * Handled generically in the service's unwrapList — typed here for clarity.
 */
export interface MediationFollowUpDashboardResponse {
  data?: MediationFollowUpDashboardRow[];
  total?: number | null;
  page?: number | null;
  pageSize?: number | null;
  totalPages?: number | null;
}

/**
 * Single follow-up item returned by GET /items/{contractId} and GET /item/{itemId}.
 * canComplete drives the "Complete" button disabled state.
 */
export interface MediationFollowUpItem {
  id?: string | null;
  mediationContractId?: string | null;
  followUpStatusId?: string | null;
  statusNameAr?: string | null;
  statusNameEn?: string | null;
  sortOrder?: number | null;
  dependsOnStatusId?: string | null;
  dependsOnStatusName?: string | null;
  fileNameAr?: string | null;
  fileNameEn?: string | null;
  whatsAppName?: string | null;
  maxDays?: number | null;
  /** 1=Pending, 2=Completed, 3=Failed, 4=Skipped */
  result?: number | null;
  resultName?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  inputDescription?: string | null;
  /** false → predecessor not yet completed → disable the Complete button */
  canComplete?: boolean | null;
}

/** POST /api/Mediation/MediationFollowUp/update-description */
export interface UpdateFollowUpItemDescriptionDto {
  itemId: string;
  inputDescription?: string | null;
}

/** POST /api/FollowUp/ContractFollowUp/CompleteItem */
export interface CompleteFollowUpItemDto {
  contractFollowUpItemId: string;
  completedAt: string;
  notes?: string | null;
  /** 2=Completed, 3=Failed, 4=Skipped */
  result: 2 | 3 | 4;
}

/** GET /api/FollowUp/ContractFollowUp/CanComplete/{itemId} */
export interface CanCompleteResponse {
  canComplete: boolean;
}

/** GET /api/FollowUp/ContractCreationRequirement/GetByNationalityAndJob */
export interface ContractCreationRequirementDto {
  id?: string | number | null;
  nationalityId?: string | null;
  jobId?: string | null;
  requirementsText?: string | null;
  nationalityNameAr?: string | null;
  nationalityNameEn?: string | null;
  jobNameAr?: string | null;
  jobNameEn?: string | null;
  createdAt?: string | null;
}

export interface CreateContractCreationRequirementNewDto {
  nationalityId: string;
  jobId: string;
  requirementsText: string;
}

// ── New /api/FollowUp/ContractCreationRequirement/* types (UUID-based) ─────────

/** Returned by GetByNationalityAndJob and GetById */
export interface FollowUpRequirement {
  id?: string | null;
  /** ContractNationality.id (integer PK from /api/FollowUp/ContractNationality/GetAll) */
  nationalityId?: string | null;
  nationalityNameAr?: string | null;
  nationalityNameEn?: string | null;
  /** UUID */
  jobId?: string | null;
  jobName?: string | null;
  requirementsText?: string | null;
}

/** POST /api/FollowUp/ContractCreationRequirement/Create */
export interface CreateFollowUpRequirementDto {
  nationalityId: string;
  jobId: string;
  requirementsText: string;
}

/** PUT /api/FollowUp/ContractCreationRequirement/Update — id is in body */
export interface UpdateFollowUpRequirementDto {
  id: string;
  nationalityId?: string | null;
  jobId?: string | null;
  requirementsText?: string | null;
}

// ==================== Transfer Contract Types ====================
// TransferContractStatus: 1=Draft, 4=SentToAuthorities, 5=Approved, 6=Rejected, 8=TransferCompleted
// PaymentMeansCodeType: 1=Cash, 2=Check, 3=Transfer, 6=Network
export interface TransferContract {
  id: string;
  contractNumber?: number | null;
  /** UUID string */
  customerId?: string | null;
  customerName?: string | null;
  /** UUID string */
  workerId?: string | null;
  workerName?: string | null;
  workerIdNumber?: string | null;
  /** UUID string */
  marketerId?: string | null;
  marketerName?: string | null;
  transferFees?: number | null;
  governmentFees?: number | null;
  totalAmount?: number | null;
  /** Derived or returned by API — total paid so far */
  paidAmount?: number | null;
  contractStatus?: number | null;
  statusName?: string | null;
  paymentMeansCodeTypeId?: number | null;
  paymentMeansName?: string | null;
  trialPeriodDays?: number | null;
  notes?: string | null;
  requestDate?: string | null;
  approvalDate?: string | null;
  createdDate?: string | null;
  createdByName?: string | null;
}

export interface TransferContractListItem {
  id: string;
  contractNumber?: number | null;
  workerName?: string | null;
  customerName?: string | null;
  contractStatus?: number | null;
  statusName?: string | null;
  totalAmount?: number | null;
  createdDate?: string | null;
}

export interface PaginatedTransferContractsResponse {
  items: TransferContractListItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface CreateTransferContractDto {
  /** UUID string */
  customerId: string;
  /** UUID string */
  workerId: string;
  /** UUID string (optional) */
  marketerId?: string | null;
  transferFees: number;
  governmentFees: number;
  totalAmount: number;
  /** PaymentMeansCodeType: 1=Cash, 2=Check, 3=Transfer, 6=Network */
  paymentMeansCodeTypeId: number;
  trialPeriodDays: number;
  notes?: string | null;
}

// ==================== Accounting Document Types ====================
// Base route: /api/Accounting/{Controller}
// Controllers: ReceiptVoucher, PaymentVoucher, CreditNote, DebitNote
// PaymentMethodType: 1=Cash, 2=Bank, 3=Card

/** Shared filter params for all accounting document list endpoints. */
export interface AccountingDocumentFilterDto {
  customerId?: string | null;
  agentId?: string | null;
  contractId?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

// ── Receipt Voucher ──────────────────────────────────────────────────────────

export interface ReceiptVoucherDetail {
  id: string;
  voucherSerialNumber?: number | null;
  voucherNumber?: string | null;
  voucherDate?: string | null;
  amount: number;
  notes?: string | null;
  employmentOperatingContractId?: string | null;
  customerId?: string | null;
  /** 1=Cash, 2=Bank, 3=Card */
  paymentMethod?: number | null;
  vatAmount?: number | null;
  bankFees?: number | null;
  journalEntryId?: string | null;
  accountingDocumentId?: string | null;
  createdAt?: string | null;
}

export interface CreateReceiptVoucherNewDto {
  voucherNumber?: string | null;
  voucherDate: string;
  amount: number;
  notes?: string | null;
  employmentOperatingContractId: string;
  /** 1=Cash, 2=Bank, 3=Card */
  paymentMethod?: number | null;
  vatAmount?: number | null;
  bankFees?: number | null;
}

// ── Payment Voucher ──────────────────────────────────────────────────────────

export interface PaymentVoucher {
  id: string;
  voucherNumber?: string | null;
  voucherDate?: string | null;
  amount: number;
  notes?: string | null;
  /** 1=Cash, 2=Bank, 3=Card */
  paymentMethod?: number | null;
  payeeId?: string | null;
  payeeType?: string | null;
  customerId?: string | null;
  sourceContractId?: string | null;
  sourceContractType?: string | null;
  journalEntryId?: string | null;
  accountingDocumentId?: string | null;
  createdAt?: string | null;
}

export interface CreatePaymentVoucherDto {
  voucherNumber?: string | null;
  voucherDate: string;
  amount: number;
  notes?: string | null;
  /** 1=Cash, 2=Bank, 3=Card */
  paymentMethod?: number | null;
  payeeId?: string | null;
  /** e.g. "Agent" */
  payeeType?: string | null;
  customerId?: string | null;
  sourceContractId?: string | null;
  sourceContractType?: string | null;
}

// ── Credit Note ──────────────────────────────────────────────────────────────

export interface CreditNote {
  id: string;
  creditNoteNumber?: string | null;
  creditNoteDate?: string | null;
  amount: number;
  vatAmount?: number | null;
  reason?: string | null;
  notes?: string | null;
  customerId?: string | null;
  sourceContractId?: string | null;
  sourceContractType?: string | null;
  journalEntryId?: string | null;
  accountingDocumentId?: string | null;
  createdAt?: string | null;
}

export interface CreateCreditNoteDto {
  creditNoteNumber?: string | null;
  creditNoteDate: string;
  amount: number;
  vatAmount?: number | null;
  reason?: string | null;
  notes?: string | null;
  customerId: string;
  sourceContractId?: string | null;
  sourceContractType?: string | null;
}

// ── Debit Note ───────────────────────────────────────────────────────────────

export interface DebitNote {
  id: string;
  debitNoteNumber?: string | null;
  debitNoteDate?: string | null;
  amount: number;
  vatAmount?: number | null;
  reason?: string | null;
  agentId?: string | null;
  sourceContractId?: string | null;
  sourceContractType?: string | null;
  journalEntryId?: string | null;
  accountingDocumentId?: string | null;
  createdAt?: string | null;
}

export interface CreateDebitNoteDto {
  debitNoteNumber?: string | null;
  debitNoteDate: string;
  amount: number;
  vatAmount?: number | null;
  reason?: string | null;
  agentId: string;
  sourceContractId?: string | null;
  sourceContractType?: string | null;
}

// ── Accounting Document Trace ────────────────────────────────────────────────

export interface AccountingDocumentTraceJournalLine {
  accountId?: string | null;
  accountCode?: string | null;
  accountName?: string | null;
  debit: number;
  credit: number;
  description?: string | null;
}

export interface AccountingDocumentTraceJournal {
  id?: string | null;
  entryNumber?: string | null;
  date?: string | null;
  description?: string | null;
  /** 0=Draft, 1=Posted, 2=PendingApproval, 3=Cancelled */
  status?: number | null;
  sourceId?: string | null;
  customerId?: string | null;
  agentId?: string | null;
  lines?: AccountingDocumentTraceJournalLine[];
}

export interface AccountingDocumentTraceDocument {
  id?: string | null;
  /** 1=ReceiptVoucher, 2=PaymentVoucher, 3=CreditNote, 4=DebitNote */
  documentType?: number | null;
  documentNumber?: string | null;
  documentDate?: string | null;
  amount?: number | null;
  journalEntryId?: string | null;
  accountingDocumentId?: string | null;
  customerId?: string | null;
  agentId?: string | null;
  contractId?: string | null;
  contractType?: string | null;
  /** 0=Draft, 1=Posted, 2=PendingApproval, 3=Cancelled */
  journalStatus?: number | null;
}

export interface AccountingDocumentTrace {
  /** 1=ReceiptVoucher, 2=PaymentVoucher, 3=CreditNote, 4=DebitNote */
  documentType?: number | null;
  documentEntityId?: string | null;
  document?: AccountingDocumentTraceDocument | null;
  journalEntry?: AccountingDocumentTraceJournal | null;
  ledgerEntries?: unknown[];
}

// ==================== Period Closing Types ====================

export interface PeriodClosingStatusDto {
  year: number;
  month: number;
}

export interface ClosePeriodDto {
  year: number;
  month: number;
}

export interface PeriodClosingResult {
  year?: number | null;
  month?: number | null;
  closingJournalEntryId?: string | null;
  netIncomeTransferred?: number | null;
  isClosed?: boolean | null;
}

