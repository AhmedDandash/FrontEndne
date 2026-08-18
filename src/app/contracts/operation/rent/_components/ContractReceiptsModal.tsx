/**
 * Per-contract receipt vouchers manager.
 * Lists the vouchers recorded against a contract and exposes add (create).
 * Connects the ReceiptVoucher GET / POST endpoints to a screen.
 *
 * NOTE: the live backend exposes only GET + POST for ReceiptVoucher
 * (PUT and DELETE /api/ReceiptVoucher/{id} return 405 Method Not Allowed),
 * so edit/delete are intentionally not offered here.
 *
 * GET is filtered server-side by employmentOperatingContractId; we also filter
 * client-side as a safety net in case the API ignores the query param.
 */
'use client';

import React, { useMemo, useState } from 'react';
import { Modal, Button, Table, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, FileDoneOutlined } from '@ant-design/icons';
import { useReceiptVouchers } from '@/hooks/api/useReceiptVouchers';
import { useAccountingActionGates } from '@/hooks/useActionPermissionGates';
import type { ReceiptVoucher } from '@/types/api.types';
import { formatDate, formatCurrency } from './format';
import ReceiptVoucherModal from './ReceiptVoucherModal';

interface Props {
  open: boolean;
  isRtl: boolean;
  contractId: string | null;
  contractLabel?: string;
  onClose: () => void;
}

export default function ContractReceiptsModal({
  open,
  isRtl,
  contractId,
  contractLabel,
  onClose,
}: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const accountingGates = useAccountingActionGates();

  const { data: vouchers = [], isLoading } = useReceiptVouchers(
    contractId ? { contractId } : undefined
  );

  // Safety-net client filter (in case the API ignores the contract query param).
  const rows = useMemo(
    () =>
      (vouchers as ReceiptVoucher[]).filter(
        (v) => !contractId || String(v.employmentOperatingContractId) === String(contractId)
      ),
    [vouchers, contractId]
  );

  const total = rows.reduce((sum, v) => sum + (v.amount || 0), 0);

  const paymentLabel = (v: number | null | undefined) => {
    const map: Record<number, { ar: string; en: string }> = {
      1: { ar: 'نقدًا', en: 'Cash' },
      2: { ar: 'تحويل بنكي', en: 'Bank' },
      3: { ar: 'بطاقة', en: 'Card' },
    };
    if (!v || !map[v]) return '—';
    return isRtl ? map[v].ar : map[v].en;
  };

  const columns: ColumnsType<ReceiptVoucher> = [
    {
      title: isRtl ? '#' : '#',
      dataIndex: 'voucherSerialNumber',
      key: 'voucherSerialNumber',
      width: 56,
      render: (v: number) => (v != null ? v : '—'),
    },
    {
      title: isRtl ? 'رقم السند' : 'Voucher No.',
      dataIndex: 'voucherNumber',
      key: 'voucherNumber',
      render: (v: string) => v || '—',
    },
    {
      title: isRtl ? 'التاريخ' : 'Date',
      dataIndex: 'voucherDate',
      key: 'voucherDate',
      render: (v: string) => (v ? formatDate(v, isRtl) : '—'),
    },
    {
      title: isRtl ? 'طريقة الدفع' : 'Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (v: number) => paymentLabel(v),
    },
    {
      title: isRtl ? 'المبلغ' : 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (v: number) => formatCurrency(v || 0, isRtl),
    },
    {
      title: isRtl ? 'ض.ق.م' : 'VAT',
      dataIndex: 'vatAmount',
      key: 'vatAmount',
      align: 'right',
      render: (v: number) => (v != null ? formatCurrency(v, isRtl) : '—'),
    },
    {
      title: isRtl ? 'ملاحظات' : 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (v: string) => v || '—',
    },
  ];

  return (
    <>
      <Modal
        title={
          <span>
            <FileDoneOutlined style={{ marginInlineEnd: 8 }} />
            {isRtl ? 'سندات القبض' : 'Receipt Vouchers'}
            {contractLabel ? ` — ${contractLabel}` : ''}
          </span>
        }
        open={open}
        onCancel={onClose}
        footer={[
          <Button key="close" onClick={onClose}>
            {isRtl ? 'إغلاق' : 'Close'}
          </Button>,
          accountingGates.canCreate ? (
            <Button
              key="add"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setFormOpen(true)}
            >
              {isRtl ? 'سند جديد' : 'New Voucher'}
            </Button>
          ) : null,
        ]}
        width={720}
        destroyOnHidden
      >
        {rows.length === 0 && !isLoading ? (
          <Empty description={isRtl ? 'لا توجد سندات قبض' : 'No receipt vouchers yet'} />
        ) : (
          <>
            <Table<ReceiptVoucher>
              rowKey="id"
              size="small"
              loading={isLoading}
              columns={columns}
              dataSource={rows}
              pagination={false}
            />
            <div style={{ textAlign: isRtl ? 'left' : 'right', marginTop: 12, fontWeight: 600 }}>
              {isRtl ? 'الإجمالي المحصّل: ' : 'Total collected: '}
              {formatCurrency(total, isRtl)}
            </div>
          </>
        )}
      </Modal>

      <ReceiptVoucherModal
        open={formOpen && accountingGates.canCreate}
        isRtl={isRtl}
        contractId={contractId}
        contractLabel={contractLabel}
        onClose={() => setFormOpen(false)}
      />
    </>
  );
}
