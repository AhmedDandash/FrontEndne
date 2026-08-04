/**
 * Worker Hooks — migrated to new API contract.
 *
 * Breaking changes from old hooks:
 *  - All paths moved from /api/Worker to /api/V1/Worker
 *  - useWorkerEscape: REMOVED (no replacement in new API)
 *  - useWorkerSick:   REMOVED (no replacement in new API)
 *  - useWorkerRefused → useSetWorkerRefusal (POST /api/V1/Worker/{id}/set-refusal)
 *  - useWorkerDeactivate → useActivateWorker (POST /api/V1/Worker/{id}/activate)
 *  - useWorkerOut → useMoveWorkerToAccommodation (POST /api/V1/Worker/{id}/move-to-accommodation)
 *  - Medical examination hooks moved to /api/V1/MedicalExamination (use useMedicalExamination hooks)
 *  - Worker IDs are now UUID strings
 *  - WorkerDto field renames: workerSatus→workerStatus, uploadimage→uploadImage, skills now string
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { API_ENDPOINTS } from '@/config/api.config';
import type { Worker, WorkerDto, MedicalExaminationDto, MedicalExamination } from '@/types/api.types';
import { api } from '@/lib/api/client';

const WORKERS_KEY = ['workers'];
const MEDICAL_EXAMINATIONS_KEY = ['medical-examinations'];

export interface WorkerFilterParams {
  SearchName?: string;
  NationalId?: string;
  PassportNo?: string;
  Mobile?: string;
  NationalityId?: string;
  JobId?: string;
  WorkerStatus?: number;
  MinAge?: number;
  MaxAge?: number;
  AgentId?: string;
  EmployeeId?: string;
  // Branch scoping + shared advanced filters (see new edits2.md).
  BranchId?: string;
  IncludeSubBranches?: boolean;
  Search?: string;
  CreatedDateFrom?: string;
  CreatedDateTo?: string;
  UpdatedDateFrom?: string;
  UpdatedDateTo?: string;
  SortBy?: string;
  SortDescending?: boolean;
  PageNumber?: number;
  PageSize?: number;
}

export interface WorkerPagedResult {
  workers: Worker[];
  total: number;
  pageNumber: number;
  pageSize: number;
}

const isFile = (value: unknown): value is File => typeof File !== 'undefined' && value instanceof File;

const appendFormValue = (formData: FormData, key: string, value: unknown) => {
  if (value === undefined || value === null) return;

  if (value instanceof Date) {
    formData.append(key, value.toISOString());
    return;
  }

  if (isFile(value)) {
    formData.append(key, value);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => {
      if (item !== undefined && item !== null) appendFormValue(formData, key, item);
    });
    return;
  }

  formData.append(key, String(value));
};

const workerDtoToFormData = (data: WorkerDto): FormData => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    appendFormValue(formData, key, value);
  });

  return formData;
};

const extractWorkerArray = (payload: any): Worker[] => {
  const candidates = [
    payload,
    payload?.data,
    payload?.result,
    payload?.items,
    payload?.data?.data,
    payload?.data?.result,
    payload?.data?.items,
    payload?.result?.data,
    payload?.result?.items,
    payload?.$values,
    payload?.data?.$values,
    payload?.result?.$values,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length >= 0) return candidate as Worker[];
    if (Array.isArray(candidate?.$values)) return candidate.$values as Worker[];
  }

  return [];
};

export interface WorkerTransferOption {
  id: string;
  name: string;
}

/** Fetch workers that have requested a sponsorship transfer (WantsTransfer flag) */
export function useWorkersWantsTransfer() {
  return useQuery<WorkerTransferOption[]>({
    queryKey: [...WORKERS_KEY, 'wants-transfer'],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.WORKERS.WANTS_TRANSFER);
      const payload = response.data;
      const data = payload?.data ?? payload;
      return Array.isArray(data) ? (data as WorkerTransferOption[]) : [];
    },
  });
}

