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
import { AdvancedFilterPanel, DateRangeFilter } from '@/components/filters';
import { useAgents } from '@/hooks/api/useAgents';
import { useMediationFollowUpDashboard } from '@/hooks/api/useMediationFollowUp';
import { useNationalities } from '@/hooks/api/useNationalities';
import { MEDIATION_CONTRACT_STATUS, MEDIATION_CONTRACT_TYPE, toSelectOptions } from '@/constants/enums';
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
      dateRange: { ar: 'نطاق التاريخ', en: 'Date Range' },
      progress: { ar: 'التقدم', en: 'Progress' },
      createdAt: { ar: 'تاريخ الإنشاء', en: 'Created' },
      visaDateLabel: { ar: 'تاريخ التأشيرة', en: 'Visa Date' },
    };
    return (key: string) => map[key]?.[language] ?? map[key]?.['en'] ?? key;
  }, [language]);
}

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
  const [customerPhone, setCustomerPhone] = useState('');
  const [visaNumber, setVisaNumber] = useState('');
  const [statusId, setStatusId] = useState<number | null>(null);
  const [contractType, setContractType] = useState<string | 'all'>('all');
  const [nationalityId, setNationalityId] = useState<string | 'all'>('all');
  const [agentId, setAgentId] = useState<string | 'all'>('all');
  const [workerAssignmentFilter, setWorkerAssignmentFilter] =
    useState<'all' | 'assigned' | 'unassigned'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [insuranceFilter, setInsuranceFilter] = useState<'all' | 'insured' | 'uninsured'>('all');
  const [cancelStatusFilter, setCancelStatusFilter] = useState<'all' | 'cancelled' | 'active'>('all');
  const [dateRange, setDateRange] = useState<[string | undefined, string | undefined]>([
    undefined,
    undefined,
  ]);
  const [paymentDateRange, setPaymentDateRange] = useState<[string | undefined, string | undefined]>([
    undefined,
    undefined,
  ]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState(''); // debounced, feeds the query
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // API-backed visa date range.
  const [visaDateRange, setVisaDateRange] = useState<[string | undefined, string | undefined]>([
    undefined,
    undefined,
  ]);

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
    if (customerPhone) p.CustomerPhone = customerPhone;
    if (visaNumber) p.VisaNumber = visaNumber;
    if (statusId != null) p.StatusId = statusId;
    if (contractType !== 'all') p.ContractType = Number(contractType);
    if (nationalityId !== 'all') p.NationalityId = nationalityId;
    if (agentId !== 'all') p.AgentId = agentId;
    if (workerAssignmentFilter !== 'all') {
      p.WithoutAssignedWorker = workerAssignmentFilter === 'unassigned';
    }
    if (paymentFilter === 'paid') p.IsPaid = true;
    if (paymentFilter === 'unpaid') p.IsUnpaid = true;
    if (insuranceFilter !== 'all') p.HasContractInsurance = insuranceFilter === 'insured';
    if (cancelStatusFilter !== 'all') p.IsCancel = cancelStatusFilter === 'cancelled';
    if (dateRange[0]) p.CreatedDateFrom = dateRange[0];
    if (dateRange[1]) p.CreatedDateTo = dateRange[1];
    if (paymentDateRange[0]) p.PaymentDateFrom = paymentDateRange[0];
    if (paymentDateRange[1]) p.PaymentDateTo = paymentDateRange[1];
    if (search) p.Search = search;
    if (visaDateRange[0]) p.VisaDateFrom = visaDateRange[0];
    if (visaDateRange[1]) p.VisaDateTo = visaDateRange[1];
    return p;
  }, [
    pageNumber,
    pageSize,
    contractNumber,
    musanedNumber,
    passportNumber,
    nationalId,
    customerPhone,
    visaNumber,
    statusId,
    contractType,
    nationalityId,
    agentId,
    workerAssignmentFilter,
    paymentFilter,
    insuranceFilter,
    cancelStatusFilter,
    dateRange,
    paymentDateRange,
    search,
    visaDateRange,
  ]);

  const { data, isLoading, refetch } = useMediationFollowUpDashboard(params);
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const displayedRows = rows;
  const { data: agents = [] } = useAgents();
  const { data: nationalities = [] } = useNationalities();

  const activeFilterCount = [
    contractNumber != null,
    musanedNumber !== '',
    passportNumber !== '',
    nationalId !== '',
    customerPhone !== '',
    visaNumber !== '',
    statusId != null,
    contractType !== 'all',
    nationalityId !== 'all',
    agentId !== 'all',
    workerAssignmentFilter !== 'all',
    paymentFilter !== 'all',
    insuranceFilter !== 'all',
    cancelStatusFilter !== 'all',
    Boolean(dateRange[0] || dateRange[1]),
    Boolean(paymentDateRange[0] || paymentDateRange[1]),
    Boolean(visaDateRange[0] || visaDateRange[1]),
  ].filter(Boolean).length;

  const clearFilters = useCallback(() => {
    setContractNumber(null);
    setMusanedNumber('');
    setPassportNumber('');
    setNationalId('');
    setCustomerPhone('');
    setVisaNumber('');
    setStatusId(null);
    setContractType('all');
    setNationalityId('all');
    setAgentId('all');
    setWorkerAssignmentFilter('all');
    setPaymentFilter('all');
    setInsuranceFilter('all');
    setCancelStatusFilter('all');
    setDateRange([undefined, undefined]);
    setPaymentDateRange([undefined, undefined]);
    setVisaDateRange([undefined, undefined]);
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
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            allowClear
            prefix={<SearchOutlined />}
            style={{ width: 280 }}
          />
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{t('filterByContract')}</label>
            <InputNumber placeholder={t('filterByContract')} value={contractNumber} onChange={(v) => { setContractNumber(v); setPageNumber(1); }} style={{ width: '100%' }} min={0} />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{t('filterByMusaned')}</label>
            <Input placeholder={t('filterByMusaned')} value={musanedNumber} onChange={(e) => { setMusanedNumber(e.target.value); setPageNumber(1); }} allowClear />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{t('filterByPassport')}</label>
            <Input placeholder={t('filterByPassport')} value={passportNumber} onChange={(e) => { setPassportNumber(e.target.value); setPageNumber(1); }} allowClear />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{t('filterByNationalId')}</label>
            <Input placeholder={t('filterByNationalId')} value={nationalId} onChange={(e) => { setNationalId(e.target.value); setPageNumber(1); }} allowClear />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{language === 'ar' ? 'الجوال' : 'Mobile Number'}</label>
            <Input value={customerPhone} onChange={(e) => { setCustomerPhone(e.target.value); setPageNumber(1); }} allowClear />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{language === 'ar' ? 'رقم التأشيرة' : 'Visa Number'}</label>
            <Input value={visaNumber} onChange={(e) => { setVisaNumber(e.target.value); setPageNumber(1); }} allowClear />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{t('nationality')}</label>
            <Select
              value={nationalityId}
              onChange={(v) => { setNationalityId(v); setPageNumber(1); }}
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="label"
              options={[
                { value: 'all', label: language === 'ar' ? 'جميع الجنسيات' : 'All Nationalities' },
                ...(nationalities as any[]).map((n) => ({
                  value: String(n.id),
                  label: (language === 'ar' ? n.nationalityNameAr : n.nationalityNameEn) || n.nationalityNameAr || n.nationalityNameEn || `#${n.id}`,
                })),
              ]}
            />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{language === 'ar' ? 'الوكيل' : 'Agent'}</label>
            <Select
              value={agentId}
              onChange={(v) => { setAgentId(v); setPageNumber(1); }}
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="label"
              options={[
                { value: 'all', label: language === 'ar' ? 'جميع الوكلاء' : 'All Agents' },
                ...(agents as any[]).map((a) => ({
                  value: String(a.id),
                  label: (language === 'ar' ? a.agentNameAr : a.agentNameEn) || a.agentNameAr || a.agentNameEn || `#${a.id}`,
                })),
              ]}
            />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{t('selectStatus')}</label>
            <Select placeholder={t('selectStatus')} allowClear value={statusId} onChange={(v) => { setStatusId(v ?? null); setPageNumber(1); }} style={{ width: '100%' }} options={toSelectOptions([...MEDIATION_CONTRACT_STATUS], language)} />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{language === 'ar' ? 'نوع عقد التوسط' : 'Mediation Contract Type'}</label>
            <Select
              value={contractType}
              onChange={(v) => { setContractType(v); setPageNumber(1); }}
              style={{ width: '100%' }}
              options={[
                { value: 'all', label: language === 'ar' ? 'كل الأنواع' : 'All Types' },
                ...toSelectOptions([...MEDIATION_CONTRACT_TYPE], language).map((o) => ({ ...o, value: String(o.value) })),
              ]}
            />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{language === 'ar' ? 'عامل معين' : 'Designated Worker'}</label>
            <Select value={workerAssignmentFilter} onChange={(v) => { setWorkerAssignmentFilter(v); setPageNumber(1); }} style={{ width: '100%' }} options={[{ value: 'all', label: language === 'ar' ? 'الكل' : 'All' }, { value: 'assigned', label: language === 'ar' ? 'معين' : 'Assigned' }, { value: 'unassigned', label: language === 'ar' ? 'غير معين' : 'Unassigned' }]} />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{language === 'ar' ? 'حالة الدفع' : 'Payment Status'}</label>
            <Select value={paymentFilter} onChange={(v) => { setPaymentFilter(v); setPageNumber(1); }} style={{ width: '100%' }} options={[{ value: 'all', label: language === 'ar' ? 'كل حالات الدفع' : 'All Payment Statuses' }, { value: 'paid', label: language === 'ar' ? 'مدفوع' : 'Paid' }, { value: 'unpaid', label: language === 'ar' ? 'غير مدفوع' : 'Unpaid' }]} />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{language === 'ar' ? 'تأمين عقود العمالة المنزلية' : 'Domestic Worker Insurance'}</label>
            <Select value={insuranceFilter} onChange={(v) => { setInsuranceFilter(v); setPageNumber(1); }} style={{ width: '100%' }} options={[{ value: 'all', label: language === 'ar' ? 'الكل' : 'All' }, { value: 'insured', label: language === 'ar' ? 'مؤمن' : 'Insured' }, { value: 'uninsured', label: language === 'ar' ? 'غير مؤمن' : 'Uninsured' }]} />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{language === 'ar' ? '??? ???' : 'Back-out Status'}</label>
            <Select value={cancelStatusFilter} onChange={(v) => { setCancelStatusFilter(v); setPageNumber(1); }} style={{ width: '100%' }} options={[{ value: 'all', label: language === 'ar' ? 'الكل' : 'All' }, { value: 'cancelled', label: language === 'ar' ? 'ملغي' : 'Cancelled' }, { value: 'active', label: language === 'ar' ? 'غير ملغي' : 'Not Cancelled' }]} />
          </Col>
          <Col xs={24} md={12}>
            <label className={styles.filterLabel}>{language === 'ar' ? 'تاريخ الإنشاء' : 'Creation Date'}</label>
            <DateRangeFilter value={dateRange} onChange={(v) => { setDateRange(v); setPageNumber(1); }} style={{ width: '100%' }} />
          </Col>
          <Col xs={24} md={12}>
            <label className={styles.filterLabel}>{language === 'ar' ? 'تاريخ سداد الفاتورة' : 'Invoice Payment Date'}</label>
            <DateRangeFilter value={paymentDateRange} onChange={(v) => { setPaymentDateRange(v); setPageNumber(1); }} style={{ width: '100%' }} />
          </Col>
          <Col xs={24} md={12}>
            <label className={styles.filterLabel}>{t('visaDateLabel')}</label>
            <DateRangeFilter value={visaDateRange} onChange={(v) => { setVisaDateRange(v); setPageNumber(1); }} style={{ width: '100%' }} />
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
