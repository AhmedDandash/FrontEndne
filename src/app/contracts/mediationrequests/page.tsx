'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Input,
  Statistic,
  Avatar,
  Empty,
  Modal,
  Divider,
  Descriptions,
  Pagination,
  Spin,
  Image,
} from 'antd';
import {
  FileAddOutlined,
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
  PhoneOutlined,
  EyeOutlined,
  GlobalOutlined,
  CalendarOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { AdvancedFilterPanel } from '@/components/filters';
import { useRecruitmentRequests } from '@/hooks/api/useMediationContracts';
import { resolveImageUrl } from '@/utils/image';
import type { RecruitmentRequestItem } from '@/types/api.types';
import styles from './MediationRequests.module.css';

export default function MediationRequestsPage() {
  const language = useAuthStore((state) => state.language);
  const isRtl = language === 'ar';

  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RecruitmentRequestItem | null>(null);

  // Debounce the search box → resets to page 1.
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(id);
  }, [searchText]);

  const { requests, total, isLoading, isFetching, refetch } = useRecruitmentRequests({
    search: debouncedSearch || undefined,
    pageSize: 200,
  });

  const t = {
    pageTitle: isRtl ? 'طلبات الاستقدام' : 'Recruitment Requests',
    pageSubtitle: isRtl
      ? 'إدارة جميع طلبات الاستقدام الواردة'
      : 'Manage all incoming recruitment requests',
    totalRequests: isRtl ? 'إجمالي الطلبات' : 'Total Requests',
    withWorker: isRtl ? 'بعامل محدد' : 'With Worker',
    anyWorker: isRtl ? 'أي عامل مطابق' : 'Any Matching Worker',
    pendingWorker: isRtl ? 'عامل غير مسجّل (جواز فقط)' : 'Pending Worker (Passport Only)',
    search: isRtl ? 'بحث باسم العميل أو رقم الطلب...' : 'Search by customer name or request number...',
    refresh: isRtl ? 'تحديث' : 'Refresh',
    requestDetails: isRtl ? 'تفاصيل الطلب' : 'Request Details',
    viewDetails: isRtl ? 'عرض التفاصيل' : 'View Details',
    close: isRtl ? 'إغلاق' : 'Close',
    noResults: isRtl ? 'لا توجد طلبات مطابقة' : 'No matching requests',
    customerInfo: isRtl ? 'بيانات العميل' : 'Customer Info',
    workerInfo: isRtl ? 'بيانات العامل' : 'Worker Info',
    workerType: isRtl ? 'نوع العامل' : 'Worker Type',
    nationality: isRtl ? 'الجنسية' : 'Nationality',
    passport: isRtl ? 'رقم الجواز' : 'Passport',
    worker: isRtl ? 'العامل' : 'Worker',
    branch: isRtl ? 'الفرع' : 'Branch',
    requestDate: isRtl ? 'تاريخ الطلب' : 'Request Date',
    status: isRtl ? 'الحالة' : 'Status',
    showing: isRtl ? 'عرض' : 'Showing',
    of: isRtl ? 'من' : 'of',
    requests: isRtl ? 'طلب' : 'requests',
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // The endpoint already applies the search server-side; paginate client-side.
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return requests.slice(start, start + pageSize);
  }, [requests, currentPage, pageSize]);

  const stats = useMemo(
    () => ({
      total,
      withWorker: requests.filter((r) => r.hasSpecificWorker).length,
      anyWorker: requests.filter((r) => !r.hasSpecificWorker).length,
    }),
    [requests, total]
  );

  const branchOf = (r: RecruitmentRequestItem) =>
    (isRtl ? r.branchNameAr : r.branchNameEn) || r.branchNameAr || r.branchNameEn || '';

  // Worker display: either a specific worker (name/passport/photo) or the
  // "any matching worker" label. Requirement edits.md §3.7.
  const renderWorkerSummary = (r: RecruitmentRequestItem) => {
    // hasSpecificWorker covers two distinct cases: a real booked worker, and
    // a passport-only worker not yet in the system (BACKEND_REVIEW_README.md
    // #5/#9) — the latter has no workerId/workerName, only the pending
    // passport, and must not render as a nameless "booked" row.
    if (r.hasSpecificWorker && !r.workerId && !r.workerName && r.pendingWorkerPassportNumber) {
      return (
        <div className={styles.customerSection}>
          <Avatar size={44} icon={<IdcardOutlined />} className={styles.customerAvatar} />
          <div className={styles.customerDetails}>
            <span className={styles.customerName}>{t.pendingWorker}</span>
            <div className={styles.customerMeta}>
              <IdcardOutlined />
              <span dir="ltr">{r.pendingWorkerPassportNumber}</span>
            </div>
          </div>
        </div>
      );
    }
    if (r.hasSpecificWorker) {
      return (
        <div className={styles.customerSection}>
          {r.workerPhotoUrl ? (
            <Image
              src={resolveImageUrl(r.workerPhotoUrl)}
              alt={r.workerName || 'worker'}
              width={44}
              height={44}
              style={{ objectFit: 'cover', borderRadius: '50%' }}
              preview={false}
            />
          ) : (
            <Avatar size={44} icon={<UserOutlined />} className={styles.customerAvatar} />
          )}
          <div className={styles.customerDetails}>
            <span className={styles.customerName}>{r.workerName || '-'}</span>
            {r.workerPassportNumber && (
              <div className={styles.customerMeta}>
                <IdcardOutlined />
                <span dir="ltr">{r.workerPassportNumber}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return (
      <Tag icon={<TeamOutlined />} color="purple" style={{ fontWeight: 600, padding: '4px 10px' }}>
        {r.workerSelectionLabel || t.anyWorker}
      </Tag>
    );
  };

  const renderCard = (req: RecruitmentRequestItem) => {
    const branch = branchOf(req);
    return (
      <Col xs={24} key={req.id}>
        <Card className={styles.requestCard} hoverable>
          <div className={styles.cardContent}>
            <div className={styles.cardLeft}>
              <div className={styles.cardHeader}>
                <div className={styles.requestNumber}>
                  <FileAddOutlined className={styles.requestIcon} />
                  <span>#{req.contractNumber ?? req.id}</span>
                </div>
                {req.statusName && (
                  <Tag color="blue" style={{ fontWeight: 600 }}>
                    {req.statusName}
                  </Tag>
                )}
              </div>

              <div className={styles.tagsSection}>
                {req.workerTypeName && (
                  <Tag
                    color="blue"
                    className={styles.workerTypeTag}
                    style={{ color: '#003366', borderColor: '#003366', background: '#e8f0f8' }}
                  >
                    {req.workerTypeName}
                  </Tag>
                )}
                {branch && (
                  <Tag icon={<EnvironmentOutlined />} color="geekblue">
                    {branch}
                  </Tag>
                )}
              </div>

              {/* Customer */}
              <div className={styles.customerSection}>
                <Avatar size={44} icon={<UserOutlined />} className={styles.customerAvatar} />
                <div className={styles.customerDetails}>
                  <span className={styles.customerName}>{req.customerName || '-'}</span>
                  {req.customerPhone && (
                    <div className={styles.customerMeta}>
                      <PhoneOutlined />
                      <span dir="ltr">{req.customerPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.detailsSection}>
                <div className={styles.detailItem}>
                  <GlobalOutlined className={styles.detailIcon} />
                  <div className={styles.detailText}>
                    <span className={styles.detailLabel}>{t.nationality}</span>
                    <span className={styles.detailValue}>{req.workerNationalityAr || '-'}</span>
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <CalendarOutlined className={styles.detailIcon} />
                  <div className={styles.detailText}>
                    <span className={styles.detailLabel}>{t.requestDate}</span>
                    <span className={styles.detailValue}>{formatDate(req.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: worker selection */}
            <div className={styles.cardRight}>
              <div className={styles.salaryBanner}>
                <div className={styles.salaryMeta}>
                  <TeamOutlined className={styles.salaryIcon} />
                  <span className={styles.salaryLabel}>{t.worker}</span>
                </div>
              </div>
              <div style={{ padding: '12px 4px' }}>{renderWorkerSummary(req)}</div>
            </div>
          </div>

          <div className={styles.cardBottom}>
            <div className={styles.actionsList}>
              <Button
                type="link"
                icon={<EyeOutlined />}
                className={styles.actionBtn}
                block
                onClick={() => {
                  setSelectedRequest(req);
                  setShowDetailsModal(true);
                }}
              >
                {t.viewDetails}
              </Button>
            </div>
          </div>
        </Card>
      </Col>
    );
  };

  return (
    <div className={styles.requestsPage} dir={isRtl ? 'rtl' : 'ltr'}>
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
            <Button
              icon={<ReloadOutlined />}
              className={styles.secondaryBtn}
              loading={isFetching}
              onClick={() => refetch()}
            >
              {t.refresh}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} className={styles.statisticsRow}>
        <Col xs={24} sm={8}>
          <Card className={styles.statCard}>
            <Statistic
              title={t.totalRequests}
              value={stats.total}
              prefix={<FileAddOutlined style={{ color: '#003366' }} />}
              valueStyle={{ color: '#003366' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card className={styles.statCard}>
            <Statistic
              title={t.withWorker}
              value={stats.withWorker}
              prefix={<UserOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card className={styles.statCard}>
            <Statistic
              title={t.anyWorker}
              value={stats.anyWorker}
              prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <AdvancedFilterPanel
        activeCount={0}
        onClear={() => setSearchText('')}
        quickFilters={
          <Input
            placeholder={t.search}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            size="large"
            className={styles.searchInput}
          />
        }
      />

      {/* Count */}
      <div className={styles.resultsInfo}>
        <span>
          {t.showing} {paginated.length} {t.of} {requests.length} {t.requests}
        </span>
      </div>

      {/* List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
        </div>
      ) : paginated.length > 0 ? (
        <Row gutter={[16, 16]} className={styles.requestsGrid}>
          {paginated.map(renderCard)}
        </Row>
      ) : (
        <Card className={styles.emptyCard}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t.noResults} />
        </Card>
      )}

      {/* Pagination */}
      {requests.length > pageSize && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24, marginBottom: 8 }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={requests.length}
            onChange={(page, size) => {
              setCurrentPage(page);
              if (size !== pageSize) setCurrentPage(1);
              setPageSize(size);
            }}
            showSizeChanger
            showTotal={(tot, range) =>
              isRtl ? `${range[0]}-${range[1]} من ${tot}` : `${range[0]}-${range[1]} of ${tot}`
            }
            pageSizeOptions={[10, 20, 50]}
          />
        </div>
      )}

      {/* Details Modal */}
      <Modal
        title={
          <span>
            {t.requestDetails}
            {selectedRequest && ` — #${selectedRequest.contractNumber ?? selectedRequest.id}`}
            {selectedRequest?.statusName && (
              <Tag color="blue" style={{ marginInlineStart: 12, fontWeight: 600 }}>
                {selectedRequest.statusName}
              </Tag>
            )}
          </span>
        }
        open={showDetailsModal}
        onCancel={() => {
          setShowDetailsModal(false);
          setSelectedRequest(null);
        }}
        footer={
          <Button
            type="primary"
            onClick={() => {
              setShowDetailsModal(false);
              setSelectedRequest(null);
            }}
          >
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
              <Descriptions.Item label={isRtl ? 'اسم العميل' : 'Customer Name'}>
                {selectedRequest.customerName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={isRtl ? 'رقم الجوال' : 'Phone'}>
                <span dir="ltr">{selectedRequest.customerPhone || '-'}</span>
              </Descriptions.Item>
              <Descriptions.Item label={t.branch} span={2}>
                {branchOf(selectedRequest) || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Divider titlePlacement="left" style={{ fontSize: 13, color: '#8c8c8c', marginBlockStart: 20 }}>
              {t.workerInfo}
            </Divider>
            {selectedRequest.hasSpecificWorker ? (
              <>
                {selectedRequest.workerPhotoUrl && (
                  <div style={{ marginBlockEnd: 12 }}>
                    <Image
                      src={resolveImageUrl(selectedRequest.workerPhotoUrl)}
                      alt={selectedRequest.workerName || 'worker'}
                      width={96}
                      height={96}
                      style={{ objectFit: 'cover', borderRadius: 8 }}
                    />
                  </div>
                )}
                <Descriptions column={2} size="small" bordered>
                  <Descriptions.Item label={t.worker}>
                    {selectedRequest.workerName || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label={t.passport}>
                    {selectedRequest.workerPassportNumber || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label={t.nationality}>
                    {selectedRequest.workerNationalityAr || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label={t.workerType}>
                    {selectedRequest.workerTypeName || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </>
            ) : (
              <Tag icon={<TeamOutlined />} color="purple" style={{ fontWeight: 600, padding: '6px 12px' }}>
                {selectedRequest.workerSelectionLabel || t.anyWorker}
              </Tag>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
