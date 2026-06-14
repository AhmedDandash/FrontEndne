'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Table,
  Input,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  TreeSelect,
  Select,
  Switch,
  Tooltip,
  Popconfirm,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  SlidersOutlined,
  DeleteOutlined,
  SearchOutlined,
  ApartmentOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAccountTree, useAccountSettings } from '@/hooks/api/useAccounts';
import {
  getAccountType,
  getReportSideLabel,
  ACCOUNT_REPORT_SIDES,
} from '@/types/accounting.types';
import type { AccountSettingListDto, AccountTreeNode } from '@/types/accounting.types';
import { useAuthStore } from '@/store/authStore';
import styles from './AccountSettings.module.css';

interface ParentTreeNode {
  title: string;
  value: string;
  children?: ParentTreeNode[];
}

/** Build TreeSelect data + an id→code lookup from the account tree. */
function buildParentOptions(tree: AccountTreeNode[]): {
  options: ParentTreeNode[];
  codeById: Map<string, string>;
  leafById: Map<string, boolean>;
} {
  const codeById = new Map<string, string>();
  const leafById = new Map<string, boolean>();

  const toOptions = (nodes: AccountTreeNode[]): ParentTreeNode[] =>
    nodes.map((node) => {
      const children = node.children ?? [];
      codeById.set(node.id, node.code);
      leafById.set(node.id, node.isLeaf ?? children.length === 0);
      return {
        title: `${node.code} — ${node.name}`,
        value: node.id,
        children: children.length ? toOptions(children) : undefined,
      };
    });

  return { options: toOptions(tree), codeById, leafById };
}

