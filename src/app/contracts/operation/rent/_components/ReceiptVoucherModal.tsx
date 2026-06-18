/**
 * Receipt voucher create modal.
 * POST /api/ReceiptVoucher, linked to the contract via employmentOperatingContractId.
 *
 * The live backend only supports GET + POST for ReceiptVoucher (PUT/DELETE return
 * 405), so this modal creates vouchers only — there is no edit flow.
 */
'use client';

import React, { useEffect } from 'react';
import { Modal, Button, Form, Input, InputNumber, DatePicker } from 'antd';
import { FileDoneOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useCreateReceiptVoucher } from '@/hooks/api/useReceiptVouchers';

interface Props {
  open: boolean;
  isRtl: boolean;
  /** Contract UUID — required FK on the voucher */
  contractId: string | null;
  /** Display label (contract number) shown in the header */
  contractLabel?: string;
  onClose: () => void;
}

export default function ReceiptVoucherModal({
  open,
  isRtl,
  contractId,
  contractLabel,
  onClose,
}: Props) {
  const [form] = Form.useForm();
  const { mutate: createVoucher, isPending: isCreating } = useCreateReceiptVoucher();

  // Reset to defaults whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({ voucherNumber: undefined, voucherDate: dayjs(), amount: undefined, notes: undefined });
  }, [open, form]);

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
      createVoucher(payload, {
        onSuccess: () => {
          form.resetFields();
          onClose();
        },
      });
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
          {isRtl ? 'سند قبض جديد' : 'New Receipt Voucher'}
          {contractLabel ? ` — ${contractLabel}` : ''}
        </span>
      }
      open={open}
      onCancel={close}
      footer={[
        <Button key="cancel" onClick={close}>
          {isRtl ? 'إلغاء' : 'Cancel'}
        </Button>,
        <Button key="submit" type="primary" loading={isCreating} onClick={handleOk}>
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
