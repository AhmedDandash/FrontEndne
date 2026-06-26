'use client';

import { useMemo, useState } from 'react';
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
  WalletOutlined,
  ReloadOutlined,
  PlusOutlined,
  EyeOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { useReceiptVouchers, useReceiptVoucherTrace, useCreateReceiptVoucher } from '@/hooks/api/useReceiptVouchers';
import { useCustomers } from '@/hooks/api/useCustomers';
import { useEmploymentOperatingContracts } from '@/hooks/api/useEmploymentOperatingContracts';
import { useAuthStore } from '@/store/authStore';
import type { ReceiptVoucherDetail, CreateReceiptVoucherNewDto } from '@/types/api.types';
import {
  renderPaymentMethod,
  renderJournalLink,
  PAYMENT_METHOD_OPTIONS,
} from '../_lib/accountingDocDisplay';
import { DocumentTraceDrawer } from '../_lib/DocumentTraceDrawer';
import styles from '../accounting-doc.module.css';

const { RangePicker } = DatePicker;

export default function ReceiptVouchersPage() {
  const language = useAuthStore((state) => state.language);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  // ── Filters ─────────────────────────────────────────────────
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [contractId, setContractId] = useState<string | undefined>();
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const { data: vouchers = [], isLoading, isFetching, refetch } = useReceiptVouchers({
    customerId,
    contractId,
    dateFrom: range?.[0]?.startOf('day').toISOString(),
    dateTo: range?.[1]?.endOf('day').toISOString(),
  });

  const { customers = [] } = useCustomers();
  const { contracts = [] } = useEmploymentOperatingContracts();
  const { mutateAsync: createVoucher, isPending: isCreating } = useCreateReceiptVoucher();

  // ── Drawers ─────────────────────────────────────────────────
  const [detailId, setDetailId] = useState<string | null>(null);
  const [traceId, setTraceId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: traceData, isLoading: isTraceLoading } = useReceiptVoucherTrace(traceId ?? undefined);

  const openDetail = (id: string) => setDetailId(id);
  const openTrace = (id: string) => { setDetailId(null); setTraceId(id); };

  const handleCreate = async () => {
    const values = await form.validateFields();
    const dto: CreateReceiptVoucherNewDto = {
      voucherNumber: values.voucherNumber?.trim() || undefined,
      voucherDate: (values.voucherDate as Dayjs).toISOString(),
      amount: values.amount,
      notes: values.notes?.trim() || undefined,
      employmentOperatingContractId: values.employmentOperatingContractId,
      paymentMethod: values.paymentMethod,
      vatAmount: values.vatAmount || undefined,
      bankFees: values.bankFees || undefined,
    };
    await createVoucher(dto);
    setCreateOpen(false);
    form.resetFields();
  };

  // ── Metrics (truthful to the list payload: amount + journal linkage) ──
  const totalAmount = useMemo(() => vouchers.reduce((s, v) => s + (v.amount || 0), 0), [vouchers]);
  const withJournal = useMemo(() => vouchers.filter((v) => v.journalEntryId).length, [vouchers]);

  const columns: ColumnsType<ReceiptVoucherDetail> = [
    { title: '#', key: 'index', width: 52, render: (_, __, idx) => idx + 1 },
    {
      title: t('رقم السند', 'Voucher No.'),
      dataIndex: 'voucherNumber',
      key: 'voucherNumber',
      width: 130,
      render: (v: string, record) => (
        <a className={styles.docNumber} onClick={() => openDetail(record.id)}>
          {v || (record.voucherSerialNumber != null ? `#${record.voucherSerialNumber}` : '—')}
        </a>
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
      title: t('ضريبة القيمة', 'VAT'),
      dataIndex: 'vatAmount',
      key: 'vatAmount',
      width: 100,
      align: 'right',
      render: (v: number) => (v ? <span className={styles.amount}>{v.toLocaleString()}</span> : <span className={styles.muted}>—</span>),
    },
    {
      title: t('طريقة الدفع', 'Payment Method'),
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 130,
      render: (v: number) => renderPaymentMethod(v, isAr),
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

  const selectedVoucher = detailId ? vouchers.find((v) => v.id === detailId) : null;

  return (
    <div className={styles.page}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <WalletOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('سندات القبض', 'Receipt Vouchers')}</h1>
              <p className={styles.pageSubtitle}>
                {t(
                  'سجل مدفوعات العملاء المرتبطة بعقود التشغيل',
                  'Record customer payments linked to operating contracts'
                )}
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

      {/* ── Metrics ────────────────────────────────────────────── */}
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

      {/* ── Table Card ─────────────────────────────────────────── */}
      <Card className={styles.tableCard}>
        <div className={styles.filters}>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            size="large"
            placeholder={t('فلتر بالعميل', 'Filter by customer')}
            className={styles.filterSelect}
            value={customerId}
            onChange={setCustomerId}
            options={(customers as any[]).map((c: any) => ({
              value: c.id,
              label: c.name || c.nameAr || c.id,
            }))}
          />
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            size="large"
            placeholder={t('فلتر بالعقد', 'Filter by contract')}
            className={styles.filterSelect}
            value={contractId}
            onChange={setContractId}
            options={(contracts as any[]).map((c: any) => ({
              value: c.id,
              label: c.contractNumber || c.id,
            }))}
          />
          <RangePicker
            size="large"
            className={styles.filterDate}
            onChange={(dates) => setRange(dates as [Dayjs | null, Dayjs | null] | null)}
          />
        </div>

        <Table<ReceiptVoucherDetail>
          rowKey="id"
          columns={columns}
          dataSource={vouchers}
          loading={isLoading}
          size="middle"
          bordered
          scroll={{ x: 900 }}
          pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (n) => t(`الإجمالي: ${n}`, `Total: ${n}`) }}
        />
      </Card>

      {/* ── Detail Drawer ───────────────────────────────────────── */}
      <Drawer
        title={t('تفاصيل سند القبض', 'Receipt Voucher Details')}
        open={!!selectedVoucher}
        onClose={() => setDetailId(null)}
        width={520}
      >
        {selectedVoucher && (
          <>
            <div className={styles.facts}>
              <div className={styles.factItem}>
                <div className={styles.factLabel}>{t('رقم السند', 'Voucher No.')}</div>
                <div className={styles.factValue}>{selectedVoucher.voucherNumber || (selectedVoucher.voucherSerialNumber != null ? `#${selectedVoucher.voucherSerialNumber}` : '—')}</div>
              </div>
              <div className={styles.factItem}>
                <div className={styles.factLabel}>{t('التاريخ', 'Date')}</div>
                <div className={styles.factValue}>{selectedVoucher.voucherDate ? new Date(selectedVoucher.voucherDate).toLocaleDateString() : '—'}</div>
              </div>
              <div className={styles.factItem}>
                <div className={styles.factLabel}>{t('المبلغ', 'Amount')}</div>
                <div className={styles.factValue}>{selectedVoucher.amount?.toLocaleString()}</div>
              </div>
              <div className={styles.factItem}>
                <div className={styles.factLabel}>{t('ضريبة القيمة', 'VAT')}</div>
                <div className={styles.factValue}>{selectedVoucher.vatAmount?.toLocaleString() || '—'}</div>
              </div>
              <div className={styles.factItem}>
                <div className={styles.factLabel}>{t('طريقة الدفع', 'Payment Method')}</div>
                <div className={styles.factValue}>{renderPaymentMethod(selectedVoucher.paymentMethod, isAr)}</div>
              </div>
              <div className={styles.factItem}>
                <div className={styles.factLabel}>{t('القيد المحاسبي', 'Journal')}</div>
                <div className={styles.factValue}>{renderJournalLink(selectedVoucher.journalEntryId, isAr)}</div>
              </div>
            </div>
            {selectedVoucher.notes && (
              <div style={{ marginBottom: 12, padding: '8px 12px', background: '#e6f4ff', borderRadius: 6, color: '#0958d9', fontSize: 13 }}>
                {selectedVoucher.notes}
              </div>
            )}
            <Button
              block
              icon={<AuditOutlined />}
              onClick={() => openTrace(selectedVoucher.id)}
              style={{ marginTop: 8 }}
            >
              {t('عرض سلسلة التتبع', 'View Audit Trail')}
            </Button>
          </>
        )}
      </Drawer>

      {/* ── Trace Drawer ────────────────────────────────────────── */}
      <DocumentTraceDrawer
        open={!!traceId}
        onClose={() => setTraceId(null)}
        trace={traceData}
        loading={isTraceLoading}
      />

      {/* ── Create Drawer ────────────────────────────────────────── */}
      <Drawer
        title={t('إضافة سند قبض', 'New Receipt Voucher')}
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
            <Input size="large" placeholder="RV-001" />
          </Form.Item>
          <Form.Item
            name="voucherDate"
            label={t('التاريخ', 'Date')}
            rules={[{ required: true, message: t('التاريخ مطلوب', 'Date is required') }]}
          >
            <DatePicker size="large" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="employmentOperatingContractId"
            label={t('عقد التشغيل', 'Operating Contract')}
            rules={[{ required: true, message: t('العقد مطلوب', 'Contract is required') }]}
          >
            <Select
              size="large"
              showSearch
              optionFilterProp="label"
              placeholder={t('اختر العقد', 'Select contract')}
              options={(contracts as any[]).map((c: any) => ({
                value: c.id,
                label: c.contractNumber || c.id,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="amount"
            label={t('المبلغ', 'Amount')}
            rules={[{ required: true, message: t('المبلغ مطلوب', 'Amount is required') }]}
          >
            <InputNumber size="large" min={0.01} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="paymentMethod" label={t('طريقة الدفع', 'Payment Method')}>
            <Select size="large" allowClear options={PAYMENT_METHOD_OPTIONS(isAr)} />
          </Form.Item>
          <Form.Item name="vatAmount" label={t('ضريبة القيمة المضافة (اختياري)', 'VAT Amount (optional)')} tooltip={t('يُحسب تلقائيًا من المبلغ إذا تُرك فارغًا', 'Computed from amount server-side if left blank')}>
            <InputNumber size="large" min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="bankFees" label={t('رسوم البنك', 'Bank Fees')}>
            <InputNumber size="large" min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label={t('ملاحظات', 'Notes')}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