export default function AccountSettingsPage() {
  const router = useRouter();
  const language = useAuthStore((state) => state.language);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  // ── Table query state ───────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Deep-link support: prefill the search from ?searchTerm=<code>
  // (e.g. when arriving from "Open in Account Settings" on the Chart page).
  useEffect(() => {
    const term = new URLSearchParams(window.location.search).get('searchTerm');
    if (term) {
      setSearchInput(term);
      setSearchTerm(term.trim());
    }
  }, []);

  const { data, isLoading, isFetching, refetch } = useAccountSettings({
    searchTerm,
    pageNumber,
    pageSize,
  });

  // ── Mutations + tree (parent selector / leaf detection) ─────
  const {
    tree,
    createAccount,
    updateAccountName,
    updateAccountReporting,
    deleteAccount,
    isCreating,
    isUpdating,
    isUpdatingReporting,
    isDeleting,
  } = useAccountTree();

  const { options: parentOptions, codeById, leafById } = useMemo(
    () => buildParentOptions(tree),
    [tree]
  );

  // ── Modals ──────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [nameOpen, setNameOpen] = useState(false);
  const [reportingOpen, setReportingOpen] = useState(false);
  const [editing, setEditing] = useState<AccountSettingListDto | null>(null);

  const [createForm] = Form.useForm();
  const [nameForm] = Form.useForm();
  const [reportingForm] = Form.useForm();

  // ── Handlers ────────────────────────────────────────────────
  const onSearch = (value: string) => {
    setSearchInput(value);
    setSearchTerm(value.trim());
    setPageNumber(1);
  };

  const openCreate = () => {
    createForm.resetFields();
    setCreateOpen(true);
  };

  const onParentChange = (parentId?: string) => {
    // Guide the user: prefill the code with the parent's code to append to.
    const code = parentId ? codeById.get(parentId) ?? '' : '';
    createForm.setFieldsValue({ code });
  };

  const submitCreate = async () => {
    const values = await createForm.validateFields();
    await createAccount({
      code: values.code.trim(),
      name: values.name.trim(),
      parentId: values.parentId ?? null,
    });
    setCreateOpen(false);
    createForm.resetFields();
  };

  const openEditName = (record: AccountSettingListDto) => {
    setEditing(record);
    nameForm.setFieldsValue({ name: record.name });
    setNameOpen(true);
  };

  const submitName = async () => {
    if (!editing) return;
    const values = await nameForm.validateFields();
    await updateAccountName({ id: editing.id, data: { name: values.name.trim() } });
    setNameOpen(false);
    setEditing(null);
  };

  const openReporting = (record: AccountSettingListDto) => {
    setEditing(record);
    reportingForm.setFieldsValue({
      incomeStatementSide: record.incomeStatementSide ?? undefined,
      profitLossSide: record.profitLossSide ?? undefined,
      isGroupedInTrialBalance: !!record.isGroupedInTrialBalance,
    });
    setReportingOpen(true);
  };

  const submitReporting = async () => {
    if (!editing) return;
    const values = await reportingForm.validateFields();
    await updateAccountReporting({
      id: editing.id,
      data: {
        incomeStatementSide: values.incomeStatementSide,
        profitLossSide: values.profitLossSide,
        isGroupedInTrialBalance: !!values.isGroupedInTrialBalance,
      },
    });
    setReportingOpen(false);
    setEditing(null);
  };

  const onDelete = async (record: AccountSettingListDto) => {
    await deleteAccount(record.id);
  };

  /** A record is deletable only when it is a known leaf in the tree. */
  const isLeaf = (id: string) => leafById.get(id) !== false;

  const reportSideSelectOptions = ACCOUNT_REPORT_SIDES.map((o) => ({
    value: o.value,
    label: isAr ? o.ar : o.en,
  }));

  // ── Columns ─────────────────────────────────────────────────
  const columns: ColumnsType<AccountSettingListDto> = [
    {
      title: '#',
      key: 'index',
      width: 56,
      render: (_, __, idx) => (pageNumber - 1) * pageSize + idx + 1,
    },
    {
      title: t('رقم الحساب', 'Code'),
      dataIndex: 'code',
      key: 'code',
      width: 150,
      render: (code: string) => {
        const type = getAccountType(code);
        return (
          <span className={styles.code} style={type ? { color: type.color } : undefined}>
            {code}
          </span>
        );
      },
    },
    {
      title: t('اسم الحساب', 'Account Name'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span className={styles.name}>{name}</span>,
    },
    {
      title: t('النوع', 'Type'),
      key: 'type',
      width: 130,
      render: (_, record) => {
        const type = getAccountType(record.code);
        return type ? (
          <Tag color={type.color} style={{ fontFamily: 'inherit' }}>
            {isAr ? type.ar : type.en}
          </Tag>
        ) : (
          '—'
        );
      },
    },
    {
      title: t('قائمة الدخل', 'Income Statement'),
      dataIndex: 'incomeStatementSide',
      key: 'incomeStatementSide',
      width: 140,
      render: (v) => getReportSideLabel(v, isAr),
    },
    {
      title: t('الأرباح والخسائر', 'Profit & Loss'),
      dataIndex: 'profitLossSide',
      key: 'profitLossSide',
      width: 140,
      render: (v) => getReportSideLabel(v, isAr),
    },
    {
      title: t('مجمع بميزان المراجعة', 'Grouped in Trial Balance'),
      dataIndex: 'isGroupedInTrialBalance',
      key: 'isGroupedInTrialBalance',
      width: 130,
      align: 'center',
      render: (v: boolean) =>
        v ? (
          <Tag color="success">{t('نعم', 'Yes')}</Tag>
        ) : (
          <Tag>{t('لا', 'No')}</Tag>
        ),
    },
    {
      title: t('إجراءات', 'Actions'),
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => {
        const deletable = isLeaf(record.id);
        return (
          <Space size={4}>
            <Tooltip title={t('تعديل الاسم', 'Edit name')}>
              <Button
                size="small"
                type="text"
                icon={<EditOutlined />}
                onClick={() => openEditName(record)}
              />
            </Tooltip>
            <Tooltip title={t('إعدادات التقارير', 'Reporting settings')}>
              <Button
                size="small"
                type="text"
                icon={<SlidersOutlined />}
                onClick={() => openReporting(record)}
              />
            </Tooltip>
            <Tooltip
              title={
                deletable
                  ? t('حذف الحساب', 'Delete account')
                  : t('لا يمكن حذف حساب له فروع', 'Cannot delete an account with sub-accounts')
              }
            >
              <Popconfirm
                title={t('تأكيد الحذف', 'Confirm delete')}
                description={t(
                  'سيتم حذف هذا الحساب نهائيًا. لا يمكن التراجع.',
                  'This account will be permanently deleted. This cannot be undone.'
                )}
                okText={t('حذف', 'Delete')}
                cancelText={t('إلغاء', 'Cancel')}
                okButtonProps={{ danger: true, loading: isDeleting }}
                disabled={!deletable}
                onConfirm={() => onDelete(record)}
              >
                <Button
                  size="small"
                  type="text"
                  danger
                  disabled={!deletable}
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <div className={styles.page}>
      {/* ── Header ───────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <SettingOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('إعدادات الحسابات', 'Account Settings')}</h1>
              <p className={styles.pageSubtitle}>
                {t(
                  'إضافة وتعديل الحسابات وإعدادات تقاريرها وحذف الحسابات الفرعية',
                  'Create, rename, configure reporting and delete leaf accounts'
                )}
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button
              icon={<ApartmentOutlined />}
              onClick={() => router.push('/accounting/chart-of-accounts')}
              className={styles.refreshBtn}
            >
              {t('شجرة الحسابات', 'Chart of Accounts')}
            </Button>
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
              {t('إضافة حساب', 'Add Account')}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────── */}
      <Card className={styles.tableCard}>
        <Input
          allowClear
          size="large"
          prefix={<SearchOutlined />}
          placeholder={t('ابحث برقم الحساب أو الاسم...', 'Search by account code or name...')}
          value={searchInput}
          onChange={(e) => onSearch(e.target.value)}
          className={styles.search}
        />

        <Table<AccountSettingListDto>
          rowKey="id"
          columns={columns}
          dataSource={data?.items ?? []}
          loading={isLoading || isFetching}
          size="middle"
          bordered
          scroll={{ x: 1000 }}
          pagination={{
            current: pageNumber,
            pageSize,
            total: data?.totalCount ?? 0,
            showSizeChanger: true,
            showTotal: (total) => t(`الإجمالي: ${total}`, `Total: ${total}`),
            onChange: (page, size) => {
              setPageNumber(page);
              setPageSize(size);
            },
          }}
        />
      </Card>

      {/* ── Create Account Modal ─────────────────────────────── */}
      <Modal
        open={createOpen}
        title={
          <Space>
            <PlusOutlined />
            {t('إضافة حساب جديد', 'Add New Account')}
          </Space>
        }
        onOk={submitCreate}
        onCancel={() => setCreateOpen(false)}
        okText={t('حفظ', 'Save')}
        cancelText={t('إلغاء', 'Cancel')}
        confirmLoading={isCreating}
        width={520}
        destroyOnHidden
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="parentId"
            label={t('الحساب الأساسي (اختياري)', 'Parent Account (optional)')}
            extra={t(
              'اتركه فارغًا لإنشاء حساب رئيسي. عند الاختيار يجب أن يبدأ رقم الحساب برقم الحساب الأساسي.',
              'Leave empty for a root account. When set, the code must start with the parent code.'
            )}
          >
            <TreeSelect
              showSearch
              allowClear
              treeNodeFilterProp="title"
              treeData={parentOptions}
              placeholder={t('اختر الحساب الأساسي', 'Select parent account')}
              onChange={onParentChange}
              styles={{ popup: { root: { maxHeight: 400, overflow: 'auto' } } }}
            />
          </Form.Item>

          <Form.Item
            name="code"
            label={t('رقم الحساب', 'Account Code')}
            rules={[
              {
                validator: (_, value) => {
                  if (!value || !value.trim()) {
                    return Promise.reject(new Error(t('رقم الحساب مطلوب', 'Account code is required')));
                  }
                  const code = value.trim();
                  if (!/^\d+$/.test(code)) {
                    return Promise.reject(
                      new Error(t('يجب أن يتكون رقم الحساب من أرقام فقط', 'Code must be digits only'))
                    );
                  }
                  const parentId = createForm.getFieldValue('parentId');
                  if (parentId) {
                    const parentCode = codeById.get(parentId);
                    if (parentCode && !code.startsWith(parentCode)) {
                      return Promise.reject(
                        new Error(
                          t(`يجب أن يبدأ الرقم بـ ${parentCode}`, `Code must start with ${parentCode}`)
                        )
                      );
                    }
                    if (parentCode && code.length <= parentCode.length) {
                      return Promise.reject(
                        new Error(
                          t(
                            'يجب أن يكون رقم الحساب الفرعي أطول من رقم الحساب الأساسي',
                            'Sub-account code must be longer than the parent code'
                          )
                        )
                      );
                    }
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input size="large" placeholder={t('مثال: 1002001', 'e.g. 1002001')} dir="ltr" />
          </Form.Item>

          {/* Live account-type hint based on the leading digit */}
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.code !== cur.code}>
            {({ getFieldValue }) => {
              const type = getAccountType(getFieldValue('code'));
              return type ? (
                <div className={styles.typeHint}>
                  {t('النوع المتوقع:', 'Detected type:')}{' '}
                  <Tag color={type.color} style={{ fontFamily: 'inherit' }}>
                    {isAr ? type.ar : type.en}
                  </Tag>
                </div>
              ) : null;
            }}
          </Form.Item>

          <Form.Item
            name="name"
            label={t('اسم الحساب', 'Account Name')}
            rules={[
              { required: true, message: t('اسم الحساب مطلوب', 'Account name is required') },
              { min: 3, message: t('الاسم 3 أحرف على الأقل', 'Name must be at least 3 characters') },
              { max: 100, message: t('الاسم 100 حرف كحد أقصى', 'Name must be at most 100 characters') },
            ]}
          >
            <Input size="large" placeholder={t('اسم الحساب', 'Account name')} dir={isAr ? 'rtl' : 'ltr'} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Edit Name Modal ──────────────────────────────────── */}
      <Modal
        open={nameOpen}
        title={
          <Space>
            <EditOutlined />
            {t('تعديل اسم الحساب', 'Edit Account Name')}
          </Space>
        }
        onOk={submitName}
        onCancel={() => setNameOpen(false)}
        okText={t('حفظ', 'Save')}
        cancelText={t('إلغاء', 'Cancel')}
        confirmLoading={isUpdating}
        width={480}
        destroyOnHidden
      >
        {editing && (
          <p className={styles.modalSubtitle}>
            <span className={styles.code} style={getAccountType(editing.code) ? { color: getAccountType(editing.code)!.color } : undefined}>
              {editing.code}
            </span>
          </p>
        )}
        <Form form={nameForm} layout="vertical">
          <Form.Item
            name="name"
            label={t('اسم الحساب', 'Account Name')}
            rules={[
              { required: true, message: t('اسم الحساب مطلوب', 'Account name is required') },
              { min: 3, message: t('الاسم 3 أحرف على الأقل', 'Name must be at least 3 characters') },
              { max: 100, message: t('الاسم 100 حرف كحد أقصى', 'Name must be at most 100 characters') },
            ]}
          >
            <Input size="large" dir={isAr ? 'rtl' : 'ltr'} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Reporting Settings Modal ─────────────────────────── */}
      <Modal
        open={reportingOpen}
        title={
          <Space>
            <SlidersOutlined />
            {t('إعدادات التقارير', 'Reporting Settings')}
          </Space>
        }
        onOk={submitReporting}
        onCancel={() => setReportingOpen(false)}
        okText={t('حفظ', 'Save')}
        cancelText={t('إلغاء', 'Cancel')}
        confirmLoading={isUpdatingReporting}
        width={480}
        destroyOnHidden
      >
        {editing && (
          <p className={styles.modalSubtitle}>
            <span className={styles.code} style={getAccountType(editing.code) ? { color: getAccountType(editing.code)!.color } : undefined}>
              {editing.code}
            </span>{' '}
            — {editing.name}
          </p>
        )}
        <Form form={reportingForm} layout="vertical">
          <Form.Item
            name="incomeStatementSide"
            label={t('جانب قائمة الدخل', 'Income Statement Side')}
            rules={[{ required: true, message: t('هذا الحقل مطلوب', 'This field is required') }]}
          >
            <Select
              size="large"
              options={reportSideSelectOptions}
              placeholder={t('اختر الجانب', 'Select side')}
            />
          </Form.Item>
          <Form.Item
            name="profitLossSide"
            label={t('جانب الأرباح والخسائر', 'Profit & Loss Side')}
            rules={[{ required: true, message: t('هذا الحقل مطلوب', 'This field is required') }]}
          >
            <Select
              size="large"
              options={reportSideSelectOptions}
              placeholder={t('اختر الجانب', 'Select side')}
            />
          </Form.Item>
          <Form.Item
            name="isGroupedInTrialBalance"
            label={t('مجمع في ميزان المراجعة', 'Grouped in Trial Balance')}
            valuePropName="checked"
          >
            <Switch
              checkedChildren={t('نعم', 'Yes')}
              unCheckedChildren={t('لا', 'No')}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
