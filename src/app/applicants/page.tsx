'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Row,
  Col,
  Button,
  Input,
  InputNumber,
  Select,
  Space,
  Tag,
  Modal,
  Form,
  Empty,
  Spin,
  Tooltip,
  Dropdown,
  DatePicker,
  Image,
  Descriptions,
  Divider,
  Switch,
  Avatar,
  Upload,
  Pagination,
  message,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  TeamOutlined,
  UserOutlined,
  IdcardOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  TrophyOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  MoreOutlined,
  ClearOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FilePdfOutlined,
  UploadOutlined,
  FileTextOutlined,
  StopOutlined,
  ManOutlined,
  WomanOutlined,
  MedicineBoxOutlined,
  CloseCircleOutlined,
  LogoutOutlined,
  FileImageOutlined,
  HomeOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { resolveImageUrl } from '@/utils/image';
import {
  useWorkersFiltered,
  useWorker,
  useWorkerRefused,
  useWorkerDeactivate,
  useWorkerOut,
  useCreateWorker,
  useUpdateWorker,
  useDeleteWorker,
  useCreateMedicalExamination,
  useMedicalExaminations,
  useUpdateMedicalExamination,
  useDeleteMedicalExamination,
  useCheckWorkerMedicalExamination,
} from '@/hooks/api/useWorkers';
import { useAgents } from '@/hooks/api/useAgents';
import { useJobs } from '@/hooks/api/useJobs';
import { useNationalities } from '@/hooks/api/useNationalities';
import { useHREmployees } from '@/hooks/api/useHR';
import { useHousingActiveList } from '@/hooks/api/useHousing';
import { useAssignWorkerHousing } from '@/hooks/api/useWorkerHousing';
import { BranchFilterSelect, DateRangeFilter, ExportButton } from '@/components/filters';
import { API_ENDPOINTS } from '@/config/api.config';
import type { Worker, WorkerDto } from '@/types/api.types';
import {
  GENDER,
  MARITAL_STATUS,
  RELIGION,
  WORKER_CONTRACT_TYPE,
  WORKER_SATUS,
  MEDICAL_STATUS,
  getEnumLabel,
  toSelectOptions,
} from '@/constants/enums';
import styles from './Workers.module.css';
import dayjs from 'dayjs';

