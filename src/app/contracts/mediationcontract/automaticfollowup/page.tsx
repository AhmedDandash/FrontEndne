'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Button,
  Tag,
  Badge,
  Statistic,
  Modal,
  DatePicker,
  Empty,
  Spin,
  Avatar,
  Dropdown,
  Pagination,
  Form,
  Switch,
  Tooltip,
  message,
} from 'antd';
import {
  SearchOutlined,
  FileTextOutlined,
  FileExcelOutlined,
  PrinterOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  IdcardOutlined,
  SafetyOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  UserAddOutlined,
  EditOutlined,
  MoreOutlined,
  CheckOutlined,
  RollbackOutlined,
  EyeOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ar';

import { useAuthStore } from '@/store/authStore';
import { useMediationContracts } from '@/hooks/api/useMediationContracts';
import { useMediationFollowUpStatuses } from '@/hooks/api/useMediationFollowUpStatuses';
import { useMediationSubStatuses } from '@/hooks/api/useMediationFollowUpStatuses';
import {
  useMediationContractFollowUps,
  useCreateMediationContractFollowUp,
} from '@/hooks/api/useMediationContractFollowUps';
import { useNationalities } from '@/hooks/api/useNationalities';
import { useAgents } from '@/hooks/api/useAgents';
import {
  useNationalityFollowUpStatuses,
  useToggleNationalityFollowUpActive,
} from '@/hooks/api/useNationalityFollowUpStatuses';
import type {
  MediationContract,
  MediationFollowUpStatus,
  NationalityFollowUpStatus,
} from '@/types/api.types';
import { NATIONALITIES, getEnumLabel } from '@/constants/enums';
import styles from './AutomaticFollowup.module.css';

dayjs.extend(relativeTime);

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function AutomaticFollowupPage() {
  const { language } = useAuthStore();
  const isAr = language === 'ar';

  // ─── Data Queries ───
  const { contracts, isLoading } = useMediationContracts();
  const { data: parentStatuses } = useMediationFollowUpStatuses();
  const { data: nationalities } = useNationalities();
  const { data: agents } = useAgents();
  const { data: nationalityFollowUpStatuses } = useNationalityFollowUpStatuses();
  const toggleNatStatusActive = useToggleNationalityFollowUpActive();

  // ─── Filter State ───
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | 'all'>('all');
  const [nationalityFilter, setNationalityFilter] = useState<number | 'all'>('all');
  const [agentFilter, setAgentFilter] = useState<string | 'all'>('all');

  // ─── Pagination ───
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ─── Status Update Modal ───
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [activeContract, setActiveContract] = useState<MediationContract | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null);
  const [statusDate, setStatusDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [statusNotes, setStatusNotes] = useState('');

  // ─── Details Modal ───
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsContract, setDetailsContract] = useState<MediationContract | null>(null);

  // Sub-statuses for selected parent in modal
  const { data: subStatuses, isLoading: subLoading } = useMediationSubStatuses(selectedParentId);

  // Follow-ups for detail contract
  const { data: contractFollowUps } = useMediationContractFollowUps(detailsContract?.id ?? null);

  // Create mutation
  const createFollowUp = useCreateMediationContractFollowUp();

  // ─── Translations ───
  const t = useMemo(
    () => ({
      pageTitle: isAr ? 'المتابعة التلقائية' : 'Automatic Follow-up',
      pageSubtitle: isAr
        ? 'تتبع وإدارة متابعات عقود الوساطة'
        : 'Track and manage mediation contract follow-ups',
      exportExcel: isAr ? 'تصدير إكسل' : 'Export Excel',
      print: isAr ? 'طباعة' : 'Print',
      search: isAr ? 'بحث بالعقد، العميل، الجوال...' : 'Search by contract, customer, mobile...',
      allStatuses: isAr ? 'جميع الحالات' : 'All Statuses',
      allNationalities: isAr ? 'جميع الجنسيات' : 'All Nationalities',
      allAgents: isAr ? 'جميع الوكلاء' : 'All Agents',
      total: isAr ? 'إجمالي العقود' : 'Total Contracts',
      pending: isAr ? 'قيد المتابعة' : 'Pending',
      completed: isAr ? 'مكتملة' : 'Completed',
      atRisk: isAr ? 'متأخرة' : 'Overdue',
      customer: isAr ? 'العميل' : 'Customer',
      phone: isAr ? 'الجوال' : 'Phone',
      visa: isAr ? 'التأشيرة' : 'Visa',
      nationality: isAr ? 'الجنسية' : 'Nationality',
      job: isAr ? 'المهنة' : 'Job',
      agent: isAr ? 'الوكيل' : 'Agent',
      branch: isAr ? 'الفرع' : 'Branch',
      musaned: isAr ? 'رقم مساند' : 'Musaned #',
      contractNumber: isAr ? 'رقم العقد' : 'Contract #',
      createdAt: isAr ? 'تاريخ الإنشاء' : 'Created At',
      days: isAr ? 'يوم' : 'days',
      noResults: isAr ? 'لا توجد نتائج' : 'No results found',
      updateStatus: isAr ? 'تحديث الحالة' : 'Update Status',
      quickUpdates: isAr ? 'التحديثات السريعة' : 'Quick Updates',
      medical: isAr ? 'فحص طبي' : 'Medical',
      biometric: isAr ? 'بصمة' : 'Biometric',
      tesda: isAr ? 'تدريب' : 'TESDA',
      owwa: isAr ? 'تأمين' : 'OWWA',
      visaStamp: isAr ? 'ختم فيزا' : 'Visa Stamp',
      travelClearance: isAr ? 'إذن سفر' : 'Travel Clearance',
      flightTicket: isAr ? 'تذكرة طيران' : 'Flight Ticket',
      confirmArrival: isAr ? 'تأكيد الوصول' : 'Confirm Arrival',
      backOut: isAr ? 'باك آوت' : 'Back Out',
      addDelegate: isAr ? 'إضافة متفوض' : 'Add Delegate',
      notes: isAr ? 'ملاحظات' : 'Notes',
      editContract: isAr ? 'تعديل العقد' : 'Edit Contract',
      viewDetails: isAr ? 'عرض التفاصيل' : 'View Details',
      delete: isAr ? 'حذف' : 'Delete',
      selectStatus: isAr ? 'اختر الحالة الرئيسية' : 'Select Parent Status',
      selectSubStatus: isAr ? 'اختر الحالة الفرعية' : 'Select Sub-Status',
      date: isAr ? 'التاريخ' : 'Date',
      save: isAr ? 'حفظ' : 'Save',
      cancel: isAr ? 'إلغاء' : 'Cancel',
      close: isAr ? 'إغلاق' : 'Close',
      followUpHistory: isAr ? 'سجل المتابعات' : 'Follow-up History',
      showing: isAr ? 'عرض' : 'Showing',
      of: isAr ? 'من' : 'of',
      warranty: isAr ? 'الضمان' : 'Warranty',
      totalCost: isAr ? 'إجمالي التكلفة' : 'Total Cost',
    }),
    [isAr]
  );

  // ─── Filtered & Paginated Data ───
  const contractList = useMemo(() => (Array.isArray(contracts) ? contracts : []), [contracts]);

  const filtered = useMemo(() => {
    let list = [...contractList];

    if (searchText) {
      const q = searchText.toLowerCase();
      list = list.filter(
        (c) =>
          String(c.id).includes(q) ||
          (c.customerName || '').toLowerCase().includes(q) ||
          (c.customerNameAr || '').toLowerCase().includes(q) ||
          (c.customerPhone || '').includes(q) ||
          (c.musanedContractNumber || '').toLowerCase().includes(q) ||
          (c.visaNumber || '').toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      list = list.filter((c) => c.statusId === statusFilter);
    }

    if (nationalityFilter !== 'all') {
      list = list.filter((c) => c.nationalityId === nationalityFilter);
    }

    if (agentFilter !== 'all') {
      list = list.filter((c) => (c.agentName || '').toLowerCase() === agentFilter.toLowerCase());
    }

    return list;
  }, [contractList, searchText, statusFilter, nationalityFilter, agentFilter, nationalities]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // ─── Stats ───
  const stats = useMemo(() => {
    const total = contractList.length;
    const completed = contractList.filter((c) => c.statusId === 5).length; // rough estimate
    const overdue = contractList.filter((c) => {
      if (!c.createdAt) return false;
      return dayjs().diff(dayjs(c.createdAt), 'day') > 30;
    }).length;
    return { total, pending: total - completed, completed, overdue };
  }, [contractList]);

  // ─── Helpers ───
  const daysSince = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    return `${dayjs().diff(dayjs(dateStr), 'day')} ${t.days}`;
  };

  /** Resolve nationality display name via NATIONALITIES enum */
  const getNationalityName = (contract: MediationContract): string => {
    return getEnumLabel(NATIONALITIES, contract.nationalityId, isAr ? 'ar' : 'en');
  };

  /** NationalityFollowUpStatus records assigned to a given nationality */
  const getNatAssignedStatuses = (nationalityId?: number | null): NationalityFollowUpStatus[] => {
    if (!nationalityId || !Array.isArray(nationalityFollowUpStatuses)) return [];
    return nationalityFollowUpStatuses.filter((ns) => ns.nationalityId === nationalityId);
  };

  /** Parent statuses filtered to only those linked to the nationality */
  const getFilteredParentStatuses = (nationalityId?: number | null): MediationFollowUpStatus[] => {
    const assigned = getNatAssignedStatuses(nationalityId);
    if (!Array.isArray(parentStatuses)) return [];
    if (assigned.length === 0) return [];
    const assignedIds = new Set(assigned.map((a) => a.followUpStatusId));
    return parentStatuses.filter((ps) => assignedIds.has(ps.id));
  };

  const openStatusModal = (contract: MediationContract, parentStatusId?: number) => {
    const assigned = getNatAssignedStatuses(contract.nationalityId);
    if (assigned.length === 0) {
      message.warning(
        isAr
          ? 'لا توجد حالات متابعة مخصصة لجنسية هذا العقد'
          : "No follow-up statuses are assigned to this contract's nationality"
      );
      return;
    }
    setActiveContract(contract);
    setSelectedParentId(parentStatusId ?? null);
    setSelectedSubId(null);
    setStatusDate(dayjs());
    setStatusNotes('');
    setStatusModalOpen(true);
  };

  const handleSaveStatus = async () => {
    if (!activeContract || !selectedParentId || !selectedSubId || !statusDate) {
      message.warning(isAr ? 'يرجى تعبئة جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    try {
      await createFollowUp.mutateAsync({
        contractId: activeContract.id,
        mediationFollowUpStatusesId: selectedParentId,
        mediationStatusesId: selectedSubId,
        examinationDate: statusDate.format('YYYY-MM-DD'),
        notes: statusNotes || undefined,
      });
      setStatusModalOpen(false);
    } catch {
      // error handled by hook
    }
  };

  const openDetails = (contract: MediationContract) => {
    setDetailsContract(contract);
    setDetailsModalOpen(true);
  };

  const getMenuItems = (contract: MediationContract) => [
    {
      key: 'view',
      label: t.viewDetails,
      icon: <EyeOutlined />,
      onClick: () => openDetails(contract),
    },
    {
      key: 'edit',
      label: t.editContract,
      icon: <EditOutlined />,
    },
    { type: 'divider' as const },
    {
      key: 'delete',
      label: t.delete,
      icon: <DeleteOutlined />,
      danger: true,
    },
  ];

  // ─── Card Renderer ───
  const renderCard = (contract: MediationContract) => {
    const createdDays = contract.createdAt ? dayjs().diff(dayjs(contract.createdAt), 'day') : null;
    const isOverdue = createdDays !== null && createdDays > 30;

    return (
      <Col xs={24} key={contract.id}>
        <Card className={styles.followupCard} hoverable>
          <div className={styles.cardContent}>
            {/* ── LEFT ── */}
            <div className={styles.cardLeft}>
              {/* Header */}
              <div className={styles.cardHeader}>
                <div className={styles.contractNumber}>
                  <FileTextOutlined className={styles.contractIcon} />
                  <span>#{contract.id}</span>
                  {contract.musanedContractNumber && (
                    <Tag color="blue" style={{ marginInlineStart: 8, fontSize: 11 }}>
                      {t.musaned}: {contract.musanedContractNumber}
                    </Tag>
                  )}
                </div>
                <div className={styles.headerActions}>
                  <Dropdown menu={{ items: getMenuItems(contract) }} trigger={['click']}>
                    <Button type="text" icon={<MoreOutlined />} className={styles.moreBtn} />
                  </Dropdown>
                </div>
              </div>

              {/* Status */}
              <div className={styles.statusSection}>
                <Badge
                  status={isOverdue ? 'error' : 'processing'}
                  text={
                    isOverdue ? (isAr ? 'متأخر' : 'Overdue') : isAr ? 'قيد المتابعة' : 'In Progress'
                  }
                />
                {contract.contractType !== undefined && contract.contractType !== null && (
                  <Tag color={contract.contractType === 1 ? 'green' : 'purple'}>
                    {contract.contractType === 1
                      ? isAr
                        ? 'إستقدام'
                        : 'Recruitment'
                      : isAr
                        ? 'نقل خدمات'
                        : 'Transfer'}
                  </Tag>
                )}
              </div>

              {/* Customer */}
              <div className={styles.customerSection}>
                <Avatar size={44} icon={<UserOutlined />} className={styles.customerAvatar} />
                <div className={styles.customerDetails}>
                  <span className={styles.customerName}>
                    {isAr
                      ? contract.customerNameAr || contract.customerName
                      : contract.customerName || contract.customerNameAr || '—'}
                  </span>
                  <div className={styles.customerMeta}>
                    {contract.customerPhone && (
                      <>
                        <PhoneOutlined />
                        <span dir="ltr">{contract.customerPhone}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className={styles.infoSection}>
                {contract.visaNumber && (
                  <div className={styles.infoItem}>
                    <SafetyOutlined className={styles.infoIcon} />
                    <div className={styles.infoText}>
                      <span className={styles.infoLabel}>{t.visa}</span>
                      <span className={styles.infoValue}>{contract.visaNumber}</span>
                    </div>
                  </div>
                )}
                <div className={styles.infoItem}>
                  <EnvironmentOutlined className={styles.infoIcon} />
                  <div className={styles.infoText}>
                    <span className={styles.infoLabel}>{t.nationality}</span>
                    <span className={styles.infoValue}>{getNationalityName(contract)}</span>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <TeamOutlined className={styles.infoIcon} />
                  <div className={styles.infoText}>
                    <span className={styles.infoLabel}>{t.job}</span>
                    <span className={styles.infoValue}>
                      {isAr
                        ? contract.jobNameAr || contract.jobName || '—'
                        : contract.jobName || contract.jobNameAr || '—'}
                    </span>
                  </div>
                </div>
                {contract.branchName && (
                  <div className={styles.infoItem}>
                    <IdcardOutlined className={styles.infoIcon} />
                    <div className={styles.infoText}>
                      <span className={styles.infoLabel}>{t.branch}</span>
                      <span className={styles.infoValue}>{contract.branchName}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Created by */}
              <div className={styles.createdInfo}>
                <div className={styles.createdItem}>
                  <ClockCircleOutlined className={styles.createdIcon} />
                  <div className={styles.createdText}>
                    <span className={styles.createdLabel}>{t.createdAt}</span>
                    <span className={styles.createdValue}>
                      {contract.createdAt ? dayjs(contract.createdAt).format('YYYY-MM-DD') : '—'} (
                      {daysSince(contract.createdAt)})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT ── */}
            <div className={styles.cardRight}>
              <div className={styles.agentInfo}>
                <TeamOutlined className={styles.agentIcon} />
                <div>
                  <span className={styles.agentLabel}>{t.agent}</span>
                  <span className={styles.agentValue}>{contract.agentName || '—'}</span>
                </div>
              </div>

              {/* Dates */}
              <div className={styles.datesSection}>
                <div className={styles.dateItem}>
                  <span className={styles.dateLabel}>{t.createdAt}</span>
                  <span className={styles.dateValue}>{daysSince(contract.createdAt)}</span>
                </div>
              </div>

              {/* Cost */}
              {contract.totalCost != null && (
                <div className={styles.warrantyInfo}>
                  <div className={styles.warrantyItem}>
                    <span className={styles.warrantyLabel}>{t.totalCost}</span>
                    <span className={styles.warrantyValue}>
                      {Number(contract.totalCost).toLocaleString()} SAR
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className={styles.mainActionsSection}>
                <Button
                  type="primary"
                  size="small"
                  block
                  icon={<CheckOutlined />}
                  className={styles.confirmBtn}
                >
                  {t.confirmArrival}
                </Button>
                <Button
                  type="default"
                  size="small"
                  block
                  icon={<RollbackOutlined />}
                  className={styles.backoutBtn}
                >
                  {t.backOut}
                </Button>
              </div>

              <div className={styles.secondaryActionsSection}>
                <Button
                  type="text"
                  size="small"
                  block
                  icon={<UserAddOutlined />}
                  className={styles.actionLink}
                >
                  {t.addDelegate}
                </Button>
                <Button
                  type="text"
                  size="small"
                  block
                  icon={<FileTextOutlined />}
                  className={styles.actionLink}
                >
                  {t.notes}
                </Button>
                <Button
                  type="text"
                  size="small"
                  block
                  icon={<EyeOutlined />}
                  className={styles.actionLink}
                  onClick={() => openDetails(contract)}
                >
                  {t.viewDetails}
                </Button>
              </div>
            </div>

            {/* ── BOTTOM ── */}
            <div className={styles.cardBottom}>
              <div className={styles.buttonGroup}>
                {(() => {
                  const hasStatuses = getNatAssignedStatuses(contract.nationalityId).length > 0;
                  return (
                    <Tooltip
                      title={
                        !hasStatuses
                          ? isAr
                            ? 'لا توجد حالات متابعة مخصصة لجنسية هذا العقد'
                            : "No follow-up statuses assigned to this contract's nationality"
                          : undefined
                      }
                    >
                      <Button
                        type="primary"
                        size="middle"
                        icon={<EditOutlined />}
                        className={styles.updateStatusBtn}
                        onClick={() => openStatusModal(contract)}
                        disabled={!hasStatuses}
                      >
                        {t.updateStatus}
                      </Button>
                    </Tooltip>
                  );
                })()}
              </div>
              {(() => {
                const natStatuses = getNatAssignedStatuses(contract.nationalityId);
                if (natStatuses.length === 0) return null;
                return (
                  <div className={styles.buttonGroup}>
                    <span className={styles.groupLabel}>{t.quickUpdates}</span>
                    <div className={styles.groupButtons}>
                      {natStatuses.map((ns) => {
                        const ps = Array.isArray(parentStatuses)
                          ? parentStatuses.find((p) => p.id === ns.followUpStatusId)
                          : null;
                        const label = ps
                          ? isAr
                            ? ps.nameAr || ps.nameEn || '—'
                            : ps.nameEn || ps.nameAr || '—'
                          : String(ns.followUpStatusId);
                        return (
                          <Button
                            key={ns.id}
                            size="small"
                            icon={<EditOutlined />}
                            className={`${styles.actionBtn}${!ns.isActive ? ` ${styles.actionBtnInactive}` : ''}`}
                            disabled={!ns.isActive}
                            onClick={() =>
                              openStatusModal(contract, ns.followUpStatusId ?? undefined)
                            }
                          >
                            {label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </Card>
      </Col>
    );
  };

  // ─── Render ───
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.followupPage}>
      {/* ─── Page Header ─── */}
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
            <Button icon={<FileExcelOutlined />} className={styles.secondaryBtn}>
              {t.exportExcel}
            </Button>
            <Button icon={<PrinterOutlined />} className={styles.secondaryBtn}>
              {t.print}
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Statistics ─── */}
      <Row gutter={[16, 16]} className={styles.statisticsRow}>
        <Col xs={12} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={t.total}
              value={stats.total}
              prefix={<FileTextOutlined style={{ color: '#003366' }} />}
              valueStyle={{ color: '#003366' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={t.pending}
              value={stats.pending}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={t.completed}
              value={stats.completed}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={t.atRisk}
              value={stats.overdue}
              prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* ─── Filters ─── */}
      <Card className={styles.filterCard}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={6}>
            <Input
              placeholder={t.search}
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
              allowClear
              size="large"
              className={styles.searchInput}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                setCurrentPage(1);
              }}
              style={{ width: '100%' }}
              size="large"
              options={[
                { value: 'all', label: t.allStatuses },
                ...(Array.isArray(parentStatuses)
                  ? parentStatuses.map((s) => ({
                      value: s.id,
                      label: isAr ? s.nameAr || s.nameEn : s.nameEn || s.nameAr,
                    }))
                  : []),
              ]}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              value={nationalityFilter}
              onChange={(v) => {
                setNationalityFilter(v);
                setCurrentPage(1);
              }}
              style={{ width: '100%' }}
              size="large"
              showSearch
              optionFilterProp="label"
              // options={[
              //   { value: 'all', label: t.allNationalities },
              //   ...(Array.isArray(nationalities)
              //     ? nationalities
              //         .filter((n) => n.nationalityId != null)
              //         .map((n) => ({
              //           value: n.nationalityId as number,
              //           label:
              //             getEnumLabel(NATIONALITIES, n.nationalityId, isAr ? 'ar' : 'en') ||
              //             n.nationalityName ||
              //             String(n.nationalityId),
              //         }))
              //     : []),
              // ]}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              value={agentFilter}
              onChange={(v) => {
                setAgentFilter(v);
                setCurrentPage(1);
              }}
              style={{ width: '100%' }}
              size="large"
              showSearch
              optionFilterProp="label"
              options={[
                { value: 'all', label: t.allAgents },
                ...(Array.isArray(agents)
                  ? agents.map((a) => ({
                      value: isAr
                        ? a.agentNameAr || a.agentNameEn || ''
                        : a.agentNameEn || a.agentNameAr || '',
                      label: isAr ? a.agentNameAr || a.agentNameEn : a.agentNameEn || a.agentNameAr,
                    }))
                  : []),
              ]}
            />
          </Col>
        </Row>
      </Card>

      {/* ─── Results Info ─── */}
      <div className={styles.resultsInfo}>
        <span>
          {t.showing} {paginated.length} {t.of} {filtered.length}
        </span>
      </div>

      {/* ─── Contract Cards ─── */}
      {filtered.length > 0 ? (
        <>
          <Row gutter={[16, 16]} className={styles.followupsGrid}>
            {paginated.map(renderCard)}
          </Row>
          <div className={styles.paginationWrapper}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filtered.length}
              showSizeChanger
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }}
              showTotal={(total, range) =>
                isAr ? `${range[0]}-${range[1]} من ${total}` : `${range[0]}-${range[1]} of ${total}`
              }
            />
          </div>
        </>
      ) : (
        <Card className={styles.emptyCard}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t.noResults} />
        </Card>
      )}

      {/* ─── Status Update Modal ─── */}
      <Modal
        title={
          activeContract
            ? `${t.updateStatus} — #${activeContract.id} · ${getNationalityName(activeContract)}`
            : t.updateStatus
        }
        open={statusModalOpen}
        onCancel={() => setStatusModalOpen(false)}
        className={styles.statusModal}
        footer={[
          <Button key="cancel" onClick={() => setStatusModalOpen(false)}>
            {t.cancel}
          </Button>,
          <Button
            key="save"
            type="primary"
            loading={createFollowUp.isPending}
            onClick={handleSaveStatus}
          >
            {t.save}
          </Button>,
        ]}
        width={560}
      >
        {/* ── Nationality-assigned statuses with active toggle ── */}
        {activeContract &&
          (() => {
            const assignedNatStatuses = getNatAssignedStatuses(activeContract.nationalityId);
            return assignedNatStatuses.length > 0 ? (
              <div className={styles.assignedStatusesBox}>
                <p className={styles.assignedStatusesLabel}>
                  {isAr
                    ? 'حالات المتابعة المخصصة لهذه الجنسية'
                    : 'Assigned follow-up statuses for this nationality'}
                </p>
                {assignedNatStatuses.map((ns) => {
                  const ps = Array.isArray(parentStatuses)
                    ? parentStatuses.find((p) => p.id === ns.followUpStatusId)
                    : null;
                  return (
                    <div key={ns.id} className={styles.assignedStatusRow}>
                      <span
                        className={
                          ns.isActive
                            ? styles.assignedStatusName
                            : styles.assignedStatusNameInactive
                        }
                      >
                        {ps
                          ? isAr
                            ? ps.nameAr || ps.nameEn
                            : ps.nameEn || ps.nameAr
                          : `#${ns.followUpStatusId}`}
                      </span>
                      <Switch
                        size="small"
                        checked={!!ns.isActive}
                        onChange={() => toggleNatStatusActive.mutate(ns.id)}
                        loading={toggleNatStatusActive.isPending}
                      />
                    </div>
                  );
                })}
              </div>
            ) : null;
          })()}

        <Form layout="vertical">
          {/* Parent Status — filtered to nationality-assigned ones */}
          <Form.Item label={t.selectStatus} required>
            <Select
              value={selectedParentId}
              onChange={(v) => {
                setSelectedParentId(v);
                setSelectedSubId(null);
              }}
              placeholder={t.selectStatus}
              style={{ width: '100%' }}
              options={getFilteredParentStatuses(activeContract?.nationalityId).map((s) => ({
                value: s.id,
                label: isAr ? s.nameAr || s.nameEn : s.nameEn || s.nameAr,
                disabled: !(
                  getNatAssignedStatuses(activeContract?.nationalityId).find(
                    (ns) => ns.followUpStatusId === s.id
                  )?.isActive ?? true
                ),
              }))}
            />
          </Form.Item>

          {/* Sub Status */}
          <Form.Item label={t.selectSubStatus} required>
            <Select
              value={selectedSubId}
              onChange={setSelectedSubId}
              placeholder={t.selectSubStatus}
              style={{ width: '100%' }}
              loading={subLoading}
              disabled={!selectedParentId}
              options={
                Array.isArray(subStatuses)
                  ? subStatuses.map((s) => ({
                      value: s.id,
                      label: isAr
                        ? s.nameStatusAr || s.nameStatusEn
                        : s.nameStatusEn || s.nameStatusAr,
                    }))
                  : []
              }
            />
          </Form.Item>

          {/* Date */}
          <Form.Item label={t.date} required>
            <DatePicker
              value={statusDate}
              onChange={setStatusDate}
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
            />
          </Form.Item>

          {/* Notes */}
          <Form.Item label={t.notes}>
            <Input.TextArea
              rows={3}
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              placeholder={t.notes}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ─── Details Modal ─── */}
      <Modal
        title={detailsContract ? `${t.contractNumber}: #${detailsContract.id}` : t.viewDetails}
        open={detailsModalOpen}
        onCancel={() => {
          setDetailsModalOpen(false);
          setDetailsContract(null);
        }}
        footer={
          <Button type="primary" onClick={() => setDetailsModalOpen(false)}>
            {t.close}
          </Button>
        }
        width={750}
      >
        {detailsContract && (
          <div className={styles.detailsModal}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <div className={styles.modalSection}>
                  <h4>{t.customer}</h4>
                  <p className={styles.modalValue}>
                    {isAr
                      ? detailsContract.customerNameAr || detailsContract.customerName
                      : detailsContract.customerName || detailsContract.customerNameAr}
                  </p>
                </div>
              </Col>
              <Col span={12}>
                <div className={styles.modalSection}>
                  <h4>{t.phone}</h4>
                  <p className={styles.modalValue} dir="ltr">
                    {detailsContract.customerPhone || '—'}
                  </p>
                </div>
              </Col>
              <Col span={12}>
                <div className={styles.modalSection}>
                  <h4>{t.visa}</h4>
                  <p className={styles.modalValue}>{detailsContract.visaNumber || '—'}</p>
                </div>
              </Col>
              <Col span={12}>
                <div className={styles.modalSection}>
                  <h4>{t.nationality}</h4>
                  <p className={styles.modalValue}>{getNationalityName(detailsContract)}</p>
                </div>
              </Col>
              <Col span={12}>
                <div className={styles.modalSection}>
                  <h4>{t.agent}</h4>
                  <p className={styles.modalValue}>{detailsContract.agentName || '—'}</p>
                </div>
              </Col>
              <Col span={12}>
                <div className={styles.modalSection}>
                  <h4>{t.musaned}</h4>
                  <p className={styles.modalValue}>
                    {detailsContract.musanedContractNumber || '—'}
                  </p>
                </div>
              </Col>
              <Col span={12}>
                <div className={styles.modalSection}>
                  <h4>{t.createdAt}</h4>
                  <p className={styles.modalValue}>
                    {detailsContract.createdAt
                      ? dayjs(detailsContract.createdAt).format('YYYY-MM-DD')
                      : '—'}
                  </p>
                </div>
              </Col>
            </Row>

            {/* Follow-Up History */}
            <div className={styles.followUpHistorySection}>
              <h4 className={styles.followUpHistoryTitle}>{t.followUpHistory}</h4>
              {Array.isArray(contractFollowUps) && contractFollowUps.length > 0 ? (
                <div className={styles.followUpHistoryList}>
                  {contractFollowUps.map((fu) => (
                    <Card key={fu.id} size="small" style={{ marginBlockEnd: 8, borderRadius: 8 }}>
                      <Row gutter={8}>
                        <Col span={8}>
                          <Tag color="blue">
                            {isAr
                              ? fu.followUpStatusNameAr || fu.followUpStatusNameEn
                              : fu.followUpStatusNameEn || fu.followUpStatusNameAr}
                          </Tag>
                        </Col>
                        <Col span={8}>
                          <Tag color="green">
                            {isAr
                              ? fu.subStatusNameAr || fu.subStatusNameEn
                              : fu.subStatusNameEn || fu.subStatusNameAr}
                          </Tag>
                        </Col>
                        <Col span={8} style={{ textAlign: 'end', fontSize: 12, color: '#8c8c8c' }}>
                          {fu.examinationDate
                            ? dayjs(fu.examinationDate).format('YYYY-MM-DD')
                            : '—'}
                        </Col>
                      </Row>
                      {fu.notes && <p className={styles.followUpNotes}>{fu.notes}</p>}
                      {fu.createdByName && (
                        <p className={styles.followUpCreatedBy}>{fu.createdByName}</p>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={isAr ? 'لا توجد متابعات' : 'No follow-ups yet'}
                />
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
