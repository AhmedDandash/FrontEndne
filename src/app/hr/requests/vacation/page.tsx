'use client';

import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Row,
  Col,
  Card,
  Divider,
  Spin,
  Upload,
} from 'antd';
import { UploadOutlined, SendOutlined, CalendarOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useCurrentHREmployee, useCreateVacationRequest, useHREmployeeSearch } from '@/hooks/api/useHR';
import { HR_VACATION_TYPE } from '@/constants/hr.enums';
import { toSelectOptions } from '@/constants/enums';
import EmployeeInfoCard from '@/features/hr/components/EmployeeInfoCard';
import HRPageHeader from '@/features/hr/components/HRPageHeader';
import type { CreateVacationRequestDto } from '@/types/hr.types';
import dayjs from 'dayjs';

const { TextArea } = Input;

export default function VacationRequestPage() {
  const [form] = Form.useForm();
  const language = useAuthStore((s) => s.language);

  const isAr = language === 'ar';

  const [substituteSearch, setSubstituteSearch] = useState('');

  const { data: currentEmployee, isLoading: empLoading } = useCurrentHREmployee();
  const { mutate: createRequest, isPending } = useCreateVacationRequest();

  // Substitute employee search — deferred until user types at least 2 chars
  const { data: substituteResults = [], isLoading: searchingSubstitute } =
    useHREmployeeSearch(substituteSearch);

  const substituteOptions = substituteResults.map((e) => ({
    value: e.id,
    label: `${isAr ? e.nameAr : e.nameEn} — ${e.employeeNumber}`,
  }));

  useEffect(() => {
    if (currentEmployee) {
      form.setFieldValue('createdTo', currentEmployee.id);
    }
  }, [currentEmployee, form]);

  const handleDateChange = () => {
    const startDate = form.getFieldValue('vacationDate');
    const days = form.getFieldValue('vacationDays');
    if (startDate && days) {
      const finalDate = dayjs(startDate).add(days - 1, 'day');
      form.setFieldValue('finalizeDate', finalDate);
      form.setFieldValue('comeBackDate', finalDate.add(1, 'day').format('YYYY/MM/DD'));
    }
  };

  const handleFinish = (values: any) => {
    const attachmentFile: File | null =
      values.attachment?.fileList?.[0]?.originFileObj ?? null;

    const dto: CreateVacationRequestDto = {
      createdTo: currentEmployee!.id,
      vacationType: values.vacationType,
      vacationDays: values.vacationDays,
      vacationDate: values.vacationDate?.format('YYYY-MM-DDTHH:mm:ss'),
      finalizeDate: values.finalizeDate?.format('YYYY-MM-DDTHH:mm:ss'),
      substituteId: values.substituteId ?? null,
      mobileNumber: values.mobileNumber ?? null,
      reasons: values.reasons,
      attachmentFile,
    };
    createRequest(dto, {
      onSuccess: () => form.resetFields(),
    });
  };

  return (
    <div style={{ padding: 24 }}>
      <HRPageHeader title={isAr ? 'طلب إجازة' : 'Vacation Request'} icon={<CalendarOutlined />} />

      {/* Employee Info — populated from session first, API fallback */}
      <EmployeeInfoCard employee={currentEmployee} loading={empLoading} />

      <Card>
        <Spin spinning={empLoading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            disabled={empLoading || !currentEmployee}
          >
            <Form.Item name="createdTo" hidden>
              <Input />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  name="vacationType"
                  label={isAr ? 'نوع الإجازة' : 'Vacation Type'}
                  rules={[{ required: true, message: isAr ? 'مطلوب' : 'Required' }]}
                >
                  <Select
                    placeholder={isAr ? 'اختر نوع الإجازة' : 'Select vacation type'}
                    options={toSelectOptions(HR_VACATION_TYPE, language)}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  name="vacationDays"
                  label={isAr ? 'عدد أيام الإجازة' : 'Vacation Days'}
                  rules={[
                    { required: true, message: isAr ? 'مطلوب' : 'Required' },
                    { type: 'number', min: 1, max: 365, message: isAr ? 'من 1 إلى 365 يوم' : '1–365 days' },
                  ]}
                >
                  <InputNumber min={1} max={365} style={{ width: '100%' }} onChange={handleDateChange} />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  name="vacationDate"
                  label={isAr ? 'تاريخ بداية الإجازة' : 'Vacation Start Date'}
                  rules={[{ required: true, message: isAr ? 'مطلوب' : 'Required' }]}
                >
                  <DatePicker style={{ width: '100%' }} onChange={handleDateChange} />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  name="finalizeDate"
                  label={isAr ? 'تاريخ نهاية الإجازة' : 'Vacation End Date'}
                  rules={[{ required: true, message: isAr ? 'مطلوب' : 'Required' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  name="comeBackDate"
                  label={isAr ? 'تاريخ العودة (تلقائي)' : 'Return Date (auto)'}
                >
                  <Input disabled placeholder={isAr ? 'يحسب تلقائياً' : 'Auto-calculated'} />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <Form.Item name="mobileNumber" label={isAr ? 'رقم الجوال' : 'Mobile Number'}>
                  <Input maxLength={24} />
                </Form.Item>
              </Col>

              {/* Substitute Employee — searchable dropdown via API */}
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  name="substituteId"
                  label={isAr ? 'الموظف البديل (اختياري)' : 'Substitute Employee (optional)'}
                >
                  <Select
                    showSearch
                    allowClear
                    filterOption={false}
                    loading={searchingSubstitute}
                    onSearch={(val) => setSubstituteSearch(val)}
                    options={substituteOptions}
                    placeholder={isAr ? 'ابحث عن موظف...' : 'Search for employee...'}
                    notFoundContent={
                      substituteSearch.length < 2
                        ? (isAr ? 'اكتب حرفين للبحث' : 'Type 2+ chars to search')
                        : (isAr ? 'لا توجد نتائج' : 'No results')
                    }
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="reasons"
                  label={isAr ? 'السبب' : 'Reason'}
                  rules={[
                    { required: true, message: isAr ? 'مطلوب' : 'Required' },
                    { min: 10, message: isAr ? 'على الأقل 10 أحرف' : 'Minimum 10 characters' },
                    { max: 500, message: isAr ? 'أقصاه 500 حرف' : 'Maximum 500 characters' },
                  ]}
                >
                  <TextArea rows={4} maxLength={500} showCount />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="attachment"
                  label={isAr ? 'المرفق (اختياري)' : 'Attachment (optional)'}
                >
                  <Upload maxCount={1} beforeUpload={() => false}>
                    <Button icon={<UploadOutlined />}>{isAr ? 'رفع ملف' : 'Upload file'}</Button>
                  </Upload>
                </Form.Item>
              </Col>
            </Row>

            <Row justify="end">
              <Col>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SendOutlined />}
                  loading={isPending}
                  disabled={!currentEmployee}
                >
                  {isAr ? 'إرسال الطلب' : 'Submit Request'}
                </Button>
              </Col>
            </Row>
          </Form>
        </Spin>
      </Card>
    </div>
  );
}
