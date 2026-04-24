'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Input,
  Select,
  Spin,
  Empty,
  Table,
  Tag,
  Space,
  Dropdown,
  Tooltip,
  Popconfirm,
  message,
  Modal,
  Form,
  Switch,
  Divider,
} from 'antd';
import type { MenuProps, TableColumnsType } from 'antd';
import {
  DollarOutlined,
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FilterOutlined,
  FileTextOutlined,
  ShopOutlined,
  GlobalOutlined,
  DownOutlined,
  GiftOutlined,
  AppstoreOutlined,
  ReloadOutlined,
  SaveOutlined,
  CalculatorOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useEmploymentContractOffers } from '@/hooks/api/useEmploymentContractOffers';
import { useBranches } from '@/hooks/api/useBranches';
import { useNationalities } from '@/hooks/api/useNationalities';
import { useJobs } from '@/hooks/api/useJobs';
import type { EmploymentContractOffer, UpdateOperatingContractOfferDto } from '@/types/api.types';
import styles from './RentPricesOffers.module.css';

const periodTypes = [
  { id: 46, monthsCount: 1, label: { ar: 'شهري', en: 'Monthly' } },
  { id: 52, monthsCount: 3, label: { ar: 'ربع سنوي', en: 'Quarterly' } },
  { id: 53, monthsCount: 6, label: { ar: 'نصف سنوي', en: 'Semi-Annual' } },
  { id: 189, monthsCount: 12, label: { ar: 'سنوي', en: 'Annual' } },
  { id: 190, monthsCount: 1, label: { ar: 'اثيوبيا', en: 'Ethiopia' } },
];

const offerTypeLabels: Record<number, { ar: string; en: string }> = {
  1: { ar: 'مدة', en: 'Duration' },
  3: { ar: 'نقل خدمات', en: 'Service Transfer' },
  5: { ar: 'مدة يومي', en: 'Daily Duration' },
};

