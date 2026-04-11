'use client';

import React from 'react';
import { Button, Space } from 'antd';
import type { ReactNode } from 'react';
import styles from './HRPageHeader.module.css';

export interface HRPageHeaderAction {
  key: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  danger?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

export interface HRPageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: HRPageHeaderAction[];
}

export default function HRPageHeader({ title, subtitle, icon, actions = [] }: HRPageHeaderProps) {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.headerContent}>
        <div className={styles.headerLeft}>
          {icon && <span className={styles.headerIcon}>{icon}</span>}
          <div>
            <h1 className={styles.pageTitle}>{title}</h1>
            {subtitle && <p className={styles.pageSubtitle}>{subtitle}</p>}
          </div>
        </div>
        {actions.length > 0 && (
          <Space wrap>
            {actions.map((action) => (
              <Button
                key={action.key}
                type={action.type ?? 'primary'}
                icon={action.icon}
                onClick={action.onClick}
                danger={action.danger}
                loading={action.loading}
                disabled={action.disabled}
                className={action.type === 'primary' || !action.type ? styles.addButton : undefined}
                size="large"
              >
                {action.label}
              </Button>
            ))}
          </Space>
        )}
      </div>
    </div>
  );
}
