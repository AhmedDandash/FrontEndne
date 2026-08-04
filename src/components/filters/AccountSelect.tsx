'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Select, Spin } from 'antd';
import { AccountService } from '@/services/account.service';
import { getAccountType } from '@/types/accounting.types';

interface AccountSelectProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
  placeholder?: string;
  /** When set, the option for this id is shown even before a search loads it. */
  fallbackLabel?: string;
  disabled?: boolean;
}

interface Option {
  value: string;
  label: string;
  code: string;
}

/** Debounce helper local to this picker. */
function useDebounced<T extends (...args: any[]) => void>(fn: T, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout>>();
  return useMemo(
    () =>
      (...args: Parameters<T>) => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => fn(...args), delay);
      },
    [fn, delay]
  );
}

/**
 * Server-searchable account picker.
 *
 * The full account tree is loaded lazily (roots only), so it cannot back a flat
 * leaf-account selector. This picker queries the paginated, searchable
 * `/account/settings` endpoint instead — the user types a code or name and the
 * matching accounts come back from the server.
 */
export function AccountSelect({
  value,
  onChange,
  placeholder,
  fallbackLabel,
  disabled,
}: AccountSelectProps) {
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (term: string) => {
    setLoading(true);
    try {
      const result = await AccountService.getSettings({
        searchTerm: term,
        pageNumber: 1,
        pageSize: 20,
      });
      setOptions(
        result.items.map((a) => ({
          value: a.id,
          code: a.code,
          label: `${a.code} — ${a.name}`,
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useDebounced(search, 350);

  // Preload an initial page so the dropdown isn't empty on first open.
  useEffect(() => {
    void search('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the currently-selected option visible even if it's not in the latest
  // search results (e.g. when editing an existing entry).
  const merged = useMemo(() => {
    if (value && fallbackLabel && !options.some((o) => o.value === value)) {
      return [{ value, code: '', label: fallbackLabel }, ...options];
    }
    return options;
  }, [options, value, fallbackLabel]);

  return (
    <Select
      showSearch
      allowClear
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      filterOption={false}
      onSearch={debouncedSearch}
      onChange={(v) => onChange?.(v)}
      notFoundContent={loading ? <Spin size="small" /> : null}
      style={{ width: '100%' }}
      optionRender={(opt) => {
        const code = (opt.data as Option).code;
        const type = code ? getAccountType(code) : null;
        return (
          <span>
            <span style={{ fontFamily: 'monospace', color: type?.color ?? '#1677ff' }}>
              {code}
            </span>
            {code ? ' — ' : ''}
            {(opt.data as Option).label.replace(`${code} — `, '')}
          </span>
        );
      }}
      options={merged}
    />
  );
}
