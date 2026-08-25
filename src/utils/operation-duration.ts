const OFFER_PERIOD_LABELS: Record<number, { ar: string; en: string }> = {
  46: { ar: 'شهري', en: 'Monthly' },
  52: { ar: 'ربع سنوي', en: 'Quarterly' },
  53: { ar: 'نصف سنوي', en: 'Semi-annual' },
  189: { ar: 'سنوي', en: 'Annual' },
};

const STANDARD_DURATION_LABELS: Record<number, { ar: string; en: string }> = {
  1: { ar: 'شهري', en: 'Monthly' },
  3: { ar: 'ربع سنوي', en: 'Quarterly' },
  6: { ar: 'نصف سنوي', en: 'Semi-annual' },
  12: { ar: 'سنوي', en: 'Annual' },
};

const ENUM_DURATION_LABELS: Record<number, { ar: string; en: string }> = {
  1: { ar: 'شهري', en: 'Monthly' },
  2: { ar: 'ربع سنوي', en: 'Quarterly' },
  3: { ar: 'نصف سنوي', en: 'Semi-annual' },
  4: { ar: 'سنوي', en: 'Annual' },
};

export function formatOperationDuration(
  value: number | string | null | undefined,
  language: 'ar' | 'en',
  fallback?: string | null,
  options?: { preferEnum?: boolean }
): string {
  const cleanFallback = fallback?.trim();
  if (cleanFallback && !Number.isFinite(Number(cleanFallback))) return cleanFallback;
  if (value == null || value === '') return '—';

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);

  if (options?.preferEnum) {
    const enumLabel = ENUM_DURATION_LABELS[numeric];
    if (enumLabel) return enumLabel[language];
  }

  const periodLabel = OFFER_PERIOD_LABELS[numeric];
  if (periodLabel) return periodLabel[language];

  const standardLabel = STANDARD_DURATION_LABELS[numeric];
  if (standardLabel) return standardLabel[language];

  const enumLabel = ENUM_DURATION_LABELS[numeric];
  if (enumLabel) return enumLabel[language];

  return language === 'ar' ? `${numeric} شهر` : `${numeric} months`;
}
