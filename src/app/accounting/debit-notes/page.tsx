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
  PlusCircleOutlined,
  ReloadOutlined,
  PlusOutlined,
  EyeOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { useDebitNotes, useDebitNoteTrace, useCreateDebitNote } from '@/hooks/api/useDebitNotes';
import { useAgents } from '@/hooks/api/useAgents';
import { useAuthStore } from '@/store/authStore';
import type { DebitNote, CreateDebitNoteDto } from '@/types/api.types';
import { linkProps } from '@/lib/navigation/linkProps';
import { renderJournalLink } from '../_lib/accountingDocDisplay';
import { DocumentTraceDrawer } from '../_lib/DocumentTraceDrawer';
import { useAccountingDocFilters } from '../_lib/useAccountingDocFilters';
import AccountingDocFilters from '../_lib/AccountingDocFilters';
import { useAccountingActionGates } from '@/hooks/useActionPermissionGates';
import styles from '../accounting-doc.module.css';

export default function DebitNotesPage() {
  const router = useRouter();
  const language = useAuthStore((state) => state.language);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const accountingGates = useAccountingActionGates();

  const filters = useAccountingDocFilters();

  const { data: notes = [], isLoading, isFetching, refetch } = useDebitNotes(filters.params);

  const { data: agents = [] } = useAgents();
  const { mutateAsync: createNote, isPending: isCreating } = useCreateDebitNote();

  const [traceId, setTraceId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: traceData, isLoading: isTraceLoading } = useDebitNoteTrace(traceId ?? undefined);

  const openDetail = (id: string) => router.push(`/accounting/debit-notes/${id}`);
  const openTrace = (id: string) => setTraceId(id);

  const handleCreate = async () => {
    if (!accountingGates.canCreate) return;
    try {
      const values = await form.validateFields();
      const dto: CreateDebitNoteDto = {
        debitNoteNumber: values.debitNoteNumber?.trim() || undefined,
        debitNoteDate: (values.debitNoteDate as Dayjs).toISOString(),
        amount: values.amount,
        vatAmount: values.vatAmount || undefined,
        reason: values.reason?.trim() || undefined,
        agentId: values.agentId,
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

  const columns: ColumnsType<DebitNote> = [
    { title: '#', key: 'index', width: 52, render: (_, __, idx) => idx + 1 },
    {
      title: t('رقم الإشعار', 'Note No.'),
      dataIndex: 'debitNoteNumber',
      key: 'debitNoteNumber',
      width: 140,
      render: (v: string, record) => (
        <a className={styles.docNumber} {...linkProps(`/accounting/debit-notes/${record.id}`, router)}>{v || '—'}</a>
      ),
    },
    {
      title: t('التاريخ', 'Date'),
      dataIndex: 'debitNoteDate',
      key: 'debitNoteDate',
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
            <PlusCircleOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('إشعارات المدين', 'Debit Notes')}</h1>
              <p className={styles.pageSubtitle}>
                {t('غرامات الوكلاء والرسوم الإضافية', 'Agent penalties and additional charges')}
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
        <Table<DebitNote>
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
        title={t('إضافة إشعار مدين', 'New Debit Note')}
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
          <Form.Item name="debitNoteNumber" label={t('رقم الإشعار', 'Note Number')} rules={[{ required: true, message: t('الرقم مطلوب', 'Number is required') }]}>
            <Input size="large" placeholder="DN-001" />
          </Form.Item>
          <Form.Item name="debitNoteDate" label={t('التاريخ', 'Date')} rules={[{ required: true, message: t('التاريخ مطلوب', 'Date is required') }]}>
            <DatePicker size="large" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="agentId" label={t('الوكيل', 'Agent')} rules={[{ required: true, message: t('الوكيل مطلوب', 'Agent is required') }]}>
            <Select size="large" showSearch optionFilterProp="label"
              placeholder={t('اختر الوكيل', 'Select agent')}
              options={(agents as any[]).map((a: any) => ({ value: a.id, label: (isAr ? a.agentNameAr || a.agentNameEn : a.agentNameEn || a.agentNameAr) || String(a.id) }))}
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
        </Form>
      </Drawer>
    </div>
  );
}
