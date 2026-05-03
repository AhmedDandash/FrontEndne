/**
 * PDF / Print utilities.
 *
 * Single CV   → html2canvas + jsPDF → direct file download (no new tab).
 * Worker list → window.open + window.print (print dialog in a new tab).
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import type { Worker } from '@/types/api.types';

// ─── Enum maps (bilingual) ────────────────────────────────────────────────────

const GENDER_MAP: Record<number, [string, string]> = {
  0: ['Male', 'ذكر'],
  1: ['Female', 'أنثى'],
};
const MARITAL_MAP: Record<number, [string, string]> = {
  1: ['Single', 'أعزب'],
  2: ['Married', 'متزوج'],
  3: ['Divorced', 'مطلق'],
  4: ['Widowed', 'أرمل'],
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const enOf = (m: Record<number, [string, string]>, v?: number | null) =>
  v != null ? (m[v]?.[0] ?? '-') : '-';
const s = (v: string | number | boolean | null | undefined) =>
  v != null && v !== '' ? String(v) : '-';
const d = (v?: string | null) => (v ? v.split('T')[0] : '-');

export const sanitizeName = (name: string) =>
  name.trim().replace(/\s+/g, '_').replace(/[^\w.-]/g, '') || 'Worker';

/** Convert a Blob / File to a base64 data-URL. */
async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

/**
 * Resolve any image source to a base64 data-URL.
 * Remote R2 URLs are routed through /api/proxy-image so CORS is never an issue.
 */
async function resolveSrc(src: string | File | null | undefined): Promise<string | null> {
  if (!src) return null;
  if (src instanceof File) return blobToDataUrl(src);
  if (src.startsWith('data:')) return src;

  // Proxy remote URLs through Next.js API route (no CORS restrictions server-side)
  const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(src)}`;
  try {
    const res = await fetch(proxyUrl);
    if (res.ok) return blobToDataUrl(await res.blob());
  } catch { /* network error */ }

  return src; // last resort: embed URL directly
}

// ─── CV HTML builder — matches cvtemplate.pdf layout ─────────────────────────

interface ResolvedWorker extends Omit<Worker, 'uploadImage' | 'attachments'> {
  uploadImage:  string | null;
  attachments:  string[];
}

function buildCVHtml(worker: ResolvedWorker): string {
  const nameEn   = s(worker.fullNameEn || worker.fullNameAr);
  const nameAr   = s(worker.fullNameAr || worker.fullNameEn);
  const refNo    = s(worker.referenceNo);
  const printDate = new Date().toLocaleDateString('en-GB');

  // Profile photo
  const photoHtml = worker.uploadImage
    ? `<img class="worker-photo" src="${worker.uploadImage}" crossorigin="anonymous" alt="profile" />`
    : `<div class="photo-placeholder">No Photo</div>`;

  // Salary formatted
  const salary =
    worker.basicSalary != null
      ? Number(worker.basicSalary).toLocaleString('en', { minimumFractionDigits: 2 })
      : '-';

  // Skills → comma/newline separated → checkbox grid
  const skillList: string[] = worker.skills
    ? worker.skills.split(/[,،\n]/).map(sk => sk.trim()).filter(Boolean)
    : [];

  const skillsGrid =
    skillList.length > 0
      ? skillList
          .map(sk => `<div class="skill-item"><span class="chk">&#10003;</span><span>${sk}</span></div>`)
          .join('')
      : `<div class="skill-item" style="color:#94a3b8;">—</div>`;

  // Photo attachments at end (skip PDFs / non-images)
  const photoAttachments = worker.attachments.filter(src => {
    const lower = src.toLowerCase();
    return (
      lower.startsWith('data:image') ||
      /\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/.test(lower)
    );
  });

  const attachmentsSection =
    photoAttachments.length > 0
      ? `<div class="sec-block">
          <div class="sec-title">
            <span>Attachments</span>
            <span class="ar">المرفقات</span>
          </div>
          <div class="attachments-grid">
            ${photoAttachments
              .map(
                (src, i) =>
                  `<img src="${src}" crossorigin="anonymous" alt="Attachment ${i + 1}" class="att-img" />`
              )
              .join('')}
          </div>
        </div>`
      : '';

  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="UTF-8" />
