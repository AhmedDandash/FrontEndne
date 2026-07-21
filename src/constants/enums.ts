/**
 * Central Enum Configuration
 * Defines all numeric lookup values used across the application
 * with labels in both Arabic and English.
 */

export interface EnumOption {
  value: number;
  labelAr: string;
  labelEn: string;
}

/**
 * Helper to get the label for an enum value based on language
 */
export function getEnumLabel(
  options: readonly EnumOption[],
  value: number | null | undefined,
  language: 'ar' | 'en'
): string {
  if (value === null || value === undefined)
    return language === 'ar' ? 'غير محدد' : 'Not Specified';
  const option = options.find((o) => o.value === value);
  return option ? (language === 'ar' ? option.labelAr : option.labelEn) : `${value}`;
}

/**
 * Helper to convert enum options to Ant Design Select options
 */
export function toSelectOptions(options: readonly EnumOption[], language: 'ar' | 'en') {
  return options.map((o) => ({
    value: o.value,
    label: language === 'ar' ? o.labelAr : o.labelEn,
  }));
}

// ==================== Worker Type ====================
// نوع العامل
export const WORKER_TYPE = [
  { value: 0, labelAr: 'غير معين', labelEn: 'Not Appointed' },
  { value: 1, labelAr: 'معين', labelEn: 'Appointed' },
  { value: 2, labelAr: 'تفويض', labelEn: 'Authorization' },
  { value: 3, labelAr: 'معروفه', labelEn: 'Known' },
] as const;

// ==================== Religion ====================
// الديانة
export const RELIGION = [
  { value: 0, labelAr: 'غير محدد', labelEn: 'Not Specified' },
  { value: 1, labelAr: 'مسلم', labelEn: 'Muslim' },
  { value: 2, labelAr: 'غير مسلم', labelEn: 'Non-Muslim' },
] as const;

// ==================== Previous Experience ====================
// سبق له العمل
export const PREVIOUS_EXPERIENCE = [
  { value: 0, labelAr: 'غير محدد', labelEn: 'Not Specified' },
  { value: 3, labelAr: 'سبق له العمل', labelEn: 'Has Previous Experience' },
  { value: 2, labelAr: 'لم يسبق له العمل', labelEn: 'No Previous Experience' },
] as const;

// ==================== Complaint Type ====================
// نوع الشكوى
export const COMPLAINT_TYPE = [
  { value: 1, labelAr: 'قضية', labelEn: 'Case' },
  { value: 3, labelAr: 'معاملة', labelEn: 'Transaction' },
] as const;

// ==================== Complaint Source (new API field: source) ====================
// مصدر الشكوى — ComplaintSource enum in new API
// Values changed from old COMPLAINT_FROM: Worker 5→2, Agent 2→3, Embassy 3→4, Ministry 4→5
export const COMPLAINT_SOURCE = [
  { value: 1, labelAr: 'من العميل', labelEn: 'From Customer' },
  { value: 2, labelAr: 'من العامل', labelEn: 'From Worker' },
  { value: 3, labelAr: 'من الوكيل', labelEn: 'From Agent' },
  { value: 4, labelAr: 'من السفارة', labelEn: 'From Embassy' },
  { value: 5, labelAr: 'من الوزارة', labelEn: 'From Ministry' },
  { value: 6, labelAr: 'شكوى لعقد', labelEn: 'Contract Complaint' },
] as const;

/**
 * @deprecated Use COMPLAINT_SOURCE — kept only for displaying legacy records that
 * were created before the API migration and may have old numeric values stored.
 */
export const COMPLAINT_FROM = COMPLAINT_SOURCE;

// ==================== Complaint Priority ====================
// أولوية الشكوى — new field in new API
export const COMPLAINT_PRIORITY = [
  { value: 1, labelAr: 'أخضر (منخفضة)', labelEn: 'Green (Low)' },
  { value: 2, labelAr: 'أصفر (متوسطة)', labelEn: 'Yellow (Medium)' },
  { value: 3, labelAr: 'أحمر (عالية)', labelEn: 'Red (High)' },
] as const;

// ==================== Worker Location ====================
// موقع العامل
export const WORKER_LOCATION = [
  { value: 0, labelAr: 'غير محدد', labelEn: 'Not Specified' },
  { value: 1, labelAr: 'في السكن', labelEn: 'In Accommodation' },
  { value: 2, labelAr: 'عند العميل', labelEn: 'At Customer Home' },
] as const;

