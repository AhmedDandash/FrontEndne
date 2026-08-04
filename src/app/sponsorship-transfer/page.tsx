'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Row,
  Col,
  Button,
  Select,
  Input,
  Empty,
  Pagination,
  Statistic,
  Modal,
  Form,
  Spin,
  InputNumber,
  Avatar,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  UserOutlined,
  FileDoneOutlined,
  CalendarOutlined,
  FileTextOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  SendOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  TeamOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { AdvancedFilterPanel, BranchFilterSelect, DateRangeFilter, ExportButton } from '@/components/filters';
import { API_ENDPOINTS } from '@/config/api.config';
import {
  useTransferContracts,
  useTransferContract,
  useCreateTransferContract,
  useDeleteTransferContract,
  useSignTransferContract,
  useCompleteTransferContract,
  useUpdateTransferContractAuthorityStatus,
} from '@/hooks/api/useTransferContracts';
import { useCreateComplaint } from '@/hooks/api/useComplaints';
import { useCustomers } from '@/hooks/api/useCustomers';
import { useMarketers } from '@/hooks/api/useMarketers';
import {
  TRANSFER_CONTRACT_STATUS,
  PAYMENT_MEANS_CODE_TYPE,
  COMPLAINT_SOURCE,
  COMPLAINT_PRIORITY,
  getEnumLabel,
  toSelectOptions,
} from '@/constants/enums';
import type {
  CreateTransferContractDto,
  TransferContractListItem,
  CreateComplaintDto,
} from '@/types/api.types';
import styles from './SponsorshipTransfer.module.css';
import { useWorkersWantsTransfer } from '@/hooks/api/useWorkers';
import { formatCurrency, formatDate, getStatusConfig } from './_lib/format';

const { TextArea } = Input;

