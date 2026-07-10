'use client';

import React, { useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  Badge,
  Spin,
  Form,
  DatePicker,
  InputNumber,
  Divider,
  Tabs,
  Table,
  Timeline,
  Descriptions,
  Alert,
  Image,
  Pagination,
  Dropdown,
  Checkbox,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  FileTextOutlined,
  SearchOutlined,
  PlusOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  FileProtectOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  SendOutlined,
  CarOutlined,
  RollbackOutlined,
  PaperClipOutlined,
  FilePdfOutlined,
  DownloadOutlined,
  WarningOutlined,
  MoreOutlined,
  UserDeleteOutlined,
  UserAddOutlined,
} from '@ant-design/icons';

import { useAuthStore } from '@/store/authStore';
import { BranchFilterSelect, DateRangeFilter, ExportButton } from '@/components/filters';
import { API_ENDPOINTS } from '@/config/api.config';
import { resolveImageUrl } from '@/utils/image';
import { useCustomers } from '@/hooks/api/useCustomers';
import { useAvailableMediationWorkers } from '@/hooks/api/useWorkers';
import {
  useMediationContracts,
  useMediationContract,
} from '@/hooks/api/useMediationContracts';
import { useCreateComplaint } from '@/hooks/api/useComplaints';
import type {
  MediationContract,
  ContractCancelDto,
  SignMediationContractDto,
  DeliveryFormDto,
  DeliveryFormSignDto,
  WarrantyReturnDto,
  UpdateContractStatusDto,
  CreateComplaintDto,
  Worker,
} from '@/types/api.types';
import {
  MEDIATION_CONTRACT_STATUS,
  MEDIATION_CONTRACT_TYPE,
  ARRIVAL_DESTINATIONS,
  CANCEL_BY,
  COMPLAINT_SOURCE,
  COMPLAINT_PRIORITY,
  getEnumLabel,
  toSelectOptions,
} from '@/constants/enums';
import styles from './MediationContracts.module.css';

