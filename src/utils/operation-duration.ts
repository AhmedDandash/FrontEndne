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

export function formatOperationDuration(
  value: number | string | null | undefined,
  language: 'ar' | 'en',
  fallback?: string | null
): string {
  if (fallback) return fallback;
  if (value == null || value === '') return '—';

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);

  const periodLabel = OFFER_PERIOD_LABELS[numeric];
  if (periodLabel) return periodLabel[language];

  const standardLabel = STANDARD_DURATION_LABELS[numeric];
  if (standardLabel) return standardLabel[language];

  return language === 'ar' ? `${numeric} شهر` : `${numeric} months`;
}
