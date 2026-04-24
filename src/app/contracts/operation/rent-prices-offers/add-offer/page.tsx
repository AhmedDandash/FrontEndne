'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Input,
  Select,
  Switch,
  Form,
  Divider,
  Space,
  message,
  Spin,
  Empty,
} from 'antd';
import {
  SaveOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  GiftOutlined,
  CalculatorOutlined,
} from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useEmploymentContractOffers } from '@/hooks/api/useEmploymentContractOffers';
import { useBranches } from '@/hooks/api/useBranches';
import { useJobs } from '@/hooks/api/useJobs';
import { useNationalities } from '@/hooks/api/useNationalities';
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

export default function AddSpecialOfferPage() {
  const language = useAuthStore((state) => state.language);
  const router = useRouter();
  const searchParams = useSearchParams();
  const offerType = searchParams.get('type') || '1';
  const [form] = Form.useForm();

  const { createOfferAsync } = useEmploymentContractOffers();
  const { branches } = useBranches();
  const { data: jobsData, isLoading: isLoadingJobs } = useJobs();
  const { data: nationalitiesData = [] } = useNationalities();
  // Build nationality options from API
  const dynamicNationalityOptions = useMemo(() => {
    return nationalitiesData.map((n) => ({
      value: String(n.id),
      label: {
        ar: n.nationalityNameAr || n.nationalityNameEn || String(n.id),
        en: n.nationalityNameEn || n.nationalityNameAr || String(n.id),
      },
    }));
  }, [nationalitiesData]);

  // Safely extract jobs array from API response and filter active jobs only
  const jobs = useMemo(() => {
    if (!jobsData) return [];
    let jobsArray: any[] = [];

    if (Array.isArray(jobsData)) {
      jobsArray = jobsData;
    } else if (
      typeof jobsData === 'object' &&
      'data' in jobsData &&
      Array.isArray((jobsData as any).data)
    ) {
      jobsArray = (jobsData as any).data;
    }

    // Filter to only include active jobs
    return jobsArray.filter((job: any) => job.isActive === true);
  }, [jobsData]);

  // Form state for live calculation
  const [cost, setCost] = useState<number>(0);
  const [insurance, setInsurance] = useState<number>(0);
  const [applicantSalary, setApplicantSalary] = useState<number>(0);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number>(periodTypes[0].id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = (key: string) => {
    const translations: { [key: string]: { ar: string; en: string } } = {
      pageTitle: { ar: 'إضافة عرض خاص', en: 'Add Special Offer' },
      typeDuration: { ar: 'عرض خاص - مدة', en: 'Special Offer - Duration' },
      typeServiceTransfer: {
        ar: 'عرض خاص - نقل خدمات',
        en: 'Special Offer - Service Transfer',
      },
      offerTitle: { ar: 'عنوان العرض', en: 'Offer Title' },
      offerTitleRequired: { ar: 'عنوان العرض مطلوب', en: 'Offer title is required' },
      nationality: { ar: 'الجنسية', en: 'Nationality' },
      nationalityRequired: { ar: 'الجنسية مطلوبة', en: 'Nationality is required' },
      job: { ar: 'الوظيفة', en: 'Job' },
      jobRequired: { ar: 'الوظيفة مطلوبة', en: 'Job is required' },
      branch: { ar: 'الفرع', en: 'Branch' },
      allBranches: { ar: 'جميع الفروع', en: 'All Branches' },
      duration: { ar: 'المدة', en: 'Duration' },
      durationRequired: { ar: 'المدة مطلوبة', en: 'Duration is required' },
      showForExternalCustomers: {
        ar: 'إظهار للعملاء الخارجيين',
        en: 'Show for External Customers',
      },
      showForReception: { ar: 'يظهر للاستقبال', en: 'Show for Reception' },
      activate: { ar: 'تفعيل', en: 'Activate' },
      officeCost: { ar: 'تكلفة المكتب', en: 'Office Cost' },
      costLabel: { ar: 'التكلفة', en: 'Cost' },
      costDescription: {
        ar: 'يقصد بالتكاليف المحلية للتشغيل (تكاليف ادارة المكتب . الارباح)',
        en: 'Local operating costs (office management costs, profits)',
      },
      excludingTaxAndSalary: {
        ar: 'غير شامل راتب العامل و غير شامل الضريبة',
        en: 'Excluding worker salary and tax',
      },
      excludingTax: { ar: 'غير شامل الضريبة', en: 'Excluding tax' },
      costTax: { ar: 'ضريبة التكاليف', en: 'Cost Tax' },
      insuranceLabel: { ar: 'التأمين', en: 'Insurance' },
      previousExperience: { ar: 'سبق له العمل', en: 'Previous Experience' },
      salarySection: { ar: 'الرواتب', en: 'Salaries' },
      workerSalary: { ar: 'راتب العاملة', en: 'Worker Salary' },
      monthlySalary: { ar: 'راتب العاملة الشهري', en: "Worker's monthly salary" },
      totalCostWithTax: { ar: 'اجمالي التكاليف شامل الضريبة', en: 'Total Cost Including Tax' },
      offerSummary: { ar: 'اجمالي العرض', en: 'Offer Summary' },
      officeCostSummary: { ar: 'تكلفة المكتب', en: 'Office Cost' },
      costTaxSummary: { ar: 'ضريبة التكلفة', en: 'Cost Tax' },
      insuranceAmount: { ar: 'مبلغ التأمين', en: 'Insurance Amount' },
      workerSalarySummary: { ar: 'راتب العامل', en: 'Worker Salary' },
      save: { ar: 'حفظ', en: 'Save' },
      back: { ar: 'رجوع', en: 'Back' },
      choose: { ar: 'اختر', en: 'Choose' },
      createSuccess: { ar: 'تم إنشاء العرض الخاص بنجاح', en: 'Special offer created successfully' },
      createError: { ar: 'حدث خطأ أثناء الإنشاء', en: 'Error creating special offer' },
      offersCount: { ar: 'عدد العروض', en: 'Offers Count' },
    };
    return translations[key]?.[language] || key;
  };

  const getOfferTypeLabel = () => {
    if (offerType === '1') return t('typeDuration');
    if (offerType === '3') return t('typeServiceTransfer');
    return t('typeDuration');
  };

  // Calculate price
  const selectedPeriod = periodTypes.find((p) => p.id === selectedPeriodId);
  const monthsCount = offerType === '1' ? selectedPeriod?.monthsCount || 1 : 1;

  const calculation = useMemo(() => {
    const taxAmount = cost * 0.15;
    const totalAmountBeforeSalary = Math.round(cost + taxAmount);
    const adjustedTax = totalAmountBeforeSalary - cost;
    const salaryTotal = applicantSalary * monthsCount;
    const total = totalAmountBeforeSalary + salaryTotal + insurance;
    return {
      cost,
      taxAmount: adjustedTax,
      insurance,
      salaryTotal,
      total,
    };
  }, [cost, insurance, applicantSalary, monthsCount]);

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      // Debug: Log form values
      console.log('Form values:', values);
      console.log('Calculation:', calculation);

      // Validate that nationality is selected
      if (!values.nationalityId) {
        message.error(
          language === 'ar' ? 'يجب اختيار جنسية محددة' : 'Please select a specific nationality'
        );
        setIsSubmitting(false);
        return;
      }

      if (values.jobId === 0) {
        message.error(
          language === 'ar' ? 'يجب اختيار وظيفة محددة' : 'Please select a specific job'
        );
        setIsSubmitting(false);
        return;
      }

      // Prepare payload - convert 0 to null for optional fields
      const payload = {
        offerType: parseInt(offerType),
        offerContractType: 1, // Standard contract
        offerTitle: values.offerTitle || null,
        nationalityId: values.nationalityId || null,
        jobId: values.jobId || null,
        duration: offerType === '1' ? selectedPeriodId : null,
        cost: cost || null,
        costTax: calculation.taxAmount || null,
        insurance: insurance || null,
        workerSalary: applicantSalary || null,
        totalCostWithTax: calculation.total || null,
        showForExternalCustomers: values.showForExternalCustomers || false,
        showForReception: values.showForReception || false,
        isActive: values.isActive || false,
        previousExperience: values.experienceIndicator === 0 ? null : values.experienceIndicator,
        offersCount: values.offersCount || 1,
        isOffer: true, // Special offer flag
        branchId: values.branchId || null,
      };

      console.log('Payload being sent:', JSON.stringify(payload, null, 2));

      await createOfferAsync(payload);
      message.success(t('createSuccess'));
      router.push('/contracts/operation/rent-prices-offers');
    } catch (error: any) {
      console.error('Error creating offer:', error);
      console.error('Error details:', {
        status: error?.response?.status,
        message: error?.response?.data?.message,
        errors: error?.response?.data?.errors,
        data: error?.response?.data,
      });

      const errorMsg = error?.response?.data?.message || error?.message || t('createError');
      message.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDurationType = offerType === '1';

  return (
    <div className={styles.offersPage}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <GiftOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('pageTitle')}</h1>
              <p className={styles.pageSubtitle}>{getOfferTypeLabel()}</p>
            </div>
          </div>
        </div>
      </div>

      <Card className={styles.formSection}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            nationalityId: null,
            jobId: null,
            branchId: null,
            rentPeriodTypeId: periodTypes[0].id,
            experienceIndicator: 0,
            showForExternalCustomers: false,
            showForReception: false,
            isActive: true,
            offersCount: 1,
          }}
        >
          <Row gutter={[32, 16]}>
            {/* Left Column - Selection & Toggles */}
            <Col xs={24} md={12}>
              <Form.Item
                label={t('offerTitle')}
                name="offerTitle"
                rules={[{ required: true, message: t('offerTitleRequired') }]}
              >
                <Input size="large" placeholder={t('offerTitle')} />
              </Form.Item>

              <Form.Item
                label={t('nationality')}
                name="nationalityId"
                rules={[{ required: true, message: t('nationalityRequired') }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder={t('choose')}
                  options={dynamicNationalityOptions.map((n) => ({
                    value: n.value,
                    label: n.label[language],
                  }))}
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label={t('job')}
                name="jobId"
                rules={[{ required: true, message: t('jobRequired') }]}
              >
                <Select
                  showSearch
                  loading={isLoadingJobs}
                  placeholder={t('choose')}
                  optionFilterProp="children"
                  filterOption={(input, option) => {
                    const label = String(option?.label ?? '');
                    return label.toLowerCase().includes(input.toLowerCase());
                  }}
                  options={[
                    { value: 0, label: language === 'ar' ? 'الكل' : 'All' },
                    ...jobs.map((job: any) => ({
                      value: job.id,
                      label:
                        language === 'ar'
                          ? job.jobNameAr || job.jobNameEn || `Job ${job.id}`
                          : job.jobNameEn || job.jobNameAr || `Job ${job.id}`,
                    })),
                  ]}
                  notFoundContent={
                    isLoadingJobs ? (
                      <Spin size="small" />
                    ) : (
                      <Empty
                        description={language === 'ar' ? 'لا توجد مهن' : 'No jobs available'}
                      />
                    )
                  }
                  size="large"
                />
              </Form.Item>

              <Form.Item label={t('branch')} name="branchId">
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder={t('allBranches')}
                  allowClear
                  options={[
                    { value: null, label: t('allBranches') },
                    ...(branches || []).map((b) => ({
                      value: b.id,
                      label: language === 'ar' ? b.nameAr : b.nameEn,
                    })),
                  ]}
                  size="large"
                />
              </Form.Item>

              {isDurationType && (
                <Form.Item
                  label={t('duration')}
                  name="rentPeriodTypeId"
                  rules={[{ required: true, message: t('durationRequired') }]}
                >
                  <Select
                    size="large"
                    onChange={(value) => setSelectedPeriodId(value)}
                    options={periodTypes.map((p) => ({
                      value: p.id,
                      label: p.label[language],
                    }))}
                  />
                </Form.Item>
              )}

              <Form.Item label={t('offersCount')} name="offersCount">
                <Input type="number" size="large" min={1} defaultValue={1} />
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

              {/* Offer Summary */}
              <div className={styles.priceDisplay}>
                <h3 style={{ textAlign: 'center', marginBottom: 16 }}>
                  <CalculatorOutlined /> {t('offerSummary')}
                </h3>
                <div className={styles.priceBreakdown}>
                  <div className={styles.priceRow}>
                    <span>{t('officeCostSummary')}</span>
                    <strong>{calculation.cost.toFixed(2)}</strong>
                  </div>
                  <div className={styles.priceRow}>
                    <span>{t('costTaxSummary')}</span>
                    <strong>{calculation.taxAmount.toFixed(2)}</strong>
                  </div>
                  <div className={styles.priceRow}>
                    <span>{t('insuranceAmount')}</span>
                    <strong>{calculation.insurance.toFixed(2)}</strong>
                  </div>
                  <div className={styles.priceRow}>
                    <span>{t('workerSalarySummary')}</span>
                    <strong>{calculation.salaryTotal.toFixed(2)}</strong>
                  </div>
                  <Divider style={{ margin: '8px 0' }} />
                  <div className={styles.priceRow}>
                    <span style={{ fontSize: 18, fontWeight: 700 }}>{t('totalCostWithTax')}</span>
                    <strong
                      style={{
                        fontSize: 24,
                        color: '#17a2b8',
                      }}
                    >
                      {calculation.total.toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>
            </Col>

            {/* Right Column - Pricing */}
            <Col xs={24} md={12}>
              <Card
                type="inner"
                title={
                  <span>
                    <GiftOutlined /> {t('officeCost')}
                  </span>
                }
                style={{ marginBottom: 16 }}
              >
                <p style={{ marginBottom: 4, fontWeight: 500 }}>
                  <strong>{t('costLabel')}</strong> ({t('costDescription')})
                </p>
                <p style={{ color: '#ef4444', marginBottom: 8, fontSize: 12 }}>
                  {t('excludingTaxAndSalary')}
                </p>
                <Form.Item name="cost" rules={[{ required: true }]}>
                  <Input
                    type="number"
                    size="large"
                    min={0}
                    value={cost}
                    onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                    addonAfter={language === 'ar' ? 'ريال' : 'SAR'}
                  />
                </Form.Item>
                <p style={{ color: '#22c55e', fontSize: 12 }}>{t('excludingTax')}</p>
              </Card>

              <Form.Item label={t('costTax')}>
                <Input
                  type="number"
                  size="large"
                  readOnly
                  value={calculation.taxAmount.toFixed(2)}
                  addonAfter={language === 'ar' ? 'ريال' : 'SAR'}
                  style={{ background: '#f5f5f5' }}
                />
              </Form.Item>

              <Form.Item label={t('insuranceLabel')} name="insurance">
                <Input
                  type="number"
                  size="large"
                  min={0}
                  value={insurance}
                  onChange={(e) => setInsurance(parseFloat(e.target.value) || 0)}
                  addonAfter={language === 'ar' ? 'ريال' : 'SAR'}
                />
              </Form.Item>
              <p style={{ color: '#22c55e', fontSize: 12, marginTop: -16, marginBottom: 16 }}>
                {t('excludingTax')}
              </p>

              <Form.Item label={t('previousExperience')} name="experienceIndicator">
                <Select
                  size="large"
                  options={experienceOptions.map((e) => ({
                    value: e.value,
                    label: e.label[language],
                  }))}
                />
              </Form.Item>

              <Card
                type="inner"
                title={
                  <span>
                    <GiftOutlined /> {t('salarySection')}
                  </span>
                }
                style={{ marginBottom: 16 }}
              >
                <p style={{ marginBottom: 8 }}>
                  <strong>{t('workerSalary')}</strong> ({t('monthlySalary')})
                </p>
                <Form.Item name="applicantSalary" rules={[{ required: true }]}>
                  <Input
                    type="number"
                    size="large"
                    min={0}
                    value={applicantSalary}
                    onChange={(e) => setApplicantSalary(parseFloat(e.target.value) || 0)}
                    addonAfter={language === 'ar' ? 'ريال' : 'SAR'}
                  />
                </Form.Item>
                <p style={{ color: '#22c55e', fontSize: 12 }}>{t('excludingTax')}</p>
              </Card>

              <Form.Item label={t('totalCostWithTax')}>
                <Input
                  type="number"
                  size="large"
                  readOnly
                  value={calculation.total.toFixed(2)}
                  addonAfter={language === 'ar' ? 'ريال' : 'SAR'}
                  style={{
                    background: '#e0f7fa',
                    fontWeight: 700,
                    fontSize: 18,
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Action Buttons */}
          <Divider />
          <div style={{ textAlign: 'center' }}>
            <Space size="large">
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                icon={<SaveOutlined />}
                loading={isSubmitting}
                style={{ minWidth: 150, background: '#17a2b8' }}
              >
                {t('save')}
              </Button>
              <Button
                size="large"
                icon={language === 'ar' ? <ArrowRightOutlined /> : <ArrowLeftOutlined />}
                onClick={() => router.push('/contracts/operation/rent-prices-offers')}
                style={{ minWidth: 150 }}
              >
                {t('back')}
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
}
