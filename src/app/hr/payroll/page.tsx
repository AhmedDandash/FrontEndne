'use client';

import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Select,
  Tag,
  Typography,
  Popconfirm,
  Tooltip,
  Row,
  Col,
  Statistic,
  Alert,
  Empty,
} from 'antd';
import {
  DollarOutlined,
  FileExcelOutlined,
  LockOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useHRPayroll } from '@/hooks/api/useHR';
import type { PayrollEmployeeDto } from '@/types/hr.types';

const { Title, Text } = Typography;

const MONTHS = [
  { value: 1, label: 'يناير' },
  { value: 2, label: 'فبراير' },
  { value: 3, label: 'مارس' },
  { value: 4, label: 'أبريل' },
  { value: 5, label: 'مايو' },
  { value: 6, label: 'يونيو' },
  { value: 7, label: 'يوليو' },
  { value: 8, label: 'أغسطس' },
  { value: 9, label: 'سبتمبر' },
  { value: 10, label: 'أكتوبر' },
  { value: 11, label: 'نوفمبر' },
  { value: 12, label: 'ديسمبر' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => ({
  value: currentYear - i,
  label: String(currentYear - i),
}));

export default function HRPayrollPage() {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [genForm] = Form.useForm();

  const {
    payroll,
    isLoading,
    isError,
    generatePayroll,
    closePayroll,
    exportPayroll,
    isGenerating,
    isClosing,
    isExporting,
  } = useHRPayroll(selectedMonth, selectedYear);

  const employees: PayrollEmployeeDto[] = payroll?.employees ?? [];

  const totalNetSalary = employees.reduce((s, e) => s + (e.netSalary ?? 0), 0);
  const totalOvertime = employees.reduce((s, e) => s + (e.overtimeAmount ?? 0), 0);
  const totalDeductions =
    employees.reduce(
      (s, e) =>
        s +
        (e.lateDeduction ?? 0) +
        (e.absenceDeduction ?? 0) +
        (e.leaveDeduction ?? 0) +
        (e.additionalDeduction ?? 0),
      0
    );

  const handleGenerate = async () => {
    const values = await genForm.validateFields();
    await generatePayroll({ month: values.month, year: values.year });
    setSelectedMonth(values.month);
    setSelectedYear(values.year);
    setGenerateModalOpen(false);
    genForm.resetFields();
  };

  const columns: ColumnsType<PayrollEmployeeDto> = [
    {
      title: 'الموظف',
      dataIndex: 'employeeName',
      render: (v) => v || '—',
      fixed: 'right',
      width: 160,
    },
    {
      title: 'الراتب الأساسي',
      dataIndex: 'baseSalary',
      render: (v) => formatSAR(v),
      align: 'center',
    },
    {
      title: 'الإضافي',
      dataIndex: 'overtimeAmount',
      render: (v) =>
        v && v > 0 ? (
          <Text style={{ color: '#52c41a' }}>+{formatSAR(v)}</Text>
        ) : (
          '—'
        ),
      align: 'center',
    },
    {
      title: 'خصم التأخير',
      dataIndex: 'lateDeduction',
      render: (v) =>
        v && v > 0 ? <Text type="danger">-{formatSAR(v)}</Text> : '—',
      align: 'center',
    },
    {
      title: 'خصم الغياب',
      dataIndex: 'absenceDeduction',
      render: (v) =>
        v && v > 0 ? <Text type="danger">-{formatSAR(v)}</Text> : '—',
      align: 'center',
    },
    {
      title: 'خصم الإجازة',
      dataIndex: 'leaveDeduction',
      render: (v) =>
        v && v > 0 ? <Text type="danger">-{formatSAR(v)}</Text> : '—',
      align: 'center',
    },
    {
      title: 'مكافأة',
      dataIndex: 'bonus',
      render: (v) =>
        v && v > 0 ? (
          <Text style={{ color: '#52c41a' }}>+{formatSAR(v)}</Text>
        ) : (
          '—'
        ),
      align: 'center',
    },
    {
      title: 'خصومات إضافية',
      dataIndex: 'additionalDeduction',
      render: (v) =>
        v && v > 0 ? <Text type="danger">-{formatSAR(v)}</Text> : '—',
      align: 'center',
    },
    {
      title: 'صافي الراتب',
      dataIndex: 'netSalary',
      render: (v) => (
        <Text strong style={{ color: '#1677ff' }}>
          {formatSAR(v)}
        </Text>
      ),
      align: 'center',
      fixed: 'left',
      width: 130,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Space>
          <DollarOutlined style={{ fontSize: 22, color: '#1677ff' }} />
          <Title level={4} style={{ margin: 0 }}>الرواتب الشهرية</Title>
        </Space>
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={() => setGenerateModalOpen(true)}
          size="large"
        >
          إنشاء كشف رواتب
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space size={16}>
          <Space>
            <Text strong>الشهر:</Text>
            <Select
              value={selectedMonth}
              onChange={setSelectedMonth}
              options={MONTHS}
              style={{ width: 120 }}
            />
          </Space>
          <Space>
            <Text strong>السنة:</Text>
            <Select
              value={selectedYear}
              onChange={setSelectedYear}
              options={YEARS}
              style={{ width: 100 }}
            />
          </Space>
          {payroll && (
            <Space>
              <Tag color={payroll.isClosed ? 'error' : 'success'}>
                {payroll.isClosed ? 'مغلق' : 'مفتوح'}
              </Tag>
              {!payroll.isClosed && (
                <Tooltip title="إغلاق كشف الرواتب — لا يمكن التراجع">
                  <Popconfirm
                    title="إغلاق كشف الرواتب"
                    description="بعد الإغلاق لا يمكن إعادة فتح الكشف. هل تريد المتابعة؟"
                    onConfirm={() => closePayroll(payroll.id)}
                    okText="إغلاق"
                    cancelText="إلغاء"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      icon={<LockOutlined />}
                      loading={isClosing}
                      danger
                    >
                      إغلاق الكشف
                    </Button>
                  </Popconfirm>
                </Tooltip>
              )}
              <Button
                icon={<FileExcelOutlined />}
                loading={isExporting}
                style={{ color: '#52c41a', borderColor: '#52c41a' }}
                onClick={() => exportPayroll({ m: selectedMonth, y: selectedYear })}
              >
                تصدير Excel
              </Button>
            </Space>
          )}
        </Space>
      </Card>

      {payroll && employees.length > 0 && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={8}>
            <Card size="small">
              <Statistic
                title="إجمالي صافي الرواتب"
                value={formatSAR(totalNetSalary)}
                valueStyle={{ color: '#1677ff', fontSize: 16 }}
              />
            </Card>
          </Col>
          <Col xs={8}>
            <Card size="small">
              <Statistic
                title="إجمالي الإضافي"
                value={formatSAR(totalOvertime)}
                valueStyle={{ color: '#52c41a', fontSize: 16 }}
              />
            </Card>
          </Col>
          <Col xs={8}>
            <Card size="small">
              <Statistic
                title="إجمالي الخصومات"
                value={formatSAR(totalDeductions)}
                valueStyle={{ color: '#ff4d4f', fontSize: 16 }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        {isError ? (
          <Alert
            type="info"
            message="لا يوجد كشف رواتب"
            description={`لم يتم إنشاء كشف رواتب لشهر ${MONTHS.find((m) => m.value === selectedMonth)?.label} ${selectedYear} بعد. استخدم زر "إنشاء كشف رواتب" لإنشائه.`}
            showIcon
          />
        ) : (
          <Table<PayrollEmployeeDto>
            dataSource={employees}
            columns={columns}
            rowKey={(r) => r.employeeId ?? r.employeeName ?? Math.random().toString()}
            loading={isLoading}
            pagination={{ pageSize: 20, showSizeChanger: false }}
            locale={{ emptyText: <Empty description="اختر شهراً وسنة لعرض كشف الرواتب" /> }}
            scroll={{ x: 1200 }}
            summary={() =>
              employees.length > 0 ? (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0}>
                    <Text strong>الإجمالي</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="center">
                    <Text strong>
                      {formatSAR(employees.reduce((s, e) => s + (e.baseSalary ?? 0), 0))}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="center">
                    <Text strong style={{ color: '#52c41a' }}>
                      {formatSAR(totalOvertime)}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} />
                  <Table.Summary.Cell index={4} />
                  <Table.Summary.Cell index={5} />
                  <Table.Summary.Cell index={6} />
                  <Table.Summary.Cell index={7} />
                  <Table.Summary.Cell index={8} align="center">
                    <Text strong style={{ color: '#1677ff' }}>
                      {formatSAR(totalNetSalary)}
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              ) : null
            }
          />
        )}
      </Card>

      <Modal
        open={generateModalOpen}
        title="إنشاء كشف رواتب جديد"
        onCancel={() => {
          setGenerateModalOpen(false);
          genForm.resetFields();
        }}
        onOk={handleGenerate}
        confirmLoading={isGenerating}
        okText="إنشاء"
        cancelText="إلغاء"
        width={400}
        destroyOnClose
      >
        <Alert
          type="info"
          message="سيتم احتساب الرواتب لجميع الموظفين النشطين بناءً على سجلات الحضور والإجازات المعتمدة."
          style={{ marginBottom: 16 }}
        />
        <Form form={genForm} layout="vertical">
          <Form.Item
            name="month"
            label="الشهر"
            rules={[{ required: true, message: 'يرجى اختيار الشهر' }]}
          >
            <Select options={MONTHS} placeholder="اختر الشهر" />
          </Form.Item>
          <Form.Item
            name="year"
            label="السنة"
            rules={[{ required: true, message: 'يرجى اختيار السنة' }]}
          >
            <Select options={YEARS} placeholder="اختر السنة" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function formatSAR(value?: number | null): string {
  if (value == null) return '—';
  return `${value.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س`;
}
