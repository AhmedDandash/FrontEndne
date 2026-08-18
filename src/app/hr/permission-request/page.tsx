'use client';

import { useState } from 'react';
import {
  Card,
  Form,
  Select,
  DatePicker,
  Radio,
  TimePicker,
  Input,
  Button,
  Row,
  Col,
  Descriptions,
  Typography,
  Divider,
} from 'antd';
import { SendOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useHREmployees } from '@/hooks/api/useHR';
import { useHRPermissionRequest } from '@/hooks/api/useHR';
import AccessDenied from '@/components/common/AccessDenied';
import { useHrActionGates } from '@/hooks/useActionPermissionGates';
import type { CreatePermissionRequestDto, PermissionType, PermissionNature } from '@/types/hr.types';
import type { EmployeeDto } from '@/types/hr.types';

const { Title } = Typography;
const { TextArea } = Input;

const PERMISSION_NATURE_OPTIONS = [
  { value: 1, label: 'رسمي (مهمة عمل)' },
  { value: 2, label: 'شخصي (ظروف شخصية)' },
];

export default function PermissionRequestPage() {
  const [form] = Form.useForm();
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeDto | null>(null);
  const [permissionType, setPermissionType] = useState<number>(3);
  const hrGates = useHrActionGates();

  const { employees, isLoading: isLoadingEmployees } = useHREmployees({ pageSize: 200 });
  const { createPermissionRequest, isCreating } = useHRPermissionRequest();

  const handleEmployeeChange = (id: string) => {
    const emp = employees.find((e) => e.id === id) ?? null;
    setSelectedEmployee(emp);
  };

  const handleSubmit = async () => {
    if (!hrGates.canCreate) return;
    try {
      const values = await form.validateFields();

      const dto: CreatePermissionRequestDto = {
        createdTo: values.createdTo,
        permissionDate: values.permissionDate.toISOString(),
        permissionType: values.permissionType as PermissionType,
        permissionNature: values.permissionNature as PermissionNature,
        comeLateTime: values.permissionType === 1 && values.comeLateTime
          ? values.comeLateTime.format('HH:mm')
          : null,
        partTimeStart: values.permissionType === 2 && values.partTimeStart
          ? values.partTimeStart.format('HH:mm')
          : null,
        partTimeFinish: values.permissionType === 2 && values.partTimeFinish
          ? values.partTimeFinish.format('HH:mm')
          : null,
        outEarlyTime: values.permissionType === 3 && values.outEarlyTime
          ? values.outEarlyTime.format('HH:mm')
          : null,
        reasons: values.reasons,
      };

      await createPermissionRequest(dto);
      form.resetFields();
      setSelectedEmployee(null);
      setPermissionType(3);
    } catch {
      // Mutation hooks surface the API error. Keep the form values for retry.
    }
  };

  if (hrGates.isReady && !hrGates.canCreate) {
    return <AccessDenied />;
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <ClockCircleOutlined style={{ fontSize: 22, color: '#1677ff' }} />
        <Title level={4} style={{ margin: 0 }}>طلب استئذان عن مواعيد العمل</Title>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={{ permissionType: 3 }}
        onValuesChange={(changed) => {
          if ('permissionType' in changed) setPermissionType(changed.permissionType);
        }}
      >
        <Row gutter={16}>
          {/* Right: Employee info */}
          <Col xs={24} md={10}>
            <Card
              title={<span style={{ color: '#fff' }}>بيانات الموظف</span>}
              styles={{ header: { background: '#4da6e8', border: 'none' } }}
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
                  placeholder="اختر الموظف"
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
                  <Descriptions.Item label="الإدارة">
                    {selectedEmployee.departmentNameAr || selectedEmployee.departmentNameEn || '—'}
                  </Descriptions.Item>
                </Descriptions>
              )}

              <Divider />

              <Form.Item
                name="permissionNature"
                label="طبيعة الاستئذان"
                rules={[{ required: true, message: 'يرجى اختيار طبيعة الاستئذان' }]}
              >
                <Select placeholder="من فضلك اختر طبيعة الاستئذان" options={PERMISSION_NATURE_OPTIONS} />
              </Form.Item>
            </Card>
          </Col>

          {/* Left: Permission form */}
          <Col xs={24} md={14}>
            <Card
              title={<span style={{ color: '#fff' }}>نوع الاستئذان</span>}
              styles={{ header: { background: '#4da6e8', border: 'none' } }}
            >
              <Form.Item
                name="permissionDate"
                label="الاستئذان ليوم"
                rules={[{ required: true, message: 'يرجى تحديد تاريخ الاستئذان' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD"
                  disabledDate={(d) => d.isBefore(dayjs(), 'day')}
                />
              </Form.Item>

              <Form.Item name="permissionType" label="نوع الاستئذان">
                <Radio.Group>
                  <Radio value={1}>في بداية اليوم</Radio>
                  <Radio value={2}>خلال يوم العمل</Radio>
                  <Radio value={3}>في نهاية اليوم</Radio>
                </Radio.Group>
              </Form.Item>

              {permissionType === 1 && (
                <Form.Item
                  name="comeLateTime"
                  label="الحضور في الساعة"
                  rules={[{ required: true, message: 'يرجى تحديد وقت الحضور المتوقع' }]}
                >
                  <TimePicker format="HH:mm" minuteStep={5} style={{ width: '100%' }} />
                </Form.Item>
              )}

              {permissionType === 2 && (
                <Row gutter={12}>
                  <Col xs={12}>
                    <Form.Item
                      name="partTimeStart"
                      label="من الساعة"
                      rules={[{ required: true, message: 'يرجى تحديد وقت الخروج' }]}
                    >
                      <TimePicker format="HH:mm" minuteStep={5} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={12}>
                    <Form.Item
                      name="partTimeFinish"
                      label="إلى الساعة"
                      rules={[{ required: true, message: 'يرجى تحديد وقت العودة' }]}
                    >
                      <TimePicker format="HH:mm" minuteStep={5} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              )}

              {permissionType === 3 && (
                <Form.Item
                  name="outEarlyTime"
                  label="وقت الانصراف"
                  rules={[{ required: true, message: 'يرجى تحديد وقت الخروج المبكر' }]}
                >
                  <TimePicker format="HH:mm" minuteStep={5} style={{ width: '100%' }} />
                </Form.Item>
              )}

              <Form.Item
                name="reasons"
                label="الأسباب"
                rules={[{ required: true, message: 'يرجى كتابة سبب الاستئذان' }]}
              >
                <TextArea rows={4} maxLength={1000} showCount placeholder="سبب طلب الاستئذان..." />
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
