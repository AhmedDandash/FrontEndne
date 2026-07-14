'use client';

/**
 * Employee detail route — Phase 3 of the modal→route migration (party/HR
 * entities), mirroring Phase 1's contract routes and Phase 2's accounting
 * documents. Renders the same body the list page's "تفاصيل الموظف" modal
 * used to show. Arabic-only, matching the rest of this HR module (no
 * language/isAr toggle exists on this page today).
 */
import React from 'react';
import { Tag } from 'antd';
import { useHREmployee, useEmployeeLeaveBalances } from '@/hooks/api/useHR';
import RecordDetailShell from '@/components/record-detail/RecordDetailShell';
import EmployeeDetailView from '../_components/EmployeeDetailView';

const LIST_ROUTE = '/hr/employees';

function isNotFoundError(error: unknown): boolean {
  return (error as { response?: { status?: number } } | undefined)?.response?.status === 404;
}

export default function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const { data: employee, isLoading, isError, error, refetch } = useHREmployee(id);

  const now = new Date();
  // Full-year balance (no `month`): with a `month` param the backend reports
  // usage for that calendar month only, which would wrongly show 0 used days
  // for a leave taken in another month — see the list page's equivalent call.
  const { data: leaveBalances, isLoading: isBalancesLoading } = useEmployeeLeaveBalances({
    employeeId: id,
    year: now.getFullYear(),
  });

  const notFound = isError && isNotFoundError(error);
  const genericError = isError && !notFound;

  const displayName = employee?.nameAr || employee?.nameEn || `#${id}`;

  return (
    <RecordDetailShell
      loading={isLoading}
      error={genericError ? error : undefined}
      notFound={notFound}
      onRetry={() => refetch()}
      breadcrumbs={[
        { label: 'إدارة الموظفين', href: LIST_ROUTE },
        { label: displayName },
      ]}
      backHref={LIST_ROUTE}
      title={displayName}
      status={
        employee ? (
          employee.isActive ? (
            <Tag color="success">نشط</Tag>
          ) : (
            <Tag color="default">معطّل</Tag>
          )
        ) : undefined
      }
    >
      {employee && (
        <EmployeeDetailView
          employee={employee}
          leaveBalances={leaveBalances}
          isBalancesLoading={isBalancesLoading}
        />
      )}
    </RecordDetailShell>
  );
}
