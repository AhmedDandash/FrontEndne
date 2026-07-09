'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, Select, Button, Typography, Spin, Alert, Space } from 'antd';
import { ApartmentOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { useBranches } from '@/hooks/api/useBranches';
import { useAuthStore, getJwtBranchId } from '@/store/authStore';
import type { Branch } from '@/types/api.types';

const { Title, Text } = Typography;

interface BranchOption {
  value: string;
  label: string;
}

/** Flatten the branch tree into a select-friendly list (main → sub indented). */
function flattenBranches(branches: Branch[], lang: 'ar' | 'en'): BranchOption[] {
  const name = (b: Branch) =>
    (lang === 'ar' ? b.nameAr || b.nameEn : b.nameEn || b.nameAr) || '—';
  const out: BranchOption[] = [];
  for (const b of branches) {
    if (!b?.id) continue;
    out.push({ value: String(b.id), label: name(b) });
    for (const sub of b.subBranches ?? []) {
      if (!sub?.id) continue;
      out.push({ value: String(sub.id), label: `↳ ${name(sub)}` });
    }
  }
  return out;
}

/**
 * Post-login branch selector. Blocks the app until the user picks the branch
 * they want to work in; that choice is persisted and sent as the `X-Branch-Id`
 * header on every subsequent request. Pre-highlights the user's home branch
 * (from the JWT) but never auto-selects — the choice is always deliberate.
 */
export default function BranchGate() {
  const language = useAuthStore((s) => s.language);
  const setBranch = useAuthStore((s) => s.setBranch);
  const { branches, isLoading, error } = useBranches();
  const queryClient = useQueryClient();

  const options = useMemo(
    () => flattenBranches(Array.isArray(branches) ? branches : [], language),
    [branches, language]
  );

  const [selected, setSelected] = useState<string | undefined>(undefined);

  // Pre-highlight the home branch once the list has loaded (if present in it).
  useEffect(() => {
    if (selected || options.length === 0) return;
    const home = getJwtBranchId();
    if (home && options.some((o) => o.value === home)) {
      setSelected(home);
    }
  }, [options, selected]);

  const isAr = language === 'ar';

  const handleConfirm = () => {
    if (!selected) return;
    const label = options.find((o) => o.value === selected)?.label ?? null;
    // Clear cached query data fetched before a branch was scoped, so every
    // screen refetches with the X-Branch-Id header now in place.
    queryClient.clear();
    setBranch(selected, label ? label.replace(/^↳\s*/, '') : null);
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f0f2f5',
        padding: 16,
      }}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <Card style={{ width: '100%', maxWidth: 440 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <ApartmentOutlined style={{ fontSize: 32, color: '#1677ff' }} />
            <Title level={4} style={{ marginTop: 12, marginBottom: 4 }}>
              {isAr ? 'اختر الفرع' : 'Select a branch'}
            </Title>
            <Text type="secondary">
              {isAr
                ? 'اختر الفرع الذي تريد العمل عليه للمتابعة'
                : 'Choose the branch you want to work in to continue'}
            </Text>
          </div>

          {error ? (
            <Alert
              type="error"
              showIcon
              message={
                isAr ? 'تعذّر تحميل الفروع' : 'Failed to load branches'
              }
            />
          ) : isLoading ? (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <Spin />
            </div>
          ) : (
            <Select
              showSearch
              autoFocus
              value={selected}
              onChange={(v) => setSelected(v)}
              placeholder={isAr ? 'اختر الفرع' : 'Select branch'}
              style={{ width: '100%' }}
              options={options}
              optionFilterProp="label"
              size="large"
            />
          )}

          <Button
            type="primary"
            size="large"
            block
            disabled={!selected}
            onClick={handleConfirm}
          >
            {isAr ? 'متابعة' : 'Continue'}
          </Button>
        </Space>
      </Card>
    </div>
  );
}
