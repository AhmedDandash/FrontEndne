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
  WarningOutlined,
  MoreOutlined,
  UserDeleteOutlined,
  UserAddOutlined,
} from '@ant-design/icons';

import { useAuthStore } from '@/store/authStore';
import { BranchFilterSelect, DateRangeFilter, ExportButton, AdvancedFilterPanel } from '@/components/filters';
import { API_ENDPOINTS } from '@/config/api.config';
import { useCustomers } from '@/hooks/api/useCustomers';
import { useAvailableMediationWorkers } from '@/hooks/api/useWorkers';
import { useAgents } from '@/hooks/api/useAgents';
import { useMarketers } from '@/hooks/api/useMarketers';
import { useMediationContracts } from '@/hooks/api/useMediationContracts';
import { useCreateComplaint } from '@/hooks/api/useComplaints';
import { formatCurrency, formatDate, getStatusConfigFromName } from './_lib/format';
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
  const [updatedDateRange, setUpdatedDateRange] = useState<[string | undefined, string | undefined]>([
    undefined,
    undefined,
  ]);
  const [paymentDateRange, setPaymentDateRange] = useState<[string | undefined, string | undefined]>([
    undefined,
    undefined,
  ]);
  const [agentFilter, setAgentFilter] = useState<string | 'all'>('all');
  const [marketerFilter, setMarketerFilter] = useState<string | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
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

  // Count of active advanced filters (for the panel badge / clear button).
  const activeFilterCount =
    (branchId ? 1 : 0) +
    (typeFilter !== 'all' ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (dateRange[0] || dateRange[1] ? 1 : 0) +
    (updatedDateRange[0] || updatedDateRange[1] ? 1 : 0) +
    (paymentFilter !== 'all' ? 1 : 0) +
    (paymentDateRange[0] || paymentDateRange[1] ? 1 : 0) +
    (withoutWorker ? 1 : 0) +
    (agentFilter !== 'all' ? 1 : 0) +
    (marketerFilter !== 'all' ? 1 : 0);

  const clearFilters = () => {
    setBranchId(undefined);
    setIncludeSubBranches(true);
    setTypeFilter('all');
    setStatusFilter('all');
    setDateRange([undefined, undefined]);
    setUpdatedDateRange([undefined, undefined]);
    setPaymentFilter('all');
    setPaymentDateRange([undefined, undefined]);
    setWithoutWorker(false);
    setAgentFilter('all');
    setMarketerFilter('all');
    setCurrentPage(1);
  };

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
    updatedDateFrom: updatedDateRange[0],
    updatedDateTo: updatedDateRange[1],
    agentId: agentFilter === 'all' ? undefined : agentFilter,
    marketerId: marketerFilter === 'all' ? undefined : marketerFilter,
    withoutAssignedWorker: withoutWorker || undefined,
    isPaid: paymentFilter === 'paid' ? true : undefined,
    isUnpaid: paymentFilter === 'unpaid' ? true : undefined,
    paymentDateFrom: paymentDateRange[0],
    paymentDateTo: paymentDateRange[1],
  });

  const { mutateAsync: createComplaint, isPending: isCreatingComplaint } = useCreateComplaint();

  const { customers: allCustomers, isLoading: isLoadingCustomers } = useCustomers();
  const { data: agents = [] } = useAgents();
  const { data: marketers = [] } = useMarketers();

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
    allAgents: language === 'ar' ? 'جميع الوكلاء' : 'All Agents',
    allMarketers: language === 'ar' ? 'جميع المسوقين' : 'All Marketers',
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
    createdBy: language === 'ar' ? 'أُنشئ بواسطة' : 'Created By',
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
    totalPaid: language === 'ar' ? 'المدفوع' : 'Total Paid',
    remainingAmount: language === 'ar' ? 'المتبقي' : 'Remaining',
    paymentDateLabel: language === 'ar' ? 'تاريخ الدفعة' : 'Payment Date',
    partiallyPaid: language === 'ar' ? 'مدفوع جزئياً' : 'Partially Paid',
  };

  // Helper functions — formatCurrency/formatDate/getStatusConfigFromName live in
  // ./_lib/format so this list page and the extracted MediationContractDetailView
  // (used by the [id] route page) share one implementation.
  const fmtCurrency = (amount: number | null | undefined) => formatCurrency(amount, language);
  const fmtDate = (dateString: string | null | undefined) => formatDate(dateString, language);

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
      ? getStatusConfigFromName(contract.statusName, language)
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
                {contract.paymentStatusCode != null && (
                  <Tag
                    color={
                      contract.paymentStatusCode === 2
                        ? 'green'
                        : contract.paymentStatusCode === 1
                        ? 'orange'
                        : 'default'
                    }
                  >
                    {contract.paymentStatusCode === 2
                      ? t.paid
                      : contract.paymentStatusCode === 1
                      ? t.partiallyPaid
                      : t.unpaid}
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
                {contract.createdByName && (
                  <div className={styles.detailItem}>
                    <UserOutlined className={styles.detailIcon} />
                    <div className={styles.detailText}>
                      <span className={styles.detailLabel}>{t.createdBy}</span>
                      <span className={styles.detailValue}>{contract.createdByName}</span>
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
                <div className={styles.totalCostAmount}>{fmtCurrency(contract.totalCost)}</div>
              </div>

              {/* Cost Breakdown */}
              <div className={styles.costBreakdown}>
                <div className={styles.costRow}>
                  <span className={styles.costDot} style={{ background: '#003366' }} />
                  <span className={styles.costLabel}>{t.offerAmount}</span>
                  <span className={styles.costValue} style={{ color: '#003366' }}>
                    {fmtCurrency(contract.offerAmount)}
                  </span>
                </div>
                <div className={styles.costRow}>
                  <span className={styles.costDot} style={{ background: '#1890ff' }} />
                  <span className={styles.costLabel}>{t.salary}</span>
                  <span className={styles.costValue} style={{ color: '#1890ff' }}>
                    {fmtCurrency(contract.salary)}
                  </span>
                </div>
                <div className={styles.costRow}>
                  <span className={styles.costDot} style={{ background: '#faad14' }} />
                  <span className={styles.costLabel}>{t.taxValue}</span>
                  <span className={styles.costValue} style={{ color: '#faad14' }}>
                    {fmtCurrency(contract.totalTaxValue)}
                  </span>
                </div>
                <div className={styles.costRow}>
                  <span className={styles.costDot} style={{ background: '#722ed1' }} />
                  <span className={styles.costLabel}>{t.otherCosts}</span>
                  <span className={styles.costValue} style={{ color: '#722ed1' }}>
                    {fmtCurrency(contract.otherCosts)}
                  </span>
                </div>
                <div className={styles.costRow}>
                  <span className={styles.costDot} style={{ background: '#52c41a' }} />
                  <span className={styles.costLabel}>{t.totalPaid}</span>
                  <span className={styles.costValue} style={{ color: '#52c41a' }}>
                    {fmtCurrency(contract.totalPaid)}
                  </span>
                </div>
                <div className={styles.costRow}>
                  <span className={styles.costDot} style={{ background: '#ff4d4f' }} />
                  <span className={styles.costLabel}>{t.remainingAmount}</span>
                  <span className={styles.costValue} style={{ color: '#ff4d4f' }}>
                    {fmtCurrency(contract.remainingAmount)}
                  </span>
                </div>
              </div>

              {/* Date Range */}
              <div className={styles.datesSection}>
                <div className={styles.dateItem}>
                  <CalendarOutlined />
                  <span>{fmtDate(contract.createdAt)}</span>
                </div>
                {contract.visaDate && (
                  <>
                    <span className={styles.dateSeparator}>{'→'}</span>
                    <div className={styles.dateItem}>
                      <CalendarOutlined />
                      <span>{fmtDate(contract.visaDate)}</span>
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
                onClick={() => router.push(`/contracts/mediationcontract/${contract.id}`)}
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
              formatter={(value) => fmtCurrency(value as number)}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <AdvancedFilterPanel
        activeCount={activeFilterCount}
        onClear={clearFilters}
        contentLayout="block"
        quickFilters={
          <>
            <Input
              placeholder={t.search}
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }}
              allowClear
              style={{ width: 260 }}
            />
            <BranchFilterSelect
              value={branchId}
              onChange={(v) => { setBranchId(v); setCurrentPage(1); }}
              includeSubBranches={includeSubBranches}
              onIncludeSubBranchesChange={setIncludeSubBranches}
            />
          </>
        }
        actions={
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
              UpdatedDateFrom: updatedDateRange[0],
              UpdatedDateTo: updatedDateRange[1],
              AgentId: agentFilter === 'all' ? undefined : agentFilter,
              MarketerId: marketerFilter === 'all' ? undefined : marketerFilter,
              WithoutAssignedWorker: withoutWorker || undefined,
              IsPaid: paymentFilter === 'paid' ? true : undefined,
              IsUnpaid: paymentFilter === 'unpaid' ? true : undefined,
              PaymentDateFrom: paymentDateRange[0],
              PaymentDateTo: paymentDateRange[1],
            }}
            fileName="MediationContracts.xlsx"
            pageParam="page"
          />
        }
      >
        <div className={styles.filterContent}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{t.type}</label>
              <Select
                value={typeFilter}
                onChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}
                style={{ width: '100%' }}
                options={[
                  { value: 'all', label: t.allTypes },
                  ...toSelectOptions([...MEDIATION_CONTRACT_TYPE], language).map((o) => ({ ...o, value: String(o.value) })),
                ]}
              />
            </Col>

            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{t.status}</label>
              <Select
                value={statusFilter}
                onChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}
                style={{ width: '100%' }}
                options={[
                  { value: 'all', label: t.allStatuses },
                  ...toSelectOptions([...MEDIATION_CONTRACT_STATUS], language).map((o) => ({ ...o, value: String(o.value) })),
                ]}
              />
            </Col>

            <Col xs={24} md={12}>
              <label className={styles.filterLabel}>
                {language === 'ar' ? 'تاريخ الإنشاء' : 'Created date'}
              </label>
              <DateRangeFilter
                value={dateRange}
                onChange={(range) => { setDateRange(range); setCurrentPage(1); }}
                style={{ width: '100%' }}
              />
            </Col>

            <Col xs={24} md={12}>
              <label className={styles.filterLabel}>
                {language === 'ar' ? 'تاريخ آخر تحديث' : 'Updated date'}
              </label>
              <DateRangeFilter
                value={updatedDateRange}
                onChange={(range) => { setUpdatedDateRange(range); setCurrentPage(1); }}
                style={{ width: '100%' }}
              />
            </Col>

            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{t.paymentStatus}</label>
              <Select
                value={paymentFilter}
                onChange={(v) => { setPaymentFilter(v); setCurrentPage(1); }}
                style={{ width: '100%' }}
                options={[
                  { value: 'all', label: t.paymentStatus },
                  { value: 'paid', label: t.paid },
                  { value: 'unpaid', label: t.unpaid },
                ]}
              />
            </Col>

            <Col xs={24} md={12}>
              <label className={styles.filterLabel}>{t.paymentDateLabel}</label>
              <DateRangeFilter
                value={paymentDateRange}
                onChange={(range) => { setPaymentDateRange(range); setCurrentPage(1); }}
                style={{ width: '100%' }}
              />
            </Col>

            <Col xs={24} md={6} style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
              <Checkbox
                checked={withoutWorker}
                onChange={(e) => { setWithoutWorker(e.target.checked); setCurrentPage(1); }}
              >
                {t.withoutWorkerLabel}
              </Checkbox>
            </Col>

            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>
                {language === 'ar' ? 'الوكيل' : 'Agent'}
              </label>
              <Select
                value={agentFilter}
                onChange={(v) => { setAgentFilter(v); setCurrentPage(1); }}
                style={{ width: '100%' }}
                showSearch
                optionFilterProp="label"
                options={[
                  { value: 'all', label: t.allAgents },
                  ...(agents as any[]).map((a) => ({
                    value: String(a.id),
                    label: (language === 'ar' ? a.agentNameAr : a.agentNameEn) || a.agentNameAr || a.agentNameEn || `#${a.id}`,
                  })),
                ]}
              />
            </Col>

            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>
                {language === 'ar' ? 'المسوق' : 'Marketer'}
              </label>
              <Select
                value={marketerFilter}
                onChange={(v) => { setMarketerFilter(v); setCurrentPage(1); }}
                style={{ width: '100%' }}
                showSearch
                optionFilterProp="label"
                options={[
                  { value: 'all', label: t.allMarketers },
                  ...(marketers as any[]).map((m) => ({
                    value: String(m.id),
                    label: (language === 'ar' ? m.nameAr : m.nameEn) || m.nameAr || m.nameEn || `#${m.id}`,
                  })),
                ]}
              />
            </Col>
          </Row>
        </div>
      </AdvancedFilterPanel>

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
                    {fmtCurrency(refund)}
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
