/**
 * Worker delivery-form modal.
 *
 * Loads GET /print-delivery-form data, lets the user set the delivery date,
 * employee name, notes and mark the customer/worker/company signatures, then
 * saves via POST /delivery-form and/or prints (also usable as Save-as-PDF).
 */
'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Input, DatePicker, Empty, Image, Checkbox, message, Divider } from 'antd';
import { PrinterOutlined, SaveOutlined } from '@ant-design/icons';
import type { OperatingContractDeliveryFormDto, SaveDeliveryFormDto } from '@/types/api.types';
import { resolveImageUrl } from '@/utils/image';
import { useAuthStore } from '@/store/authStore';
import { toDeliveryFormSections, printDeliveryForm } from './delivery-form';
import styles from '../RentContracts.module.css';

/** The backend sometimes returns the employee's GUID instead of a name. */
const isGuid = (v?: string | null): boolean =>
  !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v.trim());

interface Props {
  open: boolean;
  isRtl: boolean;
  data: OperatingContractDeliveryFormDto | null;
  loading: boolean;
  saving: boolean;
  title: string;
  onClose: () => void;
  onSave: (data: SaveDeliveryFormDto) => Promise<unknown>;
}

export default function DeliveryFormModal({
  open,
  isRtl,
  data,
  loading,
  saving,
  title,
  onClose,
  onSave,
}: Props) {
  const [form] = Form.useForm();
  const currentUserName = useAuthStore((state) => state.username);
  const [customerSigned, setCustomerSigned] = useState(false);
  const [workerSigned, setWorkerSigned] = useState(false);
  const [companySigned, setCompanySigned] = useState(false);

  const sections = toDeliveryFormSections(data, isRtl);

  // Hydrate the editable fields when new print data arrives.
  useEffect(() => {
    if (!data) return;
    // The backend may return the employee GUID — prefer the logged-in user's name.
    const employeeName = isGuid(data.employeeName)
      ? currentUserName ?? undefined
      : data.employeeName ?? currentUserName ?? undefined;
    form.setFieldsValue({
      employeeName,
      notes: data.notes ?? undefined,
    });
    setCustomerSigned(!!data.customerSignedAt);
    setWorkerSigned(!!data.workerSignedAt);
    setCompanySigned(!!data.companyRepresentativeSignedAt);
  }, [data, form, currentUserName]);

  const buildPayload = (): SaveDeliveryFormDto => {
    const values = form.getFieldsValue();
    const nowIso = () => new Date().toISOString();
    return {
      deliveryDate: values.deliveryDate
        ? values.deliveryDate.format('YYYY-MM-DD')
        : data?.deliveryDate ?? null,
      employeeName: values.employeeName ?? null,
      notes: values.notes ?? null,
      customerSignedAt: customerSigned ? data?.customerSignedAt ?? nowIso() : null,
      workerSignedAt: workerSigned ? data?.workerSignedAt ?? nowIso() : null,
      companyRepresentativeSignedAt: companySigned
        ? data?.companyRepresentativeSignedAt ?? nowIso()
        : null,
    };
  };

  const handleSave = async () => {
    try {
      await onSave(buildPayload());
    } catch {
      // error surfaced by the mutation
    }
  };

  const handlePrint = () => {
    const ok = printDeliveryForm(data, isRtl, title);
    if (!ok) {
      message.warning(
        isRtl
          ? 'تم حظر نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة.'
          : 'The print window was blocked. Please allow pop-ups.'
      );
    }
  };

  return (
    <Modal
      title={
        <span>
          <PrinterOutlined style={{ marginInlineEnd: 8 }} />
          {isRtl ? 'نموذج تسليم العامل' : 'Worker Delivery Form'} — {title}
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          {isRtl ? 'إغلاق' : 'Close'}
        </Button>,
        <Button
          key="save"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={saving}
          disabled={loading || !data}
        >
          {isRtl ? 'حفظ' : 'Save'}
        </Button>,
        <Button
          key="print"
          type="primary"
          icon={<PrinterOutlined />}
          onClick={handlePrint}
          disabled={loading || !data}
        >
          {isRtl ? 'طباعة / PDF' : 'Print / PDF'}
        </Button>,
      ]}
      width={680}
      destroyOnHidden
    >
      {loading ? (
        <p style={{ textAlign: 'center', padding: 24 }}>
          {isRtl ? 'جاري تحميل بيانات النموذج...' : 'Loading form data...'}
        </p>
      ) : !data ? (
        <Empty description={isRtl ? 'لا توجد بيانات' : 'No data'} />
      ) : (
        <div dir={isRtl ? 'rtl' : 'ltr'}>
          {data.workerPhotoUrl && (
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Image
                src={resolveImageUrl(data.workerPhotoUrl)}
                alt="worker"
                width={96}
                height={96}
                style={{ objectFit: 'cover', borderRadius: 8 }}
              />
            </div>
          )}

          {sections.map((s) => (
            <div key={s.title} className={styles.modalSection} style={{ marginBottom: 16 }}>
              <h4 style={{ color: '#003366' }}>{s.title}</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {s.rows.map((r, i) => (
                    <tr key={i}>
                      <th
                        style={{
                          textAlign: isRtl ? 'right' : 'left',
                          padding: '6px 10px',
                          color: '#555',
                          fontWeight: 600,
                          width: '40%',
                          borderBottom: '1px solid #f0f0f0',
                        }}
                      >
                        {r.label}
                      </th>
                      <td style={{ padding: '6px 10px', borderBottom: '1px solid #f0f0f0' }}>
                        {r.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          <Divider style={{ margin: '12px 0' }} />

          <Form form={form} layout="vertical">
            <Form.Item name="deliveryDate" label={isRtl ? 'تاريخ التسليم' : 'Delivery Date'}>
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item name="employeeName" label={isRtl ? 'اسم الموظف' : 'Employee Name'}>
              <Input placeholder={isRtl ? 'اسم الموظف المسلِّم' : 'Delivering employee name'} />
            </Form.Item>
            <Form.Item name="notes" label={isRtl ? 'ملاحظات' : 'Notes'}>
              <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item label={isRtl ? 'التوقيعات' : 'Signatures'} style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <Checkbox checked={customerSigned} onChange={(e) => setCustomerSigned(e.target.checked)}>
                  {isRtl ? 'وقّع العميل' : 'Customer signed'}
                </Checkbox>
                <Checkbox checked={workerSigned} onChange={(e) => setWorkerSigned(e.target.checked)}>
                  {isRtl ? 'وقّع العامل' : 'Worker signed'}
                </Checkbox>
                <Checkbox checked={companySigned} onChange={(e) => setCompanySigned(e.target.checked)}>
                  {isRtl ? 'وقّع ممثل الشركة' : 'Company rep signed'}
                </Checkbox>
              </div>
            </Form.Item>
          </Form>
        </div>
      )}
    </Modal>
  );
}
