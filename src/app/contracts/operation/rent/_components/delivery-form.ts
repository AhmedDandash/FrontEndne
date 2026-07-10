/**
 * Delivery-form (worker handover) print helpers.
 *
 * GET /print-delivery-form returns an OperatingContractDeliveryFormDto with the
 * customer + worker details and three signature slots. These helpers build the
 * on-screen sections and a dedicated print window (also usable as "Save as PDF"
 * from the browser print dialog), mirroring the receipt-print pattern.
 */
import type { OperatingContractDeliveryFormDto } from '@/types/api.types';
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

export interface DeliveryFormSection {
  title: string;
  rows: { label: string; value: string }[];
}

/** Build the displayable sections from the delivery-form payload. */
export function toDeliveryFormSections(
  data: OperatingContractDeliveryFormDto | null,
  isRtl: boolean
): DeliveryFormSection[] {
  if (!data) return [];
  const customerName = isRtl ? data.customerNameAr : data.customerNameEn || data.customerNameAr;
  const workerName = isRtl ? data.workerNameAr : data.workerNameEn || data.workerNameAr;

  const sections: DeliveryFormSection[] = [
    {
      title: isRtl ? 'بيانات النموذج' : 'Form',
      rows: [
        { label: isRtl ? 'رقم العقد' : 'Contract No.', value: formatValue(data.contractNumber) },
        { label: isRtl ? 'تاريخ التسليم' : 'Delivery Date', value: formatValue(data.deliveryDate) },
        {
          label: isRtl ? 'الفرع' : 'Branch',
          value: formatValue(isRtl ? data.branchNameAr : data.branchNameEn || data.branchNameAr),
        },
        { label: isRtl ? 'اسم الموظف' : 'Employee', value: formatValue(data.employeeName) },
      ],
    },
    {
      title: isRtl ? 'بيانات العميل' : 'Customer',
      rows: [
        { label: isRtl ? 'الاسم' : 'Name', value: formatValue(customerName) },
        { label: isRtl ? 'الهاتف' : 'Phone', value: formatValue(data.customerPhone) },
        { label: isRtl ? 'الهوية' : 'National ID', value: formatValue(data.customerNationalId) },
        { label: isRtl ? 'العنوان' : 'Address', value: formatValue(data.customerAddress) },
      ],
    },
    {
      title: isRtl ? 'بيانات العامل' : 'Worker',
      rows: [
        { label: isRtl ? 'الاسم' : 'Name', value: formatValue(workerName) },
        { label: isRtl ? 'الهاتف' : 'Phone', value: formatValue(data.workerPhone) },
        { label: isRtl ? 'رقم الجواز' : 'Passport', value: formatValue(data.workerPassportNumber) },
      ],
    },
  ];

  return sections;
}

/** Open a print window containing the delivery form with signature lines. */
export function printDeliveryForm(
  data: OperatingContractDeliveryFormDto | null,
  isRtl: boolean,
  title: string
): boolean {
  if (!data) return false;
  const sections = toDeliveryFormSections(data, isRtl);
  const dir = isRtl ? 'rtl' : 'ltr';
  const lang = isRtl ? 'ar' : 'en';
  const photo = resolveImageUrl(data.workerPhotoUrl);

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
    <section class="signatures">
      <div class="sig"><div class="line"></div><span>${escapeHtml(
        isRtl ? 'توقيع العميل' : 'Customer Signature'
      )}</span></div>
      <div class="sig"><div class="line"></div><span>${escapeHtml(
        isRtl ? 'توقيع العامل' : 'Worker Signature'
      )}</span></div>
      <div class="sig"><div class="line"></div><span>${escapeHtml(
        isRtl ? 'ممثل الشركة' : 'Company Representative'
      )}</span></div>
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
    .signatures { display: flex; justify-content: space-between; margin-top: 56px; gap: 24px; }
    .sig { flex: 1; text-align: center; }
    .sig .line { border-top: 1px solid #333; margin-bottom: 6px; height: 40px; }
    .sig span { font-size: 12px; color: #555; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>
    <span>${escapeHtml(isRtl ? 'نموذج تسليم العامل' : 'Worker Delivery Form')} — ${escapeHtml(title)}</span>
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
