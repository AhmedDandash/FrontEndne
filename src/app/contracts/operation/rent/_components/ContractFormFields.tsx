/**
 * Shared contract form fields, rendered inside both the Create and Edit modals.
 * Must be placed within an Ant Design <Form> (uses Form.Item `name` bindings).
 */
'use client';

import React from 'react';
import { Row, Col, Form, Input, InputNumber, Select, DatePicker } from 'antd';
import { OPERATING_PAYMENT_METHOD, toSelectOptions } from '@/constants/enums';

interface Props {
  isRtl: boolean;
  customers: any[];
  jobs: any[];
  nationalities: any[];
}

export default function ContractFormFields({ isRtl, customers, jobs, nationalities }: Props) {
  const lang = isRtl ? 'ar' : 'en';

  return (
    <>
      <Form.Item name="offerId" hidden>
        <Input />
      </Form.Item>

      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12}>
          <Form.Item
            name="customerId"
            label={isRtl ? 'العميل' : 'Customer'}
            rules={[{ required: true, message: isRtl ? 'مطلوب' : 'Required' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder={isRtl ? 'اختر العميل' : 'Select Customer'}
              options={customers.map((c: any) => ({
                value: c.id,
                label: isRtl
                  ? c.arabicName || c.englishName || `#${c.id}`
                  : c.englishName || c.arabicName || `#${c.id}`,
              }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="nationalityId" label={isRtl ? 'الجنسية' : 'Nationality'}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder={isRtl ? 'اختر الجنسية' : 'Select Nationality'}
              options={nationalities.map((n) => ({
                value: String(n.id),
                label: isRtl ? n.nationalityNameAr : n.nationalityNameEn,
              }))}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12}>
          <Form.Item name="jobId" label={isRtl ? 'الوظيفة' : 'Job'}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder={isRtl ? 'اختر الوظيفة' : 'Select Job'}
              options={jobs.map((j: any) => ({
                value: j.id,
                label: isRtl ? j.jobNameAr || j.name : j.jobNameEn || j.name,
              }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="duration" label={isRtl ? 'المدة (أشهر)' : 'Duration (months)'}>
            <InputNumber style={{ width: '100%' }} min={1} max={24} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 0]}>
        <Col xs={24} sm={8}>
          <Form.Item name="cost" label={isRtl ? 'التكلفة' : 'Cost'}>
            <InputNumber style={{ width: '100%' }} min={0} addonAfter={isRtl ? 'ريال' : 'SAR'} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="insurance" label={isRtl ? 'التأمين' : 'Insurance'}>
            <InputNumber style={{ width: '100%' }} min={0} addonAfter={isRtl ? 'ريال' : 'SAR'} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="offerPrice" label={isRtl ? 'الإجمالي مع الضريبة' : 'Total with Tax'}>
            <InputNumber style={{ width: '100%' }} min={0} addonAfter={isRtl ? 'ريال' : 'SAR'} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12}>
          <Form.Item name="contractStartDate" label={isRtl ? 'تاريخ البداية' : 'Start Date'}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="contractEndDate" label={isRtl ? 'تاريخ النهاية' : 'End Date'}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12}>
          <Form.Item name="workerNameAr" label={isRtl ? 'اسم العامل (عربي)' : 'Worker Name (Arabic)'}>
            <Input placeholder={isRtl ? 'اسم العامل بالعربي' : 'Worker name in Arabic'} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="workerNameEn" label={isRtl ? 'اسم العامل (إنجليزي)' : 'Worker Name (English)'}>
            <Input placeholder={isRtl ? 'اسم العامل بالإنجليزي' : 'Worker name in English'} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12}>
          <Form.Item name="workerPhone" label={isRtl ? 'هاتف العامل' : 'Worker Phone'}>
            <Input placeholder="05xxxxxxxx" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="customerAddress" label={isRtl ? 'عنوان العميل' : 'Customer Address'}>
            <Input placeholder={isRtl ? 'العنوان' : 'Address'} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12}>
          <Form.Item name="workersCount" label={isRtl ? 'عدد العمال' : 'Workers Count'}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="paymentMethod" label={isRtl ? 'طريقة الدفع' : 'Payment Method'}>
            <Select
              placeholder={isRtl ? 'اختر طريقة الدفع' : 'Select Payment Method'}
              options={toSelectOptions(OPERATING_PAYMENT_METHOD, lang)}
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
}
