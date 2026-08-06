/**
 * Hourly Order Payments hooks — global payments list + refund.
 * Refund requires `hourly.admin.full_access`.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { HourlyPaymentsService } from '@/services/hourly-worker.service';
import { getApiErrorMessage } from '@/utils/api-error';
import type { HourlyPaymentListParams } from '@/types/hourly-worker.types';

const PAYMENTS_KEY = ['hourly-payments'];

export function useHourlyPayments(params?: HourlyPaymentListParams) {
  return useQuery({
    queryKey: [...PAYMENTS_KEY, params],
    queryFn: () => HourlyPaymentsService.getAll(params),
    placeholderData: (previous) => previous,
  });
}

export function useHourlyPaymentMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: PAYMENTS_KEY });

  const refund = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      HourlyPaymentsService.refund(id, notes),
    onSuccess: () => {
      invalidate();
      message.success('تم استرداد المبلغ / Payment refunded');
    },
    onError: (err) => message.error(getApiErrorMessage(err, 'فشل الاسترداد / Failed to refund')),
  });

  return { refund };
}
