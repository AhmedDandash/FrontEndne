'use client';

import React, { useState, useMemo, Suspense } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Divider,
  Row,
  Col,
  Spin,
  Empty,
  Popconfirm,
  message,
  Breadcrumb,
} from 'antd';
import type { TableColumnsType } from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  DollarOutlined,
  CalculatorOutlined,
} from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useEmploymentContractOffers } from '@/hooks/api/useEmploymentContractOffers';
import { useBranches } from '@/hooks/api/useBranches';
import { useJobs } from '@/hooks/api/useJobs';
import { useNationalities } from '@/hooks/api/useNationalities';
import type { EmploymentContractOffer, UpdateEmploymentContractOfferDto } from '@/types/api.types';
import styles from '../RentPricesOffers.module.css';

// Period types with months count
const periodTypes = [
  { id: 46, monthsCount: 1, label: { ar: 'شهري', en: 'Monthly' } },
  { id: 52, monthsCount: 3, label: { ar: 'ربع سنوي', en: 'Quarterly' } },
  { id: 53, monthsCount: 6, label: { ar: 'نصف سنوي', en: 'Semi-Annual' } },
  { id: 189, monthsCount: 12, label: { ar: 'سنوي', en: 'Annual' } },
  { id: 190, monthsCount: 1, label: { ar: 'اثيوبيا', en: 'Ethiopia' } },
];

const experienceOptions = [
  { value: 0, label: { ar: 'الكل', en: 'All' } },
  { value: 1, label: { ar: 'سبق له العمل', en: 'Has Experience' } },
  { value: 2, label: { ar: 'لم يسبق له العمل', en: 'No Experience' } },
];

const offerTypeLabels: Record<number, { ar: string; en: string }> = {
  1: { ar: 'مدة', en: 'Duration' },
  3: { ar: 'نقل خدمات', en: 'Service Transfer' },
  5: { ar: 'مدة يومي', en: 'Daily Duration' },
};

const contractTypeLabels: Record<number, { ar: string; en: string }> = {
  1: { ar: 'عادي', en: 'Standard' },
  2: { ar: 'يومي', en: 'Daily' },
};

