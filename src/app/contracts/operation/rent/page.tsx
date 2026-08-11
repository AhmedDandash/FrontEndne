'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Row, Col, Button, Input, Select, Statistic, Empty, Spin, Form, InputNumber } from 'antd';
import {
  FileTextOutlined,
  SearchOutlined,
  PlusOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import { useAuthStore } from '@/store/authStore';
import { AdvancedFilterPanel, DateRangeFilter } from '@/components/filters';
import { useEmploymentOperatingContracts } from '@/hooks/api/useEmploymentOperatingContracts';
import { useNationalities } from '@/hooks/api/useNationalities';
import { useJobs } from '@/hooks/api/useJobs';
import { useCustomers } from '@/hooks/api/useCustomers';
import { useMarketers } from '@/hooks/api/useMarketers';
import { useUsers } from '@/hooks/api/useUsers';
import { LABOR_MANAGEMENT, OPERATING_CONTRACT_STATUS, OPERATION_TYPE, toSelectOptions } from '@/constants/enums';
import type {
  EmploymentOperatingContract,
  EmploymentContractOffer,
  TerminateContractDto,
  CustomerRefundDto,
  ContractPrintReceiptData,
  OperatingContractDeliveryFormDto,
  SaveDeliveryFormDto,
} from '@/types/api.types';

import type { RentContract } from './_components/types';
import {
  buildNationalityResolver,
  buildJobResolver,
  buildCustomerResolver,
  mapContract,
} from './_components/mapping';
import { formatCurrency } from './_components/format';
import ContractCard from './_components/ContractCard';
import ContractFormModal from './_components/ContractFormModal';
import RenewModal from './_components/RenewModal';
import TerminateModal from './_components/TerminateModal';
import CustomerRefundModal from './_components/CustomerRefundModal';
import ContractReceiptsModal from './_components/ContractReceiptsModal';
import PrintReceiptModal from './_components/PrintReceiptModal';
import DeliveryFormModal from './_components/DeliveryFormModal';
import WorkerDeliveryRecordModal from './_components/WorkerDeliveryRecordModal';
import styles from './RentContracts.module.css';

export default function RentContractsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customerId');

  const language = useAuthStore((state) => state.language);
  const isRtl = language === 'ar';
  const [mounted, setMounted] = useState(false);

  // Filters
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [nationalityFilter, setNationalityFilter] = useState<string | 'all'>('all');
  const [jobFilter, setJobFilter] = useState<string | 'all'>('all');
  const [identityNumberFilter, setIdentityNumberFilter] = useState('');
  const [customerArabicNameFilter, setCustomerArabicNameFilter] = useState('');
  const [customerPhoneFilter, setCustomerPhoneFilter] = useState('');
  const [customerEmailFilter, setCustomerEmailFilter] = useState('');
  const [workerPassportFilter, setWorkerPassportFilter] = useState('');
  const [createdByFilter, setCreatedByFilter] = useState<string | 'all'>('all');
  const [expiresAfterDaysFilter, setExpiresAfterDaysFilter] = useState<number | null>(null);
  const [expirationConditionFilter, setExpirationConditionFilter] = useState<string | 'all'>('all');
  const [laborSelectionStatusFilter, setLaborSelectionStatusFilter] = useState<string | 'all'>('all');
  const [operationTypeFilter, setOperationTypeFilter] = useState<string | 'all'>('all');
  const [dateRange, setDateRange] = useState<[string | undefined, string | undefined]>([
    undefined,
    undefined,
  ]);
  const [createdDateRange, setCreatedDateRange] = useState<[string | undefined, string | undefined]>([
    undefined,
    undefined,
  ]);
  const [contractEndDateRange, setContractEndDateRange] = useState<[string | undefined, string | undefined]>([
    undefined,
    undefined,
  ]);
  const [contractNumberFilter, setContractNumberFilter] = useState('');
  const [debouncedContractNumber, setDebouncedContractNumber] = useState('');
  const [marketerFilter, setMarketerFilter] = useState<string | 'all'>('all');

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearchText(searchText.trim()), 400);
    return () => clearTimeout(id);
  }, [searchText]);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedContractNumber(contractNumberFilter.trim()), 400);
    return () => clearTimeout(id);
  }, [contractNumberFilter]);

  // Count of active advanced filters (for the panel badge / clear button).
  const activeFilterCount =
    (contractNumberFilter ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (identityNumberFilter ? 1 : 0) +
    (customerArabicNameFilter ? 1 : 0) +
    (customerPhoneFilter ? 1 : 0) +
    (customerEmailFilter ? 1 : 0) +
    (workerPassportFilter ? 1 : 0) +
    (createdByFilter !== 'all' ? 1 : 0) +
    (expiresAfterDaysFilter != null ? 1 : 0) +
    (expirationConditionFilter !== 'all' ? 1 : 0) +
    (laborSelectionStatusFilter !== 'all' ? 1 : 0) +
    (nationalityFilter !== 'all' ? 1 : 0) +
    (jobFilter !== 'all' ? 1 : 0) +
    (marketerFilter !== 'all' ? 1 : 0) +
    (operationTypeFilter !== 'all' ? 1 : 0) +
    (dateRange[0] || dateRange[1] ? 1 : 0) +
    (createdDateRange[0] || createdDateRange[1] ? 1 : 0) +
    (contractEndDateRange[0] || contractEndDateRange[1] ? 1 : 0);

  const clearFilters = () => {
    setContractNumberFilter('');
    setStatusFilter('all');
    setIdentityNumberFilter('');
    setCustomerArabicNameFilter('');
    setCustomerPhoneFilter('');
    setCustomerEmailFilter('');
    setWorkerPassportFilter('');
    setCreatedByFilter('all');
    setExpiresAfterDaysFilter(null);
    setExpirationConditionFilter('all');
    setLaborSelectionStatusFilter('all');
    setNationalityFilter('all');
    setJobFilter('all');
    setMarketerFilter('all');
    setOperationTypeFilter('all');
    setDateRange([undefined, undefined]);
    setCreatedDateRange([undefined, undefined]);
    setContractEndDateRange([undefined, undefined]);
  };

  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createSelectedOffer, setCreateSelectedOffer] = useState<EmploymentContractOffer | null>(null);
  const [createForm] = Form.useForm();
  const [editModal, setEditModal] = useState<{ open: boolean; raw: EmploymentOperatingContract | null }>({ open: false, raw: null });
  const [editForm] = Form.useForm();
  const [renewModal, setRenewModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [terminateModal, setTerminateModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [refundModal, setRefundModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [receiptsModal, setReceiptsModal] = useState<{ open: boolean; contract: RentContract | null }>({ open: false, contract: null });
  const [printModal, setPrintModal] = useState<{ open: boolean; title: string }>({ open: false, title: '' });
  const [printData, setPrintData] = useState<ContractPrintReceiptData | null>(null);
  const [printLoading, setPrintLoading] = useState(false);
  // Worker delivery-form modal
  const [deliveryModal, setDeliveryModal] = useState<{ open: boolean; id: string | null; title: string }>({ open: false, id: null, title: '' });
  const [deliveryData, setDeliveryData] = useState<OperatingContractDeliveryFormDto | null>(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  // Signed handover receipt modal (separate entity from the delivery form above)
  const [handoverModal, setHandoverModal] = useState<{ open: boolean; contract: RentContract | null }>({ open: false, contract: null });

  const {
    contracts: apiContracts,
    isLoading,
    createContract,
    updateContract,
    deleteContract,
    signContract,
    startExecution,
    renewContract,
    terminateContract,
    recordCustomerRefund,
    printReceiptForm,
    printDeliveryForm,
    saveDeliveryForm,
    isCreating,
    isUpdating,
    isDeleting,
    isSigning,
    isStartingExecution,
    isRenewing,
    isTerminating,
    isRefunding,
    isSavingDeliveryForm,
  } = useEmploymentOperatingContracts({
    Search: debouncedSearchText || undefined,
    ContractNumber: debouncedContractNumber || undefined,
    ContractStatus: statusFilter === 'all' ? undefined : Number(statusFilter),
    IdentityNumber: identityNumberFilter || undefined,
    ArabicName: customerArabicNameFilter || undefined,
    Phone: customerPhoneFilter || undefined,
    CustomerEmail: customerEmailFilter || undefined,
    WorkerPassportNumber: workerPassportFilter || undefined,
    CreatedBy: createdByFilter !== 'all' ? createdByFilter : undefined,
    ExpiresAfterDays: expiresAfterDaysFilter ?? undefined,
    ExpirationCondition:
      expirationConditionFilter !== 'all' ? Number(expirationConditionFilter) as 1 | 2 | 3 : undefined,
    LaborSelectionStatus:
      laborSelectionStatusFilter !== 'all' ? Number(laborSelectionStatusFilter) : undefined,
    NationalityId: nationalityFilter !== 'all' ? nationalityFilter : undefined,
    JobId: jobFilter !== 'all' ? jobFilter : undefined,
    MarketerId: marketerFilter !== 'all' ? marketerFilter : undefined,
    Type: operationTypeFilter !== 'all' ? Number(operationTypeFilter) : undefined,
    SignatureDateFrom: dateRange[0],
    SignatureDateTo: dateRange[1],
    CreatedDateFrom: createdDateRange[0],
    CreatedDateTo: createdDateRange[1],
    ContractEndDateFrom: contractEndDateRange[0],
    ContractEndDateTo: contractEndDateRange[1],
  });

  const { data: jobs = [] } = useJobs();
  const { data: nationalities = [] } = useNationalities();
  const { customers = [] } = useCustomers();
  const { data: marketers = [] } = useMarketers();
  const { users = [] } = useUsers();

  useEffect(() => setMounted(true), []);

  // API → view model
  const contractsData = useMemo(
    () => (Array.isArray(apiContracts) ? apiContracts : []),
    [apiContracts]
  );
  const contractsMap = useMemo(() => {
    const m = new Map<string, EmploymentOperatingContract>();
    contractsData.forEach((c) => m.set(String(c.id), c));
    return m;
  }, [contractsData]);

  const allContracts = useMemo((): RentContract[] => {
    const resolveNationality = buildNationalityResolver(nationalities as any[]);
    const resolveJob = buildJobResolver(jobs as any[]);
    const resolveCustomer = buildCustomerResolver(customers as any[]);
    return contractsData.map((c) =>
      mapContract(c, resolveNationality, resolveJob, resolveCustomer)
    );
  }, [contractsData, nationalities, jobs, customers]);

  const t = {
    pageTitle: isRtl ? 'عقود العاملات المقيمة ' : 'Operation Contracts',
    pageSubtitle: isRtl ? 'إدارة جميع عقود العاملات المقيمة' : 'Manage all operation worker contracts',
    addContract: isRtl ? 'إضافة عقد' : 'Add Contract',
    search: isRtl ? 'بحث برقم العقد أو اسم العميل...' : 'Search by contract number or customer name...',
    allStatuses: isRtl ? 'جميع الحالات' : 'All Statuses',
    draft: isRtl ? 'مسودة' : 'Draft',
    signed: isRtl ? 'موقع' : 'Signed',
    executing: isRtl ? 'منفذ' : 'Executing',
    finished: isRtl ? 'منتهي' : 'Finished',
    allNationalities: isRtl ? 'جميع الجنسيات' : 'All Nationalities',
    contractNumberFilter: isRtl ? 'رقم العقد' : 'Contract Number',
    allMarketers: isRtl ? 'جميع المسوقين' : 'All Marketers',
    startDate: isRtl ? 'تاريخ البداية' : 'Start Date',
    endDate: isRtl ? 'تاريخ النهاية' : 'End Date',
    totalContracts: isRtl ? 'إجمالي العقود' : 'Total Contracts',
    activeContracts: isRtl ? 'عقود منفذة' : 'Executing Contracts',
    expiringContracts: isRtl ? 'عقود قرب الانتهاء' : 'Expiring Soon',
    totalRevenue: isRtl ? 'إجمالي الإيرادات' : 'Total Revenue',
    noResults: isRtl ? 'لا توجد نتائج' : 'No results found',
    contractEndDateRange: isRtl ? 'تاريخ نهاية العقد (من/إلى)' : 'Contract End Date (From/To)',
  };

  // Server-backed filters are sent through the hook; this only preserves the
  // prefilled customer route constraint and mirrors the debounced Search text.
  const filteredContracts = useMemo(() => {
    return allContracts.filter((contract) => {
      if (customerId && String(contract.customerId) !== String(customerId)) return false;
      const searchLower = searchText.toLowerCase();
      const matchesSearch =
        !searchText ||
        contract.contractNumber.toLowerCase().includes(searchLower) ||
        contract.customerName.toLowerCase().includes(searchLower) ||
        contract.customerNameAr.includes(searchText) ||
        contract.workerName.toLowerCase().includes(searchLower) ||
        contract.workerNameAr.includes(searchText);
      return matchesSearch;
    });
  }, [allContracts, searchText, customerId]);

  const stats = useMemo(
    () => ({
      total: allContracts.length,
      executing: allContracts.filter((c) => c.status === 'executing').length,
      expiring: allContracts.filter(
        (c) => !!c.endDate && c.daysRemaining < 30 && c.status === 'executing'
      ).length,
      // List endpoint carries no collection data — total contracted value is the honest figure.
      revenue: allContracts.reduce((sum, c) => sum + c.monthlyRent, 0),
    }),
    [allContracts]
  );

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleCreateOfferSelect = (offer: EmploymentContractOffer) => {
    setCreateSelectedOffer(offer);
    createForm.setFieldsValue({
      offerId: offer.id,
      nationalityId: offer.nationalityId ?? undefined,
      jobId: offer.jobId ?? undefined,
      duration: offer.duration ?? undefined,
      cost: offer.cost ?? 0,
      insurance: offer.insurance ?? 0,
      offerPrice: offer.totalCostWithTax ?? offer.cost ?? 0,
    });
  };

  const handleCreateSubmit = async () => {
    try {
      const v = await createForm.validateFields();
      createContract({
        customerId: v.customerId,
        offerId: v.offerId,
        nationalityId: v.nationalityId,
        jobId: v.jobId,
        duration: v.duration,
        cost: v.cost,
        insurance: v.insurance,
        offerPrice: v.offerPrice,
        contractStartDate: v.contractStartDate?.toISOString(),
        contractEndDate: v.contractEndDate?.toISOString(),
        customerAddress: v.customerAddress,
        workerId: v.workerId ?? null,
        workerNameAr: v.workerNameAr,
        workerNameEn: v.workerNameEn,
        workerPhone: v.workerPhone,
        workersCount: v.workersCount,
        paymentMethod: v.paymentMethod,
      });
      setCreateModalOpen(false);
      createForm.resetFields();
      setCreateSelectedOffer(null);
    } catch {
      /* validation handled by form */
    }
  };

  const handleEditOpen = (contract: RentContract) => {
    const raw = contractsMap.get(contract.id) || null;
    setEditModal({ open: true, raw });
    editForm.setFieldsValue({
      customerId: raw?.customerId,
      nationalityId: raw?.nationalityId,
      jobId: raw?.jobId,
      duration: raw?.duration,
      cost: raw?.cost,
      insurance: raw?.insurance,
      offerPrice: raw?.offerPrice,
      contractStartDate: raw?.contractStartDate ? dayjs(raw.contractStartDate) : undefined,
      contractEndDate: raw?.contractEndDate ? dayjs(raw.contractEndDate) : undefined,
      workerId: raw?.workerId ? String(raw.workerId) : undefined,
      workerNameAr: raw?.workerNameAr,
      workerNameEn: raw?.workerNameEn,
      workerPhone: raw?.workerPhone,
      workersCount: raw?.workersCount,
      customerAddress: raw?.customerAddress,
      paymentMethod: raw?.paymentMethod,
    });
  };

  const handleEditSubmit = async () => {
    if (!editModal.raw) return;
    try {
      const v = await editForm.validateFields();
      updateContract({
        id: editModal.raw.id,
        data: {
          customerId: v.customerId,
          nationalityId: v.nationalityId,
          jobId: v.jobId,
          duration: v.duration,
          cost: v.cost,
          insurance: v.insurance,
          offerPrice: v.offerPrice,
          contractStartDate: v.contractStartDate?.toISOString(),
          contractEndDate: v.contractEndDate?.toISOString(),
          customerAddress: v.customerAddress,
          workerId: v.workerId ?? null,
          workerNameAr: v.workerNameAr,
          workerNameEn: v.workerNameEn,
          workerPhone: v.workerPhone,
          workersCount: v.workersCount,
          paymentMethod: v.paymentMethod,
        },
      });
      setEditModal({ open: false, raw: null });
      editForm.resetFields();
    } catch {
      /* validation handled by form */
    }
  };

  const handleRenewSubmit = (newEndDate: string) => {
    if (!renewModal.id) return;
    renewContract({ id: renewModal.id, newEndDate });
    setRenewModal({ open: false, id: null });
  };

  const handleTerminateSubmit = (data: TerminateContractDto) => {
    if (!terminateModal.id) return;
    terminateContract({ id: terminateModal.id, data });
    setTerminateModal({ open: false, id: null });
  };

  const handleRefundSubmit = (data: CustomerRefundDto) => {
    if (!refundModal.id) return;
    recordCustomerRefund({ id: refundModal.id, data });
    setRefundModal({ open: false, id: null });
  };

  const handlePrint = async (contract: RentContract) => {
    // Open the preview immediately with a loading state, then fetch the data so
    // the result is rendered (and printed) rather than discarded.
    setPrintData(null);
    setPrintLoading(true);
    setPrintModal({ open: true, title: `#${contract.contractNumber}` });
    try {
      const data = await printReceiptForm(contract.id);
      // The endpoint returns only the contract (GUID FKs, no lookup names);
      // merge the names we already resolved into the card's view model.
      data.display = {
        customerName: isRtl ? contract.customerNameAr : contract.customerName,
        customerPhone: contract.customerPhone,
        nationalityName: isRtl ? contract.nationalityAr : contract.nationality,
        jobName: isRtl ? contract.professionAr : contract.profession,
      };
      setPrintData(data);
    } catch {
      // hook surfaces the error toast; keep the modal open with an empty state
    } finally {
      setPrintLoading(false);
    }
  };

  // Load + open the worker delivery-form modal.
  const handleDeliveryForm = async (contract: RentContract) => {
    setDeliveryData(null);
    setDeliveryLoading(true);
    setDeliveryModal({ open: true, id: contract.id, title: `#${contract.contractNumber}` });
    try {
      const data = await printDeliveryForm(contract.id);
      setDeliveryData(data);
    } catch {
      // hook surfaces the error toast; modal stays open with an empty state
    } finally {
      setDeliveryLoading(false);
    }
  };

  const handleSaveDeliveryForm = async (data: SaveDeliveryFormDto) => {
    if (!deliveryModal.id) return;
    const updated = await saveDeliveryForm({ id: deliveryModal.id, data });
    // Reflect the saved values (signature timestamps etc.) back in the modal.
    setDeliveryData((prev) => ({ ...(prev ?? {}), ...(updated ?? {}) }));
  };

  const cardActions = {
    onEdit: handleEditOpen,
    onDelete: (c: RentContract) => deleteContract(c.id),
    onSign: (c: RentContract) => signContract(c.id),
    onStartExecution: (c: RentContract) => startExecution(c.id),
    onRenew: (c: RentContract) => setRenewModal({ open: true, id: c.id }),
    onTerminate: (c: RentContract) => setTerminateModal({ open: true, id: c.id }),
    onRefund: (c: RentContract) => setRefundModal({ open: true, id: c.id }),
    onReceipts: (c: RentContract) => setReceiptsModal({ open: true, contract: c }),
    onPrint: handlePrint,
    onDeliveryForm: handleDeliveryForm,
    onHandoverReceipt: (c: RentContract) => setHandoverModal({ open: true, contract: c }),
  };

  if (!mounted) return null;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip={isRtl ? 'جاري التحميل...' : 'Loading...'} />
      </div>
    );
  }

  return (
    <div className={styles.rentContractsPage}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerTitle}>
            <FileTextOutlined className={styles.headerIcon} />
            <div>
              <h1>{t.pageTitle}</h1>
              <p className={styles.headerSubtitle}>{t.pageSubtitle}</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className={styles.primaryBtn}
              onClick={() => {
                setCreateSelectedOffer(null);
                createForm.resetFields();
                setCreateModalOpen(true);
              }}
            >
              {t.addContract}
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} className={styles.statisticsRow}>
        <Col xs={12} sm={6}>
          <Card className={styles.statCard}>
            <Statistic title={t.totalContracts} value={stats.total} prefix={<FileTextOutlined style={{ color: '#003366' }} />} valueStyle={{ color: '#003366' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className={styles.statCard}>
            <Statistic title={t.activeContracts} value={stats.executing} prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className={styles.statCard}>
            <Statistic title={t.expiringContracts} value={stats.expiring} prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className={styles.statCard}>
            <Statistic title={t.totalRevenue} value={stats.revenue} prefix={<DollarOutlined style={{ color: '#1890ff' }} />} valueStyle={{ color: '#1890ff' }} formatter={(value) => formatCurrency(value as number, isRtl)} />
          </Card>
        </Col>
      </Row>

      {/* Customer filter indicator */}
      {customerId && (
        <Card style={{ marginBottom: 16, background: '#e6f7ff', borderColor: '#1890ff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserOutlined style={{ color: '#1890ff' }} />
            <span>{isRtl ? `عرض عقود العميل رقم: ${customerId}` : `Showing contracts for Customer ID: ${customerId}`}</span>
            <Button type="link" size="small" onClick={() => router.push('/contracts/operation/rent')}>
              {isRtl ? 'عرض جميع العقود' : 'Show All Contracts'}
            </Button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <AdvancedFilterPanel
        activeCount={activeFilterCount}
        onClear={clearFilters}
        contentLayout="block"
        quickFilters={
          <Input
            placeholder={t.search}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ width: 300 }}
          />
        }
      >
        <div className={styles.filterContent}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{t.contractNumberFilter}</label>
              <Input
                placeholder={t.contractNumberFilter}
                value={contractNumberFilter}
                onChange={(e) => setContractNumberFilter(e.target.value)}
                allowClear
              />
            </Col>

            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{t.allStatuses}</label>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: '100%' }}
                options={[
                  { value: 'all', label: t.allStatuses },
                  ...toSelectOptions(OPERATING_CONTRACT_STATUS, language).map((o) => ({ ...o, value: String(o.value) })),
                ]}
              />
            </Col>

            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{isRtl ? 'رقم الهوية / الإقامة' : 'National ID / Iqama'}</label>
              <Input
                value={identityNumberFilter}
                onChange={(e) => setIdentityNumberFilter(e.target.value)}
                allowClear
              />
            </Col>

            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{isRtl ? 'الاسم عربي' : 'Arabic Name'}</label>
              <Input
                value={customerArabicNameFilter}
                onChange={(e) => setCustomerArabicNameFilter(e.target.value)}
                allowClear
              />
            </Col>

            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{isRtl ? 'الجوال / الهاتف' : 'Mobile / Phone'}</label>
              <Input
                value={customerPhoneFilter}
                onChange={(e) => setCustomerPhoneFilter(e.target.value)}
                allowClear
              />
            </Col>

            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{isRtl ? 'البريد الإلكتروني' : 'Email Address'}</label>
              <Input
                value={customerEmailFilter}
                onChange={(e) => setCustomerEmailFilter(e.target.value)}
                allowClear
              />
            </Col>

            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{isRtl ? 'رقم جواز السفر' : 'Passport Number'}</label>
              <Input
                value={workerPassportFilter}
                onChange={(e) => setWorkerPassportFilter(e.target.value)}
                allowClear
              />
            </Col>

            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{t.allNationalities}</label>
              <Select
                value={nationalityFilter}
                onChange={setNationalityFilter}
                style={{ width: '100%' }}
                showSearch
                optionFilterProp="label"
                options={[
                  { value: 'all', label: t.allNationalities },
                  ...(nationalities as any[]).map((n) => ({
                    value: String(n.id),
                    label: isRtl ? n.nationalityNameAr : n.nationalityNameEn,
                  })),
                ]}
              />
            </Col>

            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{isRtl ? 'الوظيفة' : 'Occupation / Job'}</label>
              <Select
                value={jobFilter}
                onChange={setJobFilter}
                style={{ width: '100%' }}
                showSearch
                optionFilterProp="label"
                options={[
                  { value: 'all', label: isRtl ? 'جميع الوظائف' : 'All Jobs' },
                  ...(jobs as any[]).map((j) => ({
                    value: String(j.id),
                    label: (isRtl ? j.jobNameAr : j.jobNameEn) || j.jobNameAr || j.jobNameEn || `#${j.id}`,
                  })),
                ]}
              />
            </Col>

            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{t.allMarketers}</label>
              <Select
                value={marketerFilter}
                onChange={setMarketerFilter}
                style={{ width: '100%' }}
                showSearch
                optionFilterProp="label"
                options={[
                  { value: 'all', label: t.allMarketers },
                  ...(marketers as any[]).map((m) => ({
                    value: String(m.id),
                    label: (isRtl ? m.nameAr : m.nameEn) || m.nameAr || m.nameEn || `#${m.id}`,
                  })),
                ]}
              />
            </Col>

            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{isRtl ? 'تم الإنشاء بواسطة' : 'Created By'}</label>
              <Select
                value={createdByFilter}
                onChange={setCreatedByFilter}
                style={{ width: '100%' }}
                showSearch
                optionFilterProp="label"
                options={[
                  { value: 'all', label: isRtl ? 'جميع المستخدمين' : 'All Users' },
                  ...(users as any[]).map((u) => ({
                    value: String(u.id),
                    label: u.fullName || u.username || `#${u.id}`,
                  })),
                ]}
              />
            </Col>

            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{isRtl ? 'النوع' : 'Type'}</label>
              <Select
                value={operationTypeFilter}
                onChange={setOperationTypeFilter}
                style={{ width: '100%' }}
                options={[
                  { value: 'all', label: isRtl ? 'كل الأنواع' : 'All Types' },
                  ...toSelectOptions(OPERATION_TYPE, language).map((o) => ({ ...o, value: String(o.value) })),
                ]}
              />
            </Col>

            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{isRtl ? 'حالة اختيار العمالة' : 'Labor Selection Status'}</label>
              <Select
                value={laborSelectionStatusFilter}
                onChange={setLaborSelectionStatusFilter}
                style={{ width: '100%' }}
                options={[
                  { value: 'all', label: isRtl ? 'كل حالات اختيار العمالة' : 'All Labor Selection Statuses' },
                  ...toSelectOptions(LABOR_MANAGEMENT, language).map((o) => ({ ...o, value: String(o.value) })),
                ]}
              />
            </Col>

            <Col xs={24} md={12}>
              <label className={styles.filterLabel}>{isRtl ? 'تاريخ التوقيع' : 'Signing Date'}</label>
              <DateRangeFilter value={dateRange} onChange={setDateRange} style={{ width: '100%' }} />
            </Col>

            <Col xs={24} md={12}>
              <label className={styles.filterLabel}>{isRtl ? 'تاريخ الإنشاء' : 'Creation Date'}</label>
              <DateRangeFilter value={createdDateRange} onChange={setCreatedDateRange} style={{ width: '100%' }} />
            </Col>

            <Col xs={24} md={12}>
              <label className={styles.filterLabel}>{isRtl ? 'تاريخ نهاية العقد' : 'Contract Expiration Date'}</label>
              <DateRangeFilter value={contractEndDateRange} onChange={setContractEndDateRange} style={{ width: '100%' }} />
            </Col>

            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{isRtl ? 'ينتهي بعد' : 'Expires After'}</label>
              <InputNumber
                min={0}
                value={expiresAfterDaysFilter}
                onChange={(value) => setExpiresAfterDaysFilter(value ?? null)}
                style={{ width: '100%' }}
              />
            </Col>

            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{isRtl ? 'شرط نهاية العقد' : 'Contract Expiration Condition'}</label>
              <Select
                value={expirationConditionFilter}
                onChange={setExpirationConditionFilter}
                style={{ width: '100%' }}
                options={[
                  { value: 'all', label: isRtl ? 'كل شروط النهاية' : 'All Expiration Conditions' },
                  { value: '1', label: isRtl ? 'غير منتهي' : 'Not Expired' },
                  { value: '2', label: isRtl ? 'منتهي' : 'Expired' },
                  { value: '3', label: isRtl ? 'ينتهي خلال مدة' : 'Expiring Within Days' },
                ]}
              />
            </Col>
          </Row>
        </div>
      </AdvancedFilterPanel>

      {/* Results info */}
      <div className={styles.resultsInfo}>
        <span>
          {isRtl
            ? `عرض ${filteredContracts.length} من ${allContracts.length} عقد`
            : `Showing ${filteredContracts.length} of ${allContracts.length} contracts`}
        </span>
      </div>

      {/* Grid */}
      {filteredContracts.length > 0 ? (
        <Row gutter={[16, 16]} className={styles.contractsGrid}>
          {filteredContracts.map((contract) => (
            <ContractCard
              key={contract.id}
              contract={contract}
              isRtl={isRtl}
              loading={{ isSigning, isStartingExecution, isRenewing, isTerminating, isDeleting, isRefunding }}
              actions={cardActions}
            />
          ))}
        </Row>
      ) : (
        <Card className={styles.emptyCard}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t.noResults} />
        </Card>
      )}

      {/* ─── Modals ─────────────────────────────────────────────────────────── */}
      <ContractFormModal
        mode="create"
        open={createModalOpen}
        isRtl={isRtl}
        language={language}
        form={createForm}
        loading={isCreating}
        customers={customers as any[]}
        jobs={jobs as any[]}
        selectedOffer={createSelectedOffer}
        onOfferSelect={handleCreateOfferSelect}
        onCancel={() => {
          setCreateModalOpen(false);
          createForm.resetFields();
          setCreateSelectedOffer(null);
        }}
        onSubmit={handleCreateSubmit}
      />

      <ContractFormModal
        mode="edit"
        open={editModal.open}
        isRtl={isRtl}
        language={language}
        form={editForm}
        loading={isUpdating}
        customers={customers as any[]}
        jobs={jobs as any[]}
        onCancel={() => {
          setEditModal({ open: false, raw: null });
          editForm.resetFields();
        }}
        onSubmit={handleEditSubmit}
      />

      <RenewModal
        open={renewModal.open}
        isRtl={isRtl}
        loading={isRenewing}
        onCancel={() => setRenewModal({ open: false, id: null })}
        onSubmit={handleRenewSubmit}
      />

      <TerminateModal
        open={terminateModal.open}
        isRtl={isRtl}
        loading={isTerminating}
        onCancel={() => setTerminateModal({ open: false, id: null })}
        onSubmit={handleTerminateSubmit}
      />

      <CustomerRefundModal
        open={refundModal.open}
        isRtl={isRtl}
        loading={isRefunding}
        onCancel={() => setRefundModal({ open: false, id: null })}
        onSubmit={handleRefundSubmit}
      />

      <ContractReceiptsModal
        open={receiptsModal.open}
        isRtl={isRtl}
        contractId={receiptsModal.contract?.id ?? null}
        contractLabel={receiptsModal.contract ? `#${receiptsModal.contract.contractNumber}` : undefined}
        onClose={() => setReceiptsModal({ open: false, contract: null })}
      />

      <PrintReceiptModal
        open={printModal.open}
        isRtl={isRtl}
        data={printData}
        loading={printLoading}
        title={printModal.title}
        onClose={() => setPrintModal({ open: false, title: '' })}
      />

      <DeliveryFormModal
        open={deliveryModal.open}
        isRtl={isRtl}
        data={deliveryData}
        loading={deliveryLoading}
        saving={isSavingDeliveryForm}
        title={deliveryModal.title}
        onClose={() => setDeliveryModal({ open: false, id: null, title: '' })}
        onSave={handleSaveDeliveryForm}
      />

      <WorkerDeliveryRecordModal
        open={handoverModal.open}
        isRtl={isRtl}
        contract={handoverModal.contract}
        onClose={() => setHandoverModal({ open: false, contract: null })}
      />
    </div>
  );
}
