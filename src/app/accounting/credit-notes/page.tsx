'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Table,
  Select,
  Button,
  Space,
  Tooltip,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import {
  MinusCircleOutlined,
  ReloadOutlined,
  PlusOutlined,
  EyeOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { useCreditNotes, useCreditNoteTrace, useCreateCreditNote } from '@/hooks/api/useCreditNotes';
import { useCustomers } from '@/hooks/api/useCustomers';
import { useAuthStore } from '@/store/authStore';
import type { CreditNote, CreateCreditNoteDto } from '@/types/api.types';
import { linkProps } from '@/lib/navigation/linkProps';
import { renderJournalLink } from '../_lib/accountingDocDisplay';
import { DocumentTraceDrawer } from '../_lib/DocumentTraceDrawer';
import { useAccountingDocFilters } from '../_lib/useAccountingDocFilters';
import AccountingDocFilters from '../_lib/AccountingDocFilters';
import { useAccountingActionGates } from '@/hooks/useActionPermissionGates';
import styles from '../accounting-doc.module.css';

export default function CreditNotesPage() {
  const router = useRouter();
  const language = useAuthStore((state) => state.language);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const accountingGates = useAccountingActionGates();

  const filters = useAccountingDocFilters();

  const { data: notes = [], isLoading, isFetching, refetch } = useCreditNotes(filters.params);

  const { customers = [] } = useCustomers();
  const { mutateAsync: createNote, isPending: isCreating } = useCreateCreditNote();

  const [traceId, setTraceId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: traceData, isLoading: isTraceLoading } = useCreditNoteTrace(traceId ?? undefined);

  const openDetail = (id: string) => router.push(`/accounting/credit-notes/${id}`);
  const openTrace = (id: string) => setTraceId(id);

  const handleCreate = async () => {
    if (!accountingGates.canCreate) return;
    try {
      const values = await form.validateFields();
      const dto: CreateCreditNoteDto = {
        creditNoteNumber: values.creditNoteNumber?.trim() || undefined,
        creditNoteDate: (values.creditNoteDate as Dayjs).toISOString(),
        amount: values.amount,
        vatAmount: values.vatAmount || undefined,
        reason: values.reason?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
        customerId: values.customerId,
        sourceContractId: values.sourceContractId?.trim() || undefined,
        sourceContractType: values.sourceContractType?.trim() || undefined,
      };
      await createNote(dto);
      setCreateOpen(false);
      form.resetFields();
    } catch {
      // Form-validation rejection or mutation failure (toast already shown
      // for the latter); swallow so it doesn't bubble as an unhandled
      // promise rejection.
    }
  };

  const totalAmount = useMemo(() => notes.reduce((s, n) => s + (n.amount || 0), 0), [notes]);
  const withJournal = useMemo(() => notes.filter((n) => n.journalEntryId).length, [notes]);

  const columns: ColumnsType<CreditNote> = [
    { title: '#', key: 'index', width: 52, render: (_, __, idx) => idx + 1 },
    {
      title: t('رقم الإشعار', 'Note No.'),
      dataIndex: 'creditNoteNumber',
      key: 'creditNoteNumber',
      width: 140,
      render: (v: string, record) => (
        <a className={styles.docNumber} {...linkProps(`/accounting/credit-notes/${record.id}`, router)}>{v || '—'}</a>
      ),
    },
    {
      title: t('التاريخ', 'Date'),
      dataIndex: 'creditNoteDate',
      key: 'creditNoteDate',
      width: 110,
      render: (v: string) => (v ? new Date(v).toLocaleDateString() : '—'),
    },
    {
      title: t('المبلغ', 'Amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      render: (v: number) => <span className={styles.amount}>{v?.toLocaleString()}</span>,
    },
    {
      title: t('ضريبة القيمة', 'VAT'),
      dataIndex: 'vatAmount',
      key: 'vatAmount',
      width: 100,
      align: 'right',
      render: (v: number) => (v ? <span className={styles.amount}>{v.toLocaleString()}</span> : <span className={styles.muted}>—</span>),
    },
    {
      title: t('السبب', 'Reason'),
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (v: string) => v || <span className={styles.muted}>—</span>,
    },
    {
      title: t('القيد المحاسبي', 'Journal'),
      dataIndex: 'journalEntryId',
      key: 'journalEntryId',
      width: 140,
      render: (v: string) => renderJournalLink(v, isAr),
    },
    {
      title: t('إجراءات', 'Actions'),
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size={2}>
          <Tooltip title={t('عرض', 'View')}>
            <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => openDetail(record.id)} />
          </Tooltip>
          <Tooltip title={t('تتبع القيد', 'Trace')}>
            <Button size="small" type="text" icon={<AuditOutlined />} onClick={() => openTrace(record.id)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <MinusCircleOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('إشعارات الدائن', 'Credit Notes')}</h1>
              <p className={styles.pageSubtitle}>
                {t('تعديل أرصدة العملاء والمبالغ المستردة', 'Adjust customer balances and refund amounts')}
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button icon={<ReloadOutlined spin={isFetching} />} onClick={() => refetch()} className={styles.refreshBtn}>
              {t('تحديث', 'Refresh')}
            </Button>
            {accountingGates.canCreate && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)} className={styles.addBtn}>
                {t('إضافة إشعار', 'New Note')}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className={styles.metrics}>
        <div className={`${styles.metricCard} ${styles.total}`}>
          <div className={styles.metricLabel}>{t('عدد الإشعارات', 'Note Count')}</div>
          <div className={styles.metricValue}>{notes.length}</div>
        </div>
        <div className={`${styles.metricCard} ${styles.posted}`}>
          <div className={styles.metricLabel}>{t('إجمالي المبالغ', 'Total Amount')}</div>
          <div className={styles.metricValue}>{totalAmount.toLocaleString()}</div>
        </div>
        <div className={`${styles.metricCard} ${styles.draft}`}>
          <div className={styles.metricLabel}>{t('مرتبطة بقيد', 'With Journal')}</div>
          <div className={styles.metricValue}>{withJournal}</div>
        </div>
      </div>

      <AccountingDocFilters filters={filters} documentNumberAr="رقم الإشعار" contractSource="any" />

      <Card className={styles.tableCard}>
        <Table<CreditNote>
          rowKey="id" columns={columns} dataSource={notes} loading={isLoading}
          size="middle" bordered scroll={{ x: 950 }}
          pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (n) => t(`الإجمالي: ${n}`, `Total: ${n}`) }}
        />
      </Card>

      {/* Trace Drawer */}
      <DocumentTraceDrawer
        open={!!traceId}
        onClose={() => setTraceId(null)}
        trace={traceData}
        loading={isTraceLoading}
      />

      {/* Create Drawer */}
      <Drawer
        title={t('إضافة إشعار دائن', 'New Credit Note')}
        open={createOpen && accountingGates.canCreate}
        onClose={() => { setCreateOpen(false); form.resetFields(); }}
        width={480}
        footer={
          <Space style={{ float: 'right' }}>
            <Button onClick={() => { setCreateOpen(false); form.resetFields(); }}>{t('إلغاء', 'Cancel')}</Button>
            <Button type="primary" loading={isCreating} onClick={handleCreate}>{t('حفظ', 'Save')}</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="creditNoteNumber" label={t('رقم الإشعار', 'Note Number')} rules={[{ required: true, message: t('الرقم مطلوب', 'Number is required') }]}>
            <Input size="large" placeholder="CN-001" />
          </Form.Item>
          <Form.Item name="creditNoteDate" label={t('التاريخ', 'Date')} rules={[{ required: true, message: t('التاريخ مطلوب', 'Date is required') }]}>
            <DatePicker size="large" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="customerId" label={t('العميل', 'Customer')} rules={[{ required: true, message: t('العميل مطلوب', 'Customer is required') }]}>
            <Select size="large" showSearch optionFilterProp="label"
              placeholder={t('اختر العميل', 'Select customer')}
              options={(customers as any[]).map((c: any) => ({ value: c.id, label: (isAr ? c.arabicName || c.englishName : c.englishName || c.arabicName) || String(c.id) }))}
            />
          </Form.Item>
          <Form.Item name="amount" label={t('المبلغ', 'Amount')} rules={[{ required: true, message: t('المبلغ مطلوب', 'Amount is required') }]}>
            <InputNumber size="large" min={0.01} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="vatAmount" label={t('ضريبة القيمة المضافة', 'VAT Amount')}>
            <InputNumber size="large" min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reason" label={t('السبب', 'Reason')}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="sourceContractId" label={t('معرف العقد المصدر', 'Source Contract ID')}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="sourceContractType" label={t('نوع العقد', 'Contract Type')}>
            <Select size="large" allowClear options={[
              { value: 'EmploymentOperatingContract', label: t('عقد التشغيل', 'Operating Contract') },
              { value: 'MediationContract', label: t('عقد الوساطة', 'Mediation Contract') },
            ]} />
          </Form.Item>
          <Form.Item name="notes" label={t('ملاحظات', 'Notes')}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
