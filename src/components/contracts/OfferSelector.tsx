'use client';

import { useState, useMemo, useCallback } from 'react';
import { Table, Input, Select, Tag, Empty, Spin, Card, Row, Col, Alert } from 'antd';
import { SearchOutlined, CheckCircleFilled, DollarOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useMediationOffers } from '@/hooks/api/useMediationOffers';
import { useNationalities } from '@/hooks/api/useNationalities';
import { useJobs } from '@/hooks/api/useJobs';
import { useBranches } from '@/hooks/api/useBranches';
import type { MediationContractOffer } from '@/types/api.types';
import {
  NATIONALITIES,
  WORKER_TYPE,
  RELIGION,
  PREVIOUS_EXPERIENCE,
  getEnumLabel,
} from '@/constants/enums';

interface OfferSelectorProps {
  /** Currently selected offer ID (controlled) */
  selectedOfferId?: number | null;
  /** Callback when an offer row is selected */
  onSelect: (offer: MediationContractOffer) => void;
  /** Language: 'ar' | 'en' */
  language: 'ar' | 'en';
  /** Optional: pass offers externally (fallback to hook) */
  offers?: MediationContractOffer[];
  /** Optional: hide the component header card */
  compact?: boolean;
}

/**
 * OfferSelector
 * Displays a searchable / filterable table of Mediation Contract Offers.
 * When the user clicks a row, it calls onSelect(offer) so the parent form
 * can auto-fill salary, localCost, agentCostSAR, offerId.
 */
