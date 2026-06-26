import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { ReceiptVoucherService } from '@/services/receipt-voucher.service';
import { getApiErrorMessage } from '@/utils/api-error';
import type { AccountingDocumentFilterDto, CreateReceiptVoucherNewDto } from '@/types/api.types';

const QUERY_KEY = ['receipt-vouchers'];

export function useReceiptVouchers(filters?: AccountingDocumentFilterDto) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters],
    queryFn: () => ReceiptVoucherService.getAll(filters),
  });
}

export function useReceiptVoucher(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => ReceiptVoucherService.getById(id!),
    enabled: !!id,
  });
}

export function useReceiptVoucherTrace(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, id, 'trace'],
    queryFn: () => ReceiptVoucherService.getTrace(id!),
    enabled: !!id,
  });
}

export function useCreateReceiptVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReceiptVoucherNewDto) => ReceiptVoucherService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      message.success('تمت إضافة سند القبض بنجاح / Receipt voucher created successfully');
    },
    onError: (err) => {
      message.error(getApiErrorMessage(err, 'فشل إضافة سند القبض / Failed to create receipt voucher'));
    },
  });
}
