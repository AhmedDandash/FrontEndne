'use client';

import React, { useState, useMemo } from 'react';
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
  Form,
  Divider,
  Descriptions,
  Alert,
  Pagination,
} from 'antd';
import {
  FileAddOutlined,
  SearchOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  PhoneOutlined,
  GlobalOutlined,
  ReloadOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  MessageOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import styles from './MediationRequests.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type RequestStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'completed';

interface MediationRequest {
  id: number;
  customerName: string;
  customerNameAr: string;
  customerPhone: string;
  workerType: string;
  workerTypeAr: string;
  nationality: string;
  nationalityAr: string;
  proposedSalary: number;
  contractDurationMonths: number;
  status: RequestStatus;
  requestDate: string;
  notes: string | null;
  assignedTo: string | null;
  city: string;
  cityAr: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_REQUESTS: MediationRequest[] = [
  {
    id: 1001,
    customerName: 'Abdullah Al-Qahtani',
    customerNameAr: 'عبدالله القحطاني',
    customerPhone: '0501234567',
    workerType: 'Housemaid',
    workerTypeAr: 'عاملة منزلية',
    nationality: 'Philippines',
    nationalityAr: 'فلبينية',
    proposedSalary: 1200,
    contractDurationMonths: 24,
    status: 'pending',
    requestDate: '2026-05-01T09:00:00',
    notes: 'يُفضَّل ذات خبرة في الطبخ',
    assignedTo: null,
    city: 'Riyadh',
    cityAr: 'الرياض',
  },
  {
    id: 1002,
    customerName: 'Nora Al-Shammari',
    customerNameAr: 'نورة الشمري',
    customerPhone: '0559876543',
    workerType: 'Driver',
    workerTypeAr: 'سائق',
    nationality: 'Pakistan',
    nationalityAr: 'باكستانية',
    proposedSalary: 1500,
    contractDurationMonths: 12,
    status: 'reviewing',
    requestDate: '2026-04-28T11:30:00',
    notes: null,
    assignedTo: 'أحمد المنصور',
    city: 'Jeddah',
    cityAr: 'جدة',
  },
  {
    id: 1003,
    customerName: 'Khalid Al-Otaibi',
    customerNameAr: 'خالد العتيبي',
    customerPhone: '0534561234',
    workerType: 'Housemaid',
    workerTypeAr: 'عاملة منزلية',
    nationality: 'Indonesia',
    nationalityAr: 'إندونيسية',
    proposedSalary: 1100,
    contractDurationMonths: 24,
    status: 'approved',
    requestDate: '2026-04-20T14:00:00',
    notes: 'تم الموافقة وجاري إجراءات العقد',
    assignedTo: 'سارة الزهراني',
    city: 'Dammam',
    cityAr: 'الدمام',
  },
  {
    id: 1004,
    customerName: 'Fatima Al-Ghamdi',
    customerNameAr: 'فاطمة الغامدي',
    customerPhone: '0502345678',
    workerType: 'Nanny',
    workerTypeAr: 'مربية أطفال',
    nationality: 'Ethiopia',
    nationalityAr: 'إثيوبية',
    proposedSalary: 900,
    contractDurationMonths: 12,
    status: 'rejected',
    requestDate: '2026-04-15T10:00:00',
    notes: 'لم تتوفر العمالة المطلوبة في الوقت الحالي',
    assignedTo: 'أحمد المنصور',
    city: 'Mecca',
    cityAr: 'مكة المكرمة',
  },
  {
    id: 1005,
    customerName: 'Mohammed Al-Dosari',
    customerNameAr: 'محمد الدوسري',
    customerPhone: '0561234567',
    workerType: 'Cook',
    workerTypeAr: 'طباخ',
    nationality: 'India',
    nationalityAr: 'هندية',
    proposedSalary: 1800,
    contractDurationMonths: 24,
    status: 'completed',
    requestDate: '2026-03-10T08:00:00',
    notes: 'تم إتمام العقد بنجاح',
    assignedTo: 'سارة الزهراني',
    city: 'Riyadh',
    cityAr: 'الرياض',
  },
  {
    id: 1006,
    customerName: 'Sara Al-Harbi',
    customerNameAr: 'سارة الحربي',
    customerPhone: '0573456789',
    workerType: 'Housemaid',
    workerTypeAr: 'عاملة منزلية',
    nationality: 'Sri Lanka',
    nationalityAr: 'سريلانكية',
    proposedSalary: 1000,
    contractDurationMonths: 24,
    status: 'pending',
    requestDate: '2026-05-05T13:00:00',
    notes: null,
    assignedTo: null,
    city: 'Tabuk',
    cityAr: 'تبوك',
  },
  {
    id: 1007,
    customerName: 'Ibrahim Al-Subaie',
    customerNameAr: 'إبراهيم السبيعي',
    customerPhone: '0545678901',
    workerType: 'Driver',
    workerTypeAr: 'سائق',
    nationality: 'Bangladesh',
    nationalityAr: 'بنغلاديشية',
    proposedSalary: 1300,
    contractDurationMonths: 12,
    status: 'reviewing',
    requestDate: '2026-05-08T09:30:00',
    notes: 'يحتاج رخصة قيادة سعودية',
    assignedTo: 'أحمد المنصور',
    city: 'Khobar',
    cityAr: 'الخبر',
  },
  {
    id: 1008,
    customerName: 'Mona Al-Rashidi',
    customerNameAr: 'منى الرشيدي',
    customerPhone: '0516789012',
    workerType: 'Nanny',
    workerTypeAr: 'مربية أطفال',
    nationality: 'Philippines',
    nationalityAr: 'فلبينية',
    proposedSalary: 1400,
    contractDurationMonths: 24,
    status: 'approved',
    requestDate: '2026-04-25T16:00:00',
    notes: 'لديها خبرة مع أطفال دون سن المدرسة',
    assignedTo: 'سارة الزهراني',
    city: 'Medina',
    cityAr: 'المدينة المنورة',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function MediationRequestsPage() {
  const language = useAuthStore((state) => state.language);

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MediationRequest | null>(null);

  const [noteForm] = Form.useForm();

  // ── Translations ──────────────────────────────────────────────────────────

  const t = {
    pageTitle: language === 'ar' ? 'طلبات عقود التوسط' : 'Mediation Contract Requests',
    pageSubtitle: language === 'ar' ? 'إدارة جميع طلبات عقود التوسط الواردة' : 'Manage all incoming mediation contract requests',
    totalRequests: language === 'ar' ? 'إجمالي الطلبات' : 'Total Requests',
    pendingRequests: language === 'ar' ? 'قيد الانتظار' : 'Pending',
    approvedRequests: language === 'ar' ? 'موافق عليها' : 'Approved',
    rejectedRequests: language === 'ar' ? 'مرفوضة' : 'Rejected',
    search: language === 'ar' ? 'بحث باسم العميل أو رقم الطلب...' : 'Search by customer name or request number...',
    allStatuses: language === 'ar' ? 'جميع الحالات' : 'All Statuses',
    refresh: language === 'ar' ? 'تحديث' : 'Refresh',
    requestDetails: language === 'ar' ? 'تفاصيل الطلب' : 'Request Details',
    approve: language === 'ar' ? 'موافقة' : 'Approve',
    reject: language === 'ar' ? 'رفض' : 'Reject',
    addNote: language === 'ar' ? 'إضافة ملاحظة' : 'Add Note',
    viewDetails: language === 'ar' ? 'عرض التفاصيل' : 'View Details',
    close: language === 'ar' ? 'إغلاق' : 'Close',
    save: language === 'ar' ? 'حفظ' : 'Save',
    cancel: language === 'ar' ? 'إلغاء' : 'Cancel',
    noResults: language === 'ar' ? 'لا توجد نتائج' : 'No results found',
    customerInfo: language === 'ar' ? 'بيانات العميل' : 'Customer Info',
    requestInfo: language === 'ar' ? 'بيانات الطلب' : 'Request Info',
    workerType: language === 'ar' ? 'نوع العامل' : 'Worker Type',
    nationality: language === 'ar' ? 'الجنسية المفضلة' : 'Preferred Nationality',
    salary: language === 'ar' ? 'الراتب المقترح' : 'Proposed Salary',
    duration: language === 'ar' ? 'مدة العقد' : 'Contract Duration',
    months: language === 'ar' ? 'شهر' : 'months',
    city: language === 'ar' ? 'المدينة' : 'City',
    requestDate: language === 'ar' ? 'تاريخ الطلب' : 'Request Date',
    assignedTo: language === 'ar' ? 'مسؤول المتابعة' : 'Assigned To',
    notes: language === 'ar' ? 'الملاحظات' : 'Notes',
    noteText: language === 'ar' ? 'نص الملاحظة' : 'Note Text',
    notePlaceholder: language === 'ar' ? 'أدخل ملاحظتك هنا...' : 'Enter your note here...',
    status: language === 'ar' ? 'الحالة' : 'Status',
    showing: language === 'ar' ? 'عرض' : 'Showing',
    of: language === 'ar' ? 'من' : 'of',
    requests: language === 'ar' ? 'طلب' : 'requests',
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const STATUS_CONFIG: Record<RequestStatus, { color: 'processing' | 'warning' | 'success' | 'error' | 'default'; labelAr: string; labelEn: string; tagColor: string }> = {
    pending: { color: 'warning', labelAr: 'قيد الانتظار', labelEn: 'Pending', tagColor: 'orange' },
    reviewing: { color: 'processing', labelAr: 'قيد المراجعة', labelEn: 'Under Review', tagColor: 'blue' },
    approved: { color: 'success', labelAr: 'موافق عليه', labelEn: 'Approved', tagColor: 'green' },
    rejected: { color: 'error', labelAr: 'مرفوض', labelEn: 'Rejected', tagColor: 'red' },
    completed: { color: 'default', labelAr: 'مكتمل', labelEn: 'Completed', tagColor: 'cyan' },
  };

  const getStatusLabel = (status: RequestStatus) => {
    const cfg = STATUS_CONFIG[status];
    return language === 'ar' ? cfg.labelAr : cfg.labelEn;
  };

  const STATUS_OPTIONS = [
    { value: 'all', label: t.allStatuses },
    { value: 'pending', label: language === 'ar' ? 'قيد الانتظار' : 'Pending' },
    { value: 'reviewing', label: language === 'ar' ? 'قيد المراجعة' : 'Under Review' },
    { value: 'approved', label: language === 'ar' ? 'موافق عليه' : 'Approved' },
    { value: 'rejected', label: language === 'ar' ? 'مرفوض' : 'Rejected' },
    { value: 'completed', label: language === 'ar' ? 'مكتمل' : 'Completed' },
  ];

  // ── Derived data ──────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return MOCK_REQUESTS.filter((r) => {
      const searchLower = searchText.toLowerCase();
      const matchesSearch =
        !searchText ||
        String(r.id).includes(searchText) ||
        r.customerName.toLowerCase().includes(searchLower) ||
        r.customerNameAr.includes(searchText);
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchText, statusFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const stats = useMemo(() => ({
    total: MOCK_REQUESTS.length,
    pending: MOCK_REQUESTS.filter((r) => r.status === 'pending' || r.status === 'reviewing').length,
    approved: MOCK_REQUESTS.filter((r) => r.status === 'approved').length,
    rejected: MOCK_REQUESTS.filter((r) => r.status === 'rejected').length,
  }), []);

  // ── Card renderer ─────────────────────────────────────────────────────────

  const renderCard = (req: MediationRequest) => {
    const statusCfg = STATUS_CONFIG[req.status];
    const customerDisplay = language === 'ar' ? req.customerNameAr : req.customerName;
    const workerTypeDisplay = language === 'ar' ? req.workerTypeAr : req.workerType;
    const nationalityDisplay = language === 'ar' ? req.nationalityAr : req.nationality;
    const cityDisplay = language === 'ar' ? req.cityAr : req.city;

    return (
      <Col xs={24} key={req.id}>
        <Card className={styles.requestCard} hoverable>
          <div className={styles.cardContent}>
            {/* Left Section */}
            <div className={styles.cardLeft}>
              <div className={styles.cardHeader}>
                <div className={styles.requestNumber}>
                  <FileAddOutlined className={styles.requestIcon} />
                  <span>#{req.id}</span>
                </div>
                <Tag color={statusCfg.tagColor} style={{ fontWeight: 600 }}>
                  {getStatusLabel(req.status)}
                </Tag>
              </div>

              <div className={styles.tagsSection}>
                <Tag color="blue" className={styles.workerTypeTag} style={{ color: '#003366', borderColor: '#003366', background: '#e8f0f8' }}>
                  {workerTypeDisplay}
                </Tag>
                <Badge
                  status={statusCfg.color}
                  text={getStatusLabel(req.status)}
                />
              </div>

              <div className={styles.customerSection}>
                <Avatar size={44} icon={<UserOutlined />} className={styles.customerAvatar} />
                <div className={styles.customerDetails}>
                  <span className={styles.customerName}>{customerDisplay}</span>
                  <div className={styles.customerMeta}>
                    <PhoneOutlined />
                    <span dir="ltr">{req.customerPhone}</span>
                  </div>
                </div>
              </div>

              <div className={styles.detailsSection}>
                <div className={styles.detailItem}>
                  <GlobalOutlined className={styles.detailIcon} />
                  <div className={styles.detailText}>
                    <span className={styles.detailLabel}>{t.nationality}</span>
                    <span className={styles.detailValue}>{nationalityDisplay}</span>
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <CalendarOutlined className={styles.detailIcon} />
                  <div className={styles.detailText}>
                    <span className={styles.detailLabel}>{t.duration}</span>
                    <span className={styles.detailValue}>{req.contractDurationMonths} {t.months}</span>
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <ExclamationCircleOutlined className={styles.detailIcon} />
                  <div className={styles.detailText}>
                    <span className={styles.detailLabel}>{t.city}</span>
                    <span className={styles.detailValue}>{cityDisplay}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className={styles.cardRight}>
              <div className={styles.salaryBanner}>
                <div className={styles.salaryMeta}>
                  <DollarOutlined className={styles.salaryIcon} />
                  <span className={styles.salaryLabel}>{t.salary}</span>
                </div>
                <div className={styles.salaryAmount}>{formatCurrency(req.proposedSalary)}</div>
              </div>

              <div className={styles.requestDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailDot} style={{ background: '#003366' }} />
                  <span className={styles.detailRowLabel}>{t.requestDate}</span>
                  <span className={styles.detailRowValue} style={{ color: '#003366' }}>
                    {formatDate(req.requestDate)}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailDot} style={{ background: '#1890ff' }} />
                  <span className={styles.detailRowLabel}>{t.assignedTo}</span>
                  <span className={styles.detailRowValue} style={{ color: '#1890ff' }}>
                    {req.assignedTo || (language === 'ar' ? 'غير محدد' : 'Unassigned')}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailDot} style={{ background: '#faad14' }} />
                  <span className={styles.detailRowLabel}>{t.duration}</span>
                  <span className={styles.detailRowValue} style={{ color: '#faad14' }}>
                    {req.contractDurationMonths} {t.months}
                  </span>
                </div>
              </div>

              <div className={styles.datesSection}>
                <div className={styles.dateItem}>
                  <CalendarOutlined />
                  <span>{formatDate(req.requestDate)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className={styles.cardBottom}>
            <div className={styles.actionsList}>
              <Button
                type="link"
                icon={<EyeOutlined />}
                className={styles.actionBtn}
                block
                onClick={() => { setSelectedRequest(req); setShowDetailsModal(true); }}
              >
                {t.viewDetails}
              </Button>
              <Button
                type="link"
                icon={<CheckOutlined />}
                className={[styles.actionBtn, styles.successBtn].join(' ')}
                block
                disabled={req.status === 'approved' || req.status === 'completed' || req.status === 'rejected'}
              >
                {t.approve}
              </Button>
              <Button
                type="link"
                icon={<CloseOutlined />}
                className={[styles.actionBtn, styles.dangerBtn].join(' ')}
                block
                disabled={req.status === 'rejected' || req.status === 'completed'}
              >
                {t.reject}
              </Button>
              <Button
                type="link"
                icon={<MessageOutlined />}
                className={styles.actionBtn}
                block
                onClick={() => { setSelectedRequest(req); noteForm.resetFields(); setShowNoteModal(true); }}
              >
                {t.addNote}
              </Button>
            </div>
          </div>
        </Card>
      </Col>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.requestsPage}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerTitle}>
            <FileAddOutlined className={styles.headerIcon} />
            <div>
              <h1>{t.pageTitle}</h1>
              <p className={styles.headerSubtitle}>{t.pageSubtitle}</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button icon={<ReloadOutlined />} className={styles.secondaryBtn}>
              {t.refresh}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} className={styles.statisticsRow}>
        <Col xs={12} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={t.totalRequests}
              value={stats.total}
              prefix={<FileAddOutlined style={{ color: '#003366' }} />}
              valueStyle={{ color: '#003366' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={t.pendingRequests}
              value={stats.pending}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={t.approvedRequests}
              value={stats.approved}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={t.rejectedRequests}
              value={stats.rejected}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className={styles.filterCard}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={14}>
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
          <Col xs={24} sm={10} md={6}>
            <Select
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}
              style={{ width: '100%' }}
              size="large"
              options={STATUS_OPTIONS}
            />
          </Col>
        </Row>
      </Card>

      {/* Count */}
      <div className={styles.resultsInfo}>
        <span>
          {t.showing} {paginated.length} {t.of} {filtered.length} {t.requests}
        </span>
      </div>

      {/* List */}
      {paginated.length > 0 ? (
        <Row gutter={[16, 16]} className={styles.requestsGrid}>
          {paginated.map(renderCard)}
        </Row>
      ) : (
        <Card className={styles.emptyCard}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t.noResults} />
        </Card>
      )}

      {/* Pagination */}
      {filtered.length > pageSize && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24, marginBottom: 8 }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={filtered.length}
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

      {/* ── Details Modal ── */}
      <Modal
        title={
          <span>
            {t.requestDetails}
            {selectedRequest && ` — #${selectedRequest.id}`}
            {selectedRequest && (
              <Tag
                color={STATUS_CONFIG[selectedRequest.status].tagColor}
                style={{ marginInlineStart: 12, fontWeight: 600 }}
              >
                {getStatusLabel(selectedRequest.status)}
              </Tag>
            )}
          </span>
        }
        open={showDetailsModal}
        onCancel={() => { setShowDetailsModal(false); setSelectedRequest(null); }}
        footer={
          <Button type="primary" onClick={() => { setShowDetailsModal(false); setSelectedRequest(null); }}>
            {t.close}
          </Button>
        }
        width={700}
        styles={{ body: { maxHeight: '65vh', overflowY: 'auto' } }}
      >
        {selectedRequest && (
          <div className={styles.detailsModal}>
            <Divider titlePlacement="left" style={{ fontSize: 13, color: '#8c8c8c' }}>
              {t.customerInfo}
            </Divider>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label={language === 'ar' ? 'اسم العميل' : 'Customer Name'}>
                {language === 'ar' ? selectedRequest.customerNameAr : selectedRequest.customerName}
              </Descriptions.Item>
              <Descriptions.Item label={language === 'ar' ? 'رقم الجوال' : 'Phone'}>
                <span dir="ltr">{selectedRequest.customerPhone}</span>
              </Descriptions.Item>
              <Descriptions.Item label={t.city}>
                {language === 'ar' ? selectedRequest.cityAr : selectedRequest.city}
              </Descriptions.Item>
            </Descriptions>

            <Divider titlePlacement="left" style={{ fontSize: 13, color: '#8c8c8c', marginBlockStart: 20 }}>
              {t.requestInfo}
            </Divider>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label={t.workerType}>
                {language === 'ar' ? selectedRequest.workerTypeAr : selectedRequest.workerType}
              </Descriptions.Item>
              <Descriptions.Item label={t.nationality}>
                {language === 'ar' ? selectedRequest.nationalityAr : selectedRequest.nationality}
              </Descriptions.Item>
              <Descriptions.Item label={t.salary}>
                <span style={{ color: '#003366', fontWeight: 700 }}>
                  {formatCurrency(selectedRequest.proposedSalary)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label={t.duration}>
                {selectedRequest.contractDurationMonths} {t.months}
              </Descriptions.Item>
              <Descriptions.Item label={t.requestDate}>
                {formatDate(selectedRequest.requestDate)}
              </Descriptions.Item>
              <Descriptions.Item label={t.assignedTo}>
                {selectedRequest.assignedTo || (language === 'ar' ? 'غير محدد' : 'Unassigned')}
              </Descriptions.Item>
              <Descriptions.Item label={t.status} span={2}>
                <Badge
                  status={STATUS_CONFIG[selectedRequest.status].color}
                  text={getStatusLabel(selectedRequest.status)}
                />
              </Descriptions.Item>
            </Descriptions>

            {selectedRequest.notes && (
              <>
                <Divider titlePlacement="left" style={{ fontSize: 13, color: '#8c8c8c', marginBlockStart: 20 }}>
                  {t.notes}
                </Divider>
                <Alert type="info" showIcon message={selectedRequest.notes} />
              </>
            )}
          </div>
        )}
      </Modal>

      {/* ── Add Note Modal ── */}
      <Modal
        title={
          <span>
            <MessageOutlined style={{ marginInlineEnd: 8, color: '#003366' }} />
            {t.addNote}
            {selectedRequest && ` — #${selectedRequest.id}`}
          </span>
        }
        open={showNoteModal}
        onCancel={() => { setShowNoteModal(false); noteForm.resetFields(); }}
        onOk={() => { setShowNoteModal(false); noteForm.resetFields(); }}
        okText={t.save}
        cancelText={t.cancel}
      >
        <Form form={noteForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="note"
            label={t.noteText}
            rules={[{ required: true, message: language === 'ar' ? 'مطلوب' : 'Required' }]}
          >
            <Input.TextArea rows={4} placeholder={t.notePlaceholder} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
