'use client';

import { useState, useMemo, useCallback } from 'react';
import { Table, Input, Select, Tag, Empty, Spin, Card, Row, Col, Alert } from 'antd';
import { SearchOutlined, CheckCircleFilled, DollarOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useMediationOffers } from '@/hooks/api/useMediationOffers';
import type { MediationContractOffer } from '@/types/api.types';
import {
  WORKER_TYPE,
  RELIGION,
  PREVIOUS_EXPERIENCE,
  getEnumLabel,
} from '@/constants/enums';

interface OfferSelectorProps {
  /** Currently selected offer ID (controlled) */
  selectedOfferId?: string | number | null;
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

  // Filter state
  const [nationalityFilter, setNationalityFilter] = useState<string | null>(null);
  const [jobFilter, setJobFilter] = useState<string | null>(null);
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
    noOffers: isArabic ? 'لا توجد عروض' : 'No offers found',
    loading: isArabic ? 'جاري التحميل...' : 'Loading...',
    selected: isArabic ? 'محدد' : 'Selected',
    sar: isArabic ? 'ريال' : 'SAR',
    notDefined: isArabic ? 'غير محدد' : 'N/A',
    selectedOffer: isArabic ? 'العرض المحدد' : 'Selected Offer',
    taxLocalCost: isArabic ? 'ضريبة التكلفة' : 'Tax on Cost',
  };

  // Helper: resolve nationality name — uses joined fields from API response
  const getNationalityName = useCallback(
    (offer: MediationContractOffer): string => {
      if (isArabic) return offer.nationalityNameAr || offer.nationalityName || (isArabic ? 'غير محدد' : 'N/A');
      return offer.nationalityNameEn || offer.nationalityName || 'N/A';
    },
    [isArabic]
  );

  

  // Helper: resolve job name
  const getJobName = useCallback(
    (offer: MediationContractOffer): string => {
      return offer.jobName || (isArabic ? 'غير محدد' : 'N/A');
    },
    [isArabic]
  );

  // Format currency
  const formatSAR = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return t.notDefined;
    return `${val.toLocaleString(isArabic ? 'ar-SA' : 'en-US')} ${t.sar}`;
  };

  // Nationality options for filter dropdown — built from offers directly (UUID-based)
  const nationalityOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: { value: string; label: string }[] = [];
    offers.forEach((o) => {
      if (!o.nationalityId) return;
      const key = String(o.nationalityId);
      if (seen.has(key)) return;
      seen.add(key);
      const label = isArabic
        ? o.nationalityNameAr || o.nationalityNameEn || o.nationalityName || key
        : o.nationalityNameEn || o.nationalityNameAr || o.nationalityName || key;
      opts.push({ value: key, label });
    });
    return opts;
  }, [offers, isArabic]);

  // Job options for filter dropdown — built from offers directly (UUID-based)
  const jobOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: { value: string; label: string }[] = [];
    offers.forEach((o) => {
      if (!o.jobId) return;
      const key = String(o.jobId);
      if (seen.has(key)) return;
      seen.add(key);
      const label = isArabic
        ? o.jobName || key
        : o.jobName || key;
      opts.push({ value: key, label });
    });
    return opts;
  }, [offers, isArabic]);

  // Filtered offers
  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      // Nationality filter
      if (nationalityFilter && String(offer.nationalityId) !== nationalityFilter) return false;
      // Job filter
      if (jobFilter && String(offer.jobId) !== jobFilter) return false;
      // Search term (search across nationality name, job name)
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const natName = getNationalityName(offer).toLowerCase();
        const jobName = getJobName(offer).toLowerCase();
        if (
          !natName.includes(search) &&
          !jobName.includes(search) &&
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
  ]);

  // Find currently selected offer for the highlight badge
  const selectedOffer = selectedOfferId
    ? offers.find((o) => String(o.id) === String(selectedOfferId))
    : null;

  // Table columns
  const columns: ColumnsType<MediationContractOffer> = [
    {
      title: '#',
      dataIndex: 'offerNumber',
      key: 'offerNumber',
      width: 60,
      render: (offerNumber: number | null, record) => {
        const isSelected = String(record.id) === String(selectedOfferId);
        return (
          <span style={{ fontWeight: isSelected ? 700 : 400 }}>
            {offerNumber ?? record.id}
            {isSelected && (
              <CheckCircleFilled style={{ color: '#52c41a', marginInlineStart: 4 }} />
            )}
          </span>
        );
      },
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
      title: isArabic ? 'الإجمالي' : 'Total Cost',
      dataIndex: 'totalOfferCost',
      key: 'totalOfferCost',
      width: 140,
      render: (val: number | null | undefined) => <Tag color="purple">{formatSAR(val)}</Tag>,
      sorter: (a, b) => (a.totalOfferCost || 0) - (b.totalOfferCost || 0),
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
        rowClassName={(record) =>
          String(record.id) === String(selectedOfferId) ? 'ant-table-row-selected' : ''
        }
        onRow={(record) => ({
          onClick: () => onSelect(record),
          style: {
            cursor: 'pointer',
            background:
              String(record.id) === String(selectedOfferId) ? '#e6f7ff' : undefined,
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
