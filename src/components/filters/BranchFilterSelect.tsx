'use client';

import { useMemo } from 'react';
import { Select, Checkbox, Space } from 'antd';
import { ApartmentOutlined } from '@ant-design/icons';
import { useBranches } from '@/hooks/api/useBranches';
import { useAuthStore } from '@/store/authStore';
import type { Branch } from '@/types/api.types';

export interface BranchFilterSelectProps {
  /** Selected branch id (undefined = all branches). */
  value?: string;
  onChange: (branchId: string | undefined) => void;
  includeSubBranches?: boolean;
  onIncludeSubBranchesChange?: (value: boolean) => void;
  /** Hide the sub-branch toggle (e.g. where the backend ignores it). */
  showSubBranchToggle?: boolean;
  style?: React.CSSProperties;
}

interface BranchOption {
  value: string;
  label: string;
  isMain: boolean;
}

/** Flatten the branch tree into a select-friendly list (main → sub indented). */
function flattenBranches(branches: Branch[], lang: 'ar' | 'en'): BranchOption[] {
  const name = (b: Branch) =>
    (lang === 'ar' ? b.nameAr || b.nameEn : b.nameEn || b.nameAr) || '—';
  const out: BranchOption[] = [];
  for (const b of branches) {
    if (!b?.id) continue;
    out.push({ value: String(b.id), label: name(b), isMain: true });
    for (const sub of b.subBranches ?? []) {
      if (!sub?.id) continue;
      out.push({ value: String(sub.id), label: `↳ ${name(sub)}`, isMain: false });
    }
  }
  return out;
}

/**
 * Branch scoping selector — loads `GET /api/V1/Branch` and lets the user pick a
 * branch (or all). When a MAIN branch is selected, an `includeSubBranches`
 * toggle appears. Defaults to "all branches" because existing records may have
 * `branchId = null` and would be hidden by an eager default scope.
 */
export default function BranchFilterSelect({
  value,
  onChange,
  includeSubBranches = true,
  onIncludeSubBranchesChange,
  showSubBranchToggle = true,
  style,
}: BranchFilterSelectProps) {
  const language = useAuthStore((s) => s.language);
  const { branches, isLoading } = useBranches();

  const options = useMemo(
    () => flattenBranches(Array.isArray(branches) ? branches : [], language),
    [branches, language]
  );

  const selectedIsMain = useMemo(
    () => options.find((o) => o.value === value)?.isMain ?? false,
    [options, value]
  );

  const allBranchesLabel = language === 'ar' ? 'كل الفروع' : 'All branches';

  return (
    <Space wrap>
      <Select
        allowClear
        showSearch
        loading={isLoading}
        value={value}
        onChange={(v) => onChange(v || undefined)}
        placeholder={
          <Space size={4}>
            <ApartmentOutlined />
            {allBranchesLabel}
          </Space>
        }
        style={{ minWidth: 220, ...style }}
        options={options}
        optionFilterProp="label"
      />
      {showSubBranchToggle && value && selectedIsMain && onIncludeSubBranchesChange && (
        <Checkbox
          checked={includeSubBranches}
          onChange={(e) => onIncludeSubBranchesChange(e.target.checked)}
        >
          {language === 'ar' ? 'شمل الفروع الفرعية' : 'Include sub-branches'}
        </Checkbox>
      )}
    </Space>
  );
}
