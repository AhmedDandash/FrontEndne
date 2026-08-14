'use client';

/**
 * Hourly Order detail — the primary order-review screen.
 * Uses GET /HourlyWorkerRequests/{id}/Detail plus the per-tab sub-resource
 * endpoints (Timeline, Logs, Payments, Assignments, Invoices, Accommodation,
 * Tracking). Drives the full lifecycle (approve/reject/assign/driver/etc.).
 */

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  Tabs,
  Button,
  Tag,
  Space,
  Spin,
  Empty,
  Timeline,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Tooltip,
  Popconfirm,
  Descriptions,
  Result,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  UserAddOutlined,
  CarOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  StopOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  FileTextOutlined,
  DollarOutlined,
  HomeOutlined,
  AimOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useHourlyPermissions } from '@/hooks/useHourlyPermissions';
import {
  useHourlyOrderDetail,
  useHourlyOrderTimeline,
  useHourlyOrderLogs,
  useHourlyOrderPayments,
  useHourlyOrderAssignments,
  useOrderInvoices,
  useOrderAccommodation,
  useOrderTracking,
  useHourlyOrderActions,
} from '@/hooks/api/useHourlyOrders';
import {
  ACTIONS_BY_STATUS,
  HourlyOrderPaymentStatus,
  getStatusOption,
  getStatusLabel,
  isTerminalStatus,
  type HourlyRequestAction,
} from '@/types/hourly-worker.types';
import {
  fmtTime,
  fmtMoney,
  EnumTag,
  ORDER_PAYMENT_STATUS,
  PAYMENT_RECORD_STATUS,
  PAYMENT_METHOD,
  WORKER_ASSIGNMENT_STATUS,
  DRIVER_ASSIGNMENT_STATUS,
  ACCOMMODATION_STATUS,
} from '../../_lib/hourlyDisplay';
import TransferProofPanel from '../../_components/TransferProofPanel';
import AssignWorkerModal from '../../_components/AssignWorkerModal';
import AssignDriverModal from '../../_components/AssignDriverModal';
import styles from '../../hourly-workers.module.css';

