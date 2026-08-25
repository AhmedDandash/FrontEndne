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
  useMediationContracts,
  useRecordMediationPayment,
} from '@/hooks/api/useMediationContracts';
import { useAvailableMediationWorkers } from '@/hooks/api/useWorkers';
import RecordDetailShell from '@/components/record-detail/RecordDetailShell';
import MediationContractDetailView from '../_components/MediationContractDetailView';
import { getStatusConfigFromName } from '../_lib/format';
import { MEDIATION_PAYMENT_METHOD, toSelectOptions } from '@/constants/enums';
import type { CreateMediationContractPaymentDto, Worker } from '@/types/api.types';
import { useAccountingActionGates, useContractActionGates } from '@/hooks/useActionPermissionGates';
import {
  ExclamationCircleOutlined,
  IdcardOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
} from '@ant-design/icons';

const LIST_ROUTE = '/contracts/mediationcontract';

function isNotFoundError(error: unknown): boolean {
  return (error as { response?: { status?: number } } | undefined)?.response?.status === 404;
}

export default function MediationContractDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const language = useAuthStore((state) => state.language);
  const isRtl = language === 'ar';
  const accountingGates = useAccountingActionGates();
  const contractGates = useContractActionGates();

  const { data: contract, isLoading, isError, error, refetch } = useMediationContract(id);
  const { recordPayment, isRecordingPayment } = useRecordMediationPayment();
  const {
    assignWorker,
    endWorkerService,
    isAssigningWorker,
    isEndingWorkerService,
  } = useMediationContracts({ enabled: false });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAssignWorkerModal, setShowAssignWorkerModal] = useState(false);
  const [showEndServiceModal, setShowEndServiceModal] = useState(false);
  const [assignPassportSearch, setAssignPassportSearch] = useState('');
  const [assignPassportDebounced, setAssignPassportDebounced] = useState('');
  const [paymentForm] = Form.useForm();
  const [assignWorkerForm] = Form.useForm();
  const [endServiceForm] = Form.useForm();
  React.useEffect(() => {
    const timeoutId = setTimeout(() => setAssignPassportDebounced(assignPassportSearch.trim()), 400);
    return () => clearTimeout(timeoutId);
  }, [assignPassportSearch]);
  const { data: assignWorkers = [], isLoading: isLoadingAssignWorkers } =
    useAvailableMediationWorkers(assignPassportDebounced, showAssignWorkerModal);

  const t = {
    contracts: isRtl ? 'عقود الاستقدام' : 'Mediation Contracts',
    recordPayment: isRtl ? 'تسجيل دفعة' : 'Record Payment',
    amount: isRtl ? 'المبلغ' : 'Amount',
    paymentDate: isRtl ? 'تاريخ الدفعة' : 'Payment Date',
    paymentMethod: isRtl ? 'طريقة الدفع' : 'Payment Method',
    referenceNumber: isRtl ? 'رقم المرجع' : 'Reference #',
    bankFees: isRtl ? 'رسوم بنكية' : 'Bank Fees',
    notes: isRtl ? 'ملاحظات' : 'Notes',
    assignWorker: isRtl ? 'إسناد عامل جديد' : 'Assign New Worker',
    endWorkerService: isRtl ? 'إنهاء خدمة العامل' : 'End Worker Service',
    selectWorkerPassport: isRtl ? 'ابحث عن عامل برقم الجواز' : 'Search worker by passport',
    workerPassportNumber: isRtl ? 'رقم الجواز' : 'Passport Number',
    endServiceReason: isRtl ? 'سبب الإنهاء (اختياري)' : 'End Reason (optional)',
    assignWorkerHint: isRtl
      ? 'ابحث برقم الجواز لاختيار عامل مسجّل. إذا لم يظهر عامل مطابق، يمكنك حفظ رقم الجواز كعامل غير مسجّل.'
      : 'Search by passport to select a registered worker. If no match appears, save the passport as an external worker.',
    externalWorkerConfirmTitle: isRtl ? 'تسجيل عامل غير مسجّل؟' : 'Save external worker?',
    externalWorkerConfirmBody: isRtl
      ? 'لم يتم اختيار عامل مسجّل. سيتم حفظ رقم الجواز فقط على العقد.'
      : 'No registered worker was selected. The passport number will be saved on the contract only.',
    save: isRtl ? 'حفظ' : 'Save',
    cancel: isRtl ? 'إلغاء' : 'Cancel',
    required: isRtl ? 'مطلوب' : 'Required',
  };

  const notFound = isError && isNotFoundError(error);
  const genericError = isError && !notFound;

  const openPaymentModal = () => {
    if (!accountingGates.canCreate) return;
    paymentForm.resetFields();
    paymentForm.setFieldsValue({ paymentDate: dayjs() });
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async () => {
    if (!accountingGates.canCreate) return;
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

  const handleAssignWorker = async () => {
    if (!contractGates.canUpdate) return;
    try {
      const values = await assignWorkerForm.validateFields();
      const passportNumber = String(values.workerPassportNumber || assignPassportSearch || '').trim();
      const worker = (assignWorkers as Worker[]).find(
        (w) => String(w.id) === String(values.workerId)
      );
      if (!values.workerId) {
        const confirmed = await new Promise<boolean>((resolve) => {
          Modal.confirm({
            title: t.externalWorkerConfirmTitle,
            content: t.externalWorkerConfirmBody,
            icon: <ExclamationCircleOutlined />,
            okText: t.save,
            cancelText: t.cancel,
            onOk: () => resolve(true),
            onCancel: () => resolve(false),
          });
        });
        if (!confirmed) return;
      }
      await assignWorker({
        contractId: id,
        workerId: values.workerId ? String(values.workerId) : null,
        workerPassportNumber: worker?.passportNo ?? passportNumber,
      });
      setShowAssignWorkerModal(false);
      assignWorkerForm.resetFields();
      setAssignPassportSearch('');
      refetch();
    } catch {
      // validation + API errors surfaced by the mutation/hook
    }
  };

  const handleEndWorkerService = async () => {
    if (!contractGates.canUpdate) return;
    try {
      const values = await endServiceForm.validateFields();
      await endWorkerService({ contractId: id, reason: values.reason || null });
      setShowEndServiceModal(false);
      endServiceForm.resetFields();
      refetch();
    } catch {
      // validation + API errors surfaced by the mutation/hook
    }
  };

  const canRecordPayment = !!contract && contract.paymentStatusCode !== 2 && accountingGates.canCreate;

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
        {contract && (
          <MediationContractDetailView
            contract={contract}
            language={language}
            canUpdateWorker={contractGates.canUpdate}
            onAddWorker={() => {
              assignWorkerForm.resetFields();
              setAssignPassportSearch('');
              setShowAssignWorkerModal(true);
            }}
            onEndWorkerService={() => {
              endServiceForm.resetFields();
              setShowEndServiceModal(true);
            }}
          />
        )}
      </RecordDetailShell>

      {/* ========== RECORD PAYMENT MODAL ========== */}
      <Modal
        title={t.recordPayment}
        open={showPaymentModal && accountingGates.canCreate}
        onCancel={() => {
          setShowPaymentModal(false);
          paymentForm.resetFields();
        }}
        onOk={accountingGates.canCreate ? handleRecordPayment : undefined}
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

      {/* ========== ASSIGN WORKER MODAL ========== */}
      <Modal
        title={
          <span>
            <UserAddOutlined style={{ marginInlineEnd: 8 }} />
            {t.assignWorker}
          </span>
        }
        open={showAssignWorkerModal && contractGates.canUpdate}
        onCancel={() => {
          setShowAssignWorkerModal(false);
          assignWorkerForm.resetFields();
          setAssignPassportSearch('');
        }}
        onOk={contractGates.canUpdate ? handleAssignWorker : undefined}
        okText={t.save}
        cancelText={t.cancel}
        confirmLoading={isAssigningWorker}
      >
        <p style={{ color: '#8c8c8c', marginBottom: 16 }}>{t.assignWorkerHint}</p>
        <Form form={assignWorkerForm} layout="vertical">
          <Form.Item name="workerId" label={t.assignWorker}>
            <Select
              showSearch
              allowClear
              loading={isLoadingAssignWorkers}
              placeholder={t.selectWorkerPassport}
              filterOption={false}
              onSearch={setAssignPassportSearch}
              searchValue={assignPassportSearch}
              onChange={(workerId) => {
                const worker = (assignWorkers as Worker[]).find(
                  (w) => String(w.id) === String(workerId)
                );
                assignWorkerForm.setFieldValue('workerPassportNumber', worker?.passportNo ?? assignPassportSearch);
              }}
              notFoundContent={
                isLoadingAssignWorkers
                  ? (isRtl ? 'جارٍ البحث...' : 'Searching...')
                  : assignPassportDebounced
                  ? (isRtl ? 'لا يوجد عامل متاح مطابق' : 'No matching available worker')
                  : (isRtl ? 'اكتب رقم الجواز للبحث' : 'Type a passport number to search')
              }
              options={(assignWorkers as Worker[]).map((w) => ({
                value: String(w.id),
                label:
                  ((isRtl ? w.fullNameAr : w.fullNameEn || w.fullNameAr) || `#${w.id}`) +
                  (w.passportNo ? ` — ${w.passportNo}` : ''),
              }))}
            />
          </Form.Item>
          <Form.Item
            name="workerPassportNumber"
            label={t.workerPassportNumber}
            rules={[
              {
                validator: (_, value) => {
                  const workerId = assignWorkerForm.getFieldValue('workerId');
                  const passport = String(value || assignPassportSearch || '').trim();
                  if (workerId || passport) return Promise.resolve();
                  return Promise.reject(new Error(t.required));
                },
              },
            ]}
          >
            <Input
              prefix={<IdcardOutlined />}
              placeholder={t.workerPassportNumber}
              onChange={(event) => setAssignPassportSearch(event.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ========== END WORKER SERVICE MODAL ========== */}
      <Modal
        title={
          <span>
            <UserDeleteOutlined style={{ marginInlineEnd: 8 }} />
            {t.endWorkerService}
          </span>
        }
        open={showEndServiceModal && contractGates.canUpdate}
        onCancel={() => {
          setShowEndServiceModal(false);
          endServiceForm.resetFields();
        }}
        onOk={contractGates.canUpdate ? handleEndWorkerService : undefined}
        okText={t.save}
        cancelText={t.cancel}
        confirmLoading={isEndingWorkerService}
        okButtonProps={{ danger: true }}
      >
        <Form form={endServiceForm} layout="vertical">
          <Form.Item name="reason" label={t.endServiceReason}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
