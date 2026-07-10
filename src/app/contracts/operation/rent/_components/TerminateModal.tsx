/**
 * Terminate contract modal — collects a note and an optional refund amount.
 * Per the Operating Contract spec, termination creates a Draft credit note; when
 * refundAmount > 0 the credit note credits Customer Payable and the cash is paid
 * out later via the customer-refund action.
 */
'use client';

import React from 'react';
import { Modal, Button, Form, Input, InputNumber, Alert } from 'antd';
import { StopOutlined } from '@ant-design/icons';
import type { TerminateContractDto } from '@/types/api.types';

const { TextArea } = Input;

interface Props {
  open: boolean;
  isRtl: boolean;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (data: TerminateContractDto) => void;
}

export default function TerminateModal({ open, isRtl, loading, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onSubmit({ note: values.note || null, refundAmount: values.refundAmount ?? 0 });
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
          <StopOutlined style={{ marginInlineEnd: 8, color: '#ff4d4f' }} />
          {isRtl ? 'إنهاء العقد' : 'Terminate Contract'}
        </span>
      }
      open={open}
      onCancel={close}
      footer={[
        <Button key="cancel" onClick={close}>
          {isRtl ? 'إلغاء' : 'Cancel'}
        </Button>,
        <Button key="submit" danger loading={loading} onClick={handleOk}>
          {isRtl ? 'إنهاء العقد' : 'Terminate'}
        </Button>,
      ]}
      width={460}
      destroyOnHidden
    >
      <Alert
        type="warning"
        showIcon
        message={
          isRtl
            ? 'سيتم إنهاء العقد وإعادة العامل إلى السكن، وإنشاء إشعار دائن كمسودة'
            : 'The contract will be terminated, the worker returned to accommodation, and a draft credit note created'
        }
        style={{ marginBottom: 16 }}
      />
      <Form form={form} layout="vertical" dir={isRtl ? 'rtl' : 'ltr'}>
        <Form.Item
          name="note"
          label={isRtl ? 'سبب الإنهاء' : 'Termination Note'}
          rules={[{ required: true, message: isRtl ? 'مطلوب' : 'Required' }]}
        >
          <TextArea rows={3} placeholder={isRtl ? 'أدخل سبب الإنهاء...' : 'Enter termination reason...'} />
        </Form.Item>
        <Form.Item
          name="refundAmount"
          label={isRtl ? 'مبلغ الاسترداد المستحق للعميل' : 'Refund Amount Owed to Customer'}
          tooltip={
            isRtl
              ? 'اتركه صفراً إذا لم يكن هناك استرداد. سيتم سداد المبلغ لاحقاً عبر إجراء استرداد العميل.'
              : 'Leave 0 if no refund is owed. The cash is paid out later via the customer-refund action.'
          }
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            addonAfter={isRtl ? 'ريال' : 'SAR'}
            placeholder="0.00"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