export default function HourlyOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id ?? '');

  const language = useAuthStore((s) => s.language);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const perms = useHourlyPermissions();

  const { data: order, isLoading } = useHourlyOrderDetail(id);
  const actions = useHourlyOrderActions(id);

  const [assignOpen, setAssignOpen] = useState(false);
  const [driverOpen, setDriverOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [statusFor, setStatusFor] = useState<{ assignmentId: string } | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [accomOpen, setAccomOpen] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [accomStatusFor, setAccomStatusFor] = useState<{ accommodationId: string } | null>(null);

  const [rejectForm] = Form.useForm();
  const [noteForm] = Form.useForm();
  const [statusForm] = Form.useForm();
  const [invoiceForm] = Form.useForm();
  const [accomForm] = Form.useForm();
  const [trackingForm] = Form.useForm();
  const [accomStatusForm] = Form.useForm();

  const remaining = useMemo(
    () => (order ? Math.max(0, order.numberOfWorkers - order.assignedWorkersCount) : 0),
    [order]
  );

  // Approve requires payment when the order has a balance (spec §4.10).
  const approveBlocked =
    !!order &&
    order.totalAmount > 0 &&
    order.paymentStatus !== HourlyOrderPaymentStatus.Paid;

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!order) {
    return (
      <Result
        status="404"
        title={t('الطلب غير موجود', 'Order not found')}
        extra={
          <Button type="primary" onClick={() => router.push('/hourly-workers/requests')}>
            {t('العودة للطلبات', 'Back to requests')}
          </Button>
        }
      />
    );
  }

  const statusOpt = getStatusOption(order.status);

  // ── Action bar ────────────────────────────────────────────────────────────
  const runAction = (a: HourlyRequestAction) => {
    switch (a) {
      case 'approve':
        actions.approve.mutateAsync().catch(() => {});
        break;
      case 'reject':
        rejectForm.resetFields();
        setRejectOpen(true);
        break;
      case 'assign':
        setAssignOpen(true);
        break;
      case 'inProgress':
        actions.markInProgress.mutateAsync().catch(() => {});
        break;
      case 'complete':
        actions.complete.mutateAsync().catch(() => {});
        break;
      case 'cancel':
        Modal.confirm({
          title: t('إلغاء الطلب؟', 'Cancel order?'),
          content: t('لا يمكن التراجع عن هذا الإجراء.', 'This action cannot be undone.'),
          okText: t('إلغاء الطلب', 'Cancel Order'),
          okButtonProps: { danger: true },
          cancelText: t('رجوع', 'Back'),
          onOk: () => actions.cancel.mutateAsync().catch(() => {}),
        });
        break;
    }
  };

  const ACTION_META: Record<
    HourlyRequestAction,
    { ar: string; en: string; icon: React.ReactNode; danger?: boolean; primary?: boolean }
  > = {
    approve: { ar: 'موافقة', en: 'Approve', icon: <CheckOutlined />, primary: true },
    reject: { ar: 'رفض', en: 'Reject', icon: <CloseOutlined />, danger: true },
    assign: { ar: 'تعيين عمال', en: 'Assign Workers', icon: <UserAddOutlined />, primary: true },
    inProgress: { ar: 'بدء التنفيذ', en: 'Mark In Progress', icon: <PlayCircleOutlined />, primary: true },
    complete: { ar: 'إكمال', en: 'Mark Completed', icon: <CheckCircleOutlined />, primary: true },
    cancel: { ar: 'إلغاء', en: 'Cancel', icon: <StopOutlined />, danger: true },
  };

  const availableActions = (ACTIONS_BY_STATUS[order.status] ?? []).filter((a) => {
    if (a === 'assign') return perms.canAssignWorkers;
    return perms.canManageOrders;
  });

  const renderActionBar = () => {
    if (isTerminalStatus(order.status)) {
      return (
        <div className={styles.readOnlyNote}>
          {t('هذا الطلب للقراءة فقط ولا يمكن تعديله.', 'This order is read-only and cannot be modified.')}
        </div>
      );
    }
    return (
      <div className={styles.actionPanel}>
        {availableActions.map((a) => {
          const meta = ACTION_META[a];
          const isApprove = a === 'approve';
          const disabled = isApprove && approveBlocked;
          const loading =
            (a === 'approve' && actions.approve.isPending) ||
            (a === 'inProgress' && actions.markInProgress.isPending) ||
            (a === 'complete' && actions.complete.isPending) ||
            (a === 'cancel' && actions.cancel.isPending);
          const btn = (
            <Button
              key={a}
              type={meta.primary ? 'primary' : 'default'}
              danger={meta.danger}
              icon={meta.icon}
              loading={loading}
              disabled={disabled}
              onClick={() => runAction(a)}
            >
              {t(meta.ar, meta.en)}
            </Button>
          );
          return disabled ? (
            <Tooltip
              key={a}
              title={t('يجب أن يكون الطلب مدفوعاً قبل الموافقة', 'Order must be paid before approval')}
            >
              <span>{btn}</span>
            </Tooltip>
          ) : (
            btn
          );
        })}
        {/* Assign driver — only when the order needs one */}
        {order.requiresDriver && !order.driverAssignment && perms.canAssignDrivers && (
          <Button icon={<CarOutlined />} onClick={() => setDriverOpen(true)}>
            {t('تعيين سائق', 'Assign Driver')}
          </Button>
        )}
        {perms.canManageOrders && (
          <Button icon={<EditOutlined />} onClick={() => { noteForm.resetFields(); setNoteOpen(true); }}>
            {t('إضافة ملاحظة', 'Add Note')}
          </Button>
        )}
      </div>
    );
  };

  // ── Tab: Summary ──────────────────────────────────────────────────────────
  const summaryTab = (
    <div className={styles.detailGrid}>
      <Card size="small" title={t('بيانات العميل', 'Customer')} className={styles.detailCard}>
        <Descriptions column={1} size="small">
          <Descriptions.Item label={t('الاسم', 'Name')}>{order.customerName}</Descriptions.Item>
          <Descriptions.Item label={<><PhoneOutlined /> {t('الهاتف', 'Phone')}</>}>
            {order.customerPhone}
          </Descriptions.Item>
          <Descriptions.Item label={<><EnvironmentOutlined /> {t('العنوان', 'Address')}</>}>
            {order.customerAddress || '—'}
          </Descriptions.Item>
          <Descriptions.Item label={t('المدينة / الحي', 'City / District')}>
            {[order.serviceCity, order.serviceDistrict].filter(Boolean).join(' · ') || '—'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card size="small" title={t('تفاصيل الخدمة', 'Service')} className={styles.detailCard}>
        <Descriptions column={1} size="small">
          <Descriptions.Item label={t('الباقة', 'Package')}>{order.packageName || '—'}</Descriptions.Item>
          <Descriptions.Item label={t('التاريخ', 'Date')}>
            {dayjs(order.requestDate).format('YYYY-MM-DD')}
          </Descriptions.Item>
          <Descriptions.Item label={<><ClockCircleOutlined /> {t('الوقت', 'Time')}</>}>
            {fmtTime(order.requestedStartTime)} – {fmtTime(order.requestedEndTime)}
          </Descriptions.Item>
          <Descriptions.Item label={t('العمال', 'Workers')}>
            {order.assignedWorkersCount} / {order.numberOfWorkers}
            {remaining > 0 && (
              <Tag color="orange" style={{ marginInlineStart: 8 }}>
                {t(`متبقي ${remaining}`, `${remaining} more`)}
              </Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label={t('يتطلب سائق', 'Requires Driver')}>
            {order.requiresDriver ? t('نعم', 'Yes') : t('لا', 'No')}
          </Descriptions.Item>
          <Descriptions.Item label={t('يتطلب سكن', 'Requires Accommodation')}>
            {order.requiresAccommodation ? t('نعم', 'Yes') : t('لا', 'No')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card size="small" title={t('التسعير', 'Pricing')} className={styles.detailCard}>
        <Descriptions column={1} size="small">
          <Descriptions.Item label={t('الإجمالي الفرعي', 'Subtotal')}>{fmtMoney(order.subTotal)}</Descriptions.Item>
          <Descriptions.Item label={t('الضريبة', 'Tax')}>{fmtMoney(order.taxAmount)}</Descriptions.Item>
          <Descriptions.Item label={t('الخصم', 'Discount')}>{fmtMoney(order.discountAmount)}</Descriptions.Item>
          <Descriptions.Item label={t('الإجمالي', 'Total')}>
            <strong>{fmtMoney(order.totalAmount)}</strong>
          </Descriptions.Item>
          <Descriptions.Item label={t('حالة الدفع', 'Payment Status')}>
            <EnumTag map={ORDER_PAYMENT_STATUS} value={order.paymentStatus} isAr={isAr} />
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {order.transferProofUrl && (
        <Card size="small" className={styles.detailCard} style={{ gridColumn: '1 / -1' }}>
          <TransferProofPanel
            transferProofUrl={order.transferProofUrl}
            paymentMethodName={order.payments?.[0]?.paymentMethodName}
            transactionReference={order.payments?.[0]?.transactionReference}
            amount={order.totalAmount}
            isAr={isAr}
          />
        </Card>
      )}

      {order.internalNotes && (
        <Card size="small" title={t('ملاحظات داخلية', 'Internal Notes')} className={styles.detailCard} style={{ gridColumn: '1 / -1' }}>
          <div className={styles.notesBox}>{order.internalNotes}</div>
        </Card>
      )}
    </div>
  );

  // ── Tab: Assignments ──────────────────────────────────────────────────────
  const AssignmentsTab = () => {
    const { data: assignments, isLoading: loadingA } = useHourlyOrderAssignments(id);
    const cols: ColumnsType<NonNullable<typeof assignments>[number]> = [
      { title: t('العامل', 'Worker'), dataIndex: 'workerName', key: 'workerName',
        render: (v, r) => (<div><div className={styles.assignmentName}>{v}</div><div className={styles.assignmentPhone}>{r.workerPhone}</div></div>) },
      { title: t('الحالة', 'Status'), dataIndex: 'assignmentStatus', key: 'status', width: 150,
        render: (v) => <EnumTag map={WORKER_ASSIGNMENT_STATUS} value={v} isAr={isAr} /> },
      { title: t('تم التأكيد', 'Confirmed'), dataIndex: 'confirmedAt', key: 'confirmedAt', width: 150,
        render: (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '—') },
      { title: t('ملاحظات', 'Notes'), dataIndex: 'notes', key: 'notes', render: (v) => v || '—' },
      ...(perms.canManageOrders
        ? [{
            title: t('إجراءات', 'Actions'), key: 'actions', width: 140,
            render: (_: unknown, r: NonNullable<typeof assignments>[number]) => (
              <Space size={2}>
                <Tooltip title={t('تحديث الحالة', 'Update status')}>
                  <Button size="small" type="text" icon={<EditOutlined />}
                    onClick={() => { statusForm.setFieldsValue({ status: r.assignmentStatus, notes: r.notes }); setStatusFor({ assignmentId: r.id }); }} />
                </Tooltip>
                <Popconfirm title={t('إلغاء تعيين العامل؟', 'Unassign worker?')} okText={t('نعم', 'Yes')} cancelText={t('لا', 'No')}
                  okButtonProps={{ danger: true, loading: actions.unassign.isPending }}
                  onConfirm={() => actions.unassign.mutateAsync(r.id).catch(() => {})}>
                  <Tooltip title={t('إلغاء التعيين', 'Unassign')}>
                    <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                  </Tooltip>
                </Popconfirm>
              </Space>
            ),
          }]
        : []),
    ];
    return (
      <>
        {/* Driver section */}
        <Card size="small" title={<><CarOutlined /> {t('السائق', 'Driver')}</>} style={{ marginBottom: 16 }}>
          {order.driverAssignment ? (
            <Descriptions column={2} size="small">
              <Descriptions.Item label={t('الاسم', 'Name')}>{order.driverAssignment.driverName}</Descriptions.Item>
              <Descriptions.Item label={t('الهاتف', 'Phone')}>{order.driverAssignment.driverPhone}</Descriptions.Item>
              <Descriptions.Item label={t('الحالة', 'Status')}>
                <EnumTag map={DRIVER_ASSIGNMENT_STATUS} value={order.driverAssignment.status} isAr={isAr} />
              </Descriptions.Item>
              <Descriptions.Item label={t('تاريخ التعيين', 'Assigned')}>
                {dayjs(order.driverAssignment.assignedDate).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>
          ) : order.requiresDriver ? (
            <Space>
              <span className={styles.muted}>{t('لم يتم تعيين سائق', 'No driver assigned')}</span>
              {perms.canAssignDrivers && !isTerminalStatus(order.status) && (
                <Button size="small" icon={<CarOutlined />} onClick={() => setDriverOpen(true)}>
                  {t('تعيين سائق', 'Assign Driver')}
                </Button>
              )}
            </Space>
          ) : (
            <span className={styles.muted}>{t('هذا الطلب لا يتطلب سائقاً', 'This order does not require a driver')}</span>
          )}
        </Card>

        <Table
          rowKey="id"
          size="small"
          bordered
          loading={loadingA}
          columns={cols}
          dataSource={assignments ?? []}
          pagination={false}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('لا يوجد عمال معينون', 'No workers assigned')} /> }}
        />
      </>
    );
  };

  // ── Tab: Timeline ─────────────────────────────────────────────────────────
  const TimelineTab = () => {
    const { data: tl, isLoading: l } = useHourlyOrderTimeline(id);
    if (l) return <Spin />;
    if (!tl || tl.length === 0) return <Empty description={t('لا توجد أحداث', 'No events')} />;
    return (
      <Timeline
        items={tl.map((e) => ({
          children: (
            <div>
              <div style={{ fontWeight: 600 }}>{e.title}</div>
              {e.description && <div style={{ fontSize: 12.5, color: '#6b7280' }}>{e.description}</div>}
              <div style={{ fontSize: 12, color: '#9ca3af' }}>{dayjs(e.occurredAt).format('YYYY-MM-DD HH:mm')}</div>
            </div>
          ),
        }))}
      />
    );
  };

  // ── Tab: Logs ─────────────────────────────────────────────────────────────
  const LogsTab = () => {
    const { data: logs, isLoading: l } = useHourlyOrderLogs(id);
    const cols: ColumnsType<NonNullable<typeof logs>[number]> = [
      { title: t('الإجراء', 'Action'), dataIndex: 'action', key: 'action' },
      { title: t('التفاصيل', 'Details'), dataIndex: 'details', key: 'details', render: (v) => v || '—' },
      { title: t('بواسطة', 'By'), dataIndex: 'performedBy', key: 'performedBy', width: 160, render: (v) => v || '—' },
      { title: t('الوقت', 'Time'), dataIndex: 'occurredAt', key: 'occurredAt', width: 160, render: (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '—') },
    ];
    return <Table rowKey="id" size="small" bordered loading={l} columns={cols} dataSource={logs ?? []} pagination={false} />;
  };

  // ── Tab: Payments ─────────────────────────────────────────────────────────
  const PaymentsTab = () => {
    const { data: pays, isLoading: l } = useHourlyOrderPayments(id);
    const cols: ColumnsType<NonNullable<typeof pays>[number]> = [
      { title: t('المبلغ', 'Amount'), dataIndex: 'amount', key: 'amount', render: (v) => fmtMoney(v) },
      { title: t('الطريقة', 'Method'), dataIndex: 'paymentMethod', key: 'method', render: (v) => <EnumTag map={PAYMENT_METHOD} value={v} isAr={isAr} /> },
      { title: t('الحالة', 'Status'), dataIndex: 'status', key: 'status', render: (v) => <EnumTag map={PAYMENT_RECORD_STATUS} value={v} isAr={isAr} /> },
      { title: t('المرجع', 'Reference'), dataIndex: 'transactionReference', key: 'ref', render: (v) => v || '—' },
      { title: t('إثبات', 'Proof'), dataIndex: 'transferProofUrl', key: 'proof', width: 90,
        render: (v) => (v ? <a href={v} target="_blank" rel="noopener noreferrer">{t('عرض', 'View')}</a> : '—') },
      { title: t('تاريخ الدفع', 'Paid At'), dataIndex: 'paidAt', key: 'paidAt', width: 160, render: (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '—') },
    ];
    return <Table rowKey={(r) => r.id ?? ''} size="small" bordered loading={l} columns={cols} dataSource={pays ?? []} pagination={false} />;
  };

  // ── Tab: Invoices ─────────────────────────────────────────────────────────
  const InvoicesTab = () => {
    const { data: invs, isLoading: l } = useOrderInvoices(id);
    const cols: ColumnsType<NonNullable<typeof invs>[number]> = [
      { title: t('رقم الفاتورة', 'Invoice #'), dataIndex: 'invoiceNumber', key: 'no', render: (v) => v || '—' },
      { title: t('تاريخ الاستحقاق', 'Due Date'), dataIndex: 'dueDate', key: 'due', render: (v) => (v ? dayjs(v).format('YYYY-MM-DD') : '—') },
      { title: t('ملاحظات', 'Notes'), dataIndex: 'notes', key: 'notes', render: (v) => v || '—' },
      { title: t('تاريخ الإنشاء', 'Created'), dataIndex: 'createdDate', key: 'created', width: 160, render: (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '—') },
    ];
    return (
      <>
        {perms.canManageOrders && (
          <div style={{ marginBottom: 12, textAlign: isAr ? 'left' : 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { invoiceForm.resetFields(); setInvoiceOpen(true); }}>
              {t('إصدار فاتورة', 'Issue Invoice')}
            </Button>
          </div>
        )}
        <Table rowKey={(r) => r.id ?? ''} size="small" bordered loading={l} columns={cols} dataSource={invs ?? []} pagination={false}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('لا توجد فواتير', 'No invoices')} /> }} />
      </>
    );
  };

  // ── Tab: Accommodation ────────────────────────────────────────────────────
  const AccommodationTab = () => {
    const { data: accom, isLoading: l } = useOrderAccommodation(id);
    if (l) return <Spin />;
    if (!accom) {
      return (
        <Empty description={t('لا يوجد حجز سكن', 'No accommodation booked')}>
          {perms.canManageOrders && order.requiresAccommodation && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { accomForm.resetFields(); setAccomOpen(true); }}>
              {t('حجز سكن', 'Book Accommodation')}
            </Button>
          )}
        </Empty>
      );
    }
    return (
      <Card size="small">
        <Descriptions column={2} size="small">
          <Descriptions.Item label={t('تسجيل الدخول', 'Check-in')}>{dayjs(accom.checkInDate).format('YYYY-MM-DD')}</Descriptions.Item>
          <Descriptions.Item label={t('تسجيل الخروج', 'Check-out')}>{dayjs(accom.checkOutDate).format('YYYY-MM-DD')}</Descriptions.Item>
          <Descriptions.Item label={t('عدد العمال', 'Workers')}>{accom.numberOfWorkers}</Descriptions.Item>
          <Descriptions.Item label={t('التكلفة', 'Cost')}>{fmtMoney(accom.cost)}</Descriptions.Item>
          <Descriptions.Item label={t('الحالة', 'Status')}>
            <EnumTag map={ACCOMMODATION_STATUS} value={accom.status} isAr={isAr} />
          </Descriptions.Item>
          <Descriptions.Item label={t('ملاحظات', 'Notes')}>{accom.notes || '—'}</Descriptions.Item>
        </Descriptions>
        {perms.canManageOrders && !isTerminalStatus(order.status) && (
          <div style={{ marginTop: 12, textAlign: isAr ? 'left' : 'right' }}>
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                accomStatusForm.setFieldsValue({ status: accom.status, notes: accom.notes });
                setAccomStatusFor({ accommodationId: accom.id });
              }}
            >
              {t('تحديث الحالة', 'Update Status')}
            </Button>
          </div>
        )}
      </Card>
    );
  };

  // ── Tab: Tracking ─────────────────────────────────────────────────────────
  const TrackingTab = () => {
    const { data: tr, isLoading: l } = useOrderTracking(id);
    const trackingAction = perms.canManageOrders && !isTerminalStatus(order.status) ? (
      <div style={{ marginBottom: 12, textAlign: isAr ? 'left' : 'right' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            trackingForm.resetFields();
            trackingForm.setFieldsValue({ eventType: 0, subjectType: 0, trackingSource: 2 });
            setTrackingOpen(true);
          }}
        >
          {t('إضافة تتبع', 'Add Tracking')}
        </Button>
      </div>
    ) : null;
    if (l) return <Spin />;
    if (!tr || tr.length === 0) {
      return (
        <>
          {trackingAction}
          <Empty description={t('لا يوجد تتبع', 'No tracking data')} />
        </>
      );
    }
    return (
      <>
        {trackingAction}
        <Timeline
          items={tr.map((e) => ({
            dot: <AimOutlined />,
            children: (
              <div>
                <div style={{ fontWeight: 600 }}>{e.notes || `Event ${e.eventType}`}</div>
                {(e.latitude || e.longitude) && (
                  <div style={{ fontSize: 12.5, color: '#6b7280' }}>
                    {e.latitude}, {e.longitude}
                  </div>
                )}
                {e.recordedAt && <div style={{ fontSize: 12, color: '#9ca3af' }}>{dayjs(e.recordedAt).format('YYYY-MM-DD HH:mm')}</div>}
              </div>
            ),
          }))}
        />
      </>
    );
  };

  const tabs = [
    { key: 'summary', label: t('الملخص', 'Summary'), children: summaryTab },
    { key: 'assignments', label: t('التعيينات', 'Assignments'), children: <AssignmentsTab /> },
    { key: 'timeline', label: <><HistoryOutlined /> {t('الجدول الزمني', 'Timeline')}</>, children: <TimelineTab /> },
    { key: 'tracking', label: <><AimOutlined /> {t('التتبع', 'Tracking')}</>, children: <TrackingTab /> },
    { key: 'payments', label: <><DollarOutlined /> {t('المدفوعات', 'Payments')}</>, children: <PaymentsTab /> },
    { key: 'invoices', label: <><FileTextOutlined /> {t('الفواتير', 'Invoices')}</>, children: <InvoicesTab /> },
    { key: 'accommodation', label: <><HomeOutlined /> {t('السكن', 'Accommodation')}</>, children: <AccommodationTab /> },
    { key: 'logs', label: t('السجلات', 'Logs'), children: <LogsTab /> },
  ];

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined style={{ color: '#fff', fontSize: 18 }} />}
              onClick={() => router.push('/hourly-workers/requests')}
            />
            <div>
              <h1 className={styles.pageTitle}>
                {order.ticketNumber}{' '}
                <Tag color={statusOpt?.color ?? 'default'} style={{ marginInlineStart: 8 }}>
                  {getStatusLabel(order.status, isAr)}
                </Tag>
              </h1>
              <p className={styles.pageSubtitle}>
                {order.customerName} · {fmtMoney(order.totalAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card className={styles.tableCard} style={{ marginBottom: 16 }}>
        {renderActionBar()}
      </Card>

      <Card className={styles.tableCard}>
        <Tabs items={tabs} destroyOnHidden />
      </Card>

      {/* Assign workers modal */}
      <AssignWorkerModal
        open={assignOpen}
        orderId={id}
        remaining={remaining}
        isAr={isAr}
        loading={actions.assignWorkers.isPending}
        onClose={() => setAssignOpen(false)}
        onAssign={async (ids) => {
          try {
            await actions.assignWorkers.mutateAsync(ids);
            setAssignOpen(false);
          } catch {
            // Mutation hooks surface API errors. Keep the modal open for correction.
          }
        }}
      />

      {/* Assign driver modal */}
      <AssignDriverModal
        open={driverOpen}
        isAr={isAr}
        loading={actions.assignDriver.isPending}
        onClose={() => setDriverOpen(false)}
        onAssign={async (driverId) => {
          try {
            await actions.assignDriver.mutateAsync({ driverId });
            setDriverOpen(false);
          } catch {
            // Mutation hooks surface API errors. Keep the modal open for correction.
          }
        }}
      />

      {/* Reject modal */}
      <Modal
        title={t('رفض الطلب', 'Reject Order')}
        open={rejectOpen}
        onCancel={() => setRejectOpen(false)}
        onOk={async () => {
          try {
            const v = await rejectForm.validateFields();
            await actions.reject.mutateAsync(v.notes?.trim() || undefined);
            setRejectOpen(false);
          } catch {
            // Mutation hooks surface API errors. Keep the modal open for correction.
          }
        }}
        okText={t('رفض', 'Reject')}
        okButtonProps={{ danger: true, loading: actions.reject.isPending }}
        cancelText={t('إلغاء', 'Cancel')}
        destroyOnHidden
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item name="notes" label={t('سبب الرفض (اختياري)', 'Reason (optional)')}>
            <Input.TextArea rows={3} maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>

      {/* Internal note modal */}
      <Modal
        title={t('إضافة ملاحظة داخلية', 'Add Internal Note')}
        open={noteOpen}
        onCancel={() => setNoteOpen(false)}
        onOk={async () => {
          try {
            const v = await noteForm.validateFields();
            await actions.addInternalNote.mutateAsync({ note: v.note.trim() });
            setNoteOpen(false);
          } catch {
            // Mutation hooks surface API errors. Keep the modal open for correction.
          }
        }}
        okText={t('حفظ', 'Save')}
        okButtonProps={{ loading: actions.addInternalNote.isPending }}
        cancelText={t('إلغاء', 'Cancel')}
        destroyOnHidden
      >
        <Form form={noteForm} layout="vertical">
          <Form.Item name="note" label={t('الملاحظة', 'Note')} rules={[{ required: true, message: t('مطلوب', 'Required') }]}>
            <Input.TextArea rows={3} maxLength={1000} showCount />
          </Form.Item>
        </Form>
      </Modal>

      {/* Assignment status modal */}
      <Modal
        title={t('تحديث حالة التعيين', 'Update Assignment Status')}
        open={!!statusFor}
        onCancel={() => setStatusFor(null)}
        onOk={async () => {
          try {
            const v = await statusForm.validateFields();
            await actions.updateAssignmentStatus.mutateAsync({
              assignmentId: statusFor!.assignmentId,
              data: { status: v.status, notes: v.notes?.trim() || undefined },
            });
            setStatusFor(null);
          } catch {
            // Mutation hooks surface API errors. Keep the modal open for correction.
          }
        }}
        okText={t('حفظ', 'Save')}
        okButtonProps={{ loading: actions.updateAssignmentStatus.isPending }}
        cancelText={t('إلغاء', 'Cancel')}
        destroyOnHidden
      >
        <Form form={statusForm} layout="vertical">
          <Form.Item name="status" label={t('الحالة', 'Status')} rules={[{ required: true, message: t('مطلوب', 'Required') }]}>
            <Select
              options={Object.entries(WORKER_ASSIGNMENT_STATUS).map(([val, def]) => ({
                value: Number(val),
                label: isAr ? def.ar : def.en,
              }))}
            />
          </Form.Item>
          <Form.Item name="notes" label={t('ملاحظات (اختياري)', 'Notes (optional)')}>
            <Input.TextArea rows={2} maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Issue invoice modal */}
      <Modal
        title={t('إصدار فاتورة', 'Issue Invoice')}
        open={invoiceOpen}
        onCancel={() => setInvoiceOpen(false)}
        onOk={async () => {
          try {
            const v = await invoiceForm.validateFields();
            await actions.issueInvoice.mutateAsync({
              dueDate: v.dueDate ? (v.dueDate as Dayjs).format('YYYY-MM-DD') : undefined,
              notes: v.notes?.trim() || undefined,
            });
            setInvoiceOpen(false);
          } catch {
            // Mutation hooks surface API errors. Keep the modal open for correction.
          }
        }}
        okText={t('إصدار', 'Issue')}
        okButtonProps={{ loading: actions.issueInvoice.isPending }}
        cancelText={t('إلغاء', 'Cancel')}
        destroyOnHidden
      >
        <Form form={invoiceForm} layout="vertical">
          <Form.Item name="dueDate" label={t('تاريخ الاستحقاق', 'Due Date')}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label={t('ملاحظات (اختياري)', 'Notes (optional)')}>
            <Input.TextArea rows={2} maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Book accommodation modal */}
      <Modal
        title={t('حجز سكن', 'Book Accommodation')}
        open={accomOpen}
        onCancel={() => setAccomOpen(false)}
        onOk={async () => {
          try {
            const v = await accomForm.validateFields();
            await actions.bookAccommodation.mutateAsync({
              checkInDate: (v.checkInDate as Dayjs).format('YYYY-MM-DD'),
              checkOutDate: (v.checkOutDate as Dayjs).format('YYYY-MM-DD'),
              numberOfWorkers: v.numberOfWorkers,
              cost: v.cost,
              notes: v.notes?.trim() || undefined,
            });
            setAccomOpen(false);
          } catch {
            // Mutation hooks surface API errors. Keep the modal open for correction.
          }
        }}
        okText={t('حجز', 'Book')}
        okButtonProps={{ loading: actions.bookAccommodation.isPending }}
        cancelText={t('إلغاء', 'Cancel')}
        destroyOnHidden
      >
        <Form form={accomForm} layout="vertical" initialValues={{ numberOfWorkers: order.numberOfWorkers }}>
          <Form.Item name="checkInDate" label={t('تاريخ الدخول', 'Check-in Date')} rules={[{ required: true, message: t('مطلوب', 'Required') }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="checkOutDate" label={t('تاريخ الخروج', 'Check-out Date')} rules={[{ required: true, message: t('مطلوب', 'Required') }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="numberOfWorkers" label={t('عدد العمال', 'Number of Workers')} rules={[{ required: true, message: t('مطلوب', 'Required') }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="cost" label={t('التكلفة', 'Cost')} rules={[{ required: true, message: t('مطلوب', 'Required') }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label={t('ملاحظات (اختياري)', 'Notes (optional)')}>
            <Input.TextArea rows={2} maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Record tracking modal */}
      <Modal
        title={t('إضافة تتبع', 'Add Tracking')}
        open={trackingOpen}
        onCancel={() => setTrackingOpen(false)}
        onOk={async () => {
          try {
            const v = await trackingForm.validateFields();
            await actions.recordTracking.mutateAsync({
              eventType: v.eventType,
              subjectType: v.subjectType,
              subjectId: v.subjectId?.trim() || undefined,
              latitude: v.latitude ?? undefined,
              longitude: v.longitude ?? undefined,
              notes: v.notes?.trim() || undefined,
              device: v.device?.trim() || undefined,
              trackingSource: v.trackingSource,
            });
            setTrackingOpen(false);
          } catch {
            // Mutation hooks surface API errors. Keep the modal open for correction.
          }
        }}
        okText={t('حفظ', 'Save')}
        okButtonProps={{ loading: actions.recordTracking.isPending }}
        cancelText={t('إلغاء', 'Cancel')}
        destroyOnHidden
      >
        <Form form={trackingForm} layout="vertical">
          <Form.Item name="eventType" label={t('نوع الحدث', 'Event Type')} rules={[{ required: true, message: t('مطلوب', 'Required') }]}>
            <Select
              options={[
                { value: 0, label: t('حدث عام', 'General Event') },
                { value: 1, label: t('تعيين سائق', 'Driver Assigned') },
                { value: 2, label: t('تعيين عامل', 'Worker Assigned') },
                { value: 3, label: t('السائق في الطريق', 'Driver En Route') },
                { value: 4, label: t('السائق وصل', 'Driver Arrived') },
                { value: 5, label: t('العامل في الطريق', 'Worker En Route') },
                { value: 6, label: t('العامل وصل', 'Worker Arrived') },
                { value: 7, label: t('بدء الخدمة', 'Service Started') },
                { value: 8, label: t('اكتمال الخدمة', 'Service Completed') },
                { value: 9, label: t('اكتمل الطلب', 'Order Completed') },
                { value: 10, label: t('إلغاء الطلب', 'Order Cancelled') },
              ]}
            />
          </Form.Item>
          <Form.Item name="subjectType" label={t('الكيان', 'Subject')} rules={[{ required: true, message: t('مطلوب', 'Required') }]}>
            <Select
              options={[
                { value: 0, label: t('الطلب', 'Order') },
                { value: 1, label: t('عامل', 'Worker') },
                { value: 2, label: t('سائق', 'Driver') },
              ]}
            />
          </Form.Item>
          <Form.Item name="subjectId" label={t('معرف الكيان (اختياري)', 'Subject ID (optional)')}>
            <Input />
          </Form.Item>
          <Space style={{ display: 'flex' }} size={12}>
            <Form.Item name="latitude" label={t('خط العرض', 'Latitude')} style={{ flex: 1 }}>
              <InputNumber step={0.0001} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="longitude" label={t('خط الطول', 'Longitude')} style={{ flex: 1 }}>
              <InputNumber step={0.0001} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="device" label={t('الجهاز (اختياري)', 'Device (optional)')}>
            <Input />
          </Form.Item>
          <Form.Item name="trackingSource" hidden>
            <InputNumber />
          </Form.Item>
          <Form.Item name="notes" label={t('ملاحظات (اختياري)', 'Notes (optional)')}>
            <Input.TextArea rows={2} maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Accommodation status modal */}
      <Modal
        title={t('تحديث حالة السكن', 'Update Accommodation Status')}
        open={!!accomStatusFor}
        onCancel={() => setAccomStatusFor(null)}
        onOk={async () => {
          try {
            const v = await accomStatusForm.validateFields();
            await actions.updateAccommodationStatus.mutateAsync({
              accommodationId: accomStatusFor!.accommodationId,
              data: {
                status: v.status,
                notes: v.notes?.trim() || undefined,
              },
            });
            setAccomStatusFor(null);
          } catch {
            // Mutation hooks surface API errors. Keep the modal open for correction.
          }
        }}
        okText={t('حفظ', 'Save')}
        okButtonProps={{ loading: actions.updateAccommodationStatus.isPending }}
        cancelText={t('إلغاء', 'Cancel')}
        destroyOnHidden
      >
        <Form form={accomStatusForm} layout="vertical">
          <Form.Item name="status" label={t('الحالة', 'Status')} rules={[{ required: true, message: t('مطلوب', 'Required') }]}>
            <Select
              options={Object.entries(ACCOMMODATION_STATUS).map(([val, def]) => ({
                value: Number(val),
                label: isAr ? def.ar : def.en,
              }))}
            />
          </Form.Item>
          <Form.Item name="notes" label={t('ملاحظات (اختياري)', 'Notes (optional)')}>
            <Input.TextArea rows={2} maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
