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
  Modal,
  Form,
  Switch,
  Tooltip,
  Popconfirm,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  AuditOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  EditFilled,
} from '@ant-design/icons';
import { useRestrictionTypes } from '@/hooks/api/useRestrictionTypes';
import { useAccountTree } from '@/hooks/api/useAccounts';
import type {
  RestrictionType,
  RestrictionTypeCreateDto,
  AccountTreeNode,
} from '@/types/accounting.types';
import { ACCOUNTING_EVENTS, getAccountingEventLabel } from '@/types/accounting.types';
import { useAuthStore } from '@/store/authStore';
import styles from './RestrictionTypes.module.css';

interface AccountOption {
  value: string;
  label: string;
}

/** Flatten the account tree into select options + an id→"code — name" map. */
function flattenAccounts(tree: AccountTreeNode[]): {
  options: AccountOption[];
  labelById: Map<string, string>;
} {
  const options: AccountOption[] = [];
  const labelById = new Map<string, string>();

  const walk = (nodes: AccountTreeNode[]) => {
    for (const node of nodes) {
      const label = `${node.code} — ${node.name}`;
      labelById.set(node.id, label);
      options.push({ value: node.id, label });
      if (node.children?.length) walk(node.children);
    }
  };
  walk(tree);
  return { options, labelById };
}

/** Map a RestrictionType row into the create/update DTO body. */
function toDto(r: RestrictionType): RestrictionTypeCreateDto {
  return {
    name: r.name ?? null,
    nameAr: r.nameAr ?? null,
    accountingEvent: r.accountingEvent ?? null,
    isManual: r.isManual ?? false,
    isActive: r.isActive ?? true,
    defaultDebitAccountId: r.defaultDebitAccountId ?? null,
    defaultCreditAccountId: r.defaultCreditAccountId ?? null,
  };
}

