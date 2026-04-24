'use client';

import React, { useEffect } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Button,
  Row,
  Col,
  Card,
  Divider,
  Spin,
  Alert,
} from 'antd';
import { SendOutlined, DollarOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useCurrentHREmployee, useCreateLoanRequest } from '@/hooks/api/useHR';
import HRPageHeader from '@/features/hr/components/HRPageHeader';
import EmployeeInfoCard from '@/features/hr/components/EmployeeInfoCard';
import type { CreateLoanRequestDto } from '@/types/hr.types';

const { TextArea } = Input;

export default function LoansRequestPage() {
  const [form] = Form.useForm();
  const language = useAuthStore((s) => s.language);

  const isAr = language === 'ar';

  const { data: currentEmployee, isLoading: empLoading } = useCurrentHREmployee();
  const { mutate: createRequest, isPending } = useCreateLoanRequest();

  useEffect(() => {
    if (currentEmployee) form.setFieldValue('createdTo', currentEmployee.id);
  }, [currentEmployee, form]);

  const handleFinish = (values: any) => {
    const dto: CreateLoanRequestDto = {
      createdTo: currentEmployee!.id,
      loanAmount: values.loanAmount,
      reasons: values.reasons,
    };
    createRequest(dto, { onSuccess: () => form.resetFields() });
  };

  const maxLoan = currentEmployee?.totalSalary
    ? currentEmployee.totalSalary * 3
    : undefined;

  return (
    <div style={{ padding: 24 }}>
      <HRPageHeader title={isAr ? 'طلب قرض' : 'Loans Request'} icon={<DollarOutlined />} />

      {/* Employee info with salary details */}
      <EmployeeInfoCard employee={currentEmployee} loading={empLoading} showSalary />

      {maxLoan && (
        <Alert
          type="info"
          icon={<DollarOutlined />}
          showIcon
          message={
            isAr
              ? `الحد الأقصى للقرض: ${maxLoan.toLocaleString()} ريال (3 × الراتب الإجمالي)`
              : `Maximum loan: ${maxLoan.toLocaleString()} SAR (3 × total salary)`
          }
          style={{ marginBottom: 16 }}
        />
      )}

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
                  name="loanAmount"
                  label={isAr ? 'مبلغ القرض' : 'Loan Amount'}
                  rules={[
                    { required: true, message: isAr ? 'مطلوب' : 'Required' },
                    { type: 'number', min: 1, message: isAr ? 'يجب أن يكون أكبر من 0' : 'Must be > 0' },
                    ...(maxLoan
                      ? [
                          {
                            type: 'number' as const,
                            max: maxLoan,
                            message: isAr
                              ? `لا يمكن أن يتجاوز ${maxLoan.toLocaleString()}`
                              : `Cannot exceed ${maxLoan.toLocaleString()}`,
                          },
                        ]
                      : []),
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={1}
                    max={maxLoan}
                    addonAfter={isAr ? 'ريال' : 'SAR'}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Row>
              <Col xs={24}>
                <Form.Item
                  name="reasons"
                  label={isAr ? 'سبب القرض' : 'Loan Purpose'}
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
