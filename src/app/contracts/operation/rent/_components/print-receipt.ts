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
import { formatOperationDuration } from '../../../../../utils/operation-duration.ts';

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
          value: formatOperationDuration(
            c.duration,
            isRtl ? 'ar' : 'en',
            (isRtl ? c.durationNameAr : c.durationNameEn) || null,
            { preferEnum: true }
          ),
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

const COMPANY_NAME_AR = 'شركة سيجما للاستقدام';
const COMPANY_NAME_EN = 'Sigma Recruitment Company';

/** Open a print window containing only the rendered receipt. */
export function printReceipt(
  data: ContractPrintReceiptData | null,
  isRtl: boolean,
  title: string
): boolean {
  const sections = toReceiptSections(data, isRtl);
  const dir = isRtl ? 'rtl' : 'ltr';
  const lang = isRtl ? 'ar' : 'en';
  // The print window opens blank (about:blank), so relative paths won't
  // resolve — the logo needs an absolute URL back to this app's origin.
  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/images/logo.png` : '';
  const printedAt = new Date().toLocaleString(isRtl ? 'ar-SA' : 'en-US');

  const body =
    sections.length === 0
      ? `<p class="empty">${isRtl ? 'لا توجد بيانات للطباعة' : 'No data to print'}</p>`
      : sections
          .map(
            (s) => `
        <section class="card">
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

  const signatureBlock =
    sections.length === 0
      ? ''
      : `
    <section class="signatures">
      <div class="sig">
        <div class="line"></div>
        <span class="role">${escapeHtml(isRtl ? 'توقيع العميل' : 'Customer Signature')}</span>
        <span class="hint">${escapeHtml(isRtl ? 'الاسم والتاريخ' : 'Name & Date')}</span>
      </div>
      <div class="sig">
        <div class="line"></div>
        <span class="role">${escapeHtml(isRtl ? 'ممثل الشركة' : 'Company Representative')}</span>
        <span class="hint">${escapeHtml(isRtl ? 'الاسم والتاريخ' : 'Name & Date')}</span>
      </div>
    </section>`;

  const html = `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { margin: 16mm 14mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, 'Segoe UI', Tahoma, sans-serif;
      color: #1a1a2e;
      padding: 28px;
      font-size: 13px;
    }

    /* ── Letterhead ─────────────────────────────────────────── */
    .letterhead {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      padding-bottom: 14px;
      border-bottom: 3px solid #003366;
    }
    .letterhead .brand { display: flex; align-items: center; gap: 12px; }
    .letterhead img.logo { height: 46px; width: auto; display: block; }
    .letterhead .brand-name { font-size: 15px; font-weight: 700; color: #003366; line-height: 1.3; }
    .letterhead .brand-name small { display: block; font-size: 11px; font-weight: 500; color: #667; }
    .letterhead .doc-meta { text-align: ${isRtl ? 'left' : 'right'}; }
    .letterhead .doc-title { font-size: 16px; font-weight: 700; margin: 0 0 4px; }
    .letterhead .doc-sub { font-size: 11.5px; color: #667; margin: 0; }

    h2 {
      font-size: 12.5px;
      color: #ffffff;
      background: #003366;
      margin: 0;
      padding: 6px 12px;
      border-radius: 6px 6px 0 0;
      letter-spacing: 0.02em;
    }
    section.card {
      margin-top: 16px;
      border: 1px solid #e3e6ec;
      border-radius: 6px;
      overflow: hidden;
      break-inside: avoid;
    }
    table { width: 100%; border-collapse: collapse; }
    th, td {
      text-align: ${isRtl ? 'right' : 'left'};
      padding: 7px 12px;
      border-bottom: 1px solid #eef0f4;
      font-size: 12.5px;
      font-variant-numeric: tabular-nums;
    }
    tr:last-child th, tr:last-child td { border-bottom: none; }
    tr:nth-child(even) { background: #f8f9fb; }
    th { width: 38%; color: #555; font-weight: 600; }
    .empty { text-align: center; color: #667; padding: 32px 0; }

    /* ── Signatures ─────────────────────────────────────────── */
    .signatures { display: flex; justify-content: space-between; gap: 32px; margin-top: 52px; break-inside: avoid; }
    .sig { flex: 1; text-align: center; }
    .sig .line { border-top: 1px solid #333; margin-bottom: 8px; height: 44px; }
    .sig .role { display: block; font-size: 12.5px; font-weight: 600; color: #1a1a2e; }
    .sig .hint { display: block; font-size: 10.5px; color: #889; margin-top: 2px; }

    .print-footer {
      margin-top: 28px;
      padding-top: 10px;
      border-top: 1px solid #eef0f4;
      font-size: 10px;
      color: #99a;
      display: flex;
      justify-content: space-between;
    }

    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="letterhead">
    <div class="brand">
      ${logoUrl ? `<img class="logo" src="${escapeHtml(logoUrl)}" alt="${escapeHtml(isRtl ? COMPANY_NAME_AR : COMPANY_NAME_EN)}" />` : ''}
      <span class="brand-name">
        ${escapeHtml(isRtl ? COMPANY_NAME_AR : COMPANY_NAME_EN)}
        <small>${escapeHtml(isRtl ? COMPANY_NAME_EN : COMPANY_NAME_AR)}</small>
      </span>
    </div>
    <div class="doc-meta">
      <p class="doc-title">${escapeHtml(isRtl ? 'ملخص بيانات العقد' : 'Contract Summary')}</p>
      <p class="doc-sub">${escapeHtml(title)}</p>
    </div>
  </div>
  ${body}
  ${signatureBlock}
  <div class="print-footer">
    <span>${escapeHtml(isRtl ? 'مستند صادر آليًا من النظام' : 'System-generated document')}</span>
    <span>${escapeHtml(isRtl ? 'تاريخ الطباعة: ' : 'Printed: ')}${escapeHtml(printedAt)}</span>
  </div>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=820,height=980');
  if (!w) return false; // popup blocked
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
  return true;
}
