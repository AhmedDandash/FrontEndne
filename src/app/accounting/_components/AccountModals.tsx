'use client';

import { useMemo, useState } from 'react';
import { Modal, Form, Input, TreeSelect, Select, Switch, Space, Tag } from 'antd';
import { PlusOutlined, EditOutlined, SlidersOutlined } from '@ant-design/icons';
import { useAccountTree } from '@/hooks/api/useAccounts';
import { getAccountType, ACCOUNT_REPORT_SIDES } from '@/types/accounting.types';
import type { AccountTreeNode, AccountReportSide } from '@/types/accounting.types';
import { useAuthStore } from '@/store/authStore';
import { useAccountingActionGates } from '@/hooks/useActionPermissionGates';

/**
 * Minimal shape the modals need. The Chart-of-Accounts tree provides
 * `{ id, code, name }`; the Settings list additionally carries the current
 * reporting sides so the Reporting modal can pre-fill them.
 */
export interface AccountLike {
  id: string;
  code: string;
  name: string;
  incomeStatementSide?: AccountReportSide | null;
  profitLossSide?: AccountReportSide | null;
  isGroupedInTrialBalance?: boolean | null;
}

interface ParentTreeNode {
  title: string;
  value: string;
  children?: ParentTreeNode[];
}

/** Build TreeSelect data + lookups (code-by-id, leaf-by-id) from the account tree. */
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

/**
 * Shared account create / rename / reporting modals.
 *
 * Both the Chart of Accounts page (tree-based, primary surface) and the
 * Account Settings page (list-based) drive the *same* modals through this hook,
 * so the create-code validation and reporting-side logic live in one place.
 *
 * Delete is intentionally left to the caller (each page renders its own
 * Popconfirm next to the relevant control) — `deleteAccount` + `isDeleting`
 * are surfaced for that.
 */
export function useAccountModals() {
  const language = useAuthStore((state) => state.language);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const accountingGates = useAccountingActionGates();

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

  const [createOpen, setCreateOpen] = useState(false);
  const [nameOpen, setNameOpen] = useState(false);
  const [reportingOpen, setReportingOpen] = useState(false);
  const [editing, setEditing] = useState<AccountLike | null>(null);

  const [createForm] = Form.useForm();
  const [nameForm] = Form.useForm();
  const [reportingForm] = Form.useForm();

  const reportSideSelectOptions = ACCOUNT_REPORT_SIDES.map((o) => ({
    value: o.value,
    label: isAr ? o.ar : o.en,
  }));

  // ── Openers ───────────────────────────────────────────────
  /** Open the create modal, optionally rooted under a given parent. */
  const openCreate = (parentId?: string) => {
    if (!accountingGates.canCreate) return;
    createForm.resetFields();
    if (parentId) {
      createForm.setFieldsValue({ parentId, code: codeById.get(parentId) ?? '' });
    }
    setCreateOpen(true);
  };

  const openEditName = (account: AccountLike) => {
    if (!accountingGates.canUpdate) return;
    setEditing(account);
    nameForm.setFieldsValue({ name: account.name });
    setNameOpen(true);
  };

  const openReporting = (account: AccountLike) => {
    if (!accountingGates.canUpdate) return;
    setEditing(account);
    reportingForm.setFieldsValue({
      incomeStatementSide: account.incomeStatementSide ?? undefined,
      profitLossSide: account.profitLossSide ?? undefined,
      isGroupedInTrialBalance: !!account.isGroupedInTrialBalance,
    });
    setReportingOpen(true);
  };

  // ── Submitters ────────────────────────────────────────────
  const onParentChange = (parentId?: string) => {
    createForm.setFieldsValue({ code: parentId ? codeById.get(parentId) ?? '' : '' });
  };

  const submitCreate = async () => {
    if (!accountingGates.canCreate) return;
    try {
      const values = await createForm.validateFields();
      await createAccount({
        code: values.code.trim(),
        name: values.name.trim(),
        parentId: values.parentId ?? null,
      });
      setCreateOpen(false);
      createForm.resetFields();
    } catch {
      // Either a form-validation rejection (antd already shows the inline
      // field error) or a mutation failure (onError toast already shown).
      // Keep the modal open for retry and swallow so it doesn't bubble as
      // an unhandled promise rejection (antd's plain <Modal onOk> does not
      // await/catch this itself).
    }
  };

  const submitName = async () => {
    if (!editing || !accountingGates.canUpdate) return;
    try {
      const values = await nameForm.validateFields();
      await updateAccountName({ id: editing.id, data: { name: values.name.trim() } });
      setNameOpen(false);
      setEditing(null);
    } catch {
      // Form-validation rejection or mutation failure (toast already shown
      // for the latter); swallow so it doesn't bubble.
    }
  };

  const submitReporting = async () => {
    if (!editing || !accountingGates.canUpdate) return;
    try {
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
    } catch {
      // Form-validation rejection or mutation failure (toast already shown
      // for the latter); swallow so it doesn't bubble.
    }
  };

  /** Whether an account id is a known leaf (deletable). Unknown ⇒ treat as leaf. */
  const isLeaf = (id: string) => leafById.get(id) !== false;

  const editingType = editing ? getAccountType(editing.code) : null;

  const element = (
    <>
      {/* ── Create Account ─────────────────────────────────── */}
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
                    return Promise.reject(
                      new Error(t('رقم الحساب مطلوب', 'Account code is required'))
                    );
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
                <div style={{ marginTop: -8, marginBottom: 16, fontSize: 13 }}>
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
            <Input
              size="large"
              placeholder={t('اسم الحساب', 'Account name')}
              dir={isAr ? 'rtl' : 'ltr'}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Edit Name ──────────────────────────────────────── */}
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
          <p style={{ marginBottom: 16 }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontWeight: 700,
                ...(editingType ? { color: editingType.color } : {}),
              }}
            >
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

      {/* ── Reporting Settings ─────────────────────────────── */}
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
          <p style={{ marginBottom: 16 }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontWeight: 700,
                ...(editingType ? { color: editingType.color } : {}),
              }}
            >
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
            <Switch checkedChildren={t('نعم', 'Yes')} unCheckedChildren={t('لا', 'No')} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );

  return {
    /** Render this once in the page to mount all three modals. */
    element,
    openCreate,
    openEditName,
    openReporting,
    deleteAccount,
    isDeleting,
    isLeaf,
  };
}
