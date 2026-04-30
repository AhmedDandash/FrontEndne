'use client';

import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Select,
  Input,
  DatePicker,
  Space,
  Empty,
  Pagination,
  Statistic,
  Badge,
  Divider,
} from 'antd';
import {
  FilterOutlined,
  PlusOutlined,
  UserOutlined,
  FileDoneOutlined,
  CalendarOutlined,
  FileTextOutlined,
  IdcardOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  PrinterOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { NATIONALITIES } from '@/constants/enums';
import styles from './SponsorshipTransfer.module.css';

const { RangePicker } = DatePicker;

interface SponsorshipTransferContract {
  id: number;
  contractNumber: string;
  mediationContractNumber: string;
  customerName: string;
  customerNameAr: string;
  customerIdNumber: string;
  applicantName: string;
  applicantNameAr: string;
  applicantId: string;
  nationality: string;
  nationalityAr: string;
  creationDate: string;
  transferConfirmationDate: string;
  status: 'transferred' | 'trial-period' | 'warranty-transferred' | 'cancelled';
  branchName: string;
  branchNameAr: string;
  createdBy: string;
  createdByAr: string;
  marketer: string;
}

export default function SponsorshipTransferPage() {
  const language = useAuthStore((state) => state.language);
  const [showFilters, setShowFilters] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedStatus, setSelectedStatus] = useState<string>('0');
  const [selectedNationalities, setSelectedNationalities] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [creationDateRange, setCreationDateRange] = useState<[string, string] | null>(null);
  const [transferDateRange, setTransferDateRange] = useState<[string, string] | null>(null);

  const nationalities = NATIONALITIES.map((n) => ({
    value: String(n.value),
    label: n.labelEn,
    labelAr: n.labelAr,
  }));

  // Mock data for sponsorship transfer contracts
  const allContracts: SponsorshipTransferContract[] = Array.from({ length: 155 }, (_, i) => ({
    id: i + 1,
    contractNumber: `ST-${152 + i}`,
    mediationContractNumber: `MC-${6096 + i}`,
    customerName: `Customer ${i + 1}`,
    customerNameAr: `عميل ${i + 1}`,
    customerIdNumber: `${1000000000 + i}`,
    applicantName: `Applicant ${i + 1}`,
    applicantNameAr: `متقدم ${i + 1}`,
    applicantId: `${179382 + i}`,
    nationality: nationalities[i % nationalities.length].label,
    nationalityAr: nationalities[i % nationalities.length].labelAr,
    creationDate: new Date(2026, 0, 11 + (i % 30)).toISOString().split('T')[0],
    transferConfirmationDate: new Date(2026, 0, 15 + (i % 30)).toISOString().split('T')[0],
    status: ['transferred', 'trial-period', 'warranty-transferred', 'cancelled'][i % 4] as any,
    branchName: 'Sigma Competences Recruitment Office',
    branchNameAr: 'مكتب سيجما للتوظيف',
    createdBy: `Employee ${i + 1}`,
    createdByAr: `موظف ${i + 1}`,
    marketer: ['Google', 'Instagram', 'Twitter', 'Musaned'][i % 4],
  }));

  const t = (key: string) => {
    const translations: { [key: string]: { ar: string; en: string } } = {
      pageTitle: { ar: 'عقود نقل الكفالة', en: 'Sponsorship Transfer Contracts' },
      filters: { ar: 'الفلاتر', en: 'Filters' },
      addContract: { ar: 'إضافة عقد نقل كفالة', en: 'Add Transfer Contract' },
      contractId: { ar: 'رقم العقد', en: 'Contract ID' },
      mediationContractId: { ar: 'رقم عقد الوساطة', en: 'Mediation Contract ID' },
      customerName: { ar: 'اسم العميل', en: 'Customer Name' },
      customerIdNumber: { ar: 'رقم هوية العميل', en: 'Customer ID Number' },
      creationDate: { ar: 'تاريخ الإنشاء', en: 'Creation Date' },
      transferDate: { ar: 'تاريخ تأكيد نقل الكفالة', en: 'Transfer Confirmation Date' },
      contractStatus: { ar: 'حالة العقد', en: 'Contract Status' },
      nationality: { ar: 'الجنسية', en: 'Nationality' },
      creationDateRange: { ar: 'نطاق تاريخ الإنشاء', en: 'Creation Date Range' },
      transferDateRange: { ar: 'نطاق تاريخ النقل', en: 'Transfer Date Range' },
      marketer: { ar: 'المسوق', en: 'Marketer' },
      createdBy: { ar: 'أنشئ بواسطة', en: 'Created By' },
      search: { ar: 'بحث', en: 'Search' },
      cancel: { ar: 'إلغاء', en: 'Cancel' },
      all: { ar: 'الكل', en: 'All' },
      totalContracts: { ar: 'إجمالي العقود', en: 'Total Contracts' },
      transferred: { ar: 'تم النقل', en: 'Transferred' },
      trialPeriod: { ar: 'فترة تجريبية', en: 'Trial Period' },
      warrantyTransferred: { ar: 'نقل ضمان', en: 'Warranty Transferred' },
      cancelled: { ar: 'ملغي', en: 'Cancelled' },
      applicantName: { ar: 'اسم المتقدم', en: 'Applicant Name' },
      applicantId: { ar: 'رقم المتقدم', en: 'Applicant ID' },
      branchName: { ar: 'اسم الفرع', en: 'Branch Name' },
      viewDetails: { ar: 'عرض التفاصيل', en: 'View Details' },
      print: { ar: 'طباعة', en: 'Print' },
      showingResults: { ar: 'عرض النتائج', en: 'Showing Results' },
      noContracts: { ar: 'لا توجد عقود', en: 'No Contracts Found' },
      transferConfirmed: { ar: 'تم تأكيد النقل', en: 'Transfer Confirmed' },
    };
    return translations[key]?.[language] || key;
  };

  const filteredContracts = allContracts.filter((contract) => {
    const matchesSearch =
      searchText === '' ||
      contract.contractNumber.toLowerCase().includes(searchText.toLowerCase()) ||
      contract.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
      contract.applicantName.toLowerCase().includes(searchText.toLowerCase());

    const matchesStatus = selectedStatus === '0' || contract.status === selectedStatus;

    const matchesNationality =
      selectedNationalities.length === 0 ||
      selectedNationalities.some(
        (nat) => nationalities.find((n) => n.value === nat)?.label === contract.nationality
      );

    const matchesCreationDate =
      !creationDateRange ||
      (new Date(contract.creationDate) >= new Date(creationDateRange[0]) &&
        new Date(contract.creationDate) <= new Date(creationDateRange[1]));

    const matchesTransferDate =
      !transferDateRange ||
      (new Date(contract.transferConfirmationDate) >= new Date(transferDateRange[0]) &&
        new Date(contract.transferConfirmationDate) <= new Date(transferDateRange[1]));

    return (
      matchesSearch &&
      matchesStatus &&
      matchesNationality &&
      matchesCreationDate &&
      matchesTransferDate
    );
  });

  const paginatedContracts = filteredContracts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const statusCounts = {
    transferred: allContracts.filter((c) => c.status === 'transferred').length,
    trialPeriod: allContracts.filter((c) => c.status === 'trial-period').length,
    warrantyTransferred: allContracts.filter((c) => c.status === 'warranty-transferred').length,
    cancelled: allContracts.filter((c) => c.status === 'cancelled').length,
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      transferred: { color: 'success', icon: <CheckCircleOutlined />, text: t('transferred') },
      'trial-period': { color: 'warning', icon: <ClockCircleOutlined />, text: t('trialPeriod') },
      'warranty-transferred': {
        color: 'processing',
        icon: <FileDoneOutlined />,
        text: t('warrantyTransferred'),
      },
      cancelled: { color: 'error', icon: <CloseCircleOutlined />, text: t('cancelled') },
    };
    return configs[status as keyof typeof configs];
  };

  return (
    <div className={styles.transferPage}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <FileDoneOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('pageTitle')}</h1>
              <p style={{ display: 'none' }} className={styles.pageSubtitle}>
                {t('showingResults')}: <strong>{filteredContracts.length}</strong>
              </p>
            </div>
          </div>
          <Space>
            <Button
              icon={<FilterOutlined />}
              onClick={() => setShowFilters(!showFilters)}
              type={showFilters ? 'primary' : 'default'}
              size="large"
            >
              {t('filters')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} size="large">
              {t('addContract')}
            </Button>
          </Space>
        </div>
      </div>

      {/* Stats Overview */}
      <Row gutter={[24, 24]} className={styles.statsRow}>
        <Col xs={24} sm={12} md={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={t('totalContracts')}
              value={allContracts.length}
              prefix={<FileTextOutlined style={{ color: '#00478C' }} />}
              valueStyle={{ color: '#003366', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={t('transferred')}
              value={statusCounts.transferred}
              prefix={<CheckCircleOutlined style={{ color: '#00AA64' }} />}
              valueStyle={{ color: '#00AA64', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={t('trialPeriod')}
              value={statusCounts.trialPeriod}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={t('cancelled')}
              value={statusCounts.cancelled}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f', fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      {showFilters && (
        <Card className={styles.filterCard}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <label className={styles.filterLabel}>{t('search')}</label>
              <Input
                size="large"
                placeholder={`${t('contractId')}, ${t('customerName')}, ${t('applicantName')}`}
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} md={8}>
              <label className={styles.filterLabel}>{t('contractStatus')}</label>
              <Select
                size="large"
                value={selectedStatus}
                onChange={setSelectedStatus}
                style={{ width: '100%' }}
                options={[
                  { value: '0', label: t('all') },
                  { value: 'transferred', label: t('transferred') },
                  { value: 'trial-period', label: t('trialPeriod') },
                  { value: 'warranty-transferred', label: t('warrantyTransferred') },
                  { value: 'cancelled', label: t('cancelled') },
                ]}
              />
            </Col>
            <Col xs={24} md={8}>
              <label className={styles.filterLabel}>{t('nationality')}</label>
              <Select
                mode="multiple"
                size="large"
                placeholder={t('all')}
                value={selectedNationalities}
                onChange={setSelectedNationalities}
                style={{ width: '100%' }}
                options={nationalities.map((n) => ({
                  value: n.value,
                  label: language === 'ar' ? n.labelAr : n.label,
                }))}
                maxTagCount="responsive"
              />
            </Col>
            <Col xs={24} md={12}>
              <label className={styles.filterLabel}>{t('creationDateRange')}</label>
              <RangePicker
                size="large"
                style={{ width: '100%' }}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setCreationDateRange([
                      dates[0].format('YYYY-MM-DD'),
                      dates[1].format('YYYY-MM-DD'),
                    ]);
                  } else {
                    setCreationDateRange(null);
                  }
                }}
                placeholder={[t('creationDate'), t('creationDate')]}
              />
            </Col>
            <Col xs={24} md={12}>
              <label className={styles.filterLabel}>{t('transferDateRange')}</label>
              <RangePicker
                size="large"
                style={{ width: '100%' }}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setTransferDateRange([
                      dates[0].format('YYYY-MM-DD'),
                      dates[1].format('YYYY-MM-DD'),
                    ]);
                  } else {
                    setTransferDateRange(null);
                  }
                }}
                placeholder={[t('transferDate'), t('transferDate')]}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* Contracts Grid */}
      {paginatedContracts.length > 0 ? (
        <>
          <Row gutter={[24, 24]} className={styles.contractsGrid}>
            {paginatedContracts.map((contract) => {
              const statusConfig = getStatusConfig(contract.status);
              return (
                <Col xs={24} key={contract.id}>
                  <Card className={styles.contractCard} hoverable>
                    {/* Status Banner */}
                    {contract.status === 'transferred' && (
                      <div className={styles.statusBanner}>
                        <CheckCircleOutlined /> {t('transferConfirmed')}:{' '}
                        {contract.transferConfirmationDate}
                      </div>
                    )}

                    <Row gutter={[24, 16]}>
                      {/* Contract Number Section */}
                      <Col xs={24} sm={8} md={4}>
                        <div className={styles.contractNumber}>
                          <div className={styles.numberBadge}>
                            <span className={styles.sequenceNumber}>{contract.contractNumber}</span>
                            <h2 className={styles.mainNumber}>{contract.id}</h2>
                            <span className={styles.dateText}>{contract.creationDate}</span>
                          </div>
                        </div>
                      </Col>

                      {/* Customer Info */}
                      <Col xs={24} sm={16} md={6}>
                        <div className={styles.infoSection}>
                          <div className={styles.infoHeader}>
                            <UserOutlined className={styles.infoIcon} />
                            <span className={styles.infoLabel}>{t('customerName')}</span>
                          </div>
                          <h4 className={styles.infoValue}>
                            {language === 'ar' ? contract.customerNameAr : contract.customerName}
                          </h4>
                          <div className={styles.subInfo}>
                            <IdcardOutlined style={{ fontSize: '12px' }} />
                            <span>{contract.customerIdNumber}</span>
                          </div>
                          <div className={styles.contractLink}>
                            <FileTextOutlined style={{ fontSize: '12px' }} />
                            <span>
                              {t('mediationContractId')}: {contract.mediationContractNumber}
                            </span>
                          </div>
                        </div>
                      </Col>

                      {/* Applicant Info */}
                      <Col xs={24} sm={12} md={5}>
                        <div className={styles.infoSection}>
                          <div className={styles.infoHeader}>
                            <UserOutlined className={styles.infoIcon} />
                            <span className={styles.infoLabel}>{t('applicantName')}</span>
                          </div>
                          <h4 className={styles.infoValue}>
                            {language === 'ar' ? contract.applicantNameAr : contract.applicantName}
                          </h4>
                          <div className={styles.subInfo}>
                            <IdcardOutlined style={{ fontSize: '12px' }} />
                            <span>
                              {t('applicantId')}: {contract.applicantId}
                            </span>
                          </div>
                        </div>
                      </Col>

                      {/* Additional Info */}
                      <Col xs={24} sm={12} md={5}>
                        <div className={styles.infoSection}>
                          <div className={styles.additionalInfo}>
                            <div className={styles.infoRow}>
                              <GlobalOutlined />
                              <span>
                                {language === 'ar' ? contract.nationalityAr : contract.nationality}
                              </span>
                            </div>
                            <div className={styles.infoRow}>
                              <CalendarOutlined />
                              <span>{contract.transferConfirmationDate}</span>
                            </div>
                            <div className={styles.infoRow}>
                              <UserOutlined />
                              <span>
                                {language === 'ar' ? contract.createdByAr : contract.createdBy}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Col>

                      {/* Status & Actions */}
                      <Col xs={24} md={4}>
                        <div className={styles.statusActions}>
                          <Badge
                            status={statusConfig.color as any}
                            text={
                              <span className={styles.statusText}>
                                {statusConfig.icon} {statusConfig.text}
                              </span>
                            }
                          />
                          <Divider style={{ margin: '12px 0' }} />
                          <Space vertical style={{ width: '100%' }}>
                            <Button
                              type="link"
                              icon={<FileTextOutlined />}
                              block
                              onClick={() => console.log('View', contract.id)}
                            >
                              {t('viewDetails')}
                            </Button>
                            <Button
                              type="link"
                              icon={<PrinterOutlined />}
                              block
                              onClick={() => console.log('Print', contract.id)}
                            >
                              {t('print')}
                            </Button>
                          </Space>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              );
            })}
          </Row>

          {/* Pagination */}
          <div className={styles.paginationWrapper}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredContracts.length}
              onChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }}
              showSizeChanger
              showTotal={(total) => `${t('totalContracts')}: ${total}`}
              pageSizeOptions={[10, 15, 20, 25, 50, 100]}
            />
          </div>
        </>
      ) : (
        <Card>
          <Empty description={t('noContracts')} />
        </Card>
      )}
    </div>
  );
}
