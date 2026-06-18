/**
 * Create / Edit contract modal.
 * The page owns the Form instance and submit handler; this component renders the
 * shell, the (create-only) offer selector, and the shared field set.
 */
'use client';

import React from 'react';
import { Modal, Button, Form, Alert } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import RentOfferSelector from '@/components/contracts/RentOfferSelector';
import type { EmploymentContractOffer } from '@/types/api.types';
import ContractFormFields from './ContractFormFields';

interface Props {
  mode: 'create' | 'edit';
  open: boolean;
  isRtl: boolean;
  language: 'ar' | 'en';
  form: FormInstance;
  loading: boolean;
  customers: any[];
  jobs: any[];
  nationalities: any[];
  onCancel: () => void;
  onSubmit: () => void;
  /** create mode only */
  selectedOffer?: EmploymentContractOffer | null;
  onOfferSelect?: (offer: EmploymentContractOffer) => void;
}

export default function ContractFormModal({
  mode,
  open,
  isRtl,
  language,
  form,
  loading,
  customers,
  jobs,
  nationalities,
  onCancel,
  onSubmit,
  selectedOffer,
  onOfferSelect,
}: Props) {
  const isCreate = mode === 'create';

  return (
    <Modal
      title={
        <span>
          {isCreate ? (
            <PlusOutlined style={{ marginInlineEnd: 8 }} />
          ) : (
            <EditOutlined style={{ marginInlineEnd: 8 }} />
          )}
          {isCreate
            ? isRtl
              ? 'إضافة عقد تشغيل'
              : 'Add Operating Contract'
            : isRtl
              ? 'تعديل العقد'
              : 'Edit Contract'}
        </span>
      }
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {isRtl ? 'إلغاء' : 'Cancel'}
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={onSubmit}>
          {isCreate ? (isRtl ? 'إنشاء العقد' : 'Create Contract') : isRtl ? 'حفظ التعديلات' : 'Save Changes'}
        </Button>,
      ]}
      width={isCreate ? 1000 : 900}
      destroyOnClose
    >
      {isCreate && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 8 }}>{isRtl ? '1. اختر العرض' : '1. Select Offer'}</h3>
          <Alert
            type="info"
            showIcon
            message={
              isRtl
                ? 'اختر عرض من الجدول أدناه لملء بيانات العقد تلقائياً'
                : 'Select an offer from the table below to auto-fill contract data'
            }
            style={{ marginBottom: 16 }}
          />
          <RentOfferSelector
            language={language}
            selectedOfferId={selectedOffer?.id ?? form.getFieldValue('offerId') ?? null}
            onSelect={(offer) => onOfferSelect?.(offer)}
            compact
          />
        </div>
      )}

      <div>
        {isCreate && (
          <h3 style={{ marginBottom: 16 }}>{isRtl ? '2. بيانات العقد' : '2. Contract Details'}</h3>
        )}
        {isCreate && selectedOffer && (
          <Alert
            type="success"
            showIcon
            message={
              isRtl
                ? `تم ملء البيانات تلقائياً من العرض #${selectedOffer.id}`
                : `Data auto-filled from Offer #${selectedOffer.id}`
            }
            style={{ marginBottom: 16 }}
          />
        )}
        <Form form={form} layout="vertical" requiredMark="optional" dir={isRtl ? 'rtl' : 'ltr'}>
          <ContractFormFields
            isRtl={isRtl}
            customers={customers}
            jobs={jobs}
            nationalities={nationalities}
          />
        </Form>
      </div>
    </Modal>
  );
}
