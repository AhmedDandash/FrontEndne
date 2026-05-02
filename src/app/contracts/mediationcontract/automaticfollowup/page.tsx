'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Input,
  Select,
  Table,
  Tag,
  DatePicker,
  Space,
  Card,
  Tooltip,
  InputNumber,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  ReloadOutlined,
  FileProtectOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAuthStore } from '@/store/authStore';
import { useMediationFollowUpDashboard } from '@/hooks/api/useMediationFollowUp';
import type {
  MediationFollowUpDashboardParams,
  MediationFollowUpDashboardRow,
} from '@/types/api.types';
import styles from './AutomaticFollowUp.module.css';

const { RangePicker } = DatePicker;

// ── Translations ──────────────────────────────────────────────────────────────

function useT(language: string) {
  return useMemo(() => {
    const map: Record<string, Record<string, string>> = {
      pageTitle: { ar: 'لوحة المتابعة التلقائية', en: 'Automatic Follow-Up Dashboard' },
      pageSubtitle: { ar: 'متابعة مراحل عقود الوساطة', en: 'Track mediation contract stages' },
      contractNumber: { ar: 'رقم العقد', en: 'Contract #' },
      workerName: { ar: 'اسم العامل', en: 'Worker Name' },
      passportNumber: { ar: 'رقم الجواز', en: 'Passport No.' },
      customerName: { ar: 'اسم العميل', en: 'Customer' },
      nationalId: { ar: 'رقم الهوية', en: 'National ID' },
      nationality: { ar: 'الجنسية', en: 'Nationality' },
      musanedNumber: { ar: 'رقم مساند', en: 'Musaned No.' },
      status: { ar: 'الحالة', en: 'Status' },
      workerType: { ar: 'نوع العامل', en: 'Worker Type' },
      dateFrom: { ar: 'من تاريخ', en: 'Date From' },
      dateTo: { ar: 'إلى تاريخ', en: 'Date To' },
      actions: { ar: 'إجراءات', en: 'Actions' },
      viewDetails: { ar: 'عرض التفاصيل', en: 'View Details' },
      search: { ar: 'بحث', en: 'Search' },
      reset: { ar: 'إعادة ضبط', en: 'Reset' },
      refresh: { ar: 'تحديث', en: 'Refresh' },
      filterByContract: { ar: 'رقم العقد', en: 'Contract Number' },
      filterByMusaned: { ar: 'رقم مساند', en: 'Musaned No.' },
      filterByPassport: { ar: 'رقم الجواز', en: 'Passport Number' },
      filterByNationalId: { ar: 'رقم هوية العميل', en: 'Customer National ID' },
      noData: { ar: 'لا توجد بيانات', en: 'No data' },
      selectStatus: { ar: 'اختر الحالة', en: 'Select Status' },
      selectWorkerType: { ar: 'اختر نوع العامل', en: 'Select Worker Type' },
      dateRange: { ar: 'نطاق التاريخ', en: 'Date Range' },
      progress: { ar: 'التقدم', en: 'Progress' },
      createdAt: { ar: 'تاريخ الإنشاء', en: 'Created' },
    };
    return (key: string) => map[key]?.[language] ?? map[key]?.['en'] ?? key;
  }, [language]);
}

// ── Worker type options (common values, not defined in spec) ──────────────────

