'use client';

import { useMemo, useState } from 'react';
import {
  Card,
  Table,
  Input,
  Select,
  Button,
  Tag,
  Space,
  Tooltip,
  DatePicker,
  Drawer,
  Modal,
  Form,
  Timeline,
  Empty,
  Spin,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
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
  PhoneOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import {
  useHourlyWorkerRequests,
  useHourlyWorkerRequest,
  useHourlyWorkerRequestActions,
} from '@/hooks/api/useHourlyWorkers';
import { useHourlyWorkers } from '@/hooks/api/useHourlyWorkers';
import { useAuthStore } from '@/store/authStore';
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
import styles from '../hourly-workers.module.css';

const { RangePicker } = DatePicker;
const PAGE_SIZE = 10;

function fmtTime(v?: string | null): string {
  if (!v) return '—';
  return v.length >= 5 ? v.slice(0, 5) : v;
}

function StatusTag({ status, isAr }: { status: HourlyRequestStatus; isAr: boolean }) {
  const opt = getStatusOption(status);
  return <Tag color={opt?.color ?? 'default'}>{getStatusLabel(status, isAr)}</Tag>;
}

export default function HourlyWorkerRequestsPage() {
  const language = useAuthStore((state) => state.language);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  // ── Filters ─────────────────────────────────────────────────
  const [ticketNumber, setTicketNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [status, setStatus] = useState<HourlyRequestStatus | undefined>();
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  const { data, isLoading, isFetching, refetch } = useHourlyWorkerRequests({
    ticketNumber: ticketNumber || undefined,
    customerName: customerName || undefined,
    status,
    dateFrom: range?.[0]?.startOf('day').toISOString(),
    dateTo: range?.[1]?.endOf('day').toISOString(),
    pageNumber,
    pageSize: PAGE_SIZE,
  });

  const requests = useMemo(() => data?.items ?? [], [data]);
  const totalCount = data?.totalCount ?? 0;

  // ── Detail drawer ───────────────────────────────────────────
  const [detailId, setDetailId] = useState<string | null>(null);
  const { data: detail, isLoading: isDetailLoading } = useHourlyWorkerRequest(detailId ?? undefined);

  const actions = useHourlyWorkerRequestActions();

  // ── Assign modal ────────────────────────────────────────────
  const [assignFor, setAssignFor] = useState<HourlyWorkerRequest | null>(null);
  const [assignForm] = Form.useForm();
  // Only active workers are eligible; show availability indicator.
  const { data: workerData, isLoading: isWorkersLoading } = useHourlyWorkers({
    isActive: true,
    pageSize: 100,
  });
  const eligibleWorkers = workerData?.items ?? [];

  // ── Reject modal ────────────────────────────────────────────
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

  const renderActionButtons = (req: HourlyWorkerRequest, size: 'small' | 'middle' = 'small') => {
    const available = ACTIONS_BY_STATUS[req.status] ?? [];
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
          size={size}
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
      render: (v: string, record) => (
        <a className={styles.docNumber} onClick={() => setDetailId(record.id)}>
          {v}
        </a>
      ),
    },
    {
      title: t('العميل', 'Customer'),
      dataIndex: 'customerName',
      key: 'customerName',
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
      render: (v: HourlyRequestStatus) => <StatusTag status={v} isAr={isAr} />,
    },
    {
      title: t('إجراءات', 'Actions'),
      key: 'actions',
      width: 260,
      fixed: 'right',
      render: (_, record) =>
        isTerminalStatus(record.status) ? (
          <Tooltip title={t('عرض', 'View')}>
            <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => setDetailId(record.id)} />
          </Tooltip>
        ) : (
          <Space size={4} wrap>
            {renderActionButtons(record)}
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

      {/* ── Table Card ─────────────────────────────────────────── */}
      <Card className={styles.tableCard}>
        <div className={styles.filters}>
          <Input
            allowClear
            size="large"
            prefix={<SearchOutlined />}
            placeholder={t('رقم التذكرة', 'Ticket number')}
            className={styles.filterSelect}
            value={ticketNumber}
            onChange={(e) => {
              setTicketNumber(e.target.value);
              setPageNumber(1);
            }}
          />
          <Input
            allowClear
            size="large"
            prefix={<SearchOutlined />}
            placeholder={t('اسم العميل', 'Customer name')}
            className={styles.filterSelect}
            value={customerName}
            onChange={(e) => {
              setCustomerName(e.target.value);
              setPageNumber(1);
            }}
          />
          <Select
            allowClear
            size="large"
            placeholder={t('الحالة', 'Status')}
            className={styles.filterSelect}
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
          <RangePicker
            size="large"
            className={styles.filterDate}
            onChange={(dates) => {
              setRange(dates as [Dayjs | null, Dayjs | null] | null);
              setPageNumber(1);
            }}
          />
        </div>

        <Table<HourlyWorkerRequest>
          rowKey="id"
          columns={columns}
          dataSource={requests}
          loading={isLoading}
          size="middle"
          bordered
          scroll={{ x: 1100 }}
          locale={{ emptyText: <Empty description={t('لا توجد طلبات', 'No requests')} /> }}
          pagination={{
            current: pageNumber,
            pageSize: PAGE_SIZE,
            total: totalCount,
            onChange: setPageNumber,
            showTotal: (n) => t(`الإجمالي: ${n}`, `Total: ${n}`),
          }}
        />
      </Card>

      {/* ── Detail Drawer ──────────────────────────────────────── */}
      <Drawer
        title={
          detail ? (
            <Space>
              <span>{detail.ticketNumber}</span>
              <StatusTag status={detail.status} isAr={isAr} />
            </Space>
          ) : (
            t('تفاصيل الطلب', 'Request Details')
          )
        }
        open={!!detailId}
        onClose={() => setDetailId(null)}
        width={560}
      >
        {isDetailLoading || !detail ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin />
          </div>
        ) : (
          <>
            {/* Action panel / read-only note */}
            {isTerminalStatus(detail.status) ? (
              <div className={styles.readOnlyNote}>
                {t('هذا الطلب للقراءة فقط ولا يمكن تعديله.', 'This request is read-only and cannot be modified.')}
              </div>
            ) : (
              <div className={styles.actionPanel}>{renderActionButtons(detail, 'middle')}</div>
            )}

            {/* Customer / request facts */}
            <div className={styles.facts}>
              <div className={styles.factItem}>
                <div className={styles.factLabel}>{t('العميل', 'Customer')}</div>
                <div className={styles.factValue}>{detail.customerName}</div>
              </div>
              <div className={styles.factItem}>
                <div className={styles.factLabel}>
                  <PhoneOutlined /> {t('الهاتف', 'Phone')}
                </div>
                <div className={styles.factValue}>{detail.customerPhone}</div>
              </div>
              <div className={styles.factItem} style={{ gridColumn: '1 / -1' }}>
                <div className={styles.factLabel}>
                  <EnvironmentOutlined /> {t('العنوان', 'Address')}
                </div>
                <div className={styles.factValue}>{detail.customerAddress || '—'}</div>
              </div>
              <div className={styles.factItem}>
                <div className={styles.factLabel}>{t('تاريخ الطلب', 'Request Date')}</div>
                <div className={styles.factValue}>{dayjs(detail.requestDate).format('YYYY-MM-DD')}</div>
              </div>
              <div className={styles.factItem}>
                <div className={styles.factLabel}>
                  <ClockCircleOutlined /> {t('الوقت', 'Time')}
                </div>
                <div className={styles.factValue}>
                  {fmtTime(detail.requestedStartTime)} – {fmtTime(detail.requestedEndTime)}
                </div>
              </div>
              <div className={styles.factItem}>
                <div className={styles.factLabel}>{t('عدد العمال', 'Workers Needed')}</div>
                <div className={styles.factValue}>
                  {detail.assignedWorkersCount} / {detail.numberOfWorkers}
                </div>
              </div>
            </div>
            {detail.notes && <div className={styles.notesBox}>{detail.notes}</div>}

            {/* Assignments */}
            <div className={styles.sectionTitle}>
              {t('العمال المعينون', 'Assigned Workers')} ({detail.assignments.length})
            </div>
            {detail.assignments.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('لم يتم تعيين عمال بعد', 'No workers assigned yet')} />
            ) : (
              detail.assignments.map((a) => (
                <div key={a.id} className={styles.assignmentRow}>
                  <UserAddOutlined style={{ color: '#1677ff' }} />
                  <div style={{ flex: 1 }}>
                    <div className={styles.assignmentName}>{a.workerName}</div>
                    <div className={styles.assignmentPhone}>{a.workerPhone}</div>
                  </div>
                  <span className={styles.muted}>{dayjs(a.assignedDate).format('YYYY-MM-DD HH:mm')}</span>
                </div>
              ))
            )}

            {/* History */}
            <div className={styles.sectionTitle}>
              <HistoryOutlined /> {t('سجل الحالة', 'Status History')}
            </div>
            {detail.history.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('لا يوجد سجل', 'No history')} />
            ) : (
              <Timeline
                items={detail.history.map((h) => ({
                  color: getStatusOption(h.newStatus as HourlyRequestStatus)?.color ?? 'blue',
                  children: (
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {h.oldStatusName ? `${h.oldStatusName} → ` : ''}
                        {h.newStatusName}
                      </div>
                      {h.notes && <div style={{ fontSize: 12.5, color: '#6b7280' }}>{h.notes}</div>}
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>
                        {dayjs(h.changedAt).format('YYYY-MM-DD HH:mm')} ·{' '}
                        {h.changedBy === 'Mobile' ? t('التطبيق', 'Mobile') : t('لوحة التحكم', 'Dashboard')}
                      </div>
                    </div>
                  ),
                }))}
              />
            )}
          </>
        )}
      </Drawer>

      {/* ── Assign Worker Modal ────────────────────────────────── */}
      <Modal
        title={t('تعيين عامل', 'Assign Worker')}
        open={!!assignFor}
        onCancel={() => setAssignFor(null)}
        onOk={submitAssign}
        okText={t('تعيين', 'Assign')}
        cancelText={t('إلغاء', 'Cancel')}
        confirmLoading={actions.assign.isPending}
        destroyOnClose
      >
        <p style={{ color: '#6b7280', marginBottom: 12 }}>
          {t(
            'اختر عاملاً واحداً نشطاً. يُفضّل اختيار عامل متاح الآن.',
            'Select one active worker. Prefer a worker who is available now.'
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
                const w = (opt.data as any).worker;
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
        destroyOnClose
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