export default function OfferSelector({
  selectedOfferId,
  onSelect,
  language,
  offers: externalOffers,
  compact = false,
}: OfferSelectorProps) {
  const isArabic = language === 'ar';

  // Fetch offers from API if not provided externally
  const { data: apiOffers, isLoading: isLoadingOffers } = useMediationOffers();
  const offers = useMemo(() => externalOffers ?? apiOffers ?? [], [externalOffers, apiOffers]);

  // Lookup data for display (nationalities, jobs & branches from API)
  const { data: nationalities = [] } = useNationalities();
  const { data: jobs = [] } = useJobs();
  const { branches: branchesList } = useBranches();
  const branches = useMemo(() => branchesList || [], [branchesList]);

  // Filter state
  const [nationalityFilter, setNationalityFilter] = useState<number | null>(null);
  const [jobFilter, setJobFilter] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Translations
  const t = {
    title: isArabic ? 'اختر العرض' : 'Select Offer',
    subtitle: isArabic
      ? 'اختر عرض من الجدول أدناه لملء البيانات تلقائياً'
      : 'Select an offer from the table below to auto-fill contract data',
    search: isArabic ? 'بحث...' : 'Search...',
    nationality: isArabic ? 'الجنسية' : 'Nationality',
    job: isArabic ? 'الوظيفة' : 'Job',
    all: isArabic ? 'الكل' : 'All',
    salary: isArabic ? 'الراتب' : 'Salary',
    localCost: isArabic ? 'التكلفة المحلية' : 'Local Cost',
    agentCostSAR: isArabic ? 'تكلفة الوكيل (ريال)' : 'Agent Cost (SAR)',
    workerType: isArabic ? 'نوع العامل' : 'Worker Type',
    age: isArabic ? 'العمر' : 'Age',
    religion: isArabic ? 'الديانة' : 'Religion',
    experience: isArabic ? 'الخبرة' : 'Experience',
    branch: isArabic ? 'الفرع' : 'Branch',
    noOffers: isArabic ? 'لا توجد عروض' : 'No offers found',
    loading: isArabic ? 'جاري التحميل...' : 'Loading...',
    selected: isArabic ? 'محدد' : 'Selected',
    sar: isArabic ? 'ريال' : 'SAR',
    notDefined: isArabic ? 'غير محدد' : 'N/A',
    selectedOffer: isArabic ? 'العرض المحدد' : 'Selected Offer',
    taxLocalCost: isArabic ? 'ضريبة التكلفة' : 'Tax on Cost',
  };

  // Helper: resolve nationality name
  const getNationalityName = useCallback(
    (offer: MediationContractOffer): string => {
      // 1. Use joined name from API (if not null)
      if (offer.nationalityName) return offer.nationalityName;
      // 2. Lookup from NATIONALITIES enum (preferred — joined names from API are null)
      if (offer.nationalityId) {
        const enumNat = (
          NATIONALITIES as ReadonlyArray<{ value: number; labelAr: string; labelEn: string }>
        ).find((n) => n.value === offer.nationalityId);
        if (enumNat) return isArabic ? enumNat.labelAr : enumNat.labelEn;
      }
      // 3. Fallback: nationalities API lookup by nationalityId field
      if (offer.nationalityId) {
        const nat = (nationalities as any[]).find(
          (n: any) => n.nationalityId === offer.nationalityId
        );
        if (nat) {
          const name = isArabic
            ? nat.nationalityNameAr || nat.nationalityNameEn
            : nat.nationalityNameEn || nat.nationalityNameAr;
          if (name) return name;
        }
      }
      return isArabic ? 'غير محدد' : 'N/A';
    },
    [nationalities, isArabic]
  );

  // Helper: resolve branch name
  const getBranchName = useCallback(
    (offer: MediationContractOffer): string => {
      if (offer.branchName) return offer.branchName;
      if (offer.branchId) {
        console.log('🏢 getBranchName: branchId=', offer.branchId, 'branches=', branches);
        const branch = (branches as any[]).find(
          (b: any) => Number(b.id) === Number(offer.branchId)
        );
        if (branch)
          return isArabic
            ? branch.nameAr || branch.nameEn || `#${offer.branchId}`
            : branch.nameEn || branch.nameAr || `#${offer.branchId}`;
        // Lookup failed — show raw ID so we can debug
        return `#${offer.branchId}`;
      }
      return isArabic ? 'غير محدد' : 'N/A';
    },
    [branches, isArabic]
  );

  // Helper: resolve job name
  const getJobName = useCallback(
    (offer: MediationContractOffer): string => {
      if (offer.jobName) return offer.jobName;
      if (offer.jobId) {
        const job = (jobs as any[]).find((j: any) => j.id === offer.jobId);
        if (job)
          return isArabic ? job.jobNameAr || job.name : job.jobNameEn || job.jobNameAr || job.name;
      }
      return isArabic ? 'غير محدد' : 'N/A';
    },
    [jobs, isArabic]
  );

  // Format currency
  const formatSAR = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return t.notDefined;
    return `${val.toLocaleString(isArabic ? 'ar-SA' : 'en-US')} ${t.sar}`;
  };

  // Nationality options for filter dropdown
  // value = nationalityId (the enum value, e.g. 359) — matches offer.nationalityId for correct filtering
  const nationalityOptions = useMemo(() => {
    const usedIds = new Set(offers.map((o) => o.nationalityId).filter(Boolean));
    const opts: { value: number; label: string }[] = [];
    const seen = new Set<number>();

    // From API nationalities (match by nationalityId field)
    (nationalities as any[]).forEach((n: any) => {
      const natId = n.nationalityId as number | undefined;
      if (natId && usedIds.has(natId) && !seen.has(natId)) {
        seen.add(natId);
        const enumEntry = (
          NATIONALITIES as ReadonlyArray<{ value: number; labelAr: string; labelEn: string }>
        ).find((e) => e.value === natId);
        opts.push({
          value: natId,
          label: isArabic
            ? n.nationalityName || enumEntry?.labelAr || `#${natId}`
            : n.nationalityName || enumEntry?.labelEn || enumEntry?.labelAr || `#${natId}`,
        });
      }
    });

    // From enum (fill any gaps not covered by API)
    (NATIONALITIES as ReadonlyArray<{ value: number; labelAr: string; labelEn: string }>).forEach(
      (n) => {
        if (usedIds.has(n.value) && !seen.has(n.value)) {
          seen.add(n.value);
          opts.push({ value: n.value, label: isArabic ? n.labelAr : n.labelEn });
        }
      }
    );

    return opts;
  }, [nationalities, offers, isArabic]);

  // Job options for filter dropdown
  const jobOptions = useMemo(() => {
    const usedIds = new Set(offers.map((o) => o.jobId).filter(Boolean));
    return (jobs as any[])
      .filter((j: any) => usedIds.has(j.id))
      .map((j: any) => ({
        value: j.id,
        label: isArabic
          ? j.jobNameAr || j.name
          : j.jobNameEn || j.jobNameAr || j.name || `#${j.id}`,
      }));
  }, [jobs, offers, isArabic]);

  // Filtered offers
  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      // Nationality filter
      if (nationalityFilter && offer.nationalityId !== nationalityFilter) return false;
      // Job filter
      if (jobFilter && offer.jobId !== jobFilter) return false;
      // Search term (search across nationality name, job name)
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const natName = getNationalityName(offer).toLowerCase();
        const jobName = getJobName(offer).toLowerCase();
        const branchName = getBranchName(offer).toLowerCase();
        if (
          !natName.includes(search) &&
          !jobName.includes(search) &&
          !branchName.includes(search) &&
          !String(offer.id).includes(search)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [
    offers,
    nationalityFilter,
    jobFilter,
    searchTerm,
    getNationalityName,
    getJobName,
    getBranchName,
  ]);

  // Find currently selected offer for the highlight badge
  const selectedOffer = selectedOfferId ? offers.find((o) => o.id === selectedOfferId) : null;

  // Table columns
  const columns: ColumnsType<MediationContractOffer> = [
    {
      title: '#',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      render: (id: number) => (
        <span style={{ fontWeight: selectedOfferId === id ? 700 : 400 }}>
          {id}
          {selectedOfferId === id && (
            <CheckCircleFilled style={{ color: '#52c41a', marginInlineStart: 4 }} />
          )}
        </span>
      ),
    },
    {
      title: t.nationality,
      key: 'nationality',
      render: (_: unknown, record) => getNationalityName(record),
      sorter: (a, b) => getNationalityName(a).localeCompare(getNationalityName(b)),
    },
    {
      title: t.job,
      key: 'job',
      render: (_: unknown, record) => getJobName(record),
      sorter: (a, b) => getJobName(a).localeCompare(getJobName(b)),
    },
    {
      title: t.workerType,
      dataIndex: 'workerType',
      key: 'workerType',
      width: 100,
      render: (val: number | null | undefined) => getEnumLabel([...WORKER_TYPE], val, language),
    },
    {
      title: t.experience,
      dataIndex: 'previousExperience',
      key: 'previousExperience',
      width: 120,
      render: (val: number | null | undefined) =>
        getEnumLabel([...PREVIOUS_EXPERIENCE], val, language),
    },
    {
      title: t.religion,
      dataIndex: 'religion',
      key: 'religion',
      width: 90,
      render: (val: number | null | undefined) => getEnumLabel([...RELIGION], val, language),
    },
    {
      title: t.salary,
      dataIndex: 'salary',
      key: 'salary',
      width: 120,
      render: (val: number | null | undefined) => <Tag color="blue">{formatSAR(val)}</Tag>,
      sorter: (a, b) => (a.salary || 0) - (b.salary || 0),
    },
    {
      title: t.localCost,
      dataIndex: 'localCost',
      key: 'localCost',
      width: 130,
      render: (val: number | null | undefined) => <Tag color="green">{formatSAR(val)}</Tag>,
      sorter: (a, b) => (a.localCost || 0) - (b.localCost || 0),
    },
    {
      title: t.agentCostSAR,
      dataIndex: 'agentCostSAR',
      key: 'agentCostSAR',
      width: 140,
      render: (val: number | null | undefined) => <Tag color="orange">{formatSAR(val)}</Tag>,
      sorter: (a, b) => (a.agentCostSAR || 0) - (b.agentCostSAR || 0),
    },
    {
      title: t.branch,
      key: 'branch',
      width: 120,
      render: (_: unknown, record) => getBranchName(record),
    },
  ];

  // Loading state
  if (isLoadingOffers && !externalOffers) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin size="large" />
        <p style={{ marginTop: 12, color: '#666' }}>{t.loading}</p>
      </div>
    );
  }

  const tableContent = (
    <>
      {/* Filters Row */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Input
            placeholder={t.search}
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={12} sm={8}>
          <Select
            placeholder={t.nationality}
            value={nationalityFilter}
            onChange={setNationalityFilter}
            allowClear
            showSearch
            optionFilterProp="label"
            style={{ width: '100%' }}
            options={[{ value: null as any, label: `-- ${t.all} --` }, ...nationalityOptions]}
          />
        </Col>
        <Col xs={12} sm={8}>
          <Select
            placeholder={t.job}
            value={jobFilter}
            onChange={setJobFilter}
            allowClear
            showSearch
            optionFilterProp="label"
            style={{ width: '100%' }}
            options={[{ value: null as any, label: `-- ${t.all} --` }, ...jobOptions]}
          />
        </Col>
      </Row>

      {/* Selected Offer Info Banner */}
      {selectedOffer && (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleFilled />}
          style={{ marginBottom: 12 }}
          message={
            <span>
              <strong>{t.selectedOffer}: </strong>#{selectedOffer.id} —{' '}
              {getNationalityName(selectedOffer)} — {getJobName(selectedOffer)}
              {' | '}
              {t.salary}: {formatSAR(selectedOffer.salary)}
              {' | '}
              {t.localCost}: {formatSAR(selectedOffer.localCost)}
              {' | '}
              {t.agentCostSAR}: {formatSAR(selectedOffer.agentCostSAR)}
            </span>
          }
        />
      )}

      {/* Table */}
      <Table<MediationContractOffer>
        dataSource={filteredOffers}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={{ pageSize: 8, showSizeChanger: true, pageSizeOptions: ['5', '8', '15', '25'] }}
        scroll={{ x: 900 }}
        locale={{ emptyText: <Empty description={t.noOffers} /> }}
        rowClassName={(record) => (record.id === selectedOfferId ? 'ant-table-row-selected' : '')}
        onRow={(record) => ({
          onClick: () => onSelect(record),
          style: {
            cursor: 'pointer',
            background: record.id === selectedOfferId ? '#e6f7ff' : undefined,
          },
        })}
      />
    </>
  );

  if (compact) {
    return tableContent;
  }

  return (
    <Card
      title={
        <span>
          <DollarOutlined style={{ marginInlineEnd: 8, color: '#003366' }} />
          {t.title}
        </span>
      }
      style={{ marginBottom: 16 }}
      bodyStyle={{ padding: '16px' }}
    >
      <p style={{ color: '#666', marginBottom: 12, fontSize: 13 }}>{t.subtitle}</p>
      {tableContent}
    </Card>
  );
}
