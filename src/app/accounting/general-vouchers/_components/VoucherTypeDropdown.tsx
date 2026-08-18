'use client';

import { useRouter } from 'next/navigation';
import { Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { DownOutlined, PlusOutlined } from '@ant-design/icons';
import { VOUCHER_TYPE_META } from '../_lib/generalVoucherDisplay';
import { VOUCHER_TYPE_TO_SLUG } from '@/types/general-voucher.types';
import { t as tr } from '../_lib/generalVoucherDisplay';

export interface VoucherTypeDropdownProps {
  isAr: boolean;
  className?: string;
  canCreate?: boolean;
}

/**
 * "Add Voucher" dropdown listing the six voucher types, each routing to its
 * own create form at `/accounting/general-vouchers/new/[type]`.
 */
export default function VoucherTypeDropdown({ isAr, className, canCreate = true }: VoucherTypeDropdownProps) {
  const router = useRouter();
  const t = (ar: string, en: string) => tr(isAr, ar, en);

  if (!canCreate) return null;

  const items: MenuProps['items'] = Object.entries(VOUCHER_TYPE_META).map(([value, meta]) => ({
    key: value,
    icon: meta.icon,
    label: isAr ? meta.ar : meta.en,
  }));

  return (
    <Dropdown
      trigger={['click']}
      menu={{
        items,
        onClick: ({ key }) => {
          if (!canCreate) return;
          const slug = VOUCHER_TYPE_TO_SLUG[Number(key)];
          if (slug) router.push(`/accounting/general-vouchers/new/${slug}`);
        },
      }}
    >
      <Button type="primary" icon={<PlusOutlined />} className={className}>
        {t('إضافة سند', 'Add Voucher')} <DownOutlined />
      </Button>
    </Dropdown>
  );
}
