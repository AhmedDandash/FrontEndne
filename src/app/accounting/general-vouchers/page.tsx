'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Dayjs } from 'dayjs';
import {
  Button,
  Card,
  DatePicker,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Table,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  AuditOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  PrinterOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import {
  useGeneralVouchers,
  useGeneralVoucherTrace,
  useDeleteGeneralVoucher,
} from '@/hooks/api/useGeneralVouchers';
import { GeneralVoucherService } from '@/services/general-voucher.service';
import { API_ENDPOINTS } from '@/config/api.config';
import { AdvancedFilterPanel, BranchFilterSelect, ExportButton } from '@/components/filters';
import { linkProps } from '@/lib/navigation/linkProps';
import { renderJournalLink, renderJournalStatus } from '../_lib/accountingDocDisplay';
import { DocumentTraceDrawer } from '../_lib/DocumentTraceDrawer';
import VoucherTypeDropdown from './_components/VoucherTypeDropdown';
import { useAccountingActionGates } from '@/hooks/useActionPermissionGates';
import {
  VOUCHER_PAYMENT_METHOD_OPTIONS,
  VOUCHER_TYPE_OPTIONS,
  formatMoney,
  renderVoucherPaymentMethod,
  renderVoucherType,
} from './_lib/generalVoucherDisplay';
import type { GeneralVoucherDto, GeneralVoucherFilterDto } from '@/types/general-voucher.types';
import styles from '../accounting-doc.module.css';

const { RangePicker } = DatePicker;
const ROUTE = '/accounting/general-vouchers';

const JOURNAL_STATUS_OPTIONS = (isAr: boolean) => [
  { value: 0, label: isAr ? 'مسودة' : 'Draft' },
  { value: 1, label: isAr ? 'معمد' : 'Posted' },
  { value: 2, label: isAr ? 'بانتظار الاعتماد' : 'Pending Approval' },
  { value: 3, label: isAr ? 'ملغي' : 'Cancelled' },
];

export default function GeneralVouchersPage() {
  const router = useRouter();
  const language = useAuthStore((state) => state.language);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const accountingGates = useAccountingActionGates();

  // ── Filters ─────────────────────────────────────────────────
  const [search, setSearch] = useState<string>();
  const [voucherNumber, setVoucherNumber] = useState<string>();
  const [voucherType, setVoucherType] = useState<number>();
  const [paymentMethod, setPaymentMethod] = useState<number>();
  const [status, setStatus] = useState<number>();
  const [amountFrom, setAmountFrom] = useState<number>();
  const [amountTo, setAmountTo] = useState<number>();
  const [branchId, setBranchId] = useState<string>();
  const [includeSubBranches, setIncludeSubBranches] = useState(true);
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const filters: GeneralVoucherFilterDto = useMemo(
    () => ({
      search: search?.trim() || undefined,
      voucherNumber: voucherNumber?.trim() || undefined,
      voucherType,
      paymentMethod,
      status,
      amountFrom,
      amountTo,
      branchId,
      includeSubBranches: branchId ? includeSubBranches : undefined,
      dateFrom: range?.[0]?.startOf('day').toISOString(),
      dateTo: range?.[1]?.endOf('day').toISOString(),
      pageNumber: page,
      pageSize,
    }),
    [
      search,
      voucherNumber,
      voucherType,
      paymentMethod,
      status,
      amountFrom,
      amountTo,
      branchId,
      includeSubBranches,
      range,
      page,
      pageSize,
    ]
  );

  const { data, isLoading, isFetching, refetch } = useGeneralVouchers(filters);
  const vouchers = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;

  const { mutateAsync: deleteVoucher } = useDeleteGeneralVoucher();

  const [traceId, setTraceId] = useState<string | null>(null);
  const { data: traceData, isLoading: isTraceLoading } = useGeneralVoucherTrace(
    traceId ?? undefined
  );

  const activeFilterCount = [
    voucherNumber,
    voucherType,
    paymentMethod,
    status,
    amountFrom,
    amountTo,
    range?.[0],
  ].filter((v) => v !== undefined && v !== null && v !== '').length;

  const clearFilters = () => {
    setVoucherNumber(undefined);
    setVoucherType(undefined);
    setPaymentMethod(undefined);
    setStatus(undefined);
    setAmountFrom(undefined);
    setAmountTo(undefined);
    setRange(null);
    setPage(1);
  };

  /**
   * Update and delete are rejected by the backend once the linked journal is
   * Posted, so the actions are disabled here rather than letting the user
   * discover it through a failed request. `status` is null until a journal
   * exists, which is still editable.
   */
  const isLocked = (voucher: GeneralVoucherDto) => voucher.status === 1;

  const columns: ColumnsType<GeneralVoucherDto> = [
    {
      title: t('المسلسل', 'Serial'),
      dataIndex: 'voucherSerialNumber',
      key: 'voucherSerialNumber',
      width: 90,
      render: (v: number | null) => (v != null ? `#${v}` : '—'),
    },
    {
      title: t('رقم السند', 'Voucher No.'),
      dataIndex: 'voucherNumber',
      key: 'voucherNumber',
      width: 140,
      render: (v: string | null, record) => (
        <a className={styles.docNumber} {...linkProps(`${ROUTE}/${record.id}`, router)}>
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
      title: t('النوع', 'Type'),
      dataIndex: 'voucherType',
      key: 'voucherType',
      width: 180,
      render: (v: number, record) => renderVoucherType(v, isAr, record.voucherTypeName),
    },
    {
      title: t('المبلغ', 'Amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      render: (v: number) => <span className={styles.amount}>{formatMoney(v)}</span>,
    },
    {
      title: t('الضريبة', 'VAT'),
      dataIndex: 'vatAmount',
      key: 'vatAmount',
      width: 110,
      align: 'right',
      render: (v: number | null) =>
        v ? <span className={styles.amount}>{formatMoney(v)}</span> : <span className={styles.muted}>—</span>,
    },
    {
      title: t('الإجمالي', 'Total'),
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 130,
      align: 'right',
      render: (v: number | null) => (
        <span className={styles.amount} style={{ fontWeight: 600 }}>
          {formatMoney(v)}
        </span>
      ),
    },
    {
      title: t('طريقة الدفع', 'Payment Method'),
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 130,
      render: (v: number | null, record) =>
        renderVoucherPaymentMethod(v, isAr, record.paymentMethodName),
    },
    {
      title: t('الحالة', 'Status'),
      key: 'status',
      width: 150,
      // `status` is only populated once a journal entry exists; until then the
      // meaningful signal is whether the voucher is linked at all.
      render: (_, record) =>
        record.status != null
          ? renderJournalStatus(record.status, isAr)
          : renderJournalLink(record.journalEntryId, isAr),
    },
    {
      title: t('إجراءات', 'Actions'),
      key: 'actions',
      width: 190,
      fixed: 'right',
      render: (_, record) => {
        const locked = isLocked(record);
        return (
          <Space size={2}>
            <Tooltip title={t('عرض', 'View')}>
              <Button
                size="small"
                type="text"
                icon={<EyeOutlined />}
                onClick={() => router.push(`${ROUTE}/${record.id}`)}
              />
            </Tooltip>
            <Tooltip title={t('تعديل', 'Edit')}>
              {accountingGates.canUpdate ? (
                <Button
                  size="small"
                  type="text"
                  disabled={locked}
                  icon={<EditOutlined />}
                  onClick={() => router.push(`${ROUTE}/${record.id}?edit=1`)}
                />
              ) : (
                <span />
              )}
            </Tooltip>
            <Tooltip title={t('طباعة', 'Print')}>
              <Button
                size="small"
                type="text"
                icon={<PrinterOutlined />}
                href={`${ROUTE}/${record.id}/print`}
                target="_blank"
                rel="noopener noreferrer"
              />
            </Tooltip>
            <Tooltip title={t('تتبع القيد', 'Trace Journal')}>
              <Button
                size="small"
                type="text"
                icon={<AuditOutlined />}
                onClick={() => setTraceId(record.id)}
              />
            </Tooltip>
            {accountingGates.canDelete && (
              <Popconfirm
                title={t('حذف السند؟', 'Delete voucher?')}
                description={t('لا يمكن التراجع عن هذا الإجراء.', 'This action cannot be undone.')}
                okButtonProps={{ danger: true }}
                okText={t('حذف', 'Delete')}
                cancelText={t('إلغاء', 'Cancel')}
                disabled={locked}
                onConfirm={() => void deleteVoucher(record.id).catch(() => {})}
              >
                <Tooltip
                  title={
                    locked
                      ? t('لا يمكن حذف سند معمد', 'Cannot delete a posted voucher')
                      : t('حذف', 'Delete')
                  }
                >
                  <Button size="small" type="text" danger disabled={locked} icon={<DeleteOutlined />} />
                </Tooltip>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className={styles.page}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <FileTextOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('السندات العامة', 'General Vouchers')}</h1>
              <p className={styles.pageSubtitle}>
                {t(
                  'إدارة سندات القبض والصرف بأنواعها الستة مع الربط المحاسبي',
                  'Manage all six voucher types with account-based journal integration'
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
            <VoucherTypeDropdown
              isAr={isAr}
              className={styles.addBtn}
              canCreate={accountingGates.canCreate}
            />
          </div>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────── */}
      <AdvancedFilterPanel
        activeCount={activeFilterCount}
        onClear={clearFilters}
        quickFilters={
          <>
            <Input.Search
              allowClear
              placeholder={t('بحث...', 'Search...')}
              style={{ width: 240 }}
              onSearch={(value) => {
                setSearch(value);
                setPage(1);
              }}
            />
            <BranchFilterSelect
              value={branchId}
              onChange={(value) => {
                setBranchId(value);
                setPage(1);
              }}
              includeSubBranches={includeSubBranches}
              onIncludeSubBranchesChange={setIncludeSubBranches}
            />
          </>
        }
        actions={
          <ExportButton
            endpoint={API_ENDPOINTS.GENERAL_VOUCHER.EXPORT}
            filters={GeneralVoucherService.exportParams(filters)}
            fileName="general-vouchers.xlsx"
            label={t('تصدير Excel', 'Export Excel')}
          />
        }
      >
        <Input
          allowClear
          placeholder={t('رقم السند', 'Voucher number')}
          style={{ width: 180 }}
          value={voucherNumber}
          onChange={(e) => {
            setVoucherNumber(e.target.value);
            setPage(1);
          }}
        />
        <Select
          allowClear
          placeholder={t('نوع السند', 'Voucher type')}
          style={{ width: 200 }}
          value={voucherType}
          onChange={(value) => {
            setVoucherType(value);
            setPage(1);
          }}
          options={VOUCHER_TYPE_OPTIONS(isAr)}
        />
        <Select
          allowClear
          placeholder={t('طريقة الدفع', 'Payment method')}
          style={{ width: 170 }}
          value={paymentMethod}
          onChange={(value) => {
            setPaymentMethod(value);
            setPage(1);
          }}
          options={VOUCHER_PAYMENT_METHOD_OPTIONS(isAr)}
        />
        <Select
          allowClear
          placeholder={t('الحالة', 'Status')}
          style={{ width: 170 }}
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          options={JOURNAL_STATUS_OPTIONS(isAr)}
        />
        <InputNumber
          placeholder={t('المبلغ من', 'Amount from')}
          style={{ width: 140 }}
          min={0}
          value={amountFrom}
          onChange={(value) => {
            setAmountFrom(value ?? undefined);
            setPage(1);
          }}
        />
        <InputNumber
          placeholder={t('المبلغ إلى', 'Amount to')}
          style={{ width: 140 }}
          min={0}
          value={amountTo}
          onChange={(value) => {
            setAmountTo(value ?? undefined);
            setPage(1);
          }}
        />
        <RangePicker
          value={range}
          onChange={(dates) => {
            setRange(dates as [Dayjs | null, Dayjs | null] | null);
            setPage(1);
          }}
        />
      </AdvancedFilterPanel>

      {/* ── Table ──────────────────────────────────────────────── */}
      <Card className={styles.tableCard}>
        <Table<GeneralVoucherDto>
          rowKey="id"
          columns={columns}
          dataSource={vouchers}
          loading={isLoading}
          size="middle"
          bordered
          scroll={{ x: 1400 }}
          pagination={{
            current: page,
            pageSize,
            // Server-side paging: totalCount is authoritative. The response's
            // own `pageSize` echoes the row count, so it is not used here.
            total: totalCount,
            showSizeChanger: true,
            onChange: (nextPage, nextSize) => {
              setPage(nextPage);
              setPageSize(nextSize);
            },
            showTotal: (n) => t(`الإجمالي: ${n}`, `Total: ${n}`),
          }}
        />
      </Card>

      <DocumentTraceDrawer
        open={!!traceId}
        onClose={() => setTraceId(null)}
        trace={traceData}
        loading={isTraceLoading}
      />
    </div>
  );
}
