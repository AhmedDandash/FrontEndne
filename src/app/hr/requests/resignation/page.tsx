'use client';

import React, { useEffect } from 'react';
import {
  Form,
  Input,
  DatePicker,
  Button,
  Row,
  Col,
  Card,
  Divider,
  Spin,
  Alert,
} from 'antd';
import { SendOutlined, WarningOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useCurrentHREmployee, useCreateResignationRequest } from '@/hooks/api/useHR';
import HRPageHeader from '@/features/hr/components/HRPageHeader';
import EmployeeInfoCard from '@/features/hr/components/EmployeeInfoCard';
import type { CreateResignationRequestDto } from '@/types/hr.types';

const { TextArea } = Input;

export default function ResignationRequestPage() {
  const [form] = Form.useForm();
  const language = useAuthStore((s) => s.language);

  const isAr = language === 'ar';

  const { data: currentEmployee, isLoading: empLoading } = useCurrentHREmployee();
  const { mutate: createRequest, isPending } = useCreateResignationRequest();

  useEffect(() => {
    if (currentEmployee) form.setFieldValue('createdTo', currentEmployee.id);
  }, [currentEmployee, form]);

  const handleFinish = (values: any) => {
    const dto: CreateResignationRequestDto = {
      createdTo: currentEmployee!.id,
      resignationDate: values.resignationDate?.format('YYYY-MM-DD'),
      endDate: values.endDate?.format('YYYY-MM-DD'),
      reasons: values.reasons,
    };
    createRequest(dto, { onSuccess: () => form.resetFields() });
  };

  return (
    <div style={{ padding: 24 }}>
      <HRPageHeader title={isAr ? 'طلب استقالة' : 'Resignation Request'} icon={<WarningOutlined />} />

      <Alert
        type="warning"
        icon={<WarningOutlined />}
        showIcon
        message={
          isAr
            ? 'يرجى مراجعة السياسات المتعلقة بالاستقالة قبل تقديم الطلب.'
            : 'Please review the resignation policy before submitting this request.'
        }
        style={{ marginBottom: 16 }}
      />

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
              <Col xs={24} sm={12}>
                <Form.Item
                  name="resignationDate"
                  label={isAr ? 'تاريخ تقديم الاستقالة' : 'Resignation Date'}
                  rules={[{ required: true, message: isAr ? 'مطلوب' : 'Required' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="endDate"
                  label={isAr ? 'تاريخ آخر يوم عمل' : 'Last Working Day'}
                  rules={[{ required: true, message: isAr ? 'مطلوب' : 'Required' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Row>
              <Col xs={24}>
                <Form.Item
                  name="reasons"
                  label={isAr ? 'سبب الاستقالة' : 'Reason for Resignation'}
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
                  danger
                  htmlType="submit"
                  icon={<SendOutlined />}
                  loading={isPending}
                  disabled={!currentEmployee}
                >
                  {isAr ? 'تقديم الاستقالة' : 'Submit Resignation'}
                </Button>
              </Col>
            </Row>
          </Form>
        </Spin>
      </Card>
    </div>
  );
}