// ==================== Contract Type ====================
// نوع العقد
export const CONTRACT_TYPE = [
  { value: 1, labelAr: 'عقد استقدام', labelEn: 'Recruitment Contract' },
  { value: 2, labelAr: 'عقد تشغيل', labelEn: 'Rent Contract' },
  { value: 3, labelAr: 'عقد توسط', labelEn: 'Mediation Contract' },
] as const;

// ==================== Authorization System ====================
// نظام التفويض
export const AUTHORIZATION_SYSTEM = [
  { value: 0, labelAr: 'غير محدد', labelEn: 'Not Specified' },
  { value: 1, labelAr: 'مساند', labelEn: 'Musaned' },
  { value: 2, labelAr: 'يدوي', labelEn: 'Manual' },
] as const;

// ==================== Gender ====================
// الجنس
export const GENDER = [
  { value: 0, labelAr: 'ذكر', labelEn: 'Male' },
  { value: 1, labelAr: 'أنثى', labelEn: 'Female' },
] as const;

// ==================== Marital Status ====================
// الحالة الاجتماعية
export const MARITAL_STATUS = [
  { value: 0, labelAr: 'أعزب', labelEn: 'Single' },
  { value: 1, labelAr: 'متزوج', labelEn: 'Married' },
  { value: 2, labelAr: 'مطلق', labelEn: 'Divorced' },
  { value: 3, labelAr: 'أرمل', labelEn: 'Widowed' },
] as const;

// ==================== Identity Type ====================
// نوع الهوية
export const IDENTITY_TYPE = [
  { value: 1, labelAr: 'هوية وطنية', labelEn: 'National ID' },
  { value: 2, labelAr: 'إقامة', labelEn: 'Residency' },
  { value: 3, labelAr: 'جواز سفر', labelEn: 'Passport' },
] as const;

// ==================== Housing Type ====================
// نوع السكن
export const HOUSING_TYPE = [
  { value: 1, labelAr: 'شقة', labelEn: 'Apartment' },
  { value: 2, labelAr: 'فيلا', labelEn: 'Villa' },
  { value: 3, labelAr: 'دور', labelEn: 'Floor' },
  { value: 4, labelAr: 'مجمع', labelEn: 'Compound' },
] as const;

// ==================== Worker Status ====================
// حالة العامل
export const WORKER_STATUS = [
  { value: 0, labelAr: 'غير محدد', labelEn: 'Unknown' },
  { value: 1, labelAr: 'متاح', labelEn: 'Available' },
  { value: 2, labelAr: 'مخصص', labelEn: 'Assigned' },
  { value: 3, labelAr: 'في عقد', labelEn: 'In Contract' },
] as const;

// ==================== Offer Type ====================
// نوع العرض
export const OFFER_TYPE = [
  { value: 1, labelAr: 'عرض عادي', labelEn: 'Normal Offer' },
  { value: 2, labelAr: 'عرض خاص', labelEn: 'Special Offer' },
] as const;

// ==================== Offer Contract Type ====================
// نوع عقد العرض
export const OFFER_CONTRACT_TYPE = [
  { value: 1, labelAr: 'توسط', labelEn: 'Mediation' },
  { value: 2, labelAr: 'تشغيل', labelEn: 'Operation' },
] as const;

// ==================== Issue State (Complaints) ====================
// حالة القضية
export const ISSUE_STATE = [
  { value: 1, labelAr: 'اللجان العمالية', labelEn: 'Labor Committees' },
  { value: 2, labelAr: 'وحدة الدعم والحماية', labelEn: 'Support & Protection Unit' },
] as const;

// ==================== Request Type ====================
// حالة الطلب
export const REQUEST_TYPE = [
  { value: 0, labelAr: 'معلق', labelEn: 'Pending' },
  { value: 1, labelAr: 'مراجعة', labelEn: 'Under Review' },
  { value: 2, labelAr: 'مقبول', labelEn: 'Accepted' },
  { value: 3, labelAr: 'مرفوض', labelEn: 'Refused' },
] as const;

// ==================== Privilege Type ====================
// نوع الصلاحية
export const PRIVILEGE_TYPE = [
  { value: 0, labelAr: 'موظف', labelEn: 'Employee' },
  { value: 1, labelAr: 'وكيل', labelEn: 'Agent' },
] as const;

