'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, Card, Descriptions, Empty, Input, Space, Spin, Tag, Timeline } from 'antd';
import dayjs from 'dayjs';
import { SearchOutlined, HistoryOutlined } from '@ant-design/icons';
import { useHourlyWorkerRequestTracking } from '@/hooks/api/useHourlyWorkers';
import { useAuthStore } from '@/store/authStore';
import {
  HourlyRequestStatus,
  getStatusLabel,
  getStatusOption,
  type HourlyOrderTimelineDto,
} from '@/types/hourly-worker.types';
import { fmtTime } from '../_lib/hourlyDisplay';
import styles from '../hourly-workers.module.css';

interface TrackingPayload {
  ticketNumber?: string;
  status?: HourlyRequestStatus;
  statusName?: string;
  requestDate?: string;
  requestedStartTime?: string;
  requestedEndTime?: string;
  assignedWorkersCount?: number;
  milestones?: unknown[];
  timeline?: HourlyOrderTimelineDto[];
}

export default function HourlyWorkerTicketTrackingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const language = useAuthStore((s) => s.language);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const initialTicket = params.get('ticket') ?? '';
  const [ticket, setTicket] = useState(initialTicket);
  const [submittedTicket, setSubmittedTicket] = useState(initialTicket);

  useEffect(() => {
    setTicket(initialTicket);
    setSubmittedTicket(initialTicket);
  }, [initialTicket]);

  const { data, isFetching, isError } = useHourlyWorkerRequestTracking(
    submittedTicket.trim() || undefined
  );
  const tracking = data as TrackingPayload | undefined;
  const statusOpt =
    tracking?.status !== undefined ? getStatusOption(tracking.status) : undefined;

  const submit = (value: string) => {
    const next = value.trim();
    setSubmittedTicket(next);
    router.replace(next ? `/hourly-workers/track?ticket=${encodeURIComponent(next)}` : '/hourly-workers/track');
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <HistoryOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('تتبع طلب العمل بالساعة', 'Track Hourly Request')}</h1>
              <p className={styles.pageSubtitle}>
                {t('ابحث برقم التذكرة لعرض الحالة والجدول الزمني', 'Search by ticket number to view status and timeline')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card className={styles.tableCard} style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          size="large"
          prefix={<SearchOutlined />}
          placeholder={t('رقم التذكرة مثل TK-2026-000006', 'Ticket number, e.g. TK-2026-000006')}
          value={ticket}
          onChange={(e) => setTicket(e.target.value)}
          onSearch={submit}
          enterButton={t('تتبع', 'Track')}
        />
      </Card>

      {isFetching ? (
        <Card className={styles.tableCard}>
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
          </div>
        </Card>
      ) : isError ? (
        <Alert
          type="error"
          showIcon
          message={t('تعذر تحميل التذكرة', 'Could not load ticket')}
          description={t('تحقق من رقم التذكرة أو صلاحية الوصول.', 'Check the ticket number or access permission.')}
        />
      ) : tracking ? (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Card className={styles.tableCard}>
            <Descriptions column={{ xs: 1, md: 2 }} bordered size="small">
              <Descriptions.Item label={t('رقم التذكرة', 'Ticket')}>
                <span className={styles.docNumber}>{tracking.ticketNumber}</span>
              </Descriptions.Item>
              <Descriptions.Item label={t('الحالة', 'Status')}>
                {tracking.status !== undefined ? (
                  <Tag color={statusOpt?.color ?? 'default'}>
                    {getStatusLabel(tracking.status, isAr)}
                  </Tag>
                ) : (
                  tracking.statusName ?? '-'
                )}
              </Descriptions.Item>
              <Descriptions.Item label={t('تاريخ الطلب', 'Request Date')}>
                {tracking.requestDate ? dayjs(tracking.requestDate).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('الوقت', 'Time')}>
                {fmtTime(tracking.requestedStartTime)} - {fmtTime(tracking.requestedEndTime)}
              </Descriptions.Item>
              <Descriptions.Item label={t('العمال المعينون', 'Assigned Workers')}>
                {tracking.assignedWorkersCount ?? 0}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card className={styles.tableCard} title={t('الجدول الزمني', 'Timeline')}>
            {tracking.timeline?.length ? (
              <Timeline
                items={tracking.timeline.map((event) => ({
                  children: (
                    <div>
                      <div style={{ fontWeight: 600 }}>{event.title}</div>
                      {event.description && (
                        <div style={{ color: '#6b7280', fontSize: 12.5 }}>{event.description}</div>
                      )}
                      <div style={{ color: '#9ca3af', fontSize: 12 }}>
                        {dayjs(event.occurredAt).format('YYYY-MM-DD HH:mm')}
                      </div>
                    </div>
                  ),
                }))}
              />
            ) : (
              <Empty description={t('لا توجد أحداث', 'No events')} />
            )}
          </Card>
        </Space>
      ) : (
        <Card className={styles.tableCard}>
          <Empty description={t('أدخل رقم التذكرة للبدء', 'Enter a ticket number to start')} />
        </Card>
      )}
    </div>
  );
}
