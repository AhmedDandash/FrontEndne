'use client';

import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  Button,
  Row,
  Col,
  Card,
  Divider,
  Spin,
  Radio,
} from 'antd';
import { SendOutlined, AuditOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useCurrentHREmployee, useCreatePermissionRequest } from '@/hooks/api/useHR';
import HRPageHeader from '@/features/hr/components/HRPageHeader';
import { HR_PERMISSION_TYPE, HR_PERMISSION_NATURE } from '@/constants/hr.enums';
import { toSelectOptions } from '@/constants/enums';
import EmployeeInfoCard from '@/features/hr/components/EmployeeInfoCard';
import type { CreatePermissionRequestDto, HRPermissionType } from '@/types/hr.types';

const { TextArea } = Input;

export default function PermissionRequestPage() {
  const [form] = Form.useForm();
  const language = useAuthStore((s) => s.language);
  const userId = useAuthStore((s) => s.userId);
  const isAr = language === 'ar';

  const [permType, setPermType] = useState<HRPermissionType | null>(null);

  const { data: currentEmployee, isLoading: empLoading } = useCurrentHREmployee(userId);
  const { mutate: createRequest, isPending } = useCreatePermissionRequest();

  useEffect(() => {
    if (currentEmployee) form.setFieldValue('createdTo', currentEmployee.id);
  }, [currentEmployee, form]);

  const handleFinish = (values: any) => {
    const dto: CreatePermissionRequestDto = {
      createdTo: currentEmployee!.id,
      permissionDate: values.permissionDate?.format('YYYY-MM-DD'),
      permissionType: values.permissionType,
      permissionNature: values.permissionNature,
      comeLateTime: values.comeLateTime?.format('HH:mm'),
      partTimeStart: values.partTimeStart?.format('HH:mm'),
      partTimeFinish: values.partTimeFinish?.format('HH:mm'),
      outEarlyTime: values.outEarlyTime?.format('HH:mm'),
      reasons: values.reasons,
    };
    createRequest(dto, { onSuccess: () => form.resetFields() });
  };

  return (
    <div style={{ padding: 24 }}>
      <HRPageHeader title={isAr ? 'طلب إذن' : 'Leave Permission Request'} icon={<AuditOutlined />} />

      <EmployeeInfoCard employee={currentEmployee} loading={empLoading} />

      <Card>
        <Spin spinning={empLoading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            disabled={empLoading || !currentEmployee}
          >
            <Form.Item name="createdTo" hidden><Input /></Form.Item>

            <Row gutter={16}>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  name="permissionDate"
                  label={isAr ? 'تاريخ الإذن' : 'Permission Date'}
                  rules={[{ required: true, message: isAr ? 'مطلوب' : 'Required' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  name="permissionNature"
                  label={isAr ? 'طبيعة الإذن' : 'Permission Nature'}
                  rules={[{ required: true, message: isAr ? 'مطلوب' : 'Required' }]}
                >
                  <Select
                    placeholder={isAr ? 'اختر الطبيعة' : 'Select nature'}
                    options={toSelectOptions(HR_PERMISSION_NATURE, language)}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={24}>
                <Form.Item
                  name="permissionType"
                  label={isAr ? 'نوع الإذن' : 'Permission Type'}
                  rules={[{ required: true, message: isAr ? 'مطلوب' : 'Required' }]}
                >
                  <Radio.Group onChange={(e) => setPermType(e.target.value)}>
                    {HR_PERMISSION_TYPE.map((opt) => (
                      <Radio key={opt.value} value={opt.value}>
                        {isAr ? opt.labelAr : opt.labelEn}
                      </Radio>
                    ))}
                  </Radio.Group>
                </Form.Item>
              </Col>

              {/* Conditional time fields based on permission type */}
              {permType === 1 && (
                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    name="comeLateTime"
                    label={isAr ? 'وقت التأخر' : 'Late Arrival Time'}
                    rules={[{ required: true, message: isAr ? 'مطلوب' : 'Required' }]}
                  >
                    <TimePicker format="HH:mm" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              )}

              {permType === 2 && (
                <>
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item
                      name="partTimeStart"
                      label={isAr ? 'وقت البداية' : 'Part-Time Start'}
                      rules={[{ required: true, message: isAr ? 'مطلوب' : 'Required' }]}
                    >
                      <TimePicker format="HH:mm" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item
                      name="partTimeFinish"
                      label={isAr ? 'وقت الانتهاء' : 'Part-Time Finish'}
                      rules={[{ required: true, message: isAr ? 'مطلوب' : 'Required' }]}
                    >
                      <TimePicker format="HH:mm" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </>
              )}

              {permType === 3 && (
                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    name="outEarlyTime"
                    label={isAr ? 'وقت الانصراف المبكر' : 'Early Departure Time'}
                    rules={[{ required: true, message: isAr ? 'مطلوب' : 'Required' }]}
                  >
                    <TimePicker format="HH:mm" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              )}
            </Row>

            <Divider />

            <Row gutter={16}>
              <Col xs={24}>
                <Form.Item
                  name="reasons"
                  label={isAr ? 'السبب' : 'Reason'}
                  rules={[
                    { required: true, message: isAr ? 'مطلوب' : 'Required' },
                    { min: 10, message: isAr ? 'على الأقل 10 أحرف' : 'Minimum 10 characters' },
                    { max: 500 },
                  ]}
                >
                  <TextArea rows={4} maxLength={500} showCount />
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
