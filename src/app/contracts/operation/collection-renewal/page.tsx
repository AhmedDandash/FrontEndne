'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Tag,
  Empty,
  Row,
  Col,
  Tooltip,
  Statistic,
  Progress,
  Modal,
  Divider,
  Avatar,
  Badge,
  Pagination,
  Segmented,
  Spin,
} from 'antd';
import {
  SearchOutlined,
  CalendarOutlined,
  UserOutlined,
  IdcardOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  WhatsAppOutlined,
  HistoryOutlined,
  SyncOutlined,
  FieldTimeOutlined,
  FileTextOutlined,
  RiseOutlined,
  WarningOutlined,
  ShopOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useEmploymentOperatingContracts } from '@/hooks/api/useEmploymentOperatingContracts';
import type { EmploymentOperatingContract } from '@/types/api.types';
import styles from './CollectionRenewal.module.css';

interface RentalContract {
  id: string;
  contractId: number;
  contractNumber: number;
  branchName: string;
  branchNameAr: string;
  customerName: string;
  customerNameAr: string;
  customerPhone: string;
  customerId: string;
  customerUuid: string;
  signDate: string;
  startDate: string;
  endDate: string;
  remainingDays: number;
  status: 'valid' | 'expiring-soon' | 'expired';
  totalAmount: number;
  paidAmount: number;
  workerName?: string;
  workerNameAr?: string;
  workerNationality?: string;
  workerNationalityAr?: string;
}

interface ContractStats {
  total: number;
  valid: number;
  expiringSoon: number;
  expired: number;
  collectionRate: number;
}

