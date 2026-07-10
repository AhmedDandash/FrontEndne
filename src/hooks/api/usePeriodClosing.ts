import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { PeriodClosingService } from '@/services/period-closing.service';
import { getApiErrorMessage } from '@/utils/api-error';
import type { ClosePeriodDto, OpenPeriodDto } from '@/types/api.types';

const QUERY_KEY = ['period-closing'];

/** Don't hammer role/branch-restricted endpoints (401/403) with retries. */
const retryUnlessForbidden = (failureCount: number, error: any) => {
  const code = error?.response?.status;
  if (code === 401 || code === 403) return false;
  return failureCount < 2;
};

/**
 * GET /PeriodClosing — the list of accounting years (2025 → current) with their
 * closed/open state. This list is the single source of truth for the UI.
 */
export function usePeriodClosingYears() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'years'],
    queryFn: () => PeriodClosingService.getYears(),
    retry: retryUnlessForbidden,
  });
}

/**
 * Convenience wrapper over the years list: exposes a `isYearClosed(date|year)`
 * predicate for gating posting actions on entries that fall in a closed year.
 * Fails open — if the list is unavailable (e.g. 403 for the role), nothing is
 * gated and the server remains the source of truth.
 */
export function useClosedYears() {
  const { data: years, isLoading } = usePeriodClosingYears();
  const closed = new Set((years ?? []).filter((y) => y.isClosed).map((y) => y.year));
  const isYearClosed = (dateOrYear: string | number | null | undefined): boolean => {
    if (dateOrYear == null || dateOrYear === '') return false;
    const year =
      typeof dateOrYear === 'number'
        ? dateOrYear
        : new Date(dateOrYear).getFullYear();
    return Number.isFinite(year) && closed.has(year);
  };
  return { closedYears: closed, isYearClosed, isLoading };
}

/** GET /PeriodClosing/status?year= — a single year's closed flag (optional). */
export function usePeriodClosingStatus(year: number) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'status', year],
    queryFn: () => PeriodClosingService.getStatus(year),
    enabled: !!year,
    retry: retryUnlessForbidden,
  });
}

export function useClosePeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ClosePeriodDto) => PeriodClosingService.closePeriod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      message.success('تم إغلاق السنة المالية بنجاح / Fiscal year closed successfully');
    },
    onError: (err) => {
      message.error(getApiErrorMessage(err, 'فشل إغلاق السنة المالية / Failed to close fiscal year'));
    },
  });
}

export function useOpenPeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: OpenPeriodDto) => PeriodClosingService.openPeriod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      message.success('تم فتح السنة المالية بنجاح / Fiscal year reopened successfully');
    },
    onError: (err) => {
      message.error(getApiErrorMessage(err, 'فشل فتح السنة المالية / Failed to reopen fiscal year'));
    },
  });
}
