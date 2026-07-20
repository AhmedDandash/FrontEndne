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
  EnvironmentOutlined,
  ReloadOutlined,
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from '@ant-design/icons';
import {
  useHourlyServingAreas,
  useHourlyServingAreaMutations,
} from '@/hooks/api/useHourlyCatalog';
import { useHourlyPermissions } from '@/hooks/useHourlyPermissions';
import { useAuthStore } from '@/store/authStore';
import type {
  HourlyServingArea,
  CreateHourlyServingAreaDto,
} from '@/types/hourly-worker.types';
import styles from '../hourly-workers.module.css';

const PAGE_SIZE = 10;

export default function HourlyServingAreasPage() {
  const language = useAuthStore((s) => s.language);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const perms = useHourlyPermissions();
  const canWrite = perms.isFullAccess;

  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState<boolean | undefined>();
  const [city, setCity] = useState('');
  const [sortBy, setSortBy] = useState<'nameEn' | 'cityEn' | 'createdDate'>('createdDate');
  const [sortDescending, setSortDescending] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);

  const { data, isLoading, isFetching, refetch } = useHourlyServingAreas({
    search: search || undefined,
    isActive,
    city: city || undefined,
    sortBy,
    sortDescending,
    pageNumber,
    pageSize: PAGE_SIZE,
  });
  const areas = useMemo(() => data?.items ?? [], [data]);
  const totalCount = data?.totalCount ?? 0;

  const { create, update, remove } = useHourlyServingAreaMutations();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HourlyServingArea | null>(null);
  const [form] = Form.useForm();

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, radiusKm: 5 });
    setFormOpen(true);
  };
  const openEdit = (a: HourlyServingArea) => {
    setEditing(a);
    form.setFieldsValue({ ...a });
    setFormOpen(true);
  };
  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    form.resetFields();
  };
  const handleSubmit = async () => {
    const v = await form.validateFields();
    const dto: CreateHourlyServingAreaDto = {
      nameAr: v.nameAr.trim(),
      nameEn: v.nameEn.trim(),
      cityAr: v.cityAr.trim(),
      cityEn: v.cityEn.trim(),
      districtAr: v.districtAr?.trim() || undefined,
      districtEn: v.districtEn?.trim() || undefined,
      postalCode: v.postalCode?.trim() || undefined,
      centerLatitude: v.centerLatitude ?? undefined,
      centerLongitude: v.centerLongitude ?? undefined,
      radiusKm: v.radiusKm ?? undefined,
      isActive: v.isActive,
    };
    if (editing) await update.mutateAsync({ id: editing.id, data: dto });
    else await create.mutateAsync(dto);
    closeForm();
  };

  const columns: ColumnsType<HourlyServingArea> = [
    { title: t('الاسم', 'Name'), key: 'name', render: (_, r) => (isAr ? r.nameAr : r.nameEn) },
    { title: t('المدينة', 'City'), key: 'city', width: 150, render: (_, r) => (isAr ? r.cityAr : r.cityEn) },
    { title: t('الحي', 'District'), key: 'district', width: 150, render: (_, r) => (isAr ? r.districtAr : r.districtEn) || '—' },
    { title: t('نطاق (كم)', 'Radius (km)'), dataIndex: 'radiusKm', key: 'radius', width: 110, align: 'center', render: (v) => v ?? '—' },
    { title: t('الحالة', 'Status'), dataIndex: 'isActive', key: 'active', width: 90,
      render: (v) => (v ? <Tag color="green">{t('نشط', 'Active')}</Tag> : <Tag>{t('غير نشط', 'Inactive')}</Tag>) },
    ...(canWrite
      ? [{
          title: t('إجراءات', 'Actions'), key: 'actions', width: 110, fixed: 'right' as const,
          render: (_: unknown, r: HourlyServingArea) => (
            <Space size={2}>
              <Tooltip title={t('تعديل', 'Edit')}>
                <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEdit(r)} />
              </Tooltip>
              <Popconfirm title={t('حذف المنطقة؟', 'Delete area?')} okText={t('حذف', 'Delete')} cancelText={t('إلغاء', 'Cancel')}
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
            <EnvironmentOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('مناطق الخدمة', 'Serving Areas')}</h1>
              <p className={styles.pageSubtitle}>{t('إدارة المناطق الجغرافية المخدومة', 'Manage geographic service areas')}</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button icon={<ReloadOutlined spin={isFetching} />} onClick={() => refetch()} className={styles.refreshBtn}>{t('تحديث', 'Refresh')}</Button>
            {canWrite && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} className={styles.addBtn}>{t('إضافة منطقة', 'New Area')}</Button>}
          </div>
        </div>
      </div>

      <Card className={styles.tableCard}>
        <div className={styles.filters}>
          <Input allowClear size="large" prefix={<SearchOutlined />} placeholder={t('بحث بالاسم أو المدينة', 'Search name or city')}
            className={styles.filterInput} value={search} onChange={(e) => { setSearch(e.target.value); setPageNumber(1); }} />
          <Select allowClear size="large" placeholder={t('الحالة', 'Status')} className={styles.filterSelect}
            value={isActive} onChange={(v) => { setIsActive(v); setPageNumber(1); }}
            options={[{ value: true, label: t('نشط', 'Active') }, { value: false, label: t('غير نشط', 'Inactive') }]} />
          <Input allowClear size="large" placeholder={t('المدينة', 'City')} className={styles.filterInput}
            value={city} onChange={(e) => { setCity(e.target.value); setPageNumber(1); }} />
          <Select size="large" className={styles.filterSelect}
            value={sortBy} onChange={(v) => { setSortBy(v); setPageNumber(1); }}
            options={[
              { value: 'createdDate', label: t('ترتيب: الأحدث', 'Sort: Newest') },
              { value: 'nameEn', label: t('ترتيب: الاسم', 'Sort: Name') },
              { value: 'cityEn', label: t('ترتيب: المدينة', 'Sort: City') },
            ]} />
          <Tooltip title={sortDescending ? t('تنازلي', 'Descending') : t('تصاعدي', 'Ascending')}>
            <Button
              size="large"
              icon={sortDescending ? <SortDescendingOutlined /> : <SortAscendingOutlined />}
              onClick={() => { setSortDescending((d) => !d); setPageNumber(1); }}
            />
          </Tooltip>
        </div>
        <Table<HourlyServingArea> rowKey="id" columns={columns} dataSource={areas} loading={isLoading} size="middle" bordered scroll={{ x: 900 }}
          pagination={{ current: pageNumber, pageSize: PAGE_SIZE, total: totalCount, onChange: setPageNumber, showTotal: (n) => t(`الإجمالي: ${n}`, `Total: ${n}`) }} />
      </Card>

      <Drawer title={editing ? t('تعديل المنطقة', 'Edit Area') : t('إضافة منطقة', 'New Area')} open={formOpen} onClose={closeForm} width={480}
        footer={
          <Space style={{ float: isAr ? 'left' : 'right' }}>
            <Button onClick={closeForm}>{t('إلغاء', 'Cancel')}</Button>
            <Button type="primary" loading={create.isPending || update.isPending} onClick={handleSubmit}>{t('حفظ', 'Save')}</Button>
          </Space>
        }>
        <Form form={form} layout="vertical">
          <Space style={{ display: 'flex' }} size={12}>
            <Form.Item name="nameAr" label={t('الاسم (عربي)', 'Name (AR)')} rules={[{ required: true, message: t('مطلوب', 'Required') }]} style={{ flex: 1 }}>
              <Input size="large" />
            </Form.Item>
            <Form.Item name="nameEn" label={t('الاسم (إنجليزي)', 'Name (EN)')} rules={[{ required: true, message: t('مطلوب', 'Required') }]} style={{ flex: 1 }}>
              <Input size="large" />
            </Form.Item>
          </Space>
          <Space style={{ display: 'flex' }} size={12}>
            <Form.Item name="cityAr" label={t('المدينة (عربي)', 'City (AR)')} rules={[{ required: true, message: t('مطلوب', 'Required') }]} style={{ flex: 1 }}>
              <Input size="large" />
            </Form.Item>
            <Form.Item name="cityEn" label={t('المدينة (إنجليزي)', 'City (EN)')} rules={[{ required: true, message: t('مطلوب', 'Required') }]} style={{ flex: 1 }}>
              <Input size="large" />
            </Form.Item>
          </Space>
          <Space style={{ display: 'flex' }} size={12}>
            <Form.Item name="districtAr" label={t('الحي (عربي)', 'District (AR)')} style={{ flex: 1 }}>
              <Input size="large" />
            </Form.Item>
            <Form.Item name="districtEn" label={t('الحي (إنجليزي)', 'District (EN)')} style={{ flex: 1 }}>
              <Input size="large" />
            </Form.Item>
          </Space>
          <Form.Item name="postalCode" label={t('الرمز البريدي', 'Postal Code')}>
            <Input size="large" />
          </Form.Item>
          <Space style={{ display: 'flex' }} size={12}>
            <Form.Item name="centerLatitude" label={t('خط العرض', 'Latitude')} style={{ flex: 1 }}>
              <InputNumber step={0.0001} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="centerLongitude" label={t('خط الطول', 'Longitude')} style={{ flex: 1 }}>
              <InputNumber step={0.0001} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Space style={{ display: 'flex' }} size={12}>
            <Form.Item name="radiusKm" label={t('نصف القطر (كم)', 'Radius (km)')} style={{ flex: 1 }}>
              <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
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
