'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Input,
  Select,
  Tag,
  Card,
  Row,
  Col,
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
import { AdvancedFilterPanel, BranchFilterSelect, DateRangeFilter } from '@/components/filters';
import { useMediationFollowUpDashboard } from '@/hooks/api/useMediationFollowUp';
import { MEDIATION_CONTRACT_STATUS, toSelectOptions } from '@/constants/enums';
import type {
  MediationFollowUpDashboardParams,
  MediationFollowUpDashboardRow,
} from '@/types/api.types';
import styles from './AutomaticFollowUp.module.css';

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

  // Filter state — live: every change re-queries directly (no Search button).
  // Converted from the previous pull-to-search pattern per architectural
  // review: this is an ordinary paginated list ("shows rows on load, one
  // filter change = one list request"), which is the idiom used everywhere
  // else in the app. See project memory for the full rationale.
  const [contractNumber, setContractNumber] = useState<number | null>(null);
  const [musanedNumber, setMusanedNumber] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [statusId, setStatusId] = useState<number | null>(null);
  const [workerType, setWorkerType] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<[string | undefined, string | undefined]>([
    undefined,
    undefined,
  ]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState(''); // debounced, feeds the query
  const [branchId, setBranchId] = useState<string | undefined>(undefined);
  const [includeSubBranches, setIncludeSubBranches] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Debounce the free-text search box into the live query (400ms, matching
  // the app-wide convention); every other control applies immediately.
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPageNumber(1);
    }, 400);
    return () => clearTimeout(id);
  }, [searchInput]);

  const params = useMemo((): MediationFollowUpDashboardParams => {
    const p: MediationFollowUpDashboardParams = { Page: pageNumber, PageSize: pageSize };
    if (contractNumber) p.ContractNumber = contractNumber;
    if (musanedNumber) p.MusanedContractNumber = musanedNumber;
    if (passportNumber) p.WorkerPassportNumber = passportNumber;
    if (nationalId) p.CustomerNationalId = nationalId;
    // NOTE: StatusId is intentionally NOT sent — the dashboard ignores it
    // server-side (known backend bug). Status is filtered client-side below,
    // which only covers the current page's rows, not the full result set.
    // Kept exactly as before this conversion — not fixed here, since the fix
    // requires backend support.
    if (workerType != null) p.WorkerType = workerType;
    if (dateRange[0] && dateRange[1]) {
      p.DateFrom = dateRange[0];
      p.DateTo = dateRange[1];
    }
    if (search) p.Search = search;
    if (branchId) {
      p.BranchId = branchId;
      p.IncludeSubBranches = includeSubBranches;
    }
    return p;
  }, [
    pageNumber,
    pageSize,
    contractNumber,
    musanedNumber,
    passportNumber,
    nationalId,
    workerType,
    dateRange,
    search,
    branchId,
    includeSubBranches,
  ]);

  const { data, isLoading, refetch } = useMediationFollowUpDashboard(params);
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

  // Search and Branch are quick filters and stay untouched by Clear. The
  // primary date range counts toward the badge/reset even though it's also a
  // quick filter, matching the convention used on the other Contracts pages
  // in this wave.
  const activeFilterCount = [
    contractNumber != null,
    musanedNumber !== '',
    passportNumber !== '',
    nationalId !== '',
    statusId != null,
    workerType != null,
    Boolean(dateRange[0]),
  ].filter(Boolean).length;

  const clearFilters = useCallback(() => {
    setContractNumber(null);
    setMusanedNumber('');
    setPassportNumber('');
    setNationalId('');
    setStatusId(null);
    setWorkerType(null);
    setDateRange([undefined, undefined]);
    setPageNumber(1);
  }, []);

  const handlePageChange = useCallback((page: number, size: number) => {
    setPageNumber(page);
    setPageSize(size);
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
      <AdvancedFilterPanel
        activeCount={activeFilterCount}
        onClear={clearFilters}
        contentLayout="block"
        quickFilters={
          <>
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              allowClear
              prefix={<SearchOutlined />}
              style={{ width: 240 }}
            />
            <BranchFilterSelect
              value={branchId}
              onChange={(v) => { setBranchId(v); setPageNumber(1); }}
              includeSubBranches={includeSubBranches}
              onIncludeSubBranchesChange={setIncludeSubBranches}
            />
            <DateRangeFilter
              value={dateRange}
              onChange={(v) => { setDateRange(v); setPageNumber(1); }}
            />
          </>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <label className={styles.filterLabel}>{t('filterByContract')}</label>
            <InputNumber
              placeholder={t('filterByContract')}
              value={contractNumber}
              onChange={(v) => { setContractNumber(v); setPageNumber(1); }}
              style={{ width: '100%' }}
              min={0}
            />
          </Col>
          <Col xs={24} md={8}>
            <label className={styles.filterLabel}>{t('filterByMusaned')}</label>
            <Input
              placeholder={t('filterByMusaned')}
              value={musanedNumber}
              onChange={(e) => { setMusanedNumber(e.target.value); setPageNumber(1); }}
              allowClear
            />
          </Col>
          <Col xs={24} md={8}>
            <label className={styles.filterLabel}>{t('filterByPassport')}</label>
            <Input
              placeholder={t('filterByPassport')}
              value={passportNumber}
              onChange={(e) => { setPassportNumber(e.target.value); setPageNumber(1); }}
              allowClear
            />
          </Col>
          <Col xs={24} md={8}>
            <label className={styles.filterLabel}>{t('filterByNationalId')}</label>
            <Input
              placeholder={t('filterByNationalId')}
              value={nationalId}
              onChange={(e) => { setNationalId(e.target.value); setPageNumber(1); }}
              allowClear
            />
          </Col>
          <Col xs={24} md={8}>
            <label className={styles.filterLabel}>{t('selectStatus')}</label>
            <Select
              placeholder={t('selectStatus')}
              allowClear
              value={statusId}
              onChange={(v) => setStatusId(v ?? null)}
              style={{ width: '100%' }}
              options={toSelectOptions([...MEDIATION_CONTRACT_STATUS], language)}
            />
          </Col>
          <Col xs={24} md={8}>
            <label className={styles.filterLabel}>{t('selectWorkerType')}</label>
            <Select
              placeholder={t('selectWorkerType')}
              allowClear
              value={workerType}
              onChange={(v) => { setWorkerType(v ?? null); setPageNumber(1); }}
              style={{ width: '100%' }}
              options={WORKER_TYPE_OPTIONS}
            />
          </Col>
        </Row>
      </AdvancedFilterPanel>

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
            current={pageNumber}
            pageSize={pageSize}
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
