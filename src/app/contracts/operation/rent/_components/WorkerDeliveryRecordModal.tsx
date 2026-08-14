/**
 * Signed handover receipt modal — captures who physically took custody of the
 * worker (name, national ID, drawn signature) and prints a receipt. Coexists
 * with the existing DeliveryFormModal (see worker-delivery-record-print.ts's
 * header comment for why they're separate).
 *
 * Record lookup is a localStorage stopgap (see useWorkerDeliveryRecord.ts) —
 * on open, resolve any locally-remembered id for this contract and hydrate
 * for edit; otherwise start a blank create form.
 */
'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Input, DatePicker, Empty, Image, message, Alert } from 'antd';
import { PrinterOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { RentContract } from './types';
import { resolveImageUrl } from '@/utils/image';
import SignaturePad from '@/components/common/SignaturePad';
import {
  clearStoredWorkerDeliveryRecordId,
  getStoredWorkerDeliveryRecordId,
  useWorkerDeliveryRecord,
  useCreateWorkerDeliveryRecord,
  useUpdateWorkerDeliveryRecord,
  usePrintWorkerDeliveryRecord,
} from '@/hooks/api/useWorkerDeliveryRecord';
import { printHandoverReceipt } from './worker-delivery-record-print';

interface Props {
  open: boolean;
  isRtl: boolean;
  contract: RentContract | null;
  onClose: () => void;
}

export default function WorkerDeliveryRecordModal({ open, isRtl, contract, onClose }: Props) {
  const [form] = Form.useForm();
  const [signature, setSignature] = useState<string | null>(null);
  const [recordId, setRecordId] = useState<string | null>(null);

  const t = {
    title: isRtl ? 'إيصال استلام موقّع' : 'Signed Handover Receipt',
    close: isRtl ? 'إغلاق' : 'Close',
    save: isRtl ? 'حفظ' : 'Save',
    print: isRtl ? 'طباعة / PDF' : 'Print / PDF',
    deliveryDate: isRtl ? 'تاريخ التسليم' : 'Delivery Date',
    receiverName: isRtl ? 'اسم المستلم' : "Receiver's Name",
    receiverNationalId: isRtl ? 'رقم هوية المستلم' : "Receiver's National ID",
    notes: isRtl ? 'ملاحظات' : 'Notes',
    signature: isRtl ? 'التوقيع' : 'Signature',
    noWorker: isRtl
      ? 'يجب إسناد عامل لهذا العقد أولاً قبل إنشاء إيصال الاستلام.'
      : 'A worker must be assigned to this contract before creating a handover receipt.',
    saveFirst: isRtl
      ? 'يرجى حفظ الإيصال أولاً قبل الطباعة.'
      : 'Please save the receipt before printing.',
    printBlocked: isRtl
      ? 'تم حظر نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة.'
      : 'The print window was blocked. Please allow pop-ups.',
    receivedFrom: isRtl ? 'التسليم عن العقد' : 'Handover for contract',
    signatureDropped: isRtl
      ? 'تم حفظ الإيصال لكن تعذّر إرفاق التوقيع (مشكلة في الخادم). حاول توقيعًا أصغر أو أعد المحاولة لاحقًا.'
      : 'The receipt was saved, but the signature could not be attached (a server issue). Try a smaller signature or retry later.',
    staleRecord: isRtl
      ? 'تعذر العثور على الإيصال المحفوظ محليًا. يمكنك إنشاء إيصال جديد.'
      : 'The locally remembered receipt was not found. You can create a new receipt.',
  };

  const hasWorker = !!contract?.workerId;

  // Resolve the locally-remembered record id whenever the modal opens for a contract.
  useEffect(() => {
    if (!open || !contract?.id) {
      setRecordId(null);
      return;
    }
    setRecordId(getStoredWorkerDeliveryRecordId(contract.id));
  }, [open, contract?.id]);

  const {
    data: existingRecord,
    isLoading: isLoadingRecord,
    error: recordError,
  } = useWorkerDeliveryRecord(recordId);
  const createMutation = useCreateWorkerDeliveryRecord();
  const updateMutation = useUpdateWorkerDeliveryRecord();
  const printMutation = usePrintWorkerDeliveryRecord();

  useEffect(() => {
    const status = (recordError as { response?: { status?: number } } | undefined)?.response?.status;
    if (!open || !contract?.id || !recordId || status !== 404) return;
    clearStoredWorkerDeliveryRecordId(contract.id);
    setRecordId(null);
    form.resetFields();
    setSignature(null);
    message.warning(t.staleRecord);
  }, [open, contract?.id, recordId, recordError, form, t.staleRecord]);

  // Hydrate the form once an existing record loads.
  useEffect(() => {
    if (!existingRecord) return;
    form.setFieldsValue({
      deliveryDate: existingRecord.deliveryDate ? dayjs(existingRecord.deliveryDate) : undefined,
      receiverName: existingRecord.receiverName ?? undefined,
      receiverNationalId: existingRecord.receiverNationalId ?? undefined,
      notes: existingRecord.notes ?? undefined,
    });
    setSignature(existingRecord.signatureImage ?? null);
  }, [existingRecord, form]);

  // Reset to a blank form for a fresh contract with no existing record.
  useEffect(() => {
    if (!open) return;
    if (recordId) return; // hydration effect above handles this case
    form.resetFields();
    setSignature(null);
  }, [open, recordId, form]);

  const handleSave = async () => {
    if (!contract) return;
    if (!hasWorker) {
      message.warning(t.noWorker);
      return;
    }
    let values: any;
    try {
      values = await form.validateFields();
    } catch {
      return; // inline validation errors already shown
    }

    const deliveryDate = (values.deliveryDate ?? dayjs()).toISOString();
    const basePayload = {
      deliveryDate,
      receiverName: values.receiverName,
      receiverNationalId: values.receiverNationalId,
      notes: values.notes ?? null,
    };

    const attemptSave = (signatureImage: string | null) =>
      recordId
        ? updateMutation.mutateAsync({ id: recordId, data: { ...basePayload, signatureImage } })
        : createMutation.mutateAsync({
            operationContractId: contract.id,
            workerId: contract.workerId,
            customerId: contract.customerId,
            ...basePayload,
            signatureImage,
          });

    try {
      const saved = await attemptSave(signature);
      if (!recordId && saved?.id) setRecordId(saved.id);
    } catch (err: any) {
      // Known backend bug (confirmed live, 2026-08-03): signatureImage crashes
      // with an unhandled 500 once the payload exceeds a few hundred bytes,
      // even though it's an optional field. Retry once without it rather than
      // losing the whole receipt.
      if (err?.response?.status === 500 && signature) {
        try {
          const saved = await attemptSave(null);
          if (!recordId && saved?.id) setRecordId(saved.id);
          message.warning(t.signatureDropped);
        } catch {
          // second attempt's own error toast already shown by the mutation
        }
      }
    }
  };

  const handlePrint = async () => {
    if (!recordId) {
      message.warning(t.saveFirst);
      return;
    }
    try {
      const printData = await printMutation.mutateAsync(recordId);
      const ok = printHandoverReceipt(printData, isRtl, `#${contract?.contractNumber ?? ''}`);
      if (!ok) message.warning(t.printBlocked);
    } catch {
      // error surfaced by the mutation toast
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      title={
        <span>
          <PrinterOutlined style={{ marginInlineEnd: 8 }} />
          {t.title} — #{contract?.contractNumber}
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          {t.close}
        </Button>,
        <Button
          key="save"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={saving}
          disabled={!hasWorker || isLoadingRecord}
        >
          {t.save}
        </Button>,
        <Button
          key="print"
          type="primary"
          icon={<PrinterOutlined />}
          onClick={handlePrint}
          loading={printMutation.isPending}
          disabled={!recordId || isLoadingRecord}
        >
          {t.print}
        </Button>,
      ]}
      width={560}
      destroyOnHidden
    >
      {!contract ? (
        <Empty description={isRtl ? 'لا توجد بيانات' : 'No data'} />
      ) : (
        <div dir={isRtl ? 'rtl' : 'ltr'}>
          {!hasWorker && (
            <Alert type="warning" showIcon message={t.noWorker} style={{ marginBottom: 16 }} />
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            {contract.workerPhotoUrl && (
              <Image
                src={resolveImageUrl(contract.workerPhotoUrl)}
                alt="worker"
                width={56}
                height={56}
                style={{ objectFit: 'cover', borderRadius: 8 }}
              />
            )}
            <div style={{ fontSize: 13, color: '#595959' }}>
              <div>{t.receivedFrom}: #{contract.contractNumber}</div>
              <div>{isRtl ? contract.workerNameAr : contract.workerName}</div>
              <div>{isRtl ? contract.customerNameAr : contract.customerName}</div>
            </div>
          </div>

          <Form form={form} layout="vertical" disabled={!hasWorker}>
            <Form.Item
              name="deliveryDate"
              label={t.deliveryDate}
              rules={[{ required: true, message: t.deliveryDate }]}
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item
              name="receiverName"
              label={t.receiverName}
              rules={[{ required: true, message: t.receiverName }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="receiverNationalId"
              label={t.receiverNationalId}
              rules={[{ required: true, message: t.receiverNationalId }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="notes" label={t.notes}>
              <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item label={t.signature}>
              <SignaturePad
                value={signature}
                onChange={setSignature}
                isRtl={isRtl}
                disabled={!hasWorker}
                width={480}
              />
            </Form.Item>
          </Form>
        </div>
      )}
    </Modal>
  );
}
