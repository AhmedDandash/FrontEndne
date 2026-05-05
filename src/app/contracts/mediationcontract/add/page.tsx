'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  Steps,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Button,
  Row,
  Col,
  Divider,
  Space,
  Alert,
  Tag,
} from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  DollarOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  SaveOutlined,
  TeamOutlined,
  IdcardOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useMediationContracts } from '@/hooks/api/useMediationContracts';
import { useCustomers } from '@/hooks/api/useCustomers';
import { useWorkers } from '@/hooks/api/useWorkers';
import type { CreateMediationContractDto, MediationContractOffer } from '@/types/api.types';
import {
  MEDIATION_CONTRACT_TYPE,
  VISA_TYPE,
  ARRIVAL_DESTINATIONS,
  toSelectOptions,
} from '@/constants/enums';
import OfferSelector from '@/components/contracts/OfferSelector';
import RequirementCard from '@/components/contracts/RequirementCard';
import styles from './AddMediationContract.module.css';

const { TextArea } = Input;
const { Option } = Select;

export default function AddMediationContractPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledCustomerId = searchParams.get('customerId');

  const language = useAuthStore((state) => state.language);
  const isRtl = language === 'ar';

  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [hasInsurance, setHasInsurance] = useState(false);
  const [isComprehensiveVisa, setIsComprehensiveVisa] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<MediationContractOffer | null>(null);

  const { createContract, isCreating } = useMediationContracts();
  const { customers, isLoading: isLoadingCustomers } = useCustomers();
  const { data: workers, isLoading: isLoadingWorkers } = useWorkers();

  // Handle offer selection → auto-fill fields
  const handleOfferSelect = (offer: MediationContractOffer) => {
    setSelectedOffer(offer);
    const localCost = offer.localCost ?? 0;
    const taxValue = offer.taxLocalCost ?? Math.round(localCost * 0.15 * 100) / 100;
    form.setFieldsValue({
      offerId: offer.id,
      salary: offer.salary ?? 0,
      localCost,
      agentCostSAR: offer.agentCostSAR ?? 0,
      totalTaxValue: taxValue,
    });
    // Recompute total after a tick so the form values propagate
    setTimeout(() => {
      const total = computedTotalCost();
      form.setFieldsValue({ totalCost: total });
    }, 50);
  };

  // Pre-fill customer from URL param
  useEffect(() => {
    if (prefilledCustomerId) {
      form.setFieldsValue({ customerId: prefilledCustomerId });
    }
  }, [prefilledCustomerId, form]);

  const t = {
    pageTitle: isRtl ? 'إضافة عقد وساطة جديد' : 'Add New Mediation Contract',
    pageSubtitle: isRtl
      ? 'أكمل الخطوات أدناه لإنشاء عقد وساطة جديد'
      : 'Complete the steps below to create a new mediation contract',
    back: isRtl ? 'رجوع' : 'Back',
    next: isRtl ? 'التالي' : 'Next',
    save: isRtl ? 'حفظ العقد' : 'Save Contract',
    cancel: isRtl ? 'إلغاء' : 'Cancel',
    required: isRtl ? 'هذا الحقل مطلوب' : 'This field is required',
    // Steps
    step1Title: isRtl ? 'بيانات العميل' : 'Customer Data',
    step2Title: isRtl ? 'بيانات العامل والعرض' : 'Worker & Offer',
    step3Title: isRtl ? 'بيانات التأشيرة' : 'Visa Data',
    step4Title: isRtl ? 'التكاليف' : 'Contract Costs',
    // Customer step
    selectCustomer: isRtl ? 'اختر العميل' : 'Select Customer',
    customer: isRtl ? 'العميل' : 'Customer',
    marketer: isRtl ? 'مصدر التسويق' : 'Marketer Source',
    contractType: isRtl ? 'نوع العقد' : 'Contract Type',
    contractCategory: isRtl ? 'تصنيف العقد' : 'Contract Category',
    status: isRtl ? 'الحالة' : 'Status',
    musanedNumber: isRtl ? 'رقم مساند' : 'Musaned Contract #',
    documentationNumber: isRtl ? 'رقم التوثيق' : 'Documentation #',
    // Worker step
    selectWorker: isRtl ? 'اختر العامل' : 'Select Worker',
    worker: isRtl ? 'العامل' : 'Worker',
    workerPassportNumber: isRtl ? 'رقم الجواز (للتحقق)' : 'Passport Number (Verification)',
    workerPassportNote: isRtl
      ? 'مطلوب للتحقق من هوية العامل عند إنشاء العقد'
      : 'Required to verify worker identity on contract creation',
    workerNomination: isRtl ? 'نوع الترشيح' : 'Worker Nomination',
    offerSelection: isRtl ? 'اختر العرض' : 'Select Offer',
    offer: isRtl ? 'العرض' : 'Offer',
    offerAutoFillNote: isRtl
      ? 'اختر عرض من الجدول لملء الراتب والتكلفة المحلية وتكلفة الوكيل تلقائياً'
      : 'Select an offer from the table to auto-fill salary, local cost, and agent cost',
    // Visa step
    visaType: isRtl ? 'نوع التأشيرة' : 'Visa Type',
    visaNumber: isRtl ? 'رقم التأشيرة' : 'Visa Number',
    visaDate: isRtl ? 'تاريخ التأشيرة' : 'Visa Date',
    visaDateHijri: isRtl ? 'تاريخ التأشيرة (هجري)' : 'Visa Date (Hijri)',
    comprehensiveVisa: isRtl ? 'تأشيرة تأهيل شامل' : 'Comprehensive Qualification Visa',
    arrivalDestination: isRtl ? 'وجهة الوصول' : 'Arrival Destination',
    // Costs step
    localCost: isRtl ? 'التكلفة المحلية' : 'Local Cost (SAR)',
    agentCost: isRtl ? 'تكلفة الوكيل' : 'Agent Cost (SAR)',
    salary: isRtl ? 'الراتب' : 'Salary (SAR)',
    otherCosts: isRtl ? 'تكاليف أخرى' : 'Other Costs (SAR)',
    taxValue: isRtl ? 'قيمة الضريبة' : 'Tax Value (SAR)',
    managerDiscount: isRtl ? 'خصم المدير' : 'Manager Discount (SAR)',
    costDiscount: isRtl ? 'خصم التكلفة' : 'Cost Discount (SAR)',
    totalCost: isRtl ? 'التكلفة الإجمالية' : 'Total Cost (SAR)',
    costDescription: isRtl ? 'وصف التكلفة' : 'Cost Description',
    hasInsurance: isRtl ? 'يوجد تأمين على العقد' : 'Has Contract Insurance',
    insuranceCost: isRtl ? 'تأمين عمالة منزلية (SAR)' : 'Domestic Worker Insurance (SAR)',
  };

  const steps = [
    { title: t.step1Title, icon: <UserOutlined /> },
    { title: t.step2Title, icon: <TeamOutlined /> },
    { title: t.step3Title, icon: <IdcardOutlined /> },
    { title: t.step4Title, icon: <DollarOutlined /> },
  ];

  const computedTotalCost = () => {
    const vals = form.getFieldsValue();
    const local = Number(vals.localCost) || 0;
    const agent = Number(vals.agentCostSAR) || 0;
    const other = Number(vals.otherCosts) || 0;
    const tax = Number(vals.totalTaxValue) || 0;
    const mgrDiscount = Number(vals.managerDiscount) || 0;
    const costDiscount = Number(vals.costDiscount) || 0;
    const insurance = hasInsurance ? Number(vals.domesticWorkerInsurance) || 0 : 0;
    return local + agent + other + tax + insurance - mgrDiscount - costDiscount;
  };

  const handleNext = async () => {
    try {
      const fieldGroups: string[][] = [
        ['customerId', 'contractType', 'musanedContractNumber', 'marketerId', 'contractCategory'],
        ['workerId', 'workerPassportNumber', 'offerId'],
        ['visaType', 'visaNumber', 'visaDateHijri', 'visaDate', 'arrivalDestinationId'],
        [
          'localCost',
          'agentCostSAR',
          'salary',
          'otherCosts',
          'totalTaxValue',
          'managerDiscount',
          'costDiscount',
          'totalCost',
          'costDescription',
          'hasContractInsurance',
          'domesticWorkerInsurance',
        ],
      ];
      await form.validateFields(fieldGroups[currentStep]);
      setCurrentStep((s) => s + 1);
    } catch {
      // validation errors shown inline
    }
  };

  const handlePrev = () => setCurrentStep((s) => s - 1);

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      const vals = form.getFieldsValue(true);
      const payload: CreateMediationContractDto = {
        contractType: vals.contractType ?? null,
        customerId: vals.customerId ? String(vals.customerId) : null,
        workerId: vals.workerId ? String(vals.workerId) : null,
        workerPassportNumber: vals.workerPassportNumber ?? null,
        musanedContractNumber: vals.musanedContractNumber ?? null,
        marketerId: vals.marketerId ? String(vals.marketerId) : null,
        contractCategory: vals.contractCategory ? Number(vals.contractCategory) : null,
        offerId: vals.offerId ? String(vals.offerId) : null,
        visaType: vals.visaType ?? null,
        visaNumber: vals.visaNumber ?? null,
        visaDateHijri: vals.visaDateHijri ?? null,
        visaDate: vals.visaDate ?? null,
        isComprehensiveQualificationVisa: isComprehensiveVisa,
        arrivalDestinationId: vals.arrivalDestinationId ? Number(vals.arrivalDestinationId) : null,
        otherCosts: vals.otherCosts ? Number(vals.otherCosts) : null,
        managerDiscount: vals.managerDiscount ? Number(vals.managerDiscount) : null,
        costDiscount: vals.costDiscount ? Number(vals.costDiscount) : null,
        costDescription: vals.costDescription ?? null,
        hasContractInsurance: hasInsurance,
        domesticWorkerInsurance:
          hasInsurance && vals.domesticWorkerInsurance
            ? Number(vals.domesticWorkerInsurance)
            : null,
      };

      await createContract(payload);
      router.push('/contracts/mediationcontract');
    } catch {
      // validation errors and API errors (e.g. passport mismatch) shown via message.error in mutation onError
    }
  };

  const getSelectedCustomer = () => {
    const customerId = form.getFieldValue('customerId');
    if (!customerId || !customers) return null;
    return customers.find((c) => String(c.id) === String(customerId));
  };

  // ─── Step 1: Customer Data ─────────────────────────────────────────────────
  const renderStep1 = () => (
    <>
      <Row gutter={[24, 0]}>
        <Col xs={24} md={12}>
          <Form.Item
            name="customerId"
            label={t.customer}
            rules={[{ required: true, message: t.required }]}
          >
            <Select
              showSearch
              loading={isLoadingCustomers}
              placeholder={t.selectCustomer}
              filterOption={(input, option) =>
                String(option?.children || '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              size="large"
            >
              {(customers || []).map((c) => (
                <Option key={c.id} value={c.id}>
                  {isRtl ? c.arabicName : c.englishName || c.arabicName}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="contractType"
            label={t.contractType}
            rules={[{ required: true, message: isRtl ? 'يرجى اختيار نوع العقد' : 'Please select contract type' }]}
          >
            <Select
              size="large"
              placeholder={isRtl ? 'اختر نوع العقد' : 'Select contract type'}
            >
              {toSelectOptions(MEDIATION_CONTRACT_TYPE, language).map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="contractCategory" label={t.contractCategory}>
            <InputNumber
              size="large"
              style={{ width: '100%' }}
              placeholder={isRtl ? 'تصنيف العقد' : 'Contract category'}
              min={0}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="musanedContractNumber" label={t.musanedNumber}>
            <Input size="large" placeholder={isRtl ? 'رقم مساند' : 'Musaned contract number'} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="marketerId" label={t.marketer}>
            <InputNumber
              size="large"
              style={{ width: '100%' }}
              placeholder={isRtl ? 'معرف المسوق' : 'Marketer ID'}
              min={0}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* Customer info preview */}
      {getSelectedCustomer() && (
        <Alert
          type="info"
          showIcon
          message={
            <span>
              <strong>{isRtl ? 'العميل: ' : 'Customer: '}</strong>
              {isRtl
                ? getSelectedCustomer()?.arabicName
                : getSelectedCustomer()?.englishName || getSelectedCustomer()?.arabicName}
              {/* {getSelectedCustomer()?.mobile && (
                <span style={{ marginInlineStart: 16 }}>
                  {isRtl ? '| الجوال: ' : '| Mobile: '}
                  {getSelectedCustomer()?.mobile}
                </span>
              )} */}
            </span>
          }
          style={{ marginTop: 8 }}
        />
      )}
    </>
  );

  // ─── Step 2: Worker & Offer ────────────────────────────────────────────────
  const renderStep2 = () => (
    <>
      <Row gutter={[24, 0]}>
        {/* Worker selection — required per PDF spec */}
        <Col xs={24} md={12}>
          <Form.Item
            name="workerId"
            label={t.worker}
            rules={[{ required: true, message: t.required }]}
          >
            <Select
              showSearch
              loading={isLoadingWorkers}
              placeholder={t.selectWorker}
              size="large"
              filterOption={(input, option) =>
                String(option?.children || '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {(workers || []).map((w) => (
                <Option key={w.id} value={w.id}>
                  {isRtl ? w.fullNameAr : w.fullNameEn || w.fullNameAr}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="workerPassportNumber"
            label={t.workerPassportNumber}
            rules={[{ required: true, message: t.required }]}
            extra={t.workerPassportNote}
          >
            <Input size="large" placeholder={isRtl ? 'رقم جواز السفر' : 'Passport number'} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="offerId" label={t.offer} hidden>
            <Input />
          </Form.Item>
        </Col>
      </Row>

      {/* Offer Selector Table */}
      <Alert type="info" showIcon message={t.offerAutoFillNote} style={{ marginBottom: 16 }} />
      <OfferSelector
        language={language}
        selectedOfferId={selectedOffer?.id ?? form.getFieldValue('offerId') ?? null}
        onSelect={handleOfferSelect}
        compact
      />

      {/* Read-only requirement card — auto-fetches when offer has nationality + job */}
      {selectedOffer && (
        <div style={{ marginTop: 16 }}>
          <RequirementCard
            nationalityId={selectedOffer.nationalityId ? String(selectedOffer.nationalityId) : null}
            jobId={selectedOffer.jobId ?? null}
            nationalityName={selectedOffer.nationalityNameAr ?? selectedOffer.nationalityName ?? undefined}
            jobName={selectedOffer.jobName ?? undefined}
          />
        </div>
      )}
    </>
  );

  // ─── Step 3: Visa Data ─────────────────────────────────────────────────────
  const renderStep3 = () => (
    <Row gutter={[24, 0]}>
      <Col xs={24} md={12}>
        <Form.Item name="visaType" label={t.visaType}>
          <Select
            size="large"
            placeholder={isRtl ? 'اختر نوع التأشيرة' : 'Select visa type'}
            allowClear
          >
            {toSelectOptions(VISA_TYPE, language).map((opt) => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="visaNumber" label={t.visaNumber}>
          <Input size="large" placeholder={isRtl ? 'رقم التأشيرة' : 'Visa number'} />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="visaDateHijri" label={t.visaDateHijri}>
          <Input size="large" placeholder={isRtl ? 'مثال: 1446/05/10' : 'e.g. 1446/05/10'} />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="visaDate" label={t.visaDate}>
          <Input size="large" type="date" />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="arrivalDestinationId" label={t.arrivalDestination}>
          <Select
            size="large"
            placeholder={isRtl ? 'اختر وجهة الوصول' : 'Select arrival destination'}
            showSearch
            allowClear
            filterOption={(input, option) =>
              String(option?.children || '')
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          >
            {toSelectOptions(ARRIVAL_DESTINATIONS, language).map((opt) => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item label={t.comprehensiveVisa}>
          <Switch
            checked={isComprehensiveVisa}
            onChange={setIsComprehensiveVisa}
            checkedChildren={isRtl ? 'نعم' : 'Yes'}
            unCheckedChildren={isRtl ? 'لا' : 'No'}
          />
        </Form.Item>
      </Col>
    </Row>
  );

  // ─── Step 4: Contract Costs ────────────────────────────────────────────────
  const renderStep4 = () => (
    <>
      {selectedOffer && (
        <Alert
          type="success"
          showIcon
          message={
            isRtl
              ? `تم ملء الراتب والتكلفة المحلية وتكلفة الوكيل تلقائياً من العرض #${selectedOffer.id}`
              : `Salary, Local Cost, and Agent Cost were auto-filled from Offer #${selectedOffer.id}`
          }
          style={{ marginBottom: 16 }}
        />
      )}
      <Row gutter={[24, 0]}>
        <Col xs={24} md={8}>
          <Form.Item
            name="localCost"
            label={
              <span>
                {t.localCost}
                {selectedOffer && (
                  <Tag color="green" style={{ marginInlineStart: 8, fontSize: 11 }}>
                    {isRtl ? 'من العرض' : 'From Offer'}
                  </Tag>
                )}
              </span>
            }
          >
            <InputNumber
              size="large"
              style={{ width: '100%' }}
              placeholder="0.00"
              min={0}
              precision={2}
              onChange={(val) => {
                const localCost = Number(val) || 0;
                const taxValue = Math.round(localCost * 0.15 * 100) / 100;
                form.setFieldsValue({ totalTaxValue: taxValue });
                const total = computedTotalCost();
                form.setFieldsValue({ totalCost: total });
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            name="agentCostSAR"
            label={
              <span>
                {t.agentCost}
                {selectedOffer && (
                  <Tag color="orange" style={{ marginInlineStart: 8, fontSize: 11 }}>
                    {isRtl ? 'من العرض' : 'From Offer'}
                  </Tag>
                )}
              </span>
            }
          >
            <InputNumber
              size="large"
              style={{ width: '100%' }}
              placeholder="0.00"
              min={0}
              precision={2}
              onChange={() => {
                const total = computedTotalCost();
                form.setFieldsValue({ totalCost: total });
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            name="salary"
            label={
              <span>
                {t.salary}
                {selectedOffer && (
                  <Tag color="blue" style={{ marginInlineStart: 8, fontSize: 11 }}>
                    {isRtl ? 'من العرض' : 'From Offer'}
                  </Tag>
                )}
              </span>
            }
          >
            <InputNumber
              size="large"
              style={{ width: '100%' }}
              placeholder="0.00"
              min={0}
              precision={2}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="otherCosts" label={t.otherCosts}>
            <InputNumber
              size="large"
              style={{ width: '100%' }}
              placeholder="0.00"
              min={0}
              precision={2}
              onChange={() => {
                const total = computedTotalCost();
                form.setFieldsValue({ totalCost: total });
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="totalTaxValue" label={t.taxValue}>
            <InputNumber
              size="large"
              style={{ width: '100%', background: '#f5f5f5' }}
              placeholder="0.00"
              min={0}
              precision={2}
              readOnly
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="managerDiscount" label={t.managerDiscount}>
            <InputNumber
              size="large"
              style={{ width: '100%' }}
              placeholder="0.00"
              min={0}
              precision={2}
              onChange={() => {
                const total = computedTotalCost();
                form.setFieldsValue({ totalCost: total });
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="costDiscount" label={t.costDiscount}>
            <InputNumber
              size="large"
              style={{ width: '100%' }}
              placeholder="0.00"
              min={0}
              precision={2}
              onChange={() => {
                const total = computedTotalCost();
                form.setFieldsValue({ totalCost: total });
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="totalCost" label={t.totalCost}>
            <InputNumber
              size="large"
              style={{ width: '100%', fontWeight: 700, color: '#003366' }}
              placeholder="0.00"
              min={0}
              precision={2}
              readOnly
            />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item name="costDescription" label={t.costDescription}>
            <TextArea rows={3} placeholder={isRtl ? 'وصف التكلفة...' : 'Cost description...'} />
          </Form.Item>
        </Col>
      </Row>

      <Divider>{isRtl ? 'التأمين' : 'Insurance'}</Divider>

      <Row gutter={[24, 0]} align="middle">
        <Col xs={24} md={12}>
          <Form.Item label={t.hasInsurance} style={{ marginBottom: 0 }}>
            <Switch
              checked={hasInsurance}
              onChange={(val) => {
                setHasInsurance(val);
                if (!val) form.setFieldsValue({ domesticWorkerInsurance: undefined });
                setTimeout(() => {
                  const total = computedTotalCost();
                  form.setFieldsValue({ totalCost: total });
                }, 50);
              }}
              checkedChildren={isRtl ? 'نعم' : 'Yes'}
              unCheckedChildren={isRtl ? 'لا' : 'No'}
            />
          </Form.Item>
        </Col>
        {hasInsurance && (
          <Col xs={24} md={12}>
            <Form.Item name="domesticWorkerInsurance" label={t.insuranceCost}>
              <InputNumber
                size="large"
                style={{ width: '100%' }}
                placeholder="0.00"
                min={0}
                precision={2}
                onChange={() => {
                  const total = computedTotalCost();
                  form.setFieldsValue({ totalCost: total });
                }}
              />
            </Form.Item>
          </Col>
        )}
      </Row>
    </>
  );

  const stepContent = [renderStep1, renderStep2, renderStep3, renderStep4];

  return (
    <div className={styles.addPage} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <FileTextOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t.pageTitle}</h1>
              <p className={styles.pageSubtitle}>{t.pageSubtitle}</p>
            </div>
          </div>
          <Button
            size="large"
            icon={isRtl ? <ArrowRightOutlined /> : <ArrowLeftOutlined />}
            onClick={() => router.push('/contracts/mediationcontract')}
            className={styles.backBtn}
          >
            {t.back}
          </Button>
        </div>
      </div>

      {/* Steps Progress */}
      <Card className={styles.stepsCard}>
        <Steps
          current={currentStep}
          direction="horizontal"
          labelPlacement="vertical"
          items={steps.map((s) => ({ title: s.title, icon: s.icon }))}
        />
      </Card>

      {/* Step Form Content */}
      <Card className={styles.formCard}>
        <Form form={form} layout="vertical" requiredMark initialValues={{ totalCost: 0 }}>
          {stepContent[currentStep]?.()}
        </Form>

        <Divider />

        {/* Navigation Buttons */}
        <div className={styles.navButtons}>
          {currentStep === 0 ? (
            <Button size="large" onClick={() => router.push('/contracts/mediationcontract')}>
              {t.cancel}
            </Button>
          ) : (
            <Button
              size="large"
              icon={isRtl ? <ArrowRightOutlined /> : <ArrowLeftOutlined />}
              onClick={handlePrev}
            >
              {t.back}
            </Button>
          )}

          <Space>
            {currentStep < steps.length - 1 ? (
              <Button
                type="primary"
                size="large"
                icon={isRtl ? <ArrowLeftOutlined /> : <ArrowRightOutlined />}
                onClick={handleNext}
              >
                {t.next}
              </Button>
            ) : (
              <Button
                type="primary"
                size="large"
                icon={<SaveOutlined />}
                onClick={handleSubmit}
                loading={isCreating}
              >
                {t.save}
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
}
