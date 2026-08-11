'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Table,
  Input,
  Select,
  Button,
  Tag,
  Space,
  Tooltip,
  Modal,
  Form,
  Empty,
  Row,
  Col,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  FileProtectOutlined,
  ReloadOutlined,
  SearchOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  UserAddOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import {
  useHourlyWorkerRequests,
  useHourlyWorkerRequestActions,
} from '@/hooks/api/useHourlyWorkers';
import { useHourlyWorkers } from '@/hooks/api/useHourlyWorkers';
import { useHourlyPackages, useHourlyServingAreas } from '@/hooks/api/useHourlyCatalog';
import { AdvancedFilterPanel, BranchFilterSelect, DateRangeFilter } from '@/components/filters';
import { useHourlyPermissions } from '@/hooks/useHourlyPermissions';
import { useAuthStore } from '@/store/authStore';
import { linkProps } from '@/lib/navigation/linkProps';
import {
  HourlyRequestStatus,
  HOURLY_REQUEST_STATUSES,
  getStatusOption,
  getStatusLabel,
  isTerminalStatus,
  ACTIONS_BY_STATUS,
  type HourlyWorkerRequest,
  type HourlyRequestAction,
} from '@/types/hourly-worker.types';
import { fmtTime, ORDER_PAYMENT_STATUS } from '../_lib/hourlyDisplay';
import styles from '../hourly-workers.module.css';

const PAGE_SIZE = 10;

function StatusTag({ status, isAr }: { status: HourlyRequestStatus; isAr: boolean }) {
  const opt = getStatusOption(status);
  return <Tag color={opt?.color ?? 'default'}>{getStatusLabel(status, isAr)}</Tag>;
}

