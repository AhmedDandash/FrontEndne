/**
 * PDF / Print utilities.
 *
 * Uses window.open() + window.print() instead of pdfmake so that:
 *  - Arabic text is rendered by the browser's own text engine (correct
 *    character shaping, ligatures, RTL direction) — no font embedding needed.
 *  - The Amiri font is loaded from /public/fonts/ via a CSS @font-face rule.
 *  - No VFS / base64 / pdfmake initialisation complexity.
 *
 * The browser's Print → Save as PDF dialog produces a properly formatted PDF.
 */

import type { Worker } from '@/types/api.types';

// ─── Enum maps (bilingual) ────────────────────────────────────────────────────

const GENDER_MAP: Record<number, [string, string]> = {
  0: ['Male', 'ذكر'],
  1: ['Female', 'أنثى'],
};
const MARITAL_MAP: Record<number, [string, string]> = {
  1: ['Single', 'أعزب / أعزبة'],
  2: ['Married', 'متزوج / متزوجة'],
  3: ['Divorced', 'مطلق / مطلقة'],
  4: ['Widowed', 'أرمل / أرملة'],
};
const RELIGION_MAP: Record<number, [string, string]> = {
  1: ['Muslim', 'مسلم'],
  2: ['Non-Muslim', 'غير مسلم'],
};
const WORKER_TYPE_MAP: Record<number, [string, string]> = {
  1: ['Mediation', 'التوسط'],
  2: ['Operation', 'التشغيل'],
  3: ['Sponsorship Transfer', 'نقل الكفالة'],
};
const WORKER_STATUS_MAP: Record<number, [string, string]> = {
  1: ['Available', 'متاح'],
  2: ['Trial Worker', 'مرحلة التجربة'],
  3: ['Under Procedure', 'تحت الإجراء'],
  4: ['Backout', 'انسحاب'],
  5: ['Inside Kingdom', 'داخل المملكة'],
  6: ['Deported', 'مرحّل'],
};

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

const enOf = (m: Record<number, [string, string]>, v?: number | null) =>
  v != null ? (m[v]?.[0] ?? '-') : '-';
const arOf = (m: Record<number, [string, string]>, v?: number | null) =>
  v != null ? (m[v]?.[1] ?? '-') : '-';
const s = (v: string | number | boolean | null | undefined) =>
  v != null && v !== '' ? String(v) : '-';
const d = (v?: string | null) => (v ? v.split('T')[0] : '-');

/** Sanitise the worker's English name into a safe filename */
export const sanitizeName = (name: string) =>
  name.trim().replace(/\s+/g, '_').replace(/[^\w.-]/g, '') || 'Worker';

// ─── Shared CSS embedded in every print window ────────────────────────────────

const SHARED_CSS = `
  @font-face {
    font-family: 'Amiri';
    src: url('/fonts/Amiri-Regular.ttf') format('truetype');
    font-weight: 400;
    font-style: normal;
  }
  @font-face {
    font-family: 'Amiri';
    src: url('/fonts/Amiri-Bold.ttf') format('truetype');
    font-weight: 700;
    font-style: normal;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Amiri', 'Segoe UI', Tahoma, Arial, sans-serif;
    font-size: 10pt;
    color: #1e293b;
    background: #fff;
  }

  @media print {
    body { margin: 0; }
    .no-print { display: none !important; }
    @page { size: A4; margin: 15mm 12mm; }
  }
`;

// ─── CV HTML builder ─────────────────────────────────────────────────────────

function row(labelEn: string, valueEn: string, valueAr: string, labelAr: string): string {
  return `
    <tr>
      <td class="label-en">${labelEn}</td>
      <td class="val-en">${valueEn}</td>
      <td class="val-ar">${valueAr}</td>
      <td class="label-ar">${labelAr}</td>
    </tr>`;
}

function section(titleEn: string, titleAr: string, rows: string): string {
  return `
    <div class="section">
      <div class="section-header">
        <span class="sh-en">${titleEn}</span>
        <span class="sh-ar">${titleAr}</span>
      </div>
      <table class="data-table">${rows}</table>
    </div>`;
}