// ────────────────────────────────────────────────────────────────────────────
// Translations
// ────────────────────────────────────────────────────────────────────────────
const TR: Record<string, Record<'ar' | 'en', string>> = {
  pageTitle:          { ar: 'عقود نقل الكفالة',              en: 'Sponsorship Transfer Contracts' },
  pageSubtitle:       { ar: 'إدارة جميع عقود نقل الكفالة',   en: 'Manage all sponsorship transfer contracts' },
  addContract:        { ar: 'إضافة عقد',                     en: 'Add Contract' },
  refresh:            { ar: 'تحديث',                          en: 'Refresh' },
  search:             { ar: 'بحث برقم العقد أو اسم العميل...',en: 'Search by contract number or customer...' },
  allStatuses:        { ar: 'جميع الحالات',                   en: 'All Statuses' },
  totalContracts:     { ar: 'إجمالي العقود',                  en: 'Total Contracts' },
  draftContracts:     { ar: 'مسودة',                          en: 'Draft' },
  completedContracts: { ar: 'تم النقل',                       en: 'Completed' },
  rejectedContracts:  { ar: 'مرفوض',                         en: 'Rejected' },
  customerName:       { ar: 'العميل',                         en: 'Customer' },
  workerName:         { ar: 'العامل',                         en: 'Worker' },
  contractNumber:     { ar: 'رقم العقد',                      en: 'Contract #' },
  creationDate:       { ar: 'تاريخ الإنشاء',                  en: 'Created On' },
  createdBy:          { ar: 'بواسطة',                         en: 'Created By' },
  totalAmount:        { ar: 'الإجمالي',                       en: 'Total' },
  paidAmount:         { ar: 'المدفوع',                        en: 'Paid' },
  remainingAmount:    { ar: 'المتبقي',                        en: 'Remaining' },
  trialPeriod:        { ar: 'فترة التجربة',                   en: 'Trial Period' },
  trialDays:          { ar: 'يوم',                            en: 'Days' },
  transferDate:       { ar: 'تاريخ النقل',                    en: 'Transfer Date' },
  addComplaint:       { ar: 'إضافة شكوى',                     en: 'Add Complaint' },
  cancel:             { ar: 'إلغاء',                          en: 'Cancel' },
  close:              { ar: 'إغلاق',                          en: 'Close' },
  deleteContract:     { ar: 'حذف العقد',                      en: 'Delete Contract' },
  sign:               { ar: 'توقيع العقد',                    en: 'Sign Contract' },
  complete:           { ar: 'إتمام العقد',                    en: 'Complete Contract' },
  sendToAuthority:    { ar: 'حالة الجهة',                     en: 'Authority Status' },
  noContracts:        { ar: 'لا توجد عقود',                   en: 'No Contracts Found' },
  loading:            { ar: 'جاري التحميل...',                en: 'Loading...' },
  save:               { ar: 'حفظ',                            en: 'Save' },
  transferFees:       { ar: 'رسوم النقل',                     en: 'Transfer Fees' },
  governmentFees:     { ar: 'الرسوم الحكومية',                en: 'Government Fees' },
  paymentType:        { ar: 'نوع السداد',                     en: 'Payment Type' },
  notes:              { ar: 'ملاحظات',                        en: 'Notes' },
  marketer:           { ar: 'المسوق',                         en: 'Marketer' },
  worker:             { ar: 'العامل',                         en: 'Worker' },
  customer:           { ar: 'العميل',                         en: 'Customer' },
  priority:           { ar: 'الأولوية',                       en: 'Priority' },
  complaintSource:    { ar: 'مصدر الشكوى',                    en: 'Complaint Source' },
  authorityStatus:    { ar: 'حالة الجهة',                     en: 'Authority Status' },
  authorityNote:      { ar: 'ملاحظة',                         en: 'Note' },
  contractDetails:    { ar: 'تفاصيل العقد',                   en: 'Contract Details' },
  financialInfo:      { ar: 'المعلومات المالية',               en: 'Financial Info' },
  confirmDeleteTitle: { ar: 'حذف عقد نقل الكفالة',            en: 'Delete Transfer Contract' },
  confirmDeleteText:  {
    ar: 'هل أنت متأكد من حذف هذا العقد؟ لا يمكن التراجع عن هذا الإجراء.',
    en: 'Are you sure you want to delete this contract? This action cannot be undone.',
  },
  confirmSignTitle: { ar: 'توقيع العقد', en: 'Sign Contract' },
  confirmSignText:  {
    ar: 'بعد التوقيع سيتحول العقد إلى حالة "تم نقل الكفالة" ولا يمكن التراجع.',
    en: 'Signing will move the contract to "Transfer Completed" and cannot be undone.',
  },
  sar:             { ar: 'ر.س',    en: 'SAR' },
  showing:         { ar: 'عرض',    en: 'Showing' },
  of:              { ar: 'من',     en: 'of' },
  contracts:       { ar: 'عقد',    en: 'contracts' },
  allCustomers:    { ar: 'جميع العملاء', en: 'All Customers' },
  allWorkers:      { ar: 'جميع العمال',  en: 'All Workers' },
  allMarketers:    { ar: 'جميع المسوقين', en: 'All Marketers' },
};

function useT() {
  const language = useAuthStore((s) => s.language);
  return (key: string) => TR[key]?.[language] ?? key;
}