// Translations
const translations = {
  en: {
    pageTitle: 'Workers Management',
    addWorker: 'Add Worker',
    addFromFile: 'Add from File',
    printSalary: 'Print Salary',
    quickSearch: 'Quick Search',
    print: 'Print',
    downloadPdf: 'Download All Info PDF',
    workerReport: 'Worker Report',
    trialReport: 'Trial Report',
    allData: 'All Data',
    searchPlaceholder: 'Search workers...',
    filters: 'Search Filters',
    search: 'Search',
    clearFilters: 'Clear',
    totalWorkers: 'Total Workers',
    // Tabs
    tabAll: 'All',
    tabAvailable: 'Available',
    tabTrial: 'Trial Workers',
    tabUnderProcedure: 'Under Procedure',
    tabBackOut: 'Backout',
    tabInsideKingdom: 'Inside Kingdom',
    tabDeported: 'Deported',
    // Filters
    workerNo: 'Worker No.',
    fullNameAr: 'Name (Arabic)',
    fullNameEn: 'Name (English)',
    passportNo: 'Passport No.',
    nationality: 'Nationality',
    nationalId: 'National ID',
    jobname: 'Job Name',
    agent: 'Agent',
    employee: 'Employee',
    workerType: 'Worker Type',
    deletionStatus: 'Deletion Status',
    notDeleted: 'Not Deleted',
    deleted: 'Deleted Workers',

    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    workerStatus: 'Worker Status',
    religion: 'Religion',
    muslim: 'Muslim',
    nonMuslim: 'Non-Muslim',
    experience: 'Experience',
    hasExperience: 'Has Experience',
    noExperience: 'No Experience',
    isActive: 'Active Status',
    isActiveLabel: 'Is Active',
    approvalStatus: 'Approval Status',
    approved: 'Approved',
    notApproved: 'Not Approved',
    visaNo: 'Visa No.',
    flightNo: 'Flight No.',
    age: 'Age',
    phone: 'Phone',
    airline: 'Airline',
    sponsorshipTransfer: 'Sponsorship Transfer',
    transferred: 'Transferred',
    all: 'All',
    // Status options
    statusReceived: 'Worker Received',
    statusEscaped: 'Worker Escaped',
    statusSick: 'Sick',
    statusRefused: 'Work Refused',
    statusReturnTravel: 'Return Travel',
    statusSuspended: 'Suspended',
    statusFinalExit: 'Final Exit',
    statusReturnWork: 'Return to Work',
    statusEmergencyExit: 'Emergency Exit',
    statusChangeAccom: 'Change Accommodation',
    statusAccom: 'Worker Accommodation',
    statusEndService: 'End Service',
    // Worker type options
    typeMediation: 'Mediation',
    typeTransfer: 'Service Transfer',
    typeVisit: 'Visit',
    typeDuration: 'Duration',
    typeTransferContract: 'Transfer Contracts',
    // Card fields
    salary: 'Salary',
    skills: 'Skills',
    noSkills: 'No skills listed',
    actions: 'Actions',
    view: 'View',
    edit: 'Edit',
    delete: 'Delete',
    createWorker: 'Create Worker',
    updateWorker: 'Update Worker',
    cancel: 'Cancel',
    save: 'Save',
    noWorkers: 'No workers found',
    noWorkersDesc: 'No workers match your search criteria',
    deleteConfirm: 'Are you sure you want to delete this worker?',
    deleteTitle: 'Delete Worker',
    years: 'years',
    reference: 'Ref',
    mobile: 'Mobile',
    birthDate: 'Birth Date',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
    refused: 'Refused',
    single: 'Single',
    married: 'Married',
    // Form
    basicInfo: 'Basic Information',
    addressAr: 'Address (Arabic)',
    addressEn: 'Address (English)',
    passportIssueDate: 'Issue Date',
    passportExpiryDate: 'Expiry Date',
    passportIssuePlace: 'Issue Place',
    passportIssuePlaceAr: 'Issue Place (Arabic)',
    passportIssuePlaceEn: 'Issue Place (English)',
    educationLevel: 'Education Level',
    educationLevelAr: 'Education (Arabic)',
    educationLevelEn: 'Education (English)',
    maritalStatus: 'Marital Status',
    childrenCount: 'Children',
    weight: 'Weight (kg)',
    height: 'Height (cm)',
    referenceNo: 'Reference No.',
    basicSalary: 'Basic Salary',
    boxNumber: 'Box Number',
    borderNumber: 'Border Number',
    uploadImage: 'Worker Image',
    noImage: 'No Image',
    viewWorker: 'Worker Details',
    personalDetails: 'Personal Details',
    passportDetails: 'Passport Details',
    workDetails: 'Work Details',
    contactDetails: 'Contact Details',
    addressDetails: 'Address Details',
    close: 'Close',
    agentName: 'Agent Name',
    createdBy: 'Created By',
    workerImage: 'Worker Photo',
    markEscape: 'Mark Escaped',
    markRefused: 'Mark Refused',
    markSick: 'Mark Sick',
    deactivate: 'Deactivate',
    markOut: 'Mark Out',
    statusActionReceived: 'Worker Received',
    statusActionSuspended: 'Suspended',
    statusActionFinalExit: 'Final Exit',
    statusActionReturnWork: 'Return to Work',
    confirmStatusUpdate: 'Are you sure you want to update this worker status?',
    isActiveSaved: 'Active status updated',
    editWorkerFirst: 'Please save worker first before changing active status',
    moreActions: 'More Actions',
    medicalExamination: 'Medical Examination',
    examDate: 'Examination Date',
    medicalStatus: 'Medical Status',
    notes: 'Notes',
    medicalStatusPassed: 'Passed',
    medicalStatusFailed: 'Failed',
    medicalStatusPending: 'Pending',
    createMedicalExam: 'Create Medical Examination',
    viewExamRecord: 'View Exam Record',
    editExamRecord: 'Edit Exam Record',
    viewDocument: 'View Document',
    noDocument: 'No document uploaded',
    ageRange: 'Age Range',
    ageMin: 'Min Age',
    ageMax: 'Max Age',
    passportFilter: 'Passport No.',
    printCV: 'Print CV',
    documents: 'Documents',
    passportScan: 'Passport Scan',
    uploadVideo: 'Worker Video',
    noVideo: 'No video uploaded',
    removeVideo: 'Remove video',
    nationalIdFilter: 'National ID',
    mobileFilter: 'Mobile',
    videoSection: 'Worker Video',
    noDocuments: 'No documents uploaded',
  },
  ar: {
    uploadVideo: 'فيديو العامل',
    noVideo: 'لا يوجد فيديو محمل',
    removeVideo: 'حذف الفيديو',
    nationalIdFilter: 'رقم الهوية',
    mobileFilter: 'رقم الجوال',
    videoSection: 'فيديو العامل',
    downloadPdf: 'تحميل تقرير كل البيانات PDF',
    pageTitle: 'ادارة العمالة',
    addWorker: 'إضافة العمالة',
    addFromFile: 'إضافة من ملف',
    printSalary: 'رواتب العمالة',
    quickSearch: 'البحث السريع',
    print: 'طباعة',
    workerReport: 'تقرير العمالة',
    trialReport: 'تقرير التجربة',
    allData: 'كل البيانات',
    searchPlaceholder: 'البحث في العمال...',
    filters: 'فلاتر البحث',
    search: 'بحث',
    clearFilters: 'إلغاء',
    totalWorkers: 'إجمالي العمال',
    // Tabs
    tabAll: 'الكل',
    tabAvailable: 'عمالة للاختيار',
    tabTrial: 'عمالة في التجربة',
    tabUnderProcedure: 'تحت الاجراء',
    tabBackOut: 'Back out',
    tabInsideKingdom: 'داخل المملكة',
    tabDeported: 'تم الترحيل',
    // Filters
    workerNo: 'رقم العامل',
    fullNameAr: 'الاسم (عربي)',
    fullNameEn: 'الاسم (إنجليزي)',
    passportNo: 'رقم الجواز',
    nationality: 'الجنسية',
    nationalId: 'رقم الهوية',
    jobname: 'الوظيفة',
    agent: 'الوكيل',
    employee: 'الموظف',
    workerType: 'نوع العامل',
    deletionStatus: 'حالة الحذف',
    notDeleted: 'غير محذوف',
    deleted: 'عمالة تم حذفها',

    gender: 'جنس العامل/ه',
    male: 'ذكر',
    female: 'أنثى',
    workerStatus: 'حالة العامل',
    religion: 'الديانة',
    muslim: 'مسلم',
    nonMuslim: 'غير مسلم',
    experience: 'سبق له العمل',
    hasExperience: 'سبق له العمل',
    noExperience: 'لم يسبق له العمل',
    isActive: 'حالة النشاط',
    isActiveLabel: 'نشط',
    approvalStatus: 'حالة الموافقة',
    approved: 'تم الموافقة',
    notApproved: 'لم يتم الموافقة',
    visaNo: 'رقم التأشيرة',
    flightNo: 'رقم الرحلة',
    age: 'العمر',
    phone: 'تليفون ارضي',
    airline: 'الخطوط الناقلة',
    sponsorshipTransfer: 'نقل الكفالة',
    transferred: 'تم نقل الخدمات',
    all: 'الكل',
    // Status options
    statusReceived: 'استلام العامل',
    statusEscaped: 'هروب العامل',
    statusSick: 'مريض',
    statusRefused: 'رفض العمل',
    statusReturnTravel: 'خروج وعودة',
    statusSuspended: 'ايقاف مؤقت',
    statusFinalExit: 'خروج نهائي',
    statusReturnWork: 'العودة الى العمل',
    statusEmergencyExit: 'خروج طوارئ',
    statusChangeAccom: 'تغير الايواء',
    statusAccom: 'تسكين العامل',
    statusEndService: 'انهاء الخدمة',
    // Worker type options
    typeMediation: 'التوسط',
    typeTransfer: 'نقل الخدمات',
    typeVisit: 'زيارة',
    typeDuration: 'المدة',
    typeTransferContract: 'عقود نقل الخدمات',
    // Card fields
    salary: 'الراتب',
    skills: 'المهارات',
    noSkills: 'لا توجد مهارات',
    actions: 'الإجراءات',
    view: 'عرض',
    edit: 'تعديل',
    delete: 'حذف',
    createWorker: 'إنشاء عامل',
    updateWorker: 'تحديث العامل',
    cancel: 'إلغاء',
    save: 'حفظ',
    noWorkers: 'لا يوجد عمال',
    noWorkersDesc: 'لا يوجد عمال يطابقون معايير البحث',
    deleteConfirm: 'هل أنت متأكد من حذف هذا العامل؟',
    deleteTitle: 'حذف العامل',
    years: 'سنة',
    reference: 'المرجع',
    mobile: 'الجوال',
    birthDate: 'تاريخ الميلاد',
    status: 'الحالة',
    active: 'نشط',
    inactive: 'غير نشط',
    pending: 'قيد الانتظار',
    refused: 'مرفوض',
    single: 'أعزب',
    married: 'متزوج',
    // Form
    basicInfo: 'المعلومات الأساسية',
    addressAr: 'العنوان (عربي)',
    addressEn: 'العنوان (إنجليزي)',
    passportIssueDate: 'تاريخ الإصدار',
    passportExpiryDate: 'تاريخ الانتهاء',
    passportIssuePlace: 'مكان الإصدار',
    passportIssuePlaceAr: 'مكان الإصدار (عربي)',
    passportIssuePlaceEn: 'مكان الإصدار (إنجليزي)',
    educationLevel: 'المستوى التعليمي',
    educationLevelAr: 'التعليم (عربي)',
    educationLevelEn: 'التعليم (إنجليزي)',
    maritalStatus: 'الحالة الاجتماعية',
    childrenCount: 'الأطفال',
    weight: 'الوزن (كجم)',
    height: 'الطول (سم)',
    referenceNo: 'رقم المرجع',
    basicSalary: 'الراتب الأساسي',
    boxNumber: 'رقم الصندوق',
    borderNumber: 'رقم الحدود',
    uploadImage: 'صورة العامل',
    noImage: 'لا توجد صورة',
    viewWorker: 'تفاصيل العامل',
    personalDetails: 'البيانات الشخصية',
    passportDetails: 'بيانات الجواز',
    workDetails: 'بيانات العمل',
    contactDetails: 'بيانات التواصل',
    addressDetails: 'بيانات العنوان',
    close: 'إغلاق',
    agentName: 'اسم الوكيل',
    createdBy: 'تم الانشاء بواسطة',
    workerImage: 'صورة العامل',
    markEscape: 'تسجيل هروب',
    markRefused: 'تسجيل رفض',
    markSick: 'تسجيل مرض',
    deactivate: 'إيقاف',
    markOut: 'تسجيل خروج',
    statusActionReceived: 'استلام العامل',
    statusActionSuspended: 'ايقاف مؤقت',
    statusActionFinalExit: 'خروج نهائي',
    statusActionReturnWork: 'العودة الى العمل',
    confirmStatusUpdate: 'هل أنت متأكد من تحديث حالة العامل؟',
    isActiveSaved: 'تم تحديث حالة النشاط',
    editWorkerFirst: 'يرجى حفظ العامل أولاً قبل تعديل حالة النشاط',
    moreActions: 'المزيد من الإجراءات',
    medicalExamination: 'الفحص الطبي',
    examDate: 'تاريخ الفحص',
    medicalStatus: 'الحالة الطبية',
    notes: 'ملاحظات',
    medicalStatusPassed: 'ناجح',
    medicalStatusFailed: 'راسب',
    medicalStatusPending: 'قيد الانتظار',
    createMedicalExam: 'إنشاء فحص طبي',
    viewExamRecord: 'عرض سجل الفحص',
    editExamRecord: 'تعديل سجل الفحص',
    viewDocument: 'عرض المستند',
    noDocument: 'لا يوجد مستند محمل',
    ageRange: 'نطاق العمر',
    ageMin: 'العمر الأدنى',
    ageMax: 'العمر الأقصى',
    passportFilter: 'رقم الجواز',
    printCV: 'طباعة السيرة الذاتية',
    documents: 'المستندات',
    passportScan: 'صورة الجواز',
    noDocuments: 'لا توجد مستندات محملة',
  },
};



type WorkerAttachmentItem = {
  url: string;
  file?: File;
};

