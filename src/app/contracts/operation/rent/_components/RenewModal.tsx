/**
 * Renew contract modal — collects a new end date.
 * Self-contained (owns its form); shared by the rent page and the
 * collection-renewal page so renewal behaves identically in both.
 */
'use client';

import React from 'react';
import { Modal, Button, Form, DatePicker } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface Props {
  open: boolean;
  isRtl: boolean;
  loading: boolean;
  onCancel: () => void;
  /** Receives an ISO date-time string for the new end date. */
  onSubmit: (newEndDate: string) => void;
}

export default function RenewModal({ open, isRtl, loading, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values.newEndDate.toISOString());
      form.resetFields();
    } catch {
      /* validation errors shown inline */
    }
  };

  return (
    <Modal
      title={
        <span>
          <ReloadOutlined style={{ marginInlineEnd: 8 }} />
          {isRtl ? 'تجديد العقد' : 'Renew Contract'}
        </span>
      }
      open={open}
      onCancel={() => {
        onCancel();
        form.resetFields();
      }}
      footer={[
        <Button
          key="cancel"
          onClick={() => {
            onCancel();
            form.resetFields();
          }}
        >
          {isRtl ? 'إلغاء' : 'Cancel'}
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleOk}>
          {isRtl ? 'تجديد' : 'Renew'}
        </Button>,
      ]}
      width={420}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" dir={isRtl ? 'rtl' : 'ltr'}>
        <Form.Item
          name="newEndDate"
          label={isRtl ? 'تاريخ الانتهاء الجديد' : 'New End Date'}
          rules={[{ required: true, message: isRtl ? 'مطلوب' : 'Required' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
            disabledDate={(d) => d.isBefore(dayjs())}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
