/**
 * Locale-aware formatters shared across the Operations contract components.
 */

export function formatDate(dateString: string, isRtl: boolean): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatCurrency(amount: number, isRtl: boolean): string {
  return new Intl.NumberFormat(isRtl ? 'ar-SA' : 'en-US', {
    style: 'currency',
    currency: 'SAR',
  }).format(amount);
}