export default function RestrictionTypesPage() {
  const language = useAuthStore((state) => state.language);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const {
    restrictionTypes,
    isLoading,
    isFetching,
    refetch,
    createType,
    updateType,
    deleteType,
    isCreating,
    isUpdating,
    isDeleting,
  } = useRestrictionTypes();

  const { tree } = useAccountTree();
  const { options: accountOptions, labelById } = useMemo(() => flattenAccounts(tree), [tree]);

  // ── Filters (client-side — list endpoint returns everything) ──
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState<'all' | 'manual' | 'event'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return restrictionTypes.filter((r) => {
      const matchesSearch =
        !term ||
        (r.nameAr ?? '').toLowerCase().includes(term) ||
        (r.name ?? '').toLowerCase().includes(term);
      const matchesMode =
        modeFilter === 'all' ||
        (modeFilter === 'manual' && r.isManual) ||
        (modeFilter === 'event' && !r.isManual);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && r.isActive) ||
        (statusFilter === 'inactive' && !r.isActive);
      return matchesSearch && matchesMode && matchesStatus;
    });
  }, [restrictionTypes, search, modeFilter, statusFilter]);

  // ── Create / Edit modal (shared) ────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<RestrictionType | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ isManual: true, isActive: true });
    setEditOpen(true);
  };

  const openEdit = (record: RestrictionType) => {
    setEditing(record);
    form.setFieldsValue({
      nameAr: record.nameAr ?? '',
      name: record.name ?? '',
      accountingEvent:
        record.accountingEvent !== null &&
        record.accountingEvent !== undefined &&
        record.accountingEvent !== ''
          ? Number(record.accountingEvent)
          : undefined,
      isManual: !!record.isManual,
      isActive: !!record.isActive,
      defaultDebitAccountId: record.defaultDebitAccountId ?? undefined,
      defaultCreditAccountId: record.defaultCreditAccountId ?? undefined,
    });
    setEditOpen(true);
  };

  const closeModal = () => {
    setEditOpen(false);
    setEditing(null);
  };

  const submitModal = async () => {
    const values = await form.validateFields();
    const data: RestrictionTypeCreateDto = {
      accountingEvent: values.accountingEvent ?? null,
      nameAr: values.nameAr?.trim() || null,
      name: values.name?.trim() || null,
      isManual: !!values.isManual,
      isActive: !!values.isActive,
      defaultDebitAccountId: values.defaultDebitAccountId ?? null,
      defaultCreditAccountId: values.defaultCreditAccountId ?? null,
    };
    if (editing) {
      await updateType({ id: editing.id, data });
    } else {
      await createType(data);
    }
    closeModal();
  };

  const onToggleActive = async (record: RestrictionType, checked: boolean) => {
    setTogglingId(record.id);
    try {
      await updateType({ id: record.id, data: { ...toDto(record), isActive: checked } });
    } finally {
      setTogglingId(null);
    }
  };

  const onDelete = async (record: RestrictionType) => {
    await deleteType(record.id);
  };

  const renderAccount = (id?: string | null) =>
    id ? <span className={styles.account}>{labelById.get(id) ?? id}</span> : <span className={styles.muted}>—</span>;

  // ── Columns ─────────────────────────────────────────────────
  const columns: ColumnsType<RestrictionType> = [
    {
      title: '#',
      key: 'index',
      width: 56,
      render: (_, __, idx) => idx + 1,
    },
    {
      title: t('الاسم', 'Name'),
      key: 'name',
      render: (_, r) => (
        <div className={styles.nameCell}>
          <span className={styles.nameAr}>{r.nameAr || '—'}</span>
          {r.name && <span className={styles.nameEn}>{r.name}</span>}
        </div>
      ),
    },
    {
      title: t('وضع القيد', 'Entry Mode'),
      key: 'isManual',
      width: 150,
      render: (_, r) =>
        r.isManual ? (
          <Tag icon={<EditFilled />} color="gold">
            {t('يدوي', 'Manual')}
          </Tag>
        ) : (
          <Tag icon={<ThunderboltOutlined />} color="geekblue">
            {t('مرتبط بحدث', 'Event-driven')}
          </Tag>
        ),
    },
    {
      title: t('الحدث المحاسبي', 'Accounting Event'),
      dataIndex: 'accountingEvent',
      key: 'accountingEvent',
      width: 160,
      render: (v) =>
        v !== null && v !== undefined && v !== '' ? (
          <Tag color="purple">{getAccountingEventLabel(v, isAr)}</Tag>
        ) : (
          <span className={styles.muted}>—</span>
        ),
    },
    {
      title: t('الحساب المدين الافتراضي', 'Default Debit'),
      key: 'defaultDebitAccountId',
      width: 200,
      render: (_, r) => renderAccount(r.defaultDebitAccountId),
    },
    {
      title: t('الحساب الدائن الافتراضي', 'Default Credit'),
      key: 'defaultCreditAccountId',
      width: 200,
      render: (_, r) => renderAccount(r.defaultCreditAccountId),
    },
    {
      title: t('الحالة', 'Status'),
      key: 'isActive',
      width: 110,
      align: 'center',
      render: (_, r) => (
        <Switch
          checked={!!r.isActive}
          loading={togglingId === r.id && isUpdating}
          checkedChildren={t('مفعّل', 'On')}
          unCheckedChildren={t('معطّل', 'Off')}
          onChange={(checked) => onToggleActive(r, checked)}
        />
      ),
    },
    {
      title: t('إجراءات', 'Actions'),
      key: 'actions',
      width: 110,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title={t('تعديل', 'Edit')}>
            <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          </Tooltip>
          <Tooltip title={t('حذف', 'Delete')}>
            <Popconfirm
              title={t('تأكيد الحذف', 'Confirm delete')}
              description={t(
                'سيتم حذف نوع القيد نهائيًا. لا يمكن التراجع.',
                'This restriction type will be permanently deleted.'
              )}
              okText={t('حذف', 'Delete')}
              cancelText={t('إلغاء', 'Cancel')}
              okButtonProps={{ danger: true, loading: isDeleting }}
              onConfirm={() => onDelete(record)}
            >
              <Button size="small" type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      {/* ── Header ───────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <AuditOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('أنواع القيود', 'Restriction Types')}</h1>
              <p className={styles.pageSubtitle}>
                {t(
                  'إدارة أنواع قيود اليومية (يدوية أو مرتبطة بأحداث) وحساباتها الافتراضية',
                  'Manage journal-entry types (manual or event-driven) and their default accounts'
                )}
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button
              icon={<ReloadOutlined spin={isFetching} />}
              onClick={() => refetch()}
              className={styles.refreshBtn}
            >
              {t('تحديث', 'Refresh')}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreate}
              className={styles.addBtn}
            >
              {t('إضافة نوع', 'Add Type')}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Filters + Table ──────────────────────────────────── */}
      <Card className={styles.tableCard}>
        <div className={styles.filters}>
          <Input
            allowClear
            size="large"
            prefix={<SearchOutlined />}
            placeholder={t('ابحث بالاسم...', 'Search by name...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.search}
          />
          <Select
            size="large"
            value={modeFilter}
            onChange={setModeFilter}
            className={styles.filterSelect}
            options={[
              { value: 'all', label: t('كل الأوضاع', 'All modes') },
              { value: 'manual', label: t('يدوي', 'Manual') },
              { value: 'event', label: t('مرتبط بحدث', 'Event-driven') },
            ]}
          />
          <Select
            size="large"
            value={statusFilter}
            onChange={setStatusFilter}
            className={styles.filterSelect}
            options={[
              { value: 'all', label: t('كل الحالات', 'All statuses') },
              { value: 'active', label: t('مفعّل', 'Active') },
              { value: 'inactive', label: t('معطّل', 'Inactive') },
            ]}
          />
        </div>

        <Table<RestrictionType>
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          loading={isLoading}
          size="middle"
          bordered
          scroll={{ x: 1100 }}
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showTotal: (total) => t(`الإجمالي: ${total}`, `Total: ${total}`),
          }}
        />
      </Card>

      {/* ── Edit Modal ───────────────────────────────────────── */}
      <Modal
        open={editOpen}
        title={
          <Space>
            {editing ? <EditOutlined /> : <PlusOutlined />}
            {editing
              ? t('تعديل نوع القيد', 'Edit Restriction Type')
              : t('إضافة نوع قيد', 'Add Restriction Type')}
          </Space>
        }
        onOk={submitModal}
        onCancel={closeModal}
        okText={editing ? t('حفظ', 'Save') : t('إضافة', 'Add')}
        cancelText={t('إلغاء', 'Cancel')}
        confirmLoading={editing ? isUpdating : isCreating}
        width={560}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="nameAr"
            label={t('الاسم بالعربية', 'Arabic Name')}
            rules={[{ required: true, message: t('الاسم بالعربية مطلوب', 'Arabic name is required') }]}
          >
            <Input size="large" dir="rtl" placeholder={t('مثال: قيد المبيعات', 'e.g. قيد المبيعات')} />
          </Form.Item>

          <Form.Item
            name="name"
            label={t('الاسم بالإنجليزية', 'English Name')}
            rules={[
              { required: true, message: t('الاسم بالإنجليزية مطلوب', 'English name is required') },
            ]}
          >
            <Input size="large" dir="ltr" placeholder="e.g. Sales Entry" />
          </Form.Item>

          <div className={styles.switchRow}>
            <Form.Item
              name="isManual"
              label={t('قيد يدوي', 'Manual entry')}
              valuePropName="checked"
              className={styles.switchItem}
            >
              <Switch checkedChildren={t('يدوي', 'Yes')} unCheckedChildren={t('بحدث', 'No')} />
            </Form.Item>
            <Form.Item
              name="isActive"
              label={t('مفعّل', 'Active')}
              valuePropName="checked"
              className={styles.switchItem}
            >
              <Switch checkedChildren={t('نعم', 'On')} unCheckedChildren={t('لا', 'Off')} />
            </Form.Item>
          </div>

          <Form.Item
            noStyle
            shouldUpdate={(prev, cur) => prev.isManual !== cur.isManual}
          >
            {({ getFieldValue }) => {
              const isManual = !!getFieldValue('isManual');
              return (
                <Form.Item
                  name="accountingEvent"
                  label={t('الحدث المحاسبي', 'Accounting Event')}
                  tooltip={t(
                    'الحدث الذي يُنشئ القيد تلقائيًا (للقيود المرتبطة بحدث)',
                    'The business event that auto-generates the entry (for event-driven types)'
                  )}
                  rules={
                    isManual
                      ? []
                      : [
                          {
                            required: true,
                            message: t(
                              'الحدث مطلوب للقيود المرتبطة بحدث',
                              'Event is required for event-driven entries'
                            ),
                          },
                        ]
                  }
                >
                  <Select
                    size="large"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    placeholder={t('اختر الحدث المحاسبي', 'Select accounting event')}
                    options={ACCOUNTING_EVENTS.map((e) => ({
                      value: e.value,
                      label: isAr ? e.ar : e.en,
                    }))}
                  />
                </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item
            name="defaultDebitAccountId"
            label={t('الحساب المدين الافتراضي', 'Default Debit Account')}
          >
            <Select
              size="large"
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder={t('اختر الحساب', 'Select account')}
              options={accountOptions}
            />
          </Form.Item>

          <Form.Item
            name="defaultCreditAccountId"
            label={t('الحساب الدائن الافتراضي', 'Default Credit Account')}
          >
            <Select
              size="large"
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder={t('اختر الحساب', 'Select account')}
              options={accountOptions}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