function buildCVHtml(worker: Worker): string {
  const nameEn = s(worker.fullNameEn || worker.fullNameAr);
  const nameAr = s(worker.fullNameAr || worker.fullNameEn);
  const printDate = new Date().toLocaleString('en-GB');

  const personalRows = [
    row('Gender', enOf(GENDER_MAP, worker.gender), arOf(GENDER_MAP, worker.gender), 'الجنس'),
    row('Age', worker.age != null ? `${worker.age} years` : '-', worker.age != null ? `${worker.age} سنة` : '-', 'العمر'),
    row('Birth Date', d(worker.birthDate), d(worker.birthDate), 'تاريخ الميلاد'),
    row('Marital Status', enOf(MARITAL_MAP, worker.maritalStatus), arOf(MARITAL_MAP, worker.maritalStatus), 'الحالة الاجتماعية'),
    row('Children', s(worker.childrenCount), s(worker.childrenCount), 'عدد الأطفال'),
    row('Nationality', s(worker.nationalityName || worker.nationalityId), s(worker.nationalityName || worker.nationalityId), 'الجنسية'),
    row('Religion', enOf(RELIGION_MAP, worker.religion), arOf(RELIGION_MAP, worker.religion), 'الديانة'),
    row('Weight', worker.weight != null ? `${worker.weight} kg` : '-', worker.weight != null ? `${worker.weight} كجم` : '-', 'الوزن'),
    row('Height', worker.height != null ? `${worker.height} cm` : '-', worker.height != null ? `${worker.height} سم` : '-', 'الطول'),
    row('Education', s(worker.educationLevelEn), s(worker.educationLevelAr), 'التعليم'),
    row('Experience', worker.hasExperience ? 'Yes' : 'No', worker.hasExperience ? 'نعم' : 'لا', 'خبرة سابقة'),
    row('National ID', s(worker.nationalId), s(worker.nationalId), 'رقم الهوية'),
  ].join('');

  const passportRows = [
    row('Passport No.', s(worker.passportNo), s(worker.passportNo), 'رقم الجواز'),
    row('Issue Date', d(worker.passportIssueDate), d(worker.passportIssueDate), 'تاريخ الإصدار'),
    row('Expiry Date', d(worker.passportExpiryDate), d(worker.passportExpiryDate), 'تاريخ الانتهاء'),
    row('Issue Place', s(worker.passportIssuePlaceEn), s(worker.passportIssuePlaceAr), 'مكان الإصدار'),
  ].join('');

  const workRows = [
    row('Job', s(worker.jobName || worker.jobname), s(worker.jobName || worker.jobname), 'الوظيفة'),
    row('Basic Salary', s(worker.basicSalary), s(worker.basicSalary), 'الراتب الأساسي'),
    row('Worker Type', enOf(WORKER_TYPE_MAP, worker.workerType), arOf(WORKER_TYPE_MAP, worker.workerType), 'نوع العقد'),
    row('Agent', s(worker.agentName), s(worker.agentName), 'الوكيل'),
    row('Status', enOf(WORKER_STATUS_MAP, worker.workerStatus), arOf(WORKER_STATUS_MAP, worker.workerStatus), 'الحالة'),
    row('Box Number', s(worker.boxNumber), s(worker.boxNumber), 'رقم الصندوق'),
    row('Border Number', s(worker.borderNumber), s(worker.borderNumber), 'رقم الحدود'),
  ].join('');

  const contactRows = [
    row('Mobile', s(worker.mobile), s(worker.mobile), 'الجوال'),
    row('Phone', s(worker.phone), s(worker.phone), 'الهاتف'),
    row('Address', s(worker.addressEn), s(worker.addressAr), 'العنوان'),
  ].join('');

  const skillsSection = worker.skills
    ? `<div class="section">
         <div class="section-header"><span class="sh-en">Skills</span><span class="sh-ar">المهارات</span></div>
         <p class="skills-text">${s(worker.skills)}</p>
       </div>`
    : '';

  const extraDocs = worker.attachments ?? [];
  const docsSection = extraDocs.length > 0
    ? `<div class="section">
         <div class="section-header"><span class="sh-en">Documents</span><span class="sh-ar">الوثائق</span></div>
         <div style="display:flex;flex-wrap:wrap;gap:8px;padding:6px;">
           ${extraDocs.map((src, i) => {
             const isPdf = src.startsWith('data:application/pdf') || src.endsWith('.pdf');
             return isPdf
               ? `<div style="width:120px;height:120px;border-radius:6px;border:1px solid #e2e8f0;background:#fff0f0;display:flex;align-items:center;justify-content:center;font-size:12px;color:#e53e3e;">PDF ${i + 1}</div>`
               : `<img src="${src}" alt="Doc ${i + 1}" style="width:120px;height:120px;object-fit:cover;border-radius:6px;border:1px solid #e2e8f0;" />`;
           }).join('')}
         </div>
       </div>`
    : '';

  const photoSection = worker.uploadImage
    ? `<img class="worker-photo" src="${worker.uploadImage}" alt="Worker photo" />`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${nameEn} — CV</title>
  <style>
    ${SHARED_CSS}

    .cv-header {
      background: #003366;
      color: #fff;
      padding: 18px 20px 14px;
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 16px;
    }
    .worker-photo {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid #93c5fd;
      flex-shrink: 0;
    }
    .header-text { flex: 1; }
    .header-names {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 12px;
    }
    .name-en { font-size: 17pt; font-weight: 700; color: #fff; }
    .name-ar { font-size: 16pt; font-weight: 700; color: #fff; direction: rtl; }
    .header-meta {
      font-size: 8pt;
      color: #93c5fd;
      margin-top: 6px;
      display: flex;
      justify-content: space-between;
    }
    .header-sub { color: #bfdbfe; font-size: 8pt; }

    .section { margin-bottom: 12px; page-break-inside: avoid; }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 3px 6px;
      background: #f0f6ff;
      border-left: 4px solid #003366;
      margin-bottom: 4px;
    }
    .sh-en { font-weight: 700; font-size: 9.5pt; color: #003366; }
    .sh-ar { font-weight: 700; font-size: 9.5pt; color: #003366; direction: rtl; }

    .data-table { width: 100%; border-collapse: collapse; }
    .data-table tr:nth-child(even) td { background: #f8faff; }
    .data-table td { padding: 3px 6px; font-size: 9pt; border-bottom: 1px solid #e2e8f0; }
    .label-en { font-weight: 700; width: 22%; color: #374151; white-space: nowrap; }
    .val-en    { width: 28%; color: #6b7280; }
    .val-ar    { width: 28%; color: #6b7280; text-align: right; direction: rtl; }
    .label-ar  { font-weight: 700; width: 22%; color: #374151; text-align: right; direction: rtl; white-space: nowrap; }

    .skills-text { font-size: 9pt; color: #6b7280; padding: 4px 6px; }

    .print-footer {
      margin-top: 20px;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      font-size: 7.5pt;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }

    /* Print button — hidden when printing */
    .print-btn {
      display: block;
      margin: 16px auto;
      padding: 10px 28px;
      background: #003366;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 11pt;
      cursor: pointer;
      font-family: inherit;
    }
  </style>
</head>
<body>
  <!-- Print Button (hidden when printing) -->
  <button class="print-btn no-print" onclick="window.print()">🖨️ Print / Save as PDF</button>

  <!-- Header -->
  <div class="cv-header">
    ${photoSection}
    <div class="header-text">
      <div class="header-names">
        <span class="name-en">${nameEn}</span>
        <span class="name-ar">${nameAr}</span>
      </div>
      <div class="header-meta">
        <span>Ref: ${s(worker.referenceNo)} &nbsp;|&nbsp; Passport: ${s(worker.passportNo)}</span>
        <span class="header-sub">${enOf(WORKER_TYPE_MAP, worker.workerType)} &nbsp;·&nbsp; ${enOf(WORKER_STATUS_MAP, worker.workerStatus)}</span>
      </div>
    </div>
  </div>

  ${section('Personal Information', 'البيانات الشخصية', personalRows)}
  ${section('Passport Details', 'بيانات الجواز', passportRows)}
  ${section('Work Details', 'بيانات العمل', workRows)}
  ${section('Contact & Address', 'التواصل والعنوان', contactRows)}
  ${skillsSection}
  ${docsSection}

  <div class="print-footer">
    <span>Printed: ${printDate}</span>
    <span>${nameEn} — Applicant CV</span>
  </div>
</body>
</html>`;
}

// ─── Print All HTML builder ───────────────────────────────────────────────────

function buildListHtml(workers: Worker[]): string {
  const now = new Date().toLocaleString('en-GB');

  const tableRows = workers
    .map(
      (w, i) => `
      <tr>
        <td class="num">${i + 1}</td>
        <td>${s(w.fullNameEn || w.fullNameAr)}</td>
        <td class="ar">${s(w.fullNameAr || w.fullNameEn)}</td>
        <td>${s(w.passportNo)}</td>
        <td>${s(w.nationalityName || w.nationalityId)}</td>
        <td class="center">${w.age != null ? w.age : '-'}</td>
        <td>${s(w.jobName || w.jobname)}</td>
        <td>${s(w.agentName)}</td>
        <td>${enOf(WORKER_TYPE_MAP, w.workerType)}</td>
        <td class="ar">${arOf(WORKER_TYPE_MAP, w.workerType)}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Available Workers</title>
  <style>
    ${SHARED_CSS}

    @media print { @page { size: A4 landscape; margin: 10mm; } }

    body { font-size: 9pt; }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #003366;
      padding-bottom: 6px;
      margin-bottom: 12px;
    }
    .list-title-en { font-size: 14pt; font-weight: 700; color: #003366; }
    .list-title-ar { font-size: 14pt; font-weight: 700; color: #003366; direction: rtl; }
    .list-meta { font-size: 8pt; color: #64748b; margin-top: 3px; }

    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #003366; color: #fff; }
    thead th { padding: 5px 6px; font-size: 8pt; text-align: left; white-space: nowrap; }
    tbody tr:nth-child(even) { background: #f0f6ff; }
    tbody td { padding: 4px 6px; border-bottom: 1px solid #e2e8f0; }
    .num { text-align: center; color: #64748b; width: 24px; }
    .center { text-align: center; }
    .ar { direction: rtl; text-align: right; }

    .print-btn {
      display: block;
      margin: 0 0 14px auto;
      padding: 8px 22px;
      background: #003366;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 10pt;
      cursor: pointer;
      font-family: inherit;
    }
    .footer {
      margin-top: 12px;
      font-size: 7.5pt;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨️ Print / Save as PDF</button>

  <div class="list-header">
    <div>
      <div class="list-title-en">Available Workers List</div>
      <div class="list-meta">Total: ${workers.length} &nbsp;|&nbsp; Printed: ${now}</div>
    </div>
    <div class="list-title-ar">قائمة العمالة المتاحة</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Name (EN)</th>
        <th>الاسم</th>
        <th>Passport</th>
        <th>Nationality</th>
        <th>Age</th>
        <th>Job</th>
        <th>Agent</th>
        <th>Type</th>
        <th>النوع</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>

  <div class="footer">
    <span>Printed: ${now}</span>
    <span>Available Workers — ${workers.length} records</span>
  </div>
</body>
</html>`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Open a print-ready bilingual CV in a new tab. */
export async function printWorkerCVPDF(worker: Worker): Promise<void> {
  const html = buildCVHtml(worker);
  const win = window.open('', '_blank');
  if (!win) {
    alert('Please allow pop-ups for this site to enable printing.');
    return;
  }
  win.document.write(html);
  win.document.close();
  // Wait for fonts before auto-printing
  win.document.fonts.ready.then(() => win.print());
}

/** Open a print-ready list of all provided workers in a new tab. */
export async function printAllWorkersPDF(workers: Worker[]): Promise<void> {
  const html = buildListHtml(workers);
  const win = window.open('', '_blank');
  if (!win) {
    alert('Please allow pop-ups for this site to enable printing.');
    return;
  }
  win.document.write(html);
  win.document.close();
  win.document.fonts.ready.then(() => win.print());
}