/** Fetch all workers */
export function useWorkers() {
  return useQuery<Worker[]>({
    queryKey: WORKERS_KEY,
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.WORKERS.GET_ALL);
      return extractWorkerArray(response.data);
    },
  });
}

/** Fetch workers with server-side filtering and pagination */
export function useWorkersFiltered(params?: WorkerFilterParams, options?: { enabled?: boolean }) {
  const cleanParams: Record<string, string | number> = {};
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        cleanParams[k] = v as string | number;
      }
    });
  }

  return useQuery<WorkerPagedResult>({
    queryKey: [...WORKERS_KEY, 'filtered', cleanParams],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.WORKERS.GET_ALL, {
        params: Object.keys(cleanParams).length > 0 ? cleanParams : undefined,
      });
      const payload = response.data;
      const workers = extractWorkerArray(payload);
      const total =
        payload?.total ??
        payload?.data?.total ??
        payload?.result?.total ??
        payload?.totalCount ??
        payload?.data?.totalCount ??
        workers.length;
      const pageNumber = cleanParams.PageNumber as number ?? 1;
      const pageSize = cleanParams.PageSize as number ?? 20;
      return { workers, total, pageNumber, pageSize };
    },
  });
}

/**
 * Fetch workers available for a mediation contract, searched by passport number.
 * Backend params: `availableForMediationContract=true` (active + not on an active
 * contract) and `searchByPassportOnly=true` with `passportNo` as a partial match.
 * Pass an empty/short `passportNo` and set `enabled=false` to defer the query.
 */
export function useAvailableMediationWorkers(passportNo?: string, enabled = true) {
  const trimmed = (passportNo ?? '').trim();
  return useQuery<Worker[]>({
    queryKey: [...WORKERS_KEY, 'available-mediation', trimmed],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.WORKERS.GET_ALL, {
        params: {
          availableForMediationContract: true,
          searchByPassportOnly: true,
          passportNo: trimmed,
          PageSize: 50,
        },
      });
      return extractWorkerArray(response.data);
    },
    enabled,
  });
}

/** Fetch a single worker by ID */
export function useWorker(id: string | undefined) {
  const normalizedId = id && id !== 'undefined' ? id : undefined;

  return useQuery<Worker>({
    queryKey: [...WORKERS_KEY, normalizedId],
    queryFn: async () => {
      if (!normalizedId) throw new Error('Worker ID is required');
      const response = await api.get(API_ENDPOINTS.WORKERS.GET_BY_ID(normalizedId));
      const payload = response.data;
      if (payload?.data) return payload.data as Worker;
      return payload as Worker;
    },
    enabled: !!normalizedId,
  });
}

/** Create a new worker */
export function useCreateWorker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: WorkerDto) => {
      const response = await api.post<Worker>(
        API_ENDPOINTS.WORKERS.CREATE,
        workerDtoToFormData(data),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKERS_KEY });
      message.success('تمت إضافة العمالة بنجاح / Worker created successfully');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'فشل إضافة العمالة / Failed to create worker');
    },
  });
}

/** Update an existing worker */
export function useUpdateWorker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number | string; data: WorkerDto }) => {
      const response = await api.put<Worker>(
        API_ENDPOINTS.WORKERS.UPDATE(id),
        workerDtoToFormData(data),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKERS_KEY });
      message.success('تم تحديث بيانات العمالة بنجاح / Worker updated successfully');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'فشل تحديث بيانات العمالة / Failed to update worker');
    },
  });
}

/** Delete a worker */
export function useDeleteWorker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number | string) => {
      await api.delete(API_ENDPOINTS.WORKERS.DELETE(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKERS_KEY });
      message.success('تم حذف العمالة بنجاح / Worker deleted successfully');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'فشل حذف العمالة / Failed to delete worker');
    },
  });
}

/**
 * Set worker refusal status.
 * New API: POST /api/V1/Worker/{id}/set-refusal
 * Replaces old: POST /api/Worker/WorkerRefused
 */
