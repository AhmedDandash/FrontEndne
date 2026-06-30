'use client';

/**
 * Assign-worker modal. Uses GET /HourlyWorkerOrders/{id}/RecommendedWorkers,
 * which returns workers ranked by a compatibility score with availability and a
 * reason. The user can pick up to the number of workers still needed.
 */

import { useEffect, useMemo, useState } from 'react';
import { Modal, List, Tag, Checkbox, Empty, Spin, Alert } from 'antd';
import { StarFilled } from '@ant-design/icons';
import { useRecommendedWorkers } from '@/hooks/api/useHourlyOrders';
import { fmtMoney } from '../_lib/hourlyDisplay';
import styles from '../hourly-workers.module.css';

interface Props {
  open: boolean;
  orderId: string;
  remaining: number;
  isAr: boolean;
  loading?: boolean;
  onClose: () => void;
  onAssign: (workerIds: string[]) => void;
}

export default function AssignWorkerModal({
  open,
  orderId,
  remaining,
  isAr,
  loading,
  onClose,
  onAssign,
}: Props) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const { data, isLoading } = useRecommendedWorkers(open ? orderId : undefined, 20);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (open) setSelected([]);
  }, [open]);

  const workers = useMemo(() => data ?? [], [data]);
  const maxSelectable = Math.max(1, remaining);

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= maxSelectable) return prev; // cap at remaining needed
      return [...prev, id];
    });
  };

  return (
    <Modal
      title={t('تعيين عمال', 'Assign Workers')}
      open={open}
      onCancel={onClose}
      onOk={() => onAssign(selected)}
      okText={t('تعيين', 'Assign')}
      cancelText={t('إلغاء', 'Cancel')}
      okButtonProps={{ disabled: selected.length === 0, loading }}
      width={560}
      destroyOnHidden
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message={t(
          `العمال المطلوبون: ${remaining}. تم اختيار ${selected.length}.`,
          `Workers still needed: ${remaining}. Selected ${selected.length}.`
        )}
      />
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <Spin />
        </div>
      ) : workers.length === 0 ? (
        <Empty description={t('لا يوجد عمال موصى بهم', 'No recommended workers')} />
      ) : (
        <List
          dataSource={workers}
          rowKey="workerId"
          renderItem={(w) => {
            const checked = selected.includes(w.workerId);
            const disabled = !checked && selected.length >= maxSelectable;
            return (
              <List.Item
                className={styles.recommendRow}
                onClick={() => !disabled && toggle(w.workerId)}
                style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1 }}
              >
                <Checkbox checked={checked} disabled={disabled} style={{ marginInlineEnd: 12 }} />
                <div style={{ flex: 1 }}>
                  <div className={styles.assignmentName}>
                    {w.workerName}
                    {typeof w.score === 'number' && (
                      <span className={styles.scoreBadge}>
                        <StarFilled /> {w.score.toFixed(0)}
                      </span>
                    )}
                  </div>
                  <div className={styles.assignmentPhone}>
                    {w.phoneNumber}
                    {typeof w.hourlyRate === 'number' && ` · ${fmtMoney(w.hourlyRate)}/h`}
                  </div>
                  {w.recommendationReason && (
                    <div className={styles.reasonText}>{w.recommendationReason}</div>
                  )}
                </div>
                {w.isAvailable ? (
                  <Tag color="cyan">{t('متاح', 'Available')}</Tag>
                ) : (
                  <Tag color="default">{t('غير متاح', 'Busy')}</Tag>
                )}
              </List.Item>
            );
          }}
        />
      )}
    </Modal>
  );
}
