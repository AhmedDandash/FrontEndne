'use client';

import { useState } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Popconfirm,
  Alert,
  Statistic,
  Tag,
  Spin,
  Empty,
} from 'antd';
import {
  LockOutlined,
  UnlockOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
  usePeriodClosingYears,
  useClosePeriod,
  useOpenPeriod,
} from '@/hooks/api/usePeriodClosing';
import { useAuthStore } from '@/store/authStore';
import { useAccountingActionGates } from '@/hooks/useActionPermissionGates';
import type { PeriodYearStatus, PeriodClosingResult } from '@/types/api.types';
import styles from '../accounting-doc.module.css';

const { Title, Text, Paragraph } = Typography;

export default function PeriodClosingPage() {
  const language = useAuthStore((state) => state.language);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const accountingGates = useAccountingActionGates();

  const { data: years, isLoading, error, refetch } = usePeriodClosingYears();
  const { mutateAsync: closePeriod, isPending: isClosing } = useClosePeriod();
  const { mutateAsync: openPeriod, isPending: isOpening } = useOpenPeriod();

  // The net income figure is only returned by the close mutation itself; keep the
  // latest result per year to surface it right after closing.
  const [lastResults, setLastResults] = useState<Record<number, PeriodClosingResult>>({});
  // Track which specific year is mutating so only its button spins.
  const [busyYear, setBusyYear] = useState<number | null>(null);

  // Period-closing endpoints are role/branch-restricted. A 401/403 means the
  // current user may not view or perform period closing.
  const errorCode = (error as any)?.response?.status;
  const isForbidden = errorCode === 401 || errorCode === 403;

  const handleClose = async (year: number) => {
    if (!accountingGates.canClose) return;
    setBusyYear(year);
    try {
      const result = await closePeriod({ year });
      setLastResults((prev) => ({ ...prev, [year]: result }));
    } catch {
      // onError toast already shown; swallow so it doesn't bubble as an
      // unhandled promise rejection.
    } finally {
      setBusyYear(null);
    }
  };

  const handleOpen = async (year: number) => {
    if (!accountingGates.canOpen) return;
    setBusyYear(year);
    try {
      await openPeriod({ year });
      setLastResults((prev) => {
        const next = { ...prev };
        delete next[year];
        return next;
      });
    } catch {
      // onError toast already shown; swallow so it doesn't bubble.
    } finally {
      setBusyYear(null);
    }
  };

  const renderYearRow = (row: PeriodYearStatus) => {
    const isClosed = row.isClosed;
    const isBusy = busyYear === row.year;
    const result = lastResults[row.year];

    return (
      <div
        key={row.year}
        className={`${styles.periodStatus} ${isClosed ? styles.closed : styles.open}`}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}
      >
        <Space align="center" size={12}>
          {isClosed ? (
            <CheckCircleFilled style={{ fontSize: 22, color: '#52c41a' }} />
          ) : (
            <ClockCircleOutlined style={{ fontSize: 22, color: '#fa8c16' }} />
          )}
          <div>
            <Space size={8} align="center">
              <Text strong style={{ fontSize: 18 }}>
                {row.year}
              </Text>
              <Tag color={isClosed ? 'success' : 'warning'}>
                {isClosed ? t('مغلقة', 'Closed') : t('مفتوحة', 'Open')}
              </Tag>
            </Space>
            {isClosed && (row.closedBy || row.closedAt) && (
              <div style={{ marginBlockStart: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {row.closedBy ? t(`أُغلقت بواسطة ${row.closedBy}`, `Closed by ${row.closedBy}`) : ''}
                  {row.closedBy && row.closedAt ? ' · ' : ''}
                  {row.closedAt ? new Date(row.closedAt).toLocaleString() : ''}
                </Text>
              </div>
            )}
            {result?.netIncomeTransferred != null && (
              <div style={{ marginBlockStart: 6 }}>
                <Statistic
                  title={t('صافي الدخل المحول', 'Net income transferred')}
                  value={result.netIncomeTransferred}
                  precision={2}
                  valueStyle={{
                    fontSize: 15,
                    color: result.netIncomeTransferred >= 0 ? '#52c41a' : '#cf1322',
                  }}
                />
              </div>
            )}
          </div>
        </Space>

        {accountingGates.canManage && (isClosed ? (
          <Popconfirm
            title={t('فتح السنة المالية؟', 'Reopen fiscal year?')}
            description={
              <div style={{ maxWidth: 320 }}>
                {t(
                  `سيتم فتح سنة ${row.year} والسماح بالترحيل مجدداً وعكس قيد الإغلاق.`,
                  `Year ${row.year} will reopen, re-enabling posting and reversing the closing entry.`
                )}
              </div>
            }
            okText={t('نعم، افتح السنة', 'Yes, Reopen')}
            cancelText={t('إلغاء', 'Cancel')}
            okButtonProps={{ loading: isBusy && isOpening }}
            onConfirm={() => handleOpen(row.year)}
          >
            <Button icon={<UnlockOutlined />} loading={isBusy && isOpening}>
              {t('فتح السنة', 'Reopen Year')}
            </Button>
          </Popconfirm>
        ) : (
          <Popconfirm
            title={t('تأكيد إغلاق السنة', 'Confirm Year Closing')}
            description={
              <div style={{ maxWidth: 340 }}>
                {t(
                  `هل أنت متأكد من إغلاق سنة ${row.year}؟ سيتم إغلاق حسابات الإيرادات والمصروفات وتحويل صافي الدخل. يمكن فتح السنة لاحقاً.`,
                  `Close year ${row.year}? Revenue and expense accounts will be closed and net income transferred. The year can be reopened later.`
                )}
              </div>
            }
            okText={t('نعم، أغلق السنة', 'Yes, Close')}
            cancelText={t('إلغاء', 'Cancel')}
            okButtonProps={{ danger: true, loading: isBusy && isClosing }}
            onConfirm={() => handleClose(row.year)}
          >
            <Button type="primary" danger icon={<LockOutlined />} loading={isBusy && isClosing}>
              {t('إغلاق السنة', 'Close Year')}
            </Button>
          </Popconfirm>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.page}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <LockOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('إغلاق السنة المالية', 'Fiscal Year Closing')}</h1>
              <p className={styles.pageSubtitle}>
                {t(
                  'إغلاق أو فتح السنوات المحاسبية وترحيل صافي الدخل إلى الأرباح المحتجزة',
                  'Close or reopen accounting years and transfer net income to retained earnings'
                )}
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button
              icon={<ReloadOutlined spin={isLoading} />}
              onClick={() => refetch()}
              className={styles.refreshBtn}
            >
              {t('تحديث', 'Refresh')}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Years list ─────────────────────────────────────────── */}
      <Card className={styles.periodCard} style={{ maxInlineSize: 640 }}>
        <Title level={4} style={{ marginBlockEnd: 20 }}>
          {t('السنوات المحاسبية', 'Accounting Years')}
        </Title>

        {/* Permission gate */}
        {isForbidden ? (
          <Alert
            type="error"
            showIcon
            icon={<ExclamationCircleOutlined />}
            message={t('صلاحيات غير كافية', 'Insufficient Permissions')}
            description={t(
              'إغلاق السنة المالية متاح للمحاسبين والمسؤولين فقط. لا يملك حسابك الحالي صلاحية الوصول لهذه الخدمة.',
              'Year closing is restricted to Accountant/Admin roles. Your current account does not have permission to access this feature.'
            )}
          />
        ) : isLoading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
          </div>
        ) : error ? (
          <Alert
            type="warning"
            showIcon
            message={t('تعذّر تحميل السنوات المحاسبية', 'Could not load accounting years')}
            description={t('يرجى المحاولة مرة أخرى.', 'Please try again.')}
          />
        ) : !years || years.length === 0 ? (
          <Empty description={t('لا توجد سنوات محاسبية', 'No accounting years')} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {years.map(renderYearRow)}
          </div>
        )}
      </Card>

      {/* ── Info Card ──────────────────────────────────────────── */}
      <Card
        style={{ marginBlockStart: 16, maxInlineSize: 640, marginInline: 'auto' }}
        title={
          <Space>
            <ExclamationCircleOutlined />
            {t('كيفية عمل الإغلاق', 'How Year Closing Works')}
          </Space>
        }
      >
        <Paragraph style={{ margin: 0 }} type="secondary">
          {t(
            'عند إغلاق سنة: (1) تُغلق حسابات الإيرادات والمصروفات، (2) يُحوّل صافي الدخل/الخسارة إلى الأرباح المحتجزة (302)، (3) يُمنع ترحيل أي قيود جديدة داخل السنة المغلقة. يمكن فتح السنة لاحقاً لعكس هذه العملية.',
            'Closing a year: (1) closes revenue and expense accounts, (2) transfers net income/loss to retained earnings (302), (3) blocks posting new journal entries within the closed year. Reopening the year reverses this.'
          )}
        </Paragraph>
      </Card>
    </div>
  );
}
