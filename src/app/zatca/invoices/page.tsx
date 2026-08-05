'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Table, Input, Select, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { FileTextOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useZatcaInvoices, useZatcaLookups } from '@/hooks/api/useZatca';
import { AdvancedFilterPanel, DateRangeFilter } from '@/components/filters';
import { ZatcaLookupTag, formatDateTime, formatMoney } from '../_lib/zatcaDisplay';
import type { ZatcaInvoiceListItem } from '@/types/zatca.types';
import styles from '../zatca.module.css';

const PAGE_SIZE = 20;

export default function ZatcaInvoicesPage() {
  const router = useRouter();
  const language = useAuthStore((state) => state.language);
  const branchId = useAuthStore((state) => state.branchId);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState<number | undefined>();
  const [range, setRange] = useState<[string | undefined, string | undefined]>([undefined, undefined]);
  const [pageNumber, setPageNumber] = useState(1);

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPageNumber(1);
    }, 400);
    return () => clearTimeout(id);
  }, [searchInput]);

  const { data: lookups } = useZatcaLookups();
  const { data, isLoading, isFetching, refetch } = useZatcaInvoices({
    branchId: branchId ?? undefined,
    pageNumber,
    pageSize: PAGE_SIZE,
    submissionStatus,
    fromDate: range[0],
    toDate: range[1],
    search: search || undefined,
  });

  const invoices = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;

  const columns: ColumnsType<ZatcaInvoiceListItem> = [
    { title: '#', key: 'index', width: 52, render: (_, __, idx) => (pageNumber - 1) * PAGE_SIZE + idx + 1 },
    {
      title: t('رقم الفاتورة', 'Invoice #'),
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (v: string, record) => (
        <a className={styles.docNumber} onClick={() => router.push(`/zatca/invoices/${record.id}`)}>
          {v || `#${record.id.slice(0, 8)}`}
        </a>
      ),
    },
    {
      title: t('المصدر', 'Source'),
      dataIndex: 'sourceEntityType',
      key: 'sourceEntityType',
      render: (v: number) => <ZatcaLookupTag category="sourceEntityTypes" value={v} />,
    },
    {
      title: t('النوع', 'Sub Type'),
      dataIndex: 'invoiceSubType',
      key: 'invoiceSubType',
      render: (v: number) => <ZatcaLookupTag category="invoiceSubTypes" value={v} />,
    },
    {
      title: t('تاريخ الإصدار', 'Issue Date'),
      dataIndex: 'issueDateTime',
      key: 'issueDateTime',
      render: (v: string) => formatDateTime(v),
    },
    {
      title: t('الإجمالي', 'Total'),
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right',
      render: (v: number) => <span className={styles.amount}>{formatMoney(v)}</span>,
    },
    {
      title: t('ضريبة القيمة', 'VAT'),
      dataIndex: 'taxAmount',
      key: 'taxAmount',
      align: 'right',
      render: (v: number) => <span className={styles.amount}>{formatMoney(v)}</span>,
    },
    {
      title: t('حالة الإرسال', 'Submission'),
      dataIndex: 'submissionStatus',
      key: 'submissionStatus',
      render: (v: number) => <ZatcaLookupTag category="submissionStatuses" value={v} />,
    },
    {
      title: t('حالة الاعتماد', 'Clearance'),
      dataIndex: 'clearanceStatus',
      key: 'clearanceStatus',
      render: (v: number) => <ZatcaLookupTag category="clearanceStatuses" value={v} />,
    },
    {
      title: t('آخر خطأ', 'Last Error'),
      dataIndex: 'lastErrorMessage',
      key: 'lastErrorMessage',
      ellipsis: true,
      render: (v: string) => v || <span className={styles.muted}>—</span>,
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <FileTextOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('فواتير زاتكا', 'ZATCA Invoices')}</h1>
              <p className={styles.pageSubtitle}>
                {t('سجل الفواتير الإلكترونية وحالة إرسالها لهيئة الزكاة والضريبة', 'E-invoice records and their ZATCA submission status')}
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button icon={<ReloadOutlined spin={isFetching} />} onClick={() => refetch()} className={styles.refreshBtn}>
              {t('تحديث', 'Refresh')}
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.metrics}>
        <div className={`${styles.metricCard} ${styles.total}`}>
          <div className={styles.metricLabel}>{t('إجمالي الفواتير', 'Total Invoices')}</div>
          <div className={styles.metricValue}>{totalCount}</div>
        </div>
        <div className={`${styles.metricCard} ${styles.active}`}>
          <div className={styles.metricLabel}>{t('في الصفحة', 'On Page')}</div>
          <div className={styles.metricValue}>{invoices.length}</div>
        </div>
      </div>

      <AdvancedFilterPanel
        activeCount={[submissionStatus !== undefined, Boolean(range[0])].filter(Boolean).length}
        onClear={() => {
          setSubmissionStatus(undefined);
          setRange([undefined, undefined]);
        }}
        contentLayout="block"
        quickFilters={
          <>
            <Input
              allowClear
              size="large"
              prefix={<SearchOutlined />}
              placeholder={t('بحث برقم الفاتورة أو UUID', 'Search invoice number or UUID')}
              className={styles.filterInput}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Select
              allowClear
              size="large"
              style={{ minWidth: 200 }}
              placeholder={t('حالة الإرسال', 'Submission status')}
              value={submissionStatus}
              onChange={(v) => {
                setSubmissionStatus(v);
                setPageNumber(1);
              }}
              options={lookups?.submissionStatuses.map((s) => ({ value: s.value, label: s.name }))}
            />
            <div>
              <label className={styles.filterLabel}>{t('تاريخ الإصدار', 'Issue date')}</label>
              <DateRangeFilter
                value={range}
                onChange={(r) => {
                  setRange(r);
                  setPageNumber(1);
                }}
                placeholder={[t('من', 'From'), t('إلى', 'To')]}
              />
            </div>
          </>
        }
      />

      <Card className={styles.tableCard}>
        <Table<ZatcaInvoiceListItem>
          rowKey="id"
          columns={columns}
          dataSource={invoices}
          loading={isLoading}
          size="middle"
          bordered
          scroll={{ x: 1200 }}
          pagination={{
            current: pageNumber,
            pageSize: PAGE_SIZE,
            total: totalCount,
            onChange: setPageNumber,
            showTotal: (n) => t(`الإجمالي: ${n}`, `Total: ${n}`),
          }}
        />
      </Card>
    </div>
  );
}
