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
  Popconfirm,
  Drawer,
  Form,
  Modal,
  Empty,
  InputNumber,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  CarOutlined,
  ReloadOutlined,
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  StopOutlined,
  PhoneOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { AdvancedFilterPanel } from '@/components/filters';
import {
  useHourlyDrivers,
  useHourlyDriverMutations,
  useHourlyDriverOrders,
} from '@/hooks/api/useHourlyDrivers';
import { useHourlyPermissions } from '@/hooks/useHourlyPermissions';
import { useAuthStore } from '@/store/authStore';
import type {
  HourlyDriver,
  HourlyDriverOrder,
  CreateHourlyDriverDto,
} from '@/types/hourly-worker.types';
import { DRIVER_ASSIGNMENT_STATUS, EnumTag, fmtTime } from '../_lib/hourlyDisplay';
import styles from '../hourly-workers.module.css';

const PAGE_SIZE = 10;

export default function HourlyDriversPage() {
  const language = useAuthStore((s) => s.language);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const perms = useHourlyPermissions();
  const canWrite = perms.isFullAccess;

  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState<boolean | undefined>();
  const [sortBy, setSortBy] = useState<'fullName' | 'createdDate'>('createdDate');
  const [sortDescending, setSortDescending] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);

  const { data, isLoading, isFetching, refetch } = useHourlyDrivers({
    search: search || undefined,
    isActive,
    sortBy,
    sortDescending,
    pageNumber,
    pageSize: PAGE_SIZE,
  });
  const drivers = useMemo(() => data?.items ?? [], [data]);
  const totalCount = data?.totalCount ?? 0;

  const { create, update, remove, activate, deactivate, updateTransportStatus } =
    useHourlyDriverMutations();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HourlyDriver | null>(null);
  const [viewing, setViewing] = useState<HourlyDriver | null>(null);
  const [transportFor, setTransportFor] = useState<HourlyDriverOrder | null>(null);
  const [form] = Form.useForm();
  const [transportForm] = Form.useForm();
  const { data: driverOrders, isLoading: ordersLoading } = useHourlyDriverOrders(viewing?.id);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setFormOpen(true);
  };
  const openEdit = (d: HourlyDriver) => {
    setEditing(d);
    form.setFieldsValue({
      fullName: d.fullName,
      phoneNumber: d.phoneNumber,
      nationalId: d.nationalId,
      licenseNumber: d.licenseNumber,
      vehicleType: d.vehicleType,
      vehiclePlateNumber: d.vehiclePlateNumber,
      notes: d.notes,
    });
    setFormOpen(true);
  };
  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    form.resetFields();
  };
  const handleSubmit = async () => {
    try {
      const v = await form.validateFields();
      const dto: CreateHourlyDriverDto = {
        fullName: v.fullName.trim(),
        phoneNumber: v.phoneNumber.trim(),
        nationalId: v.nationalId?.trim() || undefined,
        licenseNumber: v.licenseNumber?.trim() || undefined,
        vehicleType: v.vehicleType?.trim() || undefined,
        vehiclePlateNumber: v.vehiclePlateNumber?.trim() || undefined,
        notes: v.notes?.trim() || undefined,
      };
      if (editing) await update.mutateAsync({ id: editing.id, data: dto });
      else await create.mutateAsync(dto);
      closeForm();
    } catch {
      // Mutation hooks surface API errors. Keep the drawer open for correction.
    }
  };

  const getOrderId = (orderRow: HourlyDriverOrder) => orderRow.orderId ?? orderRow.id;
  const getTransportStatus = (orderRow: HourlyDriverOrder) =>
    orderRow.transportStatus ??
    orderRow.driverStatus ??
    orderRow.driverAssignmentStatus ??
    orderRow.status;

  const openTransport = (orderRow: HourlyDriverOrder) => {
    setTransportFor(orderRow);
    transportForm.setFieldsValue({
      status: getTransportStatus(orderRow),
      notes: orderRow.notes,
      trackingSource: 2,
    });
  };

  const columns: ColumnsType<HourlyDriver> = [
    { title: '#', key: 'i', width: 52, render: (_, __, idx) => (pageNumber - 1) * PAGE_SIZE + idx + 1 },
    {
      title: t('الاسم', 'Name'),
      dataIndex: 'fullName',
      key: 'fullName',
      sorter: true,
      sortOrder: sortBy === 'fullName' ? (sortDescending ? 'descend' : 'ascend') : null,
    },
    { title: t('الهاتف', 'Phone'), dataIndex: 'phoneNumber', key: 'phone', width: 150,
      render: (v) => <span className={styles.assignmentPhone}>{v}</span> },
    { title: t('رقم الرخصة', 'License'), dataIndex: 'licenseNumber', key: 'lic', width: 130, render: (v) => v || '—' },
    { title: t('المركبة', 'Vehicle'), key: 'vehicle', width: 160,
      render: (_, r) => (r.vehicleType || r.vehiclePlateNumber
        ? <Space size={4}>{r.vehicleType && <Tag>{r.vehicleType}</Tag>}{r.vehiclePlateNumber && <Tag color="blue">{r.vehiclePlateNumber}</Tag>}</Space>
        : '—') },
    { title: t('الحالة', 'Status'), dataIndex: 'isActive', key: 'active', width: 100,
      render: (v) => (v ? <Tag color="green">{t('نشط', 'Active')}</Tag> : <Tag>{t('غير نشط', 'Inactive')}</Tag>) },
    ...(canWrite
      ? [{
          title: t('إجراءات', 'Actions'), key: 'actions', width: 150, fixed: 'right' as const,
          render: (_: unknown, r: HourlyDriver) => (
            <Space size={2}>
              <Tooltip title={t('الطلبات', 'Orders')}>
                <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => setViewing(r)} />
              </Tooltip>
              <Tooltip title={t('تعديل', 'Edit')}>
                <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEdit(r)} />
              </Tooltip>
              {r.isActive ? (
                <Tooltip title={t('إلغاء التفعيل', 'Deactivate')}>
                  <Button size="small" type="text" icon={<StopOutlined />} loading={deactivate.isPending} onClick={() => deactivate.mutateAsync(r.id).catch(() => {})} />
                </Tooltip>
              ) : (
                <Tooltip title={t('تفعيل', 'Activate')}>
                  <Button size="small" type="text" icon={<CheckCircleOutlined />} loading={activate.isPending} onClick={() => activate.mutateAsync(r.id).catch(() => {})} />
                </Tooltip>
              )}
              <Popconfirm title={t('حذف السائق؟', 'Delete driver?')} okText={t('حذف', 'Delete')} cancelText={t('إلغاء', 'Cancel')}
                okButtonProps={{ danger: true, loading: remove.isPending }} onConfirm={() => remove.mutateAsync(r.id).catch(() => {})}>
                <Tooltip title={t('حذف', 'Delete')}>
                  <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                </Tooltip>
              </Popconfirm>
            </Space>
          ),
        }]
      : []),
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <CarOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('السائقون', 'Drivers')}</h1>
              <p className={styles.pageSubtitle}>{t('إدارة سائقي خدمة العمل بالساعة', 'Manage hourly service drivers')}</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button icon={<ReloadOutlined spin={isFetching} />} onClick={() => refetch()} className={styles.refreshBtn}>
              {t('تحديث', 'Refresh')}
            </Button>
            {canWrite && (
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} className={styles.addBtn}>
                {t('إضافة سائق', 'New Driver')}
              </Button>
            )}
          </div>
        </div>
      </div>

      <AdvancedFilterPanel
        activeCount={isActive !== undefined ? 1 : 0}
        onClear={() => setIsActive(undefined)}
        quickFilters={
          <>
            <Input allowClear size="large" prefix={<SearchOutlined />} placeholder={t('بحث بالاسم أو الهاتف أو اللوحة', 'Search name, phone, plate')}
              className={styles.filterInput} value={search} onChange={(e) => { setSearch(e.target.value); setPageNumber(1); }} />
            <div>
              <label className={styles.filterLabel}>{t('الحالة', 'Status')}</label>
              <Select allowClear size="large" placeholder={t('الحالة', 'Status')} className={styles.filterSelect}
                value={isActive} onChange={(v) => { setIsActive(v); setPageNumber(1); }}
                options={[{ value: true, label: t('نشط', 'Active') }, { value: false, label: t('غير نشط', 'Inactive') }]} />
            </div>
          </>
        }
      />

      <Card className={styles.tableCard}>
        <Table<HourlyDriver> rowKey="id" columns={columns} dataSource={drivers} loading={isLoading} size="middle" bordered scroll={{ x: 900 }}
          onChange={(_, __, sorter) => {
            const s = Array.isArray(sorter) ? sorter[0] : sorter;
            if (s?.order) {
              setSortBy(s.columnKey as 'fullName' | 'createdDate');
              setSortDescending(s.order === 'descend');
            } else {
              setSortBy('createdDate');
              setSortDescending(true);
            }
            setPageNumber(1);
          }}
          pagination={{ current: pageNumber, pageSize: PAGE_SIZE, total: totalCount, onChange: setPageNumber, showTotal: (n) => t(`الإجمالي: ${n}`, `Total: ${n}`) }} />
      </Card>

      <Drawer title={editing ? t('تعديل السائق', 'Edit Driver') : t('إضافة سائق', 'New Driver')} open={formOpen} onClose={closeForm} width={460}
        footer={
          <Space style={{ float: isAr ? 'left' : 'right' }}>
            <Button onClick={closeForm}>{t('إلغاء', 'Cancel')}</Button>
            <Button type="primary" loading={create.isPending || update.isPending} onClick={handleSubmit}>{t('حفظ', 'Save')}</Button>
          </Space>
        }>
        <Form form={form} layout="vertical">
          <Form.Item name="fullName" label={t('الاسم الكامل', 'Full Name')} rules={[{ required: true, message: t('مطلوب', 'Required') }, { max: 200 }]}>
            <Input size="large" prefix={<CarOutlined />} maxLength={200} />
          </Form.Item>
          <Form.Item name="phoneNumber" label={t('رقم الهاتف', 'Phone Number')} rules={[{ required: true, message: t('مطلوب', 'Required') }, { max: 20 }]}>
            <Input size="large" prefix={<PhoneOutlined />} maxLength={20} />
          </Form.Item>
          <Form.Item name="nationalId" label={t('رقم الهوية (اختياري)', 'National ID (optional)')} rules={[{ max: 20 }]}>
            <Input size="large" maxLength={20} />
          </Form.Item>
          <Form.Item name="licenseNumber" label={t('رقم الرخصة', 'License Number')} rules={[{ required: true, message: t('مطلوب', 'Required') }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="vehicleType" label={t('نوع المركبة', 'Vehicle Type')}>
            <Input size="large" placeholder={t('مثال: فان', 'e.g. Van')} />
          </Form.Item>
          <Form.Item name="vehiclePlateNumber" label={t('رقم اللوحة', 'Plate Number')} rules={[{ required: true, message: t('مطلوب', 'Required') }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="notes" label={t('ملاحظات (اختياري)', 'Notes (optional)')} rules={[{ max: 1000 }]}>
            <Input.TextArea rows={3} maxLength={1000} showCount />
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title={viewing ? t(`طلبات ${viewing.fullName}`, `${viewing.fullName} Orders`) : t('طلبات السائق', 'Driver Orders')}
        open={!!viewing}
        onClose={() => setViewing(null)}
        width={760}
      >
        <Table<HourlyDriverOrder>
          rowKey={(r) => getOrderId(r) ?? r.ticketNumber ?? ''}
          size="small"
          bordered
          loading={ordersLoading}
          dataSource={driverOrders ?? []}
          pagination={false}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('لا توجد طلبات', 'No orders')} /> }}
          columns={[
            {
              title: t('التذكرة', 'Ticket'),
              dataIndex: 'ticketNumber',
              key: 'ticketNumber',
              width: 140,
              render: (v) => <span className={styles.docNumber}>{v || '—'}</span>,
            },
            {
              title: t('العميل', 'Customer'),
              dataIndex: 'customerName',
              key: 'customerName',
              render: (v, r) => (
                <div>
                  <div className={styles.assignmentName}>{v || '—'}</div>
                  {r.customerPhone && <div className={styles.assignmentPhone}>{r.customerPhone}</div>}
                </div>
              ),
            },
            {
              title: t('التاريخ', 'Date'),
              dataIndex: 'requestDate',
              key: 'requestDate',
              width: 135,
              render: (v, r) => v ? `${dayjs(v).format('YYYY-MM-DD')} ${fmtTime(r.requestedStartTime)}` : '—',
            },
            {
              title: t('حالة النقل', 'Transport'),
              key: 'transport',
              width: 140,
              render: (_, r) => <EnumTag map={DRIVER_ASSIGNMENT_STATUS} value={getTransportStatus(r)} isAr={isAr} />,
            },
            ...(canWrite
              ? [{
                  title: t('إجراءات', 'Actions'),
                  key: 'actions',
                  width: 120,
                  render: (_: unknown, r: HourlyDriverOrder) =>
                    getOrderId(r) ? (
                      <Button size="small" icon={<EditOutlined />} onClick={() => openTransport(r)}>
                        {t('تحديث', 'Update')}
                      </Button>
                    ) : (
                      <span className={styles.muted}>—</span>
                    ),
                }]
              : []),
          ]}
        />
      </Drawer>

      <Modal
        title={t('تحديث حالة النقل', 'Update Transport Status')}
        open={!!transportFor}
        onCancel={() => setTransportFor(null)}
        onOk={async () => {
          try {
            const v = await transportForm.validateFields();
            await updateTransportStatus.mutateAsync({
              driverId: viewing!.id,
              orderId: getOrderId(transportFor!)!,
              data: {
                status: v.status,
                notes: v.notes?.trim() || undefined,
                latitude: v.latitude ?? undefined,
                longitude: v.longitude ?? undefined,
                device: v.device?.trim() || undefined,
                trackingSource: v.trackingSource,
              },
            });
            setTransportFor(null);
          } catch {
            // Mutation hooks surface API errors. Keep the modal open for correction.
          }
        }}
        okText={t('حفظ', 'Save')}
        okButtonProps={{ loading: updateTransportStatus.isPending }}
        cancelText={t('إلغاء', 'Cancel')}
        destroyOnHidden
      >
        <Form form={transportForm} layout="vertical">
          <Form.Item name="status" label={t('الحالة', 'Status')} rules={[{ required: true, message: t('مطلوب', 'Required') }]}>
            <Select options={Object.entries(DRIVER_ASSIGNMENT_STATUS).map(([val, def]) => ({ value: Number(val), label: isAr ? def.ar : def.en }))} />
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
    </div>
  );
}
