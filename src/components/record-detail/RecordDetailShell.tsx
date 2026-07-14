'use client';

/**
 * RecordDetailShell — shared page shell for real routed record-detail pages
 * (`/{module}/{id}`), replacing the old "full-screen modal opened via
 * ?openId=" pattern module-by-module (Phase 1: the 3 contract types).
 *
 * Presentational + generic: any entity (contracts, vouchers, agents, workers,
 * …) supplies its own fetch, breadcrumbs, title/status/actions and body; this
 * component only owns the loading/error/not-found states, the breadcrumb,
 * the back button (RTL-aware) and the header row layout.
 */
import React from 'react';
import { useRouter } from 'next/navigation';
import { Breadcrumb, Button, Result, Spin } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import styles from './RecordDetailShell.module.css';

export interface RecordDetailShellProps {
  /** Data is being fetched — shows a centered spinner in place of the body. */
  loading?: boolean;
  /** Fetch failed — shows a bilingual error state with an optional retry button. */
  error?: unknown;
  /** Fetch succeeded but no record was found — shows a bilingual 404 state. */
  notFound?: boolean;
  onRetry?: () => void;
  breadcrumbs: { label: string; href?: string }[];
  /** List route the back button (and the 404 state's action) navigates to. */
  backHref: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** e.g. a Badge/Tag showing the record's current status. */
  status?: React.ReactNode;
  /** Right-aligned action buttons (only rendered once the record has loaded). */
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export default function RecordDetailShell({
  loading,
  error,
  notFound,
  onRetry,
  breadcrumbs,
  backHref,
  title,
  subtitle,
  status,
  actions,
  children,
}: RecordDetailShellProps) {
  const router = useRouter();
  const language = useAuthStore((state) => state.language);
  const isRtl = language === 'ar';
  const BackIcon = isRtl ? ArrowRightOutlined : ArrowLeftOutlined;

  const t = {
    back: isRtl ? 'رجوع' : 'Back',
    retry: isRtl ? 'إعادة المحاولة' : 'Retry',
    errorTitle: isRtl ? 'حدث خطأ أثناء تحميل البيانات' : 'Something went wrong loading this record',
    errorSubtitle: isRtl
      ? 'يرجى المحاولة مرة أخرى، أو العودة إلى القائمة.'
      : 'Please try again, or go back to the list.',
    notFoundTitle: isRtl ? 'السجل غير موجود' : 'Record not found',
    notFoundSubtitle: isRtl
      ? 'قد يكون السجل محذوفاً أو الرابط غير صحيح.'
      : 'This record may have been removed, or the link is incorrect.',
    backToList: isRtl ? 'العودة إلى القائمة' : 'Back to list',
  };

  const breadcrumbItems = breadcrumbs.map((b) => ({
    title: b.href ? (
      <span className={styles.breadcrumbLink} onClick={() => router.push(b.href!)}>
        {b.label}
      </span>
    ) : (
      <span className={styles.breadcrumbCurrent}>{b.label}</span>
    ),
  }));

  return (
    <div className={styles.shell}>
      <div className={styles.topRow}>
        <Breadcrumb items={breadcrumbItems} className={styles.breadcrumb} />
        <Button
          type="text"
          icon={<BackIcon />}
          onClick={() => router.push(backHref)}
          className={styles.backButton}
        >
          {t.back}
        </Button>
      </div>

      {loading ? (
        <div className={styles.centerState}>
          <Spin size="large" />
        </div>
      ) : error ? (
        <Result
          status="error"
          title={t.errorTitle}
          subTitle={t.errorSubtitle}
          extra={[
            onRetry && (
              <Button key="retry" type="primary" onClick={onRetry}>
                {t.retry}
              </Button>
            ),
            <Button key="back" onClick={() => router.push(backHref)}>
              {t.backToList}
            </Button>,
          ].filter(Boolean)}
        />
      ) : notFound ? (
        <Result
          status="404"
          title={t.notFoundTitle}
          subTitle={t.notFoundSubtitle}
          extra={
            <Button type="primary" onClick={() => router.push(backHref)}>
              {t.backToList}
            </Button>
          }
        />
      ) : (
        <>
          <div className={styles.headerRow}>
            <div className={styles.headerLeft}>
              <div className={styles.titleLine}>
                <h1 className={styles.title}>{title}</h1>
                {status}
              </div>
              {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
            </div>
            {actions && <div className={styles.actions}>{actions}</div>}
          </div>
          <div className={styles.body}>{children}</div>
        </>
      )}
    </div>
  );
}
