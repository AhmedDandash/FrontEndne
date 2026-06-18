/**
 * Print-receipt helpers.
 *
 * GET /print-receipt-form returns `ContractPrintReceiptData` where customerData /
 * workerData / priceDetails are open `Record<string, any>` maps (exact keys are
 * defined server-side and may evolve). To stay robust we render those sub-objects
 * generically as humanised key/value rows, plus the known top-level fields.
 *
 * Printing opens a dedicated window containing ONLY the receipt, so the print is
 * not the whole app page (the previous behaviour). Triggered from a user click,
 * so it is not blocked as an unsolicited popup.
 */
import type { ContractPrintReceiptData } from '@/types/api.types';

/** "contractStartDate" / "total_cost" → "Contract Start Date" / "Total Cost" */
function humanizeKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatValue(value: any): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? '✓' : '✗';
  // ISO date → locale date
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString();
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
  );

/** A section is rendered only when it has at least one printable entry. */
export interface ReceiptSection {
  title: string;
  rows: { label: string; value: string }[];
}

/** Build the displayable sections from the API payload (used by preview + print). */
export function toReceiptSections(
  data: ContractPrintReceiptData | null,
  isRtl: boolean
): ReceiptSection[] {
  if (!data) return [];

  const objToRows = (obj: Record<string, any> | null | undefined) =>
    obj
      ? Object.entries(obj).map(([k, v]) => ({ label: humanizeKey(k), value: formatValue(v) }))
      : [];

  const sections: ReceiptSection[] = [
    { title: isRtl ? 'بيانات العميل' : 'Customer', rows: objToRows(data.customerData) },
    { title: isRtl ? 'بيانات العامل' : 'Worker', rows: objToRows(data.workerData) },
    { title: isRtl ? 'تفاصيل التسعير' : 'Pricing', rows: objToRows(data.priceDetails) },
    {
      title: isRtl ? 'مدة العقد' : 'Contract Period',
      rows: [
        { label: isRtl ? 'المدة (أشهر)' : 'Duration (months)', value: formatValue(data.duration) },
        { label: isRtl ? 'تاريخ البداية' : 'Start Date', value: formatValue(data.contractStartDate) },
        { label: isRtl ? 'تاريخ النهاية' : 'End Date', value: formatValue(data.contractEndDate) },
      ],
    },
  ];

  return sections.filter((s) => s.rows.length > 0);
}

/** Open a print window containing only the rendered receipt. */
export function printReceipt(
  data: ContractPrintReceiptData | null,
  isRtl: boolean,
  title: string
): boolean {
  const sections = toReceiptSections(data, isRtl);
  const dir = isRtl ? 'rtl' : 'ltr';
  const lang = isRtl ? 'ar' : 'en';

  const body =
    sections.length === 0
      ? `<p>${isRtl ? 'لا توجد بيانات للطباعة' : 'No data to print'}</p>`
      : sections
          .map(
            (s) => `
        <section>
          <h2>${escapeHtml(s.title)}</h2>
          <table>
            ${s.rows
              .map(
                (r) =>
                  `<tr><th>${escapeHtml(r.label)}</th><td>${escapeHtml(r.value)}</td></tr>`
              )
              .join('')}
          </table>
        </section>`
          )
          .join('');

  const html = `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: -apple-system, 'Segoe UI', Tahoma, sans-serif; color: #1a1a2e; padding: 32px; }
    h1 { font-size: 20px; border-bottom: 2px solid #003366; padding-bottom: 8px; }
    h2 { font-size: 14px; color: #003366; margin: 20px 0 8px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: ${isRtl ? 'right' : 'left'}; padding: 6px 10px; border-bottom: 1px solid #eee; font-size: 13px; }
    th { width: 40%; color: #555; font-weight: 600; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${body}
</body>
</html>`;

  const w = window.open('', '_blank', 'width=820,height=900');
  if (!w) return false; // popup blocked
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
  return true;
}
