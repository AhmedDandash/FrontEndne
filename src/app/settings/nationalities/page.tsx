'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Table,
  Modal,
  Form,
  Input,
  Popconfirm,
  Space,
  Tag,
  Spin,
  Empty,
  Segmented,
  Radio,
  Switch,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  GlobalOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useHasPermission } from '@/hooks/api/usePagePermissions';
import { APP_PERMISSIONS } from '@/config/appPermissions';
import AccessDenied from '@/components/common/AccessDenied';
import {
  useNationalitiesPaged,
  useCreateNationality,
  useUpdateNationality,
  useDeleteNationality,
  useToggleNationalityStatus,
} from '@/hooks/api/useNationalities';
import { NATIONALITY_TYPE_LABELS, type Nationality, type NationalityType } from '@/types/api.types';
import styles from './Nationalities.module.css';

const TR: Record<string, Record<'ar' | 'en', string>> = {
  pageTitle: { ar: 'إدارة الجنسيات', en: 'Nationality Management' },
  pageSubtitle: { ar: 'إضافة وتعديل الجنسيات لقوائم العملاء والعقود', en: 'Add and edit nationalities for the Customers and Contracts catalogs' },
  addNationality: { ar: 'إضافة جنسية', en: 'Add Nationality' },
  editNationality: { ar: 'تعديل الجنسية', en: 'Edit Nationality' },
  refresh: { ar: 'تحديث', en: 'Refresh' },
  nameAr: { ar: 'الاسم بالعربية', en: 'Arabic Name' },
  nameEn: { ar: 'الاسم بالإنجليزية', en: 'English Name' },
  type: { ar: 'الفئة', en: 'Catalog' },
  status: { ar: 'الحالة', en: 'Status' },
  active: { ar: 'مفعّل', en: 'Active' },
  inactive: { ar: 'غير مفعّل', en: 'Inactive' },
  actions: { ar: 'الإجراءات', en: 'Actions' },
  save: { ar: 'حفظ', en: 'Save' },
  cancel: { ar: 'إلغاء', en: 'Cancel' },
  deleteConfirm: { ar: 'هل أنت متأكد من حذف هذه الجنسية؟', en: 'Delete this nationality?' },
  yes: { ar: 'نعم', en: 'Yes' },
  no: { ar: 'لا', en: 'No' },
  noData: { ar: 'لا توجد جنسيات مضافة بعد', en: 'No nationalities added yet' },
  required: { ar: 'هذا الحقل مطلوب', en: 'This field is required' },
  total: { ar: 'الإجمالي', en: 'Total' },
  search: { ar: 'بحث بالاسم...', en: 'Search by name...' },
  noResults: { ar: 'لا توجد نتائج مطابقة', en: 'No matching results' },
  all: { ar: 'الكل', en: 'All' },
  customers: { ar: 'عملاء', en: 'Customers' },
  contracts: { ar: 'عقود', en: 'Contracts' },
};

function useT() {
  const language = useAuthStore((s) => s.language);
  return (key: string) => TR[key]?.[language] ?? key;
}

