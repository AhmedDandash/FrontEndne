'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Input,
  Select,
  Tag,
  DatePicker,
  Space,
  Card,
  Tooltip,
  InputNumber,
  Pagination,
  Empty,
  Spin,
  Avatar,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  ReloadOutlined,
  FileProtectOutlined,
  UserOutlined,
  IdcardOutlined,
  GlobalOutlined,
  CalendarOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { BranchFilterSelect } from '@/components/filters';
import { useMediationFollowUpDashboard } from '@/hooks/api/useMediationFollowUp';
import { MEDIATION_CONTRACT_STATUS, toSelectOptions } from '@/constants/enums';
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
      searchPlaceholder: { ar: 'بحث...', en: 'Search...' },
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
  const [searchText, setSearchText] = useState('');
  const [branchId, setBranchId] = useState<string | undefined>(undefined);
  const [includeSubBranches, setIncludeSubBranches] = useState(true);

  // Applied params (updated only on Search click for server-side filtering)
  const [appliedParams, setAppliedParams] = useState<MediationFollowUpDashboardParams>({
    Page: 1,
    PageSize: 15,
  });

  const { data, isLoading, refetch } = useMediationFollowUpDashboard(appliedParams);
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;

  // The dashboard endpoint ignores `StatusId` server-side, so contract-status
  // filtering is applied client-side on the loaded page by matching statusName.
  const displayedRows = useMemo(() => {
    if (statusId == null) return rows;
    const label = (
      MEDIATION_CONTRACT_STATUS.find((s) => s.value === statusId)?.labelEn || ''
    ).toLowerCase();
    return rows.filter((r) => (r.statusName || '').toLowerCase() === label);
  }, [rows, statusId]);

  const handleSearch = useCallback(() => {
    const params: MediationFollowUpDashboardParams = {
      Page: 1,
      PageSize: 15,
    };
    if (contractNumber) params.ContractNumber = contractNumber;
    if (musanedNumber) params.MusanedContractNumber = musanedNumber;
    if (passportNumber) params.WorkerPassportNumber = passportNumber;
    if (nationalId) params.CustomerNationalId = nationalId;
    // NOTE: StatusId is intentionally NOT sent — the dashboard ignores it.
    // Status is filtered client-side via `displayedRows`.
    if (workerType != null) params.WorkerType = workerType;
    if (dateRange) {
      params.DateFrom = dateRange[0];
      params.DateTo = dateRange[1];
    }
    if (searchText) params.Search = searchText;
    if (branchId) {
      params.BranchId = branchId;
      params.IncludeSubBranches = includeSubBranches;
    }
    setAppliedParams(params);
  }, [
    contractNumber,
    musanedNumber,
    passportNumber,
    nationalId,
    workerType,
    dateRange,
    searchText,
    branchId,
    includeSubBranches,
  ]);

  const handleReset = useCallback(() => {
    setContractNumber(null);
    setMusanedNumber('');
    setPassportNumber('');
    setNationalId('');
    setStatusId(null);
    setWorkerType(null);
    setDateRange(null);
    setSearchText('');
    setBranchId(undefined);
    setIncludeSubBranches(true);
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

  const renderCard = useCallback(
    (row: MediationFollowUpDashboardRow) => {
      const createdDate = row.createdAt
        ? new Date(row.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-GB')
        : '—';

      const nationality = row.workerNationalityAr;

      return (
        <Card
          key={row.contractId ?? row.id ?? Math.random().toString()}
          className={styles.followUpCard}
          hoverable
        >
          <div className={styles.cardContent}>
            {/* ── Left Panel ── */}
            <div className={styles.cardLeft}>
              <div className={styles.cardHeader}>
                <div className={styles.contractNumber}>
                  <FileTextOutlined className={styles.contractIcon} />
                  <span>#{row.contractNumber ?? '—'}</span>
                  {row.musanedContractNumber && (
                    <Tag color="geekblue" style={{ marginInlineStart: 8 }}>
                      {t('musanedNumber')}: {row.musanedContractNumber}
                    </Tag>
                  )}
                </div>
              </div>

              <div className={styles.tagsSection}>
                {row.statusName && (
                  <Tag color="blue" className={styles.typeTag}>{row.statusName}</Tag>
                )}
                {row.workerTypeName && (
                  <Tag color="geekblue">{row.workerTypeName}</Tag>
                )}
              </div>

              {/* Worker row */}
              <div className={styles.customerSection}>
                <Avatar size={44} icon={<UserOutlined />} className={styles.customerAvatar} />
                <div className={styles.customerDetails}>
                  <span className={styles.customerName}>{row.workerName || '—'}</span>
                  <div className={styles.customerMeta}>
                    <IdcardOutlined />
                    <span dir="ltr">{row.workerPassportNumber || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Extra details */}
              <div className={styles.detailsSection}>
                <div className={styles.detailItem}>
                  <UserOutlined className={styles.detailIcon} />
                  <div className={styles.detailText}>
                    <span className={styles.detailLabel}>{t('customerName')}</span>
                    <span className={styles.detailValue}>{row.customerName || '—'}</span>
                  </div>
                </div>
                {nationality && (
                  <div className={styles.detailItem}>
                    <GlobalOutlined className={styles.detailIcon} />
                    <div className={styles.detailText}>
                      <span className={styles.detailLabel}>{t('nationality')}</span>
                      <span className={styles.detailValue}>{nationality}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Right Panel ── */}
            <div className={styles.cardRight}>
              {/* Status banner */}
              <div className={styles.progressBanner}>
                <div className={styles.progressBannerMeta}>
                  <FileProtectOutlined className={styles.progressBannerIcon} />
                  <span className={styles.progressBannerLabel}>{t('status')}</span>
                </div>
                <div className={styles.progressBannerValue}>
                  {row.statusName || '—'}
                </div>
                {row.daysSinceCreation != null && (
                  <div className={styles.progressBannerSub}>
                    <CalendarOutlined style={{ marginInlineEnd: 4 }} />
                    {language === 'ar'
                      ? `${row.daysSinceCreation} يوم منذ الإنشاء`
                      : `${row.daysSinceCreation} days since creation`}
                  </div>
                )}
              </div>

              {/* Stats breakdown */}
              <div className={styles.statsBreakdown}>
                <div className={styles.statRow}>
                  <span className={styles.statDot} style={{ background: '#003366' }} />
                  <span className={styles.statLabel}>{t('contractNumber')}</span>
                  <span className={styles.statValue} style={{ color: '#003366' }}>
                    #{row.contractNumber ?? '—'}
                  </span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statDot} style={{ background: '#52c41a' }} />
                  <span className={styles.statLabel}>{t('musanedNumber')}</span>
                  <span className={styles.statValue} style={{ color: '#52c41a' }}>
                    <span className={styles.mono}>{row.musanedContractNumber || '—'}</span>
                  </span>
                </div>
              </div>

              {/* Date */}
              <div className={styles.datesSection}>
                <div className={styles.dateItem}>
                  <CalendarOutlined />
                  <span>{createdDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom Action Bar ── */}
          <div className={styles.cardBottom}>
            <div className={styles.actionsList}>
              <Tooltip title={t('viewDetails')}>
                <Button
                  type="link"
                  icon={<EyeOutlined />}
                  className={styles.actionBtn}
                  onClick={() => handleViewDetails(row)}
                >
                  {t('viewDetails')}
                </Button>
              </Tooltip>
            </div>
          </div>
        </Card>
      );
    },
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
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            prefix={<SearchOutlined />}
          />
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
            options={toSelectOptions([...MEDIATION_CONTRACT_STATUS], language)}
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
          <BranchFilterSelect
            value={branchId}
            onChange={setBranchId}
            includeSubBranches={includeSubBranches}
            onIncludeSubBranchesChange={setIncludeSubBranches}
            style={{ width: '100%' }}
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

      {/* ── Cards Grid ── */}
      <Spin spinning={isLoading}>
        {displayedRows.length === 0 && !isLoading ? (
          <Card className={styles.tableCard}>
            <Empty description={t('noData')} />
          </Card>
        ) : (
          <div className={styles.cardsGrid}>
            {displayedRows.map(renderCard)}
          </div>
        )}
      </Spin>

      {total > 0 && (
        <div className={styles.paginationBar}>
          <Pagination
            current={appliedParams.Page ?? 1}
            pageSize={appliedParams.PageSize ?? 15}
            total={total}
            onChange={handlePageChange}
            showSizeChanger
            pageSizeOptions={['10', '15', '25', '50']}
            showTotal={(tot) =>
              isRTL ? `إجمالي ${tot} عقد` : `Total ${tot} contracts`
            }
          />
        </div>
      )}
    </div>
  );
}
