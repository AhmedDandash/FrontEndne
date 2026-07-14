/**
 * Shared formatters + status-badge mapping for the Sponsorship Transfer module.
 * Used by the list page (page.tsx), the extracted `SponsorshipTransferDetailView`
 * and the `[id]` route page so there is exactly one implementation.
 */

export type Language = 'ar' | 'en';

export function getStatusConfig(status: number | null | undefined) {
  const configs: Record<
    number,
    { color: 'processing' | 'warning' | 'success' | 'error' | 'default'; tagColor: string }
  > = {
    1: { color: 'warning', tagColor: 'warning' },
    4: { color: 'processing', tagColor: 'processing' },
    5: { color: 'success', tagColor: 'success' },
    6: { color: 'error', tagColor: 'error' },
    8: { color: 'success', tagColor: 'success' },
  };
  return configs[status ?? 1] ?? configs[1];
}

export function formatCurrency(amount: number | null | undefined, language: Language): string {
  return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'currency',
    currency: 'SAR',
    maximumFractionDigits: 0,
  }).format(amount ?? 0);
}

export function formatDate(dateStr: string | null | undefined, language: Language): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
