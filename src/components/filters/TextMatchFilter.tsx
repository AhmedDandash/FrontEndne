'use client';

import { Input, Select, Space } from 'antd';

/**
 * StringMatchMode values, live-verified against `/api/V1/Customer` (the spec
 * gives no enum labels at all): 0=Contains, 1=Exact, 2=StartsWith, 3=EndsWith.
 * Case-insensitive. Omitting the mode entirely is equivalent to 0 (Contains) —
 * the app's existing text filters already relied on that default, so `mode`
 * stays undefined until the user explicitly picks something else.
 */
export type StringMatchMode = 0 | 1 | 2 | 3;

export interface TextMatchValue {
  text?: string;
  mode?: StringMatchMode;
}

export interface TextMatchFilterProps {
  value: TextMatchValue;
  onChange: (value: TextMatchValue) => void;
  placeholder?: string;
  lang?: 'ar' | 'en';
  style?: React.CSSProperties;
}

const MODE_LABELS: Record<StringMatchMode, { ar: string; en: string }> = {
  0: { ar: 'يحتوي على', en: 'Contains' },
  1: { ar: 'مطابقة تامة', en: 'Exact' },
  2: { ar: 'يبدأ بـ', en: 'Starts with' },
  3: { ar: 'ينتهي بـ', en: 'Ends with' },
};

/**
 * Paired text input + match-mode selector for the `*Match` query params that
 * accompany most text filters across the API (SearchNameMatch, EmailMatch,
 * etc.). Renders as one compact control instead of two separate columns.
 */
export default function TextMatchFilter({
  value,
  onChange,
  placeholder,
  lang = 'ar',
  style,
}: TextMatchFilterProps) {
  return (
    <Space.Compact style={{ width: '100%', ...style }}>
      <Input
        size="large"
        placeholder={placeholder}
        value={value.text || ''}
        onChange={(e) => onChange({ ...value, text: e.target.value || undefined })}
        allowClear
        style={{ width: '65%' }}
      />
      <Select<StringMatchMode | undefined>
        size="large"
        value={value.mode}
        onChange={(mode) => onChange({ ...value, mode })}
        allowClear
        placeholder={MODE_LABELS[0][lang]}
        style={{ width: '35%' }}
        options={([0, 1, 2, 3] as StringMatchMode[]).map((m) => ({
          value: m,
          label: MODE_LABELS[m][lang],
        }))}
      />
    </Space.Compact>
  );
}