<title>${nameEn} — CV</title>
<style>
  @font-face {
    font-family: 'Amiri';
    src: url('/fonts/Amiri-Regular.ttf') format('truetype');
    font-weight: 400;
  }
  @font-face {
    font-family: 'Amiri';
    src: url('/fonts/Amiri-Bold.ttf') format('truetype');
    font-weight: 700;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Amiri', 'Segoe UI', Arial, sans-serif;
    font-size: 9pt;
    color: #1e293b;
    background: #fff;
    width: 794px;
  }

  /* ── Reference bar ── */
  .ref-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #003366;
    color: #fff;
    padding: 5px 14px;
    font-size: 8.5pt;
  }
  .ref-bar-left  { font-weight: 700; letter-spacing: .4px; }
  .ref-bar-right { font-weight: 700; direction: rtl; font-family: 'Amiri', Arial, sans-serif; }

  /* ── Worker header card ── */
  .worker-card {
    display: flex;
    align-items: stretch;
    gap: 14px;
    padding: 10px 14px;
    background: #f0f5ff;
    border-bottom: 2px solid #003366;
  }
  .worker-photo {
    width: 95px;
    height: 115px;
    object-fit: cover;
    border: 2px solid #003366;
    flex-shrink: 0;
  }
  .photo-placeholder {
    width: 95px;
    height: 115px;
    border: 2px solid #003366;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #e2e8f0;
    font-size: 8pt;
    color: #94a3b8;
    flex-shrink: 0;
  }
  .worker-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .name-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 8px;
  }
  .name-en { font-size: 14pt; font-weight: 700; color: #003366; }
  .name-ar-wrap { text-align: right; }
  .name-ar    { font-size: 13pt; font-weight: 700; color: #003366; direction: rtl; font-family: 'Amiri', Arial; }
  .name-label { font-size: 7pt; color: #64748b; direction: rtl; font-family: 'Amiri', Arial; }

  /* Quick info pills */
  .pills-row { display: flex; gap: 6px; flex-wrap: wrap; }
  .pill {
    background: #fff;
    border: 1px solid #003366;
    border-radius: 3px;
    padding: 3px 8px;
    min-width: 78px;
    text-align: center;
  }
  .pill-en  { display: block; font-size: 7pt;   color: #64748b; }
  .pill-val { display: block; font-size: 8.5pt; font-weight: 700; color: #003366; }
  .pill-ar  { display: block; font-size: 7pt;   color: #64748b; direction: rtl; font-family: 'Amiri', Arial; }

  /* ── Two-column panel ── */
  .two-col { display: flex; border: 1px solid #cbd5e1; }
  .col-left  { flex: 1; border-right: 2px solid #003366; }
  .col-right { flex: 1; }

  /* ── Section title bar ── */
  .sec-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #003366;
    color: #fff;
    padding: 4px 8px;
    font-size: 8.5pt;
    font-weight: 700;
  }
  .sec-title .ar { direction: rtl; font-family: 'Amiri', Arial; }

  /* ── Data table ── */
  .dt { width: 100%; border-collapse: collapse; }
  .dt tr:nth-child(even) td { background: #f8fafc; }
  .dt td {
    padding: 3.5px 7px;
    border-bottom: 1px solid #e2e8f0;
    font-size: 8.5pt;
    vertical-align: middle;
  }
  .lbl    { font-weight: 700; color: #374151; white-space: nowrap; width: 36%; }
  .val    { color: #1e293b; width: 30%; }
  .lbl-ar {
    font-weight: 700;
    color: #374151;
    white-space: nowrap;
    width: 34%;
    text-align: right;
    direction: rtl;
    font-family: 'Amiri', Arial;
  }

  /* ── Section block (full-width) ── */
  .sec-block { border: 1px solid #cbd5e1; border-top: none; }

  /* ── Experience table ── */
  .exp-tbl { width: 100%; border-collapse: collapse; }
  .exp-tbl th {
    background: #e8eef8;
    padding: 3px 8px;
    font-size: 8pt;
    font-weight: 700;
    text-align: left;
    border-bottom: 1px solid #cbd5e1;
  }
  .exp-tbl td { padding: 3px 8px; font-size: 8.5pt; border-bottom: 1px solid #e2e8f0; }
  .exp-note   { padding: 5px 8px; font-size: 8.5pt; color: #64748b; }

  /* ── Skills grid ── */
  .skills-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    padding: 8px 10px;
  }
  .skill-item { display: flex; align-items: center; gap: 5px; font-size: 8.5pt; }
  .chk        { color: #003366; font-weight: 700; font-size: 11pt; line-height: 1; }

  /* ── Attachments ── */
  .attachments-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 12px;
  }
  .att-img {
    width: 100%;
    height: auto;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    display: block;
  }

  /* ── Remarks / Footer ── */
  .remarks-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 14px;
    border-top: 2px solid #003366;
    margin-top: 4px;
    font-size: 8pt;
    color: #64748b;
  }
  .remarks-ar { direction: rtl; font-family: 'Amiri', Arial; }

  @media print {
    body { margin: 0; }
    .no-print { display: none !important; }
    @page { size: A4; margin: 10mm; }
  }
</style>
</head>
<body>

<!-- ① Reference number bar -->
<div class="ref-bar">
  <span class="ref-bar-left">Reference Number: ${refNo} &nbsp;|&nbsp; Passport: ${s(worker.passportNo)}</span>
  <span class="ref-bar-right">رقم المرجع &nbsp;|&nbsp; رقم الجواز</span>
</div>

<!-- ② Worker header card -->
<div class="worker-card">
  ${photoHtml}
  <div class="worker-details">
    <div class="name-row">
      <span class="name-en">${nameEn}</span>
      <div class="name-ar-wrap">
        <span class="name-ar">${nameAr}</span><br/>
        <span class="name-label">الاسم</span>
      </div>
    </div>
    <div class="pills-row">
      <div class="pill">
        <span class="pill-en">Religion</span>
        <span class="pill-val">${enOf(RELIGION_MAP, worker.religion)}</span>
        <span class="pill-ar">الديانة</span>
      </div>
      <div class="pill">
        <span class="pill-en">Position Desired</span>
        <span class="pill-val">${s(worker.jobName || worker.jobname)}</span>
        <span class="pill-ar">الوظيفة</span>
      </div>
      <div class="pill">
        <span class="pill-en">Salary</span>
        <span class="pill-val">${salary}</span>
        <span class="pill-ar">الراتب</span>
      </div>
      <div class="pill">
        <span class="pill-en">Age</span>
        <span class="pill-val">${s(worker.age)}</span>
        <span class="pill-ar">العمر</span>
      </div>
      <div class="pill">
        <span class="pill-en">Sex</span>
        <span class="pill-val">${enOf(GENDER_MAP, worker.gender)}</span>
        <span class="pill-ar">الجنس</span>
      </div>
    </div>
  </div>
</div>

<!-- ③ Personal Info + Passport Info two-column -->
<div class="two-col">
  <div class="col-left">
    <div class="sec-title">
      <span>Personal Information</span>
      <span class="ar">معلومات شخصية</span>
    </div>
    <table class="dt">
      <tr><td class="lbl">Nationality</td>   <td class="val">${s(worker.nationalityName || worker.nationalityId)}</td><td class="lbl-ar">الجنسية</td></tr>
      <tr><td class="lbl">Date of Birth</td> <td class="val">${d(worker.birthDate)}</td>                               <td class="lbl-ar">تاريخ الميلاد</td></tr>
      <tr><td class="lbl">Address</td>       <td class="val">${s(worker.addressEn || worker.addressAr)}</td>            <td class="lbl-ar">العنوان</td></tr>
      <tr><td class="lbl">Marital Status</td><td class="val">${enOf(MARITAL_MAP, worker.maritalStatus)}</td>            <td class="lbl-ar">الحالة الاجتماعية</td></tr>
      <tr><td class="lbl">No. of Children</td><td class="val">${s(worker.childrenCount)}</td>                          <td class="lbl-ar">عدد الأطفال</td></tr>
      <tr><td class="lbl">Next of Kin</td>   <td class="val">${s(worker.relativeNameEn || worker.relativeNameAr)}</td> <td class="lbl-ar">اسم الشخص القريب</td></tr>
      <tr><td class="lbl">Next of Kin No.</td><td class="val">${s(worker.relativeMobile)}</td>                         <td class="lbl-ar">رقم القريب</td></tr>
      <tr><td class="lbl">Height / Weight</td><td class="val">${worker.height != null ? worker.height : '-'} / ${worker.weight != null ? worker.weight : '-'}</td><td class="lbl-ar">الطول / الوزن</td></tr>
      <tr><td class="lbl">Education</td>     <td class="val">${s(worker.educationLevelEn || worker.educationLevelAr)}</td><td class="lbl-ar">المستوى التعليمي</td></tr>
      <tr><td class="lbl">Tel. Number</td>   <td class="val">${s(worker.mobile || worker.phone)}</td>                  <td class="lbl-ar">رقم التواصل</td></tr>
    </table>
  </div>

  <div class="col-right">
    <div class="sec-title">
      <span>Passport Information</span>
      <span class="ar">معلومات الجواز</span>
    </div>
    <table class="dt">
      <tr><td class="lbl">Number</td>     <td class="val">${s(worker.passportNo)}</td>                                      <td class="lbl-ar">الرقم</td></tr>
      <tr><td class="lbl">Issue Date</td> <td class="val">${d(worker.passportIssueDate)}</td>                                <td class="lbl-ar">تاريخ الإصدار</td></tr>
      <tr><td class="lbl">Expiry Date</td><td class="val">${d(worker.passportExpiryDate)}</td>                               <td class="lbl-ar">تاريخ الانتهاء</td></tr>
      <tr><td class="lbl">Issue Place</td><td class="val">${s(worker.passportIssuePlaceEn || worker.passportIssuePlaceAr)}</td><td class="lbl-ar">مكان الإصدار</td></tr>
    </table>
  </div>
</div>

<!-- ④ Overseas Experience -->
<div class="sec-block">
  <div class="sec-title">
    <span>Overseas Experience</span>
    <span class="ar">الخبرات السابقة</span>
  </div>
  ${
    worker.hasExperience
      ? `<table class="exp-tbl">
          <thead><tr><th>Country</th><th>Duration (Yrs)</th><th>Period</th></tr></thead>
          <tbody><tr><td>—</td><td>—</td><td>—</td></tr></tbody>
        </table>`
      : `<div class="exp-note">No overseas experience recorded.</div>`
  }
</div>

<!-- ⑤ Skills -->
<div class="sec-block">
  <div class="sec-title">
    <span>Skills</span>
    <span class="ar">المهارات</span>
  </div>
  <div class="skills-grid">${skillsGrid}</div>
</div>

<!-- ⑥ Photo Attachments -->
${attachmentsSection}

<!-- ⑦ Remarks / date footer -->
<div class="remarks-row">
  <span>Remarks:</span>
  <span>${printDate}</span>
  <span class="remarks-ar">ملاحظات</span>
</div>

</body>
</html>`;
}

// ─── Print All HTML builder ───────────────────────────────────────────────────

function buildListHtml(workers: Worker[]): string {
  const now = new Date().toLocaleString('en-GB');

  const SHARED_CSS = `
    @font-face { font-family:'Amiri'; src:url('/fonts/Amiri-Regular.ttf') format('truetype'); font-weight:400; }
    @font-face { font-family:'Amiri'; src:url('/fonts/Amiri-Bold.ttf')    format('truetype'); font-weight:700; }
    *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:'Amiri','Segoe UI',Arial,sans-serif; font-size:9pt; color:#1e293b; background:#fff; }
    @media print { body{margin:0;} .no-print{display:none!important;} @page{size:A4 landscape;margin:10mm;} }
  `;

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
    body { font-size: 9pt; }
    .list-header { display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #003366; padding-bottom:6px; margin-bottom:12px; }
    .list-title-en { font-size:14pt; font-weight:700; color:#003366; }
    .list-title-ar { font-size:14pt; font-weight:700; color:#003366; direction:rtl; font-family:'Amiri',Arial; }
    .list-meta { font-size:8pt; color:#64748b; margin-top:3px; }
    table { width:100%; border-collapse:collapse; }
    thead tr { background:#003366; color:#fff; }
    thead th { padding:5px 6px; font-size:8pt; text-align:left; white-space:nowrap; }
    tbody tr:nth-child(even) { background:#f0f6ff; }
    tbody td { padding:4px 6px; border-bottom:1px solid #e2e8f0; }
    .num { text-align:center; color:#64748b; width:24px; }
    .center { text-align:center; }
    .ar { direction:rtl; text-align:right; font-family:'Amiri',Arial; }
    .print-btn { display:block; margin:0 0 14px auto; padding:8px 22px; background:#003366; color:#fff; border:none; border-radius:6px; font-size:10pt; cursor:pointer; font-family:inherit; }
    .footer { margin-top:12px; font-size:7.5pt; color:#94a3b8; display:flex; justify-content:space-between; }
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
        <th>#</th><th>Name (EN)</th><th>الاسم</th><th>Passport</th>
        <th>Nationality</th><th>Age</th><th>Job</th><th>Agent</th><th>Type</th>
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

/**
 * Fetch fresh worker data from GET /api/V1/Worker/{id}, resolve all image fields
 * (File → data URL), render the CV in a hidden iframe, capture with html2canvas,
 * embed in jsPDF A4, and trigger a direct file download.
 */
export async function printWorkerCVPDF(worker: Worker): Promise<void> {
  // Always pull fresh data so uploadImage / attachments are the real R2 CDN URLs
  let fresh: Worker = worker;
  try {
    const res = await api.get(API_ENDPOINTS.WORKERS.GET_BY_ID(worker.id));
    const payload = res.data;
    if (payload?.data) fresh = payload.data as Worker;
    else if (payload) fresh = payload as Worker;
  } catch {
    // fall back to the passed worker object if the fetch fails
  }

  // Resolve profile photo and attachments to string URLs / data-URLs
  const [photoSrc, ...resolvedAttachments] = await Promise.all([
    resolveSrc(fresh.uploadImage),
    ...(fresh.attachments ?? []).map(a => resolveSrc(a)),
  ]);

  const resolved: ResolvedWorker = {
    ...fresh,
    uploadImage:  photoSrc,
    attachments:  resolvedAttachments.filter((x): x is string => x !== null),
  };

  const html = buildCVHtml(resolved);

  // Render in a hidden iframe for isolated font/CSS context
  const iframe = document.createElement('iframe');
  iframe.style.cssText =
    'position:fixed;left:-9999px;top:0;width:794px;height:1400px;border:0;visibility:hidden;';
  document.body.appendChild(iframe);

  try {
    const iDoc = iframe.contentDocument!;
    iDoc.open();
    iDoc.write(html);
    iDoc.close();

    // Wait for fonts and all <img> elements to finish loading
    await iDoc.fonts.ready;
    await Promise.all(
      Array.from(iDoc.images).map(img =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>(r => {
              img.addEventListener('load',  () => r());
              img.addEventListener('error', () => r());
            })
      )
    );
    await new Promise<void>(resolve => setTimeout(resolve, 300));

    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);

    const canvas = await html2canvas(iDoc.body, {
      scale:          2,
      useCORS:        true,
      allowTaint:     true,
      backgroundColor: '#ffffff',
      width:          794,
      height:         iDoc.body.scrollHeight,
      windowWidth:    794,
      windowHeight:   iDoc.body.scrollHeight,
    });

    const pdf    = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pageW  = pdf.internal.pageSize.getWidth();   // 210 mm
    const pageH  = pdf.internal.pageSize.getHeight();  // 297 mm

    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const imgH    = (canvas.height * pageW) / canvas.width;

    let remaining = imgH;
    let offset    = 0;

    while (remaining > 0) {
      if (offset > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, -offset, pageW, imgH);
      offset    += pageH;
      remaining -= pageH;
    }

    const name = sanitizeName(
      (fresh.fullNameEn || fresh.fullNameAr || 'Worker') as string
    );
    pdf.save(`${name}_CV.pdf`);
  } finally {
    document.body.removeChild(iframe);
  }
}

/** Open a print-ready list of all provided workers in a new tab. */
export async function printAllWorkersPDF(workers: Worker[]): Promise<void> {
  const html = buildListHtml(workers);
  const win  = window.open('', '_blank');
  if (!win) {
    alert('Please allow pop-ups for this site to enable printing.');
    return;
  }
  win.document.write(html);
  win.document.close();
  win.document.fonts.ready.then(() => win.print());
}
