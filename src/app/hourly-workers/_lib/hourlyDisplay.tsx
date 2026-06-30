/**
 * Shared display helpers for the Hourly Workers module.
 * Single source of truth for enum → label/colour mapping and value formatting,
 * so every page/component renders statuses and amounts identically.
 */

import React from 'react';
import { Tag } from 'antd';

// ── Formatting ──────────────────────────────────────────────────────────────────

/** "HH:mm:ss" → "HH:mm". Returns an em dash for empty values. */
export function fmtTime(v?: string | null): string {
  if (!v) return '—';
  return v.length >= 5 ? v.slice(0, 5) : v;
}

/** Money with thousands separators + " SAR". */
export function fmtMoney(v?: number | null): string {
  if (v === null || v === undefined) return '—';
  return `${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`;
}

// ── Bilingual enum label maps ───────────────────────────────────────────────────

interface LabelDef {
  ar: string;
  en: string;
  color: string;
}

export const ORDER_PAYMENT_STATUS: Record<number, LabelDef> = {
  0: { ar: 'غير مدفوع', en: 'Unpaid', color: 'default' },
  1: { ar: 'مدفوع جزئياً', en: 'Partially Paid', color: 'gold' },
  2: { ar: 'مدفوع', en: 'Paid', color: 'green' },
  3: { ar: 'مسترد', en: 'Refunded', color: 'purple' },
  4: { ar: 'فشل', en: 'Failed', color: 'red' },
};

export const PAYMENT_RECORD_STATUS: Record<number, LabelDef> = {
  0: { ar: 'قيد الانتظار', en: 'Pending', color: 'gold' },
  1: { ar: 'مكتمل', en: 'Completed', color: 'green' },
  2: { ar: 'فشل', en: 'Failed', color: 'red' },
  3: { ar: 'مسترد', en: 'Refunded', color: 'purple' },
  4: { ar: 'ملغي', en: 'Cancelled', color: 'default' },
};

export const PAYMENT_METHOD: Record<number, LabelDef> = {
  1: { ar: 'بطاقة', en: 'Card', color: 'blue' },
  2: { ar: 'تحويل بنكي', en: 'Bank Transfer', color: 'geekblue' },
};

export const WORKER_ASSIGNMENT_STATUS: Record<number, LabelDef> = {
  0: { ar: 'قيد الانتظار', en: 'Pending', color: 'default' },
  1: { ar: 'مؤكد', en: 'Confirmed', color: 'cyan' },
  2: { ar: 'في الطريق', en: 'En Route', color: 'blue' },
  3: { ar: 'وصل', en: 'Arrived', color: 'geekblue' },
  4: { ar: 'في الخدمة', en: 'In Service', color: 'processing' },
  5: { ar: 'اكتملت الخدمة', en: 'Service Completed', color: 'green' },
  6: { ar: 'ملغي', en: 'Cancelled', color: 'default' },
  7: { ar: 'لم يحضر', en: 'No Show', color: 'red' },
  8: { ar: 'غادر العميل', en: 'Left Customer', color: 'lime' },
  9: { ar: 'عاد للسكن', en: 'Returned', color: 'green' },
};

export const DRIVER_ASSIGNMENT_STATUS: Record<number, LabelDef> = {
  0: { ar: 'قيد الانتظار', en: 'Pending', color: 'default' },
  1: { ar: 'معيّن', en: 'Assigned', color: 'cyan' },
  2: { ar: 'في الطريق', en: 'En Route', color: 'blue' },
  3: { ar: 'وصل', en: 'Arrived', color: 'geekblue' },
  4: { ar: 'مكتمل', en: 'Completed', color: 'green' },
  5: { ar: 'ملغي', en: 'Cancelled', color: 'default' },
};

export const ACCOMMODATION_STATUS: Record<number, LabelDef> = {
  0: { ar: 'مطلوب', en: 'Requested', color: 'gold' },
  1: { ar: 'مؤكد', en: 'Confirmed', color: 'cyan' },
  2: { ar: 'تم تسجيل الدخول', en: 'Checked In', color: 'blue' },
  3: { ar: 'تم تسجيل الخروج', en: 'Checked Out', color: 'green' },
  4: { ar: 'ملغي', en: 'Cancelled', color: 'default' },
};

export const NOTIFICATION_STATUS: Record<number, LabelDef> = {
  0: { ar: 'قيد الانتظار', en: 'Pending', color: 'gold' },
  1: { ar: 'تم الإرسال', en: 'Sent', color: 'blue' },
  2: { ar: 'تم التسليم', en: 'Delivered', color: 'green' },
  3: { ar: 'فشل', en: 'Failed', color: 'red' },
};

// ── Generic enum tag renderer ───────────────────────────────────────────────────

export function enumLabel(
  map: Record<number, LabelDef>,
  value: number | null | undefined,
  isAr: boolean
): string {
  if (value === null || value === undefined) return '—';
  const def = map[value];
  if (!def) return String(value);
  return isAr ? def.ar : def.en;
}

export function EnumTag({
  map,
  value,
  isAr,
}: {
  map: Record<number, LabelDef>;
  value: number | null | undefined;
  isAr: boolean;
}) {
  if (value === null || value === undefined) return <span style={{ color: '#9ca3af' }}>—</span>;
  const def = map[value];
  return <Tag color={def?.color ?? 'default'}>{enumLabel(map, value, isAr)}</Tag>;
}
