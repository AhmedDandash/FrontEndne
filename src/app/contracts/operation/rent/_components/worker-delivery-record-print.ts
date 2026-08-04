/**
 * Signed handover receipt print helpers — mirrors delivery-form.ts's
 * architecture exactly. The one substantive difference: where the existing
 * delivery form draws an empty signature *line* to be signed in ink, this
 * renders the captured `signatureImage` above the receiver's printed name
 * and national ID.
 */
import type { WorkerDeliveryRecordPrintDto } from '@/types/api.types';
import { resolveImageUrl } from '@/utils/image';

function formatValue(value: any): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString();
  }
  return String(value);
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
  );

export interface HandoverReceiptSection {
  title: string;
  rows: { label: string; value: string }[];
}

/** Build the displayable sections from the print payload. */
export function toHandoverReceiptSections(
  data: WorkerDeliveryRecordPrintDto | null,
  isRtl: boolean
): HandoverReceiptSection[] {
  if (!data) return [];

  return [
    {
      title: isRtl ? 'بيانات العقد' : 'Contract',
      rows: [
        {
          label: isRtl ? 'رقم العقد' : 'Contract No.',
          value: formatValue(data.operationContractNumber),
        },
        { label: isRtl ? 'تاريخ التسليم' : 'Delivery Date', value: formatValue(data.deliveryDate) },
        {
          label: isRtl ? 'الفرع' : 'Branch',
          value: formatValue(isRtl ? data.branchNameAr : data.branchNameEn || data.branchNameAr),
        },
      ],
    },
    {
      title: isRtl ? 'بيانات العميل' : 'Customer',
      rows: [
        { label: isRtl ? 'الاسم' : 'Name', value: formatValue(data.customerName) },
        { label: isRtl ? 'الهاتف' : 'Phone', value: formatValue(data.customerPhone) },
        { label: isRtl ? 'الهوية' : 'National ID', value: formatValue(data.customerNationalId) },
      ],
    },
    {
      title: isRtl ? 'بيانات العامل' : 'Worker',
      rows: [
        { label: isRtl ? 'الاسم' : 'Name', value: formatValue(data.workerName) },
        { label: isRtl ? 'رقم الجواز' : 'Passport', value: formatValue(data.workerPassportNumber) },
      ],
    },
    {
      title: isRtl ? 'بيانات المستلم' : 'Receiver',
      rows: [
        { label: isRtl ? 'الاسم' : 'Name', value: formatValue(data.receiverName) },
        { label: isRtl ? 'رقم الهوية' : 'National ID', value: formatValue(data.receiverNationalId) },
      ],
    },
  ];
}

/** Open a print window containing the signed handover receipt. */
export function printHandoverReceipt(
  data: WorkerDeliveryRecordPrintDto | null,
  isRtl: boolean,
  title: string
): boolean {
  if (!data) return false;
  const sections = toHandoverReceiptSections(data, isRtl);
  const dir = isRtl ? 'rtl' : 'ltr';
  const lang = isRtl ? 'ar' : 'en';
  const photo = resolveImageUrl(data.workerImageUrl);
  const signature = data.signatureImage || null;

  const sectionsHtml = sections
    .map(
      (s) => `
      <section>
        <h2>${escapeHtml(s.title)}</h2>
        <table>
          ${s.rows
            .map((r) => `<tr><th>${escapeHtml(r.label)}</th><td>${escapeHtml(r.value)}</td></tr>`)
            .join('')}
        </table>
      </section>`
    )
    .join('');

  const signatureBlock = `
    <section class="signature-block">
      <h2>${escapeHtml(isRtl ? 'توقيع المستلم' : 'Receiver Signature')}</h2>
      ${
        signature
          ? `<img class="signature-img" src="${escapeHtml(signature)}" alt="signature" />`
          : `<div class="sig-line"></div>`
      }
      <div class="sig-caption">
        ${escapeHtml(formatValue(data.receiverName))} — <span dir="ltr">${escapeHtml(
    formatValue(data.receiverNationalId)
  )}</span>
      </div>
    </section>`;

  const html = `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: -apple-system, 'Segoe UI', Tahoma, sans-serif; color: #1a1a2e; padding: 32px; }
    h1 { font-size: 20px; border-bottom: 2px solid #003366; padding-bottom: 8px; display:flex; justify-content:space-between; align-items:center; }
    h2 { font-size: 14px; color: #003366; margin: 20px 0 8px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: ${isRtl ? 'right' : 'left'}; padding: 6px 10px; border-bottom: 1px solid #eee; font-size: 13px; }
    th { width: 40%; color: #555; font-weight: 600; }
    .worker-photo { width: 96px; height: 96px; object-fit: cover; border-radius: 8px; }
    .signature-block { margin-top: 40px; text-align: center; }
    .signature-img { max-width: 280px; max-height: 120px; border-bottom: 1px solid #333; }
    .sig-line { border-top: 1px solid #333; width: 280px; height: 60px; margin: 0 auto; }
    .sig-caption { margin-top: 8px; font-size: 12px; color: #555; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>
    <span>${escapeHtml(isRtl ? 'إيصال استلام موقّع' : 'Signed Handover Receipt')} — ${escapeHtml(title)}</span>
    ${photo ? `<img class="worker-photo" src="${escapeHtml(photo)}" alt="worker" />` : ''}
  </h1>
  ${sectionsHtml}
  ${data.notes ? `<section><h2>${escapeHtml(isRtl ? 'ملاحظات' : 'Notes')}</h2><p>${escapeHtml(data.notes)}</p></section>` : ''}
  ${signatureBlock}
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
