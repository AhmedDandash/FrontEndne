/**
 * Receipt Voucher Hooks
 * React Query hooks for Receipt Voucher CRUD — /api/ReceiptVoucher
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { ReceiptVoucherService } from '@/services/receipt-voucher.service';
import { getApiErrorMessage } from '@/utils/api-error';
import type { CreateReceiptVoucherDto, UpdateReceiptVoucherDto } from '@/types/api.types';

const QUERY_KEY = ['receipt-vouchers'];

export function useReceiptVouchers(params?: Record<string, any>) {
  return useQuery({
    queryKey: [...QUERY_KEY, params],
    queryFn: () => ReceiptVoucherService.getAll(params),
  });
}

export function useReceiptVoucher(id: number | string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => ReceiptVoucherService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateReceiptVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReceiptVoucherDto) => ReceiptVoucherService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      message.success('تمت إضافة سند القبض بنجاح / Receipt voucher created successfully');
    },
    onError: (err) => {
      message.error(getApiErrorMessage(err, 'فشل إضافة سند القبض / Failed to create receipt voucher'));
    },
  });
}

export function useUpdateReceiptVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: UpdateReceiptVoucherDto }) =>
      ReceiptVoucherService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      message.success('تم تحديث سند القبض بنجاح / Receipt voucher updated successfully');
    },
    onError: (err) => {
      message.error(getApiErrorMessage(err, 'فشل تحديث سند القبض / Failed to update receipt voucher'));
    },
  });
}

export function useDeleteReceiptVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => ReceiptVoucherService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      message.success('تم حذف سند القبض بنجاح / Receipt voucher deleted successfully');
    },
    onError: (err) => {
      message.error(getApiErrorMessage(err, 'فشل حذف سند القبض / Failed to delete receipt voucher'));
    },
  });
}
