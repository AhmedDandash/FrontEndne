'use client';

/**
 * Shared display helpers for the ZATCA module.
 *
 * Status/type names are NEVER hardcoded — they're resolved at render time from
 * the live `/api/V1/Zatca/lookups` response (useZatcaLookupLabel), because the
 * numeric→name mapping is backend-owned and has changed between revisions.
 * Colors are a keyword heuristic over the resolved name so new enum members
 * added on the backend get a sensible color without a frontend deploy.
 */

import { Tag } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { useZatcaLookupLabel } from '@/hooks/api/useZatca';
import type { ZatcaLookupCategory } from '@/types/zatca.types';

const NEGATIVE = /fail|reject|revoke|suspend|cancel|expired|critical|error/i;
const POSITIVE = /clear|report|active|success|complete|healthy|reachable/i;
const NEUTRAL = /pending|draft|otp|sandbox|warning/i;

export function colorForStatusName(name: string | null | undefined): string {
  if (!name) return 'default';
  if (NEGATIVE.test(name)) return 'error';
  if (POSITIVE.test(name)) return 'success';
  if (NEUTRAL.test(name)) return 'warning';
  return 'processing';
}

/** Tag that resolves `value` against the live lookups for `category`. */
export function ZatcaLookupTag({
  category,
  value,
}: {
  category: ZatcaLookupCategory;
  value: number | null | undefined;
}) {
  const name = useZatcaLookupLabel(category, value);
  if (value === null || value === undefined) return <span style={{ color: '#9ca3af' }}>—</span>;
  return <Tag color={colorForStatusName(name)}>{name ?? value}</Tag>;
}

/** For free-text severity/level strings the backend already sends as words
 * (diagnostics `severity`, health `overallStatusLevel`, cert `expirationLevel`). */
export function ZatcaSeverityTag({ value }: { value: string | null | undefined }) {
  if (!value) return <span style={{ color: '#9ca3af' }}>—</span>;
  return <Tag color={colorForStatusName(value)}>{value}</Tag>;
}

export function ZatcaBoolTag({
  value,
  trueLabel,
  falseLabel,
}: {
  value: boolean | null | undefined;
  trueLabel: string;
  falseLabel: string;
}) {
  if (value === null || value === undefined) {
    return (
      <Tag icon={<MinusCircleOutlined />} color="default">
        —
      </Tag>
    );
  }
  return value ? (
    <Tag icon={<CheckCircleOutlined />} color="success">
      {trueLabel}
    </Tag>
  ) : (
    <Tag icon={<CloseCircleOutlined />} color="error">
      {falseLabel}
    </Tag>
  );
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString();
}

export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
