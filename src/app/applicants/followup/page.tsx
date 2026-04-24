'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  Empty,
  Spin,
  DatePicker,
  Table,
  Dropdown,
} from 'antd';
import type { MenuProps, TableColumnsType } from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  LogoutOutlined,
  MedicineBoxOutlined,
  StopOutlined,
  CloseCircleOutlined,
  FileProtectOutlined,
  EditOutlined,
  PrinterOutlined,
  ClearOutlined,
  DownOutlined,
  FileTextOutlined,
  FileExcelOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import {
  useWorkers,
  useMedicalExaminations,
  useUpdateMedicalExamination,
  useDeleteMedicalExamination,
} from '@/hooks/api/useWorkers';
import type { Worker } from '@/types/api.types';
import {
  MEDICAL_STATUS,
  WORKER_SATUS,
  NATIONALITIES,
  VISA_JOB_TYPES,
  toSelectOptions,
} from '@/constants/enums';
import styles from './WorkersFollowup.module.css';
import dayjs from 'dayjs';

// Translations
const translations = {
  en: {
    pageTitle: 'Workers Follow-up',
    searchPlaceholder: 'Search workers...',
    filters: 'Search Filters',
    search: 'Search',
    clearFilters: 'Clear',
    totalWorkers: 'Total Workers',
    activeWorkers: 'Active',
    pendingWorkers: 'Pending',
    issuesWorkers: 'Issues',
    status: 'Status',
    all: 'All',
    active: 'Active',
    pending: 'Pending',
    escaped: 'Escaped',
    refused: 'Refused',
    jobname: 'Job',
    sick: 'Sick',
    out: 'Out',
    reference: 'Ref',
    passportNo: 'Passport No.',
    nationality: 'Nationality',
    mobile: 'Mobile',
    workerName: 'Worker Name',
    agent: 'Agent',
    contractNo: 'Contract No.',
    visaNo: 'Visa No.',
    arrivalDate: 'Arrival Date',
    borderNo: 'Border No.',
    arrivalCity: 'Arrival City',
    residency: 'Residency',
    customerName: 'Customer Name',
    customerId: 'Customer ID',
    customerMobile: 'Customer Mobile',
    workerMobile: 'Worker Mobile',
    whatsApp: 'WhatsApp',
    lastUpdate: 'Last Update',
    username: 'Username',
    medicalExamination: 'Medical Examination',
    branch: 'Branch',
    employee: 'Employee',
    job: 'Job',
    fullNameAr: 'Name (Arabic)',
    fullNameEn: 'Name (English)',
    dataCompletion: 'Data Completion',
    complete: 'Complete',
    incomplete: 'Incomplete',
    workerStatus: 'Worker Status',
    createdBy: 'Created By',
    actions: 'Actions',
    markEscape: 'Mark Escaped',
    markRefused: 'Mark Refused',
    markSick: 'Mark Sick',
    deactivate: 'Deactivate',
    markOut: 'Mark Out',
    edit: 'Edit',
    print: 'Print',
    workerReport: 'Worker Report',
    followupReport: 'Follow-up Report',
    allData: 'All Data',
    noWorkers: 'No workers found',
    noWorkersDesc: 'No workers match your search criteria',
    confirmAction: 'Confirm Action',
    confirmEscape: 'Are you sure you want to mark this worker as escaped?',
    confirmRefused: 'Are you sure you want to mark this worker as refused?',
    confirmSick: 'Are you sure you want to mark this worker as sick?',
    confirmDeactivate: 'Are you sure you want to deactivate this worker?',
    confirmOut: 'Are you sure you want to mark this worker as out?',
    yes: 'Yes',
    cancel: 'Cancel',
    selectDate: 'Select Date',
    date: 'Date',
    updateMedicalExam: 'Update Medical Examination',
    deleteMedicalExam: 'Delete Medical Examination',
    confirmDeleteExam: 'Are you sure you want to delete this medical examination?',
    examDate: 'Examination Date',
    medicalStatus: 'Medical Status',
    notes: 'Notes',
    medicalStatusPassed: 'Passed',
    medicalStatusFailed: 'Failed',
    medicalStatusPending: 'Pending',
    noMedicalExam: 'No medical examination record',
    delete: 'Delete',
    update: 'Update',
    // Status options
    statusReceived: 'Worker Received',
    statusEscaped: 'Worker Escaped',
    statusSick: 'Sick',
    statusRefused: 'Work Refused',
    statusReturnTravel: 'Return Travel',
    statusSuspended: 'Suspended',
    statusFinalExit: 'Final Exit',
    statusReturnWork: 'Return to Work',
  },
  ar: {
    pageTitle: 'متابعة العمالة',
    searchPlaceholder: 'البحث في العمال...',
    filters: 'فلاتر البحث',
    search: 'بحث',
    clearFilters: 'إلغاء',
    totalWorkers: 'إجمالي العمال',
    activeWorkers: 'النشطون',
    pendingWorkers: 'قيد الانتظار',
    issuesWorkers: 'المشاكل',
    status: 'الحالة',
    all: 'الكل',
    active: 'نشط',
    pending: 'قيد الانتظار',
    escaped: 'هارب',
    refused: 'رافض',
    sick: 'مريض',
    out: 'خرج',
    reference: 'المرجع',
    passportNo: 'رقم الجواز',
    nationality: 'الجنسية',
    mobile: 'الجوال',
    workerName: 'اسم العامل',
    agent: 'الوكيل',
    contractNo: 'رقم العقد',
    visaNo: 'رقم التأشيرة',
    arrivalDate: 'تاريخ الوصول',
    borderNo: 'رقم الحدود',
    arrivalCity: 'مدينة الوصول',
    residency: 'الإقامة',
    customerName: 'اسم العميل',
    customerId: 'رقم الهوية',
    customerMobile: 'جوال العميل',
    workerMobile: 'جوال العامل',
    whatsApp: 'واتساب',
    lastUpdate: 'آخر تحديث',
    jobname: 'الوظيفة',
    username: 'اسم المستخدم',
    medicalExamination: 'الفحص الطبي',
    branch: 'الفرع',
    employee: 'الموظف',
    job: 'الوظيفة',
    fullNameAr: 'الاسم (عربي)',
    fullNameEn: 'الاسم (إنجليزي)',
    dataCompletion: 'اكتمال البيانات',
    complete: 'مكتملة',
    incomplete: 'غير مكتملة',
    workerStatus: 'حالة العامل',
    createdBy: 'أنشأ بواسطة',
    actions: 'الإجراءات',
    markEscape: 'تسجيل هروب',
    markRefused: 'تسجيل رفض',
    markSick: 'تسجيل مرض',
    deactivate: 'إيقاف',
    markOut: 'تسجيل خروج',
    edit: 'تعديل',
    print: 'طباعة',
    workerReport: 'تقرير العمالة',
    followupReport: 'تقرير المتابعة',
    allData: 'كل البيانات',
    noWorkers: 'لا يوجد عمال',
    noWorkersDesc: 'لا يوجد عمال يطابقون معايير البحث',
    confirmAction: 'تأكيد الإجراء',
    confirmEscape: 'هل أنت متأكد من تسجيل هذا العامل كهارب؟',
    confirmRefused: 'هل أنت متأكد من تسجيل هذا العامل كرافض؟',
    confirmSick: 'هل أنت متأكد من تسجيل هذا العامل كمريض؟',
    confirmDeactivate: 'هل أنت متأكد من إيقاف هذا العامل؟',
    confirmOut: 'هل أنت متأكد من تسجيل خروج هذا العامل؟',
    yes: 'نعم',
    cancel: 'إلغاء',
    selectDate: 'اختر التاريخ',
    date: 'التاريخ',
    updateMedicalExam: 'تحديث الفحص الطبي',
    deleteMedicalExam: 'حذف الفحص الطبي',
    confirmDeleteExam: 'هل أنت متأكد من حذف هذا الفحص الطبي؟',
    examDate: 'تاريخ الفحص',
    medicalStatus: 'الحالة الطبية',
    notes: 'ملاحظات',
    medicalStatusPassed: 'ناجح',
    medicalStatusFailed: 'راسب',
    medicalStatusPending: 'قيد الانتظار',
    noMedicalExam: 'لا يوجد سجل فحص طبي',
    delete: 'حذف',
    update: 'تحديث',
    // Status options
    statusReceived: 'استلام العامل',
    statusEscaped: 'هروب العامل',
    statusSick: 'مريض',
    statusRefused: 'رفض العمل',
    statusReturnTravel: 'خروج وعودة',
    statusSuspended: 'ايقاف مؤقت',
    statusFinalExit: 'خروج نهائي',
    statusReturnWork: 'العودة الى العمل',
  },
};

