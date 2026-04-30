'use client';

import { Form, Select, DatePicker, Button, Row, Col, Card } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { HR_PROCESS_STATE, HR_REQUEST_RESULT } from '@/constants/hr.enums';
import { toSelectOptions } from '@/constants/enums';
import type { HRRequestsFilterDto } from '@/types/hr.types';

const { RangePicker } = DatePicker;

interface RequestsFilterPanelProps {
  onFilter: (values: HRRequestsFilterDto) => void;
  loading?: boolean;
}

/**
 * Shared filter panel for Inbox and Outbox pages.
 */
export default function RequestsFilterPanel({ onFilter, loading }: RequestsFilterPanelProps) {
  const [form] = Form.useForm();
  const language = useAuthStore((s) => s.language);
  const isAr = language === 'ar';

  const handleFinish = (values: any) => {
    const dto: HRRequestsFilterDto = {
      processState: values.processState,
      processGroups: values.processGroups,
      processResults: values.processResults,
      startsDate: values.dateRange?.[0]?.format('YYYY-MM-DD'),
      endingDate: values.dateRange?.[1]?.format('YYYY-MM-DD'),
    };
    onFilter(dto);
  };

  const handleReset = () => {
    form.resetFields();
    onFilter({});
  };

  return (
    <Card
      size="small"
      title={isAr ? 'تصفية الطلبات' : 'Filter Requests'}
      style={{ marginBottom: 16 }}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="processState" label={isAr ? 'نوع الطلب' : 'Request Type'}>
              <Select
                allowClear
                placeholder={isAr ? 'اختر النوع' : 'Select type'}
                options={toSelectOptions(HR_PROCESS_STATE, language)}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Form.Item name="processGroups" label={isAr ? 'المجموعات' : 'Groups'}>
              <Select
                mode="multiple"
                allowClear
                placeholder={isAr ? 'اختر المجموعات' : 'Select groups'}
                options={toSelectOptions(HR_PROCESS_STATE, language)}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Form.Item name="processResults" label={isAr ? 'نتيجة الطلب' : 'Result'}>
              <Select
                mode="multiple"
                allowClear
                placeholder={isAr ? 'اختر النتيجة' : 'Select result'}
                options={toSelectOptions(HR_REQUEST_RESULT, language)}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Form.Item name="dateRange" label={isAr ? 'الفترة الزمنية' : 'Date Range'}>
              <RangePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row justify="end" gutter={8}>
          <Col>
            <Button onClick={handleReset} icon={<ReloadOutlined />}>
              {isAr ? 'إعادة تعيين' : 'Reset'}
            </Button>
          </Col>
          <Col>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SearchOutlined />}
              loading={loading}
            >
              {isAr ? 'بحث' : 'Search'}
            </Button>
          </Col>
        </Row>
      </Form>
    </Card>
  );
}