const WORKER_TYPE_OPTIONS = [
  { value: 1, label: 'عمالة منزلية / Domestic' },
  { value: 2, label: 'سائق / Driver' },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AutomaticFollowUpPage() {
  const router = useRouter();
  const language = useAuthStore((state) => state.language);
  const isRTL = language === 'ar';
  const t = useT(language);

  // Filter state — kept in component, passed to query on Search click
  const [contractNumber, setContractNumber] = useState<number | null>(null);
  const [musanedNumber, setMusanedNumber] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [statusId, setStatusId] = useState<number | null>(null);
  const [workerType, setWorkerType] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  // Applied params (updated only on Search click for server-side filtering)
  const [appliedParams, setAppliedParams] = useState<MediationFollowUpDashboardParams>({
    Page: 1,
    PageSize: 15,
  });

  const { data, isLoading, refetch } = useMediationFollowUpDashboard(appliedParams);
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;

  const handleSearch = useCallback(() => {
    const params: MediationFollowUpDashboardParams = {
      Page: 1,
      PageSize: 15,
    };
    if (contractNumber) params.ContractNumber = contractNumber;
    if (musanedNumber) params.MusanedContractNumber = musanedNumber;
    if (passportNumber) params.WorkerPassportNumber = passportNumber;
    if (nationalId) params.CustomerNationalId = nationalId;
    if (statusId != null) params.StatusId = statusId;
    if (workerType != null) params.WorkerType = workerType;
    if (dateRange) {
      params.DateFrom = dateRange[0];
      params.DateTo = dateRange[1];
    }
    setAppliedParams(params);
  }, [contractNumber, musanedNumber, passportNumber, nationalId, statusId, workerType, dateRange]);

  const handleReset = useCallback(() => {
    setContractNumber(null);
    setMusanedNumber('');
    setPassportNumber('');
    setNationalId('');
    setStatusId(null);
    setWorkerType(null);
    setDateRange(null);
    setAppliedParams({ Page: 1, PageSize: 15 });
  }, []);

  const handlePageChange = useCallback((page: number, pageSize: number) => {
    setAppliedParams((prev) => ({ ...prev, Page: page, PageSize: pageSize }));
  }, []);

  const handleViewDetails = useCallback(
    (row: MediationFollowUpDashboardRow) => {
      const id = row.contractId ?? row.id;
      if (id) router.push(`/contracts/mediationcontract/automaticfollowup/${id}`);
    },
    [router]
  );

  const columns: ColumnsType<MediationFollowUpDashboardRow> = useMemo(
    () => [
      {
        title: t('contractNumber'),
        dataIndex: 'contractNumber',
        key: 'contractNumber',
        width: 110,
        render: (v: number) =>
          v ? <span className={styles.contractNo}>#{v}</span> : '—',
      },
      {
        title: t('workerName'),
        dataIndex: 'workerName',
        key: 'workerName',
        render: (v: string) => v || '—',
      },
      {
        title: t('passportNumber'),
        dataIndex: 'workerPassportNumber',
        key: 'workerPassportNumber',
        render: (v: string) => <span className={styles.mono}>{v || '—'}</span>,
      },
      {
        title: t('customerName'),
        dataIndex: 'customerName',
        key: 'customerName',
        render: (v: string) => v || '—',
      },
      {
        title: t('nationality'),
        key: 'nationality',
        render: (_: any, row: MediationFollowUpDashboardRow) =>
          row.nationalityNameAr || row.nationalityName || '—',
      },
      {
        title: t('musanedNumber'),
        dataIndex: 'musanedContractNumber',
        key: 'musanedContractNumber',
        render: (v: string) => <span className={styles.mono}>{v || '—'}</span>,
      },
      {
        title: t('status'),
        key: 'status',
        width: 130,
        render: (_: any, row: MediationFollowUpDashboardRow) => {
          const name = row.statusName;
          if (!name) return '—';
          return <Tag color="blue">{name}</Tag>;
        },
      },
      {
        title: t('progress'),
        key: 'progress',
        width: 110,
        render: (_: any, row: MediationFollowUpDashboardRow) => {
          if (row.totalItems == null) return '—';
          const pct = row.totalItems > 0
            ? Math.round(((row.completedItems ?? 0) / row.totalItems) * 100)
            : 0;
          return (
            <span>
              {row.completedItems ?? 0}/{row.totalItems}
              <span className={styles.pct}> ({pct}%)</span>
            </span>
          );
        },
      },
      {
        title: t('createdAt'),
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 120,
        render: (v: string) =>
          v ? new Date(v).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-GB') : '—',
      },
      {
        title: t('actions'),
        key: 'actions',
        width: 80,
        fixed: 'right' as const,
        render: (_: any, row: MediationFollowUpDashboardRow) => (
          <Tooltip title={t('viewDetails')}>
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(row)}
              style={{ background: '#003366', borderColor: '#003366' }}
            />
          </Tooltip>
        ),
      },
    ],
    [t, language, handleViewDetails]
  );

  return (
    <div className={styles.container} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <FileProtectOutlined className={styles.headerIcon} />
          <div>
            <h1 className={styles.pageTitle}>{t('pageTitle')}</h1>
            <p className={styles.pageSubtitle}>{t('pageSubtitle')}</p>
          </div>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => refetch()}
          loading={isLoading}
        >
          {t('refresh')}
        </Button>
      </div>

      {/* ── Filters ── */}
      <Card className={styles.filtersCard} size="small">
        <div className={styles.filtersGrid}>
          <InputNumber
            placeholder={t('filterByContract')}
            value={contractNumber}
            onChange={(v) => setContractNumber(v)}
            style={{ width: '100%' }}
            min={0}
          />
          <Input
            placeholder={t('filterByMusaned')}
            value={musanedNumber}
            onChange={(e) => setMusanedNumber(e.target.value)}
            allowClear
          />
          <Input
            placeholder={t('filterByPassport')}
            value={passportNumber}
            onChange={(e) => setPassportNumber(e.target.value)}
            allowClear
          />
          <Input
            placeholder={t('filterByNationalId')}
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
            allowClear
          />
          <Select
            placeholder={t('selectStatus')}
            allowClear
            value={statusId}
            onChange={(v) => setStatusId(v ?? null)}
            style={{ width: '100%' }}
            options={[
              { value: 1, label: isRTL ? 'قيد الانتظار' : 'Pending' },
              { value: 2, label: isRTL ? 'مكتمل' : 'Completed' },
              { value: 3, label: isRTL ? 'فشل' : 'Failed' },
              { value: 4, label: isRTL ? 'متجاوز' : 'Skipped' },
            ]}
          />
          <Select
            placeholder={t('selectWorkerType')}
            allowClear
            value={workerType}
            onChange={(v) => setWorkerType(v ?? null)}
            style={{ width: '100%' }}
            options={WORKER_TYPE_OPTIONS}
          />
          <RangePicker
            style={{ width: '100%' }}
            onChange={(_, strings) =>
              setDateRange(
                strings[0] && strings[1] ? [strings[0], strings[1]] : null
              )
            }
          />
          <Space>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              style={{ background: '#003366', borderColor: '#003366' }}
            >
              {t('search')}
            </Button>
            <Button onClick={handleReset}>{t('reset')}</Button>
          </Space>
        </div>
      </Card>

      {/* ── Table ── */}
      <Card className={styles.tableCard}>
        <Table<MediationFollowUpDashboardRow>
          dataSource={rows}
          columns={columns}
          rowKey={(row) => row.contractId ?? row.id ?? Math.random().toString()}
          loading={isLoading}
          scroll={{ x: 1100 }}
          pagination={{
            current: appliedParams.Page ?? 1,
            pageSize: appliedParams.PageSize ?? 15,
            total,
            onChange: handlePageChange,
            showSizeChanger: true,
            pageSizeOptions: ['10', '15', '25', '50'],
            showTotal: (tot) =>
              isRTL ? `إجمالي ${tot} عقد` : `Total ${tot} contracts`,
          }}
          locale={{ emptyText: t('noData') }}
          size="middle"
          bordered
        />
      </Card>
    </div>
  );
}
