'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Table,
  Input,
  Select,
  Tag,
  Empty,
  Spin,
  Card,
  Row,
  Col,
  Alert,
  Button,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  CheckCircleFilled,
  DollarOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useEmploymentContractOffers } from '@/hooks/api/useEmploymentContractOffers';
import { useJobs } from '@/hooks/api/useJobs';
import { useBranches } from '@/hooks/api/useBranches';
import type { EmploymentContractOffer } from '@/types/api.types';
import { OFFER_TYPE, NATIONALITIES, getEnumLabel } from '@/constants/enums';

interface RentOfferSelectorProps {
  /** Currently selected offer ID (controlled) */
  selectedOfferId?: number | string | null;
  /** Callback when an offer row is selected */
  onSelect: (offer: EmploymentContractOffer) => void;
  /** Language: 'ar' | 'en' */
  language: 'ar' | 'en';
  /** Optional: pass offers externally (fallback to hook) */
  offers?: EmploymentContractOffer[];
  /** Optional: hide the component header card */
  compact?: boolean;
}

/**
 * RentOfferSelector
 * Displays a searchable / filterable table of Employment Contract Offers.
 * When the user clicks a row, it calls onSelect(offer) so the parent form
 * can auto-fill cost, insurance, duration, nationalityId, jobId, offerId, etc.
 */
