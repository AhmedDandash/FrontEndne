/**
 * Per-contract receipt vouchers manager.
 * Lists the vouchers recorded against a contract and exposes add / edit / delete.
 * Connects the previously-unused ReceiptVoucher GET / PUT / DELETE endpoints to a screen.
 *
 * GET is filtered server-side by employmentOperatingContractId; we also filter
 * client-side as a safety net in case the API ignores the query param.
 */
'use client';

import React, { useMemo, useState } from 'react';
import { Modal, Button, Table, Empty, Popconfirm, Space, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, FileDoneOutlined } from '@ant-design/icons';
import { useReceiptVouchers, useDeleteReceiptVoucher } from '@/hooks/api/useReceiptVouchers';
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
  const [formModal, setFormModal] = useState<{ open: boolean; voucher: ReceiptVoucher | null }>({
    open: false,
    voucher: null,
  });

  const { data: vouchers = [], isLoading } = useReceiptVouchers(
    contractId ? { employmentOperatingContractId: contractId } : undefined
  );
  const { mutate: deleteVoucher, isPending: isDeleting } = useDeleteReceiptVoucher();

  // Safety-net client filter (in case the API ignores the contract query param).
  const rows = useMemo(
    () =>
      (vouchers as ReceiptVoucher[]).filter(
        (v) => !contractId || String(v.employmentOperatingContractId) === String(contractId)
      ),
    [vouchers, contractId]
  );

  const total = rows.reduce((sum, v) => sum + (v.amount || 0), 0);

  const columns: ColumnsType<ReceiptVoucher> = [
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
      title: isRtl ? 'المبلغ' : 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (v: number) => formatCurrency(v || 0, isRtl),
    },
    {
      title: isRtl ? 'ملاحظات' : 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (v: string) => v || '—',
    },
    {
      title: isRtl ? 'إجراءات' : 'Actions',
      key: 'actions',
      width: 90,
      render: (_, record) => (
        <Space size={2}>
          <Tooltip title={isRtl ? 'تعديل' : 'Edit'}>
            <Button
              size="small"
              type="text"
              icon={<EditOutlined />}
              onClick={() => setFormModal({ open: true, voucher: record })}
            />
          </Tooltip>
          <Popconfirm
            title={isRtl ? 'حذف السند؟' : 'Delete this voucher?'}
            okText={isRtl ? 'حذف' : 'Delete'}
            cancelText={isRtl ? 'إلغاء' : 'Cancel'}
            okButtonProps={{ danger: true, loading: isDeleting }}
            onConfirm={() => deleteVoucher(record.id)}
          >
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
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
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setFormModal({ open: true, voucher: null })}
          >
            {isRtl ? 'سند جديد' : 'New Voucher'}
          </Button>,
        ]}
        width={720}
        destroyOnClose
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
        open={formModal.open}
        isRtl={isRtl}
        contractId={contractId}
        contractLabel={contractLabel}
        voucher={formModal.voucher}
        onClose={() => setFormModal({ open: false, voucher: null })}
      />
    </>
  );
}
