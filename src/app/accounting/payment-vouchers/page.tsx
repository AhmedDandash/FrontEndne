'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Table,
  Select,
  Button,
  Tag,
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
  DollarOutlined,
  ReloadOutlined,
  PlusOutlined,
  EyeOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { usePaymentVouchers, usePaymentVoucherTrace, useCreatePaymentVoucher } from '@/hooks/api/usePaymentVouchers';
import { useCustomers } from '@/hooks/api/useCustomers';
import { useAgents } from '@/hooks/api/useAgents';
import { useAuthStore } from '@/store/authStore';
import type { PaymentVoucher, CreatePaymentVoucherDto } from '@/types/api.types';
import {
  renderPaymentMethod,
  renderJournalLink,
  PAYMENT_METHOD_OPTIONS,
} from '../_lib/accountingDocDisplay';
import { DocumentTraceDrawer } from '../_lib/DocumentTraceDrawer';
import { useAccountingDocFilters } from '../_lib/useAccountingDocFilters';
import AccountingDocFilters from '../_lib/AccountingDocFilters';
import styles from '../accounting-doc.module.css';

export default function PaymentVouchersPage() {
  const router = useRouter();
  const language = useAuthStore((state) => state.language);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const filters = useAccountingDocFilters();

  const { data: vouchers = [], isLoading, isFetching, refetch } = usePaymentVouchers(filters.params);

  const { customers = [] } = useCustomers();
  const { data: agents = [] } = useAgents();
  const { mutateAsync: createVoucher, isPending: isCreating } = useCreatePaymentVoucher();

  // ── Drawers ─────────────────────────────────────────────────
  const [traceId, setTraceId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: traceData, isLoading: isTraceLoading } = usePaymentVoucherTrace(traceId ?? undefined);

  const openDetail = (id: string) => router.push(`/accounting/payment-vouchers/${id}`);
  const openTrace = (id: string) => setTraceId(id);

  const handleCreate = async () => {
    const values = await form.validateFields();
    const dto: CreatePaymentVoucherDto = {
      voucherNumber: values.voucherNumber?.trim() || undefined,
      voucherDate: (values.voucherDate as Dayjs).toISOString(),
      amount: values.amount,
      notes: values.notes?.trim() || undefined,
      paymentMethod: values.paymentMethod,
      payeeId: values.payeeId,
      payeeType: values.payeeType,
      customerId: values.customerId,
      sourceContractId: values.sourceContractId?.trim() || undefined,
      sourceContractType: values.sourceContractType?.trim() || undefined,
    };
    await createVoucher(dto);
    setCreateOpen(false);
    form.resetFields();
  };

  const totalAmount = useMemo(() => vouchers.reduce((s, v) => s + (v.amount || 0), 0), [vouchers]);
  const withJournal = useMemo(() => vouchers.filter((v) => v.journalEntryId).length, [vouchers]);

  const columns: ColumnsType<PaymentVoucher> = [
    { title: '#', key: 'index', width: 52, render: (_, __, idx) => idx + 1 },
    {
      title: t('رقم السند', 'Voucher No.'),
      dataIndex: 'voucherNumber',
      key: 'voucherNumber',
      width: 140,
      render: (v: string, record) => (
        <a className={styles.docNumber} onClick={() => openDetail(record.id)}>{v || '—'}</a>
      ),
    },
    {
      title: t('التاريخ', 'Date'),
      dataIndex: 'voucherDate',
      key: 'voucherDate',
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
      title: t('طريقة الدفع', 'Payment Method'),
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 130,
      render: (v: number) => renderPaymentMethod(v, isAr),
    },
    {
      title: t('نوع المستفيد', 'Payee Type'),
      dataIndex: 'payeeType',
      key: 'payeeType',
      width: 110,
      render: (v: string) => (v ? <Tag>{v}</Tag> : <span className={styles.muted}>—</span>),
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
          <Tooltip title={t('تتبع القيد', 'Trace Journal')}>
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
            <DollarOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('سندات الصرف', 'Payment Vouchers')}</h1>
              <p className={styles.pageSubtitle}>
                {t('مدفوعات صادرة للوكلاء والموردين', 'Outbound payments to agents and vendors')}
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button icon={<ReloadOutlined spin={isFetching} />} onClick={() => refetch()} className={styles.refreshBtn}>
              {t('تحديث', 'Refresh')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)} className={styles.addBtn}>
              {t('إضافة سند', 'New Voucher')}
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.metrics}>
        <div className={`${styles.metricCard} ${styles.total}`}>
          <div className={styles.metricLabel}>{t('عدد السندات', 'Voucher Count')}</div>
          <div className={styles.metricValue}>{vouchers.length}</div>
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

      <AccountingDocFilters filters={filters} documentNumberAr="رقم السند" contractSource="any" />

      <Card className={styles.tableCard}>
        <Table<PaymentVoucher>
          rowKey="id" columns={columns} dataSource={vouchers} loading={isLoading}
          size="middle" bordered scroll={{ x: 900 }}
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
        title={t('إضافة سند صرف', 'New Payment Voucher')}
        open={createOpen}
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
          <Form.Item name="voucherNumber" label={t('رقم السند', 'Voucher Number')}>
            <Input size="large" placeholder="PV-001" />
          </Form.Item>
          <Form.Item name="voucherDate" label={t('التاريخ', 'Date')} rules={[{ required: true, message: t('التاريخ مطلوب', 'Date is required') }]}>
            <DatePicker size="large" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="amount" label={t('المبلغ', 'Amount')} rules={[{ required: true, message: t('المبلغ مطلوب', 'Amount is required') }]}>
            <InputNumber size="large" min={0.01} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="paymentMethod" label={t('طريقة الدفع', 'Payment Method')}>
            <Select size="large" allowClear options={PAYMENT_METHOD_OPTIONS(isAr)} />
          </Form.Item>
          <Form.Item name="payeeType" label={t('نوع المستفيد', 'Payee Type')}>
            <Select size="large" allowClear options={[
              { value: 'Agent', label: t('وكيل', 'Agent') },
              { value: 'Vendor', label: t('مورد', 'Vendor') },
              { value: 'Employee', label: t('موظف', 'Employee') },
            ]} />
          </Form.Item>
          <Form.Item name="payeeId" label={t('الوكيل (المستفيد)', 'Agent (Payee)')}>
            <Select size="large" allowClear showSearch optionFilterProp="label"
              placeholder={t('اختر الوكيل', 'Select agent')}
              options={(agents as any[]).map((a: any) => ({ value: a.id, label: (isAr ? a.agentNameAr || a.agentNameEn : a.agentNameEn || a.agentNameAr) || String(a.id) }))}
            />
          </Form.Item>
          <Form.Item name="customerId" label={t('العميل', 'Customer')}>
            <Select size="large" allowClear showSearch optionFilterProp="label"
              placeholder={t('اختر العميل', 'Select customer')}
              options={(customers as any[]).map((c: any) => ({ value: c.id, label: (isAr ? c.arabicName || c.englishName : c.englishName || c.arabicName) || String(c.id) }))}
            />
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