export default function RentOfferSelector({
  selectedOfferId,
  onSelect,
  language,
  offers: externalOffers,
  compact = false,
}: RentOfferSelectorProps) {
  const isArabic = language === 'ar';

  // Fetch offers from API if not provided externally
  const {
    offers: apiOffersRaw,
    isLoading: isLoadingOffers,
    refetch: refetchOffers,
  } = useEmploymentContractOffers();
  const apiOffers = useMemo((): EmploymentContractOffer[] => {
    if (!apiOffersRaw) return [];
    if (Array.isArray(apiOffersRaw)) return apiOffersRaw;
    if (
      typeof apiOffersRaw === 'object' &&
      'data' in apiOffersRaw &&
      Array.isArray((apiOffersRaw as any).data)
    ) {
      return (apiOffersRaw as any).data;
    }
    return [];
  }, [apiOffersRaw]);

  const offers = useMemo(() => {
    const raw = externalOffers ?? apiOffers ?? [];
    // Filter only active offers
    return raw.filter((o) => o.isActive !== false);
  }, [externalOffers, apiOffers]);

  // Lookup data for display
  const { data: jobs = [] } = useJobs();
  const { branches } = useBranches();

  // Filter state
  const [nationalityFilter, setNationalityFilter] = useState<number | null>(null);
  const [jobFilter, setJobFilter] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Translations
  const t = {
    title: isArabic ? 'اختر عرض التشغيل' : 'Select Operating Offer',
    subtitle: isArabic
      ? 'اختر عرض من الجدول أدناه لملء بيانات العقد تلقائياً'
      : 'Select an offer from the table below to auto-fill contract data',
    search: isArabic ? 'بحث...' : 'Search...',
    nationality: isArabic ? 'الجنسية' : 'Nationality',
    job: isArabic ? 'الوظيفة' : 'Job',
    all: isArabic ? 'الكل' : 'All',
    cost: isArabic ? 'التكلفة' : 'Cost',
    costTax: isArabic ? 'الضريبة' : 'Tax',
    totalCostWithTax: isArabic ? 'الإجمالي مع الضريبة' : 'Total with Tax',
    insurance: isArabic ? 'التأمين' : 'Insurance',
    workerSalary: isArabic ? 'راتب العامل' : 'Worker Salary',
    duration: isArabic ? 'المدة (أشهر)' : 'Duration (months)',
    offerType: isArabic ? 'نوع العرض' : 'Offer Type',
    branch: isArabic ? 'الفرع' : 'Branch',
    experience: isArabic ? 'الخبرة' : 'Experience',
    noOffers: isArabic ? 'لا توجد عروض' : 'No offers found',
    loading: isArabic ? 'جاري التحميل...' : 'Loading...',
    selected: isArabic ? 'محدد' : 'Selected',
    refresh: isArabic ? 'تحديث العروض' : 'Refresh Offers',
    sar: isArabic ? 'ريال' : 'SAR',
    notDefined: isArabic ? 'غير محدد' : 'N/A',
    selectedOffer: isArabic ? 'العرض المحدد' : 'Selected Offer',
    numberOfDays: isArabic ? 'عدد الأيام' : 'Number of Days',
  };

  // Helper: resolve nationality name
  const getNationalityName = useCallback(
    (offer: EmploymentContractOffer): string => {
      // 1. Use joined name from API
      if (offer.nationalityName) return offer.nationalityName;
      // 2. Lookup from NATIONALITIES enum
      if (offer.nationalityId) {
        const nat = NATIONALITIES.find((n) => n.value === offer.nationalityId);
        if (nat) return isArabic ? nat.labelAr : nat.labelEn;
      }
      return t.notDefined;
    },
    [isArabic, t.notDefined]
  );

  // Helper: resolve job name
  const getJobName = useCallback(
    (offer: EmploymentContractOffer): string => {
      if (offer.jobName) return offer.jobName;
      if (offer.jobId) {
        const job = (jobs as any[]).find((j: any) => j.id === offer.jobId);
        if (job)
          return isArabic ? job.jobNameAr || job.name : job.jobNameEn || job.jobNameAr || job.name;
      }
      return t.notDefined;
    },
    [jobs, isArabic, t.notDefined]
  );

  // Helper: resolve branch name
  const getBranchName = useCallback(
    (offer: EmploymentContractOffer): string => {
      if (offer.branchName) return offer.branchName;
      if (offer.branchId && branches) {
        const branch = branches.find((b: any) => b.id === offer.branchId);
        if (branch) return (isArabic ? branch.nameAr : branch.nameEn) || t.notDefined;
      }
      return t.notDefined;
    },
    [branches, isArabic, t.notDefined]
  );

  // Format currency
  const formatSAR = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return t.notDefined;
    return `${val.toLocaleString(isArabic ? 'ar-SA' : 'en-US')} ${t.sar}`;
  };

  // Nationality options for filter dropdown
  const nationalityOptions = useMemo(() => {
    const usedIds = new Set(offers.map((o) => o.nationalityId).filter(Boolean));
    return NATIONALITIES.filter((n) => usedIds.has(n.value)).map((n) => ({
      value: n.value,
      label: isArabic ? n.labelAr : n.labelEn,
    }));
  }, [offers, isArabic]);

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
      if (nationalityFilter && offer.nationalityId !== nationalityFilter) return false;
      if (jobFilter && offer.jobId !== jobFilter) return false;
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const natName = getNationalityName(offer).toLowerCase();
        const jobName = getJobName(offer).toLowerCase();
        const branchName = getBranchName(offer).toLowerCase();
        const offerTitle = (offer.offerTitle || '').toLowerCase();
        if (
          !natName.includes(search) &&
          !jobName.includes(search) &&
          !branchName.includes(search) &&
          !offerTitle.includes(search) &&
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

  // Find currently selected offer
  const selectedOffer = selectedOfferId ? offers.find((o) => o.id === selectedOfferId) : null;

  // Table columns
  const columns: ColumnsType<EmploymentContractOffer> = [
    {
      title: '#',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      render: (id: number | string) => (
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
      title: t.offerType,
      key: 'offerType',
      width: 110,
      render: (_: unknown, record) => getEnumLabel([...OFFER_TYPE], record.offerType, language),
    },
    {
      title: t.duration,
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      align: 'center',
      render: (val: number | null | undefined) =>
        val ? `${val} ${isArabic ? 'شهر' : 'mo'}` : t.notDefined,
    },
    {
      title: t.cost,
      dataIndex: 'cost',
      key: 'cost',
      width: 120,
      render: (val: number | null | undefined) => <Tag color="blue">{formatSAR(val)}</Tag>,
      sorter: (a, b) => (a.cost || 0) - (b.cost || 0),
    },
    {
      title: t.costTax,
      dataIndex: 'costTax',
      key: 'costTax',
      width: 110,
      render: (val: number | null | undefined) => <Tag color="orange">{formatSAR(val)}</Tag>,
    },
    {
      title: t.totalCostWithTax,
      dataIndex: 'totalCostWithTax',
      key: 'totalCostWithTax',
      width: 140,
      render: (val: number | null | undefined) => (
        <Tag color="green" style={{ fontWeight: 600 }}>
          {formatSAR(val)}
        </Tag>
      ),
      sorter: (a, b) => (a.totalCostWithTax || 0) - (b.totalCostWithTax || 0),
    },
    {
      title: t.insurance,
      dataIndex: 'insurance',
      key: 'insurance',
      width: 110,
      render: (val: number | null | undefined) => <Tag color="purple">{formatSAR(val)}</Tag>,
    },
    {
      title: t.workerSalary,
      dataIndex: 'workerSalary',
      key: 'workerSalary',
      width: 120,
      render: (val: number | null | undefined) => <Tag color="cyan">{formatSAR(val)}</Tag>,
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
        {!externalOffers && (
          <Col xs={24} sm="auto" style={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title={t.refresh}>
              <Button
                icon={<ReloadOutlined />}
                loading={isLoadingOffers}
                onClick={() => refetchOffers()}
              />
            </Tooltip>
          </Col>
        )}
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
              {t.cost}: {formatSAR(selectedOffer.cost)}
              {' | '}
              {t.totalCostWithTax}: {formatSAR(selectedOffer.totalCostWithTax)}
              {' | '}
              {t.insurance}: {formatSAR(selectedOffer.insurance)}
            </span>
          }
        />
      )}

      {/* Table */}
      <Table<EmploymentContractOffer>
        dataSource={filteredOffers}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={{ pageSize: 8, showSizeChanger: true, pageSizeOptions: ['5', '8', '15', '25'] }}
        scroll={{ x: 1100 }}
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
      styles={{ body: { padding: '16px' } }}
    >
      <p style={{ color: '#666', marginBottom: 12, fontSize: 13 }}>{t.subtitle}</p>
      {tableContent}
    </Card>
  );
}
