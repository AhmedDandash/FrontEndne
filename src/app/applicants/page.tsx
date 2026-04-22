'use client';

import { useState, useMemo, useEffect } from 'react';
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
  PrinterOutlined,
  UploadOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  DownOutlined,
  StopOutlined,
  ManOutlined,
  WomanOutlined,
  MedicineBoxOutlined,
  CloseCircleOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import {
  useWorkers,
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
} from '@/hooks/api/useWorkers';
import { useAgents } from '@/hooks/api/useAgents';
import { useJobs } from '@/hooks/api/useJobs';
import { useNationalities } from '@/hooks/api/useNationalities';
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
    workerReport: 'Worker Report',
    trialReport: 'Trial Report',
    allData: 'All Data',
    searchPlaceholder: 'Search workers...',
    filters: 'Search Filters',
    search: 'Search',
    clearFilters: 'Clear',
    totalWorkers: 'Total Workers',
    maleWorkers: 'Male Workers',
    femaleWorkers: 'Female Workers',
    experiencedWorkers: 'Experienced',
    // Tabs
    tabAll: 'All',
    tabTrial: 'Trial Workers',
    tabAvailable: 'Available',
    tabUnderProcedure: 'Under Procedure',
    tabBackOut: 'Back Out',
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
    vip: 'VIP',
    vipOnly: 'VIP Only',
    notVip: 'Not VIP',
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
  },
  ar: {
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
    maleWorkers: 'عمال ذكور',
    femaleWorkers: 'عمال إناث',
    experiencedWorkers: 'ذوو خبرة',
    // Tabs
    tabAll: 'الكل',
    tabTrial: 'عمالة في التجربة',
    tabAvailable: 'عمالة للاختيار',
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
    vip: 'VIP',
    vipOnly: 'VIP فقط',
    notVip: 'ليس VIP',
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
  },
};

