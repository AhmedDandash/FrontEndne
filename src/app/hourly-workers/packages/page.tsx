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
  InputNumber,
  Switch,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  AppstoreOutlined,
  ReloadOutlined,
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { AdvancedFilterPanel } from '@/components/filters';
import { useHourlyPackages, useHourlyPackageMutations } from '@/hooks/api/useHourlyCatalog';
import { useHourlyPermissions } from '@/hooks/useHourlyPermissions';
import { useAuthStore } from '@/store/authStore';
import { fmtMoney } from '../_lib/hourlyDisplay';
import type {
  HourlyServicePackage,
  CreateHourlyServicePackageDto,
} from '@/types/hourly-worker.types';
import styles from '../hourly-workers.module.css';

const PAGE_SIZE = 10;

export default function HourlyPackagesPage() {
  const language = useAuthStore((s) => s.language);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const perms = useHourlyPermissions();
  const canWrite = perms.isFullAccess;

  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState<boolean | undefined>();
  const [sortBy, setSortBy] = useState<'code' | 'nameEn' | 'basePrice' | 'sortOrder' | 'createdDate'>('createdDate');
  const [sortDescending, setSortDescending] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);

  const { data, isLoading, isFetching, refetch } = useHourlyPackages({
    search: search || undefined,
    isActive,
    sortBy,
    sortDescending,
    pageNumber,
    pageSize: PAGE_SIZE,
  });
  const packages = useMemo(() => data?.items ?? [], [data]);
  const totalCount = data?.totalCount ?? 0;

  const { create, update, remove } = useHourlyPackageMutations();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HourlyServicePackage | null>(null);
  const [form] = Form.useForm();

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, sortOrder: 1, numberOfWorkers: 1 });
    setFormOpen(true);
  };
  const openEdit = (p: HourlyServicePackage) => {
    setEditing(p);
    form.setFieldsValue({ ...p });
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
      const dto: CreateHourlyServicePackageDto = {
        code: v.code.trim(),
        nameAr: v.nameAr.trim(),
        nameEn: v.nameEn.trim(),
        descriptionAr: v.descriptionAr?.trim() || undefined,
        descriptionEn: v.descriptionEn?.trim() || undefined,
        durationHours: v.durationHours,
        numberOfWorkers: v.numberOfWorkers,
        basePrice: v.basePrice,
        hourlyRate: v.hourlyRate,
        sortOrder: v.sortOrder ?? 0,
        isActive: v.isActive,
      };
      if (editing) await update.mutateAsync({ id: editing.id, data: dto });
      else await create.mutateAsync(dto);
      closeForm();
    } catch {
      // Mutation hooks surface API errors. Keep the drawer open for correction.
    }
  };

  const columns: ColumnsType<HourlyServicePackage> = [
    {
      title: t('الرمز', 'Code'),
      dataIndex: 'code',
      key: 'code',
      width: 110,
      sorter: true,
      sortOrder: sortBy === 'code' ? (sortDescending ? 'descend' : 'ascend') : null,
      render: (v) => <span className={styles.docNumber}>{v}</span>,
    },
    {
      title: t('الاسم', 'Name'),
      key: 'nameEn',
      sorter: true,
      sortOrder: sortBy === 'nameEn' ? (sortDescending ? 'descend' : 'ascend') : null,
      render: (_, r) => (isAr ? r.nameAr : r.nameEn),
    },
    { title: t('المدة', 'Duration'), dataIndex: 'durationHours', key: 'dur', width: 90, align: 'center',
      render: (v) => t(`${v} ساعة`, `${v}h`) },
    { title: t('العمال', 'Workers'), dataIndex: 'numberOfWorkers', key: 'nw', width: 80, align: 'center' },
    {
      title: t('السعر الأساسي', 'Base Price'),
      dataIndex: 'basePrice',
      key: 'basePrice',
      width: 130,
      align: 'right',
      sorter: true,
      sortOrder: sortBy === 'basePrice' ? (sortDescending ? 'descend' : 'ascend') : null,
      render: (v) => fmtMoney(v),
    },
    { title: t('الأجر/ساعة', 'Rate/hr'), dataIndex: 'hourlyRate', key: 'hr', width: 120, align: 'right', render: (v) => fmtMoney(v) },
    {
      title: t('الترتيب', 'Sort Order'),
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 90,
      align: 'center',
      sorter: true,
      sortOrder: sortBy === 'sortOrder' ? (sortDescending ? 'descend' : 'ascend') : null,
    },
    { title: t('الحالة', 'Status'), dataIndex: 'isActive', key: 'active', width: 90,
      render: (v) => (v ? <Tag color="green">{t('نشط', 'Active')}</Tag> : <Tag>{t('غير نشط', 'Inactive')}</Tag>) },
    ...(canWrite
      ? [{
          title: t('إجراءات', 'Actions'), key: 'actions', width: 110, fixed: 'right' as const,
          render: (_: unknown, r: HourlyServicePackage) => (
            <Space size={2}>
              <Tooltip title={t('تعديل', 'Edit')}>
                <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEdit(r)} />
              </Tooltip>
              <Popconfirm title={t('حذف الباقة؟', 'Delete package?')} okText={t('حذف', 'Delete')} cancelText={t('إلغاء', 'Cancel')}
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
            <AppstoreOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('باقات الخدمة', 'Service Packages')}</h1>
              <p className={styles.pageSubtitle}>{t('إدارة باقات وأسعار العمل بالساعة', 'Manage hourly service packages and pricing')}</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button icon={<ReloadOutlined spin={isFetching} />} onClick={() => refetch()} className={styles.refreshBtn}>{t('تحديث', 'Refresh')}</Button>
            {canWrite && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} className={styles.addBtn}>{t('إضافة باقة', 'New Package')}</Button>}
          </div>
        </div>
      </div>

      <AdvancedFilterPanel
        activeCount={isActive !== undefined ? 1 : 0}
        onClear={() => setIsActive(undefined)}
        quickFilters={
          <>
            <Input allowClear size="large" prefix={<SearchOutlined />} placeholder={t('بحث بالرمز أو الاسم', 'Search code or name')}
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
        <Table<HourlyServicePackage> rowKey="id" columns={columns} dataSource={packages} loading={isLoading} size="middle" bordered scroll={{ x: 1000 }}
          onChange={(_, __, sorter) => {
            const s = Array.isArray(sorter) ? sorter[0] : sorter;
            if (s?.order) {
              setSortBy(s.columnKey as 'code' | 'nameEn' | 'basePrice' | 'sortOrder' | 'createdDate');
              setSortDescending(s.order === 'descend');
            } else {
              setSortBy('createdDate');
              setSortDescending(true);
            }
            setPageNumber(1);
          }}
          pagination={{ current: pageNumber, pageSize: PAGE_SIZE, total: totalCount, onChange: setPageNumber, showTotal: (n) => t(`الإجمالي: ${n}`, `Total: ${n}`) }} />
      </Card>

      <Drawer title={editing ? t('تعديل الباقة', 'Edit Package') : t('إضافة باقة', 'New Package')} open={formOpen} onClose={closeForm} width={480}
        footer={
          <Space style={{ float: isAr ? 'left' : 'right' }}>
            <Button onClick={closeForm}>{t('إلغاء', 'Cancel')}</Button>
            <Button type="primary" loading={create.isPending || update.isPending} onClick={handleSubmit}>{t('حفظ', 'Save')}</Button>
          </Space>
        }>
        <Form form={form} layout="vertical">
          <Form.Item name="code" label={t('الرمز', 'Code')} rules={[{ required: true, message: t('مطلوب', 'Required') }]}>
            <Input size="large" placeholder="PKG-3H" />
          </Form.Item>
          <Form.Item name="nameAr" label={t('الاسم (عربي)', 'Name (Arabic)')} rules={[{ required: true, message: t('مطلوب', 'Required') }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="nameEn" label={t('الاسم (إنجليزي)', 'Name (English)')} rules={[{ required: true, message: t('مطلوب', 'Required') }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="descriptionAr" label={t('الوصف (عربي)', 'Description (Arabic)')}>
            <Input.TextArea rows={2} maxLength={500} />
          </Form.Item>
          <Form.Item name="descriptionEn" label={t('الوصف (إنجليزي)', 'Description (English)')}>
            <Input.TextArea rows={2} maxLength={500} />
          </Form.Item>
          <Space style={{ display: 'flex' }} size={12}>
            <Form.Item name="durationHours" label={t('المدة (ساعات)', 'Duration (hours)')} rules={[{ required: true, message: t('مطلوب', 'Required') }, { type: 'number', min: 1, message: t('> 0', '> 0') }]} style={{ flex: 1 }}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="numberOfWorkers" label={t('عدد العمال', 'Workers')} rules={[{ required: true, message: t('مطلوب', 'Required') }, { type: 'number', min: 1, message: t('> 0', '> 0') }]} style={{ flex: 1 }}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Space style={{ display: 'flex' }} size={12}>
            <Form.Item name="basePrice" label={t('السعر الأساسي', 'Base Price')} rules={[{ required: true, message: t('مطلوب', 'Required') }, { type: 'number', min: 0.01, message: t('> 0', '> 0') }]} style={{ flex: 1 }}>
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="hourlyRate" label={t('الأجر/ساعة', 'Hourly Rate')} rules={[{ required: true, message: t('مطلوب', 'Required') }, { type: 'number', min: 0.01, message: t('> 0', '> 0') }]} style={{ flex: 1 }}>
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Space style={{ display: 'flex' }} size={12}>
            <Form.Item name="sortOrder" label={t('الترتيب', 'Sort Order')} style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="isActive" label={t('نشط', 'Active')} valuePropName="checked" style={{ flex: 1 }}>
              <Switch />
            </Form.Item>
          </Space>
        </Form>
      </Drawer>
    </div>
  );
}
