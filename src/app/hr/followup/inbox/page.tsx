'use client';

import React, { useState } from 'react';
import { Table, Tag, Button, Tooltip, Space } from 'antd';
import {
  InboxOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import HRPageHeader from '@/features/hr/components/HRPageHeader';
import RejectionReasonModal from '@/features/hr/components/RejectionReasonModal';
import RequestStatusBadge from '@/features/hr/components/RequestStatusBadge';
import RequestsFilterPanel from '@/features/hr/components/RequestsFilterPanel';
import type { ColumnsType } from 'antd/es/table';
import { useAuthStore } from '@/store/authStore';
import {
  useHRInbox,
  useApproveVacationRequest,
  useRejectVacationRequest,
  useApprovePermissionRequest,
  useRejectPermissionRequest,
  useApproveCustodyRequest,
  useRejectCustodyRequest,
  useApproveJobModificationRequest,
  useRejectJobModificationRequest,
  useApproveResignationRequest,
  useRejectResignationRequest,
  useApproveEntitlementsRequest,
  useRejectEntitlementsRequest,
  useApproveLoanRequest,
  useRejectLoanRequest,
} from '@/hooks/api/useHR';
import { HR_PROCESS_STATE } from '@/constants/hr.enums';
import { getEnumLabel } from '@/constants/enums';
import type { HRRequestSummary, HRRequestsFilterDto, RejectRequestDto } from '@/types/hr.types';

// processState values from HR_PROCESS_STATE enum
const STATE = { Vacation: 1, Permission: 2, Commission: 3, Custody: 4, JobMod: 5, Resignation: 6, Entitlements: 7, Loans: 8 } as const;

export default function RequestsInboxPage() {
  const language = useAuthStore((s) => s.language);
  const isAr = language === 'ar';

  const [filter, setFilter] = useState<HRRequestsFilterDto>({});
  const [rejectTarget, setRejectTarget] = useState<HRRequestSummary | null>(null);

  const { data: requests = [], isLoading } = useHRInbox(filter);

  // Approve mutations — one per request type
  const { mutate: approveVacation, isPending: approvingVacation } = useApproveVacationRequest();
  const { mutate: approvePermission, isPending: approvingPermission } = useApprovePermissionRequest();
  const { mutate: approveCustody, isPending: approvingCustody } = useApproveCustodyRequest();
  const { mutate: approveJobMod, isPending: approvingJobMod } = useApproveJobModificationRequest();
  const { mutate: approveResignation, isPending: approvingResignation } = useApproveResignationRequest();
  const { mutate: approveEntitlements, isPending: approvingEntitlements } = useApproveEntitlementsRequest();
  const { mutate: approveLoan, isPending: approvingLoan } = useApproveLoanRequest();

  // Reject mutations
  const { mutate: rejectVacation, isPending: rejectingVacation } = useRejectVacationRequest();
  const { mutate: rejectPermission, isPending: rejectingPermission } = useRejectPermissionRequest();
  const { mutate: rejectCustody, isPending: rejectingCustody } = useRejectCustodyRequest();
  const { mutate: rejectJobMod, isPending: rejectingJobMod } = useRejectJobModificationRequest();
  const { mutate: rejectResignation, isPending: rejectingResignation } = useRejectResignationRequest();
  const { mutate: rejectEntitlements, isPending: rejectingEntitlements } = useRejectEntitlementsRequest();
  const { mutate: rejectLoan, isPending: rejectingLoan } = useRejectLoanRequest();

  const isApproving = approvingVacation || approvingPermission || approvingCustody ||
    approvingJobMod || approvingResignation || approvingEntitlements || approvingLoan;
  const isRejecting = rejectingVacation || rejectingPermission || rejectingCustody ||
    rejectingJobMod || rejectingResignation || rejectingEntitlements || rejectingLoan;

  const handleApprove = (record: HRRequestSummary) => {
    const id = record.id;
    switch (record.processState) {
      case STATE.Vacation: approveVacation(id); break;
      case STATE.Permission: approvePermission(id); break;
      case STATE.Custody: approveCustody(id); break;
      case STATE.JobMod: approveJobMod(id); break;
      case STATE.Resignation: approveResignation(id); break;
      case STATE.Entitlements: approveEntitlements(id); break;
      case STATE.Loans: approveLoan(id); break;
    }
  };

  const handleRejectConfirm = (reason: string) => {
    if (!rejectTarget) return;
    const id = rejectTarget.id;
    const data: RejectRequestDto = { reason: reason || null };
    switch (rejectTarget.processState) {
      case STATE.Vacation: rejectVacation({ id, data }); break;
      case STATE.Permission: rejectPermission({ id, data }); break;
      case STATE.Custody: rejectCustody({ id, data }); break;
      case STATE.JobMod: rejectJobMod({ id, data }); break;
      case STATE.Resignation: rejectResignation({ id, data }); break;
      case STATE.Entitlements: rejectEntitlements({ id, data }); break;
      case STATE.Loans: rejectLoan({ id, data }); break;
    }
    setRejectTarget(null);
  };

  const columns: ColumnsType<HRRequestSummary> = [
    {
      title: isAr ? 'نوع الطلب' : 'Request Type',
      dataIndex: 'processState',
      render: (v) => <Tag color="blue">{getEnumLabel(HR_PROCESS_STATE, v, language)}</Tag>,
      width: 130,
    },
    {
      title: isAr ? 'اسم الموظف' : 'Employee',
      dataIndex: 'employeeName',
    },
    {
      title: isAr ? 'رقم الموظف' : 'Emp. No.',
      dataIndex: 'employeeNumber',
      width: 110,
    },
    {
      title: isAr ? 'القسم' : 'Department',
      dataIndex: 'departmentName',
    },
    {
      title: isAr ? 'الحالة' : 'Status',
      dataIndex: 'result',
      render: (v) => <RequestStatusBadge result={v} />,
      width: 100,
    },
    {
      title: isAr ? 'المحال إليه' : 'Assignee',
      dataIndex: 'assigneeEmpName',
      render: (v) => v || '—',
    },
    {
      title: isAr ? 'تاريخ الإنشاء' : 'Created At',
      dataIndex: 'createdAt',
      render: (v) => new Date(v).toLocaleDateString(isAr ? 'ar-SA' : 'en-US'),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      width: 120,
    },
    {
      title: isAr ? 'الإجراء' : 'Action',
      key: 'actions',
      width: 130,
      render: (_, record) => {
        // Only show approve/reject for pending requests (result = 3 or 0)
        const isPending = record.result === 3 || record.result === 0;
        if (!isPending) return null;
        return (
          <Space size={4}>
            <Tooltip title={isAr ? 'موافقة' : 'Approve'}>
              <Button
                type="text"
                icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                size="small"
                loading={isApproving}
                onClick={() => handleApprove(record)}
              />
            </Tooltip>
            <Tooltip title={isAr ? 'رفض' : 'Reject'}>
              <Button
                type="text"
                icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                size="small"
                loading={isRejecting}
                onClick={() => setRejectTarget(record)}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <HRPageHeader
        title={isAr ? 'صندوق الوارد – الطلبات' : 'Requests Inbox'}
        icon={<InboxOutlined />}
      />

      <RequestsFilterPanel onFilter={setFilter} loading={isLoading} />

      <Table
        columns={columns}
        dataSource={requests}
        rowKey="id"
        loading={isLoading}
        size="small"
        pagination={{ pageSize: 15, showTotal: (total) => `${total} ${isAr ? 'طلب' : 'requests'}` }}
        scroll={{ x: 900 }}
      />

      <RejectionReasonModal
        open={!!rejectTarget}
        loading={isRejecting}
        onConfirm={handleRejectConfirm}
        onCancel={() => setRejectTarget(null)}
      />
    </div>
  );
}