export default function RentPricesOffersPage() {
  const language = useAuthStore((state) => state.language);
  const isAr = language === 'ar';

  const [searchText, setSearchText] = useState('');
  const [nationalityFilter, setNationalityFilter] = useState<string>('all');
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<EmploymentContractOffer | null>(null);
  const [editForm] = Form.useForm();
  const [editCost, setEditCost] = useState(0);
  const [editInsurance, setEditInsurance] = useState(0);
  const [editSalary, setEditSalary] = useState(0);
  const [editPeriodId, setEditPeriodId] = useState<number>(periodTypes[0].id);

  // Data hooks
  const {
    offers: offersRaw,
    isLoading,
    refetch,
    updateOfferAsync,
    deleteOffer,
    isUpdating,
    isDeleting,
  } = useEmploymentContractOffers();

  const { branches } = useBranches();
  const { data: nationalities = [] } = useNationalities();
  const { data: jobsData } = useJobs();

  // ── translations ─────────────────────────────────────────────────────────
  const t = (key: string) => {
    const map: Record<string, { ar: string; en: string }> = {
      pageTitle: { ar: 'عروض و اسعار التشغيل', en: 'Operating Prices & Offers' },
      totalOffers: { ar: 'إجمالي العروض', en: 'Total Offers' },
      nationalities: { ar: 'الجنسيات', en: 'Nationalities' },
      branch: { ar: 'الفرع', en: 'Branch' },
      addOffer: { ar: 'إضافة عروض و اسعار', en: 'Add Offer' },
      addSpecialOffer: { ar: 'إضافة عروض خاصة', en: 'Add Special Offer' },
      addPackageOffer: { ar: 'إضافة عروض الباقات', en: 'Add Package Offer' },
      duration: { ar: 'مدة', en: 'Duration' },
      serviceTransfer: { ar: 'نقل الخدمات', en: 'Service Transfer' },
      dailyDuration: { ar: 'مدة (يومية)', en: 'Duration (Daily)' },
      dailyServiceTransfer: { ar: 'نقل الخدمات (يومية)', en: 'Service Transfer (Daily)' },
      refresh: { ar: 'تحديث', en: 'Refresh' },
      all: { ar: 'الكل', en: 'All' },
      allBranches: { ar: 'كل الفروع', en: 'All Branches' },
      noData: { ar: 'لا توجد عروض', en: 'No Offers Found' },
      nationality: { ar: 'الجنسية', en: 'Nationality' },
      job: { ar: 'الوظيفة', en: 'Job' },
      offerType: { ar: 'نوع العرض', en: 'Offer Type' },
      durationLabel: { ar: 'المدة', en: 'Duration' },
      cost: { ar: 'التكلفة', en: 'Cost' },
      costTax: { ar: 'الضريبة', en: 'Tax' },
      insurance: { ar: 'التأمين', en: 'Insurance' },
      workerSalary: { ar: 'راتب العامل', en: 'Worker Salary' },
      totalCostWithTax: { ar: 'الإجمالي مع الضريبة', en: 'Total with Tax' },
      isActive: { ar: 'نشط', en: 'Active' },
      inactive: { ar: 'غير نشط', en: 'Inactive' },
      actions: { ar: 'إجراءات', en: 'Actions' },
      edit: { ar: 'تعديل', en: 'Edit' },
      delete: { ar: 'حذف', en: 'Delete' },
      deleteConfirm: { ar: 'هل تريد حذف هذا العرض؟', en: 'Delete this offer?' },
      save: { ar: 'حفظ', en: 'Save' },
      cancel: { ar: 'إلغاء', en: 'Cancel' },
      editOffer: { ar: 'تعديل العرض', en: 'Edit Offer' },
      updateSuccess: { ar: 'تم تحديث العرض', en: 'Offer updated' },
      updateError: { ar: 'فشل التحديث', en: 'Update failed' },
      deleteSuccess: { ar: 'تم حذف العرض', en: 'Offer deleted' },
      offerSummary: { ar: 'ملخص العرض', en: 'Offer Summary' },
      activate: { ar: 'تفعيل', en: 'Activate' },
      showForExternalCustomers: { ar: 'للعملاء الخارجيين', en: 'External Customers' },
      showForReception: { ar: 'للاستقبال', en: 'Reception' },
      search: { ar: 'بحث...', en: 'Search...' },
      total: { ar: 'العدد', en: 'Total' },
      shown: { ar: 'المعروض', en: 'Shown' },
      index: { ar: '#', en: '#' },
    };
    return map[key]?.[language] ?? key;
  };

  // ── normalise raw response ────────────────────────────────────────────────
  // The service already extracts the array, but we add fallbacks for safety
  const allOffers = useMemo((): EmploymentContractOffer[] => {
    if (!offersRaw) return [];
    // Service returns plain array — most common path
    if (Array.isArray(offersRaw)) return offersRaw;
    const r = offersRaw as any;
    // { success, data: { items: [...] } }
    if (Array.isArray(r?.data?.items)) return r.data.items;
    // { data: [...] }
    if (Array.isArray(r?.data)) return r.data;
    // { items: [...] }
    if (Array.isArray(r?.items)) return r.items;
    return [];
  }, [offersRaw]);

  // ── lookup maps ──────────────────────────────────────────────────────────
  const nationalityMap = useMemo(() => {
    const m = new Map<string, string>();
    nationalities.forEach((n) =>
      m.set(String(n.id), isAr
        ? n.nationalityNameAr || n.nationalityNameEn || String(n.id)
        : n.nationalityNameEn || n.nationalityNameAr || String(n.id))
    );
    return m;
  }, [nationalities, isAr]);

  const jobMap = useMemo(() => {
    const m = new Map<string, string>();
    const arr = Array.isArray(jobsData) ? jobsData : ((jobsData as any)?.data ?? []);
    (arr as any[]).forEach((j: any) =>
      m.set(String(j.id), isAr ? j.jobNameAr || j.name : j.jobNameEn || j.jobNameAr || j.name)
    );
    return m;
  }, [jobsData, isAr]);

  const branchMap = useMemo(() => {
    const m = new Map<string, string>();
    (branches || []).forEach((b: any) =>
      m.set(String(b.id), isAr ? b.nameAr : b.nameEn)
    );
    return m;
  }, [branches, isAr]);

  const getNat = (o: EmploymentContractOffer) =>
    o.nationalityName || nationalityMap.get(String(o.nationalityId ?? '')) || String(o.nationalityId ?? '—');
  const getJob = (o: EmploymentContractOffer) =>
    o.jobName || jobMap.get(String(o.jobId ?? '')) || String(o.jobId ?? '—');
  const getBranch = (o: EmploymentContractOffer) =>
    o.branchName || branchMap.get(String(o.branchId ?? '')) || t('allBranches');
  const getDuration = (id?: number | null) => {
    if (!id) return '—';
    const p = periodTypes.find((x) => x.id === id);
    return p ? p.label[language] : String(id);
  };
  const formatSAR = (v?: number | null) =>
    v != null ? `${v.toLocaleString(isAr ? 'ar-SA' : 'en-US')} ${isAr ? 'ريال' : 'SAR'}` : '—';

  // ── filter ───────────────────────────────────────────────────────────────
  const filteredOffers = useMemo(() => {
    return allOffers.filter((o) => {
      if (nationalityFilter !== 'all' && String(o.nationalityId) !== nationalityFilter) return false;
      if (jobFilter !== 'all' && String(o.jobId) !== jobFilter) return false;
      if (branchFilter !== 'all' && String(o.branchId) !== branchFilter) return false;
      if (searchText) {
        const q = searchText.toLowerCase();
        return (
          getNat(o).toLowerCase().includes(q) ||
          getJob(o).toLowerCase().includes(q) ||
          getBranch(o).toLowerCase().includes(q) ||
          (o.offerTitle || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allOffers, nationalityFilter, jobFilter, branchFilter, searchText]);

  // ── stats ────────────────────────────────────────────────────────────────
  const uniqueNationalities = useMemo(
    () => new Set(allOffers.map((o) => o.nationalityId).filter(Boolean)).size,
    [allOffers]
  );
  const uniqueBranches = useMemo(
    () => new Set(allOffers.map((o) => o.branchId).filter(Boolean)).size,
    [allOffers]
  );

  // ── edit modal ───────────────────────────────────────────────────────────
  const editTax = Math.round(editCost * 0.15);
  const editedPeriod = periodTypes.find((p) => p.id === editPeriodId);
  const editMonths = editedPeriod?.monthsCount ?? 1;
  const editTotal = Math.round(editCost + editTax + editSalary * editMonths + editInsurance);

  const openEdit = (offer: EmploymentContractOffer) => {
    setEditingOffer(offer);
    const c = offer.cost ?? 0;
    const ins = offer.insurance ?? 0;
    const sal = offer.workerSalary ?? 0;
    const per = offer.duration ?? periodTypes[0].id;
    setEditCost(c);
    setEditInsurance(ins);
    setEditSalary(sal);
    setEditPeriodId(per);
    editForm.setFieldsValue({
      nationalityId: offer.nationalityId ?? null,
      jobId: offer.jobId ?? null,
      branchId: offer.branchId ?? null,
      duration: per,
      cost: c,
      insurance: ins,
      workerSalary: sal,
      showForExternalCustomers: offer.showForExternalCustomers ?? false,
      showForReception: offer.showForReception ?? false,
      isActive: offer.isActive ?? true,
    });
    setEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingOffer) return;
    try {
      const vals = editForm.getFieldsValue();
      const payload: UpdateOperatingContractOfferDto = {
        offerType: editingOffer.offerType,
        offerContractType: editingOffer.offerContractType,
        nationalityId: vals.nationalityId,
        jobId: vals.jobId,
        branchId: vals.branchId || null,
        duration: editPeriodId,
        cost: editCost,
        costTax: editTax,
        insurance: editInsurance,
        workerSalary: editSalary,
        totalCostWithTax: editTotal,
        showForExternalCustomers: vals.showForExternalCustomers,
        showForReception: vals.showForReception,
        isActive: vals.isActive,
      };
      await updateOfferAsync({ id: editingOffer.id, data: payload });
      message.success(t('updateSuccess'));
      setEditModalOpen(false);
      setEditingOffer(null);
    } catch {
      message.error(t('updateError'));
    }
  };

  const handleDelete = (id: number | string) => {
    deleteOffer(id, {
      onSuccess: () => message.success(t('deleteSuccess')),
    });
  };

  // ── nationality / job options for filters ─────────────────────────────────
  const natOptions = useMemo(() =>
    nationalities.map((n) => ({
      value: String(n.id),
      label: isAr ? n.nationalityNameAr || n.nationalityNameEn : n.nationalityNameEn || n.nationalityNameAr,
    })), [nationalities, isAr]);

  const jobOptions = useMemo(() => {
    const arr = Array.isArray(jobsData) ? jobsData : ((jobsData as any)?.data ?? []);
    return (arr as any[]).map((j: any) => ({
      value: String(j.id),
      label: isAr ? j.jobNameAr || j.name : j.jobNameEn || j.jobNameAr || j.name,
    }));
  }, [jobsData, isAr]);

  // nationality + job options for edit modal
  const natEditOptions = useMemo(() =>
    nationalities.map((n) => ({
      value: String(n.id),
      label: isAr ? n.nationalityNameAr || n.nationalityNameEn : n.nationalityNameEn || n.nationalityNameAr,
    })), [nationalities, isAr]);

  const jobEditOptions = useMemo(() => {
    const arr = Array.isArray(jobsData) ? jobsData : ((jobsData as any)?.data ?? []);
    return (arr as any[]).map((j: any) => ({
      value: String(j.id),
      label: isAr ? j.jobNameAr || j.name : j.jobNameEn || j.jobNameAr || j.name,
    }));
  }, [jobsData, isAr]);

  // ── dropdown menus ────────────────────────────────────────────────────────
  const addOfferMenuItems: MenuProps['items'] = [
    { key: '1', label: <Link href="/contracts/operation/rent-prices-offers/add?type=1">{t('duration')}</Link> },
    { key: '3', label: <Link href="/contracts/operation/rent-prices-offers/add?type=3">{t('serviceTransfer')}</Link> },
    { key: '5', label: <Link href="/contracts/operation/rent-prices-offers/add?type=5">{t('dailyDuration')}</Link> },
    { key: '3d', label: <Link href="/contracts/operation/rent-prices-offers/add?type=3&daily=true">{t('dailyServiceTransfer')}</Link> },
  ];
  const addSpecialMenuItems: MenuProps['items'] = [
    { key: 's1', label: <Link href="/contracts/operation/rent-prices-offers/add-offer?type=1">{t('duration')}</Link> },
    { key: 's3', label: <Link href="/contracts/operation/rent-prices-offers/add-offer?type=3">{t('serviceTransfer')}</Link> },
  ];
  const addPackageMenuItems: MenuProps['items'] = [
    { key: 'p1', label: <Link href="/contracts/operation/rent-prices-offers/add-package?type=1">{t('duration')}</Link> },
    { key: 'p3', label: <Link href="/contracts/operation/rent-prices-offers/add-package?type=3">{t('serviceTransfer')}</Link> },
  ];

  // ── table columns ─────────────────────────────────────────────────────────
  const columns: TableColumnsType<EmploymentContractOffer> = [
    {
      title: t('index'),
      key: 'index',
      width: 55,
      align: 'center',
      render: (_: any, __: any, i: number) => (currentPage - 1) * pageSize + i + 1,
    },
    {
      title: t('nationality'),
      key: 'nationality',
      render: (_: any, r) => getNat(r) || '—',
      sorter: (a, b) => getNat(a).localeCompare(getNat(b)),
    },
    {
      title: t('job'),
      key: 'job',
      render: (_: any, r) => getJob(r) || '—',
      sorter: (a, b) => getJob(a).localeCompare(getJob(b)),
    },
    {
      title: t('branch'),
      key: 'branch',
      render: (_: any, r) => getBranch(r),
    },
    {
      title: t('offerType'),
      key: 'offerType',
      width: 120,
      render: (_: any, r) => {
        const lbl = offerTypeLabels[r.offerType ?? 1]?.[language] ?? String(r.offerType ?? '');
        return <Tag color="blue">{lbl}</Tag>;
      },
    },
    {
      title: t('durationLabel'),
      key: 'duration',
      width: 110,
      render: (_: any, r) => getDuration(r.duration),
    },
    {
      title: t('cost'),
      dataIndex: 'cost',
      key: 'cost',
      align: 'end',
      render: (v: number) => formatSAR(v),
      sorter: (a, b) => (a.cost ?? 0) - (b.cost ?? 0),
    },
    {
      title: t('costTax'),
      key: 'costTax',
      align: 'end',
      render: (_: any, r) => formatSAR(Math.round((r.cost ?? 0) * 0.15)),
    },
    {
      title: t('insurance'),
      dataIndex: 'insurance',
      key: 'insurance',
      align: 'end',
      render: (v: number) => formatSAR(v),
    },
    {
      title: t('workerSalary'),
      dataIndex: 'workerSalary',
      key: 'workerSalary',
      align: 'end',
      render: (v: number) => formatSAR(v),
    },
    {
      title: t('totalCostWithTax'),
      dataIndex: 'totalCostWithTax',
      key: 'totalCostWithTax',
      align: 'end',
      render: (v: number) => <strong style={{ color: '#00478C' }}>{formatSAR(v)}</strong>,
      sorter: (a, b) => (a.totalCostWithTax ?? 0) - (b.totalCostWithTax ?? 0),
    },
    {
      title: t('isActive'),
      dataIndex: 'isActive',
      key: 'isActive',
      align: 'center',
      width: 90,
      render: (v: boolean) => (
        <Tag color={v ? 'success' : 'default'}>{v ? t('isActive') : t('inactive')}</Tag>
      ),
    },
    {
      title: t('actions'),
      key: 'actions',
      align: 'center',
      width: 100,
      fixed: 'right',
      render: (_: any, r) => (
        <Space>
          <Tooltip title={t('edit')}>
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="small"
              ghost
              onClick={() => openEdit(r)}
            />
          </Tooltip>
          <Popconfirm
            title={t('deleteConfirm')}
            okText={t('delete')}
            cancelText={t('cancel')}
            okButtonProps={{ danger: true, loading: isDeleting }}
            onConfirm={() => handleDelete(r.id)}
          >
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.offersPage}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <DollarOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('pageTitle')}</h1>
              <p className={styles.pageSubtitle}>
                {t('totalOffers')}: <strong>{allOffers.length}</strong>
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Dropdown menu={{ items: addOfferMenuItems }} trigger={['click']}>
              <Button type="primary" size="large" icon={<PlusOutlined />} className={styles.addButton}>
                {t('addOffer')} <DownOutlined />
              </Button>
            </Dropdown>
            <Dropdown menu={{ items: addSpecialMenuItems }} trigger={['click']}>
              <Button size="large" icon={<GiftOutlined />}
                style={{ background: '#17a2b8', color: '#fff', border: 'none' }}>
                {t('addSpecialOffer')} <DownOutlined />
              </Button>
            </Dropdown>
            <Dropdown menu={{ items: addPackageMenuItems }} trigger={['click']}>
              <Button type="primary" size="large" icon={<AppstoreOutlined />}>
                {t('addPackageOffer')} <DownOutlined />
              </Button>
            </Dropdown>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <Row gutter={[24, 24]} className={styles.statsRow}>
        <Col xs={24} sm={8}>
          <Card className={styles.statCard}>
            <div className={styles.statContent}>
              <div className={styles.statIcon} style={{ background: '#E3F2FD' }}>
                <FileTextOutlined style={{ color: '#00478C', fontSize: 24 }} />
              </div>
              <div className={styles.statInfo} style={{ textAlign: isAr ? 'right' : 'left' }}>
                <p className={styles.statLabel}>{t('totalOffers')}</p>
                <h3 className={styles.statValue}>{allOffers.length}</h3>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className={styles.statCard}>
            <div className={styles.statContent}>
              <div className={styles.statIcon} style={{ background: '#E8F5E9' }}>
                <GlobalOutlined style={{ color: '#00AA64', fontSize: 24 }} />
              </div>
              <div className={styles.statInfo} style={{ textAlign: isAr ? 'right' : 'left' }}>
                <p className={styles.statLabel}>{t('nationalities')}</p>
                <h3 className={styles.statValue}>{uniqueNationalities}</h3>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className={styles.statCard}>
            <div className={styles.statContent}>
              <div className={styles.statIcon} style={{ background: '#FFF3E0' }}>
                <ShopOutlined style={{ color: '#F59E0B', fontSize: 24 }} />
              </div>
              <div className={styles.statInfo} style={{ textAlign: isAr ? 'right' : 'left' }}>
                <p className={styles.statLabel}>{t('branch')}</p>
                <h3 className={styles.statValue}>{uniqueBranches}</h3>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* ── Filters ── */}
      <Card className={styles.filterPanel} style={{ marginBottom: 16 }}>
        <Row gutter={[16, 12]} align="middle">
          <Col xs={24} md={7}>
            <Input
              placeholder={t('search')}
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} md={5}>
            <Select
              style={{ width: '100%' }}
              placeholder={t('nationality')}
              showSearch
              optionFilterProp="label"
              value={nationalityFilter}
              onChange={setNationalityFilter}
              options={[
                { value: 'all', label: `— ${t('all')} —` },
                ...natOptions,
              ]}
            />
          </Col>
          <Col xs={24} md={5}>
            <Select
              style={{ width: '100%' }}
              placeholder={t('job')}
              showSearch
              optionFilterProp="label"
              value={jobFilter}
              onChange={setJobFilter}
              options={[
                { value: 'all', label: `— ${t('all')} —` },
                ...jobOptions,
              ]}
            />
          </Col>
          <Col xs={24} md={5}>
            <Select
              style={{ width: '100%' }}
              placeholder={t('branch')}
              showSearch
              optionFilterProp="label"
              value={branchFilter}
              onChange={setBranchFilter}
              options={[
                { value: 'all', label: t('allBranches') },
                ...(branches || []).map((b) => ({
                  value: String(b.id),
                  label: isAr ? b.nameAr : b.nameEn,
                })),
              ]}
            />
          </Col>
          <Col xs={24} md={2}>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setSearchText('');
                setNationalityFilter('all');
                setJobFilter('all');
                setBranchFilter('all');
                refetch();
              }}
            >
              {t('refresh')}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* ── Table ── */}
      <Card
        className={styles.tableCard}
        extra={
          <Space>
            <Select
              value={pageSize}
              onChange={setPageSize}
              style={{ width: 80 }}
              options={[10, 15, 20, 25, 50, 100].map((v) => ({ value: v, label: String(v) }))}
            />
            <Button icon={<ReloadOutlined />} onClick={() => refetch()} type="text" />
          </Space>
        }
      >
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large" />
          </div>
        ) : filteredOffers.length > 0 ? (
          <Table<EmploymentContractOffer>
            dataSource={filteredOffers}
            columns={columns}
            rowKey={(r) => String(r.id)}
            pagination={{
              current: currentPage,
              pageSize,
              total: filteredOffers.length,
              onChange: (page, size) => { setCurrentPage(page); setPageSize(size); },
              showTotal: (total, range) =>
                `${t('total')} ${total} · ${t('shown')} ${range[1] - range[0] + 1}`,
              showSizeChanger: false,
            }}
            bordered
            size="middle"
            scroll={{ x: 1400 }}
          />
        ) : (
          <Empty description={t('noData')} />
        )}
      </Card>

      {/* ── Edit Modal ── */}
      <Modal
        open={editModalOpen}
        title={
          <Space>
            <EditOutlined />
            {t('editOffer')} #{editingOffer?.id}
          </Space>
        }
        onCancel={() => { setEditModalOpen(false); setEditingOffer(null); }}
        footer={null}
        width={860}
        destroyOnClose
      >
        {editingOffer && (
          <Form form={editForm} layout="vertical">
            <Row gutter={[24, 0]}>
              {/* Left */}
              <Col xs={24} md={12}>
                <Form.Item label={t('nationality')} name="nationalityId">
                  <Select showSearch optionFilterProp="label" options={natEditOptions} size="large" />
                </Form.Item>
                <Form.Item label={t('job')} name="jobId">
                  <Select showSearch optionFilterProp="label" options={jobEditOptions} size="large" />
                </Form.Item>
                <Form.Item label={t('branch')} name="branchId">
                  <Select
                    showSearch optionFilterProp="label" allowClear size="large"
                    placeholder={t('allBranches')}
                    options={[
                      { value: null as any, label: t('allBranches') },
                      ...(branches || []).map((b) => ({
                        value: b.id,
                        label: isAr ? b.nameAr : b.nameEn,
                      })),
                    ]}
                  />
                </Form.Item>
                <Form.Item label={t('durationLabel')} name="duration">
                  <Select
                    size="large"
                    onChange={setEditPeriodId}
                    options={periodTypes.map((p) => ({ value: p.id, label: p.label[language] }))}
                  />
                </Form.Item>
                <Divider />
                <Form.Item label={t('showForExternalCustomers')} name="showForExternalCustomers" valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item label={t('showForReception')} name="showForReception" valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item label={t('activate')} name="isActive" valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Divider />
                {/* Summary */}
                <div className={styles.priceDisplay}>
                  <h3 style={{ textAlign: 'center', marginBottom: 12 }}>
                    <CalculatorOutlined /> {t('offerSummary')}
                  </h3>
                  <div className={styles.priceBreakdown}>
                    {[
                      [t('cost'), editCost.toFixed(2)],
                      [t('costTax'), editTax.toFixed(2)],
                      [t('insurance'), editInsurance.toFixed(2)],
                      [t('workerSalary'), (editSalary * editMonths).toFixed(2)],
                    ].map(([label, val]) => (
                      <div key={label} className={styles.priceRow}>
                        <span>{label}</span>
                        <strong>{val}</strong>
                      </div>
                    ))}
                    <Divider style={{ margin: '6px 0' }} />
                    <div className={styles.priceRow}>
                      <span style={{ fontWeight: 700 }}>{t('totalCostWithTax')}</span>
                      <strong style={{ fontSize: 20, color: '#00478C' }}>{editTotal.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              </Col>

              {/* Right */}
              <Col xs={24} md={12}>
                <Form.Item label={t('cost')} name="cost">
                  <Input
                    type="number" size="large" min={0}
                    addonAfter={isAr ? 'ريال' : 'SAR'}
                    onChange={(e) => setEditCost(parseFloat(e.target.value) || 0)}
                  />
                </Form.Item>
                <Form.Item label={t('costTax')}>
                  <Input
                    type="number" size="large" readOnly
                    value={editTax.toFixed(2)}
                    addonAfter={isAr ? 'ريال' : 'SAR'}
                    style={{ background: '#f5f5f5' }}
                  />
                </Form.Item>
                <Form.Item label={t('insurance')} name="insurance">
                  <Input
                    type="number" size="large" min={0}
                    addonAfter={isAr ? 'ريال' : 'SAR'}
                    onChange={(e) => setEditInsurance(parseFloat(e.target.value) || 0)}
                  />
                </Form.Item>
                <Form.Item label={t('workerSalary')} name="workerSalary">
                  <Input
                    type="number" size="large" min={0}
                    addonAfter={isAr ? 'ريال' : 'SAR'}
                    onChange={(e) => setEditSalary(parseFloat(e.target.value) || 0)}
                  />
                </Form.Item>
                <Form.Item label={t('totalCostWithTax')}>
                  <Input
                    type="number" size="large" readOnly
                    value={editTotal.toFixed(2)}
                    addonAfter={isAr ? 'ريال' : 'SAR'}
                    style={{ background: '#e0f7fa', fontWeight: 700 }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider />
            <div style={{ textAlign: 'center' }}>
              <Space size="large">
                <Button
                  type="primary" icon={<SaveOutlined />} size="large"
                  loading={isUpdating} style={{ minWidth: 140, background: '#00AA64' }}
                  onClick={handleUpdate}
                >
                  {t('save')}
                </Button>
                <Button size="large" style={{ minWidth: 140 }}
                  onClick={() => { setEditModalOpen(false); setEditingOffer(null); }}>
                  {t('cancel')}
                </Button>
              </Space>
            </div>
          </Form>
        )}
      </Modal>
    </div>
  );
}
