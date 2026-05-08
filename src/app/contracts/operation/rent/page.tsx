'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Input,
  Select,
  Statistic,
  Avatar,
  Empty,
  Modal,
  Progress,
  Badge,
  Dropdown,
  DatePicker,
  Spin,
  Form,
  InputNumber,
  Alert,
  Popconfirm,
  Space,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  FileTextOutlined,
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PrinterOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  MoreOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  ReloadOutlined,
  HomeOutlined,
  PlayCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import { useAuthStore } from '@/store/authStore';
import { useEmploymentOperatingContracts } from '@/hooks/api/useEmploymentOperatingContracts';
import { useNationalities } from '@/hooks/api/useNationalities';
import { useJobs } from '@/hooks/api/useJobs';
import { useCustomers } from '@/hooks/api/useCustomers';
import RentOfferSelector from '@/components/contracts/RentOfferSelector';
import type { EmploymentOperatingContract, EmploymentContractOffer } from '@/types/api.types';
import styles from './RentContracts.module.css';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

// Contract status enum (matches API: 1=Draft, 2=Signed, 3=Executing, 4=Finished)
type ContractStatusKey = 'draft' | 'signed' | 'executing' | 'finished';

interface RentContract {
  id: string;
  customerId: number;
  contractNumber: string;
  customerName: string;
  customerNameAr: string;
  customerPhone: string;
  /** API contractStatus mapped to a display key */
  status: ContractStatusKey;
  /** Raw API contractStatus number (1-4) */
  contractStatus: number;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  totalCollected: number;
  remainingAmount: number;
  workerName: string;
  workerNameAr: string;
  nationality: string;
  nationalityAr: string;
  nationalityId: string;
  profession: string;
  professionAr: string;
  branch: string;
  branchAr: string;
  daysRemaining: number;
  createdAt: string;
  notes: string;
}