export default function WorkersPage() {
  const language = useAuthStore((state) => state.language);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingWorkerId, setEditingWorkerId] = useState<number | null>(null);
  const [viewingWorkerId, setViewingWorkerId] = useState<number | null>(null);
  const [medicalExamWorkerId, setMedicalExamWorkerId] = useState<number | string | null>(null);
  const [medicalExamId, setMedicalExamId] = useState<number | string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState<{
    search?: string;
    gender?: string;
    nationality?: string;
    religion?: string;
    job?: string;
    agent?: string;
    hasExperience?: boolean;
    status?: string;
    workerType?: string;
    vip?: string;
    deletionStatus?: string;
  }>({});
  const [form] = Form.useForm();
  const [medicalExamForm] = Form.useForm();
  /** Base64 string of the worker's uploaded image */
  const [workerImageBase64, setWorkerImageBase64] = useState<string | null>(null);
  /** Preview URL for the image (same as base64, used for display) */
  const [workerImagePreview, setWorkerImagePreview] = useState<string | null>(null);

  const t = (key: keyof typeof translations.en) => {
    const lang = translations[language];
    return lang[key] || key;
  };

  const { data: workers = [], isLoading } = useWorkers();
  const { data: jobs = [] } = useJobs();
  const { data: agents = [] } = useAgents();
  const { data: nationalities = [] } = useNationalities();
  const { data: medicalExaminations = [] } = useMedicalExaminations();

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

  // Fetch editing worker details when opening edit modal
  const { data: editingWorker } = useWorker(editingWorkerId ? String(editingWorkerId) : undefined);

  // Fetch single worker details when viewing
  const { data: viewingWorker, isLoading: isViewingLoading } = useWorker(
    viewingWorkerId ? String(viewingWorkerId) : undefined
  );

  // Tab items matching the legacy HTML
  const tabs = [
    { key: 0, label: t('tabAll'), icon: <FileTextOutlined /> },
    { key: 1, label: t('tabTrial'), icon: <ClockCircleOutlined /> },
    { key: 2, label: t('tabAvailable'), icon: <CheckCircleOutlined /> },
    { key: 3, label: t('tabUnderProcedure'), icon: <FileTextOutlined /> },
    { key: 4, label: t('tabBackOut'), icon: <ExclamationCircleOutlined /> },
    { key: 5, label: t('tabInsideKingdom'), icon: <EnvironmentOutlined /> },
    { key: 6, label: t('tabDeported'), icon: <StopOutlined /> },
  ];

  // Filter workers
  const filteredWorkers = useMemo(() => {
    return workers.filter((worker) => {
      const searchLower = filters.search?.toLowerCase() || '';
      const matchesSearch =
        !searchLower ||
        worker.fullNameAr?.toLowerCase().includes(searchLower) ||
        worker.fullNameEn?.toLowerCase().includes(searchLower) ||
        worker.passportNo?.toLowerCase().includes(searchLower) ||
        worker.referenceNo?.toLowerCase().includes(searchLower);

      const matchesGender = !filters.gender || worker.gender === Number(filters.gender);
      const matchesNationality =
        !filters.nationality || worker.nationalityId === filters.nationality;
      const matchesReligion = !filters.religion || worker.religion === Number(filters.religion);
      const matchesJob = !filters.job || String(worker.jobId) === String(filters.job);
      const matchesAgent = !filters.agent || String(worker.agentId) === String(filters.agent);
      const matchesExperience =
        filters.hasExperience === undefined || worker.hasExperience === filters.hasExperience;
      const matchesStatus = !filters.status || worker.workerStatus === Number(filters.status);

      // Tab-based workerSatus filtering: 0=All, 1=Trial, 2=Available, 3=Under Procedure, 4=Back Out, 5=Inside Kingdom, 6=Deported
      const matchesTab = activeTab === 0 || worker.workerStatus === activeTab;

      return (
        matchesSearch &&
        matchesGender &&
        matchesNationality &&
        matchesReligion &&
        matchesJob &&
        matchesAgent &&
        matchesExperience &&
        matchesStatus &&
        matchesTab
      );
    });
  }, [workers, filters, activeTab]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: filteredWorkers.length,
      male: filteredWorkers.filter((w) => w.gender === GENDER[0].value).length,
      female: filteredWorkers.filter((w) => w.gender === GENDER[1].value).length,
      experienced: filteredWorkers.filter((w) => w.hasExperience).length,
    };
  }, [filteredWorkers]);

  // Print menu items from HTML
  const printMenu: MenuProps = {
    items: [
      { key: 'worker-report', label: t('workerReport'), icon: <FileTextOutlined /> },
      { key: 'trial-report', label: t('trialReport'), icon: <FileTextOutlined /> },
      { key: 'all-data', label: t('allData'), icon: <FileExcelOutlined /> },
    ],
    onClick: ({ key }) => {
      console.log('Print:', key);
    },
  };

  // Modal handlers
  const handleOpenModal = (worker?: Worker) => {
    if (worker?.id) {
      setEditingWorkerId(Number(worker.id));
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
    setWorkerImageBase64(null);
    setWorkerImagePreview(null);
  };

  // Populate form when editing worker details are loaded
  useEffect(() => {
    if (editingWorker) {
      // Pre-load existing image for editing
      if (editingWorker.uploadImage) {
        setWorkerImageBase64(editingWorker.uploadImage);
        setWorkerImagePreview(editingWorker.uploadImage);
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
      uploadImage: workerImageBase64 || undefined,
    };

    if (editingWorkerId !== null) {
      updateWorker({ id: editingWorkerId, data: workerData });
    } else {
      createWorker(workerData);
    }
    handleCloseModal();
  };

  const handleMedicalExamSubmit = async (values: any) => {
    if (medicalExamWorkerId === null) return;

    const payload = {
      workerId: String(medicalExamWorkerId),
      examDate: values.examDate?.toISOString() ?? null,
      medicalStatus: Number(values.medicalStatus),
      notes: values.notes || '',
    };

    const onSuccess = () => {
      medicalExamForm.resetFields();
      setMedicalExamWorkerId(null);
      setMedicalExamId(null);
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
          },
        });
      },
    });
  };

  const handleDelete = (id: number | string) => {
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
      case 'finalExit':
        updateWorker({ id: worker.id, data: { workerStatus: 7 } });
        break;
      case 'returnWork':
        updateWorker({ id: worker.id, data: { workerStatus: 8 } });
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
      1: { color: 'processing', icon: <ClockCircleOutlined />, label: t('tabTrial') },
      2: { color: 'success', icon: <CheckCircleOutlined />, label: t('tabAvailable') },
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
  const getMaritalLabel = (m?: number | null) => getEnumLabel(MARITAL_STATUS, m, language);

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
            key: 'finalExit',
            label: t('statusActionFinalExit'),
            icon: <StopOutlined />,
            onClick: () => confirmWorkerStatusAction(worker, 'finalExit'),
          },
          {
            key: 'returnWork',
            label: t('statusActionReturnWork'),
            icon: <CheckCircleOutlined />,
            onClick: () => confirmWorkerStatusAction(worker, 'returnWork'),
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
            <Dropdown menu={printMenu}>
              <Button className={styles.headerBtn} icon={<FileExcelOutlined />}>
                {t('print')} <DownOutlined />
              </Button>
            </Dropdown>
            <Button
              className={styles.headerBtn}
              icon={<PrinterOutlined />}
              onClick={() => console.log('Print salary')}
            >
              {t('printSalary')}
            </Button>
            <Button
              className={styles.headerBtn}
              icon={<UploadOutlined />}
              onClick={() => console.log('Add from file')}
            >
              {t('addFromFile')}
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
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} className={styles.statsRow}>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <div className={styles.statContent}>
              <div
                className={styles.statIcon}
                style={{ background: 'linear-gradient(135deg, #003366 0%, #00478c 100%)' }}
              >
                <TeamOutlined style={{ color: '#ffffff', fontSize: 24 }} />
              </div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>{t('totalWorkers')}</p>
                <p className={styles.statValue}>{stats.total}</p>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <div className={styles.statContent}>
              <div
                className={styles.statIcon}
                style={{ background: 'linear-gradient(135deg, #00aa64 0%, #00c478 100%)' }}
              >
                <UserOutlined style={{ color: '#ffffff', fontSize: 24 }} />
              </div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>{t('maleWorkers')}</p>
                <p className={styles.statValue}>{stats.male}</p>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <div className={styles.statContent}>
              <div
                className={styles.statIcon}
                style={{ background: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)' }}
              >
                <UserOutlined style={{ color: '#ffffff', fontSize: 24 }} />
              </div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>{t('femaleWorkers')}</p>
                <p className={styles.statValue}>{stats.female}</p>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <div className={styles.statContent}>
              <div
                className={styles.statIcon}
                style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' }}
              >
                <TrophyOutlined style={{ color: '#ffffff', fontSize: 24 }} />
              </div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>{t('experiencedWorkers')}</p>
                <p className={styles.statValue}>{stats.experienced}</p>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Search and Filters */}
      <Card className={styles.filterCard}>
        <div className={styles.filterHeader}>
          <Space wrap>
            <Input
              size="large"
              placeholder={t('searchPlaceholder')}
              prefix={<SearchOutlined />}
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              style={{ width: 300 }}
              allowClear
            />
            <Button
              icon={<FilterOutlined />}
              onClick={() => setShowFilters(!showFilters)}
              type={showFilters ? 'primary' : 'default'}
              size="large"
            >
              {t('filters')}
            </Button>
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
                <label className={styles.filterLabel}>{t('religion')}</label>
                <Select
                  size="large"
                  placeholder={t('religion')}
                  value={filters.religion}
                  onChange={(value) => setFilters({ ...filters, religion: value })}
                  style={{ width: '100%' }}
                  allowClear
                  options={toSelectOptions([...RELIGION], language)
                    .filter((o) => o.value !== 0)
                    .map((o) => ({ value: String(o.value), label: o.label }))}
                />
              </Col>

              <Col xs={24} md={6}>
                <label className={styles.filterLabel}>{t('experience')}</label>
                <Select
                  size="large"
                  placeholder={t('experience')}
                  value={
                    filters.hasExperience === undefined
                      ? undefined
                      : filters.hasExperience
                        ? 'yes'
                        : 'no'
                  }
                  onChange={(value) =>
                    setFilters({
                      ...filters,
                      hasExperience: value === 'yes' ? true : value === 'no' ? false : undefined,
                    })
                  }
                  style={{ width: '100%' }}
                  allowClear
                >
                  <Select.Option value="yes">{t('hasExperience')}</Select.Option>
                  <Select.Option value="no">{t('noExperience')}</Select.Option>
                </Select>
              </Col>

              <Col xs={24} md={6}>
                <label className={styles.filterLabel}>{t('vip')}</label>
                <Select
                  size="large"
                  placeholder={t('vip')}
                  value={filters.vip}
                  onChange={(value) => setFilters({ ...filters, vip: value })}
                  style={{ width: '100%' }}
                  allowClear
                >
                  <Select.Option value="1">{t('vipOnly')}</Select.Option>
                  <Select.Option value="2">{t('notVip')}</Select.Option>
                </Select>
              </Col>
            </Row>
            <div className={styles.filterActions}>
              <Button icon={<ClearOutlined />} onClick={handleClearFilters}>
                {t('clearFilters')}
              </Button>
              <Button type="primary" icon={<SearchOutlined />} style={{ background: '#003366' }}>
                {t('search')}
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
            {filters.hasExperience !== undefined && (
              <Tag closable onClose={() => setFilters({ ...filters, hasExperience: undefined })}>
                {filters.hasExperience ? t('hasExperience') : t('noExperience')}
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
                      src={worker.uploadImage}
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

                <h3 className={styles.workerName}>
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
                    <span className={styles.detailLabel}>{t('maritalStatus')}:</span>
                    <span className={styles.detailValue}>
                      {getMaritalLabel(worker.maritalStatus)}
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
                    onClick={() => setViewingWorkerId(Number(worker.id))}
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
                <Tooltip title={t('medicalExamination')}>
                  <Button
                    type="text"
                    icon={<MedicineBoxOutlined />}
                    className={styles.actionButton}
                    onClick={() => {
                      const existingExam = medicalExaminations.find(
                        (e) => String(e.workerId) === String(worker.id)
                      );
                      setMedicalExamWorkerId(worker.id);
                      if (existingExam) {
                        setMedicalExamId(existingExam.id);
                        medicalExamForm.setFieldsValue({
                          examDate: existingExam.examDate ? dayjs(existingExam.examDate) : undefined,
                          medicalStatus: existingExam.medicalStatus,
                          notes: existingExam.notes,
                        });
                      } else {
                        setMedicalExamId(null);
                        medicalExamForm.resetFields();
                      }
                    }}
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

      {/* View Worker Details Modal */}
      <Modal
        title={
          <Space>
            <EyeOutlined />
            <span>{t('viewWorker')}</span>
          </Space>
        }
        open={!!viewingWorkerId}
        onCancel={() => setViewingWorkerId(null)}
        footer={
          <Button
            type="primary"
            onClick={() => setViewingWorkerId(null)}
            style={{ background: '#003366' }}
          >
            {t('close')}
          </Button>
        }
        width={900}
        className={styles.modal}
      >
        {(isViewingLoading || viewingWorker) && (
          <div>
            {/* Worker Image */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              {viewingWorker?.uploadImage ? (
                <Image
                  src={viewingWorker?.uploadImage}
                  alt={viewingWorker?.fullNameAr || 'Worker'}
                  width={150}
                  height={150}
                  style={{ borderRadius: '50%', objectFit: 'cover', border: '4px solid #003366' }}
                  preview={{ mask: <EyeOutlined style={{ fontSize: 20 }} /> }}
                />
              ) : (
                <Avatar
                  size={150}
                  icon={<UserOutlined />}
                  style={{
                    backgroundColor:
                      viewingWorker?.gender === GENDER[1].value ? '#f472b6' : '#003366',
                  }}
                />
              )}
              <h2 style={{ margin: '12px 0 4px', color: '#003366' }}>
                {language === 'ar'
                  ? viewingWorker?.fullNameAr
                  : viewingWorker?.fullNameEn || viewingWorker?.fullNameAr}
              </h2>
              <p style={{ color: '#6b7280', margin: 0 }}>
                {language === 'ar' ? viewingWorker?.fullNameEn : viewingWorker?.fullNameAr}
              </p>
              <div style={{ marginTop: 8 }}>{getStatusTag(viewingWorker?.workerStatus)}</div>
            </div>

            <Divider />

            {/* Personal Details */}
            <Descriptions
              title={t('personalDetails')}
              bordered
              column={{ xs: 1, sm: 2 }}
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label={t('referenceNo')}>
                {viewingWorker?.referenceNo || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('gender')}>
                {getGenderLabel(viewingWorker?.gender)}
              </Descriptions.Item>
              <Descriptions.Item label={t('age')}>
                {viewingWorker?.age ? `${viewingWorker.age} ${t('years')}` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('birthDate')}>
                {viewingWorker?.birthDate
                  ? dayjs(viewingWorker.birthDate).format('YYYY-MM-DD')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('maritalStatus')}>
                {getMaritalLabel(viewingWorker?.maritalStatus)}
              </Descriptions.Item>
              <Descriptions.Item label={t('childrenCount')}>
                {viewingWorker?.childrenCount ?? '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('religion')}>
                {viewingWorker?.religion
                  ? getEnumLabel(RELIGION, viewingWorker.religion, language)
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('nationality')}>
                {viewingWorker?.nationalityName ||
                  (viewingWorker?.nationalityId
                    ? (nationalities.find((n) => n.id === viewingWorker.nationalityId)?.[
                        language === 'ar' ? 'nationalityNameAr' : 'nationalityNameEn'
                      ] ?? '-')
                    : '-')}
              </Descriptions.Item>
              <Descriptions.Item label={t('nationalId')}>
                {viewingWorker?.nationalId || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('educationLevelAr')}>
                {viewingWorker?.educationLevelAr || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('educationLevelEn')}>
                {viewingWorker?.educationLevelEn || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('weight')}>
                {viewingWorker?.weight || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('height')}>
                {viewingWorker?.height || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('experience')}>
                {viewingWorker?.hasExperience ? t('hasExperience') : t('noExperience')}
              </Descriptions.Item>
            </Descriptions>

            {/* Passport Details */}
            <Descriptions
              title={t('passportDetails')}
              bordered
              column={{ xs: 1, sm: 2 }}
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label={t('passportNo')}>
                {viewingWorker?.passportNo || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('passportIssueDate')}>
                {viewingWorker?.passportIssueDate
                  ? dayjs(viewingWorker.passportIssueDate).format('YYYY-MM-DD')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('passportExpiryDate')}>
                {viewingWorker?.passportExpiryDate
                  ? dayjs(viewingWorker.passportExpiryDate).format('YYYY-MM-DD')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('passportIssuePlaceAr')}>
                {viewingWorker?.passportIssuePlaceAr || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('passportIssuePlaceEn')}>
                {viewingWorker?.passportIssuePlaceEn || '-'}
              </Descriptions.Item>
            </Descriptions>

            {/* Work Details */}
            <Descriptions
              title={t('workDetails')}
              bordered
              column={{ xs: 1, sm: 2 }}
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label={t('jobname')}>
                {viewingWorker?.jobName || viewingWorker?.jobname || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('basicSalary')}>
                {viewingWorker?.basicSalary || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('agentName')}>
                {viewingWorker?.agentName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('createdBy')}>
                {viewingWorker?.userName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('workerType')}>
                {viewingWorker?.workerType
                  ? getEnumLabel(WORKER_CONTRACT_TYPE, viewingWorker.workerType, language)
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('boxNumber')}>
                {viewingWorker?.boxNumber || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('borderNumber')}>
                {viewingWorker?.borderNumber || '-'}
              </Descriptions.Item>
            </Descriptions>

            {/* Contact Details */}
            <Descriptions
              title={t('contactDetails')}
              bordered
              column={{ xs: 1, sm: 2 }}
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label={t('mobile')}>
                {viewingWorker?.mobile || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('phone')}>
                {viewingWorker?.phone || '-'}
              </Descriptions.Item>
            </Descriptions>

            {/* Address Details */}
            <Descriptions
              title={t('addressDetails')}
              bordered
              column={{ xs: 1, sm: 2 }}
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label={t('addressAr')}>
                {viewingWorker?.addressAr || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('addressEn')}>
                {viewingWorker?.addressEn || '-'}
              </Descriptions.Item>
            </Descriptions>

            {/* Skills */}
            {viewingWorker?.skills && (
              <div style={{ marginTop: 16 }}>
                <h4 style={{ color: '#003366', marginBottom: 8 }}>{t('skills')}</h4>
                <Space wrap>
                  {String(viewingWorker.skills)
                    .split(',')
                    .filter(Boolean)
                    .map((skill, i) => (
                      <Tag key={i} color="blue">
                        {skill.trim()}
                      </Tag>
                    ))}
                </Space>
              </div>
            )}
          </div>
        )}
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
                  // Convert to Base64 and store
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const base64 = e.target?.result as string;
                    setWorkerImageBase64(base64);
                    setWorkerImagePreview(base64);
                  };
                  reader.readAsDataURL(file);
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
                    setWorkerImageBase64(null);
                    setWorkerImagePreview(null);
                  }}
                >
                  {language === 'ar' ? 'إزالة الصورة' : 'Remove image'}
                </Button>
              )}
            </div>
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
              {medicalExamId !== null ? t('medicalExamination') : t('createMedicalExam')}
            </span>
          </Space>
        }
        open={medicalExamWorkerId !== null}
        onCancel={() => {
          setMedicalExamWorkerId(null);
          setMedicalExamId(null);
          medicalExamForm.resetFields();
        }}
        footer={null}
        width={600}
        className={styles.modal}
      >
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
                setMedicalExamWorkerId(null);
                setMedicalExamId(null);
                medicalExamForm.resetFields();
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
      </Modal>
    </div>
  );
}
