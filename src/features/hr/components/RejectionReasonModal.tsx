'use client';

import React from 'react';
import { Modal, Form, Input } from 'antd';
import { useAuthStore } from '@/store/authStore';

interface RejectionReasonModalProps {
  open: boolean;
  loading?: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

/**
 * Reusable rejection reason modal for all HR request types.
 * Calls onConfirm with the reason string (maps to RejectRequestDto.reason).
 */
export default function RejectionReasonModal({
  open,
  loading = false,
  onConfirm,
  onCancel,
}: RejectionReasonModalProps) {
  const [form] = Form.useForm();
  const language = useAuthStore((s) => s.language);
  const isAr = language === 'ar';

  const handleOk = () => {
    form.validateFields().then((values) => {
      onConfirm(values.reason ?? '');
      form.resetFields();
    });
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      open={open}
      title={isAr ? 'سبب الرفض' : 'Rejection Reason'}
      okText={isAr ? 'تأكيد الرفض' : 'Confirm Rejection'}
      cancelText={isAr ? 'إلغاء' : 'Cancel'}
      okButtonProps={{ danger: true, loading }}
      onOk={handleOk}
      onCancel={handleCancel}
      width={480}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="reason"
          label={isAr ? 'سبب الرفض (اختياري)' : 'Reason (optional)'}
        >
          <Input.TextArea
            rows={4}
            maxLength={500}
            showCount
            placeholder={isAr ? 'اكتب سبب الرفض هنا...' : 'Enter rejection reason...'}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
