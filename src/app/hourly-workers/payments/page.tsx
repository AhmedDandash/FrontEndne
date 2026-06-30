'use client';

import { useMemo, useState } from 'react';
import {
  Card,
  Table,
  Input,
  Select,
  Button,
  Tooltip,
  DatePicker,
  Popconfirm,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import {
  DollarOutlined,
  ReloadOutlined,
  SearchOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import { useHourlyPayments, useHourlyPaymentMutations } from '@/hooks/api/useHourlyPayments';
import { useHourlyPermissions } from '@/hooks/useHourlyPermissions';
import { useAuthStore } from '@/store/authStore';
import {
  fmtMoney,
  EnumTag,
  PAYMENT_RECORD_STATUS,
  PAYMENT_METHOD,
} from '../_lib/hourlyDisplay';
import { HourlyPaymentRecordStatus, type HourlyPaymentListItem } from '@/types/hourly-worker.types';
import styles from '../hourly-workers.module.css';

const { RangePicker } = DatePicker;
const PAGE_SIZE = 10;

export default function HourlyPaymentsPage() {
  const language = useAuthStore((s) => s.language);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const perms = useHourlyPermissions();
  const canRefund = perms.isFullAccess;

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<number | undefined>();
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  const { data, isLoading, isFetching, refetch } = useHourlyPayments({
    search: search || undefined,
    status,
    dateFrom: range?.[0]?.startOf('day').toISOString(),
    dateTo: range?.[1]?.endOf('day').toISOString(),
    sortBy: 'createdDate',
    sortDescending: true,
    pageNumber,
    pageSize: PAGE_SIZE,
  });
  const payments = useMemo(() => data?.items ?? [], [data]);
  const totalCount = data?.totalCount ?? 0;

  const { refund } = useHourlyPaymentMutations();

  const columns: ColumnsType<HourlyPaymentListItem> = [
    { title: t('رقم التذكرة', 'Ticket'), dataIndex: 'ticketNumber', key: 'ticket', width: 160,
      render: (v) => <span className={styles.docNumber}>{v}</span> },
    { title: t('المبلغ', 'Amount'), dataIndex: 'amount', key: 'amount', width: 130, align: 'right', render: (v) => fmtMoney(v) },
    { title: t('الطريقة', 'Method'), dataIndex: 'paymentMethod', key: 'method', width: 130,
      render: (v) => <EnumTag map={PAYMENT_METHOD} value={v} isAr={isAr} /> },
    { title: t('الحالة', 'Status'), dataIndex: 'status', key: 'status', width: 120,
      render: (v) => <EnumTag map={PAYMENT_RECORD_STATUS} value={v} isAr={isAr} /> },
    { title: t('المرجع', 'Reference'), dataIndex: 'transactionReference', key: 'ref', render: (v) => v || '—' },
    { title: t('إثبات', 'Proof'), dataIndex: 'transferProofUrl', key: 'proof', width: 80,
      render: (v) => (v ? <a href={v} target="_blank" rel="noreferrer">{t('عرض', 'View')}</a> : '—') },
    { title: t('تاريخ الدفع', 'Paid At'), dataIndex: 'paidAt', key: 'paid', width: 150,
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '—') },
    ...(canRefund
      ? [{
          title: t('إجراءات', 'Actions'), key: 'actions', width: 110, fixed: 'right' as const,
          render: (_: unknown, r: HourlyPaymentListItem) =>
            r.status === HourlyPaymentRecordStatus.Completed ? (
              <Popconfirm title={t('استرداد هذا المبلغ؟', 'Refund this payment?')} okText={t('استرداد', 'Refund')} cancelText={t('إلغاء', 'Cancel')}
                okButtonProps={{ danger: true, loading: refund.isPending }} onConfirm={() => refund.mutate({ id: r.id })}>
                <Tooltip title={t('استرداد', 'Refund')}>
                  <Button size="small" danger icon={<RollbackOutlined />}>{t('استرداد', 'Refund')}</Button>
                </Tooltip>
              </Popconfirm>
            ) : <span className={styles.muted}>—</span>,
        }]
      : []),
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <DollarOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('المدفوعات', 'Payments')}</h1>
              <p className={styles.pageSubtitle}>{t('سجل مدفوعات طلبات العمل بالساعة', 'Hourly order payment records')}</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button icon={<ReloadOutlined spin={isFetching} />} onClick={() => refetch()} className={styles.refreshBtn}>{t('تحديث', 'Refresh')}</Button>
          </div>
        </div>
      </div>

      <Card className={styles.tableCard}>
        <div className={styles.filters}>
          <Input allowClear size="large" prefix={<SearchOutlined />} placeholder={t('بحث بالمرجع أو التذكرة', 'Search reference or ticket')}
            className={styles.filterInput} value={search} onChange={(e) => { setSearch(e.target.value); setPageNumber(1); }} />
          <Select allowClear size="large" placeholder={t('الحالة', 'Status')} className={styles.filterSelect}
            value={status} onChange={(v) => { setStatus(v); setPageNumber(1); }}
            options={Object.entries(PAYMENT_RECORD_STATUS).map(([val, def]) => ({ value: Number(val), label: isAr ? def.ar : def.en }))} />
          <RangePicker size="large" className={styles.filterDate} onChange={(d) => { setRange(d as [Dayjs | null, Dayjs | null] | null); setPageNumber(1); }} />
        </div>
        <Table<HourlyPaymentListItem> rowKey="id" columns={columns} dataSource={payments} loading={isLoading} size="middle" bordered scroll={{ x: 1100 }}
          pagination={{ current: pageNumber, pageSize: PAGE_SIZE, total: totalCount, onChange: setPageNumber, showTotal: (n) => t(`الإجمالي: ${n}`, `Total: ${n}`) }} />
      </Card>
    </div>
  );
}
