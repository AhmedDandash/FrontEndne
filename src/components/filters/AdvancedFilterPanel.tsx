'use client';

import { useState, type ReactNode } from 'react';
import { Card, Button, Space, Badge } from 'antd';
import { FilterOutlined, DownOutlined, UpOutlined, ClearOutlined } from '@ant-design/icons';

export interface AdvancedFilterPanelProps {
  /** Always-visible controls (typically branch selector + global search). */
  quickFilters?: ReactNode;
  /** Right-aligned actions (typically the export button). */
  actions?: ReactNode;
  /** Collapsible advanced/entity-specific filters + date ranges. */
  children?: ReactNode;
  /** Clears all filters. */
  onClear: () => void;
  /** Number of active filters — shown as a badge on the toggle. */
  activeCount?: number;
  defaultOpen?: boolean;
}

/**
 * Collapsible filter shell shared by list screens. Keeps quick filters (branch +
 * search) and the export action always visible, and hides entity-specific
 * fields behind an "advanced filters" toggle to reduce clutter.
 */
export default function AdvancedFilterPanel({
  quickFilters,
  actions,
  children,
  onClear,
  activeCount = 0,
  defaultOpen = false,
}: AdvancedFilterPanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Space wrap size={12}>
          {quickFilters}
          {children && (
            <Badge count={activeCount} size="small">
              <Button
                icon={<FilterOutlined />}
                onClick={() => setOpen((o) => !o)}
                type={open ? 'primary' : 'default'}
              >
                فلاتر متقدمة {open ? <UpOutlined /> : <DownOutlined />}
              </Button>
            </Badge>
          )}
        </Space>
        <Space wrap size={8}>
          {activeCount > 0 && (
            <Button icon={<ClearOutlined />} onClick={onClear}>
              مسح الفلاتر
            </Button>
          )}
          {actions}
        </Space>
      </div>

      {open && children && (
        <div
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'center',
          }}
        >
          {children}
        </div>
      )}
    </Card>
  );
}
