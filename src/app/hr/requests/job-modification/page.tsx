'use client';

import React, { useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Row,
  Col,
  Card,
  Divider,
  Spin,
  Descriptions,
} from 'antd';
import { SendOutlined, SwapOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import HRPageHeader from '@/features/hr/components/HRPageHeader';
import {
  useCurrentHREmployee,
  useHRDepartments,
  useHRSalaryScales,
  useCreateJobModificationRequest,
} from '@/hooks/api/useHR';
import EmployeeInfoCard from '@/features/hr/components/EmployeeInfoCard';
import type { CreateJobModificationRequestDto } from '@/types/hr.types';

const { TextArea } = Input;

export default function JobModificationRequestPage() {
  const [form] = Form.useForm();
  const language = useAuthStore((s) => s.language);
  const userId = useAuthStore((s) => s.userId);
  const isAr = language === 'ar';

  const { data: currentEmployee, isLoading: empLoading } = useCurrentHREmployee(userId);
  const { data: departments = [] } = useHRDepartments();
  const { data: salaryScales = [] } = useHRSalaryScales();
  const { mutate: createRequest, isPending } = useCreateJobModificationRequest();

  useEffect(() => {
    if (currentEmployee) form.setFieldValue('createdTo', currentEmployee.id);
  }, [currentEmployee, form]);

  const handleFinish = (values: any) => {
    const dto: CreateJobModificationRequestDto = {
      createdTo: currentEmployee!.id,
      newDepartmentId: values.newDepartmentId,
      newSalaryScaleId: values.newSalaryScaleId,
      newTotalSalary: values.newTotalSalary,
      reasons: values.reasons,
    };
    createRequest(dto, { onSuccess: () => form.resetFields() });
  };

  const deptOptions = departments.map((d) => ({
    value: d.id,
    label: isAr ? d.nameAr : d.nameEn,
  }));

  const scaleOptions = salaryScales.map((s) => ({
    value: s.id,
    label: isAr ? s.nameAr : s.nameEn,
  }));

  return (
    <div style={{ padding: 24 }}>
      <HRPageHeader title={isAr ? 'طلب تعديل وظيفي' : 'Job Modification Request'} icon={<SwapOutlined />} />

      <EmployeeInfoCard employee={currentEmployee} loading={empLoading} />

      {/* Current job info (read-only) */}
      {currentEmployee && (
        <Card
          size="small"
          title={
            <span>
              <SwapOutlined style={{ marginInlineEnd: 8 }} />
              {isAr ? 'البيانات الحالية' : 'Current Information'}
            </span>
          }
          style={{ marginBottom: 16, background: '#fffbe6' }}
        >
          <Descriptions size="small" column={{ xs: 1, sm: 3 }}>
            <Descriptions.Item label={isAr ? 'القسم الحالي' : 'Current Dept'}>
              {currentEmployee.departmentName}
            </Descriptions.Item>
            <Descriptions.Item label={isAr ? 'إجمالي الراتب الحالي' : 'Current Salary'}>
              {currentEmployee.totalSalary?.toLocaleString()}
            </Descriptions.Item>
          </Descriptions>
        </Card>
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
                  name="newDepartmentId"
                  label={isAr ? 'القسم الجديد' : 'New Department'}
                  rules={[{ required: true, message: isAr ? 'مطلوب' : 'Required' }]}
                >
                  <Select
                    placeholder={isAr ? 'اختر القسم' : 'Select department'}
                    options={deptOptions}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  name="newSalaryScaleId"
                  label={isAr ? 'درجة الراتب الجديدة' : 'New Salary Scale'}
                  rules={[{ required: true, message: isAr ? 'مطلوب' : 'Required' }]}
                >
                  <Select
                    placeholder={isAr ? 'اختر الدرجة' : 'Select scale'}
                    options={scaleOptions}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  name="newTotalSalary"
                  label={isAr ? 'الراتب الإجمالي الجديد' : 'New Total Salary'}
                  rules={[
                    { required: true, message: isAr ? 'مطلوب' : 'Required' },
                    { type: 'number', min: 1 },
                  ]}
                >
                  <InputNumber style={{ width: '100%' }} min={1} />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Row>
              <Col xs={24}>
                <Form.Item
                  name="reasons"
                  label={isAr ? 'سبب التعديل' : 'Reason for Modification'}
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
