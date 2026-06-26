import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { PeriodClosingService } from '@/services/period-closing.service';
import { getApiErrorMessage } from '@/utils/api-error';
import type { ClosePeriodDto } from '@/types/api.types';

const QUERY_KEY = ['period-closing'];

export function usePeriodClosingStatus(year: number, month: number) {
  return useQuery({
    queryKey: [...QUERY_KEY, year, month],
    queryFn: () => PeriodClosingService.getStatus(year, month),
    enabled: !!year && !!month,
    // Period-closing endpoints are role-restricted (return 401/403 for
    // non-accountant roles). Don't hammer them with retries on auth failures.
    retry: (failureCount, error: any) => {
      const code = error?.response?.status;
      if (code === 401 || code === 403) return false;
      return failureCount < 2;
    },
  });
}

export function useClosePeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ClosePeriodDto) => PeriodClosingService.closePeriod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      message.success('تم إغلاق الفترة المحاسبية بنجاح / Accounting period closed successfully');
    },
    onError: (err) => {
      message.error(getApiErrorMessage(err, 'فشل إغلاق الفترة المحاسبية / Failed to close accounting period'));
    },
  });
}