// ==================== Agent Contract Type ====================
// نوع عقد الوكيل
export const AGENT_CONTRACT_TYPE = [
  { value: 0, labelAr: 'توسط', labelEn: 'Mediation' },
  { value: 1, labelAr: 'تشغيل', labelEn: 'Operation' },
] as const;

// ==================== Organization Type ====================
// نوع المنظمة
export const ORGANIZATION_TYPE = [
  { value: 1, labelAr: 'فردية', labelEn: 'Individual' },
  { value: 2, labelAr: 'شراكة', labelEn: 'Partnership' },
  { value: 3, labelAr: 'شركة', labelEn: 'Company' },
] as const;

// ==================== Document Type ====================
// نوع المستند
export const DOCUMENT_TYPE = [
  { value: 1, labelAr: 'جواز سفر', labelEn: 'Passport' },
  { value: 2, labelAr: 'تأشيرة', labelEn: 'Visa' },
  { value: 3, labelAr: 'عقد', labelEn: 'Contract' },
  { value: 4, labelAr: 'أخرى', labelEn: 'Other' },
] as const;

// ==================== Date Type ====================
// نوع التاريخ
export const DATE_TYPE = [
  { value: 1, labelAr: 'ميلادي', labelEn: 'Gregorian' },
  { value: 2, labelAr: 'هجري', labelEn: 'Hijri' },
] as const;

// ==================== Nationalities ====================
// الجنسيات
export const NATIONALITIES = [
  { value: 359, labelAr: 'الفلبين', labelEn: 'Philippines' },
  { value: 360, labelAr: 'كينيا', labelEn: 'Kenya' },
  { value: 361, labelAr: 'أوغندا', labelEn: 'Uganda' },
  { value: 362, labelAr: 'الهند', labelEn: 'India' },
  { value: 363, labelAr: 'السودان', labelEn: 'Sudan' },
  { value: 364, labelAr: 'مصر', labelEn: 'Egypt' },
  { value: 365, labelAr: 'بوروندي', labelEn: 'Burundi' },
  { value: 366, labelAr: 'بنجلادش', labelEn: 'Bangladesh' },
  { value: 367, labelAr: 'باكستان', labelEn: 'Pakistan' },
  { value: 482, labelAr: 'المغرب', labelEn: 'Morocco' },
  { value: 701, labelAr: 'سريلانكا', labelEn: 'Sri Lanka' },
  { value: 731, labelAr: 'أثيوبيا', labelEn: 'Ethiopia' },
  { value: 771, labelAr: 'أندونيسيا', labelEn: 'Indonesia' },
  { value: 839, labelAr: 'اليمن', labelEn: 'Yemen' },
] as const;

// ==================== Operation Type ====================
// نوع العملية (في عقد التشغيل)
export const OPERATION_TYPE = [
  { value: 1, labelAr: 'مدة', labelEn: 'Duration' },
  { value: 3, labelAr: 'نقل الخدمات', labelEn: 'Sponsorship Transfer' },
] as const;

// ==================== Payment Method ====================
// طريقة السداد
export const PAYMENT_METHOD = [
  { value: 1, labelAr: 'نقدي', labelEn: 'Cash' },
  { value: 2, labelAr: 'دفعات', labelEn: 'Installments' },
] as const;

// ==================== Mediation Contract Payment Method ====================
// POST /api/Mediation/MediationContract/customer-payment — PaymentMethodType enum (1-5).
export const MEDIATION_PAYMENT_METHOD = [
  { value: 1, labelAr: 'نقدي', labelEn: 'Cash' },
  { value: 2, labelAr: 'بنك', labelEn: 'Bank' },
  { value: 3, labelAr: 'بطاقة', labelEn: 'Card' },
  { value: 4, labelAr: 'تحويل', labelEn: 'Transfer' },
  { value: 5, labelAr: 'شيك', labelEn: 'Cheque' },
] as const;

// ==================== Medical Status ====================
// الحالة الطبية
export const MEDICAL_STATUS = [
  { value: 1, labelAr: 'قيد الانتظار', labelEn: 'Pending' },
  { value: 2, labelAr: 'ناجح', labelEn: 'Passed' },
  { value: 3, labelAr: 'راسب', labelEn: 'Failed' },
] as const;

