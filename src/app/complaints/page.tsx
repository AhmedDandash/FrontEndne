'use client';

import React, { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import {
  Input,
  Select,
  Statistic,
  Row,
  Col,
  Empty,
  Pagination,
  Button,
  Modal,
  Form,
  Spin,
  Dropdown,
  Tabs,
  DatePicker,
  Tooltip,
  Divider,
  Tag,
  List,
  Upload,
  message,
} from 'antd';
import type { FormInstance, MenuProps } from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  PauseCircleOutlined,
  FileAddOutlined,
  EyeOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  useComplaints,
  useCreateComplaint,
  useDeleteComplaint,
  useFinishComplaint,
  useToggleHoldComplaint,
  useAddComplaintUpdate,
  useAddIssue,
  useComplaintIssues,
} from '@/hooks/api/useComplaints';
import { useCustomers } from '@/hooks/api/useCustomers';
import { useWorkers } from '@/hooks/api/useWorkers';
import { useAgents } from '@/hooks/api/useAgents';
import { useEmploymentOperatingContracts } from '@/hooks/api/useEmploymentOperatingContracts';
import {
  COMPLAINT_SOURCE,
  COMPLAINT_PRIORITY,
  COMPLAINT_STATUS,
  WORKER_LOCATION,
  CONTRACT_TYPE,
  SUBMISSION_AUTHORITY,
  ISSUE_STATUS,
  getEnumLabel,
  toSelectOptions,
} from '@/constants/enums';
import type {
  Complaint,
  CreateComplaintDto,
  CreateComplaintUpdateDto,
  AddIssueDto,
} from '@/types/api.types';
import styles from './Complaints.module.css';

const { TextArea } = Input;

// Derive a numeric status from the boolean flags returned by the API
const getComplaintStatus = (complaint: Complaint): number => {
  if (complaint.isFinish) return COMPLAINT_STATUS[1].value; // 2 = Closed
  if (complaint.ishold) return COMPLAINT_STATUS[2].value; // 3 = On Hold
  return COMPLAINT_STATUS[0].value; // 1 = Open
};

// source values (COMPLAINT_SOURCE enum — new API):
// 1 = Customer → show Customer selector
// 2 = Worker   → show Worker + WorkerLocation
// 3,4,5,6      → show ContractType + ContractId + WorkerLocation
const CUSTOMER_FROM = COMPLAINT_SOURCE.find((o) => o.labelEn === 'From Customer')!.value; // 1
const WORKER_FROM = COMPLAINT_SOURCE.find((o) => o.labelEn === 'From Worker')!.value; // 2
const CONTRACT_SOURCES = COMPLAINT_SOURCE.filter(
  (o) => !['From Customer', 'From Worker'].includes(o.labelEn)
).map((o) => o.value); // [3, 4, 5, 6]

interface ComplaintFormProps {
  form: FormInstance;
  language: 'ar' | 'en';
  isArabic: boolean;
  t: (key: string) => string;
}