function DetailsContent() {
  const language = useAuthStore((state) => state.language);
  const isArabic = language === 'ar';
  const router = useRouter();
  const searchParams = useSearchParams();

  const nationalityId = searchParams.get('nationalityId') || '';
  const jobId = searchParams.get('jobId') || '';
  const branchId = searchParams.get('branchId') || '';

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<EmploymentContractOffer | null>(null);
  const [form] = Form.useForm();

  // Live calculation state
  const [editCost, setEditCost] = useState(0);
  const [editInsurance, setEditInsurance] = useState(0);
  const [editSalary, setEditSalary] = useState(0);
  const [editPeriodId, setEditPeriodId] = useState<number>(periodTypes[0].id);

  const {
    offers: offersRaw,
    isLoading,
    updateOfferAsync,
    deleteOffer,
    isUpdating,
    isDeleting,
  } = useEmploymentContractOffers();

  const { branches } = useBranches();
  const { data: jobsData } = useJobs();
  const { data: nationalitiesData = [] } = useNationalities();

  const t = (key: string) => {
    const translations: Record<string, { ar: string; en: string }> = {
      title: { ar: 'تفاصيل العروض', en: 'Offer Details' },
      back: { ar: 'رجوع', en: 'Back' },
      edit: { ar: 'تعديل', en: 'Edit' },
      delete: { ar: 'حذف', en: 'Delete' },
      deleteConfirm: {
        ar: 'هل أنت متأكد من حذف هذا العرض؟',
        en: 'Are you sure you want to delete this offer?',
      },
      deleteOk: { ar: 'حذف', en: 'Delete' },
      deleteCancel: { ar: 'إلغاء', en: 'Cancel' },
      editOffer: { ar: 'تعديل العرض', en: 'Edit Offer' },
      save: { ar: 'حفظ', en: 'Save' },
      cancel: { ar: 'إلغاء', en: 'Cancel' },
      id: { ar: '#', en: '#' },
      offerType: { ar: 'نوع العرض', en: 'Offer Type' },
      contractType: { ar: 'نوع العقد', en: 'Contract Type' },
      nationality: { ar: 'الجنسية', en: 'Nationality' },
      job: { ar: 'الوظيفة', en: 'Job' },
      branch: { ar: 'الفرع', en: 'Branch' },
      allBranches: { ar: 'كل الفروع', en: 'All Branches' },
      duration: { ar: 'المدة', en: 'Duration' },
      cost: { ar: 'التكلفة', en: 'Cost' },
      costTax: { ar: 'ضريبة التكلفة', en: 'Cost Tax' },
      insurance: { ar: 'التأمين', en: 'Insurance' },
      workerSalary: { ar: 'راتب العامل', en: 'Worker Salary' },
      totalCostWithTax: { ar: 'الإجمالي مع الضريبة', en: 'Total with Tax' },
      isActive: { ar: 'نشط', en: 'Active' },
      inactive: { ar: 'غير نشط', en: 'Inactive' },
      actions: { ar: 'إجراءات', en: 'Actions' },
      showForExternalCustomers: { ar: 'للعملاء الخارجيين', en: 'External Customers' },
      showForReception: { ar: 'للاستقبال', en: 'Reception' },
      previousExperience: { ar: 'الخبرة السابقة', en: 'Previous Experience' },
      numberOfDays: { ar: 'عدد الأيام', en: 'Days' },
      dailyPrice: { ar: 'السعر اليومي', en: 'Daily Price' },
      promissoryNote: { ar: 'مبلغ السند لأمر', en: 'Promissory Note' },
      offerSummary: { ar: 'ملخص العرض', en: 'Offer Summary' },
      updateSuccess: { ar: 'تم تحديث العرض بنجاح', en: 'Offer updated successfully' },
      updateError: { ar: 'حدث خطأ أثناء التحديث', en: 'Error updating offer' },
      deleteSuccess: { ar: 'تم حذف العرض بنجاح', en: 'Offer deleted successfully' },
      noOffers: { ar: 'لا توجد عروض', en: 'No Offers Found' },
      allOffers: { ar: 'جميع العروض', en: 'All Offers' },
      rentPricesOffers: { ar: 'عروض وأسعار التشغيل', en: 'Operating Prices & Offers' },
      choose: { ar: 'اختر', en: 'Choose' },
      activate: { ar: 'تفعيل', en: 'Activate' },
      excludingTaxAndSalary: { ar: 'غير شامل الراتب والضريبة', en: 'Excl. salary & tax' },
    };
    return translations[key]?.[language] ?? key;
  };

  // Normalize raw offers
  const allOffers = useMemo((): EmploymentContractOffer[] => {
    if (!offersRaw) return [];
    if (Array.isArray(offersRaw)) return offersRaw;
    if (
      typeof offersRaw === 'object' &&
      'data' in offersRaw &&
      Array.isArray((offersRaw as any).data)
    )
      return (offersRaw as any).data;
    return [];
  }, [offersRaw]);

  // Filter to offers matching the summary row that was clicked
  const offers = useMemo(() => {
    return allOffers.filter((o) => {
      const natMatch = !nationalityId || String(o.nationalityId) === nationalityId;
      const jobMatch = !jobId || String(o.jobId) === jobId;
      const branchMatch = !branchId || String(o.branchId) === branchId;
      return natMatch && jobMatch && branchMatch;
    });
  }, [allOffers, nationalityId, jobId, branchId]);

  // Lookup maps
  const nationalityMap = useMemo(() => {
    const m = new Map<string, string>();
    nationalitiesData.forEach((n) =>
      m.set(
        String(n.id),
        isArabic
          ? n.nationalityNameAr || n.nationalityNameEn || String(n.id)
          : n.nationalityNameEn || n.nationalityNameAr || String(n.id)
      )
    );
    return m;
  }, [nationalitiesData, isArabic]);

  const jobMap = useMemo(() => {
    const m = new Map<number, string>();
    const arr = Array.isArray(jobsData) ? jobsData : ((jobsData as any)?.data ?? []);
    (arr as any[]).forEach((j: any) =>
      m.set(j.id, isArabic ? j.jobNameAr || j.name : j.jobNameEn || j.jobNameAr || j.name)
    );
    return m;
  }, [jobsData, isArabic]);

  const branchMap = useMemo(() => {
    const m = new Map<number, string>();
    (branches || []).forEach((b: any) => m.set(b.id, isArabic ? b.nameAr : b.nameEn));
    return m;
  }, [branches, isArabic]);

  const getNat = (id?: string | null) => (id ? nationalityMap.get(String(id)) || String(id) : '—');
  const getJob = (id?: string | number | null) =>
    id ? jobMap.get(Number(id)) || jobMap.get(id as number) || String(id) : '—';
  const getBranch = (id?: string | number | null) =>
    id ? branchMap.get(Number(id)) || String(id) : t('allBranches');
  const getDuration = (id?: number | null) => {
    if (!id) return '—';
    const p = periodTypes.find((x) => x.id === id);
    return p ? p.label[language] : String(id);
  };
  const formatSAR = (v?: number | null) =>
    v != null
      ? `${v.toLocaleString(isArabic ? 'ar-SA' : 'en-US')} ${isArabic ? 'ريال' : 'SAR'}`
      : '—';

  // Live calculation while editing
  const editedPeriod = periodTypes.find((p) => p.id === editPeriodId);
  const editMonths = editedPeriod?.monthsCount ?? 1;
  const editTax = Math.round(editCost * 0.15);
  const editTotal = Math.round(editCost + editTax + editSalary * editMonths + editInsurance);

  // Open edit modal
  const openEdit = (offer: EmploymentContractOffer) => {
    setEditingOffer(offer);
    const costVal = offer.cost ?? 0;
    const insVal = offer.insurance ?? 0;
    const salVal = offer.workerSalary ?? 0;
    const perVal = offer.duration ?? periodTypes[0].id;
    setEditCost(costVal);
    setEditInsurance(insVal);
    setEditSalary(salVal);
    setEditPeriodId(perVal);
    form.setFieldsValue({
      nationalityId: offer.nationalityId ?? null,
      jobId: offer.jobId ?? null,
      branchId: offer.branchId ?? null,
      duration: offer.duration ?? periodTypes[0].id,
      cost: costVal,
      insurance: insVal,
      applicantSalary: salVal,
      experienceIndicator: offer.previousExperience ?? 0,
      showForExternalCustomers: offer.showForExternalCustomers ?? false,
      showForReception: offer.showForReception ?? false,
      isActive: offer.isActive ?? true,
      numberOfDays: offer.numberOfDays ?? 0,
      dailyPrice: offer.dailyPriceWithoutTax ?? 0,
      promissoryNoteAmount: offer.promissoryNoteAmount ?? 0,
    });
    setEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingOffer) return;
    try {
      const values = form.getFieldsValue();
      const payload: UpdateEmploymentContractOfferDto = {
        offerType: editingOffer.offerType,
        offerContractType: editingOffer.offerContractType,
        nationalityId: values.nationalityId,
        jobId: values.jobId,
        branchId: values.branchId || null,
        duration: editPeriodId,
        cost: editCost,
        costTax: editTax,
        insurance: editInsurance,
        workerSalary: editSalary,
        totalCostWithTax: editTotal,
        showForExternalCustomers: values.showForExternalCustomers,
        showForReception: values.showForReception,
        isActive: values.isActive,
        previousExperience: values.experienceIndicator,
        numberOfDays: values.numberOfDays || 0,
        dailyPriceWithoutTax: values.dailyPrice || 0,
        promissoryNoteAmount: values.promissoryNoteAmount || 0,
      };
      await updateOfferAsync({ id: editingOffer.id, data: payload });
      message.success(t('updateSuccess'));
      setEditModalOpen(false);
      setEditingOffer(null);
    } catch {
      message.error(t('updateError'));
    }
  };

  const handleDelete = (id: number) => {
    deleteOffer(id, {
      onSuccess: () => message.success(t('deleteSuccess')),
    });
  };

  const isDailyOffer = (offer: EmploymentContractOffer) =>
    offer.offerContractType === 2 || offer.offerType === 5;

  // Table columns
  const columns: TableColumnsType<EmploymentContractOffer> = [
    {
      title: t('id'),
      dataIndex: 'id',
      key: 'id',
      width: 60,
      align: 'center',
    },
    {
      title: t('offerType'),
      key: 'offerType',
      width: 130,
      render: (_: any, record) => {
        const typeLabel =
          offerTypeLabels[record.offerType ?? 1]?.[language] ?? String(record.offerType);
        const ctLabel = contractTypeLabels[record.offerContractType ?? 1]?.[language] ?? '';
        const isDaily = isDailyOffer(record);
        return (
          <Space direction="vertical" size={2}>
            <Tag color="blue">{typeLabel}</Tag>
            {isDaily && <Tag color="orange">{ctLabel}</Tag>}
          </Space>
        );
      },
    },
    {
      title: t('duration'),
      key: 'duration',
      width: 110,
      render: (_: any, record) =>
        isDailyOffer(record)
          ? `${record.numberOfDays ?? '—'} ${isArabic ? 'يوم' : 'days'}`
          : getDuration(record.duration),
    },
    {
      title: t('cost'),
      dataIndex: 'cost',
      key: 'cost',
      align: 'end',
      render: (v: number) => formatSAR(v),
    },
    {
      title: t('costTax'),
      key: 'costTax',
      align: 'end',
      render: (_: any, record) => formatSAR(Math.round((record.cost ?? 0) * 0.15)),
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
      width: 120,
      fixed: 'right',
      render: (_: any, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => openEdit(record)}
            ghost
          />
          <Popconfirm
            title={t('deleteConfirm')}
            okText={t('deleteOk')}
            cancelText={t('deleteCancel')}
            okButtonProps={{ danger: true, loading: isDeleting }}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const nationalityLabel = nationalityId ? getNat(nationalityId) : t('allOffers');
  const jobLabel = jobId ? getJob(jobId) : '';
  const branchLabel = branchId ? getBranch(branchId) : '';

  // Nationality options for edit modal Select — built from API (UUID string values)
  const natOptions = useMemo(() => {
    return nationalitiesData.map((n) => ({
      value: String(n.id),
      label: isArabic
        ? n.nationalityNameAr || n.nationalityNameEn || String(n.id)
        : n.nationalityNameEn || n.nationalityNameAr || String(n.id),
    }));
  }, [nationalitiesData, isArabic]);

  const jobOptions = useMemo(() => {
    const arr = Array.isArray(jobsData) ? jobsData : ((jobsData as any)?.data ?? []);
    return (arr as any[]).map((j: any) => ({
      value: j.id,
      label: isArabic ? j.jobNameAr || j.name : j.jobNameEn || j.jobNameAr || j.name,
    }));
  }, [jobsData, isArabic]);

  return (
    <div className={styles.offersPage}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <DollarOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('title')}</h1>
              <Breadcrumb
                items={[
                  {
                    title: (
                      <Link href="/contracts/operation/rent-prices-offers">
                        {t('rentPricesOffers')}
                      </Link>
                    ),
                  },
                  { title: [nationalityLabel, jobLabel, branchLabel].filter(Boolean).join(' — ') },
                ]}
              />
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button
              icon={isArabic ? <ArrowRightOutlined /> : <ArrowLeftOutlined />}
              onClick={() => router.push('/contracts/operation/rent-prices-offers')}
            >
              {t('back')}
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <Card className={styles.tableCard}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large" />
          </div>
        ) : offers.length === 0 ? (
          <Empty description={t('noOffers')} />
        ) : (
          <Table<EmploymentContractOffer>
            dataSource={offers}
            columns={columns}
            rowKey="id"
            bordered
            size="middle"
            scroll={{ x: 1200 }}
            pagination={{ pageSize: 10, showSizeChanger: true }}
          />
        )}
      </Card>

      {/* Edit Modal */}
      <Modal
        open={editModalOpen}
        title={
          <Space>
            <EditOutlined />
            {t('editOffer')} #{editingOffer?.id}
          </Space>
        }
        onCancel={() => {
          setEditModalOpen(false);
          setEditingOffer(null);
        }}
        footer={null}
        width={900}
        destroyOnClose
      >
        {editingOffer && (
          <Form form={form} layout="vertical">
            <Row gutter={[24, 0]}>
              {/* Left column */}
              <Col xs={24} md={12}>
                <Form.Item label={t('nationality')} name="nationalityId">
                  <Select showSearch optionFilterProp="label" options={natOptions} size="large" />
                </Form.Item>

                <Form.Item label={t('job')} name="jobId">
                  <Select showSearch optionFilterProp="label" options={jobOptions} size="large" />
                </Form.Item>

                <Form.Item label={t('branch')} name="branchId">
                  <Select
                    showSearch
                    optionFilterProp="label"
                    placeholder={t('allBranches')}
                    allowClear
                    size="large"
                    options={[
                      { value: null, label: t('allBranches') },
                      ...(branches || []).map((b) => ({
                        value: b.id,
                        label: isArabic ? b.nameAr : b.nameEn,
                      })),
                    ]}
                  />
                </Form.Item>

                {!isDailyOffer(editingOffer) ? (
                  <Form.Item label={t('duration')} name="duration">
                    <Select
                      size="large"
                      onChange={(v) => setEditPeriodId(v)}
                      options={periodTypes.map((p) => ({ value: p.id, label: p.label[language] }))}
                    />
                  </Form.Item>
                ) : (
                  <Form.Item label={t('numberOfDays')} name="numberOfDays">
                    <Input type="number" size="large" min={1} />
                  </Form.Item>
                )}

                <Form.Item label={t('previousExperience')} name="experienceIndicator">
                  <Select
                    size="large"
                    options={experienceOptions.map((e) => ({
                      value: e.value,
                      label: e.label[language],
                    }))}
                  />
                </Form.Item>

                <Divider />

                <Form.Item
                  label={t('showForExternalCustomers')}
                  name="showForExternalCustomers"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                <Form.Item
                  label={t('showForReception')}
                  name="showForReception"
                  valuePropName="checked"
                >
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
                    <div className={styles.priceRow}>
                      <span>{t('cost')}</span>
                      <strong>{editCost.toFixed(2)}</strong>
                    </div>
                    <div className={styles.priceRow}>
                      <span>{t('costTax')}</span>
                      <strong>{editTax.toFixed(2)}</strong>
                    </div>
                    <div className={styles.priceRow}>
                      <span>{t('insurance')}</span>
                      <strong>{editInsurance.toFixed(2)}</strong>
                    </div>
                    <div className={styles.priceRow}>
                      <span>{t('workerSalary')}</span>
                      <strong>{(editSalary * editMonths).toFixed(2)}</strong>
                    </div>
                    <Divider style={{ margin: '6px 0' }} />
                    <div className={styles.priceRow}>
                      <span style={{ fontWeight: 700 }}>{t('totalCostWithTax')}</span>
                      <strong style={{ fontSize: 20, color: '#00478C' }}>
                        {editTotal.toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>
              </Col>

              {/* Right column */}
              <Col xs={24} md={12}>
                <Form.Item label={t('cost')} name="cost">
                  <Input
                    type="number"
                    size="large"
                    min={0}
                    addonAfter={isArabic ? 'ريال' : 'SAR'}
                    onChange={(e) => setEditCost(parseFloat(e.target.value) || 0)}
                  />
                </Form.Item>

                <Form.Item label={t('costTax')}>
                  <Input
                    type="number"
                    size="large"
                    readOnly
                    value={editTax.toFixed(2)}
                    addonAfter={isArabic ? 'ريال' : 'SAR'}
                    style={{ background: '#f5f5f5' }}
                  />
                </Form.Item>

                <Form.Item label={t('insurance')} name="insurance">
                  <Input
                    type="number"
                    size="large"
                    min={0}
                    addonAfter={isArabic ? 'ريال' : 'SAR'}
                    onChange={(e) => setEditInsurance(parseFloat(e.target.value) || 0)}
                  />
                </Form.Item>

                <Form.Item label={t('workerSalary')} name="applicantSalary">
                  <Input
                    type="number"
                    size="large"
                    min={0}
                    addonAfter={isArabic ? 'ريال' : 'SAR'}
                    onChange={(e) => setEditSalary(parseFloat(e.target.value) || 0)}
                  />
                </Form.Item>

                <Form.Item label={t('totalCostWithTax')}>
                  <Input
                    type="number"
                    size="large"
                    readOnly
                    value={editTotal.toFixed(2)}
                    addonAfter={isArabic ? 'ريال' : 'SAR'}
                    style={{ background: '#f0f9ff', fontWeight: 700 }}
                  />
                </Form.Item>

                {isDailyOffer(editingOffer) && (
                  <>
                    <Form.Item label={t('dailyPrice')} name="dailyPrice">
                      <Input
                        type="number"
                        size="large"
                        min={0}
                        addonAfter={isArabic ? 'ريال' : 'SAR'}
                      />
                    </Form.Item>
                    <Form.Item label={t('promissoryNote')} name="promissoryNoteAmount">
                      <Input
                        type="number"
                        size="large"
                        min={0}
                        addonAfter={isArabic ? 'ريال' : 'SAR'}
                      />
                    </Form.Item>
                  </>
                )}
              </Col>
            </Row>

            <Divider />
            <div style={{ textAlign: 'center' }}>
              <Space size="large">
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  size="large"
                  loading={isUpdating}
                  style={{ minWidth: 140, background: '#00AA64' }}
                  onClick={handleUpdate}
                >
                  {t('save')}
                </Button>
                <Button
                  size="large"
                  style={{ minWidth: 140 }}
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditingOffer(null);
                  }}
                >
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

export default function DetailsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      }
    >
      <DetailsContent />
    </Suspense>
  );
}