// ==================== Worker Workflow Status ====================
// حالة العامل (حالة سير العمل)
// Note: API field renamed from 'workerSatus' (typo) to 'workerStatus' in new API
export const WORKER_SATUS = [
  { value: 1, labelAr: 'متاح', labelEn: 'Available' },
  { value: 2, labelAr: 'مرحلة التجربة', labelEn: 'Trial Worker' },
  { value: 3, labelAr: 'تحت الإجراء', labelEn: 'Under Procedure' },
  { value: 4, labelAr: 'انسحاب', labelEn: 'Backout' },
  { value: 5, labelAr: 'داخل المملكة', labelEn: 'Inside Kingdom' },
  { value: 6, labelAr: 'مرحّل', labelEn: 'Deported' },
] as const;

// ==================== Worker Contract Type ====================
// نوع عقد العامل (حقل workerType في نموذج إضافة عامل)
export const WORKER_CONTRACT_TYPE = [
  { value: 1, labelAr: 'التوسط', labelEn: 'Mediation' },
  { value: 2, labelAr: 'التشغيل', labelEn: 'Operation/Rent' },
  { value: 3, labelAr: 'نقل الكفالة', labelEn: 'Sponsorship Transfer' },
] as const;

// ==================== Marketer Source ====================
// مصدر التسويق (كيف وصل إلينا العميل)
export const MARKETER_SOURCE = [
  { value: 167, labelAr: 'قوقل', labelEn: 'Google' },
  { value: 168, labelAr: 'سناب شات', labelEn: 'Snapchat' },
  { value: 169, labelAr: 'تويتر', labelEn: 'Twitter' },
  { value: 170, labelAr: 'انستقرام', labelEn: 'Instagram' },
  { value: 171, labelAr: 'مساند', labelEn: 'Musaned' },
  { value: 172, labelAr: 'أقارب وأصدقاء', labelEn: 'Relatives & Friends' },
  { value: 173, labelAr: 'لوحة المحل', labelEn: 'Store Sign' },
  { value: 174, labelAr: 'عميل سابق', labelEn: 'Previous Client' },
  { value: 278, labelAr: 'تيك توك', labelEn: 'TikTok' },
] as const;

// ==================== Contract Category ====================
// تصنيف العقد (ContractCategory: 1=Standard, 2=VIP, 3=Corporate)
export const CONTRACT_CATEGORY = [
  { value: 1, labelAr: 'قياسي', labelEn: 'Standard' },
  { value: 2, labelAr: 'مميز', labelEn: 'VIP' },
  { value: 3, labelAr: 'شركات', labelEn: 'Corporate' },
] as const;

// ==================== Operation Contract Duration ====================
// مدة عقد التشغيل (بالأشهر) — تُعرض تسميتها من الـ API عبر durationNameAr/En
export const OPERATION_DURATION = [
  { value: 1, labelAr: 'شهري', labelEn: 'Monthly' },
  { value: 3, labelAr: 'ربع سنوي', labelEn: 'Quarterly' },
  { value: 6, labelAr: 'نصف سنوي', labelEn: 'Semi Annual' },
  { value: 12, labelAr: 'سنوي', labelEn: 'Annual' },
] as const;

// ==================== Labor Management ====================
// إدارة العمالة
// TODO: Verify actual numeric values from backend documentation
export const LABOR_MANAGEMENT = [
  { value: 1, labelAr: 'إدارة مباشرة', labelEn: 'Direct Management' },
  { value: 2, labelAr: 'إدارة غير مباشرة', labelEn: 'Indirect Management' },
] as const;

// ==================== Visa Job Types ====================
// أنواع المهن في التأشيرات (وظائف العمالة المنزلية)
export const VISA_JOB_TYPES = [
  { value: 1198, labelAr: 'خادمة منزلية', labelEn: 'House Maid' },
  { value: 1199, labelAr: 'سائق', labelEn: 'Driver' },
  { value: 1210, labelAr: 'نادل منزلي', labelEn: 'Household Waiter' },
  { value: 1212, labelAr: 'ممرضة منزلية', labelEn: 'Home Nurse' },
  { value: 1246, labelAr: 'طباخ', labelEn: 'Cook' },
  { value: 1293, labelAr: 'عامل منزلي', labelEn: 'Home Worker' },
  { value: 1568, labelAr: 'حارس منزلي', labelEn: 'Home Guard' },
  { value: 1602, labelAr: 'مزارع منزلي', labelEn: 'Home Gardener' },
  { value: 1522, labelAr: 'صانع قهوة منزلي', labelEn: 'Home Coffee Maker' },
  { value: 1616, labelAr: 'مدير منزلي', labelEn: 'House Manager' },
] as const;

