/**
 * Shared formatters + status-badge mapping for the Mediation Contracts module.
 * Extracted from page.tsx so both the list page and the extracted
 * `MediationContractDetailView` (and the `[id]` route page) share one
 * implementation instead of duplicating these closures.
 */

export type Language = 'ar' | 'en';

export function formatCurrency(amount: number | null | undefined, language: Language): string {
  if (!amount) return '0 SAR';
  return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'currency',
    currency: 'SAR',
  }).format(amount);
}

export function formatDate(dateString: string | null | undefined, language: Language): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export type StatusBadgeColor = 'processing' | 'warning' | 'success' | 'error' | 'default';

/**
 * Status codes verified live: 1=Draft, 2=Signed, 11=DeliveryFormIssued,
 * 13=Delivered, 16=Returned, 17=Cancelled.
 */
export function getStatusConfigFromName(
  statusName: string | null | undefined,
  language: Language
): { color: StatusBadgeColor; label: string } {
  const name = (statusName || '').toLowerCase();
  if (name === 'draft') return { color: 'processing', label: language === 'ar' ? 'مسودة' : 'Draft' };
  if (name === 'signed') return { color: 'success', label: language === 'ar' ? 'موقّع' : 'Signed' };
  if (name === 'deliveryformissued') {
    return { color: 'warning', label: language === 'ar' ? 'صدر نموذج الاستلام' : 'Delivery Form Issued' };
  }
  if (name === 'delivered') return { color: 'success', label: language === 'ar' ? 'مُسلَّم' : 'Delivered' };
  if (name === 'cancelled' || name === 'canceled') {
    return { color: 'error', label: language === 'ar' ? 'ملغي' : 'Cancelled' };
  }
  if (name === 'returned') return { color: 'warning', label: language === 'ar' ? 'مُرجَع' : 'Returned' };
  return { color: 'default', label: statusName || (language === 'ar' ? 'غير محدد' : 'Unknown') };
}