// ── Add / Edit Modal ─────────────────────────────────────────────────────────
function NationalityModal({
  open,
  editing,
  defaultType,
  onClose,
}: {
  open: boolean;
  editing: Nationality | null;
  defaultType: NationalityType;
  onClose: () => void;
}) {
  const t = useT();
  const isAr = useAuthStore((s) => s.language) === 'ar';
  const [form] = Form.useForm();

  const createMutation = useCreateNationality();
  const updateMutation = useUpdateNationality();
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Explicit + effect-driven, not `initialValues` + destroyOnHidden: the
  // `form` instance from useForm() persists across the Modal's mount/unmount
  // cycles (only the DOM content is destroyed/recreated), so a field that
  // already has a tracked value — even '' from a prior resetFields() — is
  // not reliably reseeded by a fresh `initialValues` on remount. Only the
  // `type` radio happened to look correct by coincidence in manual testing
  // (the record under test was genuinely type 1, same as the fallback
  // default). Running this after the DOM commits (useEffect, not antd's
  // afterOpenChange transition-end callback) reliably populates every field.
  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        nameAr: editing.nationalityNameAr,
        nameEn: editing.nationalityNameEn,
        type: editing.type ?? defaultType,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ type: defaultType });
    }
  }, [open, editing, defaultType, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    if (editing) {
      updateMutation.mutate(
        {
          id: editing.id,
          data: {
            id: editing.id,
            nationalityNameAr: values.nameAr,
            nationalityNameEn: values.nameEn,
            // Preserve the current active flag — this endpoint is a full
            // replace, and status is managed separately via the row toggle.
            isActive: editing.isActive ?? true,
            type: values.type,
          },
        },
        { onSuccess: () => { form.resetFields(); onClose(); } }
      );
    } else {
      createMutation.mutate(
        {
          nationalityNameAr: values.nameAr,
          nationalityNameEn: values.nameEn,
          isActive: true,
          type: values.type,
        },
        { onSuccess: () => { form.resetFields(); onClose(); } }
      );
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      open={open}
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#003366' }}>
          {editing ? <EditOutlined /> : <PlusOutlined />}
          {editing ? t('editNationality') : t('addNationality')}
        </span>
      }
      onOk={handleOk}
      onCancel={handleCancel}
      okText={t('save')}
      cancelText={t('cancel')}
      confirmLoading={isPending}
      width={480}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 16 }}
      >
        <Form.Item
          name="nameAr"
          label={t('nameAr')}
          rules={[{ required: true, message: t('required') }]}
        >
          <Input size="large" placeholder={isAr ? 'مثال: فلبيني' : 'e.g. فلبيني'} dir="rtl" maxLength={100} />
        </Form.Item>
        <Form.Item
          name="nameEn"
          label={t('nameEn')}
          rules={[{ required: true, message: t('required') }]}
        >
          <Input size="large" placeholder="e.g. Filipino" dir="ltr" maxLength={100} />
        </Form.Item>
        <Form.Item
          name="type"
          label={t('type')}
          rules={[{ required: true, message: t('required') }]}
        >
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            options={[
              { label: t('customers'), value: 1 },
              { label: t('contracts'), value: 2 },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function NationalitiesSettingsPage() {
  const t = useT();
  const language = useAuthStore((s) => s.language);
  const { has, isReady } = useHasPermission();
  const canManage = has(APP_PERMISSIONS.ADMINISTRATION_MANAGE);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Nationality | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 1 | 2>('all');
  const [searchText, setSearchText] = useState('');

  const { data, isLoading, refetch } = useNationalitiesPaged({
    type: typeFilter === 'all' ? undefined : typeFilter,
    searchName: searchText.trim() || undefined,
    pageSize: 200,
  });
  const nationalities = useMemo(() => data?.data ?? [], [data]);

  const deleteMutation = useDeleteNationality();
  const toggleMutation = useToggleNationalityStatus();

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (n: Nationality) => { setEditing(n); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  if (isReady && !canManage) {
    return <AccessDenied />;
  }

  const columns: ColumnsType<Nationality> = [
    {
      title: '#',
      key: 'index',
      width: 60,
      render: (_: unknown, __: Nationality, idx: number) => idx + 1,
    },
    {
      title: t('nameAr'),
      dataIndex: 'nationalityNameAr',
      key: 'nationalityNameAr',
      render: (v: string) => (
        <Tag color="blue" style={{ fontFamily: 'inherit', fontSize: 13 }}>{v || '—'}</Tag>
      ),
    },
    {
      title: t('nameEn'),
      dataIndex: 'nationalityNameEn',
      key: 'nationalityNameEn',
      render: (v: string) => (
        <Tag color="geekblue" style={{ fontFamily: 'inherit', fontSize: 13 }}>{v || '—'}</Tag>
      ),
    },
    {
      title: t('type'),
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (v: NationalityType | undefined) =>
        v ? (
          <Tag color={v === 1 ? 'purple' : 'orange'}>
            {NATIONALITY_TYPE_LABELS[v][language === 'ar' ? 'ar' : 'en']}
          </Tag>
        ) : (
          '—'
        ),
    },
    {
      title: t('status'),
      dataIndex: 'isActive',
      key: 'isActive',
      width: 110,
      render: (isActive: boolean, record: Nationality) => (
        <Switch
          checked={!!isActive}
          disabled={!canManage}
          loading={toggleMutation.isPending && toggleMutation.variables === record.id}
          onChange={() => toggleMutation.mutate(record.id)}
          checkedChildren={t('active')}
          unCheckedChildren={t('inactive')}
        />
      ),
    },
    {
      title: t('actions'),
      key: 'actions',
      width: 130,
      render: (_: unknown, record: Nationality) =>
        canManage ? (
          <Space>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openEdit(record)}
              style={{ color: '#003366' }}
            />
            <Popconfirm
              title={t('deleteConfirm')}
              okText={t('yes')}
              cancelText={t('no')}
              okButtonProps={{ danger: true }}
              onConfirm={() => deleteMutation.mutate(record.id)}
            >
              <Button
                type="text"
                icon={<DeleteOutlined />}
                danger
                loading={deleteMutation.isPending && deleteMutation.variables === record.id}
              />
            </Popconfirm>
          </Space>
        ) : null,
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <GlobalOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('pageTitle')}</h1>
              <p className={styles.pageSubtitle}>{t('pageSubtitle')}</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()} className={styles.refreshBtn}>
              {t('refresh')}
            </Button>
            {canManage && (
              <Button type="primary" icon={<PlusOutlined />} onClick={openAdd} className={styles.addBtn}>
                {t('addNationality')}
              </Button>
            )}
          </div>
        </div>
      </div>

      <Card className={styles.tableCard}>
        <div className={styles.toolbar}>
          <Segmented<'all' | 1 | 2>
            value={typeFilter}
            onChange={(v) => setTypeFilter(v)}
            options={[
              { label: t('all'), value: 'all' },
              { label: t('customers'), value: 1 },
              { label: t('contracts'), value: 2 },
            ]}
          />
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder={t('search')}
            style={{ width: 280 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className={styles.spinWrapper}>
            <Spin size="large" />
          </div>
        ) : !nationalities.length ? (
          <Empty description={t('noData')} />
        ) : (
          <Table
            dataSource={nationalities}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (total) => `${t('total')}: ${total}` }}
            locale={{ emptyText: <Empty description={t('noResults')} /> }}
            size="middle"
            bordered
          />
        )}
      </Card>

      <NationalityModal
        open={modalOpen}
        editing={editing}
        defaultType={typeFilter === 'all' ? 1 : typeFilter}
        onClose={closeModal}
      />
    </div>
  );
}
