'use client';

import { Select } from 'antd';
import { useCustomers } from '@/hooks/api/useCustomers';
import { useAgents } from '@/hooks/api/useAgents';
import { useWorkers } from '@/hooks/api/useWorkers';
import { useEmploymentOperatingContracts } from '@/hooks/api/useEmploymentOperatingContracts';
import { useMediationContracts } from '@/hooks/api/useMediationContracts';
import { useTransferContracts } from '@/hooks/api/useTransferContracts';
import { t as tr } from '../_lib/generalVoucherDisplay';

/**
 * Entity pickers for voucher forms (beneficiary / worker / contract).
 *
 * Each wraps an existing list hook in a searchable antd Select, matching the
 * ad-hoc pattern already used across the accounting and contract screens —
 * just factored out here since the six voucher forms would otherwise repeat it.
 *
 * The source hooks return heterogeneous shapes (some paginated, some flat, with
 * differing name fields), so option mapping is defensive by design.
 */

const selectProps = {
  showSearch: true as const,
  allowClear: true as const,
  optionFilterProp: 'label' as const,
  size: 'large' as const,
  style: { width: '100%' },
};

function pickName(entity: any, isAr: boolean): string {
  const ar = entity?.arabicName ?? entity?.nameAr ?? entity?.fullNameAr;
  const en = entity?.englishName ?? entity?.nameEn ?? entity?.fullName ?? entity?.name;
  return (isAr ? ar || en : en || ar) || String(entity?.id ?? '');
}

// ── Beneficiary (source list depends on the chosen beneficiary type) ─────────
export interface BeneficiaryPickerProps {
  beneficiaryType?: string;
  value?: string;
  onChange?: (value: string | undefined, name?: string) => void;
  isAr: boolean;
  disabled?: boolean;
}

export function BeneficiaryPicker({
  beneficiaryType,
  value,
  onChange,
  isAr,
  disabled,
}: BeneficiaryPickerProps) {
  const t = (ar: string, en: string) => tr(isAr, ar, en);

  const { customers } = useCustomers();
  const { data: agents } = useAgents();
  const { data: workers } = useWorkers();

  const source: any[] =
    beneficiaryType === 'Agent'
      ? (agents as any[]) ?? []
      : beneficiaryType === 'Worker'
        ? (workers as any[]) ?? []
        : ((customers as any[]) ?? []);

  const options = source.map((entity) => ({
    value: String(entity.id),
    label: pickName(entity, isAr),
  }));

  return (
    <Select
      {...selectProps}
      disabled={disabled || !beneficiaryType}
      placeholder={
        beneficiaryType
          ? t('اختر المستفيد', 'Select beneficiary')
          : t('اختر نوع المستفيد أولاً', 'Select a beneficiary type first')
      }
      value={value}
      onChange={(id) => {
        // The DTO stores the display name alongside the id, so the voucher
        // still reads correctly if the source record is later renamed.
        const name = options.find((o) => o.value === id)?.label;
        onChange?.(id, name);
      }}
      options={options}
    />
  );
}

// ── Worker ──────────────────────────────────────────────────────────────────
export interface WorkerPickerProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
  isAr: boolean;
  disabled?: boolean;
}

export function WorkerPicker({ value, onChange, isAr, disabled }: WorkerPickerProps) {
  const t = (ar: string, en: string) => tr(isAr, ar, en);
  const { data: workers } = useWorkers();

  return (
    <Select
      {...selectProps}
      disabled={disabled}
      placeholder={t('اختر العامل', 'Select worker')}
      value={value}
      onChange={onChange}
      options={((workers as any[]) ?? []).map((w: any) => ({
        value: String(w.id),
        label: [pickName(w, isAr), w.passportNumber && `(${w.passportNumber})`]
          .filter(Boolean)
          .join(' '),
      }))}
    />
  );
}

// ── Contract (source list depends on the chosen contract type) ──────────────
export interface ContractPickerProps {
  contractType?: string;
  value?: string;
  onChange?: (value: string | undefined) => void;
  isAr: boolean;
  disabled?: boolean;
}

export function ContractPicker({
  contractType,
  value,
  onChange,
  isAr,
  disabled,
}: ContractPickerProps) {
  const t = (ar: string, en: string) => tr(isAr, ar, en);

  // All three are fetched rather than fetched-on-demand: the type can change
  // freely and these lists are already cached by other screens.
  const { contracts: operating } = useEmploymentOperatingContracts();
  const { contracts: mediation } = useMediationContracts({ pageSize: 200 });
  const { data: transfer } = useTransferContracts({ pageSize: 200 });

  const source: any[] =
    contractType === 'Mediation'
      ? ((mediation as any[]) ?? [])
      : contractType === 'Transfer'
        ? (transfer?.items ?? [])
        : ((operating as any[]) ?? []);

  const options = source.map((c: any) => {
    const number = c.contractNumber ?? c.number ?? c.id;
    const party = c.customerNameAr ?? c.customerName ?? c.customerNameEn;
    return {
      value: String(c.id),
      label: party ? `#${number} — ${party}` : `#${number}`,
    };
  });

  return (
    <Select
      {...selectProps}
      disabled={disabled || !contractType}
      placeholder={
        contractType
          ? t('اختر العقد', 'Select contract')
          : t('اختر نوع العقد أولاً', 'Select a contract type first')
      }
      value={value}
      onChange={onChange}
      options={options}
    />
  );
}
