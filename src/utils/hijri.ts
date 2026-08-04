/**
 * Hijri (Umm al-Qura) calendar display helpers. No date library dependency —
 * `Intl.DateTimeFormat` supports the `islamic-umalqura` calendar natively in
 * every evergreen browser, and Umm al-Qura is the Saudi civil calendar (more
 * correct here than most npm Hijri packages, which implement tabular Hijri
 * and can drift a day). Display-only: the stored/transmitted value stays
 * Gregorian ISO `YYYY-MM-DD`.
 */

export interface HijriParts {
  year: number;
  month: number; // 1-12
  day: number;
}

const HIJRI_MONTHS_AR = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الآخر',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة',
];

const HIJRI_MONTHS_EN = [
  'Muharram',
  'Safar',
  'Rabi al-Awwal',
  'Rabi al-Thani',
  'Jumada al-Awwal',
  'Jumada al-Thani',
  'Rajab',
  'Shaaban',
  'Ramadan',
  'Shawwal',
  'Dhu al-Qidah',
  'Dhu al-Hijjah',
];

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

function toArabicDigits(n: number): string {
  return String(n).replace(/[0-9]/g, (d) => ARABIC_DIGITS[Number(d)]);
}

let hijriSupported: boolean | null = null;

/** Feature-detects `islamic-umalqura` support once and caches the result. */
export function isHijriSupported(): boolean {
  if (hijriSupported !== null) return hijriSupported;
  try {
    const fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { year: 'numeric' });
    hijriSupported = fmt.resolvedOptions().calendar === 'islamic-umalqura';
  } catch {
    hijriSupported = false;
  }
  return hijriSupported;
}

/** Returns null when the runtime lacks Umm al-Qura support — callers should fall back to Gregorian. */
export function toHijriParts(date: Date): HijriParts | null {
  if (!isHijriSupported() || Number.isNaN(date.getTime())) return null;
  const fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  const parts = fmt.formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const year = get('year');
  const month = get('month');
  const day = get('day');
  if (!year || !month || !day) return null;
  return { year, month, day };
}

/** e.g. "١٢ جمادى الأولى ١٤٤٦ هـ" (ar) / "12 Jumada al-Awwal 1446 AH" (en). Falls back to a Gregorian string if unsupported. */
export function formatHijri(date: Date, lang: 'ar' | 'en'): string {
  const parts = toHijriParts(date);
  if (!parts) {
    return date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US');
  }
  const monthName = lang === 'ar' ? HIJRI_MONTHS_AR[parts.month - 1] : HIJRI_MONTHS_EN[parts.month - 1];
  if (lang === 'ar') {
    return `${toArabicDigits(parts.day)} ${monthName} ${toArabicDigits(parts.year)} هـ`;
  }
  return `${parts.day} ${monthName} ${parts.year} AH`;
}
