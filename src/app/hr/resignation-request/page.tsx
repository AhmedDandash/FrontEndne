'use client';

import { useState } from 'react';
import {
  Card,
  Form,
  Select,
  DatePicker,
  Input,
  Button,
  Row,
  Col,
  Descriptions,
  Typography,
} from 'antd';
import { SendOutlined, FileTextOutlined } from '@ant-design/icons';
import { useHREmployees, useHRResignationRequest } from '@/hooks/api/useHR';
import type { CreateResignationRequestDto } from '@/types/hr.types';
import type { EmployeeDto } from '@/types/hr.types';

const { Title } = Typography;
const { TextArea } = Input;

export default function ResignationRequestPage() {
  const [form] = Form.useForm();
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeDto | null>(null);

  const { employees, isLoading: isLoadingEmployees } = useHREmployees({ pageSize: 200 });
  const { createResignationRequest, isCreating } = useHRResignationRequest();

  const handleEmployeeChange = (id: string) => {
    const emp = employees.find((e) => e.id === id) ?? null;
    setSelectedEmployee(emp);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();

    const dto: CreateResignationRequestDto = {
      createdTo: values.createdTo,
      resignationDate: values.resignationDate.toISOString(),
      endDate: values.endDate.toISOString(),
      reasons: values.reasons,
    };

    await createResignationRequest(dto);
    form.resetFields();
    setSelectedEmployee(null);
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <FileTextOutlined style={{ fontSize: 22, color: '#1677ff' }} />
        <Title level={4} style={{ margin: 0 }}>طلب استقالة</Title>
      </div>

      <Form form={form} layout="vertical">
        <Row gutter={16}>
          {/* Right: Employee info */}
          <Col xs={24} md={10}>
            <Card
              title={<span style={{ color: '#fff' }}>بيانات الموظف</span>}
              headStyle={{ background: '#4da6e8', border: 'none' }}
              style={{ height: '100%' }}
            >
              <div style={{ marginBottom: 8, fontWeight: 500 }}>من أجل</div>
              <Form.Item
                name="createdTo"
                rules={[{ required: true, message: 'يرجى اختيار الموظف' }]}
                style={{ marginBottom: 16 }}
              >
                <Select
                  showSearch
                  placeholder="اسم الكيال"
                  loading={isLoadingEmployees}
                  onChange={handleEmployeeChange}
                  optionFilterProp="label"
                  options={employees.map((e) => ({
                    value: e.id,
                    label: e.nameAr || e.nameEn || e.id,
                  }))}
                />
              </Form.Item>

              {selectedEmployee && (
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="المسمى الوظيفي">
                    {selectedEmployee.jobNameAr || selectedEmployee.jobNameEn || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="الرقم الوظيفي">
                    {selectedEmployee.employeeNumber || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="رقم الهوية">
                    {selectedEmployee.idNumber || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="الجنسية">
                    {selectedEmployee.nationalityNameAr || selectedEmployee.nationalityNameEn || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="الإدارة">
                    {selectedEmployee.departmentNameAr || selectedEmployee.departmentNameEn || '—'}
                  </Descriptions.Item>
                </Descriptions>
              )}
            </Card>
          </Col>

          {/* Left: Resignation form */}
          <Col xs={24} md={14}>
            <Card
              title={<span style={{ color: '#fff' }}>بيانات الاستقالة</span>}
              headStyle={{ background: '#4da6e8', border: 'none' }}
            >
              <Form.Item
                name="resignationDate"
                label="تاريخ تقديم الاستقالة"
                rules={[{ required: true, message: 'يرجى تحديد تاريخ تقديم الاستقالة' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>

              <Form.Item
                name="endDate"
                label="تاريخ آخر يوم عمل"
                dependencies={['resignationDate']}
                rules={[
                  { required: true, message: 'يرجى تحديد تاريخ آخر يوم عمل' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const resDate = getFieldValue('resignationDate');
                      if (!value || !resDate || value.isSameOrAfter(resDate, 'day')) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('يجب أن يكون تاريخ آخر يوم عمل مساوياً أو أكبر من تاريخ الاستقالة'));
                    },
                  }),
                ]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>

              <Form.Item
                name="reasons"
                label="الأسباب"
                rules={[{ required: true, message: 'يرجى كتابة أسباب الاستقالة' }]}
              >
                <TextArea rows={5} maxLength={1000} showCount placeholder="أسباب وتفاصيل الاستقالة..." />
              </Form.Item>
            </Card>
          </Col>
        </Row>

        <div style={{ marginTop: 16 }}>
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={isCreating}
            onClick={handleSubmit}
            size="large"
          >
            إرسال
          </Button>
        </div>
      </Form>
    </div>
  );
}
