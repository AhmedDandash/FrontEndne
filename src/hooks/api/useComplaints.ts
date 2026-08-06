import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { ComplaintService } from '@/services/complaint.service';
import type {
  Complaint,
  CreateComplaintDto,
  CreateComplaintUpdateDto,
  AddIssueDto,
  ComplaintIssue,
} from '@/types/api.types';

const QUERY_KEY = 'complaints';

const upsertComplaint = (
  complaints: Complaint[] | undefined,
  createdComplaint: Complaint
): Complaint[] => {
  const current = Array.isArray(complaints) ? complaints : [];
  const withoutDuplicate = current.filter(
    (complaint) => String(complaint.id ?? '') !== String(createdComplaint.id ?? '')
  );

  return [createdComplaint, ...withoutDuplicate];
};

const updateCachedComplaint = (
  queryClient: ReturnType<typeof useQueryClient>,
  id: number | string,
  updater: (complaint: Complaint) => Complaint
) => {
  queryClient.setQueriesData<Complaint[]>({ queryKey: [QUERY_KEY] }, (current) => {
    if (!Array.isArray(current)) return current;

    return current.map((complaint) =>
      String(complaint.id ?? '') === String(id) ? updater(complaint) : complaint
    );
  });
};

export const useComplaints = (params?: {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  branchId?: string;
  includeSubBranches?: boolean;
  status?: number;
  createdDateFrom?: string;
  createdDateTo?: string;
  updatedDateFrom?: string;
  updatedDateTo?: string;
  sortBy?: string;
  sortDescending?: boolean;
}) => {
  return useQuery<{ complaints: Complaint[]; total: number }, Error>({
    queryKey: [QUERY_KEY, 'list', params],
    queryFn: () => ComplaintService.getAll(params),
    placeholderData: (previous) => previous,
  });
};

export const useComplaint = (id: number | string) => {
  return useQuery<Complaint, Error>({
    queryKey: [QUERY_KEY, id],
    queryFn: () => ComplaintService.getById(id),
    enabled: !!id,
  });
};

export const useCreateComplaint = () => {
  const queryClient = useQueryClient();

  return useMutation<Complaint, Error, CreateComplaintDto>({
    mutationFn: ComplaintService.create,
    onSuccess: (createdComplaint) => {
      if (createdComplaint?.id != null) {
        queryClient.setQueryData<Complaint[]>(
          [QUERY_KEY, undefined],
          (current) => upsertComplaint(current, createdComplaint)
        );
      }

      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تمت إضافة الشكوى بنجاح / Complaint created successfully');
    },
    onError: (error: any) => {
      message.error(
        error?.response?.data?.message || 'فشل إضافة الشكوى / Failed to create complaint'
      );
    },
  });
};

export const useDeleteComplaint = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number | string>({
    mutationFn: ComplaintService.delete,
    onSuccess: (_data, id) => {
      queryClient.setQueriesData<Complaint[]>({ queryKey: [QUERY_KEY] }, (current) => {
        if (!Array.isArray(current)) return current;
        return current.filter((complaint) => String(complaint.id ?? '') !== String(id));
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تم حذف الشكوى بنجاح / Complaint deleted successfully');
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'فشل حذف الشكوى / Failed to delete complaint');
    },
  });
};

export const useFinishComplaint = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number | string>({
    mutationFn: ComplaintService.finish,
    onSuccess: (_data, id) => {
      updateCachedComplaint(queryClient, id, (complaint) => ({
        ...complaint,
        status: 3,
        statusName: 'Finished',
        isFinish: true,
        ishold: false,
      }));
      message.success('تم إنهاء الشكوى بنجاح / Complaint finished successfully');
    },
    onError: (error: any) => {
      message.error(
        error?.response?.data?.message || 'فشل إنهاء الشكوى / Failed to finish complaint'
      );
    },
  });
};

export const useToggleHoldComplaint = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: number | string; reason: string }>({
    mutationFn: ({ id, reason }) => ComplaintService.toggleHold(id, reason),
    onSuccess: (_data, { id, reason }) => {
      updateCachedComplaint(queryClient, id, (complaint) => {
        const isCurrentlyOnHold = Number(complaint.status) === 2 || complaint.ishold === true;

        return {
          ...complaint,
          status: isCurrentlyOnHold ? 1 : 2,
          statusName: isCurrentlyOnHold ? 'Open' : 'Hold',
          isFinish: false,
          ishold: !isCurrentlyOnHold,
          holdReason: isCurrentlyOnHold ? null : reason,
        };
      });
      message.success('تم تحديث حالة الشكوى بنجاح / Complaint hold status updated');
    },
    onError: (error: any) => {
      message.error(
        error?.response?.data?.message || 'فشل تعليق الشكوى / Failed to update hold status'
      );
    },
  });
};

export const useAddComplaintUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, CreateComplaintUpdateDto>({
    mutationFn: ComplaintService.addUpdate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تمت إضافة التحديث بنجاح / Update added successfully');
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'فشل إضافة التحديث / Failed to add update');
    },
  });
};

export const useAddIssue = () => {
  const queryClient = useQueryClient();

  return useMutation<ComplaintIssue, Error, AddIssueDto>({
    mutationFn: ComplaintService.addIssue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['complaint-issues'] });
      message.success('تمت إضافة القضية بنجاح / Issue added successfully');
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'فشل إضافة القضية / Failed to add issue');
    },
  });
};

export const useComplaintIssues = (complaintId: number | string) => {
  return useQuery<ComplaintIssue[], Error>({
    queryKey: ['complaint-issues', complaintId],
    queryFn: () => ComplaintService.getIssueById(complaintId),
    enabled: !!complaintId,
  });
};