// ────────────────────────────────────────────────────────────────────────────
// Action modals — Complaint, Authority Status
// ────────────────────────────────────────────────────────────────────────────
function ComplaintModal({
  contractId,
  open,
  onClose,
}: {
  contractId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const t        = useT();
  const language = useAuthStore((s) => s.language);
  const isAr     = language === 'ar';
  const [form]   = Form.useForm();
  const mutation = useCreateComplaint();
  const { data: contract } = useTransferContract(open ? contractId : null);

  const handleOk = async () => {
    const values = await form.validateFields();
    const dto: CreateComplaintDto = {
      source:     values.source,
      priority:   values.priority,
      customerId: contract?.customerId ?? undefined,
      workerId:   contract?.workerId   ?? undefined,
      notesAr:    values.notesAr ?? null,
    };
    mutation.mutate(dto, {
      onSuccess: () => { form.resetFields(); onClose(); },
    });
  };

  return (
    <Modal
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ff4d4f' }}>
          <WarningOutlined /> {t('addComplaint')}
        </span>
      }
      open={open}
      onOk={handleOk}
      onCancel={() => { form.resetFields(); onClose(); }}
      okText={t('save')}
      cancelText={t('cancel')}
      confirmLoading={mutation.isPending}
      width={500}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
        <Form.Item
          name="source"
          label={t('complaintSource')}
          rules={[{ required: true, message: isAr ? 'مصدر الشكوى مطلوب' : 'Required' }]}
        >
          <Select placeholder={t('complaintSource')} options={toSelectOptions(COMPLAINT_SOURCE, language)} />
        </Form.Item>
        <Form.Item
          name="priority"
          label={t('priority')}
          rules={[{ required: true, message: isAr ? 'الأولوية مطلوبة' : 'Required' }]}
        >
          <Select placeholder={t('priority')} options={toSelectOptions(COMPLAINT_PRIORITY, language)} />
        </Form.Item>
        <Form.Item name="notesAr" label={t('notes')}>
          <TextArea rows={4} placeholder={t('notes')} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function AuthorityModal({
  contractId,
  open,
  onClose,
}: {
  contractId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const t        = useT();
  const language = useAuthStore((s) => s.language);
  const isAr     = language === 'ar';
  const [form]   = Form.useForm();
  const mutation = useUpdateTransferContractAuthorityStatus();

  const handleOk = async () => {
    const values = await form.validateFields();
    mutation.mutate(
      { id: contractId!, status: values.status, note: values.note },
      { onSuccess: () => { form.resetFields(); onClose(); } }
    );
  };

  return (
    <Modal
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SendOutlined /> {t('sendToAuthority')}
        </span>
      }
      open={open}
      onOk={handleOk}
      onCancel={() => { form.resetFields(); onClose(); }}
      okText={t('save')}
      cancelText={t('cancel')}
      confirmLoading={mutation.isPending}
      width={480}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
        <Form.Item
          name="status"
          label={t('authorityStatus')}
          rules={[{ required: true, message: isAr ? 'الحالة مطلوبة' : 'Required' }]}
        >
          <Select
            placeholder={t('authorityStatus')}
            options={[
              { value: 4, label: isAr ? 'أُرسل للجهات المختصة' : 'Sent To Authorities' },
              { value: 5, label: isAr ? 'مقبول'               : 'Approved' },
              { value: 6, label: isAr ? 'مرفوض'               : 'Rejected' },
            ]}
          />
        </Form.Item>
        <Form.Item name="note" label={t('authorityNote')}>
          <TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Create Contract Modal
// ────────────────────────────────────────────────────────────────────────────
function CreateTransferModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const language = useAuthStore((s) => s.language);
  const isAr = language === 'ar';
  const [form] = Form.useForm();
  const createMutation = useCreateTransferContract();

  const { customers }         = useCustomers();
  const { data: workers }     = useWorkersWantsTransfer();
  const { data: marketers }   = useMarketers();

  const transferFees   = Form.useWatch('transferFees',   form) ?? 0;
  const governmentFees = Form.useWatch('governmentFees', form) ?? 0;

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const dto: CreateTransferContractDto = {
      customerId:             values.customerId,
      workerId:               values.workerId,
      marketerId:             values.marketerId ?? null,
      transferFees:           values.transferFees  ?? 0,
      governmentFees:         values.governmentFees ?? 0,
      totalAmount:            (values.transferFees ?? 0) + (values.governmentFees ?? 0),
      paymentMeansCodeTypeId: values.paymentMeansCodeTypeId,
      trialPeriodDays:        values.trialPeriodDays ?? 90,
      notes:                  values.notes ?? null,
      // Scope to the creator's branch (backend falls back to JWT branchId).
      branchId:               useAuthStore.getState().branchId ?? undefined,
    };
    createMutation.mutate(dto, {
      onSuccess: () => { form.resetFields(); onClose(); },
    });
  };

  const customerOpts = (customers ?? []).map((c: any) => ({
    value: c.id,
    label: (isAr ? c.arabicName : c.englishName) || c.arabicName || c.englishName || `#${c.id}`,
  }));
  const workerOpts = (workers ?? []).map((w) => ({
    value: w.id,
    label: w.name || `#${w.id}`,
  }));
  const marketerOpts = (marketers ?? []).map((m: any) => ({
    value: m.id,
    label: (isAr ? m.nameAr : m.nameEn) || m.nameAr || m.nameEn || `#${m.id}`,
  }));

  return (
    <Modal
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#003366' }}>
          <PlusOutlined /> {t('addContract')}
        </span>
      }
      open={open}
      onOk={handleSubmit}
      onCancel={() => { form.resetFields(); onClose(); }}
      okText={t('save')}
      cancelText={t('cancel')}
      confirmLoading={createMutation.isPending}
      width={700}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Row gutter={[16, 0]}>
          <Col xs={24} md={12}>
            <Form.Item
              name="customerId"
              label={t('customer')}
              rules={[{ required: true, message: isAr ? 'العميل مطلوب' : 'Required' }]}
            >
              <Select
                showSearch
                placeholder={t('customer')}
                options={customerOpts}
                filterOption={(inp, opt) =>
                  String(opt?.label ?? '').toLowerCase().includes(inp.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="workerId"
              label={t('worker')}
              rules={[{ required: true, message: isAr ? 'العامل مطلوب' : 'Required' }]}
            >
              <Select
                showSearch
                placeholder={t('worker')}
                options={workerOpts}
                filterOption={(inp, opt) =>
                  String(opt?.label ?? '').toLowerCase().includes(inp.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="marketerId" label={t('marketer')}>
              <Select
                showSearch
                allowClear
                placeholder={t('marketer')}
                options={marketerOpts}
                filterOption={(inp, opt) =>
                  String(opt?.label ?? '').toLowerCase().includes(inp.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="paymentMeansCodeTypeId"
              label={t('paymentType')}
              rules={[{ required: true, message: isAr ? 'نوع السداد مطلوب' : 'Required' }]}
            >
              <Select
                placeholder={t('paymentType')}
                options={toSelectOptions(PAYMENT_MEANS_CODE_TYPE, language)}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="transferFees"
              label={t('transferFees')}
              rules={[{ required: true, message: isAr ? 'الرسوم مطلوبة' : 'Required' }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="0" addonAfter={t('sar')} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="governmentFees"
              label={t('governmentFees')}
              rules={[{ required: true, message: isAr ? 'الرسوم مطلوبة' : 'Required' }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="0" addonAfter={t('sar')} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label={t('totalAmount')}>
              <InputNumber
                style={{ width: '100%' }}
                value={transferFees + governmentFees}
                disabled
                addonAfter={t('sar')}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="trialPeriodDays" label={t('trialPeriod')} initialValue={90}>
              <InputNumber style={{ width: '100%' }} min={0} addonAfter={t('trialDays')} />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item name="notes" label={t('notes')}>
              <TextArea rows={3} placeholder={t('notes')} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Single Contract Card (mediation-style)
// ────────────────────────────────────────────────────────────────────────────
function ContractCard({
  contract,
  language,
  onViewDetails,
  onSign,
  onComplete,
  onAuthority,
  onComplaint,
  onDelete,
  isSignPending,
  isCompletePending,
  isDeletePending,
}: {
  contract: TransferContractListItem;
  language: 'ar' | 'en';
  onViewDetails: () => void;
  onSign: () => void;
  onComplete: () => void;
  onAuthority: () => void;
  onComplaint: () => void;
  onDelete: () => void;
  isSignPending: boolean;
  isCompletePending: boolean;
  isDeletePending: boolean;
}) {
  const t      = useT();
  const status = contract.contractStatus ?? 1;
  void language;
  const cfg    = getStatusConfig(status);
  const isDraft    = status === 1;
  const isApproved = status === 5;

  const paid      = (contract as any).paidAmount ?? 0;
  const remaining = (contract.totalAmount ?? 0) - paid;

  return (
    <Col xs={24}>
      <Card className={styles.contractCard} hoverable>
        <div className={styles.cardContent}>

          {/* ── Left: people + contract header ── */}
          <div className={styles.cardLeft}>
            {/* Header row */}
            <div className={styles.cardHeader}>
              <div className={styles.contractNumber}>
                <FileTextOutlined className={styles.contractIcon} />
                <span>#{contract.contractNumber ?? '—'}</span>
              </div>
              <Badge
                status={cfg.color}
                text={getEnumLabel(TRANSFER_CONTRACT_STATUS, status, language)}
              />
            </div>

            {/* Customer box */}
            <div className={styles.personSection}>
              <Avatar size={40} icon={<UserOutlined />} className={styles.personAvatar} />
              <div className={styles.personDetails}>
                <span className={styles.personRole}>{t('customerName')}</span>
                <span className={styles.personName}>{contract.customerName ?? '—'}</span>
              </div>
            </div>

            {/* Worker box */}
            <div className={styles.personSection}>
              <Avatar size={40} icon={<TeamOutlined />} className={styles.workerAvatar} />
              <div className={styles.personDetails}>
                <span className={styles.personRole}>{t('workerName')}</span>
                <span className={styles.personName}>{contract.workerName ?? '—'}</span>
              </div>
            </div>
          </div>

          {/* ── Right: financial panel ── */}
          <div className={styles.cardRight}>
            {/* Total cost banner */}
            <div className={styles.totalCostBanner}>
              <div className={styles.totalCostMeta}>
                <DollarOutlined className={styles.totalCostIcon} />
                <span className={styles.totalCostLabel}>{t('totalAmount')}</span>
              </div>
              <div className={styles.totalCostAmount}>
                {formatCurrency(contract.totalAmount, language)}
              </div>
            </div>

            {/* Paid / remaining breakdown */}
            <div className={styles.feeBreakdown}>
              <div className={styles.feeRow}>
                <span className={styles.feeDot} style={{ background: '#00aa64' }} />
                <span className={styles.feeLabel}>{t('paidAmount')}</span>
                <span className={styles.feeValue} style={{ color: '#00aa64' }}>
                  {formatCurrency(paid, language)}
                </span>
              </div>
              <div className={styles.feeRow}>
                <span className={styles.feeDot} style={{ background: remaining > 0 ? '#ff4d4f' : '#00aa64' }} />
                <span className={styles.feeLabel}>{t('remainingAmount')}</span>
                <span className={styles.feeValue} style={{ color: remaining > 0 ? '#ff4d4f' : '#00aa64' }}>
                  {formatCurrency(remaining, language)}
                </span>
              </div>
            </div>

            {/* Creation date */}
            {contract.createdDate && (
              <div className={styles.dateChip}>
                <CalendarOutlined />
                <span>{formatDate(contract.createdDate, language)}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom: action buttons ── */}
        <div className={styles.cardBottom}>
          <div className={styles.actionsList}>
            <Button
              type="link"
              icon={<EyeOutlined />}
              className={styles.actionBtn}
              block
              onClick={onViewDetails}
            >
              {t('contractDetails')}
            </Button>

            {isDraft && (
              <Button
                type="link"
                icon={<EditOutlined />}
                className={[styles.actionBtn, styles.successBtn].join(' ')}
                block
                loading={isSignPending}
                onClick={onSign}
              >
                {t('sign')}
              </Button>
            )}

            {isApproved && (
              <Button
                type="link"
                icon={<CheckCircleOutlined />}
                className={[styles.actionBtn, styles.successBtn].join(' ')}
                block
                loading={isCompletePending}
                onClick={onComplete}
              >
                {t('complete')}
              </Button>
            )}

            <Button
              type="link"
              icon={<SendOutlined />}
              className={styles.actionBtn}
              block
              onClick={onAuthority}
            >
              {t('sendToAuthority')}
            </Button>

            <Button
              type="link"
              icon={<WarningOutlined />}
              className={styles.actionBtn}
              block
              onClick={onComplaint}
            >
              {t('addComplaint')}
            </Button>

            {isDraft && (
              <Button
                type="link"
                icon={<DeleteOutlined />}
                className={[styles.actionBtn, styles.dangerBtn].join(' ')}
                block
                loading={isDeletePending}
                onClick={onDelete}
              >
                {t('deleteContract')}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </Col>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────────────────────────────────
export default function SponsorshipTransferPage() {
  const t        = useT();
  const language = useAuthStore((s) => s.language);
  const router   = useRouter();

  const [searchText,    setSearchText]    = useState('');
  const [statusFilter,  setStatusFilter]  = useState<string>('all');
  const [branchId,      setBranchId]      = useState<string | undefined>(undefined);
  const [includeSubBranches, setIncludeSubBranches] = useState(true);
  const [dateRange, setDateRange] = useState<[string | undefined, string | undefined]>([
    undefined,
    undefined,
  ]);
  const [updatedDateRange, setUpdatedDateRange] = useState<[string | undefined, string | undefined]>([
    undefined,
    undefined,
  ]);
  const [customerFilter, setCustomerFilter] = useState<string | 'all'>('all');
  const [workerFilter,   setWorkerFilter]   = useState<string | 'all'>('all');
  const [marketerFilter, setMarketerFilter] = useState<string | 'all'>('all');
  const [currentPage,   setCurrentPage]   = useState(1);
  const [pageSize,      setPageSize]      = useState(10);
  const [createModal,   setCreateModal]   = useState(false);

  // per-card modal state (one at a time)
  const [complaintId, setComplaintId] = useState<string | null>(null);
  const [authorityId, setAuthorityId] = useState<string | null>(null);

  const isAr = language === 'ar';
  const { customers: filterCustomers } = useCustomers();
  const { data: filterWorkers } = useWorkersWantsTransfer();
  const { data: filterMarketers } = useMarketers();

  const customerFilterOpts = useMemo(
    () =>
      (filterCustomers ?? []).map((c: any) => ({
        value: String(c.id),
        label: (isAr ? c.arabicName : c.englishName) || c.arabicName || c.englishName || `#${c.id}`,
      })),
    [filterCustomers, isAr]
  );
  const workerFilterOpts = useMemo(
    () => (filterWorkers ?? []).map((w) => ({ value: String(w.id), label: w.name || `#${w.id}` })),
    [filterWorkers]
  );
  const marketerFilterOpts = useMemo(
    () =>
      (filterMarketers ?? []).map((m: any) => ({
        value: String(m.id),
        label: (isAr ? m.nameAr : m.nameEn) || m.nameAr || m.nameEn || `#${m.id}`,
      })),
    [filterMarketers, isAr]
  );

  // All filters are applied server-side (TransferContractQuery).
  const transferParams = useMemo(
    () => ({
      pageNumber: currentPage,
      pageSize,
      search: searchText || undefined,
      branchId,
      includeSubBranches: branchId ? includeSubBranches : undefined,
      contractStatus: statusFilter !== 'all' ? Number(statusFilter) : undefined,
      createdDateFrom: dateRange[0],
      createdDateTo: dateRange[1],
      updatedDateFrom: updatedDateRange[0],
      updatedDateTo: updatedDateRange[1],
      customerId: customerFilter === 'all' ? undefined : customerFilter,
      workerId: workerFilter === 'all' ? undefined : workerFilter,
      marketerId: marketerFilter === 'all' ? undefined : marketerFilter,
    }),
    [
      currentPage,
      pageSize,
      searchText,
      branchId,
      includeSubBranches,
      statusFilter,
      dateRange,
      updatedDateRange,
      customerFilter,
      workerFilter,
      marketerFilter,
    ]
  );

  const { data, isLoading, refetch } = useTransferContracts(transferParams);
  const contracts: TransferContractListItem[] = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;

  const signMutation     = useSignTransferContract();
  const completeMutation = useCompleteTransferContract();
  const deleteMutation   = useDeleteTransferContract();

  // Status is now filtered server-side; render the returned page directly.
  const filteredContracts = contracts;

  const stats = useMemo(() => ({
    total:     totalCount,
    draft:     contracts.filter((c) => c.contractStatus === 1).length,
    completed: contracts.filter((c) => c.contractStatus === 8).length,
    rejected:  contracts.filter((c) => c.contractStatus === 6).length,
  }), [contracts, totalCount]);

  // Search, Status, Branch, and Creation Date are quick filters and stay
  // untouched by Clear. Customer/Worker/Marketer/Updated-date are the
  // "advanced" tier — they count toward the badge and reset on Clear.
  const activeFilterCount = [
    customerFilter !== 'all',
    workerFilter !== 'all',
    marketerFilter !== 'all',
    Boolean(updatedDateRange[0]),
  ].filter(Boolean).length;

  const clearAdvancedFilters = () => {
    setCustomerFilter('all');
    setWorkerFilter('all');
    setMarketerFilter('all');
    setUpdatedDateRange([undefined, undefined]);
    setCurrentPage(1);
  };

  const handleSign = (id: string) => {
    Modal.confirm({
      title:   t('confirmSignTitle'),
      icon:    <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      content: t('confirmSignText'),
      okText:     t('sign'),
      cancelText: t('cancel'),
      onOk: () => signMutation.mutate(id),
    });
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title:   t('confirmDeleteTitle'),
      icon:    <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: t('confirmDeleteText'),
      okText:         t('deleteContract'),
      cancelText:     t('cancel'),
      okButtonProps:  { danger: true },
      onOk: () => deleteMutation.mutate(id),
    });
  };

  return (
    <div className={styles.transferPage}>

      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerTitle}>
            <FileDoneOutlined className={styles.headerIcon} />
            <div>
              <h1>{t('pageTitle')}</h1>
              <p className={styles.headerSubtitle}>{t('pageSubtitle')}</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button
              icon={<ReloadOutlined />}
              className={styles.secondaryBtn}
              onClick={() => refetch()}
            >
              {t('refresh')}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className={styles.primaryBtn}
              onClick={() => setCreateModal(true)}
            >
              {t('addContract')}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Statistics ── */}
      <Row gutter={[16, 16]} className={styles.statisticsRow}>
        <Col xs={12} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={t('totalContracts')}
              value={stats.total}
              prefix={<FileTextOutlined style={{ color: '#003366' }} />}
              valueStyle={{ color: '#003366' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={t('draftContracts')}
              value={stats.draft}
              prefix={<EditOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={t('completedContracts')}
              value={stats.completed}
              prefix={<CheckCircleOutlined style={{ color: '#00aa64' }} />}
              valueStyle={{ color: '#00aa64' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={t('rejectedContracts')}
              value={stats.rejected}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* ── Filters ── */}
      <AdvancedFilterPanel
        activeCount={activeFilterCount}
        onClear={clearAdvancedFilters}
        contentLayout="block"
        actions={
          <ExportButton
            endpoint={API_ENDPOINTS.TRANSFER_CONTRACT.EXPORT}
            filters={transferParams}
            fileName="TransferContracts.xlsx"
          />
        }
        quickFilters={
          <>
            <Input
              placeholder={t('search')}
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }}
              allowClear
              size="large"
              className={styles.searchInput}
            />
            <Select
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}
              style={{ width: 200 }}
              size="large"
              options={[
                { value: 'all', label: t('allStatuses') },
                ...toSelectOptions(TRANSFER_CONTRACT_STATUS, language).map((o) => ({
                  ...o,
                  value: String(o.value),
                })),
              ]}
            />
            <BranchFilterSelect
              value={branchId}
              onChange={(v) => { setBranchId(v); setCurrentPage(1); }}
              includeSubBranches={includeSubBranches}
              onIncludeSubBranchesChange={setIncludeSubBranches}
            />
            <DateRangeFilter
              value={dateRange}
              onChange={(range) => { setDateRange(range); setCurrentPage(1); }}
              placeholder={['أُنشئ من', 'إلى']}
            />
          </>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{t('allCustomers')}</label>
            <Select
              value={customerFilter}
              onChange={(v) => { setCustomerFilter(v); setCurrentPage(1); }}
              style={{ width: '100%' }}
              size="large"
              showSearch
              optionFilterProp="label"
              options={[{ value: 'all', label: t('allCustomers') }, ...customerFilterOpts]}
            />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{t('allWorkers')}</label>
            <Select
              value={workerFilter}
              onChange={(v) => { setWorkerFilter(v); setCurrentPage(1); }}
              style={{ width: '100%' }}
              size="large"
              showSearch
              optionFilterProp="label"
              options={[{ value: 'all', label: t('allWorkers') }, ...workerFilterOpts]}
            />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{t('allMarketers')}</label>
            <Select
              value={marketerFilter}
              onChange={(v) => { setMarketerFilter(v); setCurrentPage(1); }}
              style={{ width: '100%' }}
              size="large"
              showSearch
              optionFilterProp="label"
              options={[{ value: 'all', label: t('allMarketers') }, ...marketerFilterOpts]}
            />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>
              {language === 'ar' ? 'تاريخ آخر تحديث' : 'Updated date'}
            </label>
            <DateRangeFilter
              value={updatedDateRange}
              onChange={(range) => { setUpdatedDateRange(range); setCurrentPage(1); }}
              placeholder={['حُدّث من', 'إلى']}
              style={{ width: '100%' }}
            />
          </Col>
        </Row>
      </AdvancedFilterPanel>

      {/* Results count */}
      <div className={styles.resultsInfo}>
        {language === 'ar'
          ? `عرض ${filteredContracts.length} من ${contracts.length} عقد`
          : `Showing ${filteredContracts.length} of ${contracts.length} contracts`}
      </div>

      {/* ── Contract List ── */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
          <Spin size="large" />
        </div>
      ) : filteredContracts.length === 0 ? (
        <Card className={styles.emptyCard}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('noContracts')} />
        </Card>
      ) : (
        <Row gutter={[16, 16]} className={styles.contractsGrid}>
          {filteredContracts.map((contract) => (
            <ContractCard
              key={contract.id}
              contract={contract}
              language={language}
              onViewDetails={() => router.push(`/sponsorship-transfer/${contract.id}`)}
              onSign={() => handleSign(contract.id)}
              onComplete={() => completeMutation.mutate(contract.id)}
              onAuthority={() => setAuthorityId(contract.id)}
              onComplaint={() => setComplaintId(contract.id)}
              onDelete={() => handleDelete(contract.id)}
              isSignPending={signMutation.isPending}
              isCompletePending={completeMutation.isPending}
              isDeletePending={deleteMutation.isPending}
            />
          ))}
        </Row>
      )}

      {/* ── Pagination ── */}
      {!isLoading && totalCount > 0 && (
        <div className={styles.paginationWrapper}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalCount}
            onChange={(page, size) => { setCurrentPage(page); setPageSize(size); }}
            showSizeChanger
            showTotal={(total) => `${t('totalContracts')}: ${total}`}
            pageSizeOptions={[10, 20, 50]}
          />
        </div>
      )}

      {/* ── Modals ── */}
      <ComplaintModal
        contractId={complaintId}
        open={!!complaintId}
        onClose={() => setComplaintId(null)}
      />

      <AuthorityModal
        contractId={authorityId}
        open={!!authorityId}
        onClose={() => setAuthorityId(null)}
      />

      <CreateTransferModal open={createModal} onClose={() => setCreateModal(false)} />
    </div>
  );
}
