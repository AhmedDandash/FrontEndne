'use client';

/**
 * Mediation contract detail route — Phase 1 of the modal→route migration.
 * Renders the same `MediationContractDetailView` the list page's Journal
 * Entry "Go to source" flow used to open in a full-screen modal.
 *
 * Owns the customer "Record Payment" flow (the detail view stays purely
 * presentational): a modal form posting to the customer-payment endpoint.
 */
import React, { useState } from 'react';
import { Badge, Button, Modal, Form, InputNumber, DatePicker, Select, Input } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuthStore } from '@/store/authStore';
import {
  useMediationContract,
  useRecordMediationPayment,
} from '@/hooks/api/useMediationContracts';
import RecordDetailShell from '@/components/record-detail/RecordDetailShell';
import MediationContractDetailView from '../_components/MediationContractDetailView';
import { getStatusConfigFromName } from '../_lib/format';
import { MEDIATION_PAYMENT_METHOD, toSelectOptions } from '@/constants/enums';
import type { CreateMediationContractPaymentDto } from '@/types/api.types';

const LIST_ROUTE = '/contracts/mediationcontract';

function isNotFoundError(error: unknown): boolean {
  return (error as { response?: { status?: number } } | undefined)?.response?.status === 404;
}

export default function MediationContractDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const language = useAuthStore((state) => state.language);
  const isRtl = language === 'ar';

  const { data: contract, isLoading, isError, error, refetch } = useMediationContract(id);
  const { recordPayment, isRecordingPayment } = useRecordMediationPayment();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm] = Form.useForm();

  const t = {
    contracts: isRtl ? 'عقود الاستقدام' : 'Mediation Contracts',
    recordPayment: isRtl ? 'تسجيل دفعة' : 'Record Payment',
    amount: isRtl ? 'المبلغ' : 'Amount',
    paymentDate: isRtl ? 'تاريخ الدفعة' : 'Payment Date',
    paymentMethod: isRtl ? 'طريقة الدفع' : 'Payment Method',
    referenceNumber: isRtl ? 'رقم المرجع' : 'Reference #',
    bankFees: isRtl ? 'رسوم بنكية' : 'Bank Fees',
    notes: isRtl ? 'ملاحظات' : 'Notes',
    save: isRtl ? 'حفظ' : 'Save',
    cancel: isRtl ? 'إلغاء' : 'Cancel',
    required: isRtl ? 'مطلوب' : 'Required',
  };

  const notFound = isError && isNotFoundError(error);
  const genericError = isError && !notFound;

  const openPaymentModal = () => {
    paymentForm.resetFields();
    paymentForm.setFieldsValue({ paymentDate: dayjs() });
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async () => {
    try {
      const values = await paymentForm.validateFields();
      const payload: CreateMediationContractPaymentDto = {
        contractId: id,
        amount: values.amount,
        paymentDate: values.paymentDate ? new Date(values.paymentDate).toISOString() : null,
        paymentMethod: values.paymentMethod ?? null,
        bankFees: values.bankFees ?? null,
        referenceNumber: values.referenceNumber || null,
        notes: values.notes || null,
      };
      await recordPayment(payload);
      setShowPaymentModal(false);
      paymentForm.resetFields();
    } catch {
      // validation + API errors surfaced by the mutation/hook
    }
  };

  const canRecordPayment = !!contract && contract.paymentStatusCode !== 2;

  return (
    <>
      <RecordDetailShell
        loading={isLoading}
        error={genericError ? error : undefined}
        notFound={notFound}
        onRetry={() => refetch()}
        breadcrumbs={[
          { label: t.contracts, href: LIST_ROUTE },
          { label: contract?.contractNumber ? `#${contract.contractNumber}` : `#${id}` },
        ]}
        backHref={LIST_ROUTE}
        title={contract?.contractNumber ? `#${contract.contractNumber}` : `#${id}`}
        status={
          contract?.statusName ? (
            <Badge
              status={getStatusConfigFromName(contract.statusName, language).color}
              text={contract.statusName}
            />
          ) : undefined
        }
        actions={
          canRecordPayment ? (
            <Button type="primary" icon={<DollarOutlined />} onClick={openPaymentModal}>
              {t.recordPayment}
            </Button>
          ) : undefined
        }
      >
        {contract && <MediationContractDetailView contract={contract} language={language} />}
      </RecordDetailShell>

      {/* ========== RECORD PAYMENT MODAL ========== */}
      <Modal
        title={t.recordPayment}
        open={showPaymentModal}
        onCancel={() => {
          setShowPaymentModal(false);
          paymentForm.resetFields();
        }}
        onOk={handleRecordPayment}
        okText={t.save}
        cancelText={t.cancel}
        confirmLoading={isRecordingPayment}
      >
        <Form form={paymentForm} layout="vertical">
          <Form.Item
            name="amount"
            label={t.amount}
            rules={[
              { required: true, message: t.required },
              { type: 'number', min: 0.01, message: t.required },
            ]}
          >
            <InputNumber style={{ width: '100%' }} min={0.01} precision={2} />
          </Form.Item>
          <Form.Item name="paymentDate" label={t.paymentDate}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="paymentMethod" label={t.paymentMethod}>
            <Select
              allowClear
              placeholder={t.paymentMethod}
              options={toSelectOptions([...MEDIATION_PAYMENT_METHOD], language)}
            />
          </Form.Item>
          <Form.Item name="referenceNumber" label={t.referenceNumber}>
            <Input maxLength={150} />
          </Form.Item>
          <Form.Item name="bankFees" label={t.bankFees}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="notes" label={t.notes}>
            <Input.TextArea rows={3} maxLength={1000} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
