'use client';

import React, { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { BranchFilterSelect } from '@/components/filters';
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
  ComplaintIssue,
  AddIssueDto,
} from '@/types/api.types';
import styles from './Complaints.module.css';

const { TextArea } = Input;

const getComplaintStatus = (complaint: Complaint): number => {
  const status = Number(complaint.status);
  if ([1, 2, 3].includes(status)) return status;
  if (complaint.isFinish) return 3;
  if (complaint.ishold) return 2;
  return 1;
};

const normalizeIdentifierPart = (value: unknown): string => {
  if (value == null) return '';
  return String(value).trim();
};

const getContractValue = (contract: Record<string, unknown>, keys: string[]): unknown => {
  for (const key of keys) {
    const value = contract[key];
    if (normalizeIdentifierPart(value)) return value;
  }

  return null;
};

const getContractOptionLabel = (
  contract: Record<string, unknown>,
  isArabic: boolean
): string => {
  const contractNumber = normalizeIdentifierPart(
    getContractValue(contract, [
      'contractNumber',
      'ContractNumber',
      'contractNo',
      'ContractNo',
      'number',
      'Number',
      'musanedContractNumber',
      'MusanedContractNumber',
    ])
  );
  const customerName = normalizeIdentifierPart(
    getContractValue(contract, [
      'customerName',
      'CustomerName',
      'customerNameAr',
      'CustomerNameAr',
      'customerNameEn',
      'CustomerNameEn',
      'customerNameEnglish',
      'CustomerNameEnglish',
    ])
  );
  const workerName = normalizeIdentifierPart(
    getContractValue(contract, [
      'workerName',
      'WorkerName',
      'workerNameAr',
      'WorkerNameAr',
      'workerNameEn',
      'WorkerNameEn',
    ])
  );
  const fallbackId = normalizeIdentifierPart(getContractValue(contract, ['id', 'Id', 'ID']));
  const displayNumber = contractNumber || fallbackId;
  const name = customerName || workerName;
  const prefix = isArabic ? 'عقد رقم' : 'Contract #';

  return `${prefix}${displayNumber}${name ? ` - ${name}` : ''}`;
};

const getCustomerDisplayName = (customer: Record<string, unknown>, isArabic: boolean): string => {
  return normalizeIdentifierPart(
    isArabic
      ? customer.arabicName ?? customer.ArabicName ?? customer.nameAr ?? customer.NameAr
      : customer.englishName ?? customer.EnglishName ?? customer.nameEn ?? customer.NameEn
  ) || normalizeIdentifierPart(
    customer.arabicName ??
      customer.ArabicName ??
      customer.englishName ??
      customer.EnglishName ??
      customer.nameAr ??
      customer.NameAr ??
      customer.nameEn ??
      customer.NameEn
  );
};

const getWorkerDisplayName = (worker: Record<string, unknown>, isArabic: boolean): string => {
  return normalizeIdentifierPart(
    isArabic
      ? worker.fullNameAr ?? worker.FullNameAr ?? worker.nameAr ?? worker.NameAr
      : worker.fullNameEn ?? worker.FullNameEn ?? worker.nameEn ?? worker.NameEn
  ) || normalizeIdentifierPart(
    worker.fullNameAr ??
      worker.FullNameAr ??
      worker.fullNameEn ??
      worker.FullNameEn ??
      worker.nameAr ??
      worker.NameAr ??
      worker.nameEn ??
      worker.NameEn
  );
};

const getContractCustomerName = (contract: Record<string, unknown>, isArabic: boolean): string => {
  return normalizeIdentifierPart(
    getContractValue(contract, [
      ...(isArabic
        ? ['customerNameAr', 'CustomerNameAr', 'customerArabicName', 'CustomerArabicName']
        : ['customerNameEn', 'CustomerNameEn', 'customerEnglishName', 'CustomerEnglishName']),
      'customerName',
      'CustomerName',
      'customerNameAr',
      'CustomerNameAr',
      'customerNameEn',
      'CustomerNameEn',
    ])
  );
};

const getContractWorkerName = (contract: Record<string, unknown>, isArabic: boolean): string => {
  return normalizeIdentifierPart(
    getContractValue(contract, [
      ...(isArabic
        ? ['workerNameAr', 'WorkerNameAr', 'workerArabicName', 'WorkerArabicName']
        : ['workerNameEn', 'WorkerNameEn', 'workerEnglishName', 'WorkerEnglishName']),
      'workerName',
      'WorkerName',
      'workerNameAr',
      'WorkerNameAr',
      'workerNameEn',
      'WorkerNameEn',
    ])
  );
};