// ==================== Complaint Status ====================
// حالة الشكوى
export const COMPLAINT_STATUS = [
  { value: 1, labelAr: 'مفتوحة', labelEn: 'Open' },
  { value: 2, labelAr: 'معلقة', labelEn: 'On Hold' },
  { value: 3, labelAr: 'منتهية', labelEn: 'Finished' },
] as const;

// ==================== Submission Authority (Issue) ====================
// جهة التقديم (القضية) — SubmissionAuthority enum in new API
// Values updated to match new swagger: 1=LaborOffice, 2=Court, 3=Police, 4=LaborCommittee
export const SUBMISSION_AUTHORITY = [
  { value: 1, labelAr: 'مكتب العمل', labelEn: 'Labor Office' },
  { value: 2, labelAr: 'المحكمة', labelEn: 'Court' },
  { value: 3, labelAr: 'الشرطة', labelEn: 'Police' },
  { value: 4, labelAr: 'اللجنة العمالية', labelEn: 'Labor Committee' },
] as const;

// ==================== Issue Status (Open/Closed) ====================
// حالة القضية (مفتوحة/مغلقة)
export const ISSUE_STATUS = [
  { value: 1, labelAr: 'مفتوحة', labelEn: 'Open' },
  { value: 2, labelAr: 'مغلقة', labelEn: 'Closed' },
] as const;

// ==================== Operating Contract Status ====================
// حالة عقد التشغيل — ContractStatus enum in new API
export const OPERATING_CONTRACT_STATUS = [
  { value: 1, labelAr: 'مسودة', labelEn: 'Draft' },
  { value: 2, labelAr: 'موقع', labelEn: 'Signed' },
  { value: 3, labelAr: 'قيد التنفيذ', labelEn: 'Executing' },
  { value: 4, labelAr: 'منتهي', labelEn: 'Finished' },
] as const;

// ==================== Mediation Contract Status ====================
// حالة عقد الوساطة
// Codes verified live against the Sigma API (status-history of a full lifecycle).
// Codes are SPARSE — there may be intermediate statuses not yet observed.
export const MEDIATION_CONTRACT_STATUS = [
  { value: 1, labelAr: 'مسودة', labelEn: 'Draft' },
  { value: 2, labelAr: 'موقّع', labelEn: 'Signed' },
  { value: 11, labelAr: 'صدر نموذج الاستلام', labelEn: 'Delivery Form Issued' },
  { value: 13, labelAr: 'مُسلَّم', labelEn: 'Delivered' },
  { value: 16, labelAr: 'مُرجَع', labelEn: 'Returned' },
  { value: 17, labelAr: 'ملغى', labelEn: 'Cancelled' },
] as const;

// ==================== Mediation Contract Type ====================
// نوع عقد الوساطة
// value 1 = New (verified live). value 2 = Transfer is INFERRED: only "New" and
// "Transfer" appear in real data and 1=New is confirmed, but the Transfer code
// was not directly verified. Confirm with backend before relying on it.
export const MEDIATION_CONTRACT_TYPE = [
  { value: 1, labelAr: 'جديد', labelEn: 'New' },
  { value: 2, labelAr: 'نقل خدمات', labelEn: 'Transfer' },
] as const;

// ==================== Visa Type ====================
// نوع التأشيرة
export const VISA_TYPE = [
  { value: 1, labelAr: 'تأشيرة عمل', labelEn: 'Work Visa' },
  { value: 2, labelAr: 'تأشيرة زيارة', labelEn: 'Visit Visa' },
  { value: 3, labelAr: 'تأشيرة نقل خدمات', labelEn: 'Transfer Visa' },
] as const;

// ==================== Worker Nomination Status ====================
// حالة تعيين العامل (في عقد الوساطة)
export const WORKER_NOMINATION = [
  { value: 1, labelAr: 'معين', labelEn: 'Nominated' },
  { value: 2, labelAr: 'غير معين', labelEn: 'Not Nominated' },
  { value: 3, labelAr: 'تفويض', labelEn: 'Delegation' },
  { value: 4, labelAr: 'معروفة', labelEn: 'Known' },
] as const;

