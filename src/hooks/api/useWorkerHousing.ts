import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { WorkerHousingService } from '@/services/worker-housing.service';
import type {
  HousingApplicantParams,
  WorkerStatusLogDto,
  DeportationDto,
  HandoverDto,
  IssueResidencyDto,
  AddUpdateDto,
  ExitAndReEntryDto,
} from '@/types/housing.types';

const HOUSED_KEY = 'housed-workers';

// ─── Standalone assign-to-housing mutation (used on the main workers page) ───

export function useAssignWorkerHousing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: WorkerStatusLogDto) => WorkerHousingService.assignHousing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HOUSED_KEY] });
      message.success('تم تسكين العامل بنجاح / Worker assigned to housing');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'فشل تسكين العامل / Failed to assign housing');
    },
  });
}

export function useHousedWorkers(params: HousingApplicantParams = {}) {
  const queryClient = useQueryClient();

  const {
    data: workers,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [HOUSED_KEY, params],
    queryFn: () => WorkerHousingService.getHoused(params),
    placeholderData: (previous) => previous,
  });

  // ─── Housing Assignment (StatusType 8) ───────────────────────────────────

  const assignHousingMutation = useMutation({
    mutationFn: (data: WorkerStatusLogDto) => WorkerHousingService.assignHousing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HOUSED_KEY] });
      message.success('تم تسكين العامل بنجاح / Worker assigned to housing');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'فشل تسكين العامل / Failed to assign housing');
    },
  });

  const undoLastStatusMutation = useMutation({
    mutationFn: (workerId: string) => WorkerHousingService.undoLastStatus(workerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HOUSED_KEY] });
      message.success('تم التراجع عن آخر حالة / Last status undone');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'فشل التراجع / Undo failed');
    },
  });

  // ─── Toggle Preferences ──────────────────────────────────────────────────

  const toggleWantsWorkMutation = useMutation({
    mutationFn: (workerId: string) => WorkerHousingService.toggleWantsWork(workerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HOUSED_KEY] });
      message.success('تم تحديث رغبة العمل / Work preference updated');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'فشل تحديث الرغبة / Failed to update preference');
    },
  });

  const toggleWantsTransferMutation = useMutation({
    mutationFn: (workerId: string) => WorkerHousingService.toggleWantsTransfer(workerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HOUSED_KEY] });
      message.success('تم تحديث رغبة النقل / Transfer preference updated');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'فشل تحديث الرغبة / Failed to update preference');
    },
  });

  // ─── Pathway Actions ─────────────────────────────────────────────────────

  const deportationMutation = useMutation({
    mutationFn: ({ workerId, data }: { workerId: string; data: DeportationDto }) =>
      WorkerHousingService.deportation(workerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HOUSED_KEY] });
      message.success('تم تسجيل الترحيل / Deportation registered');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'فشل تسجيل الترحيل / Deportation failed');
    },
  });

  const cancelDeportationMutation = useMutation({
    mutationFn: (workerId: string) => WorkerHousingService.cancelDeportation(workerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HOUSED_KEY] });
      message.success('تم إلغاء الترحيل / Deportation cancelled');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'فشل إلغاء الترحيل / Cancel failed');
    },
  });

  const handoverMutation = useMutation({
    mutationFn: ({ workerId, data }: { workerId: string; data: HandoverDto }) =>
      WorkerHousingService.handover(workerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HOUSED_KEY] });
      message.success('تم تسجيل التسليم / Handover registered');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'فشل تسجيل التسليم / Handover failed');
    },
  });

  const issueResidencyMutation = useMutation({
    mutationFn: ({ workerId, data }: { workerId: string; data: IssueResidencyDto }) =>
      WorkerHousingService.issueResidency(workerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HOUSED_KEY] });
      message.success('تم إصدار الإقامة / Residency issued');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'فشل إصدار الإقامة / Issue residency failed');
    },
  });

  const addUpdateMutation = useMutation({
    mutationFn: ({ workerId, data }: { workerId: string; data: AddUpdateDto }) =>
      WorkerHousingService.addUpdate(workerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HOUSED_KEY] });
      message.success('تمت إضافة الملاحظة / Update added');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'فشل إضافة الملاحظة / Add update failed');
    },
  });

  const exitAndReEntryMutation = useMutation({
    mutationFn: ({ workerId, data }: { workerId: string; data: ExitAndReEntryDto }) =>
      WorkerHousingService.exitAndReEntry(workerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HOUSED_KEY] });
      message.success('تم تسجيل الخروج والعودة / Exit & re-entry registered');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'فشل تسجيل الخروج / Exit failed');
    },
  });

  const exitHousingMutation = useMutation({
    mutationFn: (workerId: string) => WorkerHousingService.exitHousing(workerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HOUSED_KEY] });
      refetch();
      message.success('تم إخراج العامل من السكن / Worker exited housing');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'فشل الإخراج من السكن / Exit housing failed');
    },
  });

  return {
    workers,
    isLoading,
    error,
    refetch,
    // assignment
    assignHousing: assignHousingMutation.mutateAsync,
    undoLastStatus: undoLastStatusMutation.mutateAsync,
    // preferences
    toggleWantsWork: toggleWantsWorkMutation.mutateAsync,
    toggleWantsTransfer: toggleWantsTransferMutation.mutateAsync,
    // pathways
    registerDeportation: deportationMutation.mutateAsync,
    cancelDeportation: cancelDeportationMutation.mutateAsync,
    registerHandover: handoverMutation.mutateAsync,
    issueResidency: issueResidencyMutation.mutateAsync,
    addUpdate: addUpdateMutation.mutateAsync,
    exitAndReEntry: exitAndReEntryMutation.mutateAsync,
    exitHousing: exitHousingMutation.mutateAsync,
    // loading states
    isAssigning: assignHousingMutation.isPending,
    isDeporting: deportationMutation.isPending,
    isCancellingDeportation: cancelDeportationMutation.isPending,
    isHandingOver: handoverMutation.isPending,
    isIssuingResidency: issueResidencyMutation.isPending,
    isAddingUpdate: addUpdateMutation.isPending,
    isExiting: exitHousingMutation.isPending,
  };
}
