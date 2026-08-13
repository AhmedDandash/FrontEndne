// ── Form data types for each MediationFollowUp item type ─────────────────────
// inputDescription stores JSON.stringify(AnyFormData) on the backend.
// hasFilledInputDescription() determines whether the form has been submitted.

export type ItemFormType =
  | 'medical'
  | 'musand'
  | 'polo'
  | 'tesda'
  | 'owwa'
  | 'oce'
  | 'visa-stamp'
  | 'flight'
  | 'biometric'
  | 'authorization';

export interface MedicalFormData {
  ActionDate: string;
  /** 1=الفحص تحت الاجراء  2=تم الفحص بنجاح  3=غير لائق */
  medicalStatus: number;
  Notes?: string;
}

export interface MusandFormData {
  ActionDate: string;
  /** 101=تم انشاء العقد  102=تم القبول  103=موافقة وزارة  105=تم الالغاء */
  status: number;
  authorizationSystem?: number;
  authorizationBankName?: string;
  Notes?: string;
}

export interface AuthorizationFormData {
  ActionDate: string;
  authorizationSystem: number;
  authorizationBankName?: string;
  Notes?: string;
}

export interface PoloFormData {
  ActionDate: string;
  /** 111=تم ادخال العقد  112=تم قبول العقد  113=تم الرفض */
  contractAgentStatusId: number;
  Notes?: string;
}

export interface TesdaFormData {
  ActionDate: string;
  /** 61=مجدول TESDA  62=تحت الاجراء TESDA  63=تم بنجاح TESDA */
  contractAgentStatusId: number;
  Notes?: string;
}

export interface OwwaFormData {
  ActionDate: string;
  /** 64=مجدول OWWA  65=تحت الاجراء OWWA  66=تم بنجاح OWWA */
  contractAgentStatusId: number;
  Notes?: string;
}

export interface OceFormData {
  ActionDate: string;
  /** 75=تم تقديم تصريح السفر  76=تم اصدار  27=تم رفض */
  contractAgentStatusId: number;
  Notes?: string;
}

export interface VisaStampFormData {
  ActionDate: string;
  /** 71=التأشير مجدول  73=تم التأشير  77=إلغاء التأشير */
  contractAgentStatusId: number;
  Notes?: string;
}

export interface FlightFormData {
  arrivalDate: string;
  /** Free text — entered when airline is not in the dropdown */
  CarrierLines?: string;
  AirlineCompanyId?: string;
  time?: string;
  FlightPlaceId?: string;
  FlightNumber?: string;
  TimeReceipt?: string;
  DayReceipt?: string;
}

export interface BiometricFormData {
  ActionDate: string;
  /** 68=التبصيم مجدول  69=تم التبصيم */
  contractAgentStatusId: number;
  Notes?: string;
}

export type AnyFormData =
  | MedicalFormData
  | MusandFormData
  | PoloFormData
  | TesdaFormData
  | OwwaFormData
  | OceFormData
  | VisaStampFormData
  | FlightFormData
  | BiometricFormData
  | AuthorizationFormData;

// ── Item type detection ───────────────────────────────────────────────────────
// Matches against statusNameEn / statusNameAr using keywords from the backend.
// Add entries here if the backend uses different naming conventions.

export function detectItemFormType(item: {
  statusNameEn?: string | null;
  statusNameAr?: string | null;
}): ItemFormType | null {
  const raw = ((item.statusNameEn ?? '') + ' ' + (item.statusNameAr ?? '')).toLowerCase();

  if (/medical|طبي|الفحص|الكشف الطبي/.test(raw)) return 'medical';
  // musaned must come AFTER medical so "musaned medical" doesn't match here
  if (/musaned|musand|مساند/.test(raw)) return 'musand';
  // POLO: backend may say "Embassy", "Embassy Contract", or "POLO"
  if (/\bpolo\b|embassy|سفارة|بولو/.test(raw)) return 'polo';
  // TESDA: backend may say "Training", "TESDA Training"
  if (/\btesda\b|training|تدريب|تيسدا/.test(raw)) return 'tesda';
  if (/\bowwa\b|اوا/.test(raw)) return 'owwa';
  // OCE: backend may say "Travel Clearance", "OCE"
  if (/\boce\b|travel.?clearance|تصريح السفر/.test(raw)) return 'oce';
  if (/visa.?stamp|تأشير/.test(raw)) return 'visa-stamp';
  if (/flight|ticket|طيران|تذكرة/.test(raw)) return 'flight';
  if (/biometric|بصمة|تبصيم/.test(raw)) return 'biometric';
  if (/authorization|authorisation|delegation|تفويض/.test(raw)) return 'authorization';

  return null;
}

// ── Completion gate helper ────────────────────────────────────────────────────
// Returns true when inputDescription contains saved structured form data.
// Legacy HTML format (from before this feature) is also accepted as filled.

export function hasFilledInputDescription(inputDescription?: string | null): boolean {
  if (!inputDescription || !inputDescription.trim()) return false;
  try {
    const parsed = JSON.parse(inputDescription);
    return parsed !== null && typeof parsed === 'object' && Object.keys(parsed).length > 0;
  } catch {
    // Old HTML content — count as filled so existing completed items are unaffected
    return true;
  }
}

// ── Per-type status option definitions ───────────────────────────────────────

export const ITEM_STATUS_OPTIONS: Partial<Record<ItemFormType, { value: number; labelAr: string }[]>> = {
  medical: [
    { value: 1, labelAr: 'الفحص تحت الاجراء' },
    { value: 2, labelAr: 'تم الفحص بنجاح' },
    { value: 3, labelAr: 'غير لائق' },
  ],
  musand: [
    { value: 101, labelAr: 'تم انشاء العقد' },
    { value: 102, labelAr: 'تم القبول من مكتب الارسال الخارجي' },
    { value: 103, labelAr: 'موافقة وزارة العمل الاجنبية' },
    { value: 105, labelAr: 'تم الالغاء' },
  ],
  polo: [
    { value: 111, labelAr: 'تم ادخال العقد في السفارة' },
    { value: 112, labelAr: 'تم قبول العقد من السفارة' },
    { value: 113, labelAr: 'تم الرفض' },
  ],
  tesda: [
    { value: 61, labelAr: 'مجدول TESDA' },
    { value: 62, labelAr: 'تحت الاجراء TESDA' },
    { value: 63, labelAr: 'تم بنجاح TESDA' },
  ],
  owwa: [
    { value: 64, labelAr: 'مجدول OWWA' },
    { value: 65, labelAr: 'تحت الاجراء OWWA' },
    { value: 66, labelAr: 'تم بنجاح OWWA' },
  ],
  oce: [
    { value: 75, labelAr: 'تم تقديم تصريح السفر' },
    { value: 76, labelAr: 'تم اصدار تصريح السفر' },
    { value: 27, labelAr: 'تم رفض اصدار التصريح' },
  ],
  'visa-stamp': [
    { value: 71, labelAr: 'التأشير مجدول' },
    { value: 73, labelAr: 'تم التأشير' },
    { value: 77, labelAr: 'إلغاء التأشير' },
  ],
  biometric: [
    { value: 68, labelAr: 'التبصيم مجدول' },
    { value: 69, labelAr: 'تم التبصيم' },
  ],
  authorization: [],
};

// Returns the backend field name for the status dropdown per type
export function getStatusFieldName(type: ItemFormType): string {
  if (type === 'medical') return 'medicalStatus';
  if (type === 'musand') return 'status';
  if (type === 'authorization') return 'authorizationSystem';
  return 'contractAgentStatusId';
}
