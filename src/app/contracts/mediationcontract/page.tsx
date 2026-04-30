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
  Progress,
  Badge,
  Spin,
  Form,
  DatePicker,
  InputNumber,
  List,
  Divider,
} from 'antd';
import {
  FileTextOutlined,
  SearchOutlined,
  PlusOutlined,
  PrinterOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileExcelOutlined,
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
  HistoryOutlined,
} from '@ant-design/icons';

import { useAuthStore } from '@/store/authStore';
import { useCustomers } from '@/hooks/api/useCustomers';
import {
  useMediationContracts,
  useContractStatusHistory,
} from '@/hooks/api/useMediationContracts';
import type {
  MediationContract,
  ContractCancelDto,
  SignMediationContractDto,
  DeliveryFormDto,
  DeliveryFormSignDto,
  WarrantyReturnDto,
  UpdateContractStatusDto,
} from '@/types/api.types';
import {
  MEDIATION_CONTRACT_STATUS,
  MEDIATION_CONTRACT_TYPE,
  ARRIVAL_DESTINATIONS,
  CANCEL_BY,
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

  // Modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<MediationContract | null>(null);

  // Customer selection modal (for add contract when no customer prefilled)
  const [showCustomerSelectModal, setShowCustomerSelectModal] = useState(false);
  const [customerSelectId, setCustomerSelectId] = useState<number | null>(null);

  // Lifecycle modals
  const [showSignModal, setShowSignModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showDeliverySignModal, setShowDeliverySignModal] = useState(false);
  const [showWarrantyReturnModal, setShowWarrantyReturnModal] = useState(false);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [showStatusHistoryModal, setShowStatusHistoryModal] = useState(false);

  // Forms
  const [cancelForm] = Form.useForm();
  const [signForm] = Form.useForm();
  const [deliveryForm] = Form.useForm();
  const [deliverySignForm] = Form.useForm();
  const [warrantyReturnForm] = Form.useForm();
  const [updateStatusForm] = Form.useForm();

  // API hooks
  const {
    contracts,
    isLoading,
    refetch,
    cancelContract,
    signContract,
    generateDeliveryForm,
    signDelivery,
    warrantyReturn,
    updateContractStatus,
    isCancelling,
    isSigning,
    isGeneratingDelivery,
    isSigningDelivery,
    isReturning,
    isUpdatingStatus,
  } = useMediationContracts();

  const { data: statusHistory = [], isLoading: isLoadingHistory } = useContractStatusHistory(
    showStatusHistoryModal ? selectedContract?.id : undefined
  );

  const { customers: allCustomers, isLoading: isLoadingCustomers } = useCustomers();

  // Translations
  const t = {
    pageTitle: language === 'ar' ? 'عقود الوساطة' : 'Mediation Contracts',
    pageSubtitle:
      language === 'ar' ? 'إدارة جميع عقود الوساطة والتوسط' : 'Manage all mediation contracts',
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
    musanedDocNumber: language === 'ar' ? 'رقم توثيق مساند' : 'Musaned Documentation #',
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

  const getStatusConfig = (statusId: number | null | undefined) => {
    const configs: Record<number, { color: string; label: string; icon: React.ReactNode }> = {
      1: { color: 'processing', label: getEnumLabel([...MEDIATION_CONTRACT_STATUS], 1, language), icon: <ClockCircleOutlined /> },
      2: { color: 'warning', label: getEnumLabel([...MEDIATION_CONTRACT_STATUS], 2, language), icon: <ClockCircleOutlined /> },
      3: { color: 'success', label: getEnumLabel([...MEDIATION_CONTRACT_STATUS], 3, language), icon: <CheckCircleOutlined /> },
      4: { color: 'error', label: getEnumLabel([...MEDIATION_CONTRACT_STATUS], 4, language), icon: <ExclamationCircleOutlined /> },
      5: { color: 'default', label: getEnumLabel([...MEDIATION_CONTRACT_STATUS], 5, language), icon: <ClockCircleOutlined /> },
    };
    return configs[statusId ?? 0] || { color: 'default', label: language === 'ar' ? 'غير محدد' : 'Unknown', icon: <ClockCircleOutlined /> };
  };

  const getTypeTag = (contractType: number | null | undefined) => {
    const configs: Record<number, { color: string; label: string }> = {
      1: { color: 'blue', label: getEnumLabel([...MEDIATION_CONTRACT_TYPE], 1, language) },
      2: { color: 'green', label: getEnumLabel([...MEDIATION_CONTRACT_TYPE], 2, language) },
    };
    return configs[contractType ?? 0] || { color: 'default', label: language === 'ar' ? 'غير محدد' : 'Unknown' };
  };

  // Filter contracts
  const filteredContracts = useMemo(() => {
    if (!contracts) return [];
    return contracts.filter((contract) => {
      const searchLower = searchText.toLowerCase();
      const matchesSearch =
        !searchText ||
        String(contract.id).includes(searchText) ||
        (contract.musanedContractNumber || '').includes(searchText) ||
        (contract.customerName || '').toLowerCase().includes(searchLower) ||
        (contract.customerNameAr || '').includes(searchText);
      const matchesType = typeFilter === 'all' || contract.contractType === Number(typeFilter);
      const matchesStatus = statusFilter === 'all' || contract.statusId === Number(statusFilter);
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [contracts, searchText, typeFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const all = contracts || [];
    return {
      total: all.length,
      active: all.filter((c) => c.statusId === 2).length,
      pending: all.filter((c) => c.statusId === 5 || c.statusId === 1).length,
      revenue: all.reduce((sum, c) => sum + (c.totalCost || 0), 0),
    };
  }, [contracts]);

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
        musanedDocumentationNumber: values.musanedDocumentationNumber || null,
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

  // Render a contract card
  const renderContractCard = (contract: MediationContract) => {
    const statusConfig = getStatusConfig(contract.statusId);
    const typeTag = getTypeTag(contract.contractType);
    const customerDisplay =
      language === 'ar'
        ? contract.customerNameAr || contract.customerName || `${t.customer} #${contract.customerId}`
        : contract.customerName || contract.customerNameAr || `${t.customer} #${contract.customerId}`;

    return (
      <Col xs={24} key={contract.id}>
        <Card className={styles.contractCard} hoverable>
          <div className={styles.cardContent}>
            {/* Left Section */}
            <div className={styles.cardLeft}>
              <div className={styles.cardHeader}>
                <div className={styles.contractNumber}>
                  <FileTextOutlined className={styles.contractIcon} />
                  <span>#{contract.id}</span>
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

            {/* Right Section */}
            <div className={styles.cardRight}>
              <div className={styles.paymentSection}>
                <div className={styles.paymentHeader}>
                  <span className={styles.paymentLabel}>{t.totalCost}</span>
                  <span className={styles.paymentPercentage}>{formatCurrency(contract.totalCost)}</span>
                </div>
                <Progress percent={0} showInfo={false} strokeColor={{ '0%': '#003366', '100%': '#0056b3' }} />
                <div className={styles.paymentAmounts}>
                  <div className={styles.amountItem}>
                    <span className={styles.amountLabel}>{t.localCost}</span>
                    <span className={styles.amountValue} style={{ color: '#52c41a' }}>{formatCurrency(contract.localCost)}</span>
                  </div>
                  <div className={styles.amountItem}>
                    <span className={styles.amountLabel}>{t.agentCost}</span>
                    <span className={styles.amountValue} style={{ color: '#faad14' }}>{formatCurrency(contract.agentCostSAR)}</span>
                  </div>
                </div>
              </div>

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

          {/* Action Buttons — PDF-defined actions only */}
          <div className={styles.cardBottom}>
            <div className={styles.actionsList}>
              <Button
                type="link"
                icon={<EyeOutlined />}
                className={styles.actionBtn}
                block
                onClick={() => {
                  setSelectedContract(contract);
                  setShowDetailsModal(true);
                }}
              >
                {t.contractDetails}
              </Button>
              <Button
                type="link"
                icon={<CloseCircleOutlined />}
                className={[styles.actionBtn, styles.dangerBtn].join(' ')}
                block
                onClick={() => {
                  setSelectedContract(contract);
                  cancelForm.resetFields();
                  setShowCancelModal(true);
                }}
              >
                {t.cancelContract}
              </Button>
              <Button
                type="link"
                icon={<EditOutlined />}
                className={[styles.actionBtn, styles.successBtn].join(' ')}
                block
                onClick={() => {
                  setSelectedContract(contract);
                  signForm.resetFields();
                  signForm.setFieldValue('musanedContractNumber', contract.musanedContractNumber);
                  setShowSignModal(true);
                }}
              >
                {t.signContract}
              </Button>
              <Button
                type="link"
                icon={<SendOutlined />}
                className={styles.actionBtn}
                block
                onClick={() => {
                  setSelectedContract(contract);
                  deliveryForm.resetFields();
                  setShowDeliveryModal(true);
                }}
              >
                {t.generateDelivery}
              </Button>
              <Button
                type="link"
                icon={<CarOutlined />}
                className={[styles.actionBtn, styles.successBtn].join(' ')}
                block
                onClick={() => {
                  setSelectedContract(contract);
                  deliverySignForm.resetFields();
                  setShowDeliverySignModal(true);
                }}
              >
                {t.confirmDelivery}
              </Button>
              <Button
                type="link"
                icon={<RollbackOutlined />}
                className={[styles.actionBtn, styles.dangerBtn].join(' ')}
                block
                onClick={() => {
                  setSelectedContract(contract);
                  warrantyReturnForm.resetFields();
                  setShowWarrantyReturnModal(true);
                }}
              >
                {t.warrantyReturn}
              </Button>
              <Button
                type="link"
                icon={<FileProtectOutlined />}
                className={styles.actionBtn}
                block
                onClick={() => {
                  setSelectedContract(contract);
                  updateStatusForm.resetFields();
                  setShowUpdateStatusModal(true);
                }}
              >
                {t.updateStatus}
              </Button>
              <Button
                type="link"
                icon={<HistoryOutlined />}
                className={styles.actionBtn}
                block
                onClick={() => {
                  setSelectedContract(contract);
                  setShowStatusHistoryModal(true);
                }}
              >
                {t.statusHistory}
              </Button>
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
            <Button icon={<FileExcelOutlined />} className={styles.secondaryBtn}>
              {t.exportExcel}
            </Button>
            <Button icon={<PrinterOutlined />} className={styles.secondaryBtn}>
              {t.print}
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
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              size="large"
              className={styles.searchInput}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
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
              onChange={setStatusFilter}
              style={{ width: '100%' }}
              size="large"
              options={[
                { value: 'all', label: t.allStatuses },
                ...toSelectOptions([...MEDIATION_CONTRACT_STATUS], language).map((o) => ({ ...o, value: String(o.value) })),
              ]}
            />
          </Col>
        </Row>
      </Card>

      {/* Results Info */}
      <div className={styles.resultsInfo}>
        <span>
          {language === 'ar'
            ? 'عرض ' + filteredContracts.length + ' من ' + (contracts || []).length + ' عقد'
            : 'Showing ' + filteredContracts.length + ' of ' + (contracts || []).length + ' contracts'}
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
                label: language === 'ar' ? c.arabicName || c.name || `#${c.id}` : c.name || c.arabicName || `#${c.id}`,
              }))}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ========== CONTRACT DETAILS MODAL ========== */}
      <Modal
        title={t.contractDetails + ': #' + (selectedContract?.id || '')}
        open={showDetailsModal}
        onCancel={() => { setShowDetailsModal(false); setSelectedContract(null); }}
        footer={<Button type="primary" onClick={() => setShowDetailsModal(false)}>{t.close}</Button>}
        width={900}
        destroyOnClose
      >
        {selectedContract && (() => {
          const detailCustomerDisplay =
            language === 'ar'
              ? selectedContract.customerNameAr || selectedContract.customerName || '#' + selectedContract.customerId
              : selectedContract.customerName || selectedContract.customerNameAr || '#' + selectedContract.customerId;
          return (
            <div className={styles.detailsModal}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <div className={styles.modalSection}><h4>{t.customer}</h4><p className={styles.modalValue}>{detailCustomerDisplay}</p></div>
                </Col>
                <Col span={12}>
                  <div className={styles.modalSection}>
                    <h4>{t.type}</h4>
                    <Tag color={getTypeTag(selectedContract.contractType).color}>{getTypeTag(selectedContract.contractType).label}</Tag>
                  </div>
                </Col>
                <Col span={12}>
                  <div className={styles.modalSection}>
                    <h4>{t.status}</h4>
                    <Badge
                      status={getStatusConfig(selectedContract.statusId).color as 'processing' | 'warning' | 'success' | 'error' | 'default'}
                      text={getStatusConfig(selectedContract.statusId).label}
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <div className={styles.modalSection}><h4>{t.musanedNumber}</h4><p className={styles.modalValue}>{selectedContract.musanedContractNumber || '-'}</p></div>
                </Col>
                <Col span={12}>
                  <div className={styles.modalSection}><h4>{t.visaNumber}</h4><p className={styles.modalValue}>{selectedContract.visaNumber || '-'}</p></div>
                </Col>
                <Col span={12}>
                  <div className={styles.modalSection}>
                    <h4>{t.arrivalCity}</h4>
                    <p className={styles.modalValue}>
                      {selectedContract.arrivalDestinationId
                        ? getEnumLabel([...ARRIVAL_DESTINATIONS], selectedContract.arrivalDestinationId, language)
                        : '-'}
                    </p>
                  </div>
                </Col>

                <Col span={24}><Divider>{t.financialInfo}</Divider></Col>

                <Col span={8}><div className={styles.modalSection}><h4>{t.localCost}</h4><p className={styles.modalValue}>{formatCurrency(selectedContract.localCost)}</p></div></Col>
                <Col span={8}><div className={styles.modalSection}><h4>{t.agentCost}</h4><p className={styles.modalValue}>{formatCurrency(selectedContract.agentCostSAR)}</p></div></Col>
                <Col span={8}><div className={styles.modalSection}><h4>{t.salary}</h4><p className={styles.modalValue}>{formatCurrency(selectedContract.salary)}</p></div></Col>
                <Col span={8}><div className={styles.modalSection}><h4>{t.otherCosts}</h4><p className={styles.modalValue}>{formatCurrency(selectedContract.otherCosts)}</p></div></Col>
                <Col span={8}><div className={styles.modalSection}><h4>{t.taxValue}</h4><p className={styles.modalValue}>{formatCurrency(selectedContract.totalTaxValue)}</p></div></Col>
                <Col span={8}><div className={styles.modalSection}><h4>{t.managerDiscount}</h4><p className={styles.modalValue} style={{ color: '#ff4d4f' }}>-{formatCurrency(selectedContract.managerDiscount)}</p></div></Col>
                <Col span={8}><div className={styles.modalSection}><h4>{t.costDiscount}</h4><p className={styles.modalValue} style={{ color: '#ff4d4f' }}>-{formatCurrency(selectedContract.costDiscount)}</p></div></Col>
                <Col span={8}><div className={styles.modalSection}><h4>{t.totalCost}</h4><p className={styles.modalValue} style={{ color: '#003366', fontSize: 18 }}>{formatCurrency(selectedContract.totalCost)}</p></div></Col>
                {selectedContract.hasContractInsurance && (
                  <Col span={8}><div className={styles.modalSection}><h4>{t.insuranceCost}</h4><p className={styles.modalValue}>{formatCurrency(selectedContract.domesticWorkerInsurance)}</p></div></Col>
                )}



                {selectedContract.cancelNote && (
                  <>
                    <Col span={24}><Divider>{t.cancelContract}</Divider></Col>
                    <Col span={12}><div className={styles.modalSection}><h4>{t.cancelBy}</h4><p className={styles.modalValue}>{getEnumLabel([...CANCEL_BY], selectedContract.cancelBy, language)}</p></div></Col>
                    <Col span={12}><div className={styles.modalSection}><h4>{t.cancelNote}</h4><p className={styles.modalValue}>{selectedContract.cancelNote}</p></div></Col>
                  </>
                )}
              </Row>
            </div>
          );
        })()}
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
        destroyOnClose
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
        destroyOnClose
      >
        <Form form={signForm} layout="vertical">
          <Form.Item
            name="musanedContractNumber"
            label={t.musanedNumber}
            rules={[{ required: true, message: language === 'ar' ? 'مطلوب' : 'Required' }]}
          >
            <Input placeholder={t.musanedNumber} />
          </Form.Item>
          <Form.Item name="musanedDocumentationNumber" label={t.musanedDocNumber}>
            <Input placeholder={t.musanedDocNumber} />
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
        destroyOnClose
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
        destroyOnClose
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
        destroyOnClose
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
        destroyOnClose
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

      {/* ========== STATUS HISTORY MODAL ========== */}
      <Modal
        title={`${t.statusHistory} — #${selectedContract?.id || ''}`}
        open={showStatusHistoryModal}
        onCancel={() => { setShowStatusHistoryModal(false); setSelectedContract(null); }}
        footer={<Button type="primary" onClick={() => setShowStatusHistoryModal(false)}>{t.close}</Button>}
        width={700}
        destroyOnClose
      >
        {isLoadingHistory ? (
          <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
        ) : statusHistory.length > 0 ? (
          <List
            dataSource={statusHistory}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <span>
                      <Tag color="default">{item.oldStatusName || '—'}</Tag>
                      {' → '}
                      <Tag color="blue">{item.newStatusName || '—'}</Tag>
                    </span>
                  }
                  description={
                    <div>
                      {item.notes && <div>{item.notes}</div>}
                      <div style={{ color: '#888', fontSize: 12 }}>
                        {item.createdByName && <span>{t.changedBy}: {item.createdByName} · </span>}
                        {formatDate(item.createdAt)}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description={language === 'ar' ? 'لا يوجد سجل حالات' : 'No status history'} />
        )}
      </Modal>
    </div>
  );
}
