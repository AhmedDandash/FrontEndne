/** Shared formatting helpers for the ledger reports. */

/** Format an amount with thousands separators and 2 decimals (— for empty). */
export function fmtAmount(value: number | null | undefined, dashWhenZero = false): string {
  const n = Number(value) || 0;
  if (dashWhenZero && n === 0) return '—';
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Format a balance: negative values in parentheses (accounting convention). */
export function fmtBalance(value: number | null | undefined): { text: string; negative: boolean } {
  const n = Number(value) || 0;
  const negative = n < 0;
  const text = negative
    ? `(${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
    : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return { text, negative };
}

/** Format an ISO date as a locale date string (— when empty). */
export function fmtDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
}