export default function WorkersFollowupPage() {
  const language = useAuthStore((state) => state.language);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{
    search?: string;
    status?: string;
    nationality?: string;
    job?: string;
    agent?: string;
    dataCompletion?: string;
    createdBy?: string;
    arrivalDateFrom?: dayjs.Dayjs;
    arrivalDateTo?: dayjs.Dayjs;
  }>({});
  const [editingExamId, setEditingExamId] = useState<number | null>(null);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [examFormData, setExamFormData] = useState<{
    examDate: dayjs.Dayjs;
    medicalStatus: number;
    notes: string;
  }>({ examDate: dayjs(), medicalStatus: 0, notes: '' });

  const t = (key: keyof typeof translations.en) => {
    return translations[language][key] || key;
  };

  const { data: workers = [], isLoading } = useWorkers();
  const { data: medicalExaminations = [] } = useMedicalExaminations();
  const { mutate: updateMedicalExam, isPending: isUpdating } = useUpdateMedicalExamination();
  const { mutate: deleteMedicalExam } = useDeleteMedicalExamination();

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

      const matchesStatus = !filters.status || worker.workerStatus === Number(filters.status);
      const matchesNationality =
        !filters.nationality || String(worker.nationalityId) === String(filters.nationality);
      const matchesJob = !filters.job || worker.jobname === filters.job;

      return matchesSearch && matchesStatus && matchesNationality && matchesJob;
    });
  }, [workers, filters]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: filteredWorkers.length,
      active: filteredWorkers.filter((w) => w.workerStatus === 2).length,
      pending: filteredWorkers.filter((w) => w.workerStatus === 1).length,
      issues: filteredWorkers.filter((w) => [2, 3, 4].includes(w.workerStatus || 0)).length,
    };
  }, [filteredWorkers]);

  // Print menu
  const printMenu: MenuProps = {
    items: [
      { key: 'worker-report', label: t('workerReport'), icon: <FileTextOutlined /> },
      { key: 'followup-report', label: t('followupReport'), icon: <FileTextOutlined /> },
      { key: 'all-data', label: t('allData'), icon: <FileExcelOutlined /> },
    ],
    onClick: ({ key }) => {
      console.log('Print:', key);
    },
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  // Status tag
  const getStatusTag = (status?: number | null) => {
    const statusConfig: Record<number, { color: string; icon: React.ReactNode; label: string }> = {
      1: { color: 'warning', icon: <ClockCircleOutlined />, label: t('statusReceived') },
      2: { color: 'error', icon: <ExclamationCircleOutlined />, label: t('statusEscaped') },
      3: { color: 'processing', icon: <MedicineBoxOutlined />, label: t('statusSick') },
      4: { color: 'error', icon: <CloseCircleOutlined />, label: t('statusRefused') },
      5: { color: 'default', icon: <LogoutOutlined />, label: t('statusReturnTravel') },
      6: { color: 'volcano', icon: <StopOutlined />, label: t('statusSuspended') },
      7: { color: 'red', icon: <LogoutOutlined />, label: t('statusFinalExit') },
      8: { color: 'success', icon: <CheckCircleOutlined />, label: t('statusReturnWork') },
    };

    const config = statusConfig[status || 0] || { color: 'default', icon: null, label: '-' };

    return (
      <Tag color={config.color} icon={config.icon}>
        {config.label}
      </Tag>
    );
  };

  // Handlers for medical examination
  // const handleOpenUpdateExamModal = (worker: Worker) => {
  //   const exam = medicalExaminations.find((e) => e.workerId === worker.id);
  //   if (!exam) return;

  //   setEditingExamId(exam.id);
  //   setExamFormData({
  //     examDate: exam.examDate ? dayjs(exam.examDate) : dayjs(),
  //     medicalStatus: exam.medicalStatus,
  //     notes: exam.notes || '',
  //   });
  //   setIsExamModalOpen(true);
  // };

  const handleDeleteExam = (worker: Worker) => {
    const exam = medicalExaminations.find((e) => e.workerId === worker.id);
    if (!exam) return;

    Modal.confirm({
      title: t('deleteMedicalExam'),
      icon: <ExclamationCircleOutlined />,
      content: t('confirmDeleteExam'),
      okText: t('delete'),
      cancelText: t('cancel'),
      okButtonProps: { danger: true },
      onOk: () => deleteMedicalExam(exam.id),
    });
  };

  const handleUpdateExam = () => {
    if (!editingExamId) return;

    updateMedicalExam(
      {
        id: editingExamId,
        data: {
          examDate: examFormData.examDate.format('YYYY-MM-DD'),
          medicalStatus: examFormData.medicalStatus,
          notes: examFormData.notes,
        },
      },
      {
        onSuccess: () => {
          setIsExamModalOpen(false);
          setEditingExamId(null);
        },
      }
    );
  };

  const handleCloseExamModal = () => {
    setIsExamModalOpen(false);
    setEditingExamId(null);
    setExamFormData({ examDate: dayjs(), medicalStatus: 0, notes: '' });
  };

  // Action menu for each row - only medical examination actions
  const getActionMenu = (worker: Worker): MenuProps => {
    const exam = medicalExaminations.find((e) => e.workerId === worker.id);

    if (!exam) {
      return {
        items: [
          {
            key: 'no-exam',
            label: t('noMedicalExam'),
            disabled: true,
          },
        ],
      };
    }

    return {
      items: [
        // {
        //   key: 'update',
        //   label: t('updateMedicalExam'),
        //   icon: <EditOutlined />,
        //   onClick: () => handleOpenUpdateExamModal(worker),
        // },
        {
          key: 'delete',
          label: t('deleteMedicalExam'),
          icon: <DeleteOutlined />,
          danger: true,
          onClick: () => handleDeleteExam(worker),
        },
      ],
    };
  };

  // Table columns matching the HTML
  const columns: TableColumnsType<Worker> = [
    {
      title: t('workerName'),
      key: 'name',
      fixed: 'left',
      width: 120,
      render: (_, worker) => (
        <div>
          <div style={{ fontWeight: 600, color: '#003366' }}>
            {language === 'ar' ? worker.fullNameAr : worker.fullNameEn || worker.fullNameAr}
          </div>
          {worker.fullNameEn && worker.fullNameAr && (
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              {language === 'ar' ? worker.fullNameEn : worker.fullNameAr}
            </div>
          )}
        </div>
      ),
    },
    {
      title: t('agent'),
      dataIndex: 'agentName',
      key: 'agent',
      width: 120,
    },
    {
      title: t('passportNo'),
      dataIndex: 'passportNo',
      key: 'passportNo',
      width: 140,
    },
    {
      title: t('medicalExamination'),
      key: 'medicalExamination',
      width: 120,
      render: (_, worker) => {
        const workerExam = medicalExaminations.find((exam) => exam.workerId === worker.id);
        if (!workerExam) return '-';
        const statusMap: Record<number, { label: string; color: string }> = {
          0: { label: language === 'ar' ? 'قيد الانتظار' : 'Pending', color: 'default' },
          1: { label: language === 'ar' ? 'ناجح' : 'Passed', color: 'success' },
          2: { label: language === 'ar' ? 'راسب' : 'Failed', color: 'error' },
        };
        const status = statusMap[workerExam.medicalStatus] || statusMap[0];
        return (
          <Tag color={status.color} icon={<MedicineBoxOutlined />}>
            {status.label}
          </Tag>
        );
      },
    },
    {
      title: t('jobname'),
      dataIndex: 'jobname',
      key: 'jobname',
      width: 120,
    },
    {
      title: t('status'),
      key: 'status',
      width: 120,
      render: (_, worker) => getStatusTag(worker.workerStatus),
    },
    {
      title: t('username'),
      dataIndex: 'userName',
      key: 'username',
      width: 120,
    },
    {
      title: t('actions'),
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, worker) => (
        <Dropdown menu={getActionMenu(worker)} trigger={['click']}>
          <Button type="text" size="small" className={styles.actionDropdownBtn}>
            {t('actions')} <DownOutlined />
          </Button>
        </Dropdown>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className={styles.followupPage}>
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
    <div className={styles.followupPage}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <FileProtectOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('pageTitle')}</h1>
            </div>
          </div>
          <div className={styles.headerButtons}>
            <Dropdown menu={printMenu}>
              <Button className={styles.headerBtn} icon={<PrinterOutlined />}>
                {t('print')} <DownOutlined />
              </Button>
            </Dropdown>
            <Button className={styles.headerBtn} icon={<EditOutlined />}>
              {t('edit')}
            </Button>
          </div>
        </div>
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
                <UserOutlined style={{ color: '#ffffff', fontSize: 24 }} />
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
                <CheckCircleOutlined style={{ color: '#ffffff', fontSize: 24 }} />
              </div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>{t('activeWorkers')}</p>
                <p className={styles.statValue}>{stats.active}</p>
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
                <ClockCircleOutlined style={{ color: '#ffffff', fontSize: 24 }} />
              </div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>{t('pendingWorkers')}</p>
                <p className={styles.statValue}>{stats.pending}</p>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <div className={styles.statContent}>
              <div
                className={styles.statIcon}
                style={{ background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)' }}
              >
                <WarningOutlined style={{ color: '#ffffff', fontSize: 24 }} />
              </div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>{t('issuesWorkers')}</p>
                <p className={styles.statValue}>{stats.issues}</p>
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
                  options={toSelectOptions([...NATIONALITIES], language).map((o) => ({
                    value: String(o.value),
                    label: o.label,
                  }))}
                />
              </Col>

              <Col xs={24} md={6}>
                <label className={styles.filterLabel}>{t('job')}</label>
                <Select
                  size="large"
                  placeholder={t('job')}
                  value={filters.job}
                  onChange={(value) => setFilters({ ...filters, job: value })}
                  style={{ width: '100%' }}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={toSelectOptions([...VISA_JOB_TYPES], language).map((o) => ({
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
                <label className={styles.filterLabel}>{t('dataCompletion')}</label>
                <Select
                  size="large"
                  placeholder={t('dataCompletion')}
                  value={filters.dataCompletion}
                  onChange={(value) => setFilters({ ...filters, dataCompletion: value })}
                  style={{ width: '100%' }}
                  allowClear
                >
                  <Select.Option value="complete">{t('complete')}</Select.Option>
                  <Select.Option value="incomplete">{t('incomplete')}</Select.Option>
                </Select>
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
                />
              </Col>

              <Col xs={24} md={6}>
                <label className={styles.filterLabel}>{t('arrivalDate')}</label>
                <DatePicker.RangePicker
                  size="large"
                  style={{ width: '100%' }}
                  onChange={(dates) => {
                    setFilters({
                      ...filters,
                      arrivalDateFrom: dates?.[0] || undefined,
                      arrivalDateTo: dates?.[1] || undefined,
                    });
                  }}
                />
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

      {/* Workers Table */}
      <Card className={styles.tableCard}>
        <Table
          dataSource={filteredWorkers}
          columns={columns}
          rowKey="id"
          scroll={{ x: 1800 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total, range) =>
              language === 'ar'
                ? `${range[0]}-${range[1]} من ${total}`
                : `${range[0]}-${range[1]} of ${total}`,
          }}
          locale={{
            emptyText: (
              <Empty description={t('noWorkersDesc')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ),
          }}
        />
      </Card>

      {/* Update Medical Examination Modal */}
      <Modal
        title={
          <Space>
            <MedicineBoxOutlined />
            <span>{t('updateMedicalExam')}</span>
          </Space>
        }
        open={isExamModalOpen}
        onCancel={handleCloseExamModal}
        footer={null}
        width={600}
        className={styles.modal}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <div>
            <label className={styles.filterLabel}>{t('examDate')}</label>
            <DatePicker
              value={examFormData.examDate}
              onChange={(date) => setExamFormData({ ...examFormData, examDate: date || dayjs() })}
              style={{ width: '100%' }}
              size="large"
            />
          </div>

          <div>
            <label className={styles.filterLabel}>{t('medicalStatus')}</label>
            <Select
              value={examFormData.medicalStatus}
              onChange={(value) => setExamFormData({ ...examFormData, medicalStatus: value })}
              style={{ width: '100%' }}
              size="large"
              options={toSelectOptions([...MEDICAL_STATUS], language)}
            />
          </div>

          <div>
            <label className={styles.filterLabel}>{t('notes')}</label>
            <Input.TextArea
              value={examFormData.notes}
              onChange={(e) => setExamFormData({ ...examFormData, notes: e.target.value })}
              rows={4}
              placeholder={t('notes')}
            />
          </div>

          <div className={styles.modalActions}>
            <Button className={styles.cancelButton} onClick={handleCloseExamModal}>
              {t('cancel')}
            </Button>
            <Button
              type="primary"
              className={styles.submitButton}
              onClick={handleUpdateExam}
              loading={isUpdating}
              icon={<EditOutlined />}
            >
              {t('update')}
            </Button>
          </div>
        </Space>
      </Modal>
    </div>
  );
}
