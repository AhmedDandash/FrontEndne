/**
 * Searchable worker picker for operation contracts.
 *
 * Replaces the old free-text "worker name" inputs: the user searches the real
 * worker list (by Arabic/English name, passport number, or mobile) and picks a
 * record. The selected worker's UUID is bound to the form field (`workerId`)
 * and the name/phone fields are auto-filled from the worker so the contract DTO
 * still carries workerNameAr / workerNameEn / workerPhone.
 *
 * Designed to be placed inside an Ant <Form> via <Form.Item name="workerId">.
 * It reads the surrounding form instance to auto-fill the sibling fields.
 */
'use client';

import React, { useMemo } from 'react';
import { Select, Form, Spin } from 'antd';
import { useWorkers } from '@/hooks/api/useWorkers';
import type { Worker } from '@/types/api.types';

interface Props {
  /** Bound by Form.Item — current workerId (UUID). */
  value?: string;
  /** Bound by Form.Item. */
  onChange?: (value: string | undefined) => void;
  isRtl: boolean;
  /** Form field names to auto-fill from the selected worker. */
  nameArField?: string;
  nameEnField?: string;
  phoneField?: string;
  disabled?: boolean;
}

const workerLabel = (w: Worker, isRtl: boolean): string => {
  const name = isRtl
    ? w.fullNameAr || w.fullNameEn || `#${w.id}`
    : w.fullNameEn || w.fullNameAr || `#${w.id}`;
  return w.passportNo ? `${name} — ${w.passportNo}` : String(name);
};

export default function WorkerSelect({
  value,
  onChange,
  isRtl,
  nameArField = 'workerNameAr',
  nameEnField = 'workerNameEn',
  phoneField = 'workerPhone',
  disabled,
}: Props) {
  const form = Form.useFormInstance();
  const { data: workers = [], isLoading } = useWorkers();

  const options = useMemo(
    () =>
      (workers as Worker[]).map((w) => ({
        value: String(w.id),
        label: workerLabel(w, isRtl),
        // searchable haystack: both names + passport + mobile
        search: [w.fullNameAr, w.fullNameEn, w.passportNo, w.mobile]
          .filter(Boolean)
          .join(' ')
          .toLowerCase(),
      })),
    [workers, isRtl]
  );

  const handleChange = (next: string | undefined) => {
    onChange?.(next);
    const worker = (workers as Worker[]).find((w) => String(w.id) === next);
    if (worker) {
      form?.setFieldsValue({
        [nameArField]: worker.fullNameAr ?? undefined,
        [nameEnField]: worker.fullNameEn ?? undefined,
        [phoneField]: worker.mobile ?? worker.phone ?? undefined,
      });
    } else {
      // cleared selection → clear the auto-filled fields
      form?.setFieldsValue({
        [nameArField]: undefined,
        [nameEnField]: undefined,
        [phoneField]: undefined,
      });
    }
  };

  return (
    <Select
      showSearch
      allowClear
      disabled={disabled}
      loading={isLoading}
      value={value}
      onChange={handleChange}
      placeholder={isRtl ? 'ابحث عن عامل (الاسم أو رقم الجواز)' : 'Search worker (name or passport)'}
      notFoundContent={isLoading ? <Spin size="small" /> : undefined}
      filterOption={(input, option) =>
        ((option as any)?.search ?? '').includes(input.toLowerCase())
      }
      options={options}
      style={{ width: '100%' }}
    />
  );
}
