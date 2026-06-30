'use client';

/**
 * Assign-driver modal. Lists active drivers; one driver per order.
 * Only rendered when the order has requiresDriver = true.
 */

import { useEffect, useState } from 'react';
import { Modal, Select, Form, Space, Tag } from 'antd';
import { useHourlyDrivers } from '@/hooks/api/useHourlyDrivers';
import styles from '../hourly-workers.module.css';

interface Props {
  open: boolean;
  isAr: boolean;
  loading?: boolean;
  onClose: () => void;
  onAssign: (driverId: string) => void;
}

export default function AssignDriverModal({ open, isAr, loading, onClose, onAssign }: Props) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [form] = Form.useForm();
  const [driverId, setDriverId] = useState<string | undefined>();
  const { data, isLoading } = useHourlyDrivers(open ? { isActive: true, pageSize: 100 } : undefined);
  const drivers = data?.items ?? [];

  useEffect(() => {
    if (open) {
      form.resetFields();
      setDriverId(undefined);
    }
  }, [open, form]);

  return (
    <Modal
      title={t('تعيين سائق', 'Assign Driver')}
      open={open}
      onCancel={onClose}
      onOk={() => driverId && onAssign(driverId)}
      okText={t('تعيين', 'Assign')}
      cancelText={t('إلغاء', 'Cancel')}
      okButtonProps={{ disabled: !driverId, loading }}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item label={t('السائق', 'Driver')} required>
          <Select
            size="large"
            showSearch
            optionFilterProp="label"
            loading={isLoading}
            placeholder={t('اختر السائق', 'Select driver')}
            value={driverId}
            onChange={setDriverId}
            options={drivers.map((d) => ({
              value: d.id,
              label: `${d.fullName} — ${d.phoneNumber}`,
              driver: d,
            }))}
            optionRender={(opt) => {
              const d = (opt.data as any).driver;
              return (
                <Space>
                  <span>{d.fullName}</span>
                  <span className={styles.assignmentPhone}>{d.phoneNumber}</span>
                  {d.vehicleType && <Tag>{d.vehicleType}</Tag>}
                  {d.vehiclePlateNumber && <Tag color="blue">{d.vehiclePlateNumber}</Tag>}
                </Space>
              );
            }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
