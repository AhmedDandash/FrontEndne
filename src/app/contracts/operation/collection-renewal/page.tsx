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
import { AdvancedFilterPanel } from '@/components/filters';
import { useEmploymentOperatingContracts } from '@/hooks/api/useEmploymentOperatingContracts';
import { useCustomers } from '@/hooks/api/useCustomers';
import { unwrapList } from '@/utils/api-response';
import { buildCustomerResolver } from '../rent/_components/mapping';
import type { EmploymentOperatingContract } from '@/types/api.types';
import RenewModal from '../rent/_components/RenewModal';
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
  startDate: string;
  endDate: string;
  remainingDays: number;
  status: 'valid' | 'expiring-soon' | 'expired';
  totalAmount: number;
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
}

/** A phone is dialable only if it has enough digits to form a real number. */
function isValidPhone(phone?: string): boolean {
  if (!phone) return false;
  return phone.replace(/[^0-9]/g, '').length >= 9;
}

export default function CollectionRenewalPage() {
  const language = useAuthStore((state) => state.language);
  const isRTL = language === 'ar';

  // Fetch contracts from API
  const { contracts: apiContracts, isLoading, renewContract, isRenewing } =
    useEmploymentOperatingContracts();

  const { customers = [] } = useCustomers();

  // Safely extract data from API response (handles every known wrapper shape)
  const contractsData = useMemo(
    (): EmploymentOperatingContract[] => unwrapList<EmploymentOperatingContract>(apiContracts),
    [apiContracts]
  );

  // Map API data to internal RentalContract format
  const contracts = useMemo((): RentalContract[] => {
    const resolveCustomer = buildCustomerResolver(customers as any[]);
    return contractsData.map((contract): RentalContract => {
      const startDate = contract.contractStartDate || '';
      const endDate = contract.contractEndDate || '';
      // Only contracts with a real end date can have a meaningful remaining-days value.
      const daysRemaining = endDate
        ? Math.floor((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;

      // Determine status based on days remaining (only when an end date exists).
      let status: RentalContract['status'] = 'valid';
      if (endDate) {
        if (daysRemaining < 0) status = 'expired';
        else if (daysRemaining <= 14) status = 'expiring-soon';
      }

      const cust = resolveCustomer(contract.customerId);
      const workerName = contract.workerNameEn || contract.workerNameAr || undefined;
      const workerNameAr = contract.workerNameAr || contract.workerNameEn || undefined;

      return {
        id: String(contract.id),
        contractId: Number(contract.contractNumber) || 0,
        contractNumber: Number(contract.contractNumber) || 0,
        branchName: 'Sigma Competences Recruitment Office',
        branchNameAr: 'سيقما الكفاءات للإستقدام',
        customerName: cust.en,
        customerNameAr: cust.ar,
        customerPhone: cust.phone || '—',
        customerId: contract.customerIdentiy || String(contract.customerId || ''),
        customerUuid: String(contract.customerId || ''),
        startDate: startDate ? startDate.split('T')[0] : '',
        endDate: endDate ? endDate.split('T')[0] : '',
        remainingDays: daysRemaining,
        status,
        totalAmount: contract.totalCostWithTax || contract.cost || contract.offerPrice || 0,
        workerName,
        workerNameAr,
        workerNationality: undefined,
        workerNationalityAr: undefined,
      };
    });
  }, [contractsData, customers]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedContract, setSelectedContract] = useState<RentalContract | null>(null);
  const [viewMode, setViewMode] = useState<string>('cards');
  const [renewTarget, setRenewTarget] = useState<RentalContract | null>(null);

  // Calculate stats
  const stats: ContractStats = useMemo(() => {
    const valid = contracts.filter((c) => c.status === 'valid').length;
    const expiringSoon = contracts.filter((c) => c.status === 'expiring-soon').length;
    const expired = contracts.filter((c) => c.status === 'expired').length;

    return {
      total: contracts.length,
      valid,
      expiringSoon,
      expired,
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
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const formatFullDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat(isRTL ? 'ar-SA' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const handleRenewContract = (contract: RentalContract) => {
    setRenewTarget(contract);
  };

  const handleRenewSubmit = (newEndDate: string) => {
    if (!renewTarget) return;
    renewContract({ id: renewTarget.id, newEndDate });
    setRenewTarget(null);
    setSelectedContract(null);
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

      {/* Filter Section */}
      <AdvancedFilterPanel
        activeCount={statusFilter !== 'all' ? 1 : 0}
        onClear={() => setStatusFilter('all')}
        quickFilters={
          <>
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
            <div>
              <label className={styles.filterLabel}>
                {isRTL ? 'جميع الحالات' : 'All Statuses'}
              </label>
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
          </>
        }
        actions={
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
        }
      />

      <div style={{ marginBlockEnd: 16 }}>
        <span className={styles.resultCount}>
          {isRTL
            ? `عرض ${paginatedContracts.length} من ${filteredContracts.length}`
            : `Showing ${paginatedContracts.length} of ${filteredContracts.length}`}
        </span>
      </div>

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
                        {isValidPhone(contract.customerPhone) ? (
                          <Tooltip title={isRTL ? 'واتساب' : 'WhatsApp'}>
                            <a
                              href={`https://wa.me/966${contract.customerPhone.replace(/[^0-9]/g, '').replace(/^0/, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.whatsappLink}
                            >
                              <WhatsAppOutlined /> {contract.customerPhone}
                            </a>
                          </Tooltip>
                        ) : (
                          <span className={styles.customerId}>
                            <WhatsAppOutlined /> {contract.customerPhone}
                          </span>
                        )}
                        <span className={styles.customerId}>
                          <IdcardOutlined /> {contract.customerId}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contract Dates */}
                  <div className={styles.datesGrid}>
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
                    {isRTL ? 'قيمة العقد' : 'Contract Value'}
                  </span>
                  <span className={styles.amountValue}>
                    {selectedContract.totalAmount.toLocaleString()} {isRTL ? 'ريال' : 'SAR'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Renew Modal (shared with the rent contracts page) */}
      <RenewModal
        open={!!renewTarget}
        isRtl={isRTL}
        loading={isRenewing}
        onCancel={() => setRenewTarget(null)}
        onSubmit={handleRenewSubmit}
      />
    </div>
  );
}
