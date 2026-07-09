'use client';

import { useMemo } from 'react';
import { Dropdown, Button } from 'antd';
import type { MenuProps } from 'antd';
import { ApartmentOutlined, DownOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { useBranches } from '@/hooks/api/useBranches';
import { useAuthStore } from '@/store/authStore';
import type { Branch } from '@/types/api.types';
import styles from './Header.module.css';

/** Flatten the branch tree into menu items (main → sub indented). */
function flattenBranches(
  branches: Branch[],
  lang: 'ar' | 'en'
): { key: string; label: string }[] {
  const name = (b: Branch) =>
    (lang === 'ar' ? b.nameAr || b.nameEn : b.nameEn || b.nameAr) || '—';
  const out: { key: string; label: string }[] = [];
  for (const b of branches) {
    if (!b?.id) continue;
    out.push({ key: String(b.id), label: name(b) });
    for (const sub of b.subBranches ?? []) {
      if (!sub?.id) continue;
      out.push({ key: String(sub.id), label: `↳ ${name(sub)}` });
    }
  }
  return out;
}

/**
 * Header control showing the active branch and letting the user switch it.
 * Switching updates the stored branch (→ X-Branch-Id) and clears cached query
 * data so every screen reloads scoped to the newly selected branch.
 */
export default function BranchSwitcher() {
  const language = useAuthStore((s) => s.language);
  const branchId = useAuthStore((s) => s.branchId);
  const branchName = useAuthStore((s) => s.branchName);
  const setBranch = useAuthStore((s) => s.setBranch);
  const { branches } = useBranches();
  const queryClient = useQueryClient();

  const items = useMemo(
    () => flattenBranches(Array.isArray(branches) ? branches : [], language),
    [branches, language]
  );

  // Don't render until a branch is selected (BranchGate handles first selection).
  if (!branchId) return null;

  const currentLabel =
    branchName ||
    items.find((i) => i.key === branchId)?.label?.replace(/^↳\s*/, '') ||
    (language === 'ar' ? 'الفرع' : 'Branch');

  const menu: MenuProps = {
    items: items.map((i) => ({ key: i.key, label: i.label })),
    selectable: true,
    selectedKeys: [branchId],
    onClick: ({ key }) => {
      if (key === branchId) return;
      const label = items.find((i) => i.key === key)?.label ?? null;
      queryClient.clear();
      setBranch(key, label ? label.replace(/^↳\s*/, '') : null);
    },
  };

  return (
    <Dropdown menu={menu} trigger={['click']} placement={language === 'ar' ? 'bottomLeft' : 'bottomRight'}>
      <Button type="text" className={styles.langBtn} icon={<ApartmentOutlined />}>
        <span className={styles.desktopOnly}>{currentLabel}</span>
        <DownOutlined style={{ fontSize: 10 }} />
      </Button>
    </Dropdown>
  );
}
