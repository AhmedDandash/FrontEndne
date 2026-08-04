'use client';

import { useState } from 'react';
import { Card, DatePicker, Input, Select, Button, Table, Spin, Empty, Progress } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { type Dayjs } from 'dayjs';
import { BarChartOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  useHourlyOrdersSummary,
  useHourlyRevenueReport,
  useHourlyWorkerUtilization,
  useHourlyDriverPerformance,
} from '@/hooks/api/useHourlyReports';
import { AdvancedFilterPanel, BranchFilterSelect } from '@/components/filters';
import { useAuthStore } from '@/store/authStore';
import { fmtMoney } from '../_lib/hourlyDisplay';
import {
  HOURLY_REQUEST_STATUSES,
  type HourlyWorkerUtilizationReport,
  type HourlyDriverPerformanceReport,
  type HourlyReportFilterParams,
} from '@/types/hourly-worker.types';
import styles from '../hourly-workers.module.css';

const { RangePicker } = DatePicker;

export default function HourlyReportsPage() {
  const language = useAuthStore((s) => s.language);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [serviceCity, setServiceCity] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [status, setStatus] = useState<number | undefined>();
  const [branchId, setBranchId] = useState<string | undefined>();
  const [includeSubBranches, setIncludeSubBranches] = useState(true);
  const [filters, setFilters] = useState<HourlyReportFilterParams>({});

  const applyFilters = () => {
    setFilters({
      dateFrom: range?.[0]?.format('YYYY-MM-DD'),
      dateTo: range?.[1]?.format('YYYY-MM-DD'),
      serviceCity: serviceCity || undefined,
      ticketNumber: ticketNumber || undefined,
      customerPhone: customerPhone || undefined,
      status,
      branchId,
      includeSubBranches: branchId ? includeSubBranches : undefined,
    });
  };

  // Pull-to-apply, kept intentionally (fans out to 4 separate aggregate
  // endpoints per filter change). activeCount reflects the *applied* filters
  // object, not the draft controls, per convention.
  const activeFilterCount = [
    filters.dateFrom,
    filters.serviceCity,
    filters.ticketNumber,
    filters.customerPhone,
    filters.status,
    filters.branchId,
  ].filter((v) => v !== undefined && v !== null && v !== '').length;

  const clearFilters = () => {
    setRange(null);
    setServiceCity('');
    setTicketNumber('');
    setCustomerPhone('');
    setStatus(undefined);
    setBranchId(undefined);
    setIncludeSubBranches(true);
    setFilters({});
  };

  const summary = useHourlyOrdersSummary(filters);
  const revenue = useHourlyRevenueReport(filters);
  const utilization = useHourlyWorkerUtilization(filters);
  const driverPerf = useHourlyDriverPerformance(filters);

  const refetchAll = () => {
    summary.refetch();
    revenue.refetch();
    utilization.refetch();
    driverPerf.refetch();
  };

  const s = summary.data;
  const r = revenue.data;

  const summaryCards: { label: string; value: string | number }[] = s
    ? [
        { label: t('إجمالي الطلبات', 'Total Orders'), value: s.totalOrders },
        { label: t('قيد الانتظار', 'Pending'), value: s.pendingOrders },
        { label: t('تمت الموافقة', 'Approved'), value: s.approvedOrders },
        { label: t('تم التعيين', 'Assigned'), value: s.assignedOrders },
        { label: t('قيد التنفيذ', 'In Progress'), value: s.inProgressOrders },
        { label: t('مكتمل', 'Completed'), value: s.completedOrders },
        { label: t('ملغي', 'Cancelled'), value: s.cancelledOrders },
        { label: t('مرفوض', 'Rejected'), value: s.rejectedOrders },
        { label: t('إجمالي الإيرادات', 'Total Revenue'), value: fmtMoney(s.totalRevenue) },
        { label: t('الإيرادات المدفوعة', 'Paid Revenue'), value: fmtMoney(s.paidRevenue) },
      ]
    : [];

  const revenueCards: { label: string; value: string | number }[] = r
    ? [
        { label: t('إجمالي المحصّل', 'Total Collected'), value: fmtMoney(r.totalCollected) },
        { label: t('إجمالي المسترد', 'Total Refunded'), value: fmtMoney(r.totalRefunded) },
        { label: t('صافي الإيرادات', 'Net Revenue'), value: fmtMoney(r.netRevenue) },
        { label: t('مدفوعات مكتملة', 'Completed Payments'), value: r.completedPayments },
        { label: t('مدفوعات معلقة', 'Pending Payments'), value: r.pendingPayments },
        { label: t('مدفوعات فاشلة', 'Failed Payments'), value: r.failedPayments },
      ]
    : [];

  const utilCols: ColumnsType<HourlyWorkerUtilizationReport> = [
    { title: t('العامل', 'Worker'), dataIndex: 'workerName', key: 'name', render: (v) => v || '—' },
    { title: t('إجمالي التعيينات', 'Total'), dataIndex: 'totalAssignments', key: 'total', width: 130, align: 'center' },
    { title: t('مكتملة', 'Completed'), dataIndex: 'completedAssignments', key: 'completed', width: 110, align: 'center' },
    { title: t('نشطة', 'Active'), dataIndex: 'activeAssignments', key: 'active', width: 100, align: 'center' },
    { title: t('معدل الاستخدام', 'Utilization'), dataIndex: 'utilizationRate', key: 'rate', width: 180,
      render: (v: number) => <Progress percent={Math.round(v)} size="small" /> },
  ];

  const driverCols: ColumnsType<HourlyDriverPerformanceReport> = [
    { title: t('السائق', 'Driver'), dataIndex: 'driverName', key: 'name', render: (v) => v || '—' },
    { title: t('إجمالي الرحلات', 'Total Trips'), dataIndex: 'totalTrips', key: 'total', width: 130, align: 'center' },
    { title: t('مكتملة', 'Completed'), dataIndex: 'completedTrips', key: 'completed', width: 110, align: 'center' },
    { title: t('ملغاة', 'Cancelled'), dataIndex: 'cancelledTrips', key: 'cancelled', width: 110, align: 'center' },
    { title: t('معدل الإنجاز', 'Completion'), dataIndex: 'completionRate', key: 'rate', width: 180,
      render: (v: number) => <Progress percent={Math.round(v)} size="small" /> },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <BarChartOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('التقارير', 'Reports')}</h1>
              <p className={styles.pageSubtitle}>{t('مؤشرات أداء العمل بالساعة', 'Hourly worker performance metrics')}</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button icon={<ReloadOutlined />} onClick={refetchAll} className={styles.refreshBtn}>{t('تحديث', 'Refresh')}</Button>
          </div>
        </div>
      </div>

      <AdvancedFilterPanel
        activeCount={activeFilterCount}
        onClear={clearFilters}
        actions={
          <Button type="primary" size="large" onClick={applyFilters}>{t('تطبيق', 'Apply')}</Button>
        }
        quickFilters={
          <>
            <div>
              <label className={styles.filterLabel}>{t('التاريخ', 'Date')}</label>
              <RangePicker size="large" className={styles.filterDate} value={range} onChange={(d) => setRange(d as [Dayjs | null, Dayjs | null] | null)} />
            </div>
            <div>
              <label className={styles.filterLabel}>{t('المدينة', 'City')}</label>
              <Input allowClear size="large" placeholder={t('المدينة', 'City')} className={styles.filterSelect}
                value={serviceCity} onChange={(e) => setServiceCity(e.target.value)} />
            </div>
            <div>
              <label className={styles.filterLabel}>{t('رقم التذكرة', 'Ticket number')}</label>
              <Input allowClear size="large" placeholder={t('رقم التذكرة', 'Ticket number')} className={styles.filterSelect}
                value={ticketNumber} onChange={(e) => setTicketNumber(e.target.value)} />
            </div>
            <div>
              <label className={styles.filterLabel}>{t('هاتف العميل', 'Customer phone')}</label>
              <Input allowClear size="large" placeholder={t('هاتف العميل', 'Customer phone')} className={styles.filterSelect}
                value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            </div>
            <div>
              <label className={styles.filterLabel}>{t('الحالة', 'Status')}</label>
              <Select allowClear size="large" placeholder={t('الحالة', 'Status')} className={styles.filterSelect}
                value={status} onChange={setStatus}
                options={HOURLY_REQUEST_STATUSES.map((s) => ({ value: s.value, label: isAr ? s.ar : s.en }))} />
            </div>
            <BranchFilterSelect
              value={branchId}
              onChange={setBranchId}
              includeSubBranches={includeSubBranches}
              onIncludeSubBranchesChange={setIncludeSubBranches}
            />
          </>
        }
      />

      {/* Orders summary */}
      <Card className={styles.tableCard} title={t('ملخص الطلبات', 'Orders Summary')} style={{ marginBottom: 16 }}>
        {summary.isLoading ? <Spin /> : !s ? <Empty /> : (
          <div className={styles.reportGrid}>
            {summaryCards.map((c) => (
              <div key={c.label} className={styles.reportCard}>
                <div className={styles.reportLabel}>{c.label}</div>
                <div className={styles.reportValue}>{c.value}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Revenue */}
      <Card className={styles.tableCard} title={t('الإيرادات', 'Revenue')} style={{ marginBottom: 16 }}>
        {revenue.isLoading ? <Spin /> : !r ? <Empty /> : (
          <div className={styles.reportGrid}>
            {revenueCards.map((c) => (
              <div key={c.label} className={styles.reportCard}>
                <div className={styles.reportLabel}>{c.label}</div>
                <div className={styles.reportValue}>{c.value}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Worker utilization */}
      <Card className={styles.tableCard} title={t('استخدام العمال', 'Worker Utilization')} style={{ marginBottom: 16 }}>
        <Table<HourlyWorkerUtilizationReport> rowKey={(r2, i) => r2.workerId ?? String(i)} size="small" bordered
          loading={utilization.isLoading} columns={utilCols} dataSource={utilization.data ?? []} pagination={false} />
      </Card>

      {/* Driver performance */}
      <Card className={styles.tableCard} title={t('أداء السائقين', 'Driver Performance')}>
        <Table<HourlyDriverPerformanceReport> rowKey={(r2, i) => r2.driverId ?? String(i)} size="small" bordered
          loading={driverPerf.isLoading} columns={driverCols} dataSource={driverPerf.data ?? []} pagination={false} />
      </Card>
    </div>
  );
}