export default function MediationContractsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledCustomerId = searchParams.get('customerId');

  const language = useAuthStore((state) => state.language);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [branchId, setBranchId] = useState<string | undefined>(undefined);
  const [includeSubBranches, setIncludeSubBranches] = useState(true);
  const [dateRange, setDateRange] = useState<[string | undefined, string | undefined]>([
    undefined,
    undefined,
  ]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<MediationContract | null>(null);

  // Customer selection modal (for add contract when no customer prefilled)
  const [showCustomerSelectModal, setShowCustomerSelectModal] = useState(false);
  const [customerSelectId, setCustomerSelectId] = useState<number | null>(null);

  const [showComplaintModal, setShowComplaintModal] = useState(false);

  // Lifecycle modals
  const [showSignModal, setShowSignModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showDeliverySignModal, setShowDeliverySignModal] = useState(false);
  const [showWarrantyReturnModal, setShowWarrantyReturnModal] = useState(false);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [showEndServiceModal, setShowEndServiceModal] = useState(false);
  const [showAssignWorkerModal, setShowAssignWorkerModal] = useState(false);

  // Advanced filters (ErpImprovementsJul2026)
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [withoutWorker, setWithoutWorker] = useState(false);

  // Assign-worker passport search (available workers only)
  const [assignPassportSearch, setAssignPassportSearch] = useState('');
  const [assignPassportDebounced, setAssignPassportDebounced] = useState('');
  React.useEffect(() => {
    const id = setTimeout(() => setAssignPassportDebounced(assignPassportSearch.trim()), 400);
    return () => clearTimeout(id);
  }, [assignPassportSearch]);
  const { data: assignWorkers = [], isLoading: isLoadingAssignWorkers } =
    useAvailableMediationWorkers(assignPassportDebounced, showAssignWorkerModal);

  // Forms
  const [cancelForm] = Form.useForm();
  const [signForm] = Form.useForm();
  const [deliveryForm] = Form.useForm();
  const [deliverySignForm] = Form.useForm();
  const [warrantyReturnForm] = Form.useForm();
  const [updateStatusForm] = Form.useForm();
  const [complaintForm] = Form.useForm();
  const [endServiceForm] = Form.useForm();
  const [assignWorkerForm] = Form.useForm();

  // API hooks
  const {
    contracts,
    total: serverTotal,
    isLoading,
    refetch,
    cancelContract,
    signContract,
    generateDeliveryForm,
    signDelivery,
    warrantyReturn,
    updateContractStatus,
    endWorkerService,
    assignWorker,
    isCancelling,
    isSigning,
    isGeneratingDelivery,
    isSigningDelivery,
    isReturning,
    isUpdatingStatus,
    isEndingWorkerService,
    isAssigningWorker,
  } = useMediationContracts({
    pageNumber: currentPage,
    pageSize,
    statusId: statusFilter === 'all' ? undefined : Number(statusFilter),
    contractType: typeFilter === 'all' ? undefined : Number(typeFilter),
    search: searchText || undefined,
    branchId,
    includeSubBranches: branchId ? includeSubBranches : undefined,
    createdDateFrom: dateRange[0],
    createdDateTo: dateRange[1],
    withoutAssignedWorker: withoutWorker || undefined,
    isPaid: paymentFilter === 'paid' ? true : undefined,
    isUnpaid: paymentFilter === 'unpaid' ? true : undefined,
  });

  const { mutateAsync: createComplaint, isPending: isCreatingComplaint } = useCreateComplaint();

  const { data: contractDetail, isLoading: isLoadingDetail } = useMediationContract(
    showDetailsModal ? selectedContract?.id : undefined
  );

  const { customers: allCustomers, isLoading: isLoadingCustomers } = useCustomers();

  // Translations
  const t = {
    pageTitle: language === 'ar' ? 'عقود الاستقدام ' : 'Mediation Contracts',
    pageSubtitle:
      language === 'ar' ? 'إدارة جميع عقود الاستقدام ' : 'Manage all mediation contracts',
    addContract: language === 'ar' ? 'إضافة عقد' : 'Add Contract',
    exportExcel: language === 'ar' ? 'تصدير إكسل' : 'Export Excel',
    print: language === 'ar' ? 'طباعة' : 'Print',
    refresh: language === 'ar' ? 'تحديث' : 'Refresh',
    search:
      language === 'ar'
        ? 'بحث برقم العقد أو اسم العميل...'
        : 'Search by contract number or customer name...',
    allTypes: language === 'ar' ? 'جميع الأنواع' : 'All Types',
    allStatuses: language === 'ar' ? 'جميع الحالات' : 'All Statuses',
    totalContracts: language === 'ar' ? 'إجمالي العقود' : 'Total Contracts',
    activeContracts: language === 'ar' ? 'عقود نشطة' : 'Active Contracts',
    pendingContracts: language === 'ar' ? 'عقود معلقة' : 'Pending Contracts',
    totalRevenue: language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue',
    contractNumber: language === 'ar' ? 'رقم العقد' : 'Contract #',
    customer: language === 'ar' ? 'العميل' : 'Customer',
    type: language === 'ar' ? 'النوع' : 'Type',
    status: language === 'ar' ? 'الحالة' : 'Status',
    totalCost: language === 'ar' ? 'التكلفة الإجمالية' : 'Total Cost',
    localCost: language === 'ar' ? 'التكلفة المحلية' : 'Local Cost',
    agentCost: language === 'ar' ? 'تكلفة الوكيل' : 'Agent Cost',
    salary: language === 'ar' ? 'الراتب' : 'Salary',
    musanedNumber: language === 'ar' ? 'رقم مساند' : 'Musaned #',
    visaNumber: language === 'ar' ? 'رقم التأشيرة' : 'Visa Number',
    arrivalCity: language === 'ar' ? 'مدينة الوصول' : 'Arrival City',
    noResults: language === 'ar' ? 'لا توجد نتائج' : 'No results found',
    save: language === 'ar' ? 'حفظ' : 'Save',
    cancel: language === 'ar' ? 'إلغاء' : 'Cancel',
    close: language === 'ar' ? 'إغلاق' : 'Close',
    submit: language === 'ar' ? 'إرسال' : 'Submit',
    contractDetails: language === 'ar' ? 'تفاصيل العقد' : 'Contract Details',
    financialInfo: language === 'ar' ? 'المعلومات المالية' : 'Financial Information',
    cancelBy: language === 'ar' ? 'إلغاء بواسطة' : 'Cancel By',
    cancelNote: language === 'ar' ? 'سبب الإلغاء' : 'Cancel Reason',
    cancelContract: language === 'ar' ? 'إلغاء العقد' : 'Cancel Contract',
    otherCosts: language === 'ar' ? 'تكاليف أخرى' : 'Other Costs',
    taxValue: language === 'ar' ? 'قيمة الضريبة' : 'Tax Value',
    managerDiscount: language === 'ar' ? 'خصم المدير' : 'Manager Discount',
    costDiscount: language === 'ar' ? 'خصم التكلفة' : 'Cost Discount',
    insuranceCost: language === 'ar' ? 'تكلفة التأمين' : 'Insurance Cost',
    // Lifecycle
    signContract: language === 'ar' ? 'توقيع العقد (Draft → موقّع)' : 'Sign Contract (Draft → Signed)',
    generateDelivery: language === 'ar' ? 'نموذج الاستلام والتسليم' : 'Generate Delivery Form',
    confirmDelivery: language === 'ar' ? 'تأكيد استلام العميل (→ مُسلَّم)' : 'Confirm Customer Receipt (→ Delivered)',
    warrantyReturn: language === 'ar' ? 'إرجاع ضمن فترة الضمان' : 'Warranty Return',
    updateStatus: language === 'ar' ? 'تحديث الحالة يدوياً' : 'Update Status Manually',
    statusHistory: language === 'ar' ? 'سجل الحالات' : 'Status History',
    offerAmount: language === 'ar' ? 'قيمة العرض' : 'Offer Amount',
    invoicePaymentDate: language === 'ar' ? 'تاريخ سداد الفاتورة' : 'Invoice Payment Date',
    deliveryDate: language === 'ar' ? 'تاريخ التسليم' : 'Delivery Date',
    deliveryNotes: language === 'ar' ? 'ملاحظات التسليم' : 'Delivery Notes',
    customerSignedAt: language === 'ar' ? 'تاريخ توقيع العميل' : 'Customer Signed At',
    returnDate: language === 'ar' ? 'تاريخ الإرجاع' : 'Return Date',
    returnReason: language === 'ar' ? 'سبب الإرجاع' : 'Return Reason',
    daysWithCustomer: language === 'ar' ? 'أيام العامل عند العميل' : 'Days with Customer',
    refundAmount: language === 'ar' ? 'المبلغ المسترد (تقديري)' : 'Estimated Refund Amount',
    newWorkerLocation: language === 'ar' ? 'موقع العامل الجديد' : 'New Worker Location',
    warrantyNote:
      language === 'ar'
        ? 'الضمان 90 يوماً — المبلغ المسترد = التكلفة الكلية − (التكلفة الكلية ÷ 90 × الأيام). بعد 90 يوماً المبلغ المسترد = صفر.'
        : '90-day warranty — Refund = TotalCost − (TotalCost ÷ 90 × days). After 90 days refund = 0.',
    newStatus: language === 'ar' ? 'الحالة الجديدة' : 'New Status',
    oldStatus: language === 'ar' ? 'الحالة السابقة' : 'Old Status',
    changedBy: language === 'ar' ? 'بواسطة' : 'Changed By',
    note: language === 'ar' ? 'ملاحظة' : 'Note',
    addComplaint: language === 'ar' ? 'إضافة شكوى' : 'Add Complaint',
    // Concise labels for the status-aware primary action + "More" menu
    more: language === 'ar' ? 'إجراءات' : 'Actions',
    actionSign: language === 'ar' ? 'توقيع العقد' : 'Sign Contract',
    actionDelivery: language === 'ar' ? 'إصدار نموذج الاستلام' : 'Generate Delivery Form',
    actionConfirm: language === 'ar' ? 'تأكيد الاستلام' : 'Confirm Delivery',
    actionWarranty: language === 'ar' ? 'إرجاع ضمن الضمان' : 'Warranty Return',
    complaintSource: language === 'ar' ? 'مصدر الشكوى' : 'Complaint Source',
    complaintPriority: language === 'ar' ? 'الأولوية' : 'Priority',
    complaintNotes: language === 'ar' ? 'ملاحظات الشكوى' : 'Complaint Notes',
    endWorkerService: language === 'ar' ? 'إنهاء خدمة العامل' : 'End Worker Service',
    assignWorker: language === 'ar' ? 'إسناد عامل جديد' : 'Assign New Worker',
    endServiceReason: language === 'ar' ? 'سبب الإنهاء (اختياري)' : 'End Reason (optional)',
    selectWorkerPassport:
      language === 'ar' ? 'ابحث عن عامل برقم الجواز' : 'Search worker by passport',
    paymentStatus: language === 'ar' ? 'حالة السداد' : 'Payment Status',
    paid: language === 'ar' ? 'مدفوع' : 'Paid',
    unpaid: language === 'ar' ? 'غير مدفوع' : 'Unpaid',
    withoutWorkerLabel: language === 'ar' ? 'بدون عامل مسند' : 'Without Assigned Worker',
  };

  // Helper functions
  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '0 SAR';
    return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR',
    }).format(amount);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Status codes verified live: 1=Draft, 2=Signed, 11=DeliveryFormIssued,
  // 13=Delivered, 16=Returned, 17=Cancelled.
  const getStatusConfig = (statusId: number | null | undefined) => {
    const configs: Record<number, { color: string; label: string; icon: React.ReactNode }> = {
      1: { color: 'processing', label: getEnumLabel([...MEDIATION_CONTRACT_STATUS], 1, language), icon: <ClockCircleOutlined /> },
      2: { color: 'success', label: getEnumLabel([...MEDIATION_CONTRACT_STATUS], 2, language), icon: <CheckCircleOutlined /> },
      11: { color: 'warning', label: getEnumLabel([...MEDIATION_CONTRACT_STATUS], 11, language), icon: <ClockCircleOutlined /> },
      13: { color: 'success', label: getEnumLabel([...MEDIATION_CONTRACT_STATUS], 13, language), icon: <CheckCircleOutlined /> },
      16: { color: 'warning', label: getEnumLabel([...MEDIATION_CONTRACT_STATUS], 16, language), icon: <ExclamationCircleOutlined /> },
      17: { color: 'error', label: getEnumLabel([...MEDIATION_CONTRACT_STATUS], 17, language), icon: <CloseCircleOutlined /> },
    };
    return configs[statusId ?? 0] || { color: 'default', label: language === 'ar' ? 'غير محدد' : 'Unknown', icon: <ClockCircleOutlined /> };
  };

  const getStatusConfigFromName = (statusName: string | null | undefined): { color: 'processing' | 'warning' | 'success' | 'error' | 'default'; label: string } => {
    const name = (statusName || '').toLowerCase();
    if (name === 'draft') return { color: 'processing', label: language === 'ar' ? 'مسودة' : 'Draft' };
    if (name === 'signed') return { color: 'success', label: language === 'ar' ? 'موقّع' : 'Signed' };
    if (name === 'deliveryformissued') return { color: 'warning', label: language === 'ar' ? 'صدر نموذج الاستلام' : 'Delivery Form Issued' };
    if (name === 'delivered') return { color: 'success', label: language === 'ar' ? 'مُسلَّم' : 'Delivered' };
    if (name === 'cancelled' || name === 'canceled') return { color: 'error', label: language === 'ar' ? 'ملغي' : 'Cancelled' };
    if (name === 'returned') return { color: 'warning', label: language === 'ar' ? 'مُرجَع' : 'Returned' };
    return { color: 'default', label: statusName || (language === 'ar' ? 'غير محدد' : 'Unknown') };
  };

  // The API returns only `contractTypeName` (string), never a numeric code, so
  // map by name. Known values: "New", "Transfer" (and "0" = unset).
  const getTypeTag = (typeName: string | null | undefined) => {
    const name = (typeName || '').toLowerCase();
    if (name === 'new') return { color: 'blue', label: language === 'ar' ? 'جديد' : 'New' };
    if (name === 'transfer') return { color: 'green', label: language === 'ar' ? 'نقل خدمات' : 'Transfer' };
    return { color: 'default', label: typeName && typeName !== '0' ? typeName : (language === 'ar' ? 'غير محدد' : 'Unknown') };
  };

  // Status is filtered server-side (via StatusId on the query). Search + type
  // are refined client-side on the returned page. The list response exposes
  // only `contractTypeName` (string) and `contractNumber` — there are no
  // numeric contractType/statusId fields to compare against.
  const filteredContracts = useMemo(() => {
    if (!contracts) return [];
    const typeLabelEn = (
      MEDIATION_CONTRACT_TYPE.find((t) => String(t.value) === typeFilter)?.labelEn || ''
    ).toLowerCase();
    return contracts.filter((contract) => {
      const searchLower = searchText.toLowerCase();
      const matchesSearch =
        !searchText ||
        String(contract.contractNumber ?? '').includes(searchText) ||
        (contract.musanedContractNumber || '').includes(searchText) ||
        (contract.customerName || '').toLowerCase().includes(searchLower) ||
        (contract.customerNameAr || '').includes(searchText);
      const matchesType =
        typeFilter === 'all' ||
        (contract.contractTypeName || '').toLowerCase() === typeLabelEn;
      return matchesSearch && matchesType;
    });
  }, [contracts, searchText, typeFilter]);

  // Statistics (active/pending/revenue reflect current page only due to server-side pagination)
  const stats = useMemo(() => {
    const all = contracts || [];
    const nameOf = (c: MediationContract) => (c.statusName || '').toLowerCase();
    return {
      total: serverTotal,
      active: all.filter((c) => ['signed', 'deliveryformissued', 'delivered'].includes(nameOf(c))).length,
      pending: all.filter((c) => nameOf(c) === 'draft').length,
      revenue: all.reduce((sum, c) => sum + (c.totalCost || 0), 0),
    };
  }, [contracts, serverTotal]);

  // Handle cancel contract
  const handleCancelContract = async () => {
    try {
      const values = await cancelForm.validateFields();
      const data: ContractCancelDto = {
        contractId: selectedContract!.id,
        cancelBy: values.cancelBy,
        cancelNote: values.cancelNote,
      };
      await cancelContract(data);
      setShowCancelModal(false);
      cancelForm.resetFields();
      setSelectedContract(null);
    } catch (error) {
      console.error('Cancel form validation failed:', error);
    }
  };

  // Handle sign contract (Draft → Signed)
  const handleSignContract = async () => {
    try {
      const values = await signForm.validateFields();
      const data: SignMediationContractDto = {
        contractId: selectedContract!.id,
        musanedContractNumber: values.musanedContractNumber,
        invoicePaymentDate: values.invoicePaymentDate
          ? new Date(values.invoicePaymentDate).toISOString()
          : null,
      };
      await signContract(data);
      setShowSignModal(false);
      signForm.resetFields();
      setSelectedContract(null);
    } catch (error) {
      console.error('Sign form validation failed:', error);
    }
  };

  // Handle generate delivery form
  const handleGenerateDelivery = async () => {
    try {
      const values = await deliveryForm.validateFields();
      const data: DeliveryFormDto = {
        contractId: selectedContract!.id,
        deliveryDate: values.deliveryDate ? new Date(values.deliveryDate).toISOString() : null,
        notes: values.notes || null,
      };
      await generateDeliveryForm(data);
      setShowDeliveryModal(false);
      deliveryForm.resetFields();
    } catch (error) {
      console.error('Delivery form validation failed:', error);
    }
  };

  // Handle confirm customer signed delivery (Signed → Delivered)
  const handleSignDelivery = async () => {
    try {
      const values = await deliverySignForm.validateFields();
      const data: DeliveryFormSignDto = {
        contractId: selectedContract!.id,
        customerSignedAt: values.customerSignedAt
          ? new Date(values.customerSignedAt).toISOString()
          : new Date().toISOString(),
      };
      await signDelivery(data);
      setShowDeliverySignModal(false);
      deliverySignForm.resetFields();
      setSelectedContract(null);
    } catch (error) {
      console.error('Delivery sign form validation failed:', error);
    }
  };

  // Handle warranty return (Delivered → Returned)
  const handleWarrantyReturn = async () => {
    try {
      const values = await warrantyReturnForm.validateFields();
      const data: WarrantyReturnDto = {
        contractId: selectedContract!.id,
        returnDate: values.returnDate ? new Date(values.returnDate).toISOString() : new Date().toISOString(),
        returnReason: Number(values.returnReason),
        daysWithCustomer: Number(values.daysWithCustomer),
        newWorkerLocation: values.newWorkerLocation || null,
        notes: values.notes || null,
      };
      await warrantyReturn(data);
      setShowWarrantyReturnModal(false);
      warrantyReturnForm.resetFields();
      setSelectedContract(null);
    } catch (error) {
      console.error('Warranty return form validation failed:', error);
    }
  };

  // Handle manual status update
  const handleUpdateStatus = async () => {
    try {
      const values = await updateStatusForm.validateFields();
      const data: UpdateContractStatusDto = {
        contractId: String(selectedContract!.id),
        newStatus: Number(values.newStatus),
        notes: values.notes || null,
      };
      await updateContractStatus(data);
      setShowUpdateStatusModal(false);
      updateStatusForm.resetFields();
      setSelectedContract(null);
    } catch (error) {
      console.error('Update status form validation failed:', error);
    }
  };

  // Handle add complaint linked to this contract
  const handleAddComplaint = async () => {
    try {
      const values = await complaintForm.validateFields();
      const data: CreateComplaintDto = {
        source: values.source ?? null,
        priority: values.priority ?? null,
        customerId: selectedContract?.customerId ?? null,
        relatedContractType: 1, // mediation contract
        relatedContractId: selectedContract?.id ?? null,
        notesAr: values.notesAr ?? null,
        notesEn: values.notesEn ?? null,
      };
      await createComplaint(data);
      setShowComplaintModal(false);
      complaintForm.resetFields();
      setSelectedContract(null);
    } catch {
      // validation errors shown inline
    }
  };

  // Handle end worker service
  const handleEndWorkerService = async () => {
    if (!selectedContract?.id) return;
    try {
      const values = await endServiceForm.validateFields();
      await endWorkerService({ contractId: selectedContract.id, reason: values.reason || null });
      setShowEndServiceModal(false);
      endServiceForm.resetFields();
      setSelectedContract(null);
    } catch {
      // validation + API errors surfaced by the mutation
    }
  };

  // Handle assign a new worker (by picking an available worker via passport)
  const handleAssignWorker = async () => {
    if (!selectedContract?.id) return;
    try {
      const values = await assignWorkerForm.validateFields();
      const worker = (assignWorkers as Worker[]).find(
        (w) => String(w.id) === String(values.workerId)
      );
      await assignWorker({
        contractId: selectedContract.id,
        workerId: String(values.workerId),
        workerPassportNumber: worker?.passportNo ?? values.workerPassportNumber ?? '',
      });
      setShowAssignWorkerModal(false);
      assignWorkerForm.resetFields();
      setAssignPassportSearch('');
      setSelectedContract(null);
    } catch {
      // validation + API errors surfaced by the mutation
    }
  };

  // Render a contract card
  const renderContractCard = (contract: MediationContract) => {
    const statusConfig = contract.statusName
      ? getStatusConfigFromName(contract.statusName)
      : getStatusConfig(contract.statusId);
    const typeTag = getTypeTag(contract.contractTypeName ?? null);
    const customerDisplay =
      language === 'ar'
        ? contract.customerNameAr || contract.customerName || `${t.customer} #${contract.customerId}`
        : contract.customerName || contract.customerNameAr || `${t.customer} #${contract.customerId}`;

    // ── Status-aware actions ──────────────────────────────────────────────
    // Only the lifecycle action valid for the current status is offered as the
    // primary button; the rest live in a "More" menu. Verified status flow:
    // Draft → Signed → DeliveryFormIssued → Delivered → Returned; Cancelled.
    const statusKey = (contract.statusName || '').toLowerCase();
    const isTerminal = ['cancelled', 'canceled', 'returned'].includes(statusKey);
    const selectAnd = (fn: () => void) => () => {
      setSelectedContract(contract);
      fn();
    };

    let primaryAction:
      | { label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean }
      | null = null;
    if (statusKey === 'draft') {
      primaryAction = {
        label: t.actionSign,
        icon: <EditOutlined />,
        onClick: selectAnd(() => {
          signForm.resetFields();
          signForm.setFieldValue('musanedContractNumber', contract.musanedContractNumber);
          setShowSignModal(true);
        }),
      };
    } else if (statusKey === 'signed') {
      primaryAction = {
        label: t.actionDelivery,
        icon: <SendOutlined />,
        onClick: selectAnd(() => {
          deliveryForm.resetFields();
          setShowDeliveryModal(true);
        }),
      };
    } else if (statusKey === 'deliveryformissued') {
      primaryAction = {
        label: t.actionConfirm,
        icon: <CarOutlined />,
        onClick: selectAnd(() => {
          deliverySignForm.resetFields();
          setShowDeliverySignModal(true);
        }),
      };
    } else if (statusKey === 'delivered') {
      primaryAction = {
        label: t.actionWarranty,
        icon: <RollbackOutlined />,
        danger: true,
        onClick: selectAnd(() => {
          warrantyReturnForm.resetFields();
          setShowWarrantyReturnModal(true);
        }),
      };
    }

    const moreItems: MenuProps['items'] = [
      {
        key: 'status',
        icon: <FileProtectOutlined />,
        label: t.updateStatus,
        onClick: selectAnd(() => {
          updateStatusForm.resetFields();
          setShowUpdateStatusModal(true);
        }),
      },
      {
        key: 'complaint',
        icon: <WarningOutlined />,
        label: t.addComplaint,
        onClick: selectAnd(() => {
          complaintForm.resetFields();
          setShowComplaintModal(true);
        }),
      },
      ...(!isTerminal
        ? [
            { type: 'divider' as const },
            {
              key: 'end-worker-service',
              icon: <UserDeleteOutlined />,
              label: t.endWorkerService,
              onClick: selectAnd(() => {
                endServiceForm.resetFields();
                setShowEndServiceModal(true);
              }),
            },
            {
              key: 'assign-worker',
              icon: <UserAddOutlined />,
              label: t.assignWorker,
              onClick: selectAnd(() => {
                assignWorkerForm.resetFields();
                setAssignPassportSearch('');
                setShowAssignWorkerModal(true);
              }),
            },
          ]
        : []),
      ...(!isTerminal
        ? [
            { type: 'divider' as const },
            {
              key: 'cancel',
              icon: <CloseCircleOutlined />,
              danger: true,
              label: t.cancelContract,
              onClick: selectAnd(() => {
                cancelForm.resetFields();
                setShowCancelModal(true);
              }),
            },
          ]
        : []),
    ];

    return (
      <Col xs={24} key={contract.id}>
        <Card className={styles.contractCard} hoverable>
          <div className={styles.cardContent}>
            {/* Left Section */}
            <div className={styles.cardLeft}>
              <div className={styles.cardHeader}>
                <div className={styles.contractNumber}>
                  <FileTextOutlined className={styles.contractIcon} />
                  <span>#{contract.contractNumber ?? contract.id}</span>
                  {contract.musanedContractNumber && (
                    <Tag color="geekblue" style={{ marginInlineStart: 8 }}>
                      {t.musanedNumber}: {contract.musanedContractNumber}
                    </Tag>
                  )}
                </div>
              </div>

              <div className={styles.tagsSection}>
                <Tag color={typeTag.color} className={styles.typeTag}>
                  {typeTag.label}
                </Tag>
                <Badge
                  status={statusConfig.color as 'processing' | 'warning' | 'success' | 'error' | 'default'}
                  text={statusConfig.label}
                />
                {(contract.branchNameAr || contract.branchNameEn || contract.branchName) && (
                  <Tag icon={<EnvironmentOutlined />} color="blue">
                    {(language === 'ar' ? contract.branchNameAr : contract.branchNameEn) ||
                      contract.branchName}
                  </Tag>
                )}
              </div>

              <div className={styles.customerSection}>
                <Avatar size={44} icon={<UserOutlined />} className={styles.customerAvatar} />
                <div className={styles.customerDetails}>
                  <span className={styles.customerName}>{customerDisplay}</span>
                  {contract.customerPhone && (
                    <div className={styles.customerMeta}>
                      <PhoneOutlined />
                      <span dir="ltr">{contract.customerPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.detailsSection}>
                {contract.visaNumber && (
                  <div className={styles.detailItem}>
                    <FileTextOutlined className={styles.detailIcon} />
                    <div className={styles.detailText}>
                      <span className={styles.detailLabel}>{t.visaNumber}</span>
                      <span className={styles.detailValue}>{contract.visaNumber}</span>
                    </div>
                  </div>
                )}
                {contract.arrivalDestinationId && (
                  <div className={styles.detailItem}>
                    <EnvironmentOutlined className={styles.detailIcon} />
                    <div className={styles.detailText}>
                      <span className={styles.detailLabel}>{t.arrivalCity}</span>
                      <span className={styles.detailValue}>
                        {getEnumLabel([...ARRIVAL_DESTINATIONS], contract.arrivalDestinationId, language)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Section — Cost Panel */}
            <div className={styles.cardRight}>
              {/* Total Cost Banner */}
              <div className={styles.totalCostBanner}>
                <div className={styles.totalCostMeta}>
                  <DollarOutlined className={styles.totalCostIcon} />
                  <span className={styles.totalCostLabel}>{t.totalCost}</span>
                </div>
                <div className={styles.totalCostAmount}>{formatCurrency(contract.totalCost)}</div>
              </div>

              {/* Cost Breakdown */}
              <div className={styles.costBreakdown}>
                <div className={styles.costRow}>
                  <span className={styles.costDot} style={{ background: '#003366' }} />
                  <span className={styles.costLabel}>{t.offerAmount}</span>
                  <span className={styles.costValue} style={{ color: '#003366' }}>
                    {formatCurrency(contract.offerAmount)}
                  </span>
                </div>
                <div className={styles.costRow}>
                  <span className={styles.costDot} style={{ background: '#1890ff' }} />
                  <span className={styles.costLabel}>{t.salary}</span>
                  <span className={styles.costValue} style={{ color: '#1890ff' }}>
                    {formatCurrency(contract.salary)}
                  </span>
                </div>
                <div className={styles.costRow}>
                  <span className={styles.costDot} style={{ background: '#faad14' }} />
                  <span className={styles.costLabel}>{t.taxValue}</span>
                  <span className={styles.costValue} style={{ color: '#faad14' }}>
                    {formatCurrency(contract.totalTaxValue)}
                  </span>
                </div>
                <div className={styles.costRow}>
                  <span className={styles.costDot} style={{ background: '#722ed1' }} />
                  <span className={styles.costLabel}>{t.otherCosts}</span>
                  <span className={styles.costValue} style={{ color: '#722ed1' }}>
                    {formatCurrency(contract.otherCosts)}
                  </span>
                </div>
              </div>

              {/* Date Range */}
              <div className={styles.datesSection}>
                <div className={styles.dateItem}>
                  <CalendarOutlined />
                  <span>{formatDate(contract.createdAt)}</span>
                </div>
                {contract.visaDate && (
                  <>
                    <span className={styles.dateSeparator}>{'→'}</span>
                    <div className={styles.dateItem}>
                      <CalendarOutlined />
                      <span>{formatDate(contract.visaDate)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Status-aware actions: Details + valid lifecycle action + More menu */}
          <div className={styles.cardBottom}>
            <div className={styles.actionsRow}>
              <Button
                icon={<EyeOutlined />}
                className={styles.detailsBtn}
                onClick={selectAnd(() => setShowDetailsModal(true))}
              >
                {t.contractDetails}
              </Button>
              {primaryAction && (
                <Button
                  type="primary"
                  danger={primaryAction.danger}
                  icon={primaryAction.icon}
                  onClick={primaryAction.onClick}
                  className={styles.primaryActionBtn}
                >
                  {primaryAction.label}
                </Button>
              )}
              <Dropdown menu={{ items: moreItems }} trigger={['click']} placement="bottomRight">
                <Button icon={<MoreOutlined />}>{t.more}</Button>
              </Dropdown>
            </div>
          </div>
        </Card>
      </Col>
    );
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.contractsPage}>
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
            <Button icon={<ReloadOutlined />} className={styles.secondaryBtn} onClick={() => refetch()}>
              {t.refresh}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className={styles.primaryBtn}
              onClick={() => {
                if (prefilledCustomerId) {
                  router.push(`/contracts/mediationcontract/add?customerId=${prefilledCustomerId}`);
                } else {
                  setCustomerSelectId(null);
                  setShowCustomerSelectModal(true);
                }
              }}
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
            <Statistic title={t.totalContracts} value={stats.total} prefix={<FileTextOutlined style={{ color: '#003366' }} />} valueStyle={{ color: '#003366' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className={styles.statCard}>
            <Statistic title={t.activeContracts} value={stats.active} prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className={styles.statCard}>
            <Statistic title={t.pendingContracts} value={stats.pending} prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />} valueStyle={{ color: '#faad14' }} />
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

      {/* Filters */}
      <Card className={styles.filterCard}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={10}>
            <Input
              placeholder={t.search}
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }}
              allowClear
              size="large"
              className={styles.searchInput}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              value={typeFilter}
              onChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}
              style={{ width: '100%' }}
              size="large"
              options={[
                { value: 'all', label: t.allTypes },
                ...toSelectOptions([...MEDIATION_CONTRACT_TYPE], language).map((o) => ({ ...o, value: String(o.value) })),
              ]}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}
              style={{ width: '100%' }}
              size="large"
              options={[
                { value: 'all', label: t.allStatuses },
                ...toSelectOptions([...MEDIATION_CONTRACT_STATUS], language).map((o) => ({ ...o, value: String(o.value) })),
              ]}
            />
          </Col>
          <Col xs={24} md={8}>
            <BranchFilterSelect
              value={branchId}
              onChange={(v) => { setBranchId(v); setCurrentPage(1); }}
              includeSubBranches={includeSubBranches}
              onIncludeSubBranchesChange={setIncludeSubBranches}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={10}>
            <DateRangeFilter
              value={dateRange}
              onChange={(range) => { setDateRange(range); setCurrentPage(1); }}
              placeholder={['أُنشئ من', 'إلى']}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              value={paymentFilter}
              onChange={(v) => { setPaymentFilter(v); setCurrentPage(1); }}
              style={{ width: '100%' }}
              size="large"
              options={[
                { value: 'all', label: t.paymentStatus },
                { value: 'paid', label: t.paid },
                { value: 'unpaid', label: t.unpaid },
              ]}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Checkbox
              checked={withoutWorker}
              onChange={(e) => { setWithoutWorker(e.target.checked); setCurrentPage(1); }}
            >
              {t.withoutWorkerLabel}
            </Checkbox>
          </Col>
          <Col xs={24} md={6} style={{ textAlign: language === 'ar' ? 'left' : 'right' }}>
            <ExportButton
              endpoint={API_ENDPOINTS.MEDIATION_CONTRACT.EXPORT}
              filters={{
                Page: currentPage,
                PageSize: pageSize,
                StatusId: statusFilter === 'all' ? undefined : Number(statusFilter),
                ContractType: typeFilter === 'all' ? undefined : Number(typeFilter),
                Search: searchText || undefined,
                BranchId: branchId,
                IncludeSubBranches: branchId ? includeSubBranches : undefined,
                CreatedDateFrom: dateRange[0],
                CreatedDateTo: dateRange[1],
                WithoutAssignedWorker: withoutWorker || undefined,
                IsPaid: paymentFilter === 'paid' ? true : undefined,
                IsUnpaid: paymentFilter === 'unpaid' ? true : undefined,
              }}
              fileName="MediationContracts.xlsx"
              pageParam="page"
            />
          </Col>
        </Row>
      </Card>

      {/* Results Info */}
      <div className={styles.resultsInfo}>
        <span>
          {language === 'ar'
            ? 'عرض ' + filteredContracts.length + ' من ' + serverTotal + ' عقد'
            : 'Showing ' + filteredContracts.length + ' of ' + serverTotal + ' contracts'}
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

      {/* Pagination */}
      {serverTotal > pageSize && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24, marginBottom: 8 }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={serverTotal}
            onChange={(page, size) => {
              setCurrentPage(page);
              if (size !== pageSize) setCurrentPage(1);
              setPageSize(size);
            }}
            showSizeChanger
            showTotal={(total, range) =>
              language === 'ar'
                ? `${range[0]}-${range[1]} من ${total}`
                : `${range[0]}-${range[1]} of ${total}`
            }
            pageSizeOptions={[10, 20, 50]}
          />
        </div>
      )}

      {/* ========== CUSTOMER SELECT → navigates to /add ========== */}
      <Modal
        title={language === 'ar' ? 'اختر العميل لإنشاء عقد وساطة' : 'Select Customer to Create Mediation Contract'}
        open={showCustomerSelectModal}
        onCancel={() => { setShowCustomerSelectModal(false); setCustomerSelectId(null); }}
        onOk={() => {
          if (customerSelectId) {
            setShowCustomerSelectModal(false);
            router.push(`/contracts/mediationcontract/add?customerId=${customerSelectId}`);
          }
        }}
        okText={language === 'ar' ? 'متابعة' : 'Continue'}
        cancelText={language === 'ar' ? 'إلغاء' : 'Cancel'}
        okButtonProps={{ disabled: !customerSelectId }}
      >
        <Form layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label={language === 'ar' ? 'العميل' : 'Customer'} required>
            <Select
              showSearch
              placeholder={language === 'ar' ? 'ابحث واختر العميل...' : 'Search and select customer...'}
              loading={isLoadingCustomers}
              value={customerSelectId}
              onChange={(val) => setCustomerSelectId(val)}
              filterOption={(input, option) =>
                String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={(Array.isArray(allCustomers) ? allCustomers : []).map((c: any) => ({
                value: c.id,
                label: language === 'ar' ? c.arabicName || c.englishName || `#${c.id}` : c.englishName || c.arabicName || `#${c.id}`,
              }))}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ========== CONTRACT DETAILS MODAL ========== */}
      <Modal
        title={
          <span>
            {t.contractDetails}
            {selectedContract?.contractNumber ? ` — #${selectedContract.contractNumber}` : ''}
            {selectedContract?.statusName && (
              <Badge
                status={getStatusConfigFromName(selectedContract.statusName).color}
                text={selectedContract.statusName}
                style={{ marginInlineStart: 12, fontSize: 13 }}
              />
            )}
          </span>
        }
        open={showDetailsModal}
        onCancel={() => { setShowDetailsModal(false); setSelectedContract(null); }}
        footer={<Button type="primary" onClick={() => { setShowDetailsModal(false); setSelectedContract(null); }}>{t.close}</Button>}
        width={960}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        {isLoadingDetail ? (
          <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>
        ) : contractDetail ? (
          <Tabs
            defaultActiveKey="info"
            items={[
              {
                key: 'info',
                label: language === 'ar' ? 'معلومات العقد' : 'Contract Info',
                children: (
                  <div className={styles.detailsModal}>
                    <Divider titlePlacement="left" style={{ fontSize: 13, color: '#8c8c8c' }}>
                      {language === 'ar' ? 'بيانات العميل' : 'Customer'}
                    </Divider>
                    <Descriptions column={2} size="small" bordered>
                      <Descriptions.Item label={t.customer}>
                        {contractDetail.customerName || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label={language === 'ar' ? 'الرقم الوطني' : 'National ID'}>
                        {contractDetail.customerNationalId || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label={language === 'ar' ? 'الجوال' : 'Phone'}>
                        {contractDetail.customerPhone || '-'}
                      </Descriptions.Item>
                    </Descriptions>

                    <Divider titlePlacement="left" style={{ fontSize: 13, color: '#8c8c8c', marginBlockStart: 20 }}>
                      {language === 'ar' ? 'بيانات العامل' : 'Worker'}
                    </Divider>
                    {contractDetail.workerPhotoUrl && (
                      <div style={{ marginBlockEnd: 12 }}>
                        <Image
                          src={resolveImageUrl(contractDetail.workerPhotoUrl)}
                          alt={contractDetail.workerName || 'worker'}
                          width={96}
                          height={96}
                          style={{ objectFit: 'cover', borderRadius: 8 }}
                          fallback="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIvPg=="
                        />
                      </div>
                    )}
                    <Descriptions column={2} size="small" bordered>
                      <Descriptions.Item label={language === 'ar' ? 'اسم العامل' : 'Worker Name'}>
                        {contractDetail.workerName || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label={language === 'ar' ? 'رقم الجواز' : 'Passport'}>
                        {contractDetail.workerPassportNumber || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label={language === 'ar' ? 'الجنسية' : 'Nationality'}>
                        {contractDetail.workerNationalityAr || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label={language === 'ar' ? 'نوع العامل' : 'Worker Type'}>
                        {contractDetail.workerTypeName || '-'}
                      </Descriptions.Item>
                    </Descriptions>

                    <Divider titlePlacement="left" style={{ fontSize: 13, color: '#8c8c8c', marginBlockStart: 20 }}>
                      {language === 'ar' ? 'بيانات العقد' : 'Contract'}
                    </Divider>
                    <Descriptions column={2} size="small" bordered>
                      <Descriptions.Item label={language === 'ar' ? 'رقم العقد' : 'Contract #'}>
                        {contractDetail.contractNumber || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label={t.status}>
                        <Badge
                          status={getStatusConfigFromName(contractDetail.statusName).color}
                          text={contractDetail.statusName || '-'}
                        />
                      </Descriptions.Item>
                      <Descriptions.Item label={language === 'ar' ? 'نوع العقد' : 'Contract Type'}>
                        {contractDetail.contractTypeName || contractDetail.contractType || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label={language === 'ar' ? 'فئة العقد' : 'Contract Category'}>
                        {contractDetail.contractCategoryName || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label={language === 'ar' ? 'الوكيل' : 'Agent'}>
                        {contractDetail.agentName || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label={language === 'ar' ? 'الفرع' : 'Branch'}>
                        {(language === 'ar'
                          ? contractDetail.branchNameAr
                          : contractDetail.branchNameEn) ||
                          contractDetail.branchName ||
                          '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label={language === 'ar' ? 'أيام منذ الإنشاء' : 'Days Since Creation'}>
                        {contractDetail.daysSinceCreation != null ? contractDetail.daysSinceCreation : '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label={t.musanedNumber}>
                        {contractDetail.musanedContractNumber || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label={language === 'ar' ? 'رقم توثيق مساند' : 'Musaned Doc #'}>
                        {contractDetail.musanedDocumentationNumber || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label={t.visaNumber}>
                        {contractDetail.visaNumber || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label={language === 'ar' ? 'حالة التأشيرة' : 'Visa Status'}>
                        {contractDetail.visaStatusName || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label={language === 'ar' ? 'نوع التأشيرة' : 'Visa Type'}>
                        {contractDetail.visaType != null ? contractDetail.visaType : '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label={language === 'ar' ? 'تاريخ التأشيرة' : 'Visa Date'}>
                        {formatDate(contractDetail.visaDate)}
                        {contractDetail.visaDateHijri ? ` (${contractDetail.visaDateHijri})` : ''}
                      </Descriptions.Item>
                      <Descriptions.Item label={language === 'ar' ? 'تأشيرة تأهيل شامل' : 'Comprehensive Visa'}>
                        {contractDetail.isComprehensiveQualificationVisa
                          ? (language === 'ar' ? 'نعم' : 'Yes')
                          : (language === 'ar' ? 'لا' : 'No')}
                      </Descriptions.Item>
                      <Descriptions.Item label={t.arrivalCity}>
                        {contractDetail.arrivalDestinationName ||
                          (contractDetail.arrivalDestinationId
                            ? getEnumLabel([...ARRIVAL_DESTINATIONS], contractDetail.arrivalDestinationId, language)
                            : '-')}
                      </Descriptions.Item>
                      <Descriptions.Item label={language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}>
                        {formatDate(contractDetail.createdAt)}
                      </Descriptions.Item>
                      <Descriptions.Item label={language === 'ar' ? 'أُنشئ بواسطة' : 'Created By'}>
                        {contractDetail.createdByName || '-'}
                      </Descriptions.Item>
                      {contractDetail.contractEndNote && (
                        <Descriptions.Item label={language === 'ar' ? 'ملاحظة إنهاء العقد' : 'Contract End Note'} span={2}>
                          {contractDetail.contractEndNote}
                        </Descriptions.Item>
                      )}
                    </Descriptions>

                    {contractDetail.isCancel && (
                      <Alert
                        type="warning"
                        showIcon
                        message={language === 'ar' ? 'هذا العقد ملغى' : 'This contract is cancelled'}
                        style={{ marginBlockStart: 16 }}
                      />
                    )}

                    {contractDetail.cancelNote && (
                      <>
                        <Divider titlePlacement="left" style={{ fontSize: 13, color: '#ff4d4f', marginBlockStart: 20 }}>
                          {t.cancelContract}
                        </Divider>
                        <Alert
                          type="error"
                          showIcon
                          message={getEnumLabel([...CANCEL_BY], contractDetail.cancelBy, language)}
                          description={contractDetail.cancelNote}
                        />
                      </>
                    )}
                  </div>
                ),
              },
              {
                key: 'financial',
                label: language === 'ar' ? 'التكاليف' : 'Financial',
                children: (
                  <div className={styles.detailsModal}>
                    {/* Total cost hero */}
                    <div className={styles.totalCostBanner} style={{ marginBlockEnd: 20 }}>
                      <div className={styles.totalCostMeta}>
                        <DollarOutlined className={styles.totalCostIcon} />
                        <span className={styles.totalCostLabel}>{t.totalCost}</span>
                      </div>
                      <div className={styles.totalCostAmount}>{formatCurrency(contractDetail.totalCost)}</div>
                    </div>

                    <Descriptions column={3} size="small" bordered>
                      <Descriptions.Item label={t.offerAmount}>
                        <span style={{ color: '#003366', fontWeight: 700 }}>{formatCurrency(contractDetail.offerAmount)}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label={t.localCost}>
                        <span style={{ color: '#52c41a', fontWeight: 700 }}>{formatCurrency(contractDetail.localCost)}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label={t.agentCost}>
                        <span style={{ color: '#faad14', fontWeight: 700 }}>{formatCurrency(contractDetail.agentCostSAR)}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label={t.salary}>
                        <span style={{ color: '#1890ff', fontWeight: 700 }}>{formatCurrency(contractDetail.salary)}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label={t.otherCosts}>
                        <span style={{ color: '#722ed1', fontWeight: 700 }}>{formatCurrency(contractDetail.otherCosts)}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label={t.taxValue}>
                        <span style={{ color: '#fa8c16', fontWeight: 700 }}>{formatCurrency(contractDetail.totalTaxValue)}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label={t.managerDiscount}>
                        <span style={{ color: '#ff4d4f', fontWeight: 700 }}>-{formatCurrency(contractDetail.managerDiscount)}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label={t.costDiscount}>
                        <span style={{ color: '#ff4d4f', fontWeight: 700 }}>-{formatCurrency(contractDetail.costDiscount)}</span>
                      </Descriptions.Item>
                      {contractDetail.hasContractInsurance && (
                        <Descriptions.Item label={t.insuranceCost}>
                          <span style={{ color: '#13c2c2', fontWeight: 700 }}>{formatCurrency(contractDetail.domesticWorkerInsurance)}</span>
                        </Descriptions.Item>
                      )}
                    </Descriptions>

                    {contractDetail.costDescription && (
                      <Alert
                        type="info"
                        showIcon
                        message={language === 'ar' ? 'ملاحظة التكلفة' : 'Cost Note'}
                        description={contractDetail.costDescription}
                        style={{ marginBlockStart: 16 }}
                      />
                    )}
                  </div>
                ),
              },
              {
                key: 'followup',
                label: language === 'ar' ? 'المتابعة' : 'Follow-up',
                children: (
                  <div className={styles.detailsModal}>
                    {contractDetail.followUpItems && contractDetail.followUpItems.length > 0 ? (
                      <Table
                        dataSource={contractDetail.followUpItems}
                        rowKey="id"
                        size="small"
                        pagination={false}
                        columns={[
                          {
                            title: language === 'ar' ? 'الحالة' : 'Status',
                            render: (_: any, row: any) => language === 'ar' ? row.statusNameAr : row.statusNameEn,
                          },
                          {
                            title: language === 'ar' ? 'النتيجة' : 'Result',
                            dataIndex: 'resultName',
                            render: (v: string) => {
                              // Result enum: Pending / Completed / Failed / Skipped
                              const color =
                                v === 'Completed' ? 'green'
                                : v === 'Failed' ? 'red'
                                : v === 'Pending' ? 'orange'
                                : 'default';
                              return <Tag color={color}>{v || '-'}</Tag>;
                            },
                          },
                          {
                            title: language === 'ar' ? 'أقصى أيام' : 'Max Days',
                            dataIndex: 'maxDays',
                            align: 'center',
                          },
                          {
                            title: language === 'ar' ? 'مكتمل في' : 'Completed At',
                            dataIndex: 'completedAt',
                            render: (v: string) => formatDate(v),
                          },
                          {
                            title: language === 'ar' ? 'ملاحظات' : 'Notes',
                            dataIndex: 'notes',
                            render: (v: string) => v || '-',
                          },
                        ]}
                      />
                    ) : (
                      <Empty description={language === 'ar' ? 'لا توجد عناصر متابعة' : 'No follow-up items'} />
                    )}
                  </div>
                ),
              },
              {
                key: 'history',
                label: language === 'ar' ? 'سجل الحالات' : 'Status History',
                children: (
                  <div className={styles.detailsModal}>
                    {contractDetail.statusHistories && contractDetail.statusHistories.length > 0 ? (
                      <Timeline
                        mode="left"
                        items={contractDetail.statusHistories.map((h) => ({
                          color: h.newStatusName === 'Cancelled' ? 'red' : h.newStatusName === 'Signed' || h.newStatusName === 'Delivered' ? 'green' : 'blue',
                          label: formatDate(h.createdAt),
                          children: (
                            <div>
                              <div style={{ marginBlockEnd: 4 }}>
                                <Tag color="default">{h.oldStatusName || '—'}</Tag>
                                {' → '}
                                <Tag color="blue">{h.newStatusName || '—'}</Tag>
                              </div>
                              {h.notes && <div style={{ fontSize: 13, color: '#595959' }}>{h.notes}</div>}
                              {h.createdByName && (
                                <div style={{ fontSize: 12, color: '#8c8c8c', marginBlockStart: 2 }}>
                                  {t.changedBy}: {h.createdByName}
                                </div>
                              )}
                            </div>
                          ),
                        }))}
                      />
                    ) : (
                      <Empty description={language === 'ar' ? 'لا يوجد سجل حالات' : 'No status history'} />
                    )}
                  </div>
                ),
              },
              {
                key: 'assignments',
                label: language === 'ar' ? 'سجل الإسنادات' : 'Worker Assignments',
                children: (
                  <div className={styles.detailsModal}>
                    {contractDetail.workerAssignments && contractDetail.workerAssignments.length > 0 ? (
                      <Timeline
                        mode="left"
                        items={contractDetail.workerAssignments.map((a, idx) => ({
                          key: a.id ?? idx,
                          color: a.isActive ? 'green' : 'gray',
                          label: formatDate(a.assignedAt),
                          children: (
                            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                              {a.workerPhotoUrl && (
                                <Image
                                  src={resolveImageUrl(a.workerPhotoUrl)}
                                  alt={a.workerNameAr || 'worker'}
                                  width={48}
                                  height={48}
                                  style={{ objectFit: 'cover', borderRadius: 6 }}
                                  preview={false}
                                />
                              )}
                              <div>
                                <div style={{ fontWeight: 600 }}>
                                  {(language === 'ar' ? a.workerNameAr : a.workerNameEn) ||
                                    a.workerNameAr ||
                                    a.workerNameEn ||
                                    '-'}
                                  {a.isActive && (
                                    <Tag color="green" style={{ marginInlineStart: 8 }}>
                                      {language === 'ar' ? 'نشط' : 'Active'}
                                    </Tag>
                                  )}
                                </div>
                                {a.workerPassportNumber && (
                                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                                    {language === 'ar' ? 'رقم الجواز' : 'Passport'}: {a.workerPassportNumber}
                                  </div>
                                )}
                                {a.endedAt && (
                                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                                    {language === 'ar' ? 'انتهى في' : 'Ended at'}: {formatDate(a.endedAt)}
                                  </div>
                                )}
                                {a.endReason && (
                                  <div style={{ fontSize: 13, color: '#595959' }}>
                                    {language === 'ar' ? 'السبب' : 'Reason'}: {a.endReason}
                                  </div>
                                )}
                              </div>
                            </div>
                          ),
                        }))}
                      />
                    ) : (
                      <Empty
                        description={
                          language === 'ar' ? 'لا يوجد سجل إسنادات' : 'No worker assignment history'
                        }
                      />
                    )}
                  </div>
                ),
              },
              {
                key: 'delivery',
                label: language === 'ar' ? 'نموذج التسليم' : 'Delivery Form',
                children: (
                  <div className={styles.detailsModal}>
                    {contractDetail.deliveryForm ? (
                      <Descriptions column={2} size="small" bordered>
                        <Descriptions.Item label={t.deliveryDate}>
                          {formatDate(contractDetail.deliveryForm.deliveryDate)}
                        </Descriptions.Item>
                        <Descriptions.Item label={t.customerSignedAt}>
                          {formatDate(contractDetail.deliveryForm.customerSignedAt)}
                        </Descriptions.Item>
                        <Descriptions.Item label={language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}>
                          {formatDate(contractDetail.deliveryForm.createdAt)}
                        </Descriptions.Item>
                        {contractDetail.deliveryForm.notes && (
                          <Descriptions.Item label={t.deliveryNotes} span={2}>
                            {contractDetail.deliveryForm.notes}
                          </Descriptions.Item>
                        )}
                      </Descriptions>
                    ) : (
                      <Empty description={language === 'ar' ? 'لم يُنشأ نموذج التسليم بعد' : 'Delivery form not yet generated'} />
                    )}
                  </div>
                ),
              },
              {
                key: 'attachments',
                label: (
                  <span>
                    {language === 'ar' ? 'المرفقات' : 'Attachments'}
                    {contractDetail.attachments && contractDetail.attachments.length > 0 && (
                      <Badge count={contractDetail.attachments.length} size="small" style={{ marginInlineStart: 6 }} />
                    )}
                  </span>
                ),
                children: (
                  <div className={styles.detailsModal}>
                    {contractDetail.attachments && contractDetail.attachments.length > 0 ? (
                      <Image.PreviewGroup>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {contractDetail.attachments.map((attachment, idx) => {
                            const isFullUrl = attachment.startsWith('http');
                            const url = isFullUrl ? attachment : `/${attachment}`;
                            const isPdf = attachment.toLowerCase().endsWith('.pdf');
                            const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(attachment);
                            return (
                              <div
                                key={idx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 12,
                                  padding: '12px 16px',
                                  border: '1px solid #e8e8e8',
                                  borderRadius: 8,
                                  background: '#fafafa',
                                }}
                              >
                                {isPdf ? (
                                  <FilePdfOutlined style={{ fontSize: 28, color: '#e53e3e', flexShrink: 0 }} />
                                ) : isImage ? (
                                  <Image
                                    src={url}
                                    alt={`${language === 'ar' ? 'مرفق' : 'Attachment'} ${idx + 1}`}
                                    width={56}
                                    height={56}
                                    style={{ objectFit: 'cover', borderRadius: 6, border: '1px solid #e8e8e8', flexShrink: 0 }}
                                    preview={{ mask: <EyeOutlined /> }}
                                  />
                                ) : (
                                  <PaperClipOutlined style={{ fontSize: 28, color: '#1890ff', flexShrink: 0 }} />
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontWeight: 500, color: '#1d1d1d' }}>
                                    {language === 'ar' ? `مرفق ${idx + 1}` : `Attachment ${idx + 1}`}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 12,
                                      color: '#8c8c8c',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {attachment}
                                  </div>
                                </div>
                                <Button
                                  type="link"
                                  icon={isPdf ? <DownloadOutlined /> : <EyeOutlined />}
                                  onClick={() => window.open(url, '_blank')}
                                  style={{ flexShrink: 0 }}
                                >
                                  {language === 'ar' ? (isPdf ? 'تحميل' : 'عرض') : (isPdf ? 'Download' : 'View')}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </Image.PreviewGroup>
                    ) : (
                      <Empty description={language === 'ar' ? 'لا توجد مرفقات' : 'No attachments'} />
                    )}
                  </div>
                ),
              },
              {
                key: 'warranty',
                label: language === 'ar' ? 'الضمان والإرجاع' : 'Warranty Return',
                children: (
                  <div className={styles.detailsModal}>
                    {contractDetail.warrantyReturn ? (
                      <>
                        <Alert
                          type="warning"
                          showIcon
                          message={language === 'ar' ? 'تم إرجاع العامل ضمن فترة الضمان' : 'Worker returned within warranty period'}
                          style={{ marginBlockEnd: 16 }}
                        />
                        <Descriptions column={2} size="small" bordered>
                          <Descriptions.Item label={t.returnDate}>
                            {formatDate(contractDetail.warrantyReturn.returnDate)}
                          </Descriptions.Item>
                          <Descriptions.Item label={t.returnReason}>
                            {contractDetail.warrantyReturn.returnReasonName || contractDetail.warrantyReturn.returnReason || '-'}
                          </Descriptions.Item>
                          <Descriptions.Item label={t.daysWithCustomer}>
                            {contractDetail.warrantyReturn.daysWithCustomer ?? '-'}
                          </Descriptions.Item>
                          <Descriptions.Item label={t.refundAmount}>
                            <span style={{ color: '#fa8c16', fontWeight: 700 }}>
                              {formatCurrency(contractDetail.warrantyReturn.refundAmount)}
                            </span>
                          </Descriptions.Item>
                          {contractDetail.warrantyReturn.newWorkerLocation && (
                            <Descriptions.Item label={t.newWorkerLocation} span={2}>
                              {contractDetail.warrantyReturn.newWorkerLocation}
                            </Descriptions.Item>
                          )}
                          {contractDetail.warrantyReturn.notes && (
                            <Descriptions.Item label={t.note} span={2}>
                              {contractDetail.warrantyReturn.notes}
                            </Descriptions.Item>
                          )}
                          <Descriptions.Item label={language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}>
                            {formatDate(contractDetail.warrantyReturn.createdAt)}
                          </Descriptions.Item>
                        </Descriptions>
                      </>
                    ) : (
                      <Empty description={language === 'ar' ? 'لا يوجد إرجاع ضمان' : 'No warranty return recorded'} />
                    )}
                  </div>
                ),
              },
            ]}
          />
        ) : null}
      </Modal>

      {/* ========== CANCEL CONTRACT MODAL ========== */}
      <Modal
        title={t.cancelContract}
        open={showCancelModal}
        onCancel={() => setShowCancelModal(false)}
        onOk={handleCancelContract}
        okText={t.submit}
        cancelText={t.cancel}
        confirmLoading={isCancelling}
        okButtonProps={{ danger: true }}
      >
        <Form form={cancelForm} layout="vertical">
          <Form.Item
            name="cancelBy"
            label={t.cancelBy}
            rules={[{ required: true, message: language === 'ar' ? 'مطلوب' : 'Required' }]}
          >
            <Select placeholder={t.cancelBy} options={toSelectOptions([...CANCEL_BY], language)} />
          </Form.Item>
          <Form.Item
            name="cancelNote"
            label={t.cancelNote}
            rules={[{ required: true, message: language === 'ar' ? 'مطلوب' : 'Required' }]}
          >
            <Input.TextArea rows={3} placeholder={language === 'ar' ? 'سبب الإلغاء...' : 'Cancellation reason...'} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ========== SIGN CONTRACT MODAL (Draft → Signed) ========== */}
      <Modal
        title={t.signContract}
        open={showSignModal}
        onCancel={() => { setShowSignModal(false); signForm.resetFields(); }}
        onOk={handleSignContract}
        okText={t.save}
        cancelText={t.cancel}
        confirmLoading={isSigning}
      >
        <Form form={signForm} layout="vertical">
          <Form.Item
            name="musanedContractNumber"
            label={t.musanedNumber}
            rules={[{ required: true, message: language === 'ar' ? 'مطلوب' : 'Required' }]}
          >
            <Input placeholder={t.musanedNumber} />
          </Form.Item>
          <Form.Item name="invoicePaymentDate" label={t.invoicePaymentDate}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ========== GENERATE DELIVERY FORM MODAL ========== */}
      <Modal
        title={t.generateDelivery}
        open={showDeliveryModal}
        onCancel={() => { setShowDeliveryModal(false); deliveryForm.resetFields(); }}
        onOk={handleGenerateDelivery}
        okText={t.submit}
        cancelText={t.cancel}
        confirmLoading={isGeneratingDelivery}
      >
        <Form form={deliveryForm} layout="vertical">
          <Form.Item name="deliveryDate" label={t.deliveryDate}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label={t.deliveryNotes}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ========== CONFIRM DELIVERY SIGN MODAL (Signed → Delivered) ========== */}
      <Modal
        title={t.confirmDelivery}
        open={showDeliverySignModal}
        onCancel={() => { setShowDeliverySignModal(false); deliverySignForm.resetFields(); }}
        onOk={handleSignDelivery}
        okText={t.save}
        cancelText={t.cancel}
        confirmLoading={isSigningDelivery}
      >
        <Form form={deliverySignForm} layout="vertical">
          <Form.Item name="customerSignedAt" label={t.customerSignedAt}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ========== WARRANTY RETURN MODAL (Delivered → Returned) ========== */}
      <Modal
        title={t.warrantyReturn}
        open={showWarrantyReturnModal}
        onCancel={() => { setShowWarrantyReturnModal(false); warrantyReturnForm.resetFields(); }}
        onOk={handleWarrantyReturn}
        okText={t.submit}
        cancelText={t.cancel}
        confirmLoading={isReturning}
        okButtonProps={{ danger: true }}
      >
        <Form form={warrantyReturnForm} layout="vertical">
          <Form.Item
            name="returnDate"
            label={t.returnDate}
            rules={[{ required: true, message: language === 'ar' ? 'مطلوب' : 'Required' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="returnReason"
            label={t.returnReason}
            rules={[{ required: true, message: language === 'ar' ? 'مطلوب' : 'Required' }]}
          >
            <Select placeholder={t.returnReason}>
              <Select.Option value={1}>{language === 'ar' ? 'لا تناسب' : 'Incompatibility'}</Select.Option>
              <Select.Option value={2}>{language === 'ar' ? 'مرض' : 'Illness'}</Select.Option>
              <Select.Option value={3}>{language === 'ar' ? 'سوء سلوك' : 'Misconduct'}</Select.Option>
              <Select.Option value={4}>{language === 'ar' ? 'أخرى' : 'Other'}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="daysWithCustomer"
            label={t.daysWithCustomer}
            rules={[
              { required: true, message: language === 'ar' ? 'مطلوب' : 'Required' },
              { type: 'number', min: 1, message: language === 'ar' ? 'يجب أن يكون أكبر من صفر' : 'Must be greater than 0' },
            ]}
            extra={t.warrantyNote}
          >
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>

          {/* Live refund preview per PDF formula */}
          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.daysWithCustomer !== curr.daysWithCustomer}
          >
            {({ getFieldValue }) => {
              const days = Number(getFieldValue('daysWithCustomer')) || 0;
              const totalCost = selectedContract?.totalCost || 0;
              const refund = days > 0 && days < 90 ? totalCost - (totalCost / 90) * days : 0;
              return (
                <div
                  style={{
                    background: refund > 0 ? '#fff7e6' : '#f6ffed',
                    border: `1px solid ${refund > 0 ? '#ffd591' : '#b7eb8f'}`,
                    borderRadius: 6,
                    padding: '10px 16px',
                    marginBottom: 16,
                  }}
                >
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{t.refundAmount}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: refund > 0 ? '#fa8c16' : '#52c41a' }}>
                    {formatCurrency(refund)}
                  </div>
                  {days >= 90 && (
                    <div style={{ fontSize: 12, color: '#52c41a', marginTop: 4 }}>
                      {language === 'ar' ? '✓ انتهت فترة الضمان — لا يوجد مبلغ مسترد' : '✓ Warranty period expired — no refund'}
                    </div>
                  )}
                </div>
              );
            }}
          </Form.Item>

          <Form.Item name="newWorkerLocation" label={t.newWorkerLocation}>
            <Input placeholder={language === 'ar' ? 'اختياري — مكان إعادة توجيه العامل' : 'Optional — where the worker is being redirected'} />
          </Form.Item>
          <Form.Item name="notes" label={t.note}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ========== UPDATE STATUS MODAL ========== */}
      <Modal
        title={t.updateStatus}
        open={showUpdateStatusModal}
        onCancel={() => { setShowUpdateStatusModal(false); updateStatusForm.resetFields(); }}
        onOk={handleUpdateStatus}
        okText={t.save}
        cancelText={t.cancel}
        confirmLoading={isUpdatingStatus}
      >
        <Form form={updateStatusForm} layout="vertical">
          <Form.Item
            name="newStatus"
            label={t.newStatus}
            rules={[{ required: true, message: language === 'ar' ? 'مطلوب' : 'Required' }]}
          >
            <Select placeholder={t.newStatus} options={toSelectOptions([...MEDIATION_CONTRACT_STATUS], language)} />
          </Form.Item>
          <Form.Item name="notes" label={t.note}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ========== ADD COMPLAINT MODAL ========== */}
      <Modal
        title={
          <span>
            <WarningOutlined style={{ color: '#ff4d4f', marginInlineEnd: 8 }} />
            {t.addComplaint}
            {selectedContract && ` — #${selectedContract.id}`}
          </span>
        }
        open={showComplaintModal}
        onCancel={() => { setShowComplaintModal(false); complaintForm.resetFields(); }}
        onOk={handleAddComplaint}
        okText={t.submit}
        cancelText={t.cancel}
        confirmLoading={isCreatingComplaint}
        okButtonProps={{ danger: true }}
      >
        <Form form={complaintForm} layout="vertical">
          <Form.Item
            name="source"
            label={t.complaintSource}
            rules={[{ required: true, message: language === 'ar' ? 'مطلوب' : 'Required' }]}
          >
            <Select placeholder={t.complaintSource} options={toSelectOptions([...COMPLAINT_SOURCE], language)} />
          </Form.Item>
          <Form.Item
            name="priority"
            label={t.complaintPriority}
            rules={[{ required: true, message: language === 'ar' ? 'مطلوب' : 'Required' }]}
          >
            <Select placeholder={t.complaintPriority} options={toSelectOptions([...COMPLAINT_PRIORITY], language)} />
          </Form.Item>
          <Form.Item name="notesAr" label={language === 'ar' ? 'ملاحظات (عربي)' : 'Notes (Arabic)'}>
            <Input.TextArea rows={3} placeholder={language === 'ar' ? 'وصف الشكوى بالعربي...' : 'Complaint description in Arabic...'} />
          </Form.Item>
          <Form.Item name="notesEn" label={language === 'ar' ? 'ملاحظات (إنجليزي)' : 'Notes (English)'}>
            <Input.TextArea rows={3} placeholder={language === 'ar' ? 'وصف الشكوى بالإنجليزي...' : 'Complaint description in English...'} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ========== END WORKER SERVICE MODAL ========== */}
      <Modal
        title={
          <span>
            <UserDeleteOutlined style={{ marginInlineEnd: 8 }} />
            {t.endWorkerService}
            {selectedContract && ` — #${selectedContract.contractNumber ?? selectedContract.id}`}
          </span>
        }
        open={showEndServiceModal}
        onCancel={() => { setShowEndServiceModal(false); endServiceForm.resetFields(); }}
        onOk={handleEndWorkerService}
        okText={t.save}
        cancelText={t.cancel}
        confirmLoading={isEndingWorkerService}
        okButtonProps={{ danger: true }}
      >
        <Form form={endServiceForm} layout="vertical">
          <Form.Item name="reason" label={t.endServiceReason}>
            <Input.TextArea
              rows={3}
              placeholder={language === 'ar' ? 'سبب إنهاء الخدمة...' : 'Reason for ending service...'}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ========== ASSIGN WORKER MODAL ========== */}
      <Modal
        title={
          <span>
            <UserAddOutlined style={{ marginInlineEnd: 8 }} />
            {t.assignWorker}
            {selectedContract && ` — #${selectedContract.contractNumber ?? selectedContract.id}`}
          </span>
        }
        open={showAssignWorkerModal}
        onCancel={() => {
          setShowAssignWorkerModal(false);
          assignWorkerForm.resetFields();
          setAssignPassportSearch('');
        }}
        onOk={handleAssignWorker}
        okText={t.save}
        cancelText={t.cancel}
        confirmLoading={isAssigningWorker}
      >
        <Form form={assignWorkerForm} layout="vertical">
          <Form.Item
            name="workerId"
            label={t.assignWorker}
            rules={[{ required: true, message: language === 'ar' ? 'مطلوب' : 'Required' }]}
          >
            <Select
              showSearch
              loading={isLoadingAssignWorkers}
              placeholder={t.selectWorkerPassport}
              filterOption={false}
              onSearch={setAssignPassportSearch}
              searchValue={assignPassportSearch}
              notFoundContent={
                isLoadingAssignWorkers
                  ? (language === 'ar' ? 'جارٍ البحث...' : 'Searching...')
                  : assignPassportDebounced
                  ? (language === 'ar' ? 'لا يوجد عامل متاح مطابق' : 'No matching available worker')
                  : (language === 'ar' ? 'اكتب رقم الجواز للبحث' : 'Type a passport number to search')
              }
              options={(assignWorkers as Worker[]).map((w) => ({
                value: String(w.id),
                label:
                  ((language === 'ar' ? w.fullNameAr : w.fullNameEn || w.fullNameAr) || `#${w.id}`) +
                  (w.passportNo ? ` — ${w.passportNo}` : ''),
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
}
