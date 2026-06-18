/**
 * Receipt voucher create / edit modal.
 * POST /api/ReceiptVoucher (create) and PUT /api/ReceiptVoucher/{id} (edit),
 * linked to the contract via employmentOperatingContractId.
 *
 * The ReceiptVoucher service/hooks existed but had no entry point in the
 * Operations UI; this modal (with ContractReceiptsModal) is that entry point.
 */
'use client';

import React, { useEffect } from 'react';
import { Modal, Button, Form, Input, InputNumber, DatePicker } from 'antd';
import { FileDoneOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useCreateReceiptVoucher, useUpdateReceiptVoucher } from '@/hooks/api/useReceiptVouchers';
import type { ReceiptVoucher } from '@/types/api.types';

interface Props {
  open: boolean;
  isRtl: boolean;
  /** Contract UUID — required FK on the voucher */
  contractId: string | null;
  /** Display label (contract number) shown in the header */
  contractLabel?: string;
  /** When set, the modal edits this voucher instead of creating a new one. */
  voucher?: ReceiptVoucher | null;
  onClose: () => void;
}

export default function ReceiptVoucherModal({
  open,
  isRtl,
  contractId,
  contractLabel,
  voucher,
  onClose,
}: Props) {
  const [form] = Form.useForm();
  const isEdit = !!voucher;
  const { mutate: createVoucher, isPending: isCreating } = useCreateReceiptVoucher();
  const { mutate: updateVoucher, isPending: isUpdating } = useUpdateReceiptVoucher();

  // Pre-fill when editing; reset when creating.
  useEffect(() => {
    if (!open) return;
    if (voucher) {
      form.setFieldsValue({
        voucherNumber: voucher.voucherNumber ?? undefined,
        voucherDate: voucher.voucherDate ? dayjs(voucher.voucherDate) : dayjs(),
        amount: voucher.amount ?? undefined,
        notes: voucher.notes ?? undefined,
      });
    } else {
      form.setFieldsValue({ voucherNumber: undefined, voucherDate: dayjs(), amount: undefined, notes: undefined });
    }
  }, [open, voucher, form]);

  const handleOk = async () => {
    if (!contractId) return;
    try {
      const values = await form.validateFields();
      const payload = {
        voucherNumber: values.voucherNumber || null,
        voucherDate: values.voucherDate.toISOString(),
        amount: values.amount,
        notes: values.notes || null,
        employmentOperatingContractId: contractId,
      };
      const onSuccess = () => {
        form.resetFields();
        onClose();
      };
      if (isEdit && voucher) {
        updateVoucher({ id: voucher.id, data: payload }, { onSuccess });
      } else {
        createVoucher(payload, { onSuccess });
      }
    } catch {
      /* validation errors shown inline */
    }
  };

  const close = () => {
    onClose();
    form.resetFields();
  };

  return (
    <Modal
      title={
        <span>
          <FileDoneOutlined style={{ marginInlineEnd: 8 }} />
          {isEdit ? (isRtl ? 'تعديل سند القبض' : 'Edit Receipt Voucher') : isRtl ? 'سند قبض جديد' : 'New Receipt Voucher'}
          {contractLabel ? ` — ${contractLabel}` : ''}
        </span>
      }
      open={open}
      onCancel={close}
      footer={[
        <Button key="cancel" onClick={close}>
          {isRtl ? 'إلغاء' : 'Cancel'}
        </Button>,
        <Button key="submit" type="primary" loading={isCreating || isUpdating} onClick={handleOk}>
          {isRtl ? 'حفظ السند' : 'Save Voucher'}
        </Button>,
      ]}
      width={460}
      destroyOnClose
    >
      <Form form={form} layout="vertical" dir={isRtl ? 'rtl' : 'ltr'} initialValues={{ voucherDate: dayjs() }}>
        <Form.Item name="voucherNumber" label={isRtl ? 'رقم السند' : 'Voucher Number'}>
          <Input placeholder={isRtl ? 'اختياري' : 'Optional'} />
        </Form.Item>
        <Form.Item
          name="voucherDate"
          label={isRtl ? 'تاريخ السند' : 'Voucher Date'}
          rules={[{ required: true, message: isRtl ? 'مطلوب' : 'Required' }]}
        >
          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
        </Form.Item>
        <Form.Item
          name="amount"
          label={isRtl ? 'المبلغ' : 'Amount'}
          rules={[{ required: true, message: isRtl ? 'مطلوب' : 'Required' }]}
        >
          <InputNumber style={{ width: '100%' }} min={0.01} addonAfter={isRtl ? 'ريال' : 'SAR'} placeholder="0.00" />
        </Form.Item>
        <Form.Item name="notes" label={isRtl ? 'ملاحظات' : 'Notes'}>
          <Input.TextArea rows={2} placeholder={isRtl ? 'ملاحظات (اختياري)' : 'Notes (optional)'} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
