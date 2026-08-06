import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { PaymentVoucherService } from '@/services/payment-voucher.service';
import { getApiErrorMessage } from '@/utils/api-error';
import type { AccountingDocumentFilterDto, CreatePaymentVoucherDto } from '@/types/api.types';

const QUERY_KEY = ['payment-vouchers'];

export function usePaymentVouchers(filters?: AccountingDocumentFilterDto) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters],
    queryFn: () => PaymentVoucherService.getAll(filters),
    placeholderData: (previous) => previous,
  });
}

export function usePaymentVoucher(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => PaymentVoucherService.getById(id!),
    enabled: !!id,
  });
}

export function usePaymentVoucherTrace(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, id, 'trace'],
    queryFn: () => PaymentVoucherService.getTrace(id!),
    enabled: !!id,
  });
}

export function useCreatePaymentVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePaymentVoucherDto) => PaymentVoucherService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      message.success('تمت إضافة سند الصرف بنجاح / Payment voucher created successfully');
    },
    onError: (err) => {
      message.error(getApiErrorMessage(err, 'فشل إضافة سند الصرف / Failed to create payment voucher'));
    },
  });
}