// ==================== Cancel By ====================
// إلغاء بواسطة
export const CANCEL_BY = [
  { value: 1, labelAr: 'من العميل', labelEn: 'By Customer' },
  { value: 2, labelAr: 'من الإدارة', labelEn: 'By Management' },
] as const;

// ==================== Arrival Destinations ====================
// مدن الوصول
export const ARRIVAL_DESTINATIONS = [
  { value: 1, labelAr: 'الرياض', labelEn: 'Riyadh' },
  { value: 2, labelAr: 'الدمام', labelEn: 'Dammam' },
  { value: 3, labelAr: 'جدة', labelEn: 'Jeddah' },
  { value: 4, labelAr: 'حائل', labelEn: 'Hail' },
  { value: 5, labelAr: 'الأحساء', labelEn: 'Al Ahsa' },
  { value: 6, labelAr: 'المدينة المنورة', labelEn: 'Madinah' },
  { value: 7, labelAr: 'ينبع', labelEn: 'Yanbu' },
  { value: 8, labelAr: 'تبوك', labelEn: 'Tabuk' },
  { value: 9, labelAr: 'بريدة', labelEn: 'Buraidah' },
  { value: 10, labelAr: 'أبها', labelEn: 'Abha' },
  { value: 11, labelAr: 'الطائف', labelEn: 'Taif' },
  { value: 12, labelAr: 'نجران', labelEn: 'Najran' },
  { value: 13, labelAr: 'جازان', labelEn: 'Jazan' },
  { value: 14, labelAr: 'الجوف', labelEn: 'Al Jawf' },
  { value: 15, labelAr: 'القصيم', labelEn: 'Qassim' },
  { value: 16, labelAr: 'عرعر', labelEn: 'Arar' },
] as const;

// ==================== Transfer Contract Status ====================
// حالة عقد النقل — values per TransferContractStatus API spec
// 1=Draft, 4=SentToAuthorities, 5=Approved, 6=Rejected, 8=TransferCompleted
export const TRANSFER_CONTRACT_STATUS = [
  { value: 1, labelAr: 'مسودة', labelEn: 'Draft' },
  { value: 4, labelAr: 'أُرسل للجهات المختصة', labelEn: 'Sent To Authorities' },
  { value: 5, labelAr: 'مقبول', labelEn: 'Approved' },
  { value: 6, labelAr: 'مرفوض', labelEn: 'Rejected' },
  { value: 8, labelAr: 'تم نقل الكفالة', labelEn: 'Transfer Completed' },
] as const;

// ==================== Payment Means Code Type ====================
// نوع وسيلة الدفع — values per PaymentMeansCodeType API spec
export const PAYMENT_MEANS_CODE_TYPE = [
  { value: 1, labelAr: 'نقداً', labelEn: 'Cash' },
  { value: 2, labelAr: 'شيك', labelEn: 'Check' },
  { value: 3, labelAr: 'تحويل بنكي', labelEn: 'Bank Transfer' },
  { value: 6, labelAr: 'شبكة', labelEn: 'Network (POS)' },
] as const;

// ==================== Operating Contract Payment Method ====================
// طريقة دفع عقد التشغيل — used by the contract create/edit form.
// Maps to the payment account on the generated receipt journal (Cash → 101, Bank/Card → 102).
export const OPERATING_PAYMENT_METHOD = [
  { value: 1, labelAr: 'نقدي', labelEn: 'Cash' },
  { value: 2, labelAr: 'شبكة', labelEn: 'Card/Network' },
  { value: 3, labelAr: 'تحويل بنكي', labelEn: 'Bank Transfer' },
] as const;

// ==================== Customer Refund Payment Method ====================
// طريقة سداد استرداد العميل — POST /EmploymentOperatingContract/{id}/customer-refund
// Per Operating Contract spec: 1=Cash, 2=Bank, 3=Card (default 1).
export const REFUND_PAYMENT_METHOD = [
  { value: 1, labelAr: 'نقدي', labelEn: 'Cash' },
  { value: 2, labelAr: 'بنك', labelEn: 'Bank' },
  { value: 3, labelAr: 'شبكة', labelEn: 'Card' },
] as const;