export default function HourlyWorkerRequestsPage() {
  const router = useRouter();
  const language = useAuthStore((state) => state.language);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const perms = useHourlyPermissions();

  // ── Filters ─────────────────────────────────────────────────
  const [ticketNumber, setTicketNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [status, setStatus] = useState<HourlyRequestStatus | undefined>();
  const [branchId, setBranchId] = useState<string | undefined>();
  const [includeSubBranches, setIncludeSubBranches] = useState(true);
  const [range, setRange] = useState<[string | undefined, string | undefined]>([
    undefined,
    undefined,
  ]);
  // Additional filters (beyond ticket/customer/status/date-of-request above).
  const [search, setSearch] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [serviceCity, setServiceCity] = useState('');
  const [serviceDistrict, setServiceDistrict] = useState('');
  const [packageId, setPackageId] = useState<string | undefined>();
  const [servingAreaId, setServingAreaId] = useState<string | undefined>();
  const [paymentStatus, setPaymentStatus] = useState<number | undefined>();
  const [sortBy, setSortBy] = useState<
    'ticketNumber' | 'customerName' | 'requestDate' | 'status' | 'createdDate'
  >('createdDate');
  const [sortDescending, setSortDescending] = useState(true);
  const [createdRange, setCreatedRange] = useState<[string | undefined, string | undefined]>([undefined, undefined]);
  const [updatedRange, setUpdatedRange] = useState<[string | undefined, string | undefined]>([undefined, undefined]);
  const [pageNumber, setPageNumber] = useState(1);

  const { data, isLoading, isFetching, refetch } = useHourlyWorkerRequests({
    ticketNumber: ticketNumber || undefined,
    customerName: customerName || undefined,
    status,
    branchId,
    includeSubBranches: branchId ? includeSubBranches : undefined,
    dateFrom: range[0],
    dateTo: range[1],
    search: search || undefined,
    customerPhone: customerPhone || undefined,
    serviceCity: serviceCity || undefined,
    serviceDistrict: serviceDistrict || undefined,
    packageId,
    servingAreaId,
    paymentStatus,
    sortBy,
    sortDescending,
    createdDateFrom: createdRange[0],
    createdDateTo: createdRange[1],
    updatedDateFrom: updatedRange[0],
    updatedDateTo: updatedRange[1],
    pageNumber,
    pageSize: PAGE_SIZE,
  });

  const requests = useMemo(() => data?.items ?? [], [data]);
  const totalCount = data?.totalCount ?? 0;

  // Package/serving-area dropdown data — fetched here (not reused from
  // elsewhere on this page) for the filter selects below.
  const { data: packageData } = useHourlyPackages({ isActive: true, pageSize: 100 });
  const packageOptions = packageData?.items ?? [];
  const { data: servingAreaData } = useHourlyServingAreas({ isActive: true, pageSize: 100 });
  const servingAreaOptions = servingAreaData?.items ?? [];

  // Search, Branch, and Request date are quick filters and stay untouched by
  // Clear (Request date still counts toward the badge/reset, matching the
  // primary-date-range convention used elsewhere). Everything else is the
  // "advanced" tier.
  const activeFilterCount = [
    ticketNumber !== '',
    customerName !== '',
    status !== undefined,
    customerPhone !== '',
    serviceCity !== '',
    serviceDistrict !== '',
    packageId !== undefined,
    servingAreaId !== undefined,
    paymentStatus !== undefined,
    Boolean(createdRange[0]),
    Boolean(updatedRange[0]),
    Boolean(range[0]),
  ].filter(Boolean).length;

  const clearFilters = () => {
    setTicketNumber('');
    setCustomerName('');
    setStatus(undefined);
    setCustomerPhone('');
    setServiceCity('');
    setServiceDistrict('');
    setPackageId(undefined);
    setServingAreaId(undefined);
    setPaymentStatus(undefined);
    setCreatedRange([undefined, undefined]);
    setUpdatedRange([undefined, undefined]);
    setRange([undefined, undefined]);
    setPageNumber(1);
  };

  const actions = useHourlyWorkerRequestActions();

  // ── Inline assign modal (quick action) ──────────────────────
  const [assignFor, setAssignFor] = useState<HourlyWorkerRequest | null>(null);
  const [assignForm] = Form.useForm();
  const { data: workerData, isLoading: isWorkersLoading } = useHourlyWorkers({
    isActive: true,
    pageSize: 100,
  });
  const eligibleWorkers = workerData?.items ?? [];

  // ── Inline reject modal ─────────────────────────────────────
  const [rejectFor, setRejectFor] = useState<HourlyWorkerRequest | null>(null);
  const [rejectForm] = Form.useForm();

  const pendingCount = useMemo(
    () => requests.filter((r) => r.status === HourlyRequestStatus.Pending).length,
    [requests]
  );
  const activeCount = useMemo(
    () =>
      requests.filter(
        (r) => r.status === HourlyRequestStatus.Assigned || r.status === HourlyRequestStatus.InProgress
      ).length,
    [requests]
  );

  const goDetail = (id: string) => router.push(`/hourly-workers/requests/${id}`);

  // ── Action handlers ─────────────────────────────────────────
  const runAction = (action: HourlyRequestAction, req: HourlyWorkerRequest) => {
    switch (action) {
      case 'approve':
        actions.approve.mutate(req.id);
        break;
      case 'reject':
        setRejectFor(req);
        rejectForm.resetFields();
        break;
      case 'assign':
        setAssignFor(req);
        assignForm.resetFields();
        break;
      case 'inProgress':
        actions.markInProgress.mutate(req.id);
        break;
      case 'complete':
        actions.complete.mutate(req.id);
        break;
      case 'cancel':
        Modal.confirm({
          title: t('إلغاء الطلب؟', 'Cancel request?'),
          content: t('سيتم تحويل الطلب إلى ملغي ولا يمكن التراجع.', 'The request will be cancelled and cannot be undone.'),
          okText: t('إلغاء الطلب', 'Cancel Request'),
          okButtonProps: { danger: true },
          cancelText: t('رجوع', 'Back'),
          onOk: () => actions.cancel.mutateAsync(req.id),
        });
        break;
    }
  };

  const submitAssign = async () => {
    const values = await assignForm.validateFields();
    await actions.assign.mutateAsync({ id: assignFor!.id, data: { workerId: values.workerId } });
    setAssignFor(null);
  };

  const submitReject = async () => {
    const values = await rejectForm.validateFields();
    await actions.reject.mutateAsync({ id: rejectFor!.id, data: { notes: values.notes?.trim() || undefined } });
    setRejectFor(null);
  };

  const ACTION_META: Record<
    HourlyRequestAction,
    { ar: string; en: string; icon: React.ReactNode; danger?: boolean; primary?: boolean }
  > = {
    approve: { ar: 'موافقة', en: 'Approve', icon: <CheckOutlined />, primary: true },
    reject: { ar: 'رفض', en: 'Reject', icon: <CloseOutlined />, danger: true },
    assign: { ar: 'تعيين عامل', en: 'Assign Worker', icon: <UserAddOutlined />, primary: true },
    inProgress: { ar: 'بدء التنفيذ', en: 'Mark In Progress', icon: <PlayCircleOutlined />, primary: true },
    complete: { ar: 'إكمال', en: 'Mark Completed', icon: <CheckCircleOutlined />, primary: true },
    cancel: { ar: 'إلغاء', en: 'Cancel', icon: <StopOutlined />, danger: true },
  };

  const renderActionButtons = (req: HourlyWorkerRequest) => {
    const available = (ACTIONS_BY_STATUS[req.status] ?? []).filter((a) => {
      if (a === 'assign') return perms.canAssignWorkers;
      return perms.canManageOrders;
    });
    return available.map((a) => {
      const meta = ACTION_META[a];
      const loading =
        (a === 'approve' && actions.approve.isPending) ||
        (a === 'inProgress' && actions.markInProgress.isPending) ||
        (a === 'complete' && actions.complete.isPending) ||
        (a === 'cancel' && actions.cancel.isPending);
      return (
        <Button
          key={a}
          size="small"
          type={meta.primary ? 'primary' : 'default'}
          danger={meta.danger}
          icon={meta.icon}
          loading={loading}
          onClick={() => runAction(a, req)}
        >
          {t(meta.ar, meta.en)}
        </Button>
      );
    });
  };

  const columns: ColumnsType<HourlyWorkerRequest> = [
    {
      title: t('رقم التذكرة', 'Ticket No.'),
      dataIndex: 'ticketNumber',
      key: 'ticketNumber',
      width: 160,
      sorter: true,
      sortOrder: sortBy === 'ticketNumber' ? (sortDescending ? 'descend' : 'ascend') : null,
      render: (v: string, record) => (
        <a className={styles.docNumber} {...linkProps(`/hourly-workers/requests/${record.id}`, router)}>
          {v}
        </a>
      ),
    },
    {
      title: t('العميل', 'Customer'),
      dataIndex: 'customerName',
      key: 'customerName',
      sorter: true,
      sortOrder: sortBy === 'customerName' ? (sortDescending ? 'descend' : 'ascend') : null,
      render: (v: string, r) => (
        <div>
          <div className={styles.assignmentName}>{v}</div>
          <div className={styles.assignmentPhone}>{r.customerPhone}</div>
        </div>
      ),
    },
    {
      title: t('التاريخ', 'Date'),
      dataIndex: 'requestDate',
      key: 'requestDate',
      width: 110,
      sorter: true,
      sortOrder: sortBy === 'requestDate' ? (sortDescending ? 'descend' : 'ascend') : null,
      render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD') : '—'),
    },
    {
      title: t('الوقت', 'Time'),
      key: 'time',
      width: 130,
      render: (_, r) => (
        <span className={styles.amount}>
          {fmtTime(r.requestedStartTime)} – {fmtTime(r.requestedEndTime)}
        </span>
      ),
    },
    {
      title: t('العمال', 'Workers'),
      key: 'workers',
      width: 100,
      align: 'center',
      render: (_, r) => (
        <span className={styles.amount}>
          {r.assignedWorkersCount}/{r.numberOfWorkers}
        </span>
      ),
    },
    {
      title: t('الحالة', 'Status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      sorter: true,
      sortOrder: sortBy === 'status' ? (sortDescending ? 'descend' : 'ascend') : null,
      render: (v: HourlyRequestStatus) => <StatusTag status={v} isAr={isAr} />,
    },
    {
      title: t('إجراءات', 'Actions'),
      key: 'actions',
      width: 300,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4} wrap>
          <Tooltip title={t('عرض التفاصيل', 'View details')}>
            <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => goDetail(record.id)} />
          </Tooltip>
          {!isTerminalStatus(record.status) && renderActionButtons(record)}
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <FileProtectOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('طلبات العمل بالساعة', 'Hourly Worker Requests')}</h1>
              <p className={styles.pageSubtitle}>
                {t(
                  'مراجعة الطلبات الواردة من التطبيق وتعيين العمال ومتابعة الحالة',
                  'Review app-submitted requests, assign workers, and track status'
                )}
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button icon={<ReloadOutlined spin={isFetching} />} onClick={() => refetch()} className={styles.refreshBtn}>
              {t('تحديث', 'Refresh')}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Metrics ────────────────────────────────────────────── */}
      <div className={styles.metrics}>
        <div className={`${styles.metricCard} ${styles.total}`}>
          <div className={styles.metricLabel}>{t('إجمالي الطلبات', 'Total Requests')}</div>
          <div className={styles.metricValue}>{totalCount}</div>
        </div>
        <div className={`${styles.metricCard} ${styles.pending}`}>
          <div className={styles.metricLabel}>{t('قيد الانتظار (بالصفحة)', 'Pending (page)')}</div>
          <div className={styles.metricValue}>{pendingCount}</div>
        </div>
        <div className={`${styles.metricCard} ${styles.active}`}>
          <div className={styles.metricLabel}>{t('قيد التنفيذ (بالصفحة)', 'In Progress (page)')}</div>
          <div className={styles.metricValue}>{activeCount}</div>
        </div>
        <div className={`${styles.metricCard} ${styles.available}`}>
          <div className={styles.metricLabel}>{t('في الصفحة', 'On Page')}</div>
          <div className={styles.metricValue}>{requests.length}</div>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────── */}
      <AdvancedFilterPanel
        activeCount={activeFilterCount}
        onClear={clearFilters}
        contentLayout="block"
        quickFilters={
          <>
            <Input
              allowClear
              size="large"
              prefix={<SearchOutlined />}
              placeholder={t('بحث عام', 'General search')}
              style={{ width: 240 }}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPageNumber(1); }}
            />
            <BranchFilterSelect
              value={branchId}
              onChange={(v) => { setBranchId(v); setPageNumber(1); }}
              includeSubBranches={includeSubBranches}
              onIncludeSubBranchesChange={setIncludeSubBranches}
            />
            <div>
              <label className={styles.filterLabel}>{t('تاريخ الطلب', 'Request date')}</label>
              <DateRangeFilter
                value={range}
                style={{ minWidth: 240 }}
                placeholder={[t('تاريخ الطلب من', 'Request date from'), t('تاريخ الطلب إلى', 'Request date to')]}
                onChange={(dates) => {
                  setRange(dates);
                  setPageNumber(1);
                }}
              />
            </div>
          </>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{t('رقم التذكرة', 'Ticket number')}</label>
            <Input
              allowClear
              size="large"
              placeholder={t('رقم التذكرة', 'Ticket number')}
              style={{ width: '100%' }}
              value={ticketNumber}
              onChange={(e) => {
                setTicketNumber(e.target.value);
                setPageNumber(1);
              }}
            />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{t('اسم العميل', 'Customer name')}</label>
            <Input
              allowClear
              size="large"
              placeholder={t('اسم العميل', 'Customer name')}
              style={{ width: '100%' }}
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                setPageNumber(1);
              }}
            />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{t('الحالة', 'Status')}</label>
            <Select
              allowClear
              size="large"
              placeholder={t('الحالة', 'Status')}
              style={{ width: '100%' }}
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPageNumber(1);
              }}
              options={HOURLY_REQUEST_STATUSES.map((s) => ({
                value: s.value,
                label: isAr ? s.ar : s.en,
              }))}
            />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{t('هاتف العميل', 'Customer phone')}</label>
            <Input
              allowClear
              size="large"
              placeholder={t('هاتف العميل', 'Customer phone')}
              style={{ width: '100%' }}
              value={customerPhone}
              onChange={(e) => { setCustomerPhone(e.target.value); setPageNumber(1); }}
            />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{t('مدينة الخدمة', 'Service city')}</label>
            <Input
              allowClear
              size="large"
              placeholder={t('مدينة الخدمة', 'Service city')}
              style={{ width: '100%' }}
              value={serviceCity}
              onChange={(e) => { setServiceCity(e.target.value); setPageNumber(1); }}
            />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{t('حي الخدمة', 'Service district')}</label>
            <Input
              allowClear
              size="large"
              placeholder={t('حي الخدمة', 'Service district')}
              style={{ width: '100%' }}
              value={serviceDistrict}
              onChange={(e) => { setServiceDistrict(e.target.value); setPageNumber(1); }}
            />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{t('الباقة', 'Package')}</label>
            <Select
              allowClear
              showSearch
              size="large"
              placeholder={t('الباقة', 'Package')}
              style={{ width: '100%' }}
              optionFilterProp="label"
              value={packageId}
              onChange={(v) => { setPackageId(v); setPageNumber(1); }}
              options={packageOptions.map((p) => ({ value: p.id, label: isAr ? p.nameAr : p.nameEn }))}
            />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{t('منطقة الخدمة', 'Serving area')}</label>
            <Select
              allowClear
              showSearch
              size="large"
              placeholder={t('منطقة الخدمة', 'Serving area')}
              style={{ width: '100%' }}
              optionFilterProp="label"
              value={servingAreaId}
              onChange={(v) => { setServingAreaId(v); setPageNumber(1); }}
              options={servingAreaOptions.map((a) => ({ value: a.id, label: isAr ? a.nameAr : a.nameEn }))}
            />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{t('حالة الدفع', 'Payment status')}</label>
            <Select
              allowClear
              size="large"
              placeholder={t('حالة الدفع', 'Payment status')}
              style={{ width: '100%' }}
              value={paymentStatus}
              onChange={(v) => { setPaymentStatus(v); setPageNumber(1); }}
              options={Object.entries(ORDER_PAYMENT_STATUS).map(([val, def]) => ({
                value: Number(val),
                label: isAr ? def.ar : def.en,
              }))}
            />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{t('تاريخ الإنشاء', 'Created date')}</label>
            <DateRangeFilter
              value={createdRange}
              onChange={(r) => { setCreatedRange(r); setPageNumber(1); }}
              placeholder={[t('إنشاء من', 'Created from'), t('إنشاء إلى', 'Created to')]}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{t('تاريخ آخر تحديث', 'Updated date')}</label>
            <DateRangeFilter
              value={updatedRange}
              onChange={(r) => { setUpdatedRange(r); setPageNumber(1); }}
              placeholder={[t('تحديث من', 'Updated from'), t('تحديث إلى', 'Updated to')]}
              style={{ width: '100%' }}
            />
          </Col>
        </Row>
      </AdvancedFilterPanel>

      {/* ── Table Card ─────────────────────────────────────────── */}
      <Card className={styles.tableCard}>
        <Table<HourlyWorkerRequest>
          rowKey="id"
          columns={columns}
          dataSource={requests}
          loading={isLoading}
          size="middle"
          bordered
          scroll={{ x: 1100 }}
          locale={{ emptyText: <Empty description={t('لا توجد طلبات', 'No requests')} /> }}
          onChange={(_, __, sorter) => {
            const s = Array.isArray(sorter) ? sorter[0] : sorter;
            if (s?.order) {
              setSortBy(s.columnKey as 'ticketNumber' | 'customerName' | 'requestDate' | 'status' | 'createdDate');
              setSortDescending(s.order === 'descend');
            } else {
              setSortBy('createdDate');
              setSortDescending(true);
            }
            setPageNumber(1);
          }}
          pagination={{
            current: pageNumber,
            pageSize: PAGE_SIZE,
            total: totalCount,
            onChange: setPageNumber,
            showTotal: (n) => t(`الإجمالي: ${n}`, `Total: ${n}`),
          }}
        />
      </Card>

      {/* ── Assign Worker Modal (quick action) ─────────────────── */}
      <Modal
        title={t('تعيين عامل', 'Assign Worker')}
        open={!!assignFor}
        onCancel={() => setAssignFor(null)}
        onOk={submitAssign}
        okText={t('تعيين', 'Assign')}
        cancelText={t('إلغاء', 'Cancel')}
        confirmLoading={actions.assign.isPending}
        destroyOnHidden
      >
        <p style={{ color: '#6b7280', marginBottom: 12 }}>
          {t(
            'اختر عاملاً واحداً نشطاً. للحصول على توصيات حسب التوفر افتح صفحة التفاصيل.',
            'Select one active worker. For availability-ranked recommendations, open the order detail page.'
          )}
        </p>
        <Form form={assignForm} layout="vertical">
          <Form.Item
            name="workerId"
            label={t('العامل', 'Worker')}
            rules={[{ required: true, message: t('يجب اختيار عامل', 'Please select a worker') }]}
          >
            <Select
              size="large"
              showSearch
              optionFilterProp="label"
              loading={isWorkersLoading}
              placeholder={t('اختر العامل', 'Select worker')}
              options={eligibleWorkers.map((w) => ({
                value: w.id,
                label: `${w.fullName} — ${w.phoneNumber}`,
                worker: w,
              }))}
              optionRender={(opt) => {
                const w = (opt.data as { worker: (typeof eligibleWorkers)[number] }).worker;
                return (
                  <Space>
                    <span>{w.fullName}</span>
                    <span className={styles.assignmentPhone}>{w.phoneNumber}</span>
                    {w.isAvailableNow ? (
                      <Tag color="cyan">{t('متاح الآن', 'Available')}</Tag>
                    ) : (
                      <Tag color="default">{t('غير متاح', 'Unavailable')}</Tag>
                    )}
                  </Space>
                );
              }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Reject Modal ───────────────────────────────────────── */}
      <Modal
        title={t('رفض الطلب', 'Reject Request')}
        open={!!rejectFor}
        onCancel={() => setRejectFor(null)}
        onOk={submitReject}
        okText={t('رفض', 'Reject')}
        okButtonProps={{ danger: true }}
        cancelText={t('إلغاء', 'Cancel')}
        confirmLoading={actions.reject.isPending}
        destroyOnHidden
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item name="notes" label={t('سبب الرفض (اختياري)', 'Reason for rejection (optional)')}>
            <Input.TextArea rows={3} maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