const getComplaintDisplayNumber = (complaint: Complaint): string => {
  const complaintNumber = normalizeIdentifierPart(complaint.complaintNumber);
  if (complaintNumber) return complaintNumber;

  const id = normalizeIdentifierPart(complaint.id);
  if (id.length <= 14) return id;

  return `${id.slice(0, 8)}...${id.slice(-5)}`;
};

const getComplaintFullIdentifier = (complaint: Complaint): string => {
  const id = normalizeIdentifierPart(complaint.id);
  const complaintNumber = normalizeIdentifierPart(complaint.complaintNumber);

  if (complaintNumber && complaintNumber !== id) {
    return `${complaintNumber} • ${id}`;
  }

  return complaintNumber || id;
};

const getIssueSubmissionAuthorityLabel = (
  issue: ComplaintIssue,
  language: 'ar' | 'en',
  isArabic: boolean
): string => {
  const issueRecord = issue as ComplaintIssue & Record<string, unknown>;
  const localizedName = isArabic
    ? normalizeIdentifierPart(
        issue.submissionAuthorityNameAr ?? issueRecord.SubmissionAuthorityNameAr
      )
    : normalizeIdentifierPart(
        issue.submissionAuthorityNameEn ?? issueRecord.SubmissionAuthorityNameEn
      );
  const genericName = normalizeIdentifierPart(
    issue.submissionAuthorityName ?? issueRecord.SubmissionAuthorityName
  );
  const authorityLabel =
    localizedName ||
    genericName ||
    getEnumLabel(SUBMISSION_AUTHORITY, issue.submissionAuthority, language);

  return authorityLabel || (isArabic ? 'غير محدد' : 'Not Specified');
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
  const showContract = sourceValue != null;
  const showWorkerLocation = showWorker || CONTRACT_SOURCES.includes(sourceValue) || showCustomer;

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

  const contractOptions = contractsArray
    .map((c) => ({
      value: c.id ?? c.Id ?? c.ID,
      label: getContractOptionLabel(c, isArabic),
    }))
    .filter((option) => option.value != null);

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
              <Form.Item name="relatedContractType" label={t('contractType')}>
                <Select
                  placeholder={t('contractType')}
                  options={toSelectOptions(CONTRACT_TYPE, language)}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="relatedContractId" label={isArabic ? 'العقد' : 'Contract'}>
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

  // State (must be before hooks that use these values)
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [contractTypeFilter, setContractTypeFilter] = useState<string>('all');
  const [complaintFromFilter, setComplaintFromFilter] = useState<string>('all');
  const [workerLocationFilter, setWorkerLocationFilter] = useState<string>('all');
  const [contractNumberFilter, setContractNumberFilter] = useState<string>('');
  const [branchId, setBranchId] = useState<string | undefined>(undefined);
  const [includeSubBranches, setIncludeSubBranches] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // API hooks — branch scoping is applied server-side; other filters below are
  // refined client-side on the returned page.
  const { data: complaintsData, isLoading } = useComplaints({
    pageNumber: currentPage,
    pageSize,
    branchId,
    includeSubBranches: branchId ? includeSubBranches : undefined,
  });
  const complaints = complaintsData?.complaints ?? [];
  const serverTotal = complaintsData?.total ?? 0;
  const { customers = [] } = useCustomers();
  const { data: workers = [] } = useWorkers();
  const { contracts = [] } = useEmploymentOperatingContracts();
  const createMutation = useCreateComplaint();
  const deleteMutation = useDeleteComplaint();
  const finishMutation = useFinishComplaint();
  const toggleHoldMutation = useToggleHoldComplaint();
  const addIssueMutation = useAddIssue();

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

  const customerNameById = useMemo(() => {
    const map = new Map<string, string>();

    (customers as unknown as Record<string, unknown>[]).forEach((customer) => {
      const id = normalizeIdentifierPart(customer.id ?? customer.Id ?? customer.ID);
      const name = getCustomerDisplayName(customer, isArabic);
      if (id && name) map.set(id, name);
    });

    return map;
  }, [customers, isArabic]);

  const workerNameById = useMemo(() => {
    const map = new Map<string, string>();

    (workers as unknown as Record<string, unknown>[]).forEach((worker) => {
      const id = normalizeIdentifierPart(worker.id ?? worker.Id ?? worker.ID);
      const name = getWorkerDisplayName(worker, isArabic);
      if (id && name) map.set(id, name);
    });

    return map;
  }, [workers, isArabic]);

  const contractNameById = useMemo(() => {
    const map = new Map<string, { customerName: string; workerName: string; contractNumber: string }>();
    const contractsArray: Record<string, unknown>[] = Array.isArray(contracts)
      ? contracts as unknown as Record<string, unknown>[]
      : Array.isArray((contracts as any)?.data)
        ? (contracts as any).data
        : [];

    contractsArray.forEach((contract) => {
      const id = normalizeIdentifierPart(contract.id ?? contract.Id ?? contract.ID);
      if (!id) return;

      map.set(id, {
        customerName: getContractCustomerName(contract, isArabic),
        workerName: getContractWorkerName(contract, isArabic),
        contractNumber: normalizeIdentifierPart(
          getContractValue(contract, [
            'contractNumber', 'ContractNumber', 'contractNo', 'ContractNo',
            'number', 'Number', 'musanedContractNumber', 'MusanedContractNumber',
          ])
        ),
      });
    });

    return map;
  }, [contracts, isArabic]);

  const getResolvedCustomerName = (complaint: Complaint): string => {
    const complaintName = normalizeIdentifierPart(complaint.customerName);
    if (complaintName) return complaintName;

    const customerId = normalizeIdentifierPart(complaint.customerId);
    if (customerId && customerNameById.has(customerId)) {
      return customerNameById.get(customerId) || '';
    }

    const contractId = normalizeIdentifierPart(complaint.relatedContractId);
    if (contractId && contractNameById.has(contractId)) {
      return contractNameById.get(contractId)?.customerName || '';
    }

    return '';
  };

  const getResolvedWorkerName = (complaint: Complaint): string => {
    const complaintName = normalizeIdentifierPart(complaint.workerName);
    if (complaintName) return complaintName;

    const workerId = normalizeIdentifierPart(complaint.workerId);
    if (workerId && workerNameById.has(workerId)) {
      return workerNameById.get(workerId) || '';
    }

    const contractId = normalizeIdentifierPart(complaint.relatedContractId);
    if (contractId && contractNameById.has(contractId)) {
      return contractNameById.get(contractId)?.workerName || '';
    }

    return '';
  };

  const getResolvedContractNumber = (complaint: Complaint): string => {
    const direct = normalizeIdentifierPart(complaint.contractNumber);
    if (direct) return direct;

    const contractId = normalizeIdentifierPart(complaint.relatedContractId);
    if (contractId && contractNameById.has(contractId)) {
      return contractNameById.get(contractId)?.contractNumber || contractId;
    }

    return normalizeIdentifierPart(complaint.relatedContractId);
  };

  // Translations
  const t = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      ar: {
        complaintsManagement: 'إدارة الشكاوى',
        totalComplaints: 'إجمالي الشكاوى',
        openComplaints: 'شكاوى مفتوحة',
        closedComplaints: 'شكاوى منتهية',
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
        closedComplaints: 'Finished Complaints',
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
      const customerName =
        normalizeIdentifierPart(complaint.customerName) ||
        customerNameById.get(normalizeIdentifierPart(complaint.customerId)) ||
        contractNameById.get(normalizeIdentifierPart(complaint.relatedContractId))?.customerName ||
        '';
      const workerName =
        normalizeIdentifierPart(complaint.workerName) ||
        workerNameById.get(normalizeIdentifierPart(complaint.workerId)) ||
        contractNameById.get(normalizeIdentifierPart(complaint.relatedContractId))?.workerName ||
        '';
      const matchesSearch =
        !searchTerm ||
        complaint.id.toString().includes(searchTerm) ||
        customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

      const resolvedContractNumber =
        normalizeIdentifierPart(complaint.contractNumber) ||
        contractNameById.get(normalizeIdentifierPart(complaint.relatedContractId))?.contractNumber ||
        normalizeIdentifierPart(complaint.relatedContractId);
      const matchesContractNumber =
        !contractNumberFilter ||
        resolvedContractNumber.toLowerCase().includes(contractNumberFilter.toLowerCase());

      return (
        matchesSearch &&
        matchesStatus &&
        matchesContractType &&
        matchesComplaintFrom &&
        matchesWorkerLocation &&
        matchesContractNumber
      );
    });
  }, [
    searchTerm,
    statusFilter,
    contractTypeFilter,
    complaintFromFilter,
    workerLocationFilter,
    contractNumberFilter,
    complaints,
    customerNameById,
    workerNameById,
    contractNameById,
  ]);

  // paginatedComplaints = filteredComplaints on the current server page
  const paginatedComplaints = filteredComplaints;

  // Statistics
  const statistics = useMemo(() => {
    const total = complaints.length;
    const open = complaints.filter((c) => getComplaintStatus(c) === 1).length;
    const pending = complaints.filter((c) => getComplaintStatus(c) === 2).length;
    const closed = complaints.filter((c) => getComplaintStatus(c) === 3).length;
    return { total, open, closed, pending };
  }, [complaints]);

  const getStatusBadge = (complaint: Complaint) => {
    const status = getComplaintStatus(complaint);
    const statusConfig: Record<number, { color: string; icon: React.ReactNode }> = {
      [COMPLAINT_STATUS[0].value]: { color: '#faad14', icon: <ClockCircleOutlined /> }, // Open
      [COMPLAINT_STATUS[1].value]: { color: '#8c0000', icon: <WarningOutlined /> }, // On Hold
      [COMPLAINT_STATUS[2].value]: { color: '#00aa64', icon: <CheckCircleOutlined /> }, // Finished
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
          setCurrentPage(1);
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
    const isOnHold = getComplaintStatus(complaint) === 2;
    Modal.confirm({
      title: isOnHold ? (isArabic ? 'إلغاء تعليق الشكوى' : 'Resume Complaint') : t('holdComplaint'),
      icon: <PauseCircleOutlined style={{ color: '#8c0000' }} />,
      content: (
        <div>
          <p style={{ marginBottom: 8 }}>
            {isOnHold
              ? isArabic
                ? 'هل أنت متأكد من إلغاء تعليق هذه الشكوى؟'
                : 'Are you sure you want to resume this complaint?'
              : t('confirmHold')}
          </p>
          {isOnHold && complaint.holdReason && (
            <p style={{ marginBottom: 8, color: '#6c757d' }}>
              {isArabic ? 'سبب التعليق الحالي: ' : 'Current hold reason: '}
              {complaint.holdReason}
            </p>
          )}
          <Input
            placeholder={
              isOnHold
                ? isArabic
                  ? 'ملاحظة إلغاء التعليق (مطلوبة)'
                  : 'Resume note (required)'
                : isArabic
                  ? 'سبب التعليق (مطلوب)'
                  : 'Hold reason (required)'
            }
            onChange={(e) => { reason = e.target.value; }}
          />
        </div>
      ),
      okText: isOnHold ? (isArabic ? 'إلغاء التعليق' : 'Resume') : t('holdComplaint'),
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
    const status = getComplaintStatus(complaint);
    const isClosed = status === 3;
    const isOnHold = status === 2;

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

      items.push({
        key: 'hold',
        label: isOnHold ? (isArabic ? 'إلغاء التعليق' : 'Resume Complaint') : t('holdComplaint'),
        icon: <PauseCircleOutlined style={{ color: '#8c0000' }} />,
        onClick: () => handleHold(complaint),
      });

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
            <label className={styles.filterLabel}>
              {language === 'ar' ? 'الفرع' : 'Branch'}
            </label>
            <BranchFilterSelect
              value={branchId}
              onChange={(v) => { setBranchId(v); setCurrentPage(1); }}
              includeSubBranches={includeSubBranches}
              onIncludeSubBranchesChange={setIncludeSubBranches}
              style={{ width: '100%' }}
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
          <Col xs={24} md={8}>
            <label className={styles.filterLabel}>
              {isArabic ? 'رقم العقد' : 'Contract #'}
            </label>
            <Input
              placeholder={isArabic ? 'بحث برقم العقد...' : 'Search by contract number...'}
              prefix={<SearchOutlined />}
              value={contractNumberFilter}
              onChange={(e) => {
                setContractNumberFilter(e.target.value);
                setCurrentPage(1);
              }}
              allowClear
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
            const complaintStatus = getComplaintStatus(complaint);
            const isClosed = complaintStatus === 3;
            const isOnHold = complaintStatus === 2;
            const complaintDisplayNumber = getComplaintDisplayNumber(complaint);
            const complaintFullIdentifier = getComplaintFullIdentifier(complaint);
            const customerName = getResolvedCustomerName(complaint);
            const workerName = getResolvedWorkerName(complaint);
            const contractNumber = getResolvedContractNumber(complaint);
            const customerId = normalizeIdentifierPart(complaint.customerId);
            const workerId = normalizeIdentifierPart(complaint.workerId);
            const customerDisplay = customerName || (customerId ? `#${customerId}` : '');
            const workerDisplay = workerName || (workerId ? `#${workerId}` : '');
            const hasPersonDisplay = Boolean(customerDisplay || workerDisplay || contractNumber);

            const priorityClass =
              complaint.priority === 1
                ? styles.priorityLow
                : complaint.priority === 2
                  ? styles.priorityMedium
                  : complaint.priority === 3
                    ? styles.priorityHigh
                    : '';

            return (
              <div key={complaint.id} className={`${styles.complaintCard} ${priorityClass}`}>
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
                    {complaint.hasIssue && (
                      <Tag color="blue">{isArabic ? 'لديها قضية' : 'Has Issue'}</Tag>
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
                    <Tooltip title={complaintFullIdentifier}>
                      <div
                        className={styles.complaintNumber}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleViewDetails(complaint)}
                        title={t('viewDetails')}
                      >
                        #{complaintDisplayNumber}
                      </div>
                    </Tooltip>
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
                      {contractNumber && (
                        <Col xs={24} md={12}>
                          <div className={styles.infoItem}>
                            <FileTextOutlined className={styles.icon} />
                            <div>
                              <div className={styles.infoLabel}>
                                {isArabic ? 'رقم العقد' : 'Contract #'}
                              </div>
                              <div className={styles.infoValue}>{contractNumber}</div>
                            </div>
                          </div>
                        </Col>
                      )}
                      {customerDisplay && (
                        <Col xs={24} md={12}>
                          <div className={styles.infoItem}>
                            <UserOutlined className={styles.icon} />
                            <div>
                              <div className={styles.infoLabel}>{t('customerName')}</div>
                              <div className={styles.infoValue}>{customerDisplay}</div>
                            </div>
                          </div>
                        </Col>
                      )}
                      {workerDisplay && (
                        <Col xs={24} md={12}>
                          <div className={styles.infoItem}>
                            <UserOutlined className={styles.icon} />
                            <div>
                              <div className={styles.infoLabel}>{t('workerName')}</div>
                              <div className={styles.infoValue}>{workerDisplay}</div>
                            </div>
                          </div>
                        </Col>
                      )}
                      {!hasPersonDisplay && (
                        <Col xs={24}>
                          <div className={styles.infoItem}>
                            <UserOutlined className={styles.icon} />
                            <div>
                              <div className={styles.infoLabel}>
                                {isArabic ? 'الاسم' : 'Name'}
                              </div>
                              <div className={styles.infoValue}>
                                {isArabic ? 'غير محدد' : 'Not specified'}
                              </div>
                            </div>
                          </div>
                        </Col>
                      )}
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
                    <span>
                      {complaint.holdReason
                        ? `${isArabic ? 'الشكوى معلقة: ' : 'Complaint on hold: '}${complaint.holdReason}`
                        : isArabic
                          ? 'الشكوى معلقة'
                          : 'Complaint on hold'}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {serverTotal > 0 && (
        <div className={styles.paginationContainer}>
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
        destroyOnHidden
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
        destroyOnHidden
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
        destroyOnHidden
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

  const status = getComplaintStatus(complaint);
  const isFinished = status === 3;
  const isOnHold = status === 2;

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
      destroyOnHidden
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
            <Tag color={isFinished ? 'success' : isOnHold ? 'error' : 'warning'}>
              {getEnumLabel(COMPLAINT_STATUS, getComplaintStatus(complaint), language)}
            </Tag>
          </Col>
          {complaint.priority != null && (
            <Col xs={12} md={8}>
              <div style={{ color: '#6c757d', fontSize: 12, marginBottom: 4 }}>
                {isArabic ? 'الأولوية' : 'Priority'}
              </div>
              <Tag color={complaint.priority === 1 ? 'success' : complaint.priority === 2 ? 'warning' : 'error'}>
                {getEnumLabel(COMPLAINT_PRIORITY, complaint.priority, language)}
              </Tag>
            </Col>
          )}
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
          {(complaint.contractNumber || complaint.relatedContractId) && (
            <Col xs={12} md={8}>
              <div style={{ color: '#6c757d', fontSize: 12, marginBottom: 4 }}>
                {isArabic ? 'رقم العقد' : 'Contract #'}
              </div>
              <div style={{ fontWeight: 500 }}>
                {complaint.contractNumber || String(complaint.relatedContractId)}
              </div>
            </Col>
          )}
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

        {isOnHold && complaint.holdReason && (
          <>
            <Divider style={{ margin: '16px 0' }} />
            <div
              style={{
                background: 'rgba(140, 0, 0, 0.05)',
                border: '1px solid rgba(140, 0, 0, 0.2)',
                borderRadius: 8,
                padding: 12,
              }}
            >
              <div style={{ color: '#8c0000', fontWeight: 600, marginBottom: 4 }}>
                {isArabic ? 'سبب التعليق' : 'Hold Reason'}
              </div>
              <div>{complaint.holdReason}</div>
            </div>
          </>
        )}

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
        {isFinished && (
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
                    {getIssueSubmissionAuthorityLabel(issue, language, isArabic)}
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
