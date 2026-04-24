'use client';

import React, { useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Card,
  Divider,
  Spin,
} from 'antd';
import { SendOutlined, FileTextOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useCurrentHREmployee, useCreateEntitlementsRequest } from '@/hooks/api/useHR';
import HRPageHeader from '@/features/hr/components/HRPageHeader';
import { HR_ENTITLEMENT_TYPE } from '@/constants/hr.enums';
import { toSelectOptions } from '@/constants/enums';
import EmployeeInfoCard from '@/features/hr/components/EmployeeInfoCard';
import type { CreateEntitlementsRequestDto } from '@/types/hr.types';

const { TextArea } = Input;

export default function EntitlementsRequestPage() {
  const [form] = Form.useForm();
  const language = useAuthStore((s) => s.language);

  const isAr = language === 'ar';

  const { data: currentEmployee, isLoading: empLoading } = useCurrentHREmployee();
  const { mutate: createRequest, isPending } = useCreateEntitlementsRequest();

  useEffect(() => {
    if (currentEmployee) form.setFieldValue('createdTo', currentEmployee.id);
  }, [currentEmployee, form]);

  const handleFinish = (values: any) => {
    const dto: CreateEntitlementsRequestDto = {
      createdTo: currentEmployee!.id,
      entitlementType: values.entitlementType,
      notes: values.notes,
      reasons: values.reasons,
    };
    createRequest(dto, { onSuccess: () => form.resetFields() });
  };

  return (
    <div style={{ padding: 24 }}>
      <HRPageHeader title={isAr ? 'طلب مستحقات' : 'Entitlements Request'} icon={<FileTextOutlined />} />

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
                  name="entitlementType"
                  label={isAr ? 'نوع المستحقات' : 'Entitlement Type'}
                  rules={[{ required: true, message: isAr ? 'مطلوب' : 'Required' }]}
                >
                  <Select
                    placeholder={isAr ? 'اختر النوع' : 'Select type'}
                    options={toSelectOptions(HR_ENTITLEMENT_TYPE, language)}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="notes" label={isAr ? 'ملاحظات' : 'Notes'}>
                  <TextArea rows={3} maxLength={500} />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="reasons"
                  label={isAr ? 'سبب الطلب' : 'Reason'}
                  rules={[
                    { required: true, message: isAr ? 'مطلوب' : 'Required' },
                    { min: 10 },
                    { max: 500 },
                  ]}
                >
                  <TextArea rows={3} maxLength={500} showCount />
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
