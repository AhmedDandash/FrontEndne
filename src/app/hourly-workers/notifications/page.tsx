'use client';

import { useMemo, useState } from 'react';
import { Card, Table, Input, Select, Button, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  BellOutlined,
  ReloadOutlined,
  SearchOutlined,
  RedoOutlined,
} from '@ant-design/icons';
import {
  useHourlyNotifications,
  useHourlyNotificationMutations,
} from '@/hooks/api/useHourlyNotifications';
import { useHourlyPermissions } from '@/hooks/useHourlyPermissions';
import { useAuthStore } from '@/store/authStore';
import { EnumTag, NOTIFICATION_STATUS } from '../_lib/hourlyDisplay';
import {
  HourlyNotificationDeliveryStatus,
  type HourlyOrderNotification,
} from '@/types/hourly-worker.types';
import styles from '../hourly-workers.module.css';

const PAGE_SIZE = 10;

export default function HourlyNotificationsPage() {
  const language = useAuthStore((s) => s.language);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const perms = useHourlyPermissions();
  const canRetry = perms.isFullAccess;

  const [search, setSearch] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState<number | undefined>();
  const [pageNumber, setPageNumber] = useState(1);

  const { data, isLoading, isFetching, refetch } = useHourlyNotifications({
    search: search || undefined,
    recipientPhone: recipientPhone || undefined,
    deliveryStatus,
    pageNumber,
    pageSize: PAGE_SIZE,
  });
  const notifications = useMemo(() => data?.items ?? [], [data]);
  const totalCount = data?.totalCount ?? 0;

  const { retry } = useHourlyNotificationMutations();

  const columns: ColumnsType<HourlyOrderNotification> = [
    { title: t('رقم التذكرة', 'Ticket'), dataIndex: 'ticketNumber', key: 'ticket', width: 160,
      render: (v) => (v ? <span className={styles.docNumber}>{v}</span> : '—') },
    { title: t('المستلم', 'Recipient'), dataIndex: 'recipientPhone', key: 'phone', width: 150,
      render: (v) => <span className={styles.assignmentPhone}>{v}</span> },
    { title: t('الرسالة', 'Message'), dataIndex: 'message', key: 'message', render: (v) => v || '—' },
    { title: t('الحالة', 'Status'), dataIndex: 'deliveryStatus', key: 'status', width: 120,
      render: (v) => <EnumTag map={NOTIFICATION_STATUS} value={v} isAr={isAr} /> },
    { title: t('تاريخ الإرسال', 'Sent At'), dataIndex: 'sentAt', key: 'sent', width: 150,
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '—') },
    ...(canRetry
      ? [{
          title: t('إجراءات', 'Actions'), key: 'actions', width: 110, fixed: 'right' as const,
          render: (_: unknown, r: HourlyOrderNotification) =>
            r.deliveryStatus === HourlyNotificationDeliveryStatus.Failed ? (
              <Tooltip title={t('إعادة الإرسال', 'Retry')}>
                <Button size="small" icon={<RedoOutlined />} loading={retry.isPending} onClick={() => retry.mutate(r.id)}>
                  {t('إعادة', 'Retry')}
                </Button>
              </Tooltip>
            ) : <span className={styles.muted}>—</span>,
        }]
      : []),
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <BellOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('الإشعارات', 'Notifications')}</h1>
              <p className={styles.pageSubtitle}>{t('سجل إشعارات واتساب للطلبات', 'WhatsApp order notification log')}</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button icon={<ReloadOutlined spin={isFetching} />} onClick={() => refetch()} className={styles.refreshBtn}>{t('تحديث', 'Refresh')}</Button>
          </div>
        </div>
      </div>

      <Card className={styles.tableCard}>
        <div className={styles.filters}>
          <Input allowClear size="large" prefix={<SearchOutlined />} placeholder={t('بحث عام', 'General search')}
            className={styles.filterSelect} value={search} onChange={(e) => { setSearch(e.target.value); setPageNumber(1); }} />
          <Input allowClear size="large" prefix={<SearchOutlined />} placeholder={t('رقم الهاتف', 'Recipient phone')}
            className={styles.filterSelect} value={recipientPhone} onChange={(e) => { setRecipientPhone(e.target.value); setPageNumber(1); }} />
          <Select allowClear size="large" placeholder={t('حالة التسليم', 'Delivery status')} className={styles.filterSelect}
            value={deliveryStatus} onChange={(v) => { setDeliveryStatus(v); setPageNumber(1); }}
            options={Object.entries(NOTIFICATION_STATUS).map(([val, def]) => ({ value: Number(val), label: isAr ? def.ar : def.en }))} />
        </div>
        <Table<HourlyOrderNotification> rowKey="id" columns={columns} dataSource={notifications} loading={isLoading} size="middle" bordered scroll={{ x: 1000 }}
          pagination={{ current: pageNumber, pageSize: PAGE_SIZE, total: totalCount, onChange: setPageNumber, showTotal: (n) => t(`الإجمالي: ${n}`, `Total: ${n}`) }} />
      </Card>
    </div>
  );
}
