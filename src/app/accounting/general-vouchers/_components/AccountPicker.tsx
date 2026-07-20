'use client';

import { Select, Spin } from 'antd';
import { useLeafAccounts } from '@/hooks/api/useLeafAccounts';

export interface AccountPickerProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  size?: 'small' | 'middle' | 'large';
  style?: React.CSSProperties;
}

/**
 * Leaf-account selector from the chart of accounts.
 *
 * Only leaf accounts are offered: the backend rejects postings to non-leaf
 * accounts, so filtering here turns a server-side validation error into an
 * option that simply never appears. Search matches on both code and name,
 * since accountants routinely search by either.
 *
 * Designed to drop straight into an antd `Form.Item` — it takes the
 * value/onChange pair the form injects.
 */
export default function AccountPicker({
  value,
  onChange,
  placeholder,
  disabled,
  allowClear = true,
  size = 'large',
  style,
}: AccountPickerProps) {
  const { data: accounts = [], isLoading } = useLeafAccounts();

  return (
    <Select
      showSearch
      allowClear={allowClear}
      disabled={disabled}
      size={size}
      style={{ width: '100%', ...style }}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      loading={isLoading}
      notFoundContent={isLoading ? <Spin size="small" /> : undefined}
      // Match on code or name — `optionFilterProp` alone can't see both.
      filterOption={(input, option) => {
        const haystack = String(option?.['data-search'] ?? '').toLowerCase();
        return haystack.includes(input.toLowerCase());
      }}
      options={accounts.map((acc) => ({
        value: acc.id,
        'data-search': `${acc.code} ${acc.name} ${acc.path.join(' ')}`,
        label: (
          <span>
            <span style={{ color: '#8c8c8c', fontFamily: 'monospace', marginInlineEnd: 8 }}>
              {acc.code}
            </span>
            {acc.name}
          </span>
        ),
      }))}
    />
  );
}
