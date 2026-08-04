/**
 * Print-receipt helpers.
 *
 * GET /print-receipt-form returns `{ message, contract }` — the full contract
 * with GUID foreign keys but no lookup names. The page merges resolved display
 * names (customer/nationality/job) into `data.display` before rendering, and
 * these helpers build labelled sections from the contract's own fields.
 *
 * Printing opens a dedicated window containing ONLY the receipt, so the print is
 * not the whole app page (the previous behaviour). Triggered from a user click,
 * so it is not blocked as an unsolicited popup.
 */
import type { ContractPrintReceiptData } from '@/types/api.types';

const PAYMENT_METHOD_LABEL: Record<number, { ar: string; en: string }> = {
  1: { ar: 'نقدًا', en: 'Cash' },
  2: { ar: 'تحويل بنكي', en: 'Bank Transfer' },
  3: { ar: 'بطاقة', en: 'Card' },
};

function formatValue(value: any): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? '✓' : '✗';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString();
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function formatMoney(value: any, isRtl: boolean): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat(isRtl ? 'ar-SA' : 'en-US', {
    style: 'currency',
    currency: 'SAR',
  }).format(n);
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
  );

/** A section is rendered only when it has at least one meaningful (non-dash) entry. */
export interface ReceiptSection {
  title: string;
  rows: { label: string; value: string }[];
}

/** Build the displayable sections from the API payload (used by preview + print). */
export function toReceiptSections(
  data: ContractPrintReceiptData | null,
  isRtl: boolean
): ReceiptSection[] {
  if (!data || !data.contract) return [];
  const c = data.contract;
  const d = data.display || {};

  const workerName = isRtl
    ? c.workerNameAr || c.workerNameEn
    : c.workerNameEn || c.workerNameAr;

  const sections: ReceiptSection[] = [
    {
      title: isRtl ? 'بيانات العقد' : 'Contract',
      rows: [
        { label: isRtl ? 'رقم العقد' : 'Contract No.', value: formatValue(c.contractNumber) },
        {
          label: isRtl ? 'طريقة الدفع' : 'Payment Method',
          value: c.paymentMethod
            ? (isRtl ? PAYMENT_METHOD_LABEL[c.paymentMethod]?.ar : PAYMENT_METHOD_LABEL[c.paymentMethod]?.en) ||
              formatValue(c.paymentMethod)
            : '—',
        },
      ],
    },
    {
      title: isRtl ? 'بيانات العميل' : 'Customer',
      rows: [
        { label: isRtl ? 'الاسم' : 'Name', value: formatValue(d.customerName) },
        { label: isRtl ? 'الهاتف' : 'Phone', value: formatValue(d.customerPhone) },
        { label: isRtl ? 'العنوان' : 'Address', value: formatValue(c.customerAddress) },
      ],
    },
    {
      title: isRtl ? 'بيانات العامل' : 'Worker',
      rows: [
        { label: isRtl ? 'الاسم' : 'Name', value: formatValue(workerName) },
        { label: isRtl ? 'الهاتف' : 'Phone', value: formatValue(c.workerPhone) },
        { label: isRtl ? 'الجنسية' : 'Nationality', value: formatValue(d.nationalityName) },
        { label: isRtl ? 'المهنة' : 'Profession', value: formatValue(d.jobName) },
        { label: isRtl ? 'عدد العمال' : 'Workers Count', value: formatValue(c.workersCount) },
      ],
    },
    {
      title: isRtl ? 'تفاصيل التسعير' : 'Pricing',
      rows: [
        { label: isRtl ? 'التكلفة' : 'Cost', value: formatMoney(c.cost, isRtl) },
        { label: isRtl ? 'التأمين' : 'Insurance', value: formatMoney(c.insurance, isRtl) },
      ],
    },
    {
      title: isRtl ? 'مدة العقد' : 'Contract Period',
      rows: [
        {
          label: isRtl ? 'المدة' : 'Duration',
          value: formatValue((isRtl ? c.durationNameAr : c.durationNameEn) ?? c.duration),
        },
        { label: isRtl ? 'تاريخ البداية' : 'Start Date', value: formatValue(c.contractStartDate) },
        { label: isRtl ? 'تاريخ النهاية' : 'End Date', value: formatValue(c.contractEndDate) },
      ],
    },
    {
      title: isRtl ? 'الفرع' : 'Branch',
      rows: [
        {
          label: isRtl ? 'الفرع' : 'Branch',
          value: formatValue((isRtl ? c.branchNameAr : c.branchNameEn) ?? undefined),
        },
      ],
    },
  ];

  // Drop sections whose every row is a placeholder dash.
  return sections.filter((s) => s.rows.some((r) => r.value !== '—'));
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
