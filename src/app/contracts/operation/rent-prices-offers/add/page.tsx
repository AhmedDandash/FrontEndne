'use client';

import { useState, useMemo } from 'react';
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
  DollarOutlined,
  CalculatorOutlined,
} from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useEmploymentContractOffers } from '@/hooks/api/useEmploymentContractOffers';
import { useBranches } from '@/hooks/api/useBranches';
import { useJobs } from '@/hooks/api/useJobs';
import NationalitySelect from '@/components/common/NationalitySelect';
import AccessDenied from '@/components/common/AccessDenied';
import { useContractActionGates } from '@/hooks/useActionPermissionGates';
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

export default function AddOfferPage() {
  const language = useAuthStore((state) => state.language);
  const router = useRouter();
  const searchParams = useSearchParams();
  const offerType = searchParams.get('type') || '1';
  const isDaily = searchParams.get('daily') === 'true';
  const [form] = Form.useForm();
  const contractGates = useContractActionGates();

  const { createOfferAsync } = useEmploymentContractOffers();
  const { branches } = useBranches();
  const { data: jobsData, isLoading: isLoadingJobs } = useJobs();

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
      pageTitle: { ar: 'إضافة عرض جديد', en: 'Add New Offer' },
      typeDuration: { ar: 'عرض مدة', en: 'Duration Offer' },
      typeServiceTransfer: { ar: 'عرض نقل خدمات', en: 'Service Transfer Offer' },
      typeDailyDuration: { ar: 'عرض مدة (عقود يومية)', en: 'Duration Offer (Daily)' },
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
      createSuccess: { ar: 'تم إنشاء العرض بنجاح', en: 'Offer created successfully' },
      createError: { ar: 'حدث خطأ أثناء الإنشاء', en: 'Error creating offer' },
      numberOfDays: { ar: 'عدد الأيام', en: 'Number of Days' },
      dailyPrice: { ar: 'السعر اليومي', en: 'Daily Price' },
      promissoryNote: { ar: 'مبلغ السند لأمر', en: 'Promissory Note Amount' },
    };
    return translations[key]?.[language] || key;
  };

  const getOfferTypeLabel = () => {
    if (offerType === '1' && !isDaily) return t('typeDuration');
    if (offerType === '3' && !isDaily) return t('typeServiceTransfer');
    if (offerType === '5' || isDaily) return t('typeDailyDuration');
    return t('typeDuration');
  };

  // Calculate price
  const selectedPeriod = periodTypes.find((p) => p.id === selectedPeriodId);
  const monthsCount = selectedPeriod?.monthsCount || 1;

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
    if (!contractGates.canCreate) return;
    setIsSubmitting(true);
    try {
      await createOfferAsync({
        offerType: parseInt(offerType),
        offerContractType: isDaily ? 2 : 1,
        nationalityId: values.nationalityId,
        jobId: values.jobId,
        branchId: values.branchId || null,
        duration: selectedPeriodId,
        cost: cost,
        costTax: calculation.taxAmount,
        insurance: insurance,
        workerSalary: applicantSalary,
        totalCostWithTax: calculation.total,
        showForExternalCustomers: values.showForExternalCustomers || false,
        showForReception: values.showForReception || false,
        isActive: values.isActive || false,
        previousExperience: values.experienceIndicator || 0,
        numberOfDays: values.numberOfDays || 0,
        dailyPriceWithoutTax: values.dailyPrice || 0,
        promissoryNoteAmount: values.promissoryNoteAmount || 0,
      });
      message.success(t('createSuccess'));
      router.push('/contracts/operation/rent-prices-offers');
    } catch {
      message.error(t('createError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDailyType = offerType === '5' || isDaily;

  if (contractGates.isReady && !contractGates.canCreate) {
    return <AccessDenied />;
  }

  return (
    <div className={styles.offersPage}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <DollarOutlined className={styles.headerIcon} />
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
            jobId: 0,
            branchId: null,
            rentPeriodTypeId: periodTypes[0].id,
            experienceIndicator: 0,
            showForExternalCustomers: false,
            showForReception: false,
            isActive: true,
          }}
        >
          <Row gutter={[32, 16]}>
            {/* Left Column - Selection & Toggles */}
            <Col xs={24} md={12}>
              <Form.Item
                label={t('nationality')}
                name="nationalityId"
                rules={[{ required: true, message: t('nationalityRequired') }]}
              >
                <NationalitySelect placeholder={t('choose')} size="large" />
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

              {!isDailyType && (
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

              {isDailyType && (
                <Form.Item label={t('numberOfDays')} name="numberOfDays">
                  <Input type="number" size="large" min={1} />
                </Form.Item>
              )}

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
                        color: '#00478C',
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
                    <DollarOutlined /> {t('officeCost')}
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
                    <DollarOutlined /> {t('salarySection')}
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
                    background: '#f0f9ff',
                    fontWeight: 700,
                    fontSize: 18,
                  }}
                />
              </Form.Item>

              {isDailyType && (
                <>
                  <Form.Item label={t('dailyPrice')} name="dailyPrice">
                    <Input
                      type="number"
                      size="large"
                      min={0}
                      addonAfter={language === 'ar' ? 'ريال' : 'SAR'}
                    />
                  </Form.Item>
                  <Form.Item label={t('promissoryNote')} name="promissoryNoteAmount">
                    <Input
                      type="number"
                      size="large"
                      min={0}
                      addonAfter={language === 'ar' ? 'ريال' : 'SAR'}
                    />
                  </Form.Item>
                </>
              )}
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
                disabled={!contractGates.canCreate}
                style={{ minWidth: 150, background: '#00AA64' }}
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
