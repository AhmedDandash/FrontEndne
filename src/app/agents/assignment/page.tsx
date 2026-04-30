'use client';

import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Select,
  Tag,
  Space,
  Empty,
  Pagination,
  Statistic,
  Badge,
  Avatar,
  Timeline,
} from 'antd';
import {
  FilterOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  GlobalOutlined,
  FileTextOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { NATIONALITIES } from '@/constants/enums';
import styles from './Assignment.module.css';

interface AssignmentRequest {
  id: number;
  agentName: string;
  agentNameAr: string;
  nationality: string;
  nationalityAr: string;
  contractNumber: string;
  customerName: string;
  customerNameAr: string;
  requestDate: string;
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  notes: string;
}

export default function AgentAssignmentPage() {
  const language = useAuthStore((state) => state.language);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedNationality, setSelectedNationality] = useState<string>('0');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showFilters, setShowFilters] = useState(true);

  const agents = [
    {
      value: 'cb012943',
      label: 'AL ARHAM HR SERVICES PVT LTD',
      labelAr: 'خدمات الموارد البشرية الرحم',
    },
    {
      value: '97c85584',
      label: 'TOP NOTCH RECRUITMENT SERVICES',
      labelAr: 'خدمات التوظيف من الدرجة الأولى',
    },
    { value: 'd4072d82', label: 'المصريه الدوليه', labelAr: 'المصريه الدوليه' },
    {
      value: 'cdb1e109',
      label: 'ALHABESHI INTERNATIONAL SERVICES',
      labelAr: 'الحبشي للخدمات الدولية',
    },
    { value: 'a219da74', label: 'MARAFE INTL MANPOWER SERVICES', labelAr: 'مرافي للخدمات' },
  ];

  const nationalities = NATIONALITIES.map((n) => ({
    value: String(n.value),
    label: n.labelEn,
    labelAr: n.labelAr,
  }));

  // Mock data for assignments
  const allAssignments: AssignmentRequest[] = Array.from({ length: 56 }, (_, i) => ({
    id: i + 1,
    agentName: agents[i % agents.length].label,
    agentNameAr: agents[i % agents.length].labelAr,
    nationality: nationalities[i % nationalities.length].label,
    nationalityAr: nationalities[i % nationalities.length].labelAr,
    contractNumber: `CT-2024-${1000 + i}`,
    customerName: `Customer ${i + 1}`,
    customerNameAr: `عميل ${i + 1}`,
    requestDate: new Date(2024, 0, 1 + i).toISOString().split('T')[0],
    status: ['pending', 'in-progress', 'completed', 'rejected'][i % 4] as any,
    priority: ['low', 'medium', 'high'][i % 3] as any,
    notes: `Assignment request notes ${i + 1}`,
  }));

  const t = (key: string) => {
    const translations: { [key: string]: { ar: string; en: string } } = {
      pageTitle: { ar: 'طلبات تعيين الوكلاء', en: 'Agent Assignment Requests' },
      filters: { ar: 'الفلاتر', en: 'Filters' },
      agentName: { ar: 'اسم الوكيل', en: 'Agent Name' },
      nationality: { ar: 'الجنسية', en: 'Nationality' },
      all: { ar: 'الكل', en: 'All' },
      choose: { ar: 'اختر', en: 'Choose' },
      totalRequests: { ar: 'إجمالي الطلبات', en: 'Total Requests' },
      pending: { ar: 'قيد الانتظار', en: 'Pending' },
      inProgress: { ar: 'قيد التنفيذ', en: 'In Progress' },
      completed: { ar: 'مكتمل', en: 'Completed' },
      rejected: { ar: 'مرفوض', en: 'Rejected' },
      contractNumber: { ar: 'رقم العقد', en: 'Contract Number' },
      customerName: { ar: 'اسم العميل', en: 'Customer Name' },
      requestDate: { ar: 'تاريخ الطلب', en: 'Request Date' },
      status: { ar: 'الحالة', en: 'Status' },
      priority: { ar: 'الأولوية', en: 'Priority' },
      low: { ar: 'منخفضة', en: 'Low' },
      medium: { ar: 'متوسطة', en: 'Medium' },
      high: { ar: 'عالية', en: 'High' },
      notes: { ar: 'ملاحظات', en: 'Notes' },
      noRequests: { ar: 'لا توجد طلبات', en: 'No Requests Found' },
      showingResults: { ar: 'عرض النتائج', en: 'Showing Results' },
      viewDetails: { ar: 'عرض التفاصيل', en: 'View Details' },
      approve: { ar: 'موافقة', en: 'Approve' },
      reject: { ar: 'رفض', en: 'Reject' },
    };
    return translations[key]?.[language] || key;
  };

  const filteredAssignments = allAssignments.filter((assignment) => {
    const matchesAgent = !selectedAgent || assignment.agentName.includes(selectedAgent);
    const matchesNationality =
      selectedNationality === '0' ||
      nationalities.find((n) => n.value === selectedNationality)?.label === assignment.nationality;
    return matchesAgent && matchesNationality;
  });

  const paginatedAssignments = filteredAssignments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const statusCounts = {
    pending: allAssignments.filter((a) => a.status === 'pending').length,
    inProgress: allAssignments.filter((a) => a.status === 'in-progress').length,
    completed: allAssignments.filter((a) => a.status === 'completed').length,
    rejected: allAssignments.filter((a) => a.status === 'rejected').length,
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'orange',
      'in-progress': 'blue',
      completed: 'green',
      rejected: 'red',
    };
    return colors[status as keyof typeof colors];
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: <ClockCircleOutlined />,
      'in-progress': <SyncOutlined spin />,
      completed: <CheckCircleOutlined />,
      rejected: <CloseCircleOutlined />,
    };
    return icons[status as keyof typeof icons];
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: '#52c41a',
      medium: '#faad14',
      high: '#ff4d4f',
    };
    return colors[priority as keyof typeof colors];
  };

  return (
    <div className={styles.assignmentPage}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <FileTextOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('pageTitle')}</h1>
            </div>
          </div>
          <Button
            icon={<FilterOutlined />}
            onClick={() => setShowFilters(!showFilters)}
            type={showFilters ? 'primary' : 'default'}
            size="large"
          >
            {t('filters')}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <Row gutter={[24, 24]} className={styles.statsRow}>
        <Col xs={24} sm={12} md={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={t('totalRequests')}
              value={allAssignments.length}
              prefix={<FileTextOutlined style={{ color: '#00478C' }} />}
              valueStyle={{ color: '#003366', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={t('pending')}
              value={statusCounts.pending}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={t('inProgress')}
              value={statusCounts.inProgress}
              prefix={<SyncOutlined style={{ color: '#00478C' }} />}
              valueStyle={{ color: '#00478C', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={t('completed')}
              value={statusCounts.completed}
              prefix={<CheckCircleOutlined style={{ color: '#00AA64' }} />}
              valueStyle={{ color: '#00AA64', fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      {showFilters && (
        <Card className={styles.filterCard}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <label className={styles.filterLabel}>{t('agentName')}</label>
              <Select
                size="large"
                placeholder={t('choose')}
                value={selectedAgent || undefined}
                onChange={setSelectedAgent}
                style={{ width: '100%' }}
                allowClear
                showSearch
                options={agents.map((agent) => ({
                  value: agent.value,
                  label: language === 'ar' ? agent.labelAr : agent.label,
                }))}
              />
            </Col>
            <Col xs={24} md={12}>
              <label className={styles.filterLabel}>{t('nationality')}</label>
              <Select
                size="large"
                value={selectedNationality}
                onChange={setSelectedNationality}
                style={{ width: '100%' }}
                options={[
                  { value: '0', label: t('all') },
                  ...nationalities.map((n) => ({
                    value: n.value,
                    label: language === 'ar' ? n.labelAr : n.label,
                  })),
                ]}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* Assignment Requests Grid */}
      {paginatedAssignments.length > 0 ? (
        <>
          <Row gutter={[24, 24]} className={styles.assignmentsGrid}>
            {paginatedAssignments.map((assignment) => (
              <Col xs={24} lg={12} key={assignment.id}>
                <Card className={styles.assignmentCard} hoverable>
                  {/* Card Header */}
                  <div className={styles.cardHeader}>
                    <div className={styles.headerInfo}>
                      <Avatar
                        size={48}
                        icon={<UserOutlined />}
                        style={{
                          background: `linear-gradient(135deg, ${getPriorityColor(
                            assignment.priority
                          )} 0%, ${getPriorityColor(assignment.priority)}dd 100%)`,
                        }}
                      />
                      <div className={styles.headerText}>
                        <h3 className={styles.agentName}>
                          {language === 'ar' ? assignment.agentNameAr : assignment.agentName}
                        </h3>
                        <Space size={8}>
                          <Tag
                            icon={getStatusIcon(assignment.status)}
                            color={getStatusColor(assignment.status)}
                          >
                            {t(assignment.status.replace('-', ''))}
                          </Tag>
                          <Badge
                            color={getPriorityColor(assignment.priority)}
                            text={t(assignment.priority)}
                          />
                        </Space>
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className={styles.cardContent}>
                    <Timeline
                      items={[
                        {
                          dot: <FileTextOutlined style={{ fontSize: '16px' }} />,
                          children: (
                            <div className={styles.timelineItem}>
                              <span className={styles.timelineLabel}>{t('contractNumber')}</span>
                              <span className={styles.timelineValue}>
                                {assignment.contractNumber}
                              </span>
                            </div>
                          ),
                        },
                        {
                          dot: <UserOutlined style={{ fontSize: '16px' }} />,
                          children: (
                            <div className={styles.timelineItem}>
                              <span className={styles.timelineLabel}>{t('customerName')}</span>
                              <span className={styles.timelineValue}>
                                {language === 'ar'
                                  ? assignment.customerNameAr
                                  : assignment.customerName}
                              </span>
                            </div>
                          ),
                        },
                        {
                          dot: <GlobalOutlined style={{ fontSize: '16px' }} />,
                          children: (
                            <div className={styles.timelineItem}>
                              <span className={styles.timelineLabel}>{t('nationality')}</span>
                              <span className={styles.timelineValue}>
                                {language === 'ar'
                                  ? assignment.nationalityAr
                                  : assignment.nationality}
                              </span>
                            </div>
                          ),
                        },
                        {
                          dot: <CalendarOutlined style={{ fontSize: '16px' }} />,
                          children: (
                            <div className={styles.timelineItem}>
                              <span className={styles.timelineLabel}>{t('requestDate')}</span>
                              <span className={styles.timelineValue}>{assignment.requestDate}</span>
                            </div>
                          ),
                        },
                      ]}
                    />

                    {assignment.notes && (
                      <div className={styles.notesSection}>
                        <p className={styles.notesLabel}>{t('notes')}</p>
                        <p className={styles.notesText}>{assignment.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className={styles.cardFooter}>
                    <Button type="link" onClick={() => console.log('View', assignment.id)}>
                      {t('viewDetails')}
                    </Button>
                    {assignment.status === 'pending' && (
                      <>
                        <Button
                          type="link"
                          style={{ color: '#00AA64' }}
                          onClick={() => console.log('Approve', assignment.id)}
                        >
                          {t('approve')}
                        </Button>
                        <Button
                          type="link"
                          danger
                          onClick={() => console.log('Reject', assignment.id)}
                        >
                          {t('reject')}
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Pagination */}
          <div className={styles.paginationWrapper}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredAssignments.length}
              onChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }}
              showSizeChanger
              showTotal={(total) => `${t('totalRequests')}: ${total}`}
              pageSizeOptions={[10, 15, 20, 25, 50, 100]}
            />
          </div>
        </>
      ) : (
        <Card>
          <Empty description={t('noRequests')} />
        </Card>
      )}
    </div>
  );
}
