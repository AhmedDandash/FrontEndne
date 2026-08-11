'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Tabs, Table, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { FileSearchOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useZatcaRequestLogs, useZatcaSubmissionLogs, useZatcaLookups } from '@/hooks/api/useZatca';
import { AdvancedFilterPanel, DateRangeFilter } from '@/components/filters';
import { linkProps } from '@/lib/navigation/linkProps';
import { ZatcaLookupTag, formatDateTime } from '../_lib/zatcaDisplay';
import type { ZatcaApiRequestLog, ZatcaSubmissionLog } from '@/types/zatca.types';
import styles from '../zatca.module.css';

const PAGE_SIZE = 20;

function RequestLogsTab({ branchId, isAr }: { branchId: string; isAr: boolean }) {
  const router = useRouter();
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const { data: lookups } = useZatcaLookups();
  const [requestType, setRequestType] = useState<number | undefined>();
  const [isSuccess, setIsSuccess] = useState<boolean | undefined>();
  const [range, setRange] = useState<[string | undefined, string | undefined]>([undefined, undefined]);
  const [pageNumber, setPageNumber] = useState(1);

  const { data, isLoading } = useZatcaRequestLogs({
    branchId,
    pageNumber,
    pageSize: PAGE_SIZE,
    requestType,
    isSuccess,
    fromDate: range[0],
    toDate: range[1],
  });

  const columns: ColumnsType<ZatcaApiRequestLog> = [
    {
      title: t('النوع', 'Type'),
      dataIndex: 'requestType',
      key: 'requestType',
      render: (v: number) => <ZatcaLookupTag category="apiRequestTypes" value={v} />,
    },
    { title: t('الطريقة', 'Method'), dataIndex: 'httpMethod', key: 'httpMethod', width: 90 },
    { title: t('نقطة النهاية', 'Endpoint'), dataIndex: 'endpointUrl', key: 'endpointUrl', ellipsis: true },
    {
      title: t('البيئة', 'Environment'),
      dataIndex: 'environment',
      key: 'environment',
      render: (v: number) => <ZatcaLookupTag category="environments" value={v} />,
    },
    { title: t('المدة', 'Duration'), dataIndex: 'durationMs', key: 'durationMs', render: (v: number) => (v != null ? `${v} ms` : '—') },
    {
      title: t('النجاح', 'Success'),
      dataIndex: 'responseSuccess',
      key: 'responseSuccess',
      render: (v: boolean | null) =>
        v === true ? (
          <span style={{ color: '#52c41a' }}><CheckCircleOutlined /></span>
        ) : v === false ? (
          <span style={{ color: '#f5222d' }}><CloseCircleOutlined /></span>
        ) : (
          <span className={styles.muted}>—</span>
        ),
    },
    { title: t('التاريخ', 'Requested At'), dataIndex: 'requestedAt', key: 'requestedAt', render: (v: string) => formatDateTime(v) },
    {
      title: t('إجراءات', 'Actions'),
      key: 'actions',
      render: (_, record) => (
        <a {...linkProps(`/zatca/logs/requests/${record.id}`, router)}>{t('عرض التفاصيل', 'View Details')}</a>
      ),
    },
  ];

  return (
    <>
      <AdvancedFilterPanel
        activeCount={[requestType !== undefined, isSuccess !== undefined, Boolean(range[0])].filter(Boolean).length}
        onClear={() => {
          setRequestType(undefined);
          setIsSuccess(undefined);
          setRange([undefined, undefined]);
        }}
        contentLayout="block"
        quickFilters={
          <>
            <Select
              allowClear
              size="large"
              style={{ minWidth: 200 }}
              placeholder={t('نوع الطلب', 'Request type')}
              value={requestType}
              onChange={(v) => { setRequestType(v); setPageNumber(1); }}
              options={lookups?.apiRequestTypes.map((r) => ({ value: r.value, label: r.name }))}
            />
            <Select
              allowClear
              size="large"
              style={{ minWidth: 160 }}
              placeholder={t('النتيجة', 'Result')}
              value={isSuccess}
              onChange={(v) => { setIsSuccess(v); setPageNumber(1); }}
              options={[
                { value: true, label: t('ناجح', 'Success') },
                { value: false, label: t('فاشل', 'Failed') },
              ]}
            />
            <div>
              <label className={styles.filterLabel}>{t('التاريخ', 'Date')}</label>
              <DateRangeFilter value={range} onChange={(r) => { setRange(r); setPageNumber(1); }} placeholder={[t('من', 'From'), t('إلى', 'To')]} />
            </div>
          </>
        }
      />
      <Table<ZatcaApiRequestLog>
        rowKey="id"
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        size="middle"
        bordered
        scroll={{ x: 1100 }}
        pagination={{
          current: pageNumber,
          pageSize: PAGE_SIZE,
          total: data?.totalCount ?? 0,
          onChange: setPageNumber,
          showTotal: (n) => t(`الإجمالي: ${n}`, `Total: ${n}`),
        }}
      />
    </>
  );
}

