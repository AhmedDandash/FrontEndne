'use client';

import { useState, useMemo } from 'react';
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
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import {
  useMarketers,
  useCreateMarketer,
  useUpdateMarketer,
  useDeleteMarketer,
} from '@/hooks/api/useMarketers';
import type { Marketer } from '@/types/api.types';
import styles from './MarketerSettings.module.css';

// ── Translations ──────────────────────────────────────────────────────────────
const TR: Record<string, Record<'ar' | 'en', string>> = {
  pageTitle:    { ar: 'إدارة المسوقين',           en: 'Marketer Management' },
  pageSubtitle: { ar: 'إضافة وتعديل وحذف المسوقين', en: 'Add, edit, and delete marketers' },
  addMarketer:  { ar: 'إضافة مسوق',               en: 'Add Marketer' },
  editMarketer: { ar: 'تعديل المسوق',              en: 'Edit Marketer' },
  refresh:      { ar: 'تحديث',                     en: 'Refresh' },
  nameAr:       { ar: 'الاسم بالعربية',             en: 'Arabic Name' },
  nameEn:       { ar: 'الاسم بالإنجليزية',          en: 'English Name' },
  createdDate:  { ar: 'تاريخ الإنشاء',              en: 'Created Date' },
  actions:      { ar: 'الإجراءات',                 en: 'Actions' },
  save:         { ar: 'حفظ',                       en: 'Save' },
  cancel:       { ar: 'إلغاء',                     en: 'Cancel' },
  deleteConfirm:{ ar: 'هل أنت متأكد من الحذف؟',    en: 'Are you sure you want to delete?' },
  yes:          { ar: 'نعم',                       en: 'Yes' },
  no:           { ar: 'لا',                        en: 'No' },
  noData:       { ar: 'لا توجد بيانات',             en: 'No data found' },
  required:     { ar: 'هذا الحقل مطلوب',            en: 'This field is required' },
  total:        { ar: 'الإجمالي',                   en: 'Total' },
  search:       { ar: 'بحث بالاسم...',              en: 'Search by name...' },
  noResults:    { ar: 'لا توجد نتائج مطابقة',        en: 'No matching results' },
};

function useT() {
  const language = useAuthStore((s) => s.language);
  return (key: string) => TR[key]?.[language] ?? key;
}

function formatDate(dateStr: string | null | undefined, language: 'ar' | 'en') {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ── Marketer Form Modal ───────────────────────────────────────────────────────
function MarketerModal({
  open,
  editing,
  onClose,
}: {
  open: boolean;
  editing: Marketer | null;
  onClose: () => void;
}) {
  const t        = useT();
  const language = useAuthStore((s) => s.language);
  const isAr     = language === 'ar';
  const [form]   = Form.useForm();

  const createMutation = useCreateMarketer();
  const updateMutation = useUpdateMarketer();

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Populate form when editing
  const handleOpen = () => {
    if (editing) {
      form.setFieldsValue({ nameAr: editing.nameAr, nameEn: editing.nameEn });
    } else {
      form.resetFields();
    }
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: { nameAr: values.nameAr, nameEn: values.nameEn } },
        { onSuccess: () => { form.resetFields(); onClose(); } }
      );
    } else {
      createMutation.mutate(
        { nameAr: values.nameAr, nameEn: values.nameEn },
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
          {editing ? t('editMarketer') : t('addMarketer')}
        </span>
      }
      onOk={handleOk}
      onCancel={handleCancel}
      okText={t('save')}
      cancelText={t('cancel')}
      confirmLoading={isPending}
      afterOpenChange={(visible) => { if (visible) handleOpen(); }}
      width={480}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="nameAr"
          label={t('nameAr')}
          rules={[{ required: true, message: isAr ? 'الاسم بالعربية مطلوب' : t('required') }]}
        >
          <Input
            size="large"
            placeholder={isAr ? 'مثال: فيسبوك' : 'e.g. فيسبوك'}
            dir="rtl"
          />
        </Form.Item>
        <Form.Item
          name="nameEn"
          label={t('nameEn')}
          rules={[{ required: true, message: isAr ? 'الاسم بالإنجليزية مطلوب' : t('required') }]}
        >
          <Input
            size="large"
            placeholder="e.g. Facebook"
            dir="ltr"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MarketerSettingsPage() {
  const t        = useT();
  const language = useAuthStore((s) => s.language);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<Marketer | null>(null);
  const [searchText, setSearchText] = useState('');

  const { data: marketers, isLoading, refetch } = useMarketers();
  const deleteMutation = useDeleteMarketer();

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return marketers ?? [];
    return (marketers ?? []).filter((m) =>
      `${m.nameAr ?? ''} ${m.nameEn ?? ''}`.toLowerCase().includes(q)
    );
  }, [marketers, searchText]);

  const openAdd  = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (m: Marketer) => { setEditing(m); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const columns: ColumnsType<Marketer> = [
    {
      title: '#',
      key: 'index',
      width: 60,
      render: (_: unknown, __: Marketer, idx: number) => idx + 1,
    },
    {
      title: t('nameAr'),
      dataIndex: 'nameAr',
      key: 'nameAr',
      render: (v: string) => (
        <Tag color="blue" style={{ fontFamily: 'inherit', fontSize: 13 }}>
          {v || '—'}
        </Tag>
      ),
    },
    {
      title: t('nameEn'),
      dataIndex: 'nameEn',
      key: 'nameEn',
      render: (v: string) => (
        <Tag color="geekblue" style={{ fontFamily: 'inherit', fontSize: 13 }}>
          {v || '—'}
        </Tag>
      ),
    },
    {
      title: t('createdDate'),
      dataIndex: 'createdDate',
      key: 'createdDate',
      render: (v: string) => formatDate(v, language),
    },
    {
      title: t('actions'),
      key: 'actions',
      width: 130,
      render: (_: unknown, record: Marketer) => (
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
              loading={deleteMutation.isPending}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <TeamOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('pageTitle')}</h1>
              <p className={styles.pageSubtitle}>{t('pageSubtitle')}</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
              className={styles.refreshBtn}
            >
              {t('refresh')}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openAdd}
              className={styles.addBtn}
            >
              {t('addMarketer')}
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <Card className={styles.tableCard}>
        {isLoading ? (
          <div className={styles.spinWrapper}>
            <Spin size="large" />
          </div>
        ) : !marketers?.length ? (
          <Empty description={t('noData')} />
        ) : (
          <>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder={t('search')}
              style={{ width: 320, marginBottom: 16 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Table
              dataSource={filtered}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `${t('total')}: ${total}` }}
              locale={{ emptyText: <Empty description={t('noResults')} /> }}
              size="middle"
              bordered
            />
          </>
        )}
      </Card>

      <MarketerModal open={modalOpen} editing={editing} onClose={closeModal} />
    </div>
  );
}