export function useSetWorkerRefusal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number | string) => {
      await api.post(API_ENDPOINTS.WORKERS.SET_REFUSAL(id), {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKERS_KEY });
      message.success('تم تحديث حالة الرفض / Worker refusal status updated');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'فشل تحديث حالة الرفض / Failed to update refusal status');
    },
  });
}

/** @deprecated Use useSetWorkerRefusal */
export const useWorkerRefused = useSetWorkerRefusal;

/**
 * Activate/deactivate a worker.
 * New API: POST /api/V1/Worker/{id}/activate
 * Replaces old: POST /api/Worker/WorkerIsNoActive
 */
export function useActivateWorker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number | string) => {
      await api.post(API_ENDPOINTS.WORKERS.ACTIVATE(id), {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKERS_KEY });
      message.success('تم تحديث حالة تفعيل العمالة / Worker activation status updated');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'فشل تحديث حالة التفعيل / Failed to update activation');
    },
  });
}

/** @deprecated Use useActivateWorker */
export const useWorkerDeactivate = useActivateWorker;

/**
 * Move worker to accommodation.
 * New API: POST /api/V1/Worker/{id}/move-to-accommodation
 * Replaces old: POST /api/Worker/WorkerOut
 */
export function useMoveWorkerToAccommodation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number | string) => {
      await api.post(API_ENDPOINTS.WORKERS.MOVE_TO_ACCOMMODATION(id), {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKERS_KEY });
      message.success('تم نقل العمالة للسكن / Worker moved to accommodation');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'فشل نقل العمالة / Failed to move worker');
    },
  });
}

/** @deprecated Use useMoveWorkerToAccommodation */
export const useWorkerOut = useMoveWorkerToAccommodation;

// ─── Medical Examination ───────────────────────────────────────────────────────
// Paths moved to /api/V1/MedicalExamination (previously /api/Worker/*)

/** Create medical examination */
export function useCreateMedicalExamination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MedicalExaminationDto) => {
      const response = await api.post(API_ENDPOINTS.MEDICAL_EXAMINATION.CREATE, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKERS_KEY });
      queryClient.invalidateQueries({ queryKey: MEDICAL_EXAMINATIONS_KEY });
      message.success('تمت إضافة الفحص الطبي بنجاح / Medical examination created successfully');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'فشل إضافة الفحص الطبي / Failed to create medical examination');
    },
  });
}

/** Get all medical examinations */
export function useMedicalExaminations() {
  return useQuery<MedicalExamination[]>({
    queryKey: MEDICAL_EXAMINATIONS_KEY,
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.MEDICAL_EXAMINATION.GET_ALL);
      const payload = response.data;
      if (Array.isArray(payload)) return payload as MedicalExamination[];
      if (payload?.data && Array.isArray(payload.data)) return payload.data as MedicalExamination[];
      return [] as MedicalExamination[];
    },
  });
}

/** Update medical examination */
export function useUpdateMedicalExamination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number | string; data: Partial<MedicalExaminationDto> }) => {
      const response = await api.put(API_ENDPOINTS.MEDICAL_EXAMINATION.UPDATE(id), data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEDICAL_EXAMINATIONS_KEY });
      message.success('تم تحديث الفحص الطبي / Medical examination updated successfully');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'فشل تحديث الفحص الطبي / Failed to update medical examination');
    },
  });
}

/** Check if a worker already has a medical examination */
export function useCheckWorkerMedicalExamination() {
  return useMutation({
    mutationFn: async (workerId: string | number) => {
      try {
        const response = await api.get(API_ENDPOINTS.MEDICAL_EXAMINATION.CHECK_WORKER(workerId));
        const payload = response.data;
        if (payload?.success && payload?.data) return payload.data as MedicalExamination;
        return null;
      } catch {
        return null;
      }
    },
  });
}

/** Delete medical examination */
export function useDeleteMedicalExamination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.delete(API_ENDPOINTS.MEDICAL_EXAMINATION.DELETE(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEDICAL_EXAMINATIONS_KEY });
      message.success('تم حذف الفحص الطبي / Medical examination deleted successfully');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'فشل حذف الفحص الطبي / Failed to delete medical examination');
    },
  });
}
