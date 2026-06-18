/**
 * Customer refund modal — records the cash refund paid to the customer after
 * a contract has been terminated with a refund amount owed.
 * POST /api/EmploymentOperatingContract/{id}/customer-refund
 */
'use client';

import React from 'react';
import { Modal, Button, Form, Input, InputNumber, Select, Alert } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import { REFUND_PAYMENT_METHOD, toSelectOptions } from '@/constants/enums';
import type { CustomerRefundDto } from '@/types/api.types';

interface Props {
  open: boolean;
  isRtl: boolean;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (data: CustomerRefundDto) => void;
}

export default function CustomerRefundModal({ open, isRtl, loading, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm();
  const lang = isRtl ? 'ar' : 'en';

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onSubmit({
        amount: values.amount,
        paymentMethod: values.paymentMethod ?? 1,
        description: values.description || null,
      });
      form.resetFields();
    } catch {
      /* validation errors shown inline */
    }
  };

  const close = () => {
    onCancel();
    form.resetFields();
  };

  return (
    <Modal
      title={
        <span>
          <DollarOutlined style={{ marginInlineEnd: 8 }} />
          {isRtl ? 'تسجيل استرداد العميل' : 'Record Customer Refund'}
        </span>
      }
      open={open}
      onCancel={close}
      footer={[
        <Button key="cancel" onClick={close}>
          {isRtl ? 'إلغاء' : 'Cancel'}
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleOk}>
          {isRtl ? 'تسجيل الاسترداد' : 'Record Refund'}
        </Button>,
      ]}
      width={460}
      destroyOnClose
    >
      <Alert
        type="info"
        showIcon
        message={
          isRtl
            ? 'سجّل هذا الإجراء بعد اعتماد المحاسب للإشعار الدائن وعند سداد المبلغ نقداً للعميل.'
            : 'Record this after the accountant approves the credit note and the cash is paid back to the customer.'
        }
        style={{ marginBottom: 16 }}
      />
      <Form form={form} layout="vertical" dir={isRtl ? 'rtl' : 'ltr'} initialValues={{ paymentMethod: 1 }}>
        <Form.Item
          name="amount"
          label={isRtl ? 'مبلغ الاسترداد' : 'Refund Amount'}
          rules={[{ required: true, message: isRtl ? 'مطلوب' : 'Required' }]}
        >
          <InputNumber style={{ width: '100%' }} min={0.01} addonAfter={isRtl ? 'ريال' : 'SAR'} placeholder="0.00" />
        </Form.Item>
        <Form.Item name="paymentMethod" label={isRtl ? 'طريقة السداد' : 'Payment Method'}>
          <Select options={toSelectOptions(REFUND_PAYMENT_METHOD, lang)} />
        </Form.Item>
        <Form.Item name="description" label={isRtl ? 'الوصف' : 'Description'}>
          <Input.TextArea rows={2} placeholder={isRtl ? 'وصف القيد (اختياري)' : 'Journal description (optional)'} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
