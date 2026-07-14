'use client';

/**
 * Presentational employee detail body — extracted from the former "تفاصيل
 * الموظف" modal in page.tsx so it has exactly one implementation, shared by
 * the `[id]` route page (Phase 3, mirroring Phase 1/2's contracts/vouchers).
 * Takes already-fetched data — no fetching here.
 *
 * This module (like the rest of the HR employees page) is Arabic-only, no
 * `language`/`isAr` toggle — matching the existing page's convention rather
 * than introducing bilingual text where none existed before.
 */
import React from 'react';
import { Col, Descriptions, Divider, Row, Space, Spin, Tag } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { EmployeeCurrentDto, EmployeeLeaveBalanceDto } from '@/types/hr.types';

export interface EmployeeDetailViewProps {
  employee: EmployeeCurrentDto;
  leaveBalances?: EmployeeLeaveBalanceDto[];
  isBalancesLoading?: boolean;
}

export default function EmployeeDetailView({
  employee,
  leaveBalances,
  isBalancesLoading,
}: EmployeeDetailViewProps) {
  return (
    <>
      <Descriptions title="البيانات الشخصية" bordered column={2} size="small" style={{ marginBottom: 24 }}>
        <Descriptions.Item label="الاسم بالعربية">{employee.nameAr || '—'}</Descriptions.Item>
        <Descriptions.Item label="الاسم بالإنجليزية">{employee.nameEn || '—'}</Descriptions.Item>
        <Descriptions.Item label="رقم الموظف">{employee.employeeNumber || '—'}</Descriptions.Item>
        <Descriptions.Item label="البريد الإلكتروني">{employee.email || '—'}</Descriptions.Item>
        <Descriptions.Item label="اسم المستخدم">{employee.userName || '—'}</Descriptions.Item>
        <Descriptions.Item label="رقم الهوية">{employee.idNumber || '—'}</Descriptions.Item>
        <Descriptions.Item label="رقم الجوال">{employee.mobileNumber || '—'}</Descriptions.Item>
        <Descriptions.Item label="تاريخ التعيين">
          {employee.hiringDate ? dayjs(employee.hiringDate).format('YYYY-MM-DD') : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="الحالة" span={2}>
          {employee.isActive ? <Tag color="success">نشط</Tag> : <Tag color="default">معطّل</Tag>}
        </Descriptions.Item>
      </Descriptions>

      <Descriptions title="بيانات العمل" bordered column={2} size="small" style={{ marginBottom: 24 }}>
        <Descriptions.Item label="المسمى الوظيفي">
          {employee.jobNameAr || employee.jobNameEn || '—'}
        </Descriptions.Item>
        <Descriptions.Item label="القسم">
          {employee.departmentNameAr || employee.departmentNameEn || '—'}
        </Descriptions.Item>
        <Descriptions.Item label="الجنسية" span={2}>
          {employee.nationalityNameAr || employee.nationalityNameEn || '—'}
        </Descriptions.Item>
      </Descriptions>

      <Descriptions title="الراتب والبدلات" bordered column={2} size="small" style={{ marginBottom: 24 }}>
        <Descriptions.Item label="الراتب الأساسي">
          {employee.basicSalary != null ? employee.basicSalary.toLocaleString() : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="بدل السكن">
          {employee.housingAllowance != null ? employee.housingAllowance.toLocaleString() : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="بدل المواصلات">
          {employee.mobilityAllowance != null ? employee.mobilityAllowance.toLocaleString() : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="بدلات أخرى">
          {employee.otherAllowances != null ? employee.otherAllowances.toLocaleString() : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="إجمالي الراتب" span={2}>
          {employee.totalSalary != null ? employee.totalSalary.toLocaleString() : '—'}
        </Descriptions.Item>
      </Descriptions>

      <Descriptions title="البيانات البنكية" bordered column={2} size="small">
        <Descriptions.Item label="اسم البنك">{employee.bankName || '—'}</Descriptions.Item>
        <Descriptions.Item label="رقم الحساب">{employee.bankAccountNumber || '—'}</Descriptions.Item>
        <Descriptions.Item label="رقم الآيبان" span={2}>{employee.iban || '—'}</Descriptions.Item>
      </Descriptions>

      <Divider>
        <Space size={6}>
          <CalendarOutlined style={{ color: '#1677ff' }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>رصيد الإجازات</span>
        </Space>
      </Divider>
      {isBalancesLoading ? (
        <div style={{ textAlign: 'center', padding: '16px 0' }}><Spin /></div>
      ) : !leaveBalances || leaveBalances.length === 0 ? (
        <div style={{ color: '#999', fontSize: 13, textAlign: 'center', padding: '8px 0' }}>
          لا يوجد رصيد إجازات متاح
        </div>
      ) : (
        <Row gutter={[12, 12]}>
          {leaveBalances.map((bal, idx) => (
            <Col key={bal.leaveTypeId ?? idx} xs={24} sm={12}>
              <LeaveBalanceTile balance={bal} />
            </Col>
          ))}
        </Row>
      )}
    </>
  );
}

function LeaveBalanceTile({ balance }: { balance: EmployeeLeaveBalanceDto }) {
  const total = balance.totalBalance ?? 0;
  const used = balance.usedBalance ?? 0;
  const remaining = balance.remainingBalance ?? (total - used);
  const pct = total > 0 ? Math.round((remaining / total) * 100) : 0;
  const color = pct > 50 ? '#00aa64' : pct > 20 ? '#d97706' : '#dc2626';

  return (
    <div style={{
      border: `1.5px solid ${color}30`,
      borderRadius: 12,
      padding: '14px 16px',
      background: '#fafafa',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <CalendarOutlined style={{ color, fontSize: 16 }} />
        <span style={{ fontWeight: 600, fontSize: 13 }}>
          {balance.leaveTypeName ?? 'إجازة'}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#003366', lineHeight: 1 }}>{total}</div>
          <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>الإجمالي</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#dc2626', lineHeight: 1 }}>{used}</div>
          <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>المستخدم</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}>{remaining}</div>
          <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>المتبقي</div>
        </div>
      </div>
      <div style={{ background: '#e8e8e8', borderRadius: 100, height: 5, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 100 }} />
      </div>
    </div>
  );
}
