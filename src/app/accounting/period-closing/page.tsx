'use client';

import { useState } from 'react';
import {
  Card,
  Button,
  Select,
  Space,
  Descriptions,
  Typography,
  Popconfirm,
  Alert,
  Statistic,
  Tag,
} from 'antd';
import {
  LockOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { usePeriodClosingStatus, useClosePeriod } from '@/hooks/api/usePeriodClosing';
import { useAuthStore } from '@/store/authStore';
import styles from '../accounting-doc.module.css';

const { Title, Text, Paragraph } = Typography;

const MONTHS = [
  { value: 1, ar: 'يناير', en: 'January' },
  { value: 2, ar: 'فبراير', en: 'February' },
  { value: 3, ar: 'مارس', en: 'March' },
  { value: 4, ar: 'أبريل', en: 'April' },
  { value: 5, ar: 'مايو', en: 'May' },
  { value: 6, ar: 'يونيو', en: 'June' },
  { value: 7, ar: 'يوليو', en: 'July' },
  { value: 8, ar: 'أغسطس', en: 'August' },
  { value: 9, ar: 'سبتمبر', en: 'September' },
  { value: 10, ar: 'أكتوبر', en: 'October' },
  { value: 11, ar: 'نوفمبر', en: 'November' },
  { value: 12, ar: 'ديسمبر', en: 'December' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

export default function PeriodClosingPage() {
  const language = useAuthStore((state) => state.language);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const [year, setYear] = useState<number>(currentYear);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);

  const { data: status, isLoading: isStatusLoading, error: statusError, refetch } =
    usePeriodClosingStatus(year, month);
  const { mutateAsync: closePeriod, isPending: isClosing } = useClosePeriod();

  // The closing details (entry id, net income) are only returned by the close
  // mutation itself — the status endpoint just returns a boolean. Keep the most
  // recent close result to surface those figures right after closing.
  const [lastResult, setLastResult] = useState<any>(null);

  const handleClose = async () => {
    const result = await closePeriod({ year, month });
    setLastResult(result);
    refetch();
  };

  // status is a boolean: true = closed, false = open, undefined = not loaded.
  const isClosed = status === true;
  const isOpen = status === false;
  // Period-closing endpoints are role-restricted. A 401/403 means the current
  // user (e.g. Employee role) may not view or perform period closing.
  const errorCode = (statusError as any)?.response?.status;
  const isForbidden = errorCode === 401 || errorCode === 403;

  return (
    <div className={styles.page}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <LockOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('إغلاق الفترة المحاسبية', 'Accounting Period Closing')}</h1>
              <p className={styles.pageSubtitle}>
                {t(
                  'إغلاق شهر محاسبي وترحيل صافي الدخل إلى الأرباح المحتجزة',
                  'Close an accounting month and transfer net income to retained earnings'
                )}
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button
              icon={<ReloadOutlined spin={isStatusLoading} />}
              onClick={() => refetch()}
              className={styles.refreshBtn}
            >
              {t('تحديث', 'Refresh')}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Period Selector + Status Card ────────────────────────── */}
      <Card className={styles.periodCard}>
        <Title level={4} style={{ marginBottom: 20 }}>
          {t('اختر الفترة المحاسبية', 'Select Accounting Period')}
        </Title>

        <div className={styles.periodSelectors}>
          <Select
            size="large"
            value={year}
            onChange={setYear}
            style={{ minWidth: 120 }}
            options={YEARS.map((y) => ({ value: y, label: String(y) }))}
          />
          <Select
            size="large"
            value={month}
            onChange={setMonth}
            style={{ minWidth: 160 }}
            options={MONTHS.map((m) => ({ value: m.value, label: isAr ? m.ar : m.en }))}
          />
        </div>

        {/* ── Permission gate ────────────────────────────────────── */}
        {isForbidden && (
          <Alert
            type="error"
            showIcon
            icon={<ExclamationCircleOutlined />}
            style={{ marginBottom: 16 }}
            message={t('صلاحيات غير كافية', 'Insufficient Permissions')}
            description={t(
              'إغلاق الفترة المحاسبية متاح للمحاسبين والمسؤولين فقط. لا يملك حسابك الحالي صلاحية الوصول لهذه الخدمة.',
              'Period closing is restricted to Accountant/Admin roles. Your current account does not have permission to access this feature.'
            )}
          />
        )}

        {/* ── Period Status ──────────────────────────────────────── */}
        {isForbidden ? null : isClosed || isOpen ? (
          <div className={`${styles.periodStatus} ${isClosed ? styles.closed : styles.open}`}>
            <Space align="center" size={12}>
              {isClosed ? (
                <CheckCircleFilled style={{ fontSize: 24, color: '#52c41a' }} />
              ) : (
                <ClockCircleOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
              )}
              <div>
                <Text strong style={{ fontSize: 16 }}>
                  {isClosed
                    ? t('الفترة مغلقة', 'Period is Closed')
                    : t('الفترة مفتوحة', 'Period is Open')}
                </Text>
                <div>
                  <Tag color={isClosed ? 'success' : 'warning'} style={{ marginTop: 4 }}>
                    {`${year} / ${String(month).padStart(2, '0')}`}
                  </Tag>
                </div>
              </div>
            </Space>

            {isClosed && lastResult && (
              <Descriptions
                style={{ marginTop: 16 }}
                size="small"
                column={1}
                bordered
              >
                {lastResult.closingJournalEntryId && (
                  <Descriptions.Item label={t('قيد الإغلاق', 'Closing Entry ID')}>
                    <Text code>{lastResult.closingJournalEntryId}</Text>
                  </Descriptions.Item>
                )}
                {lastResult.netIncomeTransferred !== undefined && lastResult.netIncomeTransferred !== null && (
                  <Descriptions.Item label={t('صافي الدخل المحول', 'Net Income Transferred')}>
                    <Statistic
                      value={lastResult.netIncomeTransferred}
                      precision={2}
                      valueStyle={{
                        fontSize: 16,
                        color: lastResult.netIncomeTransferred >= 0 ? '#52c41a' : '#cf1322',
                      }}
                    />
                  </Descriptions.Item>
                )}
              </Descriptions>
            )}
          </div>
        ) : isStatusLoading ? null : (
          <Alert
            message={t('تعذّر تحميل حالة الفترة', 'Could not load period status')}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* ── Warning & Close Button ─────────────────────────────── */}
        {isOpen && !isForbidden && (
          <>
            <Alert
              icon={<ExclamationCircleOutlined />}
              showIcon
              type="warning"
              style={{ marginBottom: 20 }}
              message={t('تحذير: عملية غير قابلة للتراجع', 'Warning: Irreversible Operation')}
              description={
                <Paragraph style={{ margin: 0 }}>
                  {t(
                    'إغلاق الفترة سيقوم تلقائيًا بـ: (1) إغلاق حسابات الإيرادات والمصروفات، (2) تحويل صافي الدخل/الخسارة إلى الأرباح المحتجزة، (3) منع أي قيود جديدة على هذا الشهر.',
                    'Closing the period will automatically: (1) close revenue and expense accounts, (2) transfer net income/loss to retained earnings, (3) block any new journal entries for this month.'
                  )}
                </Paragraph>
              }
            />

            <Popconfirm
              title={t('تأكيد إغلاق الفترة', 'Confirm Period Closing')}
              description={
                <div style={{ maxWidth: 320 }}>
                  {t(
                    `هل أنت متأكد من إغلاق فترة ${month}/${year}؟ لا يمكن التراجع عن هذه العملية.`,
                    `Are you sure you want to close period ${month}/${year}? This operation cannot be undone.`
                  )}
                </div>
              }
              okText={t('نعم، أغلق الفترة', 'Yes, Close Period')}
              cancelText={t('إلغاء', 'Cancel')}
              okButtonProps={{ danger: true, loading: isClosing }}
              onConfirm={handleClose}
            >
              <Button
                type="primary"
                danger
                size="large"
                icon={<LockOutlined />}
                loading={isClosing}
                block
              >
                {t(`إغلاق فترة ${month}/${year}`, `Close Period ${month}/${year}`)}
              </Button>
            </Popconfirm>
          </>
        )}
      </Card>

      {/* ── Info Card ─────────────────────────────────────────────── */}
      <Card
        style={{ marginTop: 16, maxWidth: 560, margin: '16px auto 0' }}
        title={
          <Space>
            <ExclamationCircleOutlined />
            {t('كيفية عمل الإغلاق', 'How Period Closing Works')}
          </Space>
        }
      >
        <Descriptions column={1} size="small">
          <Descriptions.Item label={t('الخطوة 1', 'Step 1')}>
            {t('إغلاق حسابات الإيرادات → مدين الإيرادات، دائن ملخص الدخل (390)', 'Close revenue accounts → DR Revenue, CR Income Summary (390)')}
          </Descriptions.Item>
          <Descriptions.Item label={t('الخطوة 2', 'Step 2')}>
            {t('إغلاق حسابات المصروفات → مدين ملخص الدخل، دائن المصروفات', 'Close expense accounts → DR Income Summary, CR Expenses')}
          </Descriptions.Item>
          <Descriptions.Item label={t('الخطوة 3', 'Step 3')}>
            {t('تحويل صافي الدخل → مدين/دائن ملخص الدخل ↔ أرباح محتجزة (302)', 'Transfer net income → DR/CR Income Summary ↔ Retained Earnings (302)')}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}