function ComplaintForm({ form, language, isArabic, t }: ComplaintFormProps) {
  const sourceValue = Form.useWatch('source', form);

  const showCustomer = sourceValue === CUSTOMER_FROM;
  const showWorker = sourceValue === WORKER_FROM;
  const showAgent =
    sourceValue === COMPLAINT_SOURCE.find((o) => o.labelEn === 'From Agent')?.value; // 3 = Agent
  const showContract = CONTRACT_SOURCES.includes(sourceValue);
  const showWorkerLocation = showWorker || showContract || showCustomer;

  // API data
  const { customers = [], isLoading: loadingCustomers } = useCustomers();
  const { data: workers = [], isLoading: loadingWorkers } = useWorkers();
  const { data: agents = [], isLoading: loadingAgents } = useAgents();
  const { contracts = [], isLoading: loadingContracts } = useEmploymentOperatingContracts();

  // Build select options
  const customerOptions = (customers as any[]).map((c) => ({
    value: c.id,
    label: (isArabic ? c.arabicName : c.englishName) || c.arabicName || c.englishName || `#${c.id}`,
  }));

  const workerOptions = (workers as any[]).map((w) => ({
    value: w.id,
    label: (isArabic ? w.fullNameAr : w.fullNameEn) || w.fullNameAr || w.fullNameEn || `#${w.id}`,
  }));

  const agentOptions = (agents as any[]).map((a) => ({
    value: a.id,
    label: (isArabic ? a.agentName : a.agentName) || a.agentName || a.agentName || `#${a.id}`,
  }));

  const contractsArray: any[] = Array.isArray(contracts)
    ? contracts
    : Array.isArray((contracts as any)?.data)
      ? (contracts as any).data
      : [];

  const contractOptions = contractsArray.map((c) => ({
    value: c.id,
    label: c.customerName ? `#${c.id} – ${c.customerName}` : `#${c.id}`,
  }));

  return (
    <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
      <Row gutter={[16, 0]}>
        {/* Complaint Source (replaces old complaintFrom + type) */}
        <Col xs={24} md={12}>
          <Form.Item
            name="source"
            label={t('complaintFrom')}
            rules={[{ required: true, message: isArabic ? 'مطلوب' : 'Required' }]}
          >
            <Select
              placeholder={t('complaintFrom')}
              options={toSelectOptions(COMPLAINT_SOURCE, language)}
            />
          </Form.Item>
        </Col>

        {/* Priority (new field) */}
        <Col xs={24} md={12}>
          <Form.Item
            name="priority"
            label={isArabic ? 'الأولوية' : 'Priority'}
            rules={[{ required: true, message: isArabic ? 'مطلوب' : 'Required' }]}
          >
            <Select
              placeholder={isArabic ? 'اختر الأولوية' : 'Select priority'}
              options={toSelectOptions(COMPLAINT_PRIORITY, language)}
            />
          </Form.Item>
        </Col>

        {/* Customer – visible only when complaintFrom = 1 */}
        {showCustomer && (
          <Col xs={24} md={12}>
            <Form.Item name="customerId" label={isArabic ? 'العميل' : 'Customer'}>
              <Select
                showSearch
                allowClear
                loading={loadingCustomers}
                placeholder={isArabic ? 'اختر العميل' : 'Select customer'}
                options={customerOptions}
                filterOption={(input, option) =>
                  String(option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
        )}

        {/* Worker – visible when complaintFrom = Customer (1) or Worker (5) */}
        {(showCustomer || showWorker) && (
          <Col xs={24} md={12}>
            <Form.Item name="workerId" label={isArabic ? 'العامل' : 'Worker'}>
              <Select
                showSearch
                allowClear
                loading={loadingWorkers}
                placeholder={isArabic ? 'اختر العامل' : 'Select worker'}
                options={workerOptions}
                filterOption={(input, option) =>
                  String(option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
        )}

        {/* Customer – also visible when complaintFrom = Worker (5) */}
        {showWorker && (
          <Col xs={24} md={12}>
            <Form.Item name="customerId" label={isArabic ? 'العميل' : 'Customer'}>
              <Select
                showSearch
                allowClear
                loading={loadingCustomers}
                placeholder={isArabic ? 'اختر العميل' : 'Select customer'}
                options={customerOptions}
                filterOption={(input, option) =>
                  String(option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
        )}

        {/* Agent – visible when complaintFrom = 2 (من الوكيل) */}
        {showAgent && (
          <Col xs={24}>
            <Form.Item name="agentId" label={isArabic ? 'الوكيل' : 'Agent'}>
              <Select
                showSearch
                allowClear
                loading={loadingAgents}
                placeholder={isArabic ? 'اختر الوكيل' : 'Select agent'}
                options={agentOptions}
                filterOption={(input, option) =>
                  String(option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
        )}

        {/* Contract Type + Contract – visible for Agent/Embassy/Ministry/Contract */}
        {showContract && (
          <>
            <Col xs={24} md={12}>
              <Form.Item name="contractType" label={t('contractType')}>
                <Select
                  placeholder={t('contractType')}
                  options={toSelectOptions(CONTRACT_TYPE, language)}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="contractId" label={isArabic ? 'العقد' : 'Contract'}>
                <Select
                  showSearch
                  allowClear
                  loading={loadingContracts}
                  placeholder={isArabic ? 'اختر العقد' : 'Select contract'}
                  options={contractOptions}
                  filterOption={(input, option) =>
                    String(option?.label ?? '')
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
          </>
        )}

        {/* Worker Location – visible for Worker and Contract sources */}
        {showWorkerLocation && (
          <Col xs={24} md={12}>
            <Form.Item name="workerLocation" label={t('workerLocation')}>
              <Select
                placeholder={t('workerLocation')}
                options={toSelectOptions(WORKER_LOCATION, language)}
                allowClear
              />
            </Form.Item>
          </Col>
        )}

        {/* Notes */}
        <Col xs={24} md={12}>
          <Form.Item name="notesAr" label={t('notesAr')}>
            <TextArea rows={3} placeholder={t('notesAr')} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="notesEn" label={t('notesEn')}>
            <TextArea rows={3} placeholder={t('notesEn')} />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}

export default function ComplaintsPage() {
  const { language } = useAuthStore();
  const isArabic = language === 'ar';

  // API hooks
  const { data: complaints = [], isLoading } = useComplaints();
  const createMutation = useCreateComplaint();
  const deleteMutation = useDeleteComplaint();
  const finishMutation = useFinishComplaint();
  const toggleHoldMutation = useToggleHoldComplaint();
  const addUpdateMutation = useAddComplaintUpdate();
  const addIssueMutation = useAddIssue();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [contractTypeFilter, setContractTypeFilter] = useState<string>('all');
  const [complaintFromFilter, setComplaintFromFilter] = useState<string>('all');
  const [workerLocationFilter, setWorkerLocationFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);
  const [form] = Form.useForm();

  // Finish modal state
  const [isFinishModalVisible, setIsFinishModalVisible] = useState(false);
  const [finishingComplaint, setFinishingComplaint] = useState<Complaint | null>(null);
  const [finishForm] = Form.useForm();

  // Add Issue modal state
  const [isIssueModalVisible, setIsIssueModalVisible] = useState(false);
  const [issueComplaint, setIssueComplaint] = useState<Complaint | null>(null);
  const [issueForm] = Form.useForm();

  // View Details modal state
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewingComplaint, setViewingComplaint] = useState<Complaint | null>(null);

  // Translations
  const t = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      ar: {
        complaintsManagement: 'إدارة الشكاوى',
        totalComplaints: 'إجمالي الشكاوى',
        openComplaints: 'شكاوى مفتوحة',
        closedComplaints: 'شكاوى مغلقة',
        pendingComplaints: 'شكاوى معلقة',
        search: 'بحث...',
        status: 'الحالة',
        all: 'الكل',
        contractType: 'نوع العقد',
        complaintFrom: 'الشكوى من',
        complaintType: 'نوع الشكوى',
        workerLocation: 'موقع العامل',
        complaintNumber: 'رقم الشكوى',
        customerName: 'اسم العميل',
        workerName: 'اسم العامل',
        notes: 'الملاحظات',
        notesAr: 'الملاحظات بالعربي',
        notesEn: 'الملاحظات بالإنجليزي',
        noComplaints: 'لا توجد شكاوى',
        of: 'من',
        items: 'عنصر',
        addComplaint: 'إضافة شكوى',
        editComplaint: 'تعديل الشكوى',
        save: 'حفظ',
        cancel: 'إلغاء',
        edit: 'تعديل',
        delete: 'حذف',
        confirmDelete: 'هل أنت متأكد من حذف هذه الشكوى؟',
        deleteTitle: 'حذف الشكوى',
        customerId: 'رقم العميل',
        workerId: 'رقم العامل',
        contractId: 'رقم العقد',
        loading: 'جاري التحميل...',
        finishComplaint: 'إنهاء الشكوى',
        finishNotes: 'ملاحظات الإنهاء',
        finishNotesEn: 'ملاحظات الإنهاء بالإنجليزي',
        finish: 'إنهاء',
        holdComplaint: 'تعليق الشكوى',
        confirmHold: 'هل أنت متأكد من تعليق هذه الشكوى؟',
        addIssue: 'إضافة قضية',
        issueNumber: 'رقم الوارد',
        submissionAuthority: 'جهة التقديم',
        transactionDate: 'تاريخ المعاملة',
        attachment: 'مرفق',
        attachment2: 'مرفق 2',
        viewDetails: 'عرض التفاصيل',
        complaintDetails: 'تفاصيل الشكوى',
        issues: 'القضايا',
        noIssues: 'لا توجد قضايا',
        complaintFinished: 'تم إنهاء الشكوى',
        allTab: 'الكل',
        complaintsTab: 'قضايا',
        transactionsTab: 'معاملات',
        createdAt: 'تاريخ الإنشاء',
        close: 'إغلاق',
      },
      en: {
        complaintsManagement: 'Complaints Management',
        totalComplaints: 'Total Complaints',
        openComplaints: 'Open Complaints',
        closedComplaints: 'Closed Complaints',
        pendingComplaints: 'Pending Complaints',
        search: 'Search...',
        status: 'Status',
        all: 'All',
        contractType: 'Contract Type',
        complaintFrom: 'Complaint From',
        complaintType: 'Complaint Type',
        workerLocation: 'Worker Location',
        complaintNumber: 'Complaint Number',
        customerName: 'Customer Name',
        workerName: 'Worker Name',
        notes: 'Notes',
        notesAr: 'Notes (Arabic)',
        notesEn: 'Notes (English)',
        noComplaints: 'No complaints found',
        of: 'of',
        items: 'items',
        addComplaint: 'Add Complaint',
        editComplaint: 'Edit Complaint',
        save: 'Save',
        cancel: 'Cancel',
        edit: 'Edit',
        delete: 'Delete',
        confirmDelete: 'Are you sure you want to delete this complaint?',
        deleteTitle: 'Delete Complaint',
        customerId: 'Customer ID',
        workerId: 'Worker ID',
        contractId: 'Contract ID',
        loading: 'Loading...',
        finishComplaint: 'Finish Complaint',
        finishNotes: 'Finish Notes',
        finishNotesEn: 'Finish Notes (English)',
        finish: 'Finish',
        holdComplaint: 'Hold Complaint',
        confirmHold: 'Are you sure you want to put this complaint on hold?',
        addIssue: 'Add Issue',
        issueNumber: 'Incoming Number',
        submissionAuthority: 'Submission Authority',
        transactionDate: 'Transaction Date',
        attachment: 'Attachment',
        attachment2: 'Attachment 2',
        viewDetails: 'View Details',
        complaintDetails: 'Complaint Details',
        issues: 'Issues',
        noIssues: 'No issues found',
        complaintFinished: 'Complaint Finished',
        allTab: 'All',
        complaintsTab: 'Cases',
        transactionsTab: 'Transactions',
        createdAt: 'Created At',
        close: 'Close',
      },
    };
    return translations[language][key] || key;
  };

  // Filtered data
  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      const matchesSearch =
        !searchTerm ||
        complaint.id.toString().includes(searchTerm) ||
        (complaint.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (complaint.workerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (complaint.notesAr || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (complaint.notesEn || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || getComplaintStatus(complaint).toString() === statusFilter;
      const matchesContractType =
        contractTypeFilter === 'all' ||
        complaint.relatedContractType?.toString() === contractTypeFilter;
      const matchesComplaintFrom =
        complaintFromFilter === 'all' ||
        complaint.source?.toString() === complaintFromFilter;
      const matchesWorkerLocation =
        workerLocationFilter === 'all' ||
        complaint.workerLocation?.toString() === workerLocationFilter;

      // Tab filter by complaint type
      return (
        matchesSearch &&
        matchesStatus &&
        matchesContractType &&
        matchesComplaintFrom &&
        matchesWorkerLocation
      );
    });
  }, [
    searchTerm,
    statusFilter,
    contractTypeFilter,
    complaintFromFilter,
    workerLocationFilter,
    complaints,
  ]);

  // Pagination
  const paginatedComplaints = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredComplaints.slice(startIndex, startIndex + pageSize);
  }, [filteredComplaints, currentPage, pageSize]);

  // Statistics
  const statistics = useMemo(() => {
    const total = complaints.length;
    const open = complaints.filter((c) => !c.isFinish && !c.ishold).length;
    const closed = complaints.filter((c) => c.isFinish === true).length;
    const pending = complaints.filter((c) => c.ishold === true && c.isFinish !== true).length;
    return { total, open, closed, pending };
  }, [complaints]);

  // Get status badge derived from isFinish / ishold boolean fields
  const getStatusBadge = (complaint: Complaint) => {
    const status = getComplaintStatus(complaint);
    const statusConfig: Record<number, { color: string; icon: React.ReactNode }> = {
      [COMPLAINT_STATUS[0].value]: { color: '#faad14', icon: <ClockCircleOutlined /> }, // Open
      [COMPLAINT_STATUS[1].value]: { color: '#00aa64', icon: <CheckCircleOutlined /> }, // Closed
      [COMPLAINT_STATUS[2].value]: { color: '#8c0000', icon: <WarningOutlined /> }, // On Hold
    };
    const config = statusConfig[status] || statusConfig[COMPLAINT_STATUS[0].value];
    const text = getEnumLabel(COMPLAINT_STATUS, status, language);
    return (
      <span className={styles.statusBadge} style={{ backgroundColor: config.color }}>
        {config.icon} {text}
      </span>
    );
  };

  // Modal handlers
  const handleAdd = () => {
    setEditingComplaint(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (complaint: Complaint) => {
    setEditingComplaint(complaint);
    form.setFieldsValue({
      source: complaint.source,
      priority: complaint.priority,
      customerId: complaint.customerId,
      workerId: complaint.workerId,
      workerLocation: complaint.workerLocation,
      relatedContractType: complaint.relatedContractType,
      relatedContractId: complaint.relatedContractId,
      notesAr: complaint.notesAr,
      notesEn: complaint.notesEn,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (complaint: Complaint) => {
    Modal.confirm({
      title: t('deleteTitle'),
      icon: <ExclamationCircleOutlined />,
      content: t('confirmDelete'),
      okText: t('delete'),
      cancelText: t('cancel'),
      okButtonProps: { danger: true },
      onOk: () => deleteMutation.mutate(complaint.id),
    });
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      // New API has no PUT/update for complaints — create only.
      // Editing mode is disabled; modal is create-only.
      const dto: CreateComplaintDto = values;
      createMutation.mutate(dto, {
        onSuccess: () => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingComplaint(null);
        },
      });
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingComplaint(null);
  };

  // Finish complaint handlers
  const handleFinish = (complaint: Complaint) => {
    setFinishingComplaint(complaint);
    finishForm.resetFields();
    setIsFinishModalVisible(true);
  };

  const handleFinishSubmit = async () => {
    if (!finishingComplaint) return;
    // New API: POST /api/Complaint/{id}/finish — no body, no note.
    finishMutation.mutate(finishingComplaint.id, {
      onSuccess: () => {
        setIsFinishModalVisible(false);
        setFinishingComplaint(null);
      },
    });
  };

  // Hold/unhold complaint handler — new API requires a reason string
  const handleHold = (complaint: Complaint) => {
    let reason = '';
    Modal.confirm({
      title: t('holdComplaint'),
      icon: <PauseCircleOutlined style={{ color: '#8c0000' }} />,
      content: (
        <div>
          <p style={{ marginBottom: 8 }}>{t('confirmHold')}</p>
          <Input
            placeholder={isArabic ? 'سبب التعليق (مطلوب)' : 'Hold reason (required)'}
            onChange={(e) => { reason = e.target.value; }}
          />
        </div>
      ),
      okText: t('holdComplaint'),
      cancelText: t('cancel'),
      okButtonProps: { style: { background: '#8c0000', borderColor: '#8c0000' } },
      onOk: () => {
        if (!reason.trim()) {
          message.warning(isArabic ? 'يرجى إدخال سبب التعليق' : 'Please enter a hold reason');
          return Promise.reject();
        }
        return toggleHoldMutation.mutate({ id: complaint.id, reason });
      },
    });
  };

  // Add Issue handlers
  const handleAddIssue = (complaint: Complaint) => {
    setIssueComplaint(complaint);
    issueForm.resetFields();
    setIsIssueModalVisible(true);
  };

  const handleIssueSubmit = async () => {
    try {
      const values = await issueForm.validateFields();
      if (!issueComplaint) return;

      // New API: multipart/form-data — pass File objects directly (no base64)
      const file1: File | undefined = values.attachmentFile?.[0]?.originFileObj;
      const file2: File | undefined = values.attachmentFile2?.[0]?.originFileObj;

      const dto: AddIssueDto = {
        complaintId: issueComplaint.id,
        incomingNumber: values.incomingNumber || null,
        submissionAuthority: values.submissionAuthority ?? null,
        transactionDate: values.transactionDate
          ? values.transactionDate.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
          : null,
        file1: file1 ?? null,
        file2: file2 ?? null,
      };
      addIssueMutation.mutate(dto, {
        onSuccess: () => {
          setIsIssueModalVisible(false);
          issueForm.resetFields();
          setIssueComplaint(null);
        },
      });
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // View Details handler
  const handleViewDetails = (complaint: Complaint) => {
    setViewingComplaint(complaint);
    setIsViewModalVisible(true);
  };

  // Action menu for each complaint card
  const getActionMenu = (complaint: Complaint): MenuProps => {
    const isClosed = complaint.isFinish === true;
    const isOpen = !isClosed && !complaint.ishold;

    const items: MenuProps['items'] = [
      {
        key: 'view',
        label: t('viewDetails'),
        icon: <EyeOutlined />,
        onClick: () => handleViewDetails(complaint),
      },
    ];

    if (!isClosed) {
      items.push(
        { type: 'divider' as const },
        {
          key: 'edit',
          label: t('edit'),
          icon: <EditOutlined />,
          onClick: () => handleEdit(complaint),
        },
        {
          key: 'finish',
          label: t('finishComplaint'),
          icon: <CheckCircleOutlined style={{ color: '#00aa64' }} />,
          onClick: () => handleFinish(complaint),
        }
      );

      if (isOpen) {
        items.push({
          key: 'hold',
          label: t('holdComplaint'),
          icon: <PauseCircleOutlined style={{ color: '#8c0000' }} />,
          onClick: () => handleHold(complaint),
        });
      }

      items.push({
        key: 'addIssue',
        label: t('addIssue'),
        icon: <FileAddOutlined style={{ color: '#1890ff' }} />,
        onClick: () => handleAddIssue(complaint),
      });
    }

    items.push(
      { type: 'divider' as const },
      {
        key: 'delete',
        label: t('delete'),
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => handleDelete(complaint),
      }
    );

    return { items };
  };

  if (isLoading) {
    return (
      <div
        className={styles.container}
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        <Spin size="large" tip={t('loading')} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <FileTextOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('complaintsManagement')}</h1>
            </div>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            className={styles.addButton}
            onClick={handleAdd}
            loading={createMutation.isPending}
          >
            {t('addComplaint')}
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} className={styles.statsRow}>
        <Col xs={24} sm={12} md={6}>
          <div className={styles.statCard}>
            <Statistic
              title={t('totalComplaints')}
              value={statistics.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#003366' }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className={styles.statCard}>
            <Statistic
              title={t('openComplaints')}
              value={statistics.open}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className={styles.statCard}>
            <Statistic
              title={t('closedComplaints')}
              value={statistics.closed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#00AA64' }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className={styles.statCard}>
            <Statistic
              title={t('pendingComplaints')}
              value={statistics.pending}
              prefix={<PauseCircleOutlined />}
              valueStyle={{ color: '#8c0000' }}
            />
          </div>
        </Col>
      </Row>

      {/* Type tabs removed — `type` field no longer in new API complaint response */}

      {/* Filters */}
      <div className={styles.filtersCard}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <label className={styles.filterLabel}>{t('search')}</label>
            <Input
              placeholder={t('search')}
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              allowClear
            />
          </Col>
          <Col xs={24} md={8}>
            <label className={styles.filterLabel}>{t('status')}</label>
            <Select
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                setCurrentPage(1);
              }}
              options={[
                { label: t('all'), value: 'all' },
                ...toSelectOptions(COMPLAINT_STATUS, language).map((o) => ({
                  ...o,
                  value: o.value.toString(),
                })),
              ]}
            />
          </Col>
          <Col xs={24} md={8}>
            <label className={styles.filterLabel}>{t('contractType')}</label>
            <Select
              style={{ width: '100%' }}
              value={contractTypeFilter}
              onChange={(v) => {
                setContractTypeFilter(v);
                setCurrentPage(1);
              }}
              options={[
                { label: t('all'), value: 'all' },
                ...toSelectOptions(CONTRACT_TYPE, language).map((o) => ({
                  ...o,
                  value: o.value.toString(),
                })),
              ]}
            />
          </Col>
          <Col xs={24} md={8}>
            <label className={styles.filterLabel}>{t('complaintFrom')}</label>
            <Select
              style={{ width: '100%' }}
              value={complaintFromFilter}
              onChange={(v) => {
                setComplaintFromFilter(v);
                setCurrentPage(1);
              }}
              options={[
                { label: t('all'), value: 'all' },
                ...toSelectOptions(COMPLAINT_SOURCE, language).map((o) => ({
                  ...o,
                  value: o.value.toString(),
                })),
              ]}
            />
          </Col>
          <Col xs={24} md={8}>
            <label className={styles.filterLabel}>{t('workerLocation')}</label>
            <Select
              style={{ width: '100%' }}
              value={workerLocationFilter}
              onChange={(v) => {
                setWorkerLocationFilter(v);
                setCurrentPage(1);
              }}
              options={[
                { label: t('all'), value: 'all' },
                ...toSelectOptions(WORKER_LOCATION, language).map((o) => ({
                  ...o,
                  value: o.value.toString(),
                })),
              ]}
            />
          </Col>
        </Row>
      </div>

      {/* Complaints List */}
      <div className={styles.complaintsList}>
        {paginatedComplaints.length === 0 ? (
          <Empty description={t('noComplaints')} />
        ) : (
          paginatedComplaints.map((complaint, index) => {
            const isClosed = complaint.isFinish === true;
            const isOnHold = complaint.ishold === true && !complaint.isFinish;

            return (
              <div key={complaint.id} className={styles.complaintCard}>
                {/* Top badges row */}
                <div className={styles.badgesRow}>
                  <div className={styles.badgesLeft}>
                    <Tag color="purple">
                      {getEnumLabel(COMPLAINT_SOURCE, complaint.source, language)}
                    </Tag>
                    {complaint.relatedContractType && (
                      <Tag color="geekblue">
                        {getEnumLabel(CONTRACT_TYPE, complaint.relatedContractType, language)}
                      </Tag>
                    )}
                    {complaint.workerLocation != null && complaint.workerLocation !== 0 && (
                      <Tag color="cyan">
                        {getEnumLabel(WORKER_LOCATION, complaint.workerLocation, language)}
                      </Tag>
                    )}
                  </div>
                  <div>{getStatusBadge(complaint)}</div>
                </div>

                {/* Card content */}
                <div className={styles.cardContent}>
                  {/* Left - Number */}
                  <div className={styles.numberSection}>
                    <div className={styles.sequenceNumber}>
                      {(currentPage - 1) * pageSize + index + 1}
                    </div>
                    <div
                      className={styles.complaintNumber}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleViewDetails(complaint)}
                      title={t('viewDetails')}
                    >
                      #{complaint.id}
                    </div>
                    <div className={styles.dateText}>
                      {complaint.createdAt
                        ? new Date(complaint.createdAt).toLocaleDateString(
                            isArabic ? 'ar-SA' : 'en-US'
                          )
                        : ''}
                    </div>
                    <div className={styles.dateText} style={{ fontSize: 11, opacity: 0.7 }}>
                      {complaint.createdAt
                        ? new Date(complaint.createdAt).toLocaleTimeString(
                            isArabic ? 'ar-SA' : 'en-US',
                            { hour: '2-digit', minute: '2-digit' }
                          )
                        : ''}
                    </div>
                  </div>

                  {/* Middle - Details */}
                  <div className={styles.detailsSection}>
                    <Row gutter={[16, 8]}>
                      <Col xs={24} md={12}>
                        <div className={styles.infoItem}>
                          <UserOutlined className={styles.icon} />
                          <div>
                            <div className={styles.infoLabel}>{t('customerName')}</div>
                            <div className={styles.infoValue}>
                              {complaint.customerName || (isArabic ? 'غير محدد' : 'N/A')}
                            </div>
                          </div>
                        </div>
                      </Col>
                      <Col xs={24} md={12}>
                        <div className={styles.infoItem}>
                          <UserOutlined className={styles.icon} />
                          <div>
                            <div className={styles.infoLabel}>{t('workerName')}</div>
                            <div className={styles.infoValue}>
                              {complaint.workerName || (isArabic ? 'غير محدد' : 'N/A')}
                            </div>
                          </div>
                        </div>
                      </Col>
                      <Col xs={24}>
                        <div className={styles.infoItem}>
                          <MessageOutlined className={styles.icon} />
                          <div>
                            <div className={styles.infoLabel}>{t('notes')}</div>
                            <div className={styles.infoValue}>
                              {(isArabic ? complaint.notesAr : complaint.notesEn) ||
                                complaint.notesAr ||
                                complaint.notesEn ||
                                (isArabic ? 'لا توجد ملاحظات' : 'No notes')}
                            </div>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>

                  {/* Right - Actions */}
                  <div className={styles.statusSection}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Tooltip title={t('viewDetails')}>
                        <Button
                          type="text"
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => handleViewDetails(complaint)}
                        />
                      </Tooltip>
                      {!isClosed && (
                        <>
                          <Tooltip title={t('finishComplaint')}>
                            <Button
                              type="text"
                              size="small"
                              icon={<CheckCircleOutlined style={{ color: '#00aa64' }} />}
                              onClick={() => handleFinish(complaint)}
                            />
                          </Tooltip>
                          <Tooltip title={t('addIssue')}>
                            <Button
                              type="text"
                              size="small"
                              icon={<FileAddOutlined style={{ color: '#1890ff' }} />}
                              onClick={() => handleAddIssue(complaint)}
                            />
                          </Tooltip>
                        </>
                      )}
                      <Dropdown menu={getActionMenu(complaint)} trigger={['click']}>
                        <Button
                          type="text"
                          size="small"
                          icon={<MoreOutlined style={{ fontSize: 16 }} />}
                        />
                      </Dropdown>
                    </div>
                  </div>
                </div>

                {/* Finish notes banner (for closed complaints) */}
                {isClosed && (
                  <div className={styles.finishNotesSection}>
                    <CheckCircleOutlined className={styles.icon} />
                    <div>
                      <div className={styles.infoLabel}>{t('complaintFinished')}</div>
                      <div className={styles.infoValue}>
                        {complaint.finishNote || (isArabic ? 'تم الإنهاء' : 'Completed')}
                      </div>
                    </div>
                  </div>
                )}

                {/* On-hold banner */}
                {isOnHold && (
                  <div className={styles.holdBanner}>
                    <PauseCircleOutlined style={{ color: '#8c0000' }} />
                    <span>{isArabic ? 'الشكوى معلقة' : 'Complaint on hold'}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {filteredComplaints.length > 0 && (
        <div className={styles.paginationContainer}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={filteredComplaints.length}
            onChange={(page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            }}
            showSizeChanger
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} ${t('of')} ${total} ${t('items')}`
            }
            pageSizeOptions={['10', '20', '30', '50']}
          />
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        title={editingComplaint ? t('editComplaint') : t('addComplaint')}
        open={isModalVisible}
        onOk={handleModalSubmit}
        onCancel={handleModalCancel}
        okText={t('save')}
        cancelText={t('cancel')}
        confirmLoading={createMutation.isPending}
        width={700}
        destroyOnClose
      >
        <ComplaintForm form={form} language={language} isArabic={isArabic} t={t} />
      </Modal>

      {/* Finish Complaint Modal */}
      <Modal
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#00aa64' }}>
            <CheckCircleOutlined /> {t('finishComplaint')}
          </span>
        }
        open={isFinishModalVisible}
        onOk={handleFinishSubmit}
        onCancel={() => {
          setIsFinishModalVisible(false);
          finishForm.resetFields();
          setFinishingComplaint(null);
        }}
        okText={t('finish')}
        cancelText={t('cancel')}
        confirmLoading={finishMutation.isPending}
        okButtonProps={{ style: { background: '#00aa64', borderColor: '#00aa64' } }}
        width={600}
        destroyOnClose
      >
        {finishingComplaint && (
          <div style={{ padding: 12, background: '#f5f7fa', borderRadius: 8 }}>
            <strong>#{finishingComplaint.id}</strong>{' '}
            {finishingComplaint.customerName || finishingComplaint.workerName
              ? `– ${finishingComplaint.customerName || finishingComplaint.workerName}`
              : ''}
            <p style={{ marginTop: 8, color: '#666' }}>
              {isArabic
                ? 'هل أنت متأكد من إنهاء هذه الشكوى؟'
                : 'Are you sure you want to finish this complaint?'}
            </p>
          </div>
        )}
      </Modal>

      {/* Add Issue Modal */}
      <Modal
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1890ff' }}>
            <FileAddOutlined /> {t('addIssue')}
          </span>
        }
        open={isIssueModalVisible}
        onOk={handleIssueSubmit}
        onCancel={() => {
          setIsIssueModalVisible(false);
          issueForm.resetFields();
          setIssueComplaint(null);
        }}
        okText={t('save')}
        cancelText={t('cancel')}
        confirmLoading={addIssueMutation.isPending}
        width={600}
        destroyOnClose
      >
        {issueComplaint && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f7fa', borderRadius: 8 }}>
            <strong>#{issueComplaint.id}</strong> –{' '}
            {issueComplaint.customerName || issueComplaint.workerName || ''}
          </div>
        )}
        <Form form={issueForm} layout="vertical">
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name="incomingNumber" label={t('issueNumber')}>
                <Input placeholder={t('issueNumber')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="submissionAuthority"
                label={t('submissionAuthority')}
                rules={[{ required: true, message: isArabic ? 'مطلوب' : 'Required' }]}
              >
                <Select
                  placeholder={t('submissionAuthority')}
                  options={toSelectOptions(SUBMISSION_AUTHORITY, language)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="transactionDate" label={t('transactionDate')}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="attachmentFile"
                label={t('attachment')}
                valuePropName="fileList"
                getValueFromEvent={(e: any) => e?.fileList || e}
              >
                <Upload maxCount={1} beforeUpload={() => false} accept="*/*">
                  <Button icon={<UploadOutlined />}>{isArabic ? 'ملف 1' : 'File 1'}</Button>
                </Upload>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="attachmentFile2"
                label={t('attachment2')}
                valuePropName="fileList"
                getValueFromEvent={(e: any) => e?.fileList || e}
              >
                <Upload maxCount={1} beforeUpload={() => false} accept="*/*">
                  <Button icon={<UploadOutlined />}>{isArabic ? 'ملف 2' : 'File 2'}</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* View Details Modal */}
      <ViewDetailsModal
        complaint={viewingComplaint}
        visible={isViewModalVisible}
        onClose={() => {
          setIsViewModalVisible(false);
          setViewingComplaint(null);
        }}
        language={language}
        isArabic={isArabic}
        t={t}
      />
    </div>
  );
}

// ===================== View Details Modal Component =====================
function ViewDetailsModal({
  complaint,
  visible,
  onClose,
  language,
  isArabic,
  t,
}: {
  complaint: Complaint | null;
  visible: boolean;
  onClose: () => void;
  language: 'ar' | 'en';
  isArabic: boolean;
  t: (key: string) => string;
}) {
  const { data: issues = [] } = useComplaintIssues(complaint?.id || 0);

  if (!complaint) return null;

  return (
    <Modal
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#003366' }}>
          <EyeOutlined /> {t('complaintDetails')} #{complaint.id}
        </span>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          {t('close')}
        </Button>,
      ]}
      width={700}
      destroyOnClose
    >
      {/* Complaint Info */}
      <div style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={12} md={8}>
            <div style={{ color: '#6c757d', fontSize: 12, marginBottom: 4 }}>
              {t('complaintFrom')}
            </div>
            <Tag color="purple">
              {getEnumLabel(COMPLAINT_SOURCE, complaint.source, language)}
            </Tag>
          </Col>
          <Col xs={12} md={8}>
            <div style={{ color: '#6c757d', fontSize: 12, marginBottom: 4 }}>{t('status')}</div>
            <Tag color={complaint.isFinish ? 'success' : complaint.ishold ? 'error' : 'warning'}>
              {getEnumLabel(COMPLAINT_STATUS, getComplaintStatus(complaint), language)}
            </Tag>
          </Col>
          <Col xs={12} md={8}>
            <div style={{ color: '#6c757d', fontSize: 12, marginBottom: 4 }}>
              {t('customerName')}
            </div>
            <div style={{ fontWeight: 500 }}>
              {complaint.customerName || (isArabic ? 'غير محدد' : 'N/A')}
            </div>
          </Col>
          <Col xs={12} md={8}>
            <div style={{ color: '#6c757d', fontSize: 12, marginBottom: 4 }}>{t('workerName')}</div>
            <div style={{ fontWeight: 500 }}>
              {complaint.workerName || (isArabic ? 'غير محدد' : 'N/A')}
            </div>
          </Col>
          <Col xs={12} md={8}>
            <div style={{ color: '#6c757d', fontSize: 12, marginBottom: 4 }}>{t('createdAt')}</div>
            <div style={{ fontWeight: 500 }}>
              {complaint.createdAt
                ? new Date(complaint.createdAt).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US')
                : '—'}
            </div>
          </Col>
          {complaint.relatedContractType && (
            <Col xs={12} md={8}>
              <div style={{ color: '#6c757d', fontSize: 12, marginBottom: 4 }}>
                {t('contractType')}
              </div>
              <Tag color="geekblue">
                {getEnumLabel(CONTRACT_TYPE, complaint.relatedContractType, language)}
              </Tag>
            </Col>
          )}
          {complaint.workerLocation != null && complaint.workerLocation !== 0 && (
            <Col xs={12} md={8}>
              <div style={{ color: '#6c757d', fontSize: 12, marginBottom: 4 }}>
                {t('workerLocation')}
              </div>
              <Tag color="cyan">
                {getEnumLabel(WORKER_LOCATION, complaint.workerLocation, language)}
              </Tag>
            </Col>
          )}
        </Row>

        {/* Notes */}
        <Divider style={{ margin: '16px 0' }} />
        <div style={{ color: '#6c757d', fontSize: 12, marginBottom: 4 }}>{t('notes')}</div>
        <div
          style={{
            background: '#f5f7fa',
            padding: 12,
            borderRadius: 8,
            whiteSpace: 'pre-wrap',
          }}
        >
          {complaint.notesAr && <div>{complaint.notesAr}</div>}
          {complaint.notesEn && (
            <div style={{ marginTop: complaint.notesAr ? 8 : 0, direction: 'ltr' }}>
              {complaint.notesEn}
            </div>
          )}
          {!complaint.notesAr && !complaint.notesEn && (
            <span style={{ color: '#999' }}>{isArabic ? 'لا توجد ملاحظات' : 'No notes'}</span>
          )}
        </div>

        {/* Finish notes (if closed) */}
        {complaint.isFinish === true && (
          <>
            <Divider style={{ margin: '16px 0' }} />
            <div
              style={{
                background: 'rgba(0, 170, 100, 0.05)',
                border: '1px solid rgba(0, 170, 100, 0.2)',
                borderRadius: 8,
                padding: 12,
              }}
            >
              <div
                style={{
                  color: '#00aa64',
                  fontWeight: 600,
                  marginBottom: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <CheckCircleOutlined /> {t('complaintFinished')}
              </div>
              <div>{complaint.finishNote || '—'}</div>
            </div>
          </>
        )}
      </div>

      {/* Issues */}
      <Divider style={{ margin: '16px 0' }} />
      <div style={{ fontWeight: 600, color: '#003366', marginBottom: 12, fontSize: 15 }}>
        {t('issues')} ({issues.length})
      </div>
      {issues.length === 0 ? (
        <Empty description={t('noIssues')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <List
          size="small"
          dataSource={issues}
          renderItem={(issue) => (
            <List.Item>
              <List.Item.Meta
                avatar={<FileTextOutlined style={{ fontSize: 20, color: '#1890ff' }} />}
                title={
                  <span>
                    {issue.incomingNumber || `#${issue.id}`}{' '}
                    <Tag color={issue.status === ISSUE_STATUS[0].value ? 'processing' : 'default'}>
                      {getEnumLabel(ISSUE_STATUS, issue.status, language)}
                    </Tag>
                  </span>
                }
                description={
                  <span>
                    {getEnumLabel(SUBMISSION_AUTHORITY, issue.submissionAuthority, language)}
                    {issue.transactionDate && (
                      <>
                        {' • '}
                        {new Date(issue.transactionDate).toLocaleDateString(
                          isArabic ? 'ar-SA' : 'en-US'
                        )}
                      </>
                    )}
                  </span>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Modal>
  );
}