function SubmissionLogsTab({ branchId, isAr }: { branchId: string; isAr: boolean }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [isSuccess, setIsSuccess] = useState<boolean | undefined>();
  const [range, setRange] = useState<[string | undefined, string | undefined]>([undefined, undefined]);
  const [pageNumber, setPageNumber] = useState(1);

  const { data, isLoading } = useZatcaSubmissionLogs({
    branchId,
    pageNumber,
    pageSize: PAGE_SIZE,
    isSuccess,
    fromDate: range[0],
    toDate: range[1],
  });

  const columns: ColumnsType<ZatcaSubmissionLog> = [
    { title: t('رقم الفاتورة', 'Invoice #'), dataIndex: 'invoiceNumber', key: 'invoiceNumber', render: (v: string) => v || '—' },
    {
      title: t('نوع الإرسال', 'Submission Type'),
      dataIndex: 'submissionType',
      key: 'submissionType',
      render: (v: number) => <ZatcaLookupTag category="apiRequestTypes" value={v} />,
    },
    { title: t('المحاولة', 'Attempt'), dataIndex: 'attemptNumber', key: 'attemptNumber', width: 90 },
    {
      title: t('الحالة', 'Status'),
      dataIndex: 'status',
      key: 'status',
      render: (v: number) => <ZatcaLookupTag category="submissionStatuses" value={v} />,
    },
    { title: t('رسالة الخطأ', 'Error'), dataIndex: 'errorMessage', key: 'errorMessage', ellipsis: true, render: (v: string) => v || <span className={styles.muted}>—</span> },
    { title: t('تاريخ الإرسال', 'Submitted At'), dataIndex: 'submittedAt', key: 'submittedAt', render: (v: string) => formatDateTime(v) },
    { title: t('تاريخ الإكمال', 'Completed At'), dataIndex: 'completedAt', key: 'completedAt', render: (v: string) => formatDateTime(v) },
  ];

  return (
    <>
      <AdvancedFilterPanel
        activeCount={[isSuccess !== undefined, Boolean(range[0])].filter(Boolean).length}
        onClear={() => { setIsSuccess(undefined); setRange([undefined, undefined]); }}
        contentLayout="block"
        quickFilters={
          <>
            <Select
              allowClear
              size="large"
              style={{ minWidth: 160 }}
              placeholder={t('النتيجة', 'Result')}
              value={isSuccess}
              onChange={(v) => { setIsSuccess(v); setPageNumber(1); }}
              options={[
                { value: true, label: t('ناجح', 'Success') },
                { value: false, label: t('فاشل', 'Failed') },
              ]}
            />
            <div>
              <label className={styles.filterLabel}>{t('التاريخ', 'Date')}</label>
              <DateRangeFilter value={range} onChange={(r) => { setRange(r); setPageNumber(1); }} placeholder={[t('من', 'From'), t('إلى', 'To')]} />
            </div>
          </>
        }
      />
      <Table<ZatcaSubmissionLog>
        rowKey="id"
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        size="middle"
        bordered
        scroll={{ x: 1000 }}
        pagination={{
          current: pageNumber,
          pageSize: PAGE_SIZE,
          total: data?.totalCount ?? 0,
          onChange: setPageNumber,
          showTotal: (n) => t(`الإجمالي: ${n}`, `Total: ${n}`),
        }}
      />
    </>
  );
}

export default function ZatcaLogsPage() {
  const language = useAuthStore((state) => state.language);
  const branchId = useAuthStore((state) => state.branchId);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <FileSearchOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('سجلات زاتكا', 'ZATCA Logs')}</h1>
              <p className={styles.pageSubtitle}>
                {t('سجلات طلبات API وسجلات محاولات إرسال الفواتير', 'API request logs and invoice submission attempt logs')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card className={styles.tableCard}>
        {branchId ? (
          <Tabs
            items={[
              { key: 'requests', label: t('سجلات الطلبات', 'Request Logs'), children: <RequestLogsTab branchId={branchId} isAr={isAr} /> },
              { key: 'submissions', label: t('سجلات الإرسال', 'Submission Logs'), children: <SubmissionLogsTab branchId={branchId} isAr={isAr} /> },
            ]}
          />
        ) : (
          <div className={styles.readOnlyNote}>{t('اختر فرعًا أولاً', 'Select a branch first')}</div>
        )}
      </Card>
    </div>
  );
}
