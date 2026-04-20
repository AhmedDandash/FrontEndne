/**
 * Complaint Hooks — migrated to new API contract.
 *
 * Breaking changes from old hooks:
 *  - useFinishComplaint: mutationFn now takes id only (no {id,note} object)
 *  - useHoldComplaint:   mutationFn now takes {id, reason} (reason required)
 *  - useUpdateComplaint: removed — use useAddComplaintUpdate instead
 *  - useAddIssue:        AddIssueDto now uses File objects (file1/file2)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ComplaintService } from '@/services/complaint.service';
import type {
  Complaint,
  CreateComplaintDto,
  CreateComplaintUpdateDto,
  AddIssueDto,
  ComplaintIssue,
} from '@/types/api.types';
import { message } from 'antd';

const QUERY_KEY = 'complaints';

/** Fetch all complaints */
export const useComplaints = (params?: { pageNumber?: number; pageSize?: number; search?: string }) => {
  return useQuery<Complaint[], Error>({
    queryKey: [QUERY_KEY, params],
    queryFn: () => ComplaintService.getAll(params),
  });
};

/** Fetch complaint by ID (response includes updates[]) */
export const useComplaint = (id: number | string) => {
  return useQuery<Complaint, Error>({
    queryKey: [QUERY_KEY, id],
    queryFn: () => ComplaintService.getById(id),
    enabled: !!id,
  });
};

/** Create new complaint */
export const useCreateComplaint = () => {
  const queryClient = useQueryClient();

  return useMutation<Complaint, Error, CreateComplaintDto>({
    mutationFn: ComplaintService.create,
    onSuccess: () => {
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

/** Delete complaint */
export const useDeleteComplaint = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number | string>({
    mutationFn: ComplaintService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تم حذف الشكوى بنجاح / Complaint deleted successfully');
    },
    onError: (error: any) => {
      message.error(
        error?.response?.data?.message || 'فشل حذف الشكوى / Failed to delete complaint'
      );
    },
  });
};

/**
 * Finish (close) a complaint.
 * New API: POST /api/Complaint/{id}/finish — no body, no finish note.
 */
export const useFinishComplaint = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number | string>({
    mutationFn: ComplaintService.finish,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تم إنهاء الشكوى بنجاح / Complaint finished successfully');
    },
    onError: (error: any) => {
      message.error(
        error?.response?.data?.message || 'فشل إنهاء الشكوى / Failed to finish complaint'
      );
    },
  });
};

/**
 * Toggle hold on a complaint.
 * New API: POST /api/Complaint/{id}/toggle-hold?reason=<reason>
 * reason is REQUIRED.
 */
export const useToggleHoldComplaint = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: number | string; reason: string }>({
    mutationFn: ({ id, reason }) => ComplaintService.toggleHold(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تم تحديث حالة الشكوى بنجاح / Complaint hold status updated');
    },
    onError: (error: any) => {
      message.error(
        error?.response?.data?.message || 'فشل تعليق الشكوى / Failed to update hold status'
      );
    },
  });
};

/**
 * Add a note/update to an existing complaint.
 * New API: POST /api/Complaint/update
 */
export const useAddComplaintUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, CreateComplaintUpdateDto>({
    mutationFn: ComplaintService.addUpdate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تمت إضافة التحديث بنجاح / Update added successfully');
    },
    onError: (error: any) => {
      message.error(
        error?.response?.data?.message || 'فشل إضافة التحديث / Failed to add update'
      );
    },
  });
};

/**
 * Add an issue/case to a complaint.
 * New API: POST /api/Complaint/issue — multipart/form-data with File objects.
 */
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

/** Get issues for a complaint */
export const useComplaintIssues = (complaintId: number | string) => {
  return useQuery<ComplaintIssue[], Error>({
    queryKey: ['complaint-issues', complaintId],
    queryFn: () => ComplaintService.getIssueById(complaintId),
    enabled: !!complaintId,
  });
};
