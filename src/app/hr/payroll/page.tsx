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
  Switch,
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
  CheckCircleOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import type { ColumnsType } from 'antd/es/table';
import { AdvancedFilterPanel } from '@/components/filters';
import { useHRPayroll, useHRPayrollHistory } from '@/hooks/api/useHR';
import { useHrActionGates } from '@/hooks/useActionPermissionGates';
import { PayrollStatus, type PayrollEmployeeDto, type PayrollRunDto } from '@/types/hr.types';

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
  // Journal Entry "Go to source" (Salary/Advance sources) links here with
  // ?openId=<payrollRunId>. This page has no per-run detail view to auto-open —
  // it's a month/year-scoped generator/list — so the deep-link intentionally
  // lands on the list only; useOpenIdParam is deliberately not wired.
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [genForm] = Form.useForm();
  const hrGates = useHrActionGates();

  const {
    payroll,
    isLoading,
    isError,
    generatePayroll,
    approvePayroll,
    closePayroll,
    exportPayroll,
    isGenerating,
    isApproving,
    isClosing,
    isExporting,
  } = useHRPayroll(selectedMonth, selectedYear);
  const { data: payrollHistory = [], isLoading: isHistoryLoading } =
    useHRPayrollHistory(selectedYear);

  const employees: PayrollEmployeeDto[] = payroll?.employees ?? [];

  const totalNetSalary = employees.reduce((s, e) => s + (e.netSalary ?? 0), 0);
  const totalOvertime = employees.reduce((s, e) => s + (e.overtimeAmount ?? 0), 0);
  const totalPaid = employees.reduce((s, e) => s + (e.paidAmount ?? 0), 0);
  const totalRemaining = employees.reduce((s, e) => s + (e.remainingAmount ?? 0), 0);
  const totalDeductions =
    employees.reduce(
      (s, e) =>
        s +
        (e.lateDeduction ?? 0) +
        (e.absenceDeduction ?? 0) +
        (e.leaveDeduction ?? 0) +
        (e.additionalDeduction ?? 0) +
        (e.loanDeduction ?? 0),
      0
    );

  // Lifecycle: Draft (0) → Approved (1) → Closed (2). `isClosed` is the
  // authoritative closed flag; status drives whether Approve/Close show.
  const status = payroll?.status ?? PayrollStatus.Draft;
  const isClosed = payroll?.isClosed || status === PayrollStatus.Closed;
  const isApproved = status >= PayrollStatus.Approved;

  const handleGenerate = async () => {
    if (!hrGates.canCreate) return;
    try {
      const values = await genForm.validateFields();
      await generatePayroll({
        month: values.month,
        year: values.year,
        includeWorkers: values.includeWorkers ?? false,
      });
      setSelectedMonth(values.month);
      setSelectedYear(values.year);
      setGenerateModalOpen(false);
      genForm.resetFields();
    } catch {
      // Error toast is surfaced by the mutation's onError; keep the modal open
      // so the user can retry (generate can 500 when a branch has no employees).
    }
  };

  const handleExport = () => {
    exportPayroll({ m: selectedMonth, y: selectedYear }).catch(() => {});
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
      title: 'خصم القروض',
      dataIndex: 'loanDeduction',
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
    {
      title: 'المدفوع',
      dataIndex: 'paidAmount',
      render: (v) =>
        v && v > 0 ? (
          <Text style={{ color: '#52c41a' }}>{formatSAR(v)}</Text>
        ) : (
          '—'
        ),
      align: 'center',
    },
    {
      title: 'المتبقي',
      dataIndex: 'remainingAmount',
      render: (v) =>
        v && v > 0 ? <Text type="warning">{formatSAR(v)}</Text> : '—',
      align: 'center',
    },
  ];

  const historyColumns: ColumnsType<PayrollRunDto> = [
    {
      title: 'الشهر',
      dataIndex: 'month',
      width: 110,
      render: (v) => MONTHS.find((m) => m.value === v)?.label ?? v ?? '—',
    },
    {
      title: 'السنة',
      dataIndex: 'year',
      width: 90,
      render: (v) => v ?? '—',
    },
    {
      title: 'الحالة',
      dataIndex: 'status',
      width: 120,
      render: (v: number | null | undefined, r) => {
        const closed = r.isClosed || v === PayrollStatus.Closed;
        const approved = (v ?? PayrollStatus.Draft) >= PayrollStatus.Approved;
        return (
          <Tag color={closed ? 'error' : approved ? 'blue' : 'warning'}>
            {closed ? 'مغلق' : approved ? 'معتمد' : 'مسودة'}
          </Tag>
        );
      },
    },
    {
      title: 'صافي الرواتب',
      dataIndex: 'totalNetAmount',
      render: (v) => formatSAR(v),
    },
    {
      title: 'المدفوع',
      dataIndex: 'totalPaidAmount',
      render: (v) => formatSAR(v),
    },
    {
      title: 'الإجراءات',
      key: 'actions',
      width: 100,
      render: (_, r) => (
        <Button
          size="small"
          onClick={() => {
            if (r.month) setSelectedMonth(r.month);
            if (r.year) setSelectedYear(r.year);
          }}
        >
          عرض
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Space>
          <DollarOutlined style={{ fontSize: 22, color: '#1677ff' }} />
          <Title level={4} style={{ margin: 0 }}>الرواتب الشهرية</Title>
        </Space>
        {hrGates.canCreate && (
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => setGenerateModalOpen(true)}
            size="large"
          >
            إنشاء كشف رواتب
          </Button>
        )}
      </div>

      <AdvancedFilterPanel
        activeCount={0}
        onClear={() => {}}
        quickFilters={
          <>
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
          </>
        }
        actions={
          payroll && (
            <Space>
              <Tag color={isClosed ? 'error' : isApproved ? 'blue' : 'warning'}>
                {isClosed ? 'مغلق' : isApproved ? 'معتمد' : 'مسودة'}
              </Tag>

              {/* Accounting linkage — populated once the run is approved/posted.
                  Links to the journal entries screen; shows references on hover. */}
              {payroll.journalEntryId && (
                <Tooltip
                  title={
                    `تم ترحيل الكشف محاسبياً — قيد اليومية: ${payroll.journalEntryId}` +
                    (payroll.accountingDocumentId
                      ? ` — سند محاسبي: ${payroll.accountingDocumentId}`
                      : '')
                  }
                >
                  <Link href="/accounting/journal-entries">
                    <Tag color="green" icon={<AuditOutlined />} style={{ cursor: 'pointer' }}>
                      مُرحّل محاسبياً
                    </Tag>
                  </Link>
                </Tooltip>
              )}

              {/* Step 1 — Approve a draft run */}
              {hrGates.canApprove && !isApproved && !isClosed && (
                <Tooltip title="اعتماد كشف الرواتب قبل الإغلاق">
                  <Popconfirm
                    title="اعتماد كشف الرواتب"
                    description="سيتم اعتماد الكشف تمهيداً لإغلاقه وترحيله محاسبياً. هل تريد المتابعة؟"
                    onConfirm={() => hrGates.canApprove && approvePayroll(payroll.id).catch(() => {})}
                    okText="اعتماد"
                    cancelText="إلغاء"
                  >
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      loading={isApproving}
                    >
                      اعتماد الكشف
                    </Button>
                  </Popconfirm>
                </Tooltip>
              )}

              {/* Step 2 — Close an approved run */}
              {hrGates.canClose && isApproved && !isClosed && (
                <Tooltip title="إغلاق كشف الرواتب — لا يمكن التراجع">
                  <Popconfirm
                    title="إغلاق كشف الرواتب"
                    description="بعد الإغلاق لا يمكن إعادة فتح الكشف. هل تريد المتابعة؟"
                    onConfirm={() => hrGates.canClose && closePayroll(payroll.id).catch(() => {})}
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
                onClick={handleExport}
              >
                تصدير Excel
              </Button>
            </Space>
          )
        }
      />

      {payroll && employees.length > 0 && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={8}>
            <Card size="small">
              <Statistic
                title="إجمالي صافي الرواتب"
                value={formatSAR(totalNetSalary)}
                styles={{ content: { color: '#1677ff', fontSize: 16 } }}
              />
            </Card>
          </Col>
          <Col xs={8}>
            <Card size="small">
              <Statistic
                title="إجمالي الإضافي"
                value={formatSAR(totalOvertime)}
                styles={{ content: { color: '#52c41a', fontSize: 16 } }}
              />
            </Card>
          </Col>
          <Col xs={8}>
            <Card size="small">
              <Statistic
                title="إجمالي الخصومات"
                value={formatSAR(totalDeductions)}
                styles={{ content: { color: '#ff4d4f', fontSize: 16 } }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        {isError ? (
          <Alert
            type="info"
            title="لا يوجد كشف رواتب"
            description={`لم يتم إنشاء كشف رواتب لشهر ${MONTHS.find((m) => m.value === selectedMonth)?.label} ${selectedYear} بعد. استخدم زر "إنشاء كشف رواتب" لإنشائه.`}
            showIcon
          />
        ) : (
          <Table<PayrollEmployeeDto>
            dataSource={employees}
            columns={columns}
            rowKey={(r, index) => r.employeeId ?? r.employeeName ?? `row-${index}`}
            loading={isLoading}
            pagination={{ pageSize: 20, showSizeChanger: false }}
            locale={{ emptyText: <Empty description="اختر شهراً وسنة لعرض كشف الرواتب" /> }}
            scroll={{ x: 1500 }}
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
                  <Table.Summary.Cell index={8} />
                  <Table.Summary.Cell index={9} align="center">
                    <Text strong style={{ color: '#1677ff' }}>
                      {formatSAR(totalNetSalary)}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={10} align="center">
                    <Text strong style={{ color: '#52c41a' }}>
                      {formatSAR(totalPaid)}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={11} align="center">
                    <Text strong style={{ color: '#faad14' }}>
                      {formatSAR(totalRemaining)}
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              ) : null
            }
          />
        )}
      </Card>

      <Card title="سجل كشوف الرواتب" style={{ marginTop: 16 }}>
        <Table<PayrollRunDto>
          dataSource={payrollHistory}
          columns={historyColumns}
          rowKey="id"
          loading={isHistoryLoading}
          pagination={{ pageSize: 6, showSizeChanger: false }}
          locale={{ emptyText: 'لا توجد كشوف رواتب في هذه السنة' }}
          scroll={{ x: 760 }}
        />
      </Card>

      <Modal
        open={generateModalOpen && hrGates.canCreate}
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
        destroyOnHidden
      >
        <Alert
          type="info"
          title="سيتم احتساب الرواتب لجميع الموظفين النشطين بناءً على سجلات الحضور والإجازات المعتمدة."
          style={{ marginBottom: 16 }}
        />
        <Form form={genForm} layout="vertical" initialValues={{ includeWorkers: false }}>
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
          <Form.Item
            name="includeWorkers"
            label="تضمين العمال"
            valuePropName="checked"
          >
            <Switch checkedChildren="نعم" unCheckedChildren="لا" />
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