export default function RentContractsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customerId');

  const language = useAuthStore((state) => state.language);
  const isRtl = language === 'ar';
  const [mounted, setMounted] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [nationalityFilter, setNationalityFilter] = useState<string | 'all'>('all');
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);
  const [selectedContract, setSelectedContract] = useState<RentContract | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Create Contract Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSelectedOffer, setCreateSelectedOffer] = useState<EmploymentContractOffer | null>(null);
  const [createForm] = Form.useForm();

  // Edit Contract Modal state
  const [editModal, setEditModal] = useState<{ open: boolean; rawContract: EmploymentOperatingContract | null }>({ open: false, rawContract: null });
  const [editForm] = Form.useForm();

  // Renew Modal state (for Executing contracts)
  const [renewModal, setRenewModal] = useState<{ open: boolean; contractId: string | null }>({ open: false, contractId: null });
  const [renewForm] = Form.useForm();

  // Terminate Modal state (for Executing contracts)
  const [terminateModal, setTerminateModal] = useState<{ open: boolean; contractId: string | null }>({ open: false, contractId: null });
  const [terminateForm] = Form.useForm();

  // Fetch contracts from API
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
    printReceiptForm,
    isCreating,
    isUpdating,
    isDeleting,
    isSigning,
    isStartingExecution,
    isRenewing,
    isTerminating,
  } = useEmploymentOperatingContracts();

  // Lookup hooks
  const { data: jobs = [] } = useJobs();
  const { data: nationalities = [] } = useNationalities();
  const { customers = [] } = useCustomers();

  // Safely extract data from API response (handles wrapped responses)
  const contractsData = useMemo((): EmploymentOperatingContract[] => {
    if (!apiContracts) return [];
    if (Array.isArray(apiContracts)) return apiContracts;
    const r = apiContracts as any;
    if (Array.isArray(r?.data?.items)) return r.data.items;
    if (Array.isArray(r?.data)) return r.data;
    if (Array.isArray(r?.items)) return r.items;
    return [];
  }, [apiContracts]);

  // Map from contract id → raw API contract (for edit operations)
  const contractsMap = useMemo(() => {
    const m = new Map<string, EmploymentOperatingContract>();
    contractsData.forEach((c) => m.set(String(c.id), c));
    return m;
  }, [contractsData]);

  // Helper: resolve nationality name from UUID
  const getNationalityNameById = useMemo(() => {
    const map = new Map<string, { ar: string; en: string }>();
    nationalities.forEach((n) => {
      map.set(String(n.id), {
        ar: n.nationalityNameAr || n.nationalityNameEn || String(n.id),
        en: n.nationalityNameEn || n.nationalityNameAr || String(n.id),
      });
    });
    return (id: string | null | undefined): { ar: string; en: string } => {
      if (!id) return { ar: 'غير معروف', en: 'Unknown' };
      return map.get(String(id)) || { ar: 'غير معروف', en: 'Unknown' };
    };
  }, [nationalities]);

  // Helper: resolve job name from ID
  const getJobNameById = useMemo(() => {
    const map = new Map<number, { ar: string; en: string }>();
    (jobs as any[]).forEach((j: any) => {
      map.set(j.id, {
        ar: j.jobNameAr || j.name || `#${j.id}`,
        en: j.jobNameEn || j.jobNameAr || j.name || `#${j.id}`,
      });
    });
    return (id: number | null | undefined): { ar: string; en: string } => {
      if (!id) return { ar: 'غير معروف', en: 'Unknown' };
      return map.get(id) || { ar: 'غير معروف', en: 'Unknown' };
    };
  }, [jobs]);

  // Map API data to internal RentContract format
  const allContracts = useMemo((): RentContract[] => {
    return contractsData.map((contract): RentContract => {
      const startDate = contract.contractStartDate || new Date().toISOString();
      const endDate = contract.contractEndDate || new Date().toISOString();
      const daysRemaining = Math.max(
        0,
        Math.floor((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      );

      // Map contractStatus number → display key
      const cs = contract.contractStatus || 1;
      let status: ContractStatusKey = 'draft';
      if (cs === 2) status = 'signed';
      else if (cs === 3) status = 'executing';
      else if (cs === 4) status = 'finished';

      const monthlyRent = contract.cost || 0;
      const monthsActive = Math.max(
        1,
        Math.floor((Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
      );
      const totalCollected = monthlyRent * monthsActive;

      const natName = getNationalityNameById(contract.nationalityId);
      const jobNameResolved = contract.jobName
        ? { ar: contract.jobName, en: contract.jobName }
        : getJobNameById(contract.jobId as any);

      return {
        id: String(contract.id),
        customerId: Number(contract.customerId) || 0,
        contractNumber: `R${2024000 + Number(contract.id)}`,
        customerName: contract.customerNameAr || 'Unknown',
        customerNameAr: contract.customerNameAr || 'غير معروف',
        customerPhone: contract.mobile || '05xxxxxxxx',
        status,
        contractStatus: cs,
        startDate,
        endDate,
        monthlyRent,
        totalCollected,
        remainingAmount: Math.max(
          0,
          (contract.totalCostWithTax || contract.cost || 0) - totalCollected
        ),
        workerName: jobNameResolved.en,
        workerNameAr: jobNameResolved.ar,
        nationality: natName.en,
        nationalityAr: natName.ar,
        nationalityId: contract.nationalityId || '',
        profession: jobNameResolved.en,
        professionAr: jobNameResolved.ar,
        branch: 'Sigma Recruitment Office',
        branchAr: 'سيجما الكفاءات للاستقدام',
        daysRemaining,
        createdAt: contract.createdAt || new Date().toISOString(),
        notes: contract.noteFinish || '',
      };
    });
  }, [contractsData, getNationalityNameById, getJobNameById]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Translations
  const t = {
    pageTitle: isRtl ? 'عقود العاملات المقيمة ' : 'Operation Contracts',
    pageSubtitle: isRtl
      ? 'إدارة جميع عقود العاملات المقيمة'
      : 'Manage all operation worker contracts',
    addContract: isRtl ? 'إضافة عقد' : 'Add Contract',
    exportExcel: isRtl ? 'تصدير إكسل' : 'Export Excel',
    print: isRtl ? 'طباعة' : 'Print',
    search: isRtl
      ? 'بحث برقم العقد أو اسم العميل...'
      : 'Search by contract number or customer name...',
    allStatuses: isRtl ? 'جميع الحالات' : 'All Statuses',
    draft: isRtl ? 'مسودة' : 'Draft',
    signed: isRtl ? 'موقع' : 'Signed',
    executing: isRtl ? 'منفذ' : 'Executing',
    finished: isRtl ? 'منتهي' : 'Finished',
    allNationalities: isRtl ? 'جميع الجنسيات' : 'All Nationalities',
    startDate: isRtl ? 'تاريخ البداية' : 'Start Date',
    endDate: isRtl ? 'تاريخ النهاية' : 'End Date',
    totalContracts: isRtl ? 'إجمالي العقود' : 'Total Contracts',
    activeContracts: isRtl ? 'عقود منفذة' : 'Executing Contracts',
    expiringContracts: isRtl ? 'عقود قرب الانتهاء' : 'Expiring Soon',
    totalRevenue: isRtl ? 'إجمالي الإيرادات' : 'Total Revenue',
    contractNumber: isRtl ? 'رقم العقد' : 'Contract Number',
    customer: isRtl ? 'العميل' : 'Customer',
    worker: isRtl ? 'العامل' : 'Worker',
    status: isRtl ? 'الحالة' : 'Status',
    monthlyRent: isRtl ? 'التكلفة' : 'Cost',
    collected: isRtl ? 'المحصل' : 'Collected',
    remaining: isRtl ? 'المتبقي' : 'Remaining',
    nationality: isRtl ? 'الجنسية' : 'Nationality',
    profession: isRtl ? 'المهنة' : 'Profession',
    daysLeft: isRtl ? 'الأيام المتبقية' : 'Days Left',
    viewDetails: isRtl ? 'عرض التفاصيل' : 'View Details',
    edit: isRtl ? 'تعديل' : 'Edit',
    delete: isRtl ? 'حذف' : 'Delete',
    noResults: isRtl ? 'لا توجد نتائج' : 'No results found',
    phone: isRtl ? 'الهاتف' : 'Phone',
    signContract: isRtl ? 'توقيع العقد' : 'Sign Contract',
    startExecution: isRtl ? 'بدء التنفيذ' : 'Start Execution',
    renewContract: isRtl ? 'تجديد العقد' : 'Renew Contract',
    terminateContract: isRtl ? 'إنهاء العقد' : 'Terminate Contract',
    printReceipt: isRtl ? 'طباعة الإيصال' : 'Print Receipt',
    confirmDelete: isRtl
      ? 'هل أنت متأكد من حذف هذا العقد؟'
      : 'Are you sure you want to delete this contract?',
    yes: isRtl ? 'نعم' : 'Yes',
    no: isRtl ? 'لا' : 'No',
    renewDate: isRtl ? 'تاريخ الانتهاء الجديد' : 'New End Date',
    terminateNote: isRtl ? 'سبب الإنهاء' : 'Termination Note',
    refresh: isRtl ? 'تحديث' : 'Refresh',
  };

  // Filter contracts
  const filteredContracts = useMemo(() => {
    return allContracts.filter((contract) => {
      if (customerId && contract.customerId !== Number(customerId)) return false;
      const searchLower = searchText.toLowerCase();
      const matchesSearch =
        !searchText ||
        contract.contractNumber.toLowerCase().includes(searchLower) ||
        contract.customerName.toLowerCase().includes(searchLower) ||
        contract.customerNameAr.includes(searchText) ||
        contract.workerName.toLowerCase().includes(searchLower) ||
        contract.workerNameAr.includes(searchText);
      const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
      const matchesNationality =
        nationalityFilter === 'all' || contract.nationalityId === String(nationalityFilter);
      const matchesDate =
        !dateRange ||
        (new Date(contract.startDate) >= dateRange[0].toDate() &&
          new Date(contract.startDate) <= dateRange[1].toDate());
      return matchesSearch && matchesStatus && matchesNationality && matchesDate;
    });
  }, [allContracts, searchText, statusFilter, nationalityFilter, dateRange, customerId]);

  // Statistics
  const stats = useMemo(
    () => ({
      total: allContracts.length,
      executing: allContracts.filter((c) => c.status === 'executing').length,
      expiring: allContracts.filter((c) => c.daysRemaining < 30 && c.status === 'executing').length,
      revenue: allContracts.reduce((sum, c) => sum + c.totalCollected, 0),
    }),
    [allContracts]
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(isRtl ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR',
    }).format(amount);
  };

  const getStatusConfig = (status: string) => {
    const config: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
      draft: { color: 'default', label: t.draft, icon: <FileTextOutlined /> },
      signed: { color: 'processing', label: t.signed, icon: <CheckCircleOutlined /> },
      executing: { color: 'success', label: t.executing, icon: <PlayCircleOutlined /> },
      finished: { color: 'error', label: t.finished, icon: <StopOutlined /> },
    };
    return config[status] || { color: 'default', label: status, icon: <ClockCircleOutlined /> };
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleViewDetails = (contract: RentContract) => {
    setSelectedContract(contract);
    setShowDetailsModal(true);
  };

  const handleAddContract = () => {
    setCreateSelectedOffer(null);
    createForm.resetFields();
    setShowCreateModal(true);
  };

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

  const handleCreateContractSubmit = async () => {
    try {
      const values = await createForm.validateFields();
      createContract({
        customerId: values.customerId,
        offerId: values.offerId,
        nationalityId: values.nationalityId,
        jobId: values.jobId,
        duration: values.duration,
        cost: values.cost,
        insurance: values.insurance,
        offerPrice: values.offerPrice,
        contractStartDate: values.contractStartDate?.toISOString(),
        contractEndDate: values.contractEndDate?.toISOString(),
        customerAddress: values.customerAddress,
        workerNameAr: values.workerNameAr,
        workerNameEn: values.workerNameEn,
        workerPhone: values.workerPhone,
        workersCount: values.workersCount,
        paymentMethod: values.paymentMethod,
      });
      setShowCreateModal(false);
      createForm.resetFields();
      setCreateSelectedOffer(null);
    } catch {
      // validation errors handled by form
    }
  };

  /** Open edit modal and pre-fill form from raw API contract */
  const handleEditContract = (contract: RentContract) => {
    const raw = contractsMap.get(contract.id);
    setEditModal({ open: true, rawContract: raw || null });
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
      workerNameAr: raw?.workerNameAr,
      workerNameEn: raw?.workerNameEn,
      workerPhone: raw?.workerPhone,
      workersCount: raw?.workersCount,
      customerAddress: raw?.customerAddress,
      paymentMethod: raw?.paymentMethod,
    });
  };

  const handleEditContractSubmit = async () => {
    if (!editModal.rawContract) return;
    try {
      const values = await editForm.validateFields();
      updateContract({
        id: editModal.rawContract.id,
        data: {
          customerId: values.customerId,
          nationalityId: values.nationalityId,
          jobId: values.jobId,
          duration: values.duration,
          cost: values.cost,
          insurance: values.insurance,
          offerPrice: values.offerPrice,
          contractStartDate: values.contractStartDate?.toISOString(),
          contractEndDate: values.contractEndDate?.toISOString(),
          customerAddress: values.customerAddress,
          workerNameAr: values.workerNameAr,
          workerNameEn: values.workerNameEn,
          workerPhone: values.workerPhone,
          workersCount: values.workersCount,
          paymentMethod: values.paymentMethod,
        },
      });
      setEditModal({ open: false, rawContract: null });
      editForm.resetFields();
    } catch {
      // validation errors handled by form
    }
  };

  /** DELETE contract (Draft only) */
  const handleDeleteContract = (contract: RentContract) => {
    deleteContract(contract.id);
  };

  /** POST /sign — Draft → Signed */
  const handleSignContract = (contract: RentContract) => {
    signContract(contract.id);
  };

  /** POST /start-execution — Signed → Executing */
  const handleStartExecution = (contract: RentContract) => {
    startExecution(contract.id);
  };

  /** Open renew modal (Executing only) */
  const handleOpenRenew = (contract: RentContract) => {
    renewForm.resetFields();
    setRenewModal({ open: true, contractId: contract.id });
  };

  /** Submit renew — POST /renew with new end date */
  const handleRenewSubmit = async () => {
    try {
      const values = await renewForm.validateFields();
      if (!renewModal.contractId) return;
      renewContract({
        id: renewModal.contractId,
        newEndDate: values.newEndDate.toISOString(),
      });
      setRenewModal({ open: false, contractId: null });
      renewForm.resetFields();
    } catch {
      // validation errors handled by form
    }
  };

  /** Open terminate modal (Executing only) */
  const handleOpenTerminate = (contract: RentContract) => {
    terminateForm.resetFields();
    setTerminateModal({ open: true, contractId: contract.id });
  };

  /** Submit terminate — POST /terminate with note */
  const handleTerminateSubmit = async () => {
    try {
      const values = await terminateForm.validateFields();
      if (!terminateModal.contractId) return;
      terminateContract({
        id: terminateModal.contractId,
        note: values.note || '',
      });
      setTerminateModal({ open: false, contractId: null });
      terminateForm.resetFields();
    } catch {
      // validation errors handled by form
    }
  };

  /** GET /print-receipt-form — fetch and print */
  const handlePrintContract = async (contract: RentContract) => {
    await printReceiptForm(contract.id);
    window.print();
  };

  // ─── Menu items (status-conditional) ───────────────────────────────────────

  const getMenuItems = (contract: RentContract): MenuProps['items'] => {
    const items: MenuProps['items'] = [
      {
        key: 'view',
        label: t.viewDetails,
        icon: <EyeOutlined />,
        onClick: () => handleViewDetails(contract),
      },
    ];

    // Edit — available in Draft and Signed states
    if (contract.contractStatus === 1 || contract.contractStatus === 2) {
      items.push({
        key: 'edit',
        label: t.edit,
        icon: <EditOutlined />,
        onClick: () => handleEditContract(contract),
      });
    }

    // Print receipt — always available
    items.push({
      key: 'print',
      label: t.printReceipt,
      icon: <PrinterOutlined />,
      onClick: () => handlePrintContract(contract),
    });

    // Delete — Draft only (with confirmation handled inline)
    if (contract.contractStatus === 1) {
      items.push({ type: 'divider' });
      items.push({
        key: 'delete',
        label: (
          <Popconfirm
            title={t.confirmDelete}
            okText={t.yes}
            cancelText={t.no}
            onConfirm={() => handleDeleteContract(contract)}
          >
            <span style={{ color: '#ff4d4f' }}>
              <DeleteOutlined style={{ marginInlineEnd: 8 }} />
              {t.delete}
            </span>
          </Popconfirm>
        ),
      });
    }

    return items;
  };

  // ─── Card bottom buttons — status-conditional ───────────────────────────────

  const renderCardActions = (contract: RentContract) => {
    const { contractStatus } = contract;

    if (contractStatus === 1) {
      // Draft: Sign, Edit, Delete
      return (
        <Space wrap>
          <Popconfirm
            title={isRtl ? 'هل تريد توقيع هذا العقد؟' : 'Sign this contract?'}
            okText={t.yes}
            cancelText={t.no}
            onConfirm={() => handleSignContract(contract)}
          >
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={isSigning}
              size="small"
            >
              {t.signContract}
            </Button>
          </Popconfirm>

          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditContract(contract)}
          >
            {t.edit}
          </Button>

          <Popconfirm
            title={t.confirmDelete}
            okText={t.yes}
            cancelText={t.no}
            onConfirm={() => handleDeleteContract(contract)}
          >
            <Button danger icon={<DeleteOutlined />} size="small" loading={isDeleting}>
              {t.delete}
            </Button>
          </Popconfirm>
        </Space>
      );
    }

    if (contractStatus === 2) {
      // Signed: Start Execution, Print Receipt, Edit
      return (
        <Space wrap>
          <Popconfirm
            title={isRtl ? 'هل تريد بدء تنفيذ العقد؟' : 'Start contract execution?'}
            okText={t.yes}
            cancelText={t.no}
            onConfirm={() => handleStartExecution(contract)}
          >
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              loading={isStartingExecution}
              size="small"
            >
              {t.startExecution}
            </Button>
          </Popconfirm>

          <Button
            icon={<PrinterOutlined />}
            size="small"
            onClick={() => handlePrintContract(contract)}
          >
            {t.printReceipt}
          </Button>

          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditContract(contract)}
          >
            {t.edit}
          </Button>
        </Space>
      );
    }

    if (contractStatus === 3) {
      // Executing: Renew, Terminate, Print Receipt
      return (
        <Space wrap>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            size="small"
            onClick={() => handleOpenRenew(contract)}
            loading={isRenewing}
          >
            {t.renewContract}
          </Button>

          <Button
            danger
            icon={<StopOutlined />}
            size="small"
            onClick={() => handleOpenTerminate(contract)}
            loading={isTerminating}
          >
            {t.terminateContract}
          </Button>

          <Button
            icon={<PrinterOutlined />}
            size="small"
            onClick={() => handlePrintContract(contract)}
          >
            {t.printReceipt}
          </Button>
        </Space>
      );
    }

    if (contractStatus === 4) {
      // Finished: Print Receipt only
      return (
        <Space>
          <Button
            icon={<PrinterOutlined />}
            size="small"
            onClick={() => handlePrintContract(contract)}
          >
            {t.printReceipt}
          </Button>
        </Space>
      );
    }

    return null;
  };

  const renderContractCard = (contract: RentContract) => {
    const statusConfig = getStatusConfig(contract.status);
    const totalAmount = contract.totalCollected + contract.remainingAmount;
    const collectionProgress = totalAmount > 0 ? (contract.totalCollected / totalAmount) * 100 : 0;

    return (
      <Col xs={24} key={contract.id}>
        <Card className={styles.contractCard} hoverable>
          <div className={styles.cardContent}>
            {/* Left Section */}
            <div className={styles.cardLeft}>
              {/* Card Header */}
              <div className={styles.cardHeader}>
                <div className={styles.contractNumber}>
                  <FileTextOutlined className={styles.contractIcon} />
                  <span>#{contract.contractNumber}</span>
                </div>
                <Dropdown menu={{ items: getMenuItems(contract) }} trigger={['click']}>
                  <Button type="text" icon={<MoreOutlined />} className={styles.moreBtn} />
                </Dropdown>
              </div>

              {/* Status */}
              <div className={styles.tagsSection}>
                <Badge status={statusConfig.color as any} text={statusConfig.label} />
                {contract.contractStatus === 3 && contract.daysRemaining < 30 && (
                  <Tag color="warning" icon={<ClockCircleOutlined />}>
                    {contract.daysRemaining} {t.daysLeft}
                  </Tag>
                )}
              </div>

              {/* Customer Info */}
              <div className={styles.customerSection}>
                <Avatar size={44} icon={<UserOutlined />} className={styles.customerAvatar} />
                <div className={styles.customerDetails}>
                  <span className={styles.customerName}>
                    {isRtl ? contract.customerNameAr : contract.customerName}
                  </span>
                  <div className={styles.customerMeta}>
                    <PhoneOutlined />
                    <span dir="ltr">{contract.customerPhone}</span>
                  </div>
                </div>
              </div>

              {/* Worker Info */}
              <div className={styles.workerSection}>
                <div className={styles.workerItem}>
                  <HomeOutlined className={styles.workerIcon} />
                  <div className={styles.workerText}>
                    <span className={styles.workerLabel}>{t.worker}</span>
                    <span className={styles.workerValue}>
                      {isRtl ? contract.workerNameAr : contract.workerName}
                    </span>
                  </div>
                </div>
                <div className={styles.workerItem}>
                  <EnvironmentOutlined className={styles.workerIcon} />
                  <div className={styles.workerText}>
                    <span className={styles.workerLabel}>{t.nationality}</span>
                    <span className={styles.workerValue}>
                      {isRtl ? contract.nationalityAr : contract.nationality}
                    </span>
                  </div>
                </div>
                <div className={styles.workerItem}>
                  <TeamOutlined className={styles.workerIcon} />
                  <div className={styles.workerText}>
                    <span className={styles.workerLabel}>{t.profession}</span>
                    <span className={styles.workerValue}>
                      {isRtl ? contract.professionAr : contract.profession}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className={styles.cardRight}>
              {/* Cost */}
              <div className={styles.rentSection}>
                <div className={styles.rentHeader}>
                  <span className={styles.rentLabel}>{t.monthlyRent}</span>
                  <span className={styles.rentAmount}>{formatCurrency(contract.monthlyRent)}</span>
                </div>
                <Progress
                  percent={collectionProgress}
                  showInfo={false}
                  strokeColor={{ '0%': '#003366', '100%': '#0056b3' }}
                />
                <div className={styles.rentAmounts}>
                  <div className={styles.amountItem}>
                    <span className={styles.amountLabel}>{t.collected}</span>
                    <span className={styles.amountValue} style={{ color: '#52c41a' }}>
                      {formatCurrency(contract.totalCollected)}
                    </span>
                  </div>
                  <div className={styles.amountItem}>
                    <span className={styles.amountLabel}>{t.remaining}</span>
                    <span className={styles.amountValue} style={{ color: '#faad14' }}>
                      {formatCurrency(contract.remainingAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className={styles.datesSection}>
                <div className={styles.dateItem}>
                  <CalendarOutlined />
                  <span>{formatDate(contract.startDate)}</span>
                </div>
                <span className={styles.dateSeparator}>→</span>
                <div className={styles.dateItem}>
                  <CalendarOutlined />
                  <span>{formatDate(contract.endDate)}</span>
                </div>
              </div>

              {/* View Details Button */}
              <Button
                type="primary"
                block
                icon={<EyeOutlined />}
                className={styles.viewBtn}
                onClick={() => handleViewDetails(contract)}
              >
                {t.viewDetails}
              </Button>
            </div>
          </div>

          {/* Bottom Section - Status-conditional action buttons */}
          <div className={styles.cardBottom}>
            <div className={styles.actionsList}>{renderCardActions(contract)}</div>
          </div>
        </Card>
      </Col>
    );
  };

  if (!mounted) return null;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip={isRtl ? 'جاري التحميل...' : 'Loading...'} />
      </div>
    );
  }

  // ─── Shared form fields (used in both Create and Edit modals) ──────────────

  const renderContractFormFields = () => (
    <>
      <Form.Item name="offerId" hidden>
        <Input />
      </Form.Item>

      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12}>
          <Form.Item
            name="customerId"
            label={isRtl ? 'العميل' : 'Customer'}
            rules={[{ required: true, message: isRtl ? 'مطلوب' : 'Required' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder={isRtl ? 'اختر العميل' : 'Select Customer'}
              options={(customers as any[]).map((c: any) => ({
                value: c.id,
                label: isRtl
                  ? c.arabicName || c.englishName || `#${c.id}`
                  : c.englishName || c.arabicName || `#${c.id}`,
              }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="nationalityId" label={isRtl ? 'الجنسية' : 'Nationality'}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder={isRtl ? 'اختر الجنسية' : 'Select Nationality'}
              options={nationalities.map((n) => ({
                value: String(n.id),
                label: isRtl ? n.nationalityNameAr : n.nationalityNameEn,
              }))}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12}>
          <Form.Item name="jobId" label={isRtl ? 'الوظيفة' : 'Job'}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder={isRtl ? 'اختر الوظيفة' : 'Select Job'}
              options={(jobs as any[]).map((j: any) => ({
                value: j.id,
                label: isRtl ? j.jobNameAr || j.name : j.jobNameEn || j.name,
              }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="duration" label={isRtl ? 'المدة (أشهر)' : 'Duration (months)'}>
            <InputNumber style={{ width: '100%' }} min={1} max={24} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 0]}>
        <Col xs={24} sm={8}>
          <Form.Item name="cost" label={isRtl ? 'التكلفة' : 'Cost'}>
            <InputNumber style={{ width: '100%' }} min={0} addonAfter={isRtl ? 'ريال' : 'SAR'} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="insurance" label={isRtl ? 'التأمين' : 'Insurance'}>
            <InputNumber style={{ width: '100%' }} min={0} addonAfter={isRtl ? 'ريال' : 'SAR'} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="offerPrice" label={isRtl ? 'الإجمالي مع الضريبة' : 'Total with Tax'}>
            <InputNumber style={{ width: '100%' }} min={0} addonAfter={isRtl ? 'ريال' : 'SAR'} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12}>
          <Form.Item name="contractStartDate" label={isRtl ? 'تاريخ البداية' : 'Start Date'}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="contractEndDate" label={isRtl ? 'تاريخ النهاية' : 'End Date'}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12}>
          <Form.Item
            name="workerNameAr"
            label={isRtl ? 'اسم العامل (عربي)' : 'Worker Name (Arabic)'}
          >
            <Input placeholder={isRtl ? 'اسم العامل بالعربي' : 'Worker name in Arabic'} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="workerNameEn"
            label={isRtl ? 'اسم العامل (إنجليزي)' : 'Worker Name (English)'}
          >
            <Input placeholder={isRtl ? 'اسم العامل بالإنجليزي' : 'Worker name in English'} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12}>
          <Form.Item name="workerPhone" label={isRtl ? 'هاتف العامل' : 'Worker Phone'}>
            <Input placeholder="05xxxxxxxx" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="customerAddress" label={isRtl ? 'عنوان العميل' : 'Customer Address'}>
            <Input placeholder={isRtl ? 'العنوان' : 'Address'} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12}>
          <Form.Item name="workersCount" label={isRtl ? 'عدد العمال' : 'Workers Count'}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="paymentMethod" label={isRtl ? 'طريقة الدفع' : 'Payment Method'}>
            <Select
              placeholder={isRtl ? 'اختر طريقة الدفع' : 'Select Payment Method'}
              options={[
                { value: 1, label: isRtl ? 'نقدي' : 'Cash' },
                { value: 2, label: isRtl ? 'شبكة' : 'Card/Network' },
                { value: 3, label: isRtl ? 'تحويل بنكي' : 'Bank Transfer' },
              ]}
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  );

  return (
    <div className={styles.rentContractsPage}>
      {/* Page Header */}
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
              onClick={handleAddContract}
            >
              {t.addContract}
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className={styles.statisticsRow}>
        <Col xs={12} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={t.totalContracts}
              value={stats.total}
              prefix={<FileTextOutlined style={{ color: '#003366' }} />}
              valueStyle={{ color: '#003366' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={t.activeContracts}
              value={stats.executing}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={t.expiringContracts}
              value={stats.expiring}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={t.totalRevenue}
              value={stats.revenue}
              prefix={<DollarOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
              formatter={(value) => formatCurrency(value as number)}
            />
          </Card>
        </Col>
      </Row>

      {/* Customer Filter Indicator */}
      {customerId && (
        <Card style={{ marginBottom: 16, background: '#e6f7ff', borderColor: '#1890ff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserOutlined style={{ color: '#1890ff' }} />
            <span>
              {isRtl ? `عرض عقود العميل رقم: ${customerId}` : `Showing contracts for Customer ID: ${customerId}`}
            </span>
            <Button type="link" size="small" onClick={() => router.push('/operation/rent')}>
              {isRtl ? 'عرض جميع العقود' : 'Show All Contracts'}
            </Button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className={styles.filterCard}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Input
              placeholder={t.search}
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              size="large"
              className={styles.searchInput}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
              size="large"
              options={[
                { value: 'all', label: t.allStatuses },
                { value: 'draft', label: t.draft },
                { value: 'signed', label: t.signed },
                { value: 'executing', label: t.executing },
                { value: 'finished', label: t.finished },
              ]}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              value={nationalityFilter}
              onChange={setNationalityFilter}
              style={{ width: '100%' }}
              size="large"
              options={[
                { value: 'all', label: t.allNationalities },
                ...nationalities.map((n) => ({
                  value: String(n.id),
                  label: isRtl ? n.nationalityNameAr : n.nationalityNameEn,
                })),
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
              style={{ width: '100%' }}
              size="large"
              placeholder={[t.startDate, t.endDate]}
              format="YYYY-MM-DD"
            />
          </Col>
        </Row>
      </Card>

      {/* Results Info */}
      <div className={styles.resultsInfo}>
        <span>
          {isRtl
            ? `عرض ${filteredContracts.length} من ${allContracts.length} عقد`
            : `Showing ${filteredContracts.length} of ${allContracts.length} contracts`}
        </span>
      </div>

      {/* Contracts Grid */}
      {filteredContracts.length > 0 ? (
        <Row gutter={[16, 16]} className={styles.contractsGrid}>
          {filteredContracts.map(renderContractCard)}
        </Row>
      ) : (
        <Card className={styles.emptyCard}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t.noResults} />
        </Card>
      )}

      {/* ─── Create Contract Modal ─────────────────────────────────────────── */}
      <Modal
        title={
          <span>
            <PlusOutlined style={{ marginInlineEnd: 8 }} />
            {isRtl ? 'إضافة عقد تشغيل' : 'Add Operating Contract'}
          </span>
        }
        open={showCreateModal}
        onCancel={() => {
          setShowCreateModal(false);
          createForm.resetFields();
          setCreateSelectedOffer(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setShowCreateModal(false);
              createForm.resetFields();
              setCreateSelectedOffer(null);
            }}
          >
            {isRtl ? 'إلغاء' : 'Cancel'}
          </Button>,
          <Button key="submit" type="primary" loading={isCreating} onClick={handleCreateContractSubmit}>
            {isRtl ? 'إنشاء العقد' : 'Create Contract'}
          </Button>,
        ]}
        width={1000}
        destroyOnClose
      >
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 8 }}>{isRtl ? '1. اختر العرض' : '1. Select Offer'}</h3>
          <Alert
            type="info"
            showIcon
            message={isRtl ? 'اختر عرض من الجدول أدناه لملء بيانات العقد تلقائياً' : 'Select an offer from the table below to auto-fill contract data'}
            style={{ marginBottom: 16 }}
          />
          <RentOfferSelector
            language={language}
            selectedOfferId={createSelectedOffer?.id ?? createForm.getFieldValue('offerId') ?? null}
            onSelect={handleCreateOfferSelect}
            compact
          />
        </div>

        <div>
          <h3 style={{ marginBottom: 16 }}>{isRtl ? '2. بيانات العقد' : '2. Contract Details'}</h3>
          {createSelectedOffer && (
            <Alert
              type="success"
              showIcon
              message={isRtl ? `تم ملء البيانات تلقائياً من العرض #${createSelectedOffer.id}` : `Data auto-filled from Offer #${createSelectedOffer.id}`}
              style={{ marginBottom: 16 }}
            />
          )}
          <Form form={createForm} layout="vertical" requiredMark="optional" dir={isRtl ? 'rtl' : 'ltr'}>
            {renderContractFormFields()}
          </Form>
        </div>
      </Modal>

      {/* ─── Edit Contract Modal ───────────────────────────────────────────── */}
      <Modal
        title={
          <span>
            <EditOutlined style={{ marginInlineEnd: 8 }} />
            {isRtl ? 'تعديل العقد' : 'Edit Contract'}
          </span>
        }
        open={editModal.open}
        onCancel={() => {
          setEditModal({ open: false, rawContract: null });
          editForm.resetFields();
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setEditModal({ open: false, rawContract: null });
              editForm.resetFields();
            }}
          >
            {isRtl ? 'إلغاء' : 'Cancel'}
          </Button>,
          <Button key="submit" type="primary" loading={isUpdating} onClick={handleEditContractSubmit}>
            {isRtl ? 'حفظ التعديلات' : 'Save Changes'}
          </Button>,
        ]}
        width={900}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" requiredMark="optional" dir={isRtl ? 'rtl' : 'ltr'}>
          {renderContractFormFields()}
        </Form>
      </Modal>

      {/* ─── Renew Contract Modal ──────────────────────────────────────────── */}
      <Modal
        title={
          <span>
            <ReloadOutlined style={{ marginInlineEnd: 8 }} />
            {t.renewContract}
          </span>
        }
        open={renewModal.open}
        onCancel={() => {
          setRenewModal({ open: false, contractId: null });
          renewForm.resetFields();
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setRenewModal({ open: false, contractId: null });
              renewForm.resetFields();
            }}
          >
            {isRtl ? 'إلغاء' : 'Cancel'}
          </Button>,
          <Button key="submit" type="primary" loading={isRenewing} onClick={handleRenewSubmit}>
            {isRtl ? 'تجديد' : 'Renew'}
          </Button>,
        ]}
        width={420}
        destroyOnClose
      >
        <Form form={renewForm} layout="vertical" dir={isRtl ? 'rtl' : 'ltr'}>
          <Form.Item
            name="newEndDate"
            label={t.renewDate}
            rules={[{ required: true, message: isRtl ? 'مطلوب' : 'Required' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" disabledDate={(d) => d.isBefore(dayjs())} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ─── Terminate Contract Modal ──────────────────────────────────────── */}
      <Modal
        title={
          <span>
            <StopOutlined style={{ marginInlineEnd: 8, color: '#ff4d4f' }} />
            {t.terminateContract}
          </span>
        }
        open={terminateModal.open}
        onCancel={() => {
          setTerminateModal({ open: false, contractId: null });
          terminateForm.resetFields();
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setTerminateModal({ open: false, contractId: null });
              terminateForm.resetFields();
            }}
          >
            {isRtl ? 'إلغاء' : 'Cancel'}
          </Button>,
          <Button key="submit" danger loading={isTerminating} onClick={handleTerminateSubmit}>
            {isRtl ? 'إنهاء العقد' : 'Terminate'}
          </Button>,
        ]}
        width={420}
        destroyOnClose
      >
        <Alert
          type="warning"
          showIcon
          message={isRtl ? 'سيتم إنهاء العقد وإعادة العامل إلى السكن' : 'The contract will be terminated and the worker returned to accommodation'}
          style={{ marginBottom: 16 }}
        />
        <Form form={terminateForm} layout="vertical" dir={isRtl ? 'rtl' : 'ltr'}>
          <Form.Item
            name="note"
            label={t.terminateNote}
            rules={[{ required: true, message: isRtl ? 'مطلوب' : 'Required' }]}
          >
            <TextArea rows={4} placeholder={isRtl ? 'أدخل سبب الإنهاء...' : 'Enter termination reason...'} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ─── Details Modal ─────────────────────────────────────────────────── */}
      <Modal
        title={`${t.contractNumber}: #${selectedContract?.contractNumber}`}
        open={showDetailsModal}
        onCancel={() => {
          setShowDetailsModal(false);
          setSelectedContract(null);
        }}
        footer={
          <Button type="primary" onClick={() => setShowDetailsModal(false)}>
            {isRtl ? 'إغلاق' : 'Close'}
          </Button>
        }
        width={650}
      >
        {selectedContract && (
          <div className={styles.detailsModal}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <div className={styles.modalSection}>
                  <h4>{t.customer}</h4>
                  <p className={styles.modalValue}>
                    {isRtl ? selectedContract.customerNameAr : selectedContract.customerName}
                  </p>
                </div>
              </Col>
              <Col span={24}>
                <div className={styles.modalSection}>
                  <h4>{t.worker}</h4>
                  <p className={styles.modalValue}>
                    {isRtl ? selectedContract.workerNameAr : selectedContract.workerName}
                  </p>
                </div>
              </Col>
              <Col span={12}>
                <div className={styles.modalSection}>
                  <h4>{t.status}</h4>
                  <Badge
                    status={getStatusConfig(selectedContract.status).color as any}
                    text={getStatusConfig(selectedContract.status).label}
                  />
                </div>
              </Col>
              <Col span={12}>
                <div className={styles.modalSection}>
                  <h4>{t.nationality}</h4>
                  <p className={styles.modalValue}>
                    {isRtl ? selectedContract.nationalityAr : selectedContract.nationality}
                  </p>
                </div>
              </Col>
              <Col span={12}>
                <div className={styles.modalSection}>
                  <h4>{t.startDate}</h4>
                  <p className={styles.modalValue}>{formatDate(selectedContract.startDate)}</p>
                </div>
              </Col>
              <Col span={12}>
                <div className={styles.modalSection}>
                  <h4>{t.endDate}</h4>
                  <p className={styles.modalValue}>{formatDate(selectedContract.endDate)}</p>
                </div>
              </Col>
              <Col span={8}>
                <div className={styles.modalSection}>
                  <h4>{t.monthlyRent}</h4>
                  <p className={styles.modalValue}>{formatCurrency(selectedContract.monthlyRent)}</p>
                </div>
              </Col>
              <Col span={8}>
                <div className={styles.modalSection}>
                  <h4>{t.collected}</h4>
                  <p className={styles.modalValue} style={{ color: '#52c41a' }}>
                    {formatCurrency(selectedContract.totalCollected)}
                  </p>
                </div>
              </Col>
              <Col span={8}>
                <div className={styles.modalSection}>
                  <h4>{t.remaining}</h4>
                  <p className={styles.modalValue} style={{ color: '#faad14' }}>
                    {formatCurrency(selectedContract.remainingAmount)}
                  </p>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
}
