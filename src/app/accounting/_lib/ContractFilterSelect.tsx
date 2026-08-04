'use client';

import { useMemo, useState } from 'react';
import { Select } from 'antd';
import { useAuthStore } from '@/store/authStore';
import { useEmploymentOperatingContracts } from '@/hooks/api/useEmploymentOperatingContracts';
import { useMediationContracts } from '@/hooks/api/useMediationContracts';
import { contractOptionLabel } from './accountingDocDisplay';

const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ContractFilterSelectProps {
  /**
   * 'employment' = operating contracts only — Receipt Vouchers' actual business
   * rule (`employmentOperatingContractId` is a required, single-typed field).
   * 'any' = operating + mediation contracts merged — Payment Vouchers/Credit
   * Notes/Debit Notes accept either (`sourceContractType`), so their filter
   * must be able to match either kind.
   */
  source: 'employment' | 'any';
  value?: string;
  onChange: (value: string | undefined) => void;
  style?: React.CSSProperties;
  placeholder?: string;
}

interface Option {
  value: string;
  label: string;
}

/**
 * Keeps this Select a strict superset of the free-text Input it replaces: if
 * the live search text or the current value is a GUID not already in the
 * fetched options (e.g. a contract past the bulk-fetch page size, or one the
 * viewer no longer has list access to), it's injected as a selectable —  and
 * still renderable — synthetic option instead of silently disappearing.
 */
function withGuidEscape(base: Option[], candidates: (string | undefined)[], isAr: boolean): Option[] {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const known = new Set(base.map((o) => o.value));
  const extras: Option[] = [];
  for (const raw of candidates) {
    const v = raw?.trim();
    if (v && GUID_RE.test(v) && !known.has(v)) {
      extras.push({ value: v, label: `${t('استخدم هذا المعرف', 'Use this ID')}: ${v}` });
      known.add(v);
    }
  }
  return extras.length ? [...base, ...extras] : base;
}

export default function ContractFilterSelect({
  source,
  value,
  onChange,
  style,
  placeholder,
}: ContractFilterSelectProps) {
  const language = useAuthStore((s) => s.language);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [searchText, setSearchText] = useState('');

  const { contracts: operating } = useEmploymentOperatingContracts();
  // Bulk-fetch precedent + page size (200) match the existing merge in
  // general-vouchers/_components/VoucherEntityPickers.tsx's ContractPicker.
  const { contracts: mediation } = useMediationContracts({ pageSize: 200, enabled: source === 'any' });

  const options = useMemo(() => {
    const employmentOptions: Option[] = ((operating as any[]) ?? []).map((c: any) => ({
      value: String(c.id),
      label: contractOptionLabel(c, isAr),
    }));
    const mediationOptions: Option[] =
      source === 'any'
        ? ((mediation as any[]) ?? []).map((c: any) => ({
            value: String(c.id),
            label: contractOptionLabel(c, isAr, 'mediation'),
          }))
        : [];
    return withGuidEscape([...employmentOptions, ...mediationOptions], [searchText, value], isAr);
  }, [operating, mediation, source, searchText, value, isAr]);

  return (
    <Select
      allowClear
      showSearch
      optionFilterProp="label"
      size="large"
      style={style ?? { width: '100%' }}
      placeholder={placeholder ?? t('فلتر بالعقد', 'Filter by contract')}
      value={value}
      onChange={onChange}
      onSearch={setSearchText}
      options={options}
    />
  );
}
