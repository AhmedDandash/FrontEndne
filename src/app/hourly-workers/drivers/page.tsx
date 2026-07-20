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
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
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
  SortAscendingOutlined,
  SortDescendingOutlined,
} from '@ant-design/icons';
import { useHourlyDrivers, useHourlyDriverMutations } from '@/hooks/api/useHourlyDrivers';
import { useHourlyPermissions } from '@/hooks/useHourlyPermissions';
import { useAuthStore } from '@/store/authStore';
import type { HourlyDriver, CreateHourlyDriverDto } from '@/types/hourly-worker.types';
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

  const { create, update, remove, activate, deactivate } = useHourlyDriverMutations();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HourlyDriver | null>(null);
  const [form] = Form.useForm();

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
  };

  const columns: ColumnsType<HourlyDriver> = [
    { title: '#', key: 'i', width: 52, render: (_, __, idx) => (pageNumber - 1) * PAGE_SIZE + idx + 1 },
    { title: t('الاسم', 'Name'), dataIndex: 'fullName', key: 'fullName' },
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
              <Tooltip title={t('تعديل', 'Edit')}>
                <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEdit(r)} />
              </Tooltip>
              {r.isActive ? (
                <Tooltip title={t('إلغاء التفعيل', 'Deactivate')}>
                  <Button size="small" type="text" icon={<StopOutlined />} loading={deactivate.isPending} onClick={() => deactivate.mutate(r.id)} />
                </Tooltip>
              ) : (
                <Tooltip title={t('تفعيل', 'Activate')}>
                  <Button size="small" type="text" icon={<CheckCircleOutlined />} loading={activate.isPending} onClick={() => activate.mutate(r.id)} />
                </Tooltip>
              )}
              <Popconfirm title={t('حذف السائق؟', 'Delete driver?')} okText={t('حذف', 'Delete')} cancelText={t('إلغاء', 'Cancel')}
                okButtonProps={{ danger: true, loading: remove.isPending }} onConfirm={() => remove.mutate(r.id)}>
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

      <Card className={styles.tableCard}>
        <div className={styles.filters}>
          <Input allowClear size="large" prefix={<SearchOutlined />} placeholder={t('بحث بالاسم أو الهاتف أو اللوحة', 'Search name, phone, plate')}
            className={styles.filterInput} value={search} onChange={(e) => { setSearch(e.target.value); setPageNumber(1); }} />
          <Select allowClear size="large" placeholder={t('الحالة', 'Status')} className={styles.filterSelect}
            value={isActive} onChange={(v) => { setIsActive(v); setPageNumber(1); }}
            options={[{ value: true, label: t('نشط', 'Active') }, { value: false, label: t('غير نشط', 'Inactive') }]} />
          <Select size="large" className={styles.filterSelect}
            value={sortBy} onChange={(v) => { setSortBy(v); setPageNumber(1); }}
            options={[
              { value: 'createdDate', label: t('ترتيب: الأحدث', 'Sort: Newest') },
              { value: 'fullName', label: t('ترتيب: الاسم', 'Sort: Name') },
            ]} />
          <Tooltip title={sortDescending ? t('تنازلي', 'Descending') : t('تصاعدي', 'Ascending')}>
            <Button
              size="large"
              icon={sortDescending ? <SortDescendingOutlined /> : <SortAscendingOutlined />}
              onClick={() => { setSortDescending((d) => !d); setPageNumber(1); }}
            />
          </Tooltip>
        </div>
        <Table<HourlyDriver> rowKey="id" columns={columns} dataSource={drivers} loading={isLoading} size="middle" bordered scroll={{ x: 900 }}
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
    </div>
  );
}
