import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { GeneralVoucherService } from '@/services/general-voucher.service';
import { getApiErrorMessage } from '@/utils/api-error';
import type {
  GeneralVoucherFilterDto,
  CreateGeneralVoucherDto,
  UpdateGeneralVoucherDto,
  GeneralVoucherLineInputDto,
} from '@/types/general-voucher.types';

const QUERY_KEY = ['general-vouchers'];

export function useGeneralVouchers(filters?: GeneralVoucherFilterDto) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters],
    queryFn: () => GeneralVoucherService.getAll(filters),
    // Keeps the current page visible while the next one loads, so the table
    // doesn't flash empty on every filter/page change.
    placeholderData: (previous) => previous,
  });
}

export function useGeneralVoucher(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => GeneralVoucherService.getById(id!),
    enabled: !!id,
  });
}

export function useGeneralVoucherTrace(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, id, 'trace'],
    queryFn: () => GeneralVoucherService.getTrace(id!),
    enabled: !!id,
  });
}

export function useGeneralVoucherPrint(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, id, 'print'],
    queryFn: () => GeneralVoucherService.getPrintData(id!),
    enabled: !!id,
  });
}

/**
 * Voucher-type and payment-method dropdown metadata. These are small, static
 * lookups — cached for the session rather than refetched per mount.
 */
export function useGeneralVoucherTypes() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'types'],
    queryFn: () => GeneralVoucherService.getTypes(),
    staleTime: Infinity,
  });
}

export function useGeneralVoucherPaymentMethods() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'payment-methods'],
    queryFn: () => GeneralVoucherService.getPaymentMethods(),
    staleTime: Infinity,
  });
}

export function useCreateGeneralVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGeneralVoucherDto) => GeneralVoucherService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      message.success('تم إنشاء السند بنجاح / Voucher created successfully');
    },
    onError: (err) => {
      message.error(getApiErrorMessage(err, 'فشل إنشاء السند / Failed to create voucher'));
    },
  });
}

export function useUpdateGeneralVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGeneralVoucherDto }) =>
      GeneralVoucherService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      message.success('تم تحديث السند بنجاح / Voucher updated successfully');
    },
    onError: (err) => {
      message.error(getApiErrorMessage(err, 'فشل تحديث السند / Failed to update voucher'));
    },
  });
}

export function useDeleteGeneralVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => GeneralVoucherService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      message.success('تم حذف السند بنجاح / Voucher deleted successfully');
    },
    onError: (err) => {
      message.error(getApiErrorMessage(err, 'فشل حذف السند / Failed to delete voucher'));
    },
  });
}

export function useUploadVoucherAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      GeneralVoucherService.uploadAttachment(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      message.success('تم رفع المرفق بنجاح / Attachment uploaded');
    },
    onError: (err) => {
      message.error(getApiErrorMessage(err, 'فشل رفع المرفق / Failed to upload attachment'));
    },
  });
}

/**
 * Server-side balance check. Silent on error — the multi-line grid already
 * shows a client-side computed balance, so a failed round-trip degrades to
 * that rather than interrupting data entry with a toast.
 */
export function useValidateVoucherBalance() {
  return useMutation({
    mutationFn: (lines: GeneralVoucherLineInputDto[]) =>
      GeneralVoucherService.validateBalance(lines),
  });
}