export default function WorkersPage() {
  const router = useRouter();
  const language = useAuthStore((state) => state.language);
  const userBranchId = useAuthStore((state) => state.branchId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);
  const [medicalExamWorkerId, setMedicalExamWorkerId] = useState<number | string | null>(null);
  const [medicalExamId, setMedicalExamId] = useState<number | string | null>(null);
  /** true = view-only mode for existing record; false = edit/create mode */
  const [medicalExamViewOnly, setMedicalExamViewOnly] = useState(false);
  /** worker id whose medical exam check is in-flight (for button loading state) */
  const [pendingMedicalCheckId, setPendingMedicalCheckId] = useState<string | null>(null);
  /** exam data returned by the check-worker API, used in the view-only modal */
  const [checkedMedicalExam, setCheckedMedicalExam] = useState<import('@/types/api.types').MedicalExamination | null>(null);
  /** worker id whose uploaded document (passport scan) is being previewed */
  const [docViewerWorkerId, setDocViewerWorkerId] = useState<number | string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState<{
    search?: string;
    gender?: string;
    nationality?: string;
    job?: string;
    agent?: string;
    status?: string;
    workerType?: string;
    deletionStatus?: string;
    ageMin?: number;
    ageMax?: number;
    passportFilter?: string;
    nationalId?: string;
    mobile?: string;
    branchId?: string;
    includeSubBranches?: boolean;
    createdDateFrom?: string;
    createdDateTo?: string;
    employeeId?: string;
    updatedDateFrom?: string;
    updatedDateTo?: string;
  }>({ includeSubBranches: true });
  const [pageNumber, setPageNumber] = useState(1);
  const PAGE_SIZE = 50;
  const [form] = Form.useForm();
  const [medicalExamForm] = Form.useForm();
  const [housingForm] = Form.useForm();
  /** worker id for whom we are opening the "assign to housing" modal */
  const [housingModalWorkerId, setHousingModalWorkerId] = useState<string | null>(null);
  /** New worker image file selected in the form */
  const [workerImageFile, setWorkerImageFile] = useState<File | null>(null);
  /** Preview URL for the image */
  const [workerImagePreview, setWorkerImagePreview] = useState<string | null>(null);
  /** Additional attachments: existing URLs plus new local files */
  const [workerExtraImages, setWorkerExtraImages] = useState<WorkerAttachmentItem[]>([]);
  /** New video file selected in the form */
  const [workerVideoFile, setWorkerVideoFile] = useState<File | null>(null);
  /** Existing video URL (from API) or object URL for new file */
  const [workerVideoUrl, setWorkerVideoUrl] = useState<string | null>(null);

  const t = (key: keyof typeof translations.en) => {
    const lang = translations[language];
    return lang[key] || key;
  };

  const workerApiParams = useMemo(() => {
    const p: import('@/hooks/api/useWorkers').WorkerFilterParams = {
      PageNumber: pageNumber,
      PageSize: PAGE_SIZE,
    };
    if (filters.search) p.SearchName = filters.search;
    if (filters.nationalId) p.NationalId = filters.nationalId;
    if (filters.passportFilter) p.PassportNo = filters.passportFilter;
    if (filters.mobile) p.Mobile = filters.mobile;
    if (filters.nationality) p.NationalityId = String(filters.nationality);
    if (filters.job) p.JobId = String(filters.job);
    if (filters.agent) p.AgentId = String(filters.agent);
    if (activeTab !== 0) p.WorkerStatus = activeTab;
    else if (filters.status) p.WorkerStatus = Number(filters.status);
    if (filters.ageMin !== undefined) p.MinAge = filters.ageMin;
    if (filters.ageMax !== undefined) p.MaxAge = filters.ageMax;
    if (filters.branchId) {
      p.BranchId = filters.branchId;
      p.IncludeSubBranches = filters.includeSubBranches;
    }
    if (filters.createdDateFrom) p.CreatedDateFrom = filters.createdDateFrom;
    if (filters.createdDateTo) p.CreatedDateTo = filters.createdDateTo;
    if (filters.employeeId) p.EmployeeId = filters.employeeId;
    if (filters.updatedDateFrom) p.UpdatedDateFrom = filters.updatedDateFrom;
    if (filters.updatedDateTo) p.UpdatedDateTo = filters.updatedDateTo;
    return p;
  }, [filters, activeTab, pageNumber]);

  const {
    data: workersResult,
    isLoading,
  } = useWorkersFiltered(workerApiParams);

  const workers = workersResult?.workers ?? [];
  const totalWorkers = workersResult?.total ?? 0;
  const { data: jobs = [] } = useJobs();
  const { data: agents = [] } = useAgents();
  const { data: nationalities = [] } = useNationalities();
  const { employees: hrEmployees } = useHREmployees({ pageSize: 200 });
  const { data: medicalExaminations = [] } = useMedicalExaminations();
  const { data: activeHousings = [] } = useHousingActiveList();
  const { mutateAsync: assignToHousing, isPending: isAssigning } = useAssignWorkerHousing();

  // Only show active jobs in the filter
  const availableJobs = useMemo(() => {
    return jobs
      .filter((job) => job.isActive)
      .map((job) => ({
        value: String(job.id),
        label:
          language === 'ar'
            ? job.jobNameAr || job.jobNameEn || ''
            : job.jobNameEn || job.jobNameAr || '',
      }));
  }, [jobs, language]);

  const availableAgents = useMemo(() => {
    return agents
      .filter((a: any) => (a.isActive === undefined ? true : a.isActive))
      .map((a: any) => ({
        value: String(a.id),
        label:
          language === 'ar'
            ? a.agentNameAr || a.agentNameEn || ''
            : a.agentNameEn || a.agentNameAr || '',
      }));
  }, [agents, language]);

  const employeeOptions = useMemo(() => {
    return hrEmployees.map((e) => ({
      value: e.id,
      label: `${e.nameAr || e.nameEn || '—'}${e.employeeNumber ? ` (${e.employeeNumber})` : ''}`,
    }));
  }, [hrEmployees]);
  const { mutate: createWorker, isPending: isCreating } = useCreateWorker();
  const { mutate: updateWorker, isPending: isUpdating } = useUpdateWorker();
  const { mutate: deleteWorker } = useDeleteWorker();
  const { mutate: workerRefused } = useWorkerRefused();
  const { mutate: workerDeactivate, isPending: isDeactivating } = useWorkerDeactivate();
  const { mutate: workerOut } = useWorkerOut();
  const { mutate: createMedicalExamination, isPending: isCreatingMedicalExam } =
    useCreateMedicalExamination();
  const { mutate: updateMedicalExamination, isPending: isUpdatingMedicalExam } =
    useUpdateMedicalExamination();
  const { mutate: deleteMedicalExamination, isPending: isDeletingMedicalExam } =
    useDeleteMedicalExamination();
  const { mutateAsync: checkWorkerMedicalExam } = useCheckWorkerMedicalExamination();

  // Fetch editing worker details when opening edit modal
  const { data: editingWorker } = useWorker(editingWorkerId ?? undefined);

  const openDetail = (id: number | string) => router.push(`/applicants/${id}`);

  // Tab items — keys match workerStatus values (1=Available, 2=Trial, 3-6 unchanged)
  const tabs = [
    { key: 0, label: t('tabAll'), icon: <FileTextOutlined /> },
    { key: 1, label: t('tabAvailable'), icon: <CheckCircleOutlined /> },
    { key: 2, label: t('tabTrial'), icon: <ClockCircleOutlined /> },
    { key: 3, label: t('tabUnderProcedure'), icon: <FileTextOutlined /> },
    { key: 4, label: t('tabBackOut'), icon: <ExclamationCircleOutlined /> },
    { key: 5, label: t('tabInsideKingdom'), icon: <EnvironmentOutlined /> },
    { key: 6, label: t('tabDeported'), icon: <StopOutlined /> },
  ];

  // Client-side filtering for fields not supported by the API (gender, workerType)
  const filteredWorkers = useMemo(() => {
    return workers.filter((worker) => {
      const matchesGender = !filters.gender || worker.gender === Number(filters.gender);
      const matchesWorkerType =
        !filters.workerType || worker.workerType === Number(filters.workerType);
      return matchesGender && matchesWorkerType;
    });
  }, [workers, filters.gender, filters.workerType]);

  const handleDownloadAllInfoReport = async () => {
    const { printAllWorkersPDF } = await import('@/utils/pdf');
    await printAllWorkersPDF(filteredWorkers, {
      title: 'All Info Report',
      titleAr: 'تقرير كل البيانات',
      fileName: `All_Info_Report_${new Date().toISOString().slice(0, 10)}`,
    });
  };

  // Modal handlers
  const handleOpenModal = (worker?: Worker) => {
    setWorkerImageFile(null);
    setWorkerImagePreview(null);
    setWorkerExtraImages([]);
    setWorkerVideoFile(null);
    setWorkerVideoUrl(null);
    if (worker?.id) {
      setEditingWorkerId(String(worker.id));
    } else {
      setEditingWorkerId(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingWorkerId(null);
    form.resetFields();
    setWorkerImageFile(null);
    setWorkerImagePreview(null);
    setWorkerExtraImages([]);
    setWorkerVideoFile(null);
    setWorkerVideoUrl(null);
  };

  // Populate form when editing worker details are loaded
  useEffect(() => {
    if (editingWorker) {
      // Pre-load existing image for editing
      if (editingWorker.uploadImage) {
        setWorkerImageFile(null);
        setWorkerImagePreview(editingWorker.uploadImage as string);
      } else {
        setWorkerImageFile(null);
        setWorkerImagePreview(null);
      }
      // Pre-load existing video for editing
      if (editingWorker.uploadVideo) {
        setWorkerVideoFile(null);
        setWorkerVideoUrl(editingWorker.uploadVideo as string);
      } else {
        setWorkerVideoFile(null);
        setWorkerVideoUrl(null);
      }
      if (editingWorker.attachments) {
        setWorkerExtraImages(editingWorker.attachments.map((url) => ({ url })));
      } else {
        setWorkerExtraImages([]);
      }
      form.setFieldsValue({
        ...editingWorker,
        jobId: editingWorker.jobId ? String(editingWorker.jobId) : undefined,
        agentId: editingWorker.agentId ? String(editingWorker.agentId) : undefined,
        nationalityId: editingWorker.nationalityId ? String(editingWorker.nationalityId) : undefined,
        birthDate: editingWorker.birthDate ? dayjs(editingWorker.birthDate) : undefined,
        passportIssueDate: editingWorker.passportIssueDate
          ? dayjs(editingWorker.passportIssueDate)
          : undefined,
        passportExpiryDate: editingWorker.passportExpiryDate
          ? dayjs(editingWorker.passportExpiryDate)
          : undefined,
      });
    }
  }, [editingWorker, form]);

  const handleSubmit = async (values: any) => {
    const { isActive: _isActive, ...restValues } = values;
    const workerData: WorkerDto = {
      ...restValues,
      birthDate: restValues.birthDate?.format('YYYY-MM-DD'),
      passportIssueDate: restValues.passportIssueDate?.format('YYYY-MM-DD'),
      passportExpiryDate: restValues.passportExpiryDate?.format('YYYY-MM-DD'),
      gender: restValues.gender !== undefined ? Number(restValues.gender) : undefined,
      maritalStatus:
        restValues.maritalStatus !== undefined ? Number(restValues.maritalStatus) : undefined,
      nationalityId: restValues.nationalityId ? String(restValues.nationalityId) : undefined,
      jobId: restValues.jobId ? String(restValues.jobId) : undefined,
      agentId: restValues.agentId ? String(restValues.agentId) : undefined,
      workerType: restValues.workerType ? Number(restValues.workerType) : undefined,
      workerStatus: restValues.workerStatus ? Number(restValues.workerStatus) : undefined,
      uploadImage: workerImageFile || undefined,
      uploadVideo: workerVideoFile || undefined,
      attachments: workerExtraImages.map((item) => item.file).filter((file): file is File => !!file),
    };

    if (editingWorkerId !== null) {
      updateWorker({ id: editingWorkerId, data: workerData });
    } else {
      // Scope new workers to the creator's branch (backend also falls back to
      // the JWT branchId if omitted).
      createWorker({ ...workerData, branchId: userBranchId ?? undefined });
    }
    handleCloseModal();
  };

  const handleMedicalExamSubmit = async (values: any) => {
    if (medicalExamWorkerId === null) return;

    const medicalStatus = Number(values.medicalStatus);
    const payload = {
      workerId: String(medicalExamWorkerId),
      examDate: values.examDate?.toISOString() ?? null,
      medicalStatus,
      notes: values.notes || '',
    };

    const onSuccess = () => {
      // Auto-set WorkerStatus to 4 (Backout) when medical exam result is Failed (3)
      if (medicalStatus === 3) {
        updateWorker({ id: medicalExamWorkerId, data: { workerStatus: 4 } });
      }
      medicalExamForm.resetFields();
      setMedicalExamWorkerId(null);
      setMedicalExamId(null);
      setMedicalExamViewOnly(false);
    };

    if (medicalExamId !== null) {
      updateMedicalExamination({ id: medicalExamId, data: payload }, { onSuccess });
    } else {
      createMedicalExamination(payload, { onSuccess });
    }
  };

  const handleMedicalExamDelete = () => {
    if (medicalExamId === null) return;
    Modal.confirm({
      title: language === 'ar' ? 'حذف الفحص الطبي' : 'Delete Medical Examination',
      icon: <ExclamationCircleOutlined />,
      content:
        language === 'ar'
          ? 'هل أنت متأكد من حذف هذا الفحص الطبي؟'
          : 'Are you sure you want to delete this medical examination?',
      okText: t('delete'),
      cancelText: t('cancel'),
      okButtonProps: { danger: true },
      onOk: () => {
        deleteMedicalExamination(medicalExamId, {
          onSuccess: () => {
            medicalExamForm.resetFields();
            setMedicalExamWorkerId(null);
            setMedicalExamId(null);
            setCheckedMedicalExam(null);
          },
        });
      },
    });
  };

  const handleOpenMedicalExam = async (workerId: number | string) => {
    setPendingMedicalCheckId(String(workerId));
    try {
      const exam = await checkWorkerMedicalExam(workerId);
      setMedicalExamWorkerId(workerId);
      if (exam) {
        setCheckedMedicalExam(exam);
        setMedicalExamId(exam.id);
        setMedicalExamViewOnly(true);
        medicalExamForm.setFieldsValue({
          examDate: exam.examDate ? dayjs(exam.examDate) : undefined,
          medicalStatus: exam.medicalStatus,
          notes: exam.notes,
        });
      } else {
        setCheckedMedicalExam(null);
        setMedicalExamId(null);
        setMedicalExamViewOnly(false);
        medicalExamForm.resetFields();
      }
    } finally {
      setPendingMedicalCheckId(null);
    }
  };

  const handleDelete = async (id: number | string) => {
    const exam = await checkWorkerMedicalExam(id);
    if (exam) {
      Modal.warning({
        title: language === 'ar' ? 'لا يمكن حذف العمالة' : 'Cannot Delete Worker',
        icon: <ExclamationCircleOutlined />,
        content:
          language === 'ar'
            ? 'يجب حذف الفحص الطبي أولاً قبل حذف هذه العمالة'
            : 'This worker has a medical examination. Please delete the medical examination first before deleting the worker.',
      });
      return;
    }
    Modal.confirm({
      title: t('deleteTitle'),
      icon: <ExclamationCircleOutlined />,
      content: t('deleteConfirm'),
      okText: t('delete'),
      cancelText: t('cancel'),
      okButtonProps: { danger: true },
      onOk: () => deleteWorker(id),
    });
  };

  const handleClearFilters = () => {
    setFilters({});
    setPageNumber(1);
  };

  const handlePrintCV = async (worker: Worker) => {
    const { printWorkerCVPDF } = await import('@/utils/pdf');
    await printWorkerCVPDF(worker);
  };

  const handleWorkerStatusAction = (worker: Worker, action: string) => {
    switch (action) {
      case 'escape':
        // WorkerEscape removed in new API — no replacement
        message.warning('هذا الإجراء غير متاح في الواجهة الجديدة / This action is not available in the new API');
        break;
      case 'refused':
        workerRefused(worker.id);
        break;
      case 'sick':
        // WorkerSick removed in new API — no replacement
        message.warning('هذا الإجراء غير متاح في الواجهة الجديدة / This action is not available in the new API');
        break;
      case 'deactivate':
        workerDeactivate(worker.id);
        break;
      case 'out':
        workerOut(worker.id);
        break;
      case 'received':
        updateWorker({ id: worker.id, data: { workerStatus: 1 } });
        break;
      case 'suspended':
        updateWorker({ id: worker.id, data: { workerStatus: 6 } });
        break;
    }
  };

  const confirmWorkerStatusAction = (worker: Worker, action: string) => {
    Modal.confirm({
      title: t('workerStatus'),
      icon: <ExclamationCircleOutlined />,
      content: t('confirmStatusUpdate'),
      okText: t('save'),
      cancelText: t('cancel'),
      onOk: () => handleWorkerStatusAction(worker, action),
    });
  };

  const handleIsActiveToggle = (workerId: number | string | null) => {
    if (!workerId) return;
    workerDeactivate(workerId);
  };

  // Status tag
  const getStatusTag = (status?: number | null) => {
    const statusConfig: Record<number, { color: string; icon: React.ReactNode; label: string }> = {
      1: { color: 'success', icon: <CheckCircleOutlined />, label: t('tabAvailable') },
      2: { color: 'processing', icon: <ClockCircleOutlined />, label: t('tabTrial') },
      3: { color: 'warning', icon: <FileTextOutlined />, label: t('tabUnderProcedure') },
      4: { color: 'error', icon: <ExclamationCircleOutlined />, label: t('tabBackOut') },
      5: { color: 'cyan', icon: <EnvironmentOutlined />, label: t('tabInsideKingdom') },
      6: { color: 'default', icon: <StopOutlined />, label: t('tabDeported') },
    };

    const config = statusConfig[status || 0] || {
      color: 'default',
      icon: null,
      label: t('pending'),
    };

    return (
      <Tag color={config.color} icon={config.icon}>
        {config.label}
      </Tag>
    );
  };

  // Gender helper
  const getGenderLabel = (g?: number | null) => getEnumLabel(GENDER, g, language);

  // Action menu
  const getActionMenu = (worker: Worker): MenuProps => ({
    items: [
      {
        key: 'status-actions',
        label: t('workerStatus'),
        icon: <ClockCircleOutlined />,
        children: [
          {
            key: 'received',
            label: t('statusActionReceived'),
            icon: <ClockCircleOutlined />,
            onClick: () => confirmWorkerStatusAction(worker, 'received'),
          },
          {
            key: 'escape',
            label: t('markEscape'),
            icon: <ExclamationCircleOutlined />,
            onClick: () => confirmWorkerStatusAction(worker, 'escape'),
          },
          {
            key: 'sick',
            label: t('markSick'),
            icon: <MedicineBoxOutlined />,
            onClick: () => confirmWorkerStatusAction(worker, 'sick'),
          },
          {
            key: 'refused',
            label: t('markRefused'),
            icon: <CloseCircleOutlined />,
            onClick: () => confirmWorkerStatusAction(worker, 'refused'),
          },
          {
            key: 'out',
            label: t('markOut'),
            icon: <LogoutOutlined />,
            onClick: () => confirmWorkerStatusAction(worker, 'out'),
          },
          {
            key: 'suspended',
            label: t('statusActionSuspended'),
            icon: <StopOutlined />,
            onClick: () => confirmWorkerStatusAction(worker, 'suspended'),
          },
          {
            key: 'deactivate',
            label: t('deactivate'),
            icon: <StopOutlined />,
            onClick: () => confirmWorkerStatusAction(worker, 'deactivate'),
          },
        ],
      },
      { type: 'divider' },
      {
        key: 'delete',
        label: t('delete'),
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => handleDelete(worker.id),
      },
    ],
  });

  if (isLoading) {
    return (
      <div className={styles.workersPage}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
          }}
        >
          <Spin size="large" tip={language === 'ar' ? 'جاري التحميل...' : 'Loading...'} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.workersPage}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <TeamOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('pageTitle')}</h1>
            </div>
          </div>
          <div className={styles.headerButtons}>
            <Button
              className={styles.headerBtn}
              icon={<FilePdfOutlined />}
              onClick={handleDownloadAllInfoReport}
            >
              {t('downloadPdf')}
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              className={styles.addButton}
              onClick={() => handleOpenModal()}
              loading={isCreating}
            >
              {t('addWorker')}
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNav}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tabItem} ${activeTab === tab.key ? styles.tabItemActive : ''}`}
            onClick={() => { setActiveTab(tab.key); setPageNumber(1); }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

    
      

      {/* Search and Filters */}
      <Card className={styles.filterCard}>
        <div className={styles.filterHeader}>
          <Space wrap>
            <Input
              size="large"
              placeholder={t('searchPlaceholder')}
              prefix={<SearchOutlined />}
              value={filters.search || ''}
              onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPageNumber(1); }}
              style={{ width: 300 }}
              allowClear
            />
            <BranchFilterSelect
              value={filters.branchId}
              onChange={(v) => {
                setFilters({ ...filters, branchId: v });
                setPageNumber(1);
              }}
              includeSubBranches={filters.includeSubBranches ?? true}
              onIncludeSubBranchesChange={(v) =>
                setFilters({ ...filters, includeSubBranches: v })
              }
            />
            <Button
              icon={<FilterOutlined />}
              onClick={() => setShowFilters(!showFilters)}
              type={showFilters ? 'primary' : 'default'}
              size="large"
            >
              {t('filters')}
            </Button>
            <ExportButton
              endpoint={API_ENDPOINTS.WORKERS.EXPORT}
              filters={workerApiParams}
              fileName="Workers.xlsx"
            />
          </Space>
        </div>

        {showFilters && (
          <div className={styles.filterContent}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={6}>
                <label className={styles.filterLabel}>{t('nationality')}</label>
                <Select
                  size="large"
                  placeholder={t('nationality')}
                  value={filters.nationality}
                  onChange={(value) => setFilters({ ...filters, nationality: value })}
                  style={{ width: '100%' }}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={nationalities.map((n) => ({
                    value: n.id,
                    label: language === 'ar' ? n.nationalityNameAr : n.nationalityNameEn,
                  }))}
                />
              </Col>

              <Col xs={24} md={6}>
                <label className={styles.filterLabel}>{t('jobname')}</label>
                <Select
                  size="large"
                  placeholder={t('jobname')}
                  value={filters.job}
                  onChange={(value) => setFilters({ ...filters, job: value })}
                  style={{ width: '100%' }}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={availableJobs}
                />
              </Col>

              <Col xs={24} md={6}>
                <label className={styles.filterLabel}>{t('agent')}</label>
                <Select
                  size="large"
                  placeholder={t('agent')}
                  value={filters.agent}
                  onChange={(value) => setFilters({ ...filters, agent: value })}
                  style={{ width: '100%' }}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={availableAgents}
                />
              </Col>

              <Col xs={24} md={6}>
                <label className={styles.filterLabel}>{t('employee')}</label>
                <Select
                  size="large"
                  placeholder={t('employee')}
                  value={filters.employeeId}
                  onChange={(value) => {
                    setFilters({ ...filters, employeeId: value });
                    setPageNumber(1);
                  }}
                  style={{ width: '100%' }}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={employeeOptions}
                />
              </Col>

              <Col xs={24} md={6}>
                <label className={styles.filterLabel}>{t('gender')}</label>
                <Select
                  size="large"
                  placeholder={t('gender')}
                  value={filters.gender}
                  onChange={(value) => setFilters({ ...filters, gender: value })}
                  style={{ width: '100%' }}
                  allowClear
                  options={toSelectOptions([...GENDER], language).map((o) => ({
                    value: String(o.value),
                    label: o.label,
                  }))}
                />
              </Col>

              <Col xs={24} md={6}>
                <label className={styles.filterLabel}>{t('workerType')}</label>
                <Select
                  size="large"
                  placeholder={t('workerType')}
                  value={filters.workerType}
                  onChange={(value) => setFilters({ ...filters, workerType: value })}
                  style={{ width: '100%' }}
                  allowClear
                  options={toSelectOptions([...WORKER_CONTRACT_TYPE], language).map((o) => ({
                    value: String(o.value),
                    label: o.label,
                  }))}
                />
              </Col>

              <Col xs={24} md={6}>
                <label className={styles.filterLabel}>{t('workerStatus')}</label>
                <Select
                  size="large"
                  placeholder={t('workerStatus')}
                  value={filters.status}
                  onChange={(value) => setFilters({ ...filters, status: value })}
                  style={{ width: '100%' }}
                  allowClear
                  options={toSelectOptions([...WORKER_SATUS], language).map((o) => ({
                    value: String(o.value),
                    label: o.label,
                  }))}
                />
              </Col>

              <Col xs={24} md={6}>
                <label className={styles.filterLabel}>{t('passportFilter')}</label>
                <Input
                  size="large"
                  placeholder={t('passportFilter')}
                  value={filters.passportFilter || ''}
                  onChange={(e) => {
                    setFilters({ ...filters, passportFilter: e.target.value || undefined });
                    setPageNumber(1);
                  }}
                  allowClear
                />
              </Col>

              <Col xs={24} md={6}>
                <label className={styles.filterLabel}>{t('nationalIdFilter')}</label>
                <Input
                  size="large"
                  placeholder={t('nationalIdFilter')}
                  value={filters.nationalId || ''}
                  onChange={(e) => {
                    setFilters({ ...filters, nationalId: e.target.value || undefined });
                    setPageNumber(1);
                  }}
                  allowClear
                />
              </Col>

              <Col xs={24} md={6}>
                <label className={styles.filterLabel}>{t('mobileFilter')}</label>
                <Input
                  size="large"
                  placeholder={t('mobileFilter')}
                  value={filters.mobile || ''}
                  onChange={(e) => {
                    setFilters({ ...filters, mobile: e.target.value || undefined });
                    setPageNumber(1);
                  }}
                  allowClear
                />
              </Col>

              <Col xs={24} md={3}>
                <label className={styles.filterLabel}>{t('ageMin')}</label>
                <InputNumber
                  size="large"
                  min={0}
                  max={100}
                  placeholder={t('ageMin')}
                  value={filters.ageMin}
                  onChange={(value) =>
                    setFilters({ ...filters, ageMin: value ?? undefined })
                  }
                  style={{ width: '100%' }}
                />
              </Col>

              <Col xs={24} md={3}>
                <label className={styles.filterLabel}>{t('ageMax')}</label>
                <InputNumber
                  size="large"
                  min={0}
                  max={100}
                  placeholder={t('ageMax')}
                  value={filters.ageMax}
                  onChange={(value) =>
                    setFilters({ ...filters, ageMax: value ?? undefined })
                  }
                  style={{ width: '100%' }}
                />
              </Col>

              <Col xs={24} md={12}>
                <label className={styles.filterLabel}>
                  {language === 'ar' ? 'تاريخ الإنشاء' : 'Created date'}
                </label>
                <DateRangeFilter
                  value={[filters.createdDateFrom, filters.createdDateTo]}
                  onChange={([from, to]) => {
                    setFilters({ ...filters, createdDateFrom: from, createdDateTo: to });
                    setPageNumber(1);
                  }}
                  style={{ width: '100%' }}
                />
              </Col>

              <Col xs={24} md={12}>
                <label className={styles.filterLabel}>
                  {language === 'ar' ? 'تاريخ آخر تحديث' : 'Updated date'}
                </label>
                <DateRangeFilter
                  value={[filters.updatedDateFrom, filters.updatedDateTo]}
                  onChange={([from, to]) => {
                    setFilters({ ...filters, updatedDateFrom: from, updatedDateTo: to });
                    setPageNumber(1);
                  }}
                  style={{ width: '100%' }}
                />
              </Col>
            </Row>
            <div className={styles.filterActions}>
              <Button icon={<ClearOutlined />} onClick={handleClearFilters}>
                {t('clearFilters')}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Active Filters Display */}
      {Object.values(filters).some((v) => v !== undefined && v !== '') && (
        <div className={styles.activeFilters}>
          <div className={styles.filterTags}>
            <span style={{ fontWeight: 600, color: '#334155' }}>
              {language === 'ar' ? 'التصفيات النشطة:' : 'Active Filters:'}
            </span>
            {filters.search && (
              <Tag closable onClose={() => setFilters({ ...filters, search: undefined })}>
                {filters.search}
              </Tag>
            )}
            {filters.gender && (
              <Tag closable onClose={() => setFilters({ ...filters, gender: undefined })}>
                {t(filters.gender as any)}
              </Tag>
            )}
            <Button
              type="link"
              size="small"
              className={styles.clearFiltersButton}
              icon={<ClearOutlined />}
              onClick={handleClearFilters}
            >
              {t('clearFilters')}
            </Button>
          </div>
        </div>
      )}

      {/* Workers Grid */}
      {filteredWorkers.length === 0 ? (
        <Card className={styles.emptyState}>
          <Empty description={t('noWorkersDesc')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </Card>
      ) : (
        <div className={styles.workersGrid}>
          {filteredWorkers.map((worker) => (
            <Card key={worker.id} className={styles.workerCard}>
              <div className={styles.workerCardHeader}>
                <p className={styles.workerReference}>
                  {t('reference')}: {worker.referenceNo || 'N/A'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Tooltip title={worker.isActive ? t('active') : t('inactive')}>
                    <Switch
                      checked={worker.isActive ?? false}
                      onChange={() => handleIsActiveToggle(worker.id)}
                      loading={isDeactivating}
                      size="small"
                    />
                  </Tooltip>
                  {getStatusTag(worker.workerStatus)}
                </div>
              </div>

              <div className={styles.workerCardBody}>
                {/* Worker Image */}
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                  {worker.uploadImage ? (
                    <Image
                      src={resolveImageUrl(worker.uploadImage)}
                      alt={worker.fullNameAr || 'Worker'}
                      width={100}
                      height={100}
                      style={{
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid #003366',
                      }}
                      preview={{ mask: <EyeOutlined style={{ fontSize: 18 }} /> }}
                    />
                  ) : (
                    <Avatar
                      size={100}
                      icon={<UserOutlined />}
                      style={{
                        backgroundColor: worker.gender === GENDER[1].value ? '#f472b6' : '#003366',
                      }}
                    />
                  )}
                </div>

                <h3
                  className={styles.workerName}
                  style={{ cursor: 'pointer' }}
                  onClick={() => openDetail(worker.id)}
                >
                  <UserOutlined />
                  {language === 'ar' ? worker.fullNameAr : worker.fullNameEn || worker.fullNameAr}
                </h3>

                <div className={styles.workerDetails}>
                  <div className={styles.detailRow}>
                    <IdcardOutlined className={styles.detailIcon} />
                    <span className={styles.detailLabel}>{t('passportNo')}:</span>
                    <span className={styles.detailValue}>{worker.passportNo || 'N/A'}</span>
                  </div>

                  <div className={styles.detailRow}>
                    <EnvironmentOutlined className={styles.detailIcon} />
                    <span className={styles.detailLabel}>{t('nationality')}:</span>
                    <span className={styles.detailValue}>
                      {worker.nationalityName ||
                        (worker.nationalityId
                          ? (nationalities.find((n) => n.id === worker.nationalityId)?.[
                              language === 'ar' ? 'nationalityNameAr' : 'nationalityNameEn'
                            ] ?? 'N/A')
                          : 'N/A')}
                    </span>
                  </div>

                  <div className={styles.detailRow}>
                    <TrophyOutlined className={styles.detailIcon} />
                    <span className={styles.detailLabel}>{t('jobname')}:</span>
                    <span className={styles.detailValue}>
                      {worker.jobName || worker.jobname ||
                        (() => {
                          const job = jobs.find((j) => String(j.id) === String(worker.jobId));
                          return job
                            ? (language === 'ar' ? job.jobNameAr || job.jobNameEn : job.jobNameEn || job.jobNameAr) || 'N/A'
                            : 'N/A';
                        })()}
                    </span>
                  </div>

                  <div className={styles.detailRow}>
                    <CalendarOutlined className={styles.detailIcon} />
                    <span className={styles.detailLabel}>{t('age')}:</span>
                    <span className={styles.detailValue}>
                      {worker.age ? `${worker.age} ${t('years')}` : 'N/A'}
                    </span>
                  </div>

                  <div className={styles.detailRow}>
                    <UserOutlined className={styles.detailIcon} />
                    <span className={styles.detailLabel}>{t('agentName')}:</span>
                    <span className={styles.detailValue}>{worker.agentName || 'N/A'}</span>
                  </div>

                  {/* Medical Examination */}
                  {medicalExaminations.find((exam) => String(exam.workerId) === String(worker.id)) && (
                    <div className={styles.detailRow}>
                      <MedicineBoxOutlined className={styles.detailIcon} />
                      <span className={styles.detailLabel}>{t('medicalExamination')}:</span>
                      <span className={styles.detailValue}>
                        {(() => {
                          const exam = medicalExaminations.find(
                            (e) => String(e.workerId) === String(worker.id)
                          );
                          return exam
                            ? getEnumLabel(MEDICAL_STATUS, exam.medicalStatus, language)
                            : 'N/A';
                        })()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Badges */}
                <div className={styles.workerBadges}>
                  {worker.gender !== undefined && worker.gender !== null && (
                    <Tag
                      color={worker.gender === GENDER[0].value ? 'blue' : 'pink'}
                      icon={worker.gender === GENDER[0].value ? <ManOutlined /> : <WomanOutlined />}
                    >
                      {getGenderLabel(worker.gender)}
                    </Tag>
                  )}
                  {worker.hasExperience && (
                    <Tag color="orange" icon={<TrophyOutlined />}>
                      {t('hasExperience')}
                    </Tag>
                  )}
                  {/* {worker.religion !== undefined && worker.religion !== null && (
                    <Tag color="cyan">
                      {worker.religion === 1
                        ? t('muslim')
                        : worker.religion === 2
                          ? t('nonMuslim')
                          : worker.religion}
                    </Tag>
                  )} */}
                </div>

                {/* {worker.skills && worker.skills.length > 0 && (
                  <div className={styles.workerSkills}>
                    <p className={styles.skillsTitle}>{t('skills')}:</p>
                    <div className={styles.skillsList}>
                      {worker.skills.map((skill, index) => (
                        <Tag key={index} color="blue" className={styles.skillTag}>
                          {skill}
                        </Tag>
                      ))}
                    </div>
                  </div>
                )} */}
              </div>

              <div className={styles.workerCardActions}>
                <Tooltip title={t('view')}>
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    className={styles.actionButton}
                    onClick={() => openDetail(worker.id)}
                  />
                </Tooltip>
                <Tooltip title={t('markRefused')}>
                  <Button
                    type="text"
                    icon={<CloseCircleOutlined />}
                    className={styles.actionButton}
                    onClick={() => confirmWorkerStatusAction(worker, 'refused')}
                  />
                </Tooltip>
                <Tooltip title={language === 'ar' ? 'إسكان' : 'Assign Housing'}>
                  <Button
                    type="text"
                    icon={<HomeOutlined />}
                    className={styles.actionButton}
                    onClick={() => {
                      setHousingModalWorkerId(String(worker.id));
                      housingForm.resetFields();
                      housingForm.setFieldsValue({ statusDate: dayjs() });
                    }}
                  />
                </Tooltip>
                <Tooltip title={t('edit')}>
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    className={styles.actionButton}
                    onClick={() => handleOpenModal(worker)}
                  />
                </Tooltip>
                <Tooltip title={t('printCV')}>
                  <Button
                    type="text"
                    icon={<FilePdfOutlined />}
                    className={styles.actionButton}
                    onClick={() => handlePrintCV(worker)}
                  />
                </Tooltip>
                <Tooltip title={t('medicalExamination')}>
                  <Button
                    type="text"
                    icon={<MedicineBoxOutlined />}
                    className={styles.actionButton}
                    loading={pendingMedicalCheckId === String(worker.id)}
                    onClick={() => handleOpenMedicalExam(worker.id)}
                  />
                </Tooltip>
                <Dropdown menu={getActionMenu(worker)} trigger={['click']}>
                  <Tooltip title={t('moreActions')}>
                    <Button type="text" icon={<MoreOutlined />} className={styles.actionButton} />
                  </Tooltip>
                </Dropdown>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalWorkers > PAGE_SIZE && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <Pagination
            current={pageNumber}
            pageSize={PAGE_SIZE}
            total={totalWorkers}
            onChange={(page) => setPageNumber(page)}
            showSizeChanger={false}
            showTotal={(total) => language === 'ar' ? `إجمالي ${total} عامل` : `Total ${total} workers`}
          />
        </div>
      )}

      {/* ── Assign to Housing Modal ──────────────────────────────────────── */}
      <Modal
        open={!!housingModalWorkerId}
        title={
          <Space>
            <HomeOutlined style={{ color: '#1677ff' }} />
            <span>{language === 'ar' ? 'إسكان العامل' : 'Assign Worker to Housing'}</span>
          </Space>
        }
        onCancel={() => { setHousingModalWorkerId(null); housingForm.resetFields(); }}
        confirmLoading={isAssigning}
        okText={language === 'ar' ? 'تسكين' : 'Assign'}
        cancelText={language === 'ar' ? 'إلغاء' : 'Cancel'}
        width={460}
        destroyOnHidden
        onOk={async () => {
          const vals = await housingForm.validateFields();
          await assignToHousing({
            workerId: housingModalWorkerId!,
            statusType: 8,
            housingId: vals.housingId,
            statusDate: (vals.statusDate as any)?.toISOString?.() ?? new Date().toISOString(),
            notes: vals.notes ?? null,
          });
          setHousingModalWorkerId(null);
          housingForm.resetFields();
        }}
      >
        <Form form={housingForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="housingId"
            label={language === 'ar' ? 'السكن' : 'Housing Unit'}
            rules={[{ required: true, message: language === 'ar' ? 'يجب اختيار السكن' : 'Please select a housing unit' }]}
          >
            <Select
              showSearch
              placeholder={language === 'ar' ? 'اختر السكن...' : 'Select housing unit...'}
              optionFilterProp="label"
              options={activeHousings.map((h) => ({
                value: h.id,
                label: `${h.name} (${language === 'ar' ? 'متاح' : 'available'}: ${h.availableSlots ?? '?'} / ${h.capacity})`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="statusDate"
            label={language === 'ar' ? 'تاريخ التسكين' : 'Housing Date'}
            rules={[{ required: true, message: language === 'ar' ? 'مطلوب' : 'Required' }]}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label={language === 'ar' ? 'ملاحظات' : 'Notes'}>
            <Input.TextArea rows={3} placeholder={language === 'ar' ? 'ملاحظات اختيارية...' : 'Optional notes...'} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Create/Edit Modal */}
      <Modal
        title={
          <Space>
            <UserOutlined />
            <span>{editingWorkerId !== null ? t('updateWorker') : t('createWorker')}</span>
          </Space>
        }
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        width={900}
        className={styles.modal}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} className={styles.modalForm}>
          <Divider titlePlacement="left">{t('personalDetails')}</Divider>

          {/* ── Image Upload ── */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            {workerImagePreview ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <Image
                  src={workerImagePreview}
                  alt="worker"
                  width={120}
                  height={120}
                  style={{ borderRadius: '50%', objectFit: 'cover', border: '3px solid #003366' }}
                  preview={{ mask: <EyeOutlined /> }}
                />
              </div>
            ) : (
              <Avatar
                size={120}
                icon={<UserOutlined />}
                style={{ backgroundColor: '#003366', marginBottom: 8 }}
              />
            )}
            <div style={{ marginTop: 12 }}>
              <Upload
                accept="image/jpeg,image/png,image/webp,image/gif"
                showUploadList={false}
                beforeUpload={(file) => {
                  const isImage = file.type.startsWith('image/');
                  if (!isImage) {
                    message.error(
                      language === 'ar'
                        ? 'الرجاء اختيار صورة صالحة'
                        : 'Please select a valid image file'
                    );
                    return false;
                  }
                  const isLt5M = file.size / 1024 / 1024 < 5;
                  if (!isLt5M) {
                    message.error(
                      language === 'ar'
                        ? 'يجب أن يكون حجم الصورة أقل من 5 ميجابايت'
                        : 'Image must be less than 5 MB'
                    );
                    return false;
                  }
                  setWorkerImageFile(file);
                  setWorkerImagePreview(URL.createObjectURL(file));
                  return false; // Prevent auto-upload
                }}
              >
                <Button icon={<UploadOutlined />} size="small">
                  {language === 'ar' ? 'رفع صورة العامل' : t('uploadImage')}
                </Button>
              </Upload>
              {workerImagePreview && (
                <Button
                  type="link"
                  danger
                  size="small"
                  style={{ marginTop: 4, display: 'block', margin: '4px auto 0' }}
                  onClick={() => {
                    setWorkerImageFile(null);
                    setWorkerImagePreview(null);
                  }}
                >
                  {language === 'ar' ? 'إزالة الصورة' : 'Remove image'}
                </Button>
              )}
            </div>
          </div>

          {/* ── Video Upload ── */}
          <div style={{ marginBottom: 24, padding: '12px 16px', background: '#f8faff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontWeight: 600, color: '#003366', fontSize: 13 }}>
                <VideoCameraOutlined style={{ marginInlineEnd: 6 }} />
                {language === 'ar' ? t('uploadVideo') : t('uploadVideo')}
              </span>
              <Upload
                accept="video/mp4,video/webm,video/ogg,video/quicktime,video/avi"
                showUploadList={false}
                maxCount={1}
                beforeUpload={(file) => {
                  const isVideo = file.type.startsWith('video/');
                  if (!isVideo) {
                    message.error(language === 'ar' ? 'الرجاء اختيار ملف فيديو صالح' : 'Please select a valid video file');
                    return false;
                  }
                  if (file.size / 1024 / 1024 > 200) {
                    message.error(language === 'ar' ? 'يجب أن يكون حجم الفيديو أقل من 200 ميجابايت' : 'Video must be less than 200 MB');
                    return false;
                  }
                  setWorkerVideoFile(file);
                  setWorkerVideoUrl(URL.createObjectURL(file));
                  return false;
                }}
              >
                <Button icon={<UploadOutlined />} size="small">
                  {language === 'ar' ? 'رفع فيديو' : 'Upload Video'}
                </Button>
              </Upload>
            </div>
            {workerVideoUrl ? (
              <div>
                <video
                  src={workerVideoUrl}
                  controls
                  style={{ width: '100%', maxHeight: 200, borderRadius: 6, border: '1px solid #e2e8f0', background: '#000' }}
                />
                <Button
                  type="link"
                  danger
                  size="small"
                  style={{ marginTop: 4 }}
                  onClick={() => { setWorkerVideoFile(null); setWorkerVideoUrl(null); }}
                >
                  {language === 'ar' ? t('removeVideo') : t('removeVideo')}
                </Button>
              </div>
            ) : (
              <p style={{ color: '#9ca3af', fontSize: 12, margin: 0 }}>
                {language === 'ar' ? t('noVideo') : t('noVideo')}
              </p>
            )}
          </div>

          {/* ── Additional Attachments (images + PDFs) ── */}
          <div style={{ marginBottom: 24, padding: '12px 16px', background: '#f8faff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontWeight: 600, color: '#003366', fontSize: 13 }}>
                {language === 'ar' ? 'صور ووثائق إضافية' : 'Additional Documents / Images'}
              </span>
              <Upload
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                showUploadList={false}
                multiple
                beforeUpload={(file) => {
                  const allowed = file.type.startsWith('image/') || file.type === 'application/pdf';
                  if (!allowed) {
                    message.error(language === 'ar' ? 'الرجاء اختيار صورة أو ملف PDF' : 'Please select an image or PDF file');
                    return false;
                  }
                  if (file.size / 1024 / 1024 > 10) {
                    message.error(language === 'ar' ? 'يجب أن يكون حجم الملف أقل من 10 ميجابايت' : 'File must be less than 10 MB');
                    return false;
                  }
                  setWorkerExtraImages((prev) => [
                    ...prev,
                    { url: URL.createObjectURL(file), file },
                  ]);
                  return false;
                }}
              >
                <Button icon={<UploadOutlined />} size="small">
                  {language === 'ar' ? 'إضافة ملف' : 'Add File'}
                </Button>
              </Upload>
            </div>
            {workerExtraImages.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: 12, margin: 0 }}>
                {language === 'ar' ? 'لا توجد وثائق مرفقة' : 'No documents attached'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <Image.PreviewGroup>
                  {workerExtraImages.map((attachment, idx) => {
                    const isPdf =
                      attachment.file?.type === 'application/pdf' ||
                      attachment.url.toLowerCase().includes('.pdf');
                    return (
                      <div key={idx} style={{ position: 'relative', display: 'inline-block' }}>
                        {isPdf ? (
                          <div
                            style={{
                              width: 72, height: 72, borderRadius: 6, border: '1px solid #e2e8f0',
                              background: '#fff0f0', display: 'flex', flexDirection: 'column',
                              alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            }}
                            onClick={() => window.open(attachment.url, '_blank')}
                          >
                            <FilePdfOutlined style={{ fontSize: 28, color: '#e53e3e' }} />
                            <span style={{ fontSize: 10, color: '#718096', marginTop: 4 }}>PDF</span>
                          </div>
                        ) : (
                          <Image
                            src={attachment.url}
                            alt={language === 'ar' ? 'مرفق العامل' : 'Worker attachment'}
                            width={72}
                            height={72}
                            style={{ objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8f0' }}
                            preview={{ mask: <EyeOutlined style={{ fontSize: 12 }} /> }}
                          />
                        )}
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<CloseCircleOutlined />}
                          style={{ position: 'absolute', top: -6, right: -6, padding: 0, minWidth: 20, height: 20, fontSize: 14 }}
                          onClick={() => setWorkerExtraImages((prev) => prev.filter((_, i) => i !== idx))}
                        />
                      </div>
                    );
                  })}
                </Image.PreviewGroup>
              </div>
            )}
          </div>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label={t('fullNameAr')} name="fullNameAr" rules={[{ required: true }]}>
                <Input size="large" placeholder={t('fullNameAr')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label={t('fullNameEn')} name="fullNameEn">
                <Input size="large" placeholder={t('fullNameEn')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label={t('referenceNo')} name="referenceNo">
                <Input size="large" placeholder={t('referenceNo')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label={t('gender')} name="gender" rules={[{ required: true }]}>
                <Select
                  size="large"
                  placeholder={t('gender')}
                  options={toSelectOptions([...GENDER], language)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label={t('birthDate')} name="birthDate">
                <DatePicker size="large" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label={t('age')} name="age">
                <InputNumber size="large" style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label={t('maritalStatus')} name="maritalStatus">
                <Select
                  size="large"
                  placeholder={t('maritalStatus')}
                  options={toSelectOptions([...MARITAL_STATUS], language)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label={t('childrenCount')} name="childrenCount">
                <InputNumber size="large" style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label={t('religion')} name="religion">
                <Select
                  size="large"
                  placeholder={t('religion')}
                  options={toSelectOptions([...RELIGION], language).filter((o) => o.value !== 0)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label={t('nationality')} name="nationalityId">
                <Select
                  size="large"
                  placeholder={t('nationality')}
                  showSearch
                  optionFilterProp="label"
                  options={nationalities.map((n) => ({
                    value: n.id,
                    label:
                      language === 'ar'
                        ? n.nationalityNameAr || n.nationalityNameEn || ''
                        : n.nationalityNameEn || n.nationalityNameAr || '',
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label={t('nationalId')} name="nationalId">
                <Input size="large" placeholder={t('nationalId')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label={t('weight')} name="weight">
                <InputNumber size="large" style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label={t('height')} name="height">
                <InputNumber size="large" style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label={t('educationLevelAr')} name="educationLevelAr">
                <Input size="large" placeholder={t('educationLevelAr')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label={t('educationLevelEn')} name="educationLevelEn">
                <Input size="large" placeholder={t('educationLevelEn')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label={t('experience')} name="hasExperience" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Divider titlePlacement="left">{t('passportDetails')}</Divider>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label={t('passportNo')} name="passportNo" rules={[{ required: true }]}>
                <Input size="large" placeholder={t('passportNo')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label={t('passportIssueDate')} name="passportIssueDate">
                <DatePicker size="large" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label={t('passportExpiryDate')} name="passportExpiryDate">
                <DatePicker size="large" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t('passportIssuePlaceAr')} name="passportIssuePlaceAr">
                <Input size="large" placeholder={t('passportIssuePlaceAr')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t('passportIssuePlaceEn')} name="passportIssuePlaceEn">
                <Input size="large" placeholder={t('passportIssuePlaceEn')} />
              </Form.Item>
            </Col>
          </Row>

          <Divider titlePlacement="left">{t('workDetails')}</Divider>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label={t('jobname')} name="jobId">
                <Select
                  size="large"
                  placeholder={t('jobname')}
                  showSearch
                  optionFilterProp="label"
                  options={availableJobs.map((job) => ({
                    value: job.value,
                    label: job.label,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label={t('basicSalary')} name="basicSalary">
                <InputNumber size="large" style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label={t('workerType')} name="workerType">
                <Select
                  size="large"
                  placeholder={t('workerType')}
                  options={toSelectOptions([...WORKER_CONTRACT_TYPE], language)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label={t('agent')} name="agentId">
                <Select
                  size="large"
                  placeholder={t('agent')}
                  showSearch
                  optionFilterProp="label"
                  style={{ width: '100%' }}
                  options={availableAgents.map((a) => ({ value: a.value, label: a.label }))}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label={t('boxNumber')} name="boxNumber">
                <Input size="large" placeholder={t('boxNumber')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label={t('borderNumber')} name="borderNumber">
                <Input size="large" placeholder={t('borderNumber')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label={t('workerStatus')} name="workerStatus">
                <Select
                  size="large"
                  placeholder={t('workerStatus')}
                  options={toSelectOptions([...WORKER_SATUS], language)}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider titlePlacement="left">{t('contactDetails')}</Divider>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label={t('mobile')} name="mobile">
                <Input size="large" placeholder={t('mobile')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t('phone')} name="phone">
                <Input size="large" placeholder={t('phone')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t('addressAr')} name="addressAr">
                <Input size="large" placeholder={t('addressAr')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t('addressEn')} name="addressEn">
                <Input size="large" placeholder={t('addressEn')} />
              </Form.Item>
            </Col>
          </Row>

          <div className={styles.modalActions}>
            <Button className={styles.cancelButton} onClick={handleCloseModal}>
              {t('cancel')}
            </Button>
            <Button
              type="primary"
              className={styles.submitButton}
              htmlType="submit"
              loading={isCreating || isUpdating}
              icon={editingWorkerId !== null ? <EditOutlined /> : <PlusOutlined />}
            >
              {editingWorkerId !== null ? t('updateWorker') : t('createWorker')}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Medical Examination Modal */}
      <Modal
        title={
          <Space>
            <MedicineBoxOutlined />
            <span>
              {medicalExamViewOnly
                ? t('viewExamRecord')
                : medicalExamId !== null
                  ? t('editExamRecord')
                  : t('createMedicalExam')}
            </span>
          </Space>
        }
        open={medicalExamWorkerId !== null}
        onCancel={() => {
          setMedicalExamWorkerId(null);
          setMedicalExamId(null);
          setMedicalExamViewOnly(false);
          setCheckedMedicalExam(null);
          medicalExamForm.resetFields();
        }}
        footer={null}
        width={600}
        className={styles.modal}
      >
        {/* ── View-only mode: show existing record as read-only Descriptions ── */}
        {medicalExamViewOnly && medicalExamId !== null ? (
          (() => {
            const exam = checkedMedicalExam;
            return (
              <div>
                <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
                  <Descriptions.Item label={t('examDate')}>
                    {exam?.examDate ? dayjs(exam.examDate).format('YYYY-MM-DD') : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('medicalStatus')}>
                    {exam
                      ? getEnumLabel(MEDICAL_STATUS, exam.medicalStatus, language)
                      : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('notes')}>
                    {exam?.notes || '-'}
                  </Descriptions.Item>
                </Descriptions>
                <div className={styles.modalActions}>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    loading={isDeletingMedicalExam}
                    onClick={handleMedicalExamDelete}
                  >
                    {t('delete')}
                  </Button>
                  <Button
                    onClick={() => {
                      setMedicalExamWorkerId(null);
                      setMedicalExamId(null);
                      setMedicalExamViewOnly(false);
                      setCheckedMedicalExam(null);
                      medicalExamForm.resetFields();
                    }}
                  >
                    {t('cancel')}
                  </Button>
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => setMedicalExamViewOnly(false)}
                  >
                    {t('edit')}
                  </Button>
                </div>
              </div>
            );
          })()
        ) : (
          /* ── Edit / Create mode ── */
          <Form
            form={medicalExamForm}
            layout="vertical"
            onFinish={handleMedicalExamSubmit}
            className={styles.modalForm}
          >
            <Form.Item
              label={t('examDate')}
              name="examDate"
              rules={[{ required: true, message: 'Please select examination date' }]}
            >
              <DatePicker size="large" style={{ width: '100%' }} showTime={false} />
            </Form.Item>

            <Form.Item
              label={t('medicalStatus')}
              name="medicalStatus"
              rules={[{ required: true, message: 'Please select medical status' }]}
            >
              <Select size="large" placeholder={t('medicalStatus')}>
                {toSelectOptions([...MEDICAL_STATUS], language).map((o) => (
                  <Select.Option key={o.value} value={o.value}>
                    {o.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label={t('notes')} name="notes">
              <Input.TextArea rows={4} placeholder={t('notes')} />
            </Form.Item>

            <div className={styles.modalActions}>
              {medicalExamId !== null && (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  loading={isDeletingMedicalExam}
                  onClick={handleMedicalExamDelete}
                >
                  {t('delete')}
                </Button>
              )}
              <Button
                onClick={() => {
                  if (medicalExamId !== null) {
                    // Go back to view mode instead of closing
                    setMedicalExamViewOnly(true);
                  } else {
                    setMedicalExamWorkerId(null);
                    setMedicalExamId(null);
                    setMedicalExamViewOnly(false);
                    setCheckedMedicalExam(null);
                    medicalExamForm.resetFields();
                  }
                }}
              >
                {t('cancel')}
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isCreatingMedicalExam || isUpdatingMedicalExam}
                icon={<MedicineBoxOutlined />}
              >
                {t('save')}
              </Button>
            </div>
          </Form>
        )}
      </Modal>

      {/* Document / Passport Viewer Modal */}
      <Modal
        title={
          <Space>
            <FileImageOutlined />
            <span>{t('viewDocument')}</span>
          </Space>
        }
        open={docViewerWorkerId !== null}
        onCancel={() => setDocViewerWorkerId(null)}
        footer={
          <Button type="primary" onClick={() => setDocViewerWorkerId(null)}>
            {t('close')}
          </Button>
        }
        width={600}
        centered
      >
        {(() => {
          const docWorker = workers.find((w) => String(w.id) === String(docViewerWorkerId));
          if (!docWorker) return null;
          const allDocs = [
            ...(docWorker.uploadImage ? [docWorker.uploadImage] : []),
            ...(docWorker.attachments ?? []),
          ];
          return allDocs.length > 0 ? (
            <div>
              <p style={{ color: '#64748b', fontSize: 12, marginBottom: 12 }}>
                {docWorker.fullNameEn || docWorker.fullNameAr} — {allDocs.length} {language === 'ar' ? 'صورة / وثيقة' : allDocs.length === 1 ? 'document' : 'documents'}
              </p>
              <Image.PreviewGroup>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {allDocs.map((src, idx) => {
                    const isPdf = src.startsWith('data:application/pdf') || src.endsWith('.pdf');
                    return isPdf ? (
                      <div
                        key={idx}
                        style={{
                          width: 150, height: 150, borderRadius: 8, border: '1px solid #e2e8f0',
                          background: '#fff0f0', display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        }}
                        onClick={() => window.open(src, '_blank')}
                      >
                        <FilePdfOutlined style={{ fontSize: 40, color: '#e53e3e' }} />
                        <span style={{ fontSize: 12, color: '#718096', marginTop: 8 }}>PDF</span>
                      </div>
                    ) : (
                      <Image
                        key={idx}
                        src={src}
                        alt={`${t('documents')} ${idx + 1}`}
                        width={150}
                        height={150}
                        style={{ objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }}
                        preview={{ mask: <EyeOutlined /> }}
                      />
                    );
                  })}
                </div>
              </Image.PreviewGroup>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
              <FileImageOutlined style={{ fontSize: 48, marginBottom: 12 }} />
              <p>{t('noDocument')}</p>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
