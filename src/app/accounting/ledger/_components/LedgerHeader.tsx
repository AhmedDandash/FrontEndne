'use client';

import type { ReactNode } from 'react';
import { Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import styles from '../Ledger.module.css';

interface LedgerHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  isFetching?: boolean;
  onRefresh?: () => void;
  refreshLabel: string;
  /** Optional extra actions rendered before the refresh button. */
  extra?: ReactNode;
}

/** Shared navy page header used by every ledger report. */
export function LedgerHeader({
  icon,
  title,
  subtitle,
  isFetching,
  onRefresh,
  refreshLabel,
  extra,
}: LedgerHeaderProps) {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.headerContent}>
        <div className={styles.headerLeft}>
          <span className={styles.headerIcon}>{icon}</span>
          <div>
            <h1 className={styles.pageTitle}>{title}</h1>
            <p className={styles.pageSubtitle}>{subtitle}</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          {extra}
          {onRefresh && (
            <Button
              icon={<ReloadOutlined spin={isFetching} />}
              onClick={onRefresh}
              className={styles.refreshBtn}
            >
              {refreshLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
