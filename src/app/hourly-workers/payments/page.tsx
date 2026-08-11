'use client';

import { useMemo, useState } from 'react';
import {
  Card,
  Table,
  Input,
  Select,
  Button,
  Tooltip,
  Popconfirm,
  Row,
  Col,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  DollarOutlined,
  ReloadOutlined,
  SearchOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import { useHourlyPayments, useHourlyPaymentMutations } from '@/hooks/api/useHourlyPayments';
import { useHourlyPermissions } from '@/hooks/useHourlyPermissions';
import { useAuthStore } from '@/store/authStore';
import { AdvancedFilterPanel, DateRangeFilter } from '@/components/filters';
import {
  fmtMoney,
  EnumTag,
  PAYMENT_RECORD_STATUS,
  PAYMENT_METHOD,
} from '../_lib/hourlyDisplay';
import { HourlyPaymentRecordStatus, type HourlyPaymentListItem } from '@/types/hourly-worker.types';
import styles from '../hourly-workers.module.css';

const PAGE_SIZE = 10;

export default function HourlyPaymentsPage() {
  const language = useAuthStore((s) => s.language);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const perms = useHourlyPermissions();
  const canRefund = perms.isFullAccess;

  const [search, setSearch] = useState('');
  const [orderId, setOrderId] = useState('');
  const [status, setStatus] = useState<number | undefined>();
  const [range, setRange] = useState<[string | undefined, string | undefined]>([
    undefined,
    undefined,
  ]);
  const [sortBy, setSortBy] = useState<'amount' | 'status' | 'createdDate'>('createdDate');
  const [sortDescending, setSortDescending] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);

  const { data, isLoading, isFetching, refetch } = useHourlyPayments({
    search: search || undefined,
    orderId: orderId || undefined,
    status,
    dateFrom: range[0],
    dateTo: range[1],
    sortBy,
    sortDescending,
    pageNumber,
    pageSize: PAGE_SIZE,
  });
  const payments = useMemo(() => data?.items ?? [], [data]);
  const totalCount = data?.totalCount ?? 0;

  const { refund } = useHourlyPaymentMutations();

  const columns: ColumnsType<HourlyPaymentListItem> = [
    { title: t('رقم التذكرة', 'Ticket'), dataIndex: 'ticketNumber', key: 'ticket', width: 160,
      render: (v) => <span className={styles.docNumber}>{v}</span> },
    {
      title: t('المبلغ', 'Amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      align: 'right',
      sorter: true,
      sortOrder: sortBy === 'amount' ? (sortDescending ? 'descend' : 'ascend') : null,
      render: (v) => fmtMoney(v),
    },
    { title: t('الطريقة', 'Method'), dataIndex: 'paymentMethod', key: 'method', width: 130,
      render: (v) => <EnumTag map={PAYMENT_METHOD} value={v} isAr={isAr} /> },
    {
      title: t('الحالة', 'Status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      sorter: true,
      sortOrder: sortBy === 'status' ? (sortDescending ? 'descend' : 'ascend') : null,
      render: (v) => <EnumTag map={PAYMENT_RECORD_STATUS} value={v} isAr={isAr} />,
    },
    { title: t('المرجع', 'Reference'), dataIndex: 'transactionReference', key: 'ref', render: (v) => v || '—' },
    { title: t('إثبات', 'Proof'), dataIndex: 'transferProofUrl', key: 'proof', width: 80,
      render: (v) => (v ? <a href={v} target="_blank" rel="noopener noreferrer">{t('عرض', 'View')}</a> : '—') },
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

      <AdvancedFilterPanel
        activeCount={[orderId !== '', status !== undefined].filter(Boolean).length + (range[0] ? 1 : 0)}
        onClear={() => { setOrderId(''); setStatus(undefined); setRange([undefined, undefined]); }}
        contentLayout="block"
        quickFilters={
          <>
            <Input allowClear size="large" prefix={<SearchOutlined />} placeholder={t('بحث بالمرجع أو التذكرة', 'Search reference or ticket')}
              style={{ width: 240 }} value={search} onChange={(e) => { setSearch(e.target.value); setPageNumber(1); }} />
            <div>
              <label className={styles.filterLabel}>{t('التاريخ', 'Date')}</label>
              <DateRangeFilter value={range} onChange={(d) => { setRange(d); setPageNumber(1); }} style={{ minWidth: 240 }} />
            </div>
          </>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <label className={styles.filterLabel}>{t('رقم الطلب', 'Order ID')}</label>
            <Input allowClear size="large" placeholder={t('رقم الطلب', 'Order ID')}
              style={{ width: '100%' }} value={orderId} onChange={(e) => { setOrderId(e.target.value); setPageNumber(1); }} />
          </Col>
          <Col xs={24} md={8}>
            <label className={styles.filterLabel}>{t('الحالة', 'Status')}</label>
            <Select allowClear size="large" placeholder={t('الحالة', 'Status')} style={{ width: '100%' }}
              value={status} onChange={(v) => { setStatus(v); setPageNumber(1); }}
              options={Object.entries(PAYMENT_RECORD_STATUS).map(([val, def]) => ({ value: Number(val), label: isAr ? def.ar : def.en }))} />
          </Col>
        </Row>
      </AdvancedFilterPanel>

      <Card className={styles.tableCard}>
        <Table<HourlyPaymentListItem> rowKey="id" columns={columns} dataSource={payments} loading={isLoading} size="middle" bordered scroll={{ x: 1100 }}
          onChange={(_, __, sorter) => {
            const s = Array.isArray(sorter) ? sorter[0] : sorter;
            if (s?.order) {
              setSortBy(s.columnKey as 'amount' | 'status' | 'createdDate');
              setSortDescending(s.order === 'descend');
            } else {
              setSortBy('createdDate');
              setSortDescending(true);
            }
            setPageNumber(1);
          }}
          pagination={{ current: pageNumber, pageSize: PAGE_SIZE, total: totalCount, onChange: setPageNumber, showTotal: (n) => t(`الإجمالي: ${n}`, `Total: ${n}`) }} />
      </Card>
    </div>
  );
}