export default function CollectionRenewalPage() {
  const language = useAuthStore((state) => state.language);
  const isRTL = language === 'ar';

  // Fetch contracts from API
  const { contracts: apiContracts, isLoading } = useEmploymentOperatingContracts();

  // Safely extract data from API response (handles wrapped responses)
  const contractsData = useMemo((): EmploymentOperatingContract[] => {
    console.log('API Response:', apiContracts);
    if (!apiContracts) return [];
    if (Array.isArray(apiContracts)) return apiContracts;
    if (
      typeof apiContracts === 'object' &&
      'data' in apiContracts &&
      Array.isArray((apiContracts as any).data)
    ) {
      return (apiContracts as any).data;
    }
    return [];
  }, [apiContracts]);

  // Map API data to internal RentalContract format
  const contracts = useMemo((): RentalContract[] => {
    const mapped = contractsData.map((contract): RentalContract => {
      const startDate = contract.contractStartDate || new Date().toISOString();
      const endDate = contract.contractEndDate || new Date().toISOString();
      const daysRemaining = Math.floor(
        (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      // Determine status based on days remaining
      let status: RentalContract['status'] = 'valid';
      if (daysRemaining < 0) status = 'expired';
      else if (daysRemaining <= 14) status = 'expiring-soon';

      return {
        id: String(contract.id),
        contractId:1,
        contractNumber: 760,
        branchName: 'Sigma Competences Recruitment Office',
        branchNameAr: 'سيقما الكفاءات للإستقدام',
        customerName: contract.customerNameAr || 'Unknown',
        customerNameAr: contract.customerNameAr || 'غير معروف',
        customerPhone: contract.mobile || '05xxxxxxxx',
        customerId: contract.customerIdentiy || String(contract.customerId || 0),
        customerUuid: `uuid-${contract.id}`,
        signDate: startDate.split('T')[0],
        startDate: startDate.split('T')[0],
        endDate: endDate.split('T')[0],
        remainingDays: daysRemaining,
        status,
        totalAmount: contract.totalCostWithTax || contract.cost || 0,
        paidAmount: contract.cost || 0,
        workerName: contract.jobName || undefined,
        workerNameAr: contract.jobName || undefined,
        workerNationality: undefined,
        workerNationalityAr: undefined,
      };
    });
    console.log('Mapped Contracts Count:', mapped.length);
    console.log('Mapped Contracts Sample:', mapped.slice(0, 2));
    return mapped;
  }, [contractsData]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedContract, setSelectedContract] = useState<RentalContract | null>(null);
  const [viewMode, setViewMode] = useState<string>('cards');

  // Calculate stats
  const stats: ContractStats = useMemo(() => {
    const valid = contracts.filter((c) => c.status === 'valid').length;
    const expiringSoon = contracts.filter((c) => c.status === 'expiring-soon').length;
    const expired = contracts.filter((c) => c.status === 'expired').length;
    const totalPaid = contracts.reduce((sum, c) => sum + c.paidAmount, 0);
    const totalAmount = contracts.reduce((sum, c) => sum + c.totalAmount, 0);

    return {
      total: contracts.length,
      valid,
      expiringSoon,
      expired,
      collectionRate: totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0,
    };
  }, [contracts]);

  // Filter contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      const customerName = isRTL ? contract.customerNameAr : contract.customerName;
      const matchesSearch =
        customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.contractNumber.toString().includes(searchTerm) ||
        contract.customerPhone.includes(searchTerm) ||
        contract.customerId.includes(searchTerm);

      const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [contracts, searchTerm, statusFilter, isRTL]);

  // Paginate contracts
  const paginatedContracts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredContracts.slice(startIndex, startIndex + pageSize);
  }, [filteredContracts, currentPage, pageSize]);

  const getStatusConfig = (status: string, remainingDays: number) => {
    switch (status) {
      case 'valid':
        return {
          color: 'success',
          icon: <CheckCircleOutlined />,
          label: isRTL ? 'ساري' : 'Valid',
          description: isRTL
            ? `ينتهي بعد ${remainingDays} يوم`
            : `Expires in ${remainingDays} days`,
          badgeStatus: 'success' as const,
        };
      case 'expiring-soon':
        return {
          color: 'warning',
          icon: <ExclamationCircleOutlined />,
          label: isRTL ? 'ينتهي قريباً' : 'Expiring Soon',
          description: isRTL
            ? `ينتهي بعد ${remainingDays} يوم`
            : `Expires in ${remainingDays} days`,
          badgeStatus: 'warning' as const,
        };
      case 'expired':
        return {
          color: 'error',
          icon: <CloseCircleOutlined />,
          label: isRTL ? 'منتهي' : 'Expired',
          description: isRTL
            ? `انتهى منذ ${Math.abs(remainingDays)} يوم`
            : `Expired ${Math.abs(remainingDays)} days ago`,
          badgeStatus: 'error' as const,
        };
      default:
        return {
          color: 'default',
          icon: <ClockCircleOutlined />,
          label: isRTL ? 'غير معروف' : 'Unknown',
          description: '',
          badgeStatus: 'default' as const,
        };
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(isRTL ? 'ar-SA' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const handleRenewContract = (contract: RentalContract) => {
    console.log('Renewing contract:', contract.contractNumber);
  };

  const handleViewContract = (contract: RentalContract) => {
    setSelectedContract(contract);
  };

  if (isLoading) {
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}
      >
        <Spin size="large" tip={language === 'ar' ? 'جاري التحميل...' : 'Loading...'} />
      </div>
    );
  }

  return (
    <div className={styles.container} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerTitle}>
            <div className={styles.headerIcon}>
              <SyncOutlined />
            </div>
            <div>
              <h1>{isRTL ? 'التحصيل والتجديد' : 'Collection & Renewal'}</h1>
              <p className={styles.headerSubtitle}>
                {isRTL
                  ? 'إدارة تحصيل وتجديد عقود التشغيل'
                  : 'Manage operation contract collection and renewals'}
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className={styles.statisticsRow}>
        <Col xs={12} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={isRTL ? 'إجمالي العقود' : 'Total Contracts'}
              value={stats.total}
              prefix={<FileTextOutlined style={{ color: '#003366' }} />}
              valueStyle={{ color: '#003366' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={isRTL ? 'عقود سارية' : 'Valid Contracts'}
              value={stats.valid}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={isRTL ? 'تنتهي قريباً' : 'Expiring Soon'}
              value={stats.expiringSoon}
              prefix={<WarningOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={isRTL ? 'عقود منتهية' : 'Expired Contracts'}
              value={stats.expired}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Collection Rate Card */}
      <Card className={styles.collectionCard}>
        <Row gutter={[24, 16]} align="middle">
          <Col xs={24} md={8}>
            <div className={styles.collectionInfo}>
              <RiseOutlined className={styles.collectionIcon} />
              <div>
                <h3>{isRTL ? 'معدل التحصيل' : 'Collection Rate'}</h3>
                <p>
                  {isRTL
                    ? 'نسبة المبالغ المحصلة من إجمالي العقود'
                    : 'Percentage of collected amounts from total contracts'}
                </p>
              </div>
            </div>
          </Col>
          <Col xs={24} md={16}>
            <div className={styles.progressWrapper}>
              <Progress
                percent={stats.collectionRate}
                strokeColor={{
                  '0%': '#003366',
                  '100%': '#52c41a',
                }}
                strokeWidth={20}
                format={(percent) => <span className={styles.progressText}>{percent}%</span>}
              />
            </div>
          </Col>
        </Row>
      </Card>

      {/* Filter Section */}
      <Card className={styles.filterCard}>
        <div className={styles.filterContent}>
          <div className={styles.filterLeft}>
            <Input
              placeholder={
                isRTL
                  ? 'البحث بالاسم أو رقم العقد أو الهاتف...'
                  : 'Search by name, contract number, or phone...'
              }
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
              allowClear
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              className={styles.statusSelect}
              options={[
                { value: 'all', label: isRTL ? 'جميع الحالات' : 'All Statuses' },
                { value: 'valid', label: isRTL ? 'عقود سارية' : 'Valid Contracts' },
                { value: 'expiring-soon', label: isRTL ? 'تنتهي قريباً' : 'Expiring Soon' },
                { value: 'expired', label: isRTL ? 'عقود منتهية' : 'Expired Contracts' },
              ]}
            />
          </div>
          <div className={styles.filterRight}>
            <Segmented
              value={viewMode}
              onChange={(value) => setViewMode(value as string)}
              options={[
                {
                  value: 'cards',
                  icon: <AppstoreOutlined />,
                  label: isRTL ? 'بطاقات' : 'Cards',
                },
                {
                  value: 'compact',
                  icon: <UnorderedListOutlined />,
                  label: isRTL ? 'مضغوط' : 'Compact',
                },
              ]}
            />
            <span className={styles.resultCount}>
              {isRTL
                ? `عرض ${paginatedContracts.length} من ${filteredContracts.length}`
                : `Showing ${paginatedContracts.length} of ${filteredContracts.length}`}
            </span>
          </div>
        </div>
      </Card>

      {/* Contracts Grid/List */}
      {paginatedContracts.length === 0 ? (
        <Card className={styles.emptyCard}>
          <Empty description={isRTL ? 'لا توجد عقود مطابقة' : 'No matching contracts'} />
        </Card>
      ) : viewMode === 'cards' ? (
        <div className={styles.contractsGrid}>
          {paginatedContracts.map((contract) => {
            const statusConfig = getStatusConfig(contract.status, contract.remainingDays);
            return (
              <Card
                key={contract.id}
                className={`${styles.contractCard} ${styles[contract.status]}`}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.contractNumberSection}>
                    <span className={styles.contractNumber}>{contract.contractNumber}</span>
                    <Badge status={statusConfig.badgeStatus} text={statusConfig.label} />
                  </div>
                  <Tag
                    color={statusConfig.color}
                    icon={statusConfig.icon}
                    className={styles.statusTag}
                  >
                    {statusConfig.description}
                  </Tag>
                </div>

                <Divider className={styles.cardDivider} />

                <div className={styles.cardBody}>
                  {/* Customer Info */}
                  <div className={styles.customerSection}>
                    <Avatar size={48} icon={<UserOutlined />} className={styles.customerAvatar} />
                    <div className={styles.customerInfo}>
                      <h4 className={styles.customerName}>
                        {isRTL ? contract.customerNameAr : contract.customerName}
                      </h4>
                      <div className={styles.customerMeta}>
                        <Tooltip title={isRTL ? 'واتساب' : 'WhatsApp'}>
                          <a
                            href={`https://wa.me/966${contract.customerPhone.substring(1)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.whatsappLink}
                          >
                            <WhatsAppOutlined /> {contract.customerPhone}
                          </a>
                        </Tooltip>
                        <span className={styles.customerId}>
                          <IdcardOutlined /> {contract.customerId}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contract Dates */}
                  <div className={styles.datesGrid}>
                    <div className={styles.dateItem}>
                      <CalendarOutlined className={styles.dateIcon} />
                      <div>
                        <span className={styles.dateLabel}>
                          {isRTL ? 'تاريخ التوقيع' : 'Sign Date'}
                        </span>
                        <span className={styles.dateValue}>{formatDate(contract.signDate)}</span>
                      </div>
                    </div>
                    <div className={styles.dateItem}>
                      <FieldTimeOutlined className={styles.dateIcon} />
                      <div>
                        <span className={styles.dateLabel}>
                          {isRTL ? 'تاريخ البداية' : 'Start Date'}
                        </span>
                        <span className={styles.dateValue}>{formatDate(contract.startDate)}</span>
                      </div>
                    </div>
                    <div className={styles.dateItem}>
                      <ClockCircleOutlined className={styles.dateIcon} />
                      <div>
                        <span className={styles.dateLabel}>
                          {isRTL ? 'تاريخ الانتهاء' : 'End Date'}
                        </span>
                        <span className={styles.dateValue}>{formatDate(contract.endDate)}</span>
                      </div>
                    </div>
                    <div className={styles.dateItem}>
                      <HistoryOutlined className={styles.dateIcon} />
                      <div>
                        <span className={styles.dateLabel}>
                          {isRTL ? 'المدة المتبقية' : 'Remaining'}
                        </span>
                        <span className={`${styles.dateValue} ${styles[contract.status + 'Text']}`}>
                          {contract.remainingDays > 0
                            ? isRTL
                              ? `${contract.remainingDays} يوم`
                              : `${contract.remainingDays} days`
                            : isRTL
                              ? `${Math.abs(contract.remainingDays)} يوم مضت`
                              : `${Math.abs(contract.remainingDays)} days ago`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Branch */}
                  <div className={styles.branchInfo}>
                    <ShopOutlined />
                    <span>{isRTL ? contract.branchNameAr : contract.branchName}</span>
                  </div>
                </div>

                <Divider className={styles.cardDivider} />

                <div className={styles.cardFooter}>
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewContract(contract)}
                  >
                    {isRTL ? 'عرض' : 'View'}
                  </Button>
                  {(contract.status === 'expired' || contract.status === 'expiring-soon') && (
                    <Button
                      type="primary"
                      icon={<ReloadOutlined />}
                      onClick={() => handleRenewContract(contract)}
                      className={styles.renewBtn}
                    >
                      {isRTL ? 'تجديد' : 'Renew'}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className={styles.compactListCard}>
          {paginatedContracts.map((contract, index) => {
            const statusConfig = getStatusConfig(contract.status, contract.remainingDays);
            return (
              <div
                key={contract.id}
                className={`${styles.compactRow} ${index < paginatedContracts.length - 1 ? styles.withBorder : ''}`}
              >
                <div className={styles.compactLeft}>
                  <span className={styles.compactNumber}>{contract.contractNumber}</span>
                  <div className={styles.compactInfo}>
                    <span className={styles.compactName}>
                      {isRTL ? contract.customerNameAr : contract.customerName}
                    </span>
                    <span className={styles.compactPhone}>{contract.customerPhone}</span>
                  </div>
                </div>
                <div className={styles.compactCenter}>
                  <span>{formatDate(contract.startDate)}</span>
                  <span className={styles.dateSeparator}>→</span>
                  <span>{formatDate(contract.endDate)}</span>
                </div>
                <div className={styles.compactRight}>
                  <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewContract(contract)}
                  />
                </div>
              </div>
            );
          })}
        </Card>
      )}

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
          showQuickJumper
          pageSizeOptions={['10', '15', '20', '24', '50', '100']}
          showTotal={(total, range) =>
            isRTL
              ? `${range[0]}-${range[1]} من ${total} عقد`
              : `${range[0]}-${range[1]} of ${total} contracts`
          }
        />
      </div>

      {/* Contract Details Modal */}
      <Modal
        title={
          <div className={styles.modalTitle}>
            <FileTextOutlined />
            <span>
              {isRTL ? 'تفاصيل العقد' : 'Contract Details'} #{selectedContract?.contractNumber}
            </span>
          </div>
        }
        open={!!selectedContract}
        onCancel={() => setSelectedContract(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedContract(null)}>
            {isRTL ? 'إغلاق' : 'Close'}
          </Button>,
          selectedContract &&
            (selectedContract.status === 'expired' ||
              selectedContract.status === 'expiring-soon') && (
              <Button
                key="renew"
                type="primary"
                icon={<ReloadOutlined />}
                onClick={() => selectedContract && handleRenewContract(selectedContract)}
              >
                {isRTL ? 'تجديد العقد' : 'Renew Contract'}
              </Button>
            ),
        ]}
        width={700}
        className={styles.detailsModal}
      >
        {selectedContract && (
          <div className={styles.modalContent}>
            {/* Status Banner */}
            <div className={`${styles.statusBanner} ${styles[selectedContract.status]}`}>
              {getStatusConfig(selectedContract.status, selectedContract.remainingDays).icon}
              <span>
                {
                  getStatusConfig(selectedContract.status, selectedContract.remainingDays)
                    .description
                }
              </span>
            </div>

            {/* Customer Section */}
            <div className={styles.detailSection}>
              <h4>
                <UserOutlined /> {isRTL ? 'معلومات العميل' : 'Customer Information'}
              </h4>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>{isRTL ? 'الاسم' : 'Name'}</span>
                  <span className={styles.detailValue}>
                    {isRTL ? selectedContract.customerNameAr : selectedContract.customerName}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>{isRTL ? 'الهاتف' : 'Phone'}</span>
                  <span className={styles.detailValue}>{selectedContract.customerPhone}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>{isRTL ? 'رقم الهوية' : 'ID Number'}</span>
                  <span className={styles.detailValue}>{selectedContract.customerId}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>{isRTL ? 'الفرع' : 'Branch'}</span>
                  <span className={styles.detailValue}>
                    {isRTL ? selectedContract.branchNameAr : selectedContract.branchName}
                  </span>
                </div>
              </div>
            </div>

            <Divider />

            {/* Contract Dates Section */}
            <div className={styles.detailSection}>
              <h4>
                <CalendarOutlined /> {isRTL ? 'تواريخ العقد' : 'Contract Dates'}
              </h4>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>
                    {isRTL ? 'تاريخ التوقيع' : 'Sign Date'}
                  </span>
                  <span className={styles.detailValue}>
                    {formatFullDate(selectedContract.signDate)}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>
                    {isRTL ? 'تاريخ البداية' : 'Start Date'}
                  </span>
                  <span className={styles.detailValue}>
                    {formatFullDate(selectedContract.startDate)}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>
                    {isRTL ? 'تاريخ الانتهاء' : 'End Date'}
                  </span>
                  <span className={styles.detailValue}>
                    {formatFullDate(selectedContract.endDate)}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>
                    {isRTL ? 'المدة المتبقية' : 'Remaining'}
                  </span>
                  <span
                    className={`${styles.detailValue} ${styles[selectedContract.status + 'Text']}`}
                  >
                    {selectedContract.remainingDays > 0
                      ? isRTL
                        ? `${selectedContract.remainingDays} يوم`
                        : `${selectedContract.remainingDays} days`
                      : isRTL
                        ? `انتهى منذ ${Math.abs(selectedContract.remainingDays)} يوم`
                        : `Expired ${Math.abs(selectedContract.remainingDays)} days ago`}
                  </span>
                </div>
              </div>
            </div>

            <Divider />

            {/* Financial Section */}
            <div className={styles.detailSection}>
              <h4>
                <RiseOutlined /> {isRTL ? 'المعلومات المالية' : 'Financial Information'}
              </h4>
              <div className={styles.financialInfo}>
                <div className={styles.amountCard}>
                  <span className={styles.amountLabel}>
                    {isRTL ? 'إجمالي العقد' : 'Total Amount'}
                  </span>
                  <span className={styles.amountValue}>
                    {selectedContract.totalAmount.toLocaleString()} {isRTL ? 'ريال' : 'SAR'}
                  </span>
                </div>
                <div className={styles.amountCard}>
                  <span className={styles.amountLabel}>
                    {isRTL ? 'المبلغ المحصل' : 'Paid Amount'}
                  </span>
                  <span className={styles.amountValue}>
                    {selectedContract.paidAmount.toLocaleString()} {isRTL ? 'ريال' : 'SAR'}
                  </span>
                </div>
                <div className={styles.amountCard}>
                  <span className={styles.amountLabel}>{isRTL ? 'المتبقي' : 'Remaining'}</span>
                  <span
                    className={`${styles.amountValue} ${selectedContract.totalAmount - selectedContract.paidAmount > 0 ? styles.errorText : styles.successText}`}
                  >
                    {(selectedContract.totalAmount - selectedContract.paidAmount).toLocaleString()}{' '}
                    {isRTL ? 'ريال' : 'SAR'}
                  </span>
                </div>
              </div>
              <Progress
                percent={Math.round(
                  (selectedContract.paidAmount / selectedContract.totalAmount) * 100
                )}
                status={
                  selectedContract.paidAmount >= selectedContract.totalAmount ? 'success' : 'active'
                }
                strokeColor="#52c41a"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
