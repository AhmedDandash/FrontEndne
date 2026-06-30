/**
 * Hourly Worker Reports hooks — orders summary, revenue, worker utilization,
 * driver performance. Requires `hourly.employee.reports`.
 * Reports change slowly, so they carry a 5-minute stale time.
 */

import { useQuery } from '@tanstack/react-query';
import { HourlyReportsService } from '@/services/hourly-worker.service';
import type { HourlyReportFilterParams } from '@/types/hourly-worker.types';

const REPORTS_KEY = ['hourly-reports'];
const STALE = 5 * 60 * 1000;

export function useHourlyOrdersSummary(params?: HourlyReportFilterParams) {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'orders-summary', params],
    queryFn: () => HourlyReportsService.getOrdersSummary(params),
    staleTime: STALE,
  });
}

export function useHourlyRevenueReport(params?: HourlyReportFilterParams) {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'revenue', params],
    queryFn: () => HourlyReportsService.getRevenue(params),
    staleTime: STALE,
  });
}

export function useHourlyWorkerUtilization(params?: HourlyReportFilterParams) {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'worker-utilization', params],
    queryFn: () => HourlyReportsService.getWorkerUtilization(params),
    staleTime: STALE,
  });
}

export function useHourlyDriverPerformance(params?: HourlyReportFilterParams) {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'driver-performance', params],
    queryFn: () => HourlyReportsService.getDriverPerformance(params),
    staleTime: STALE,
  });
}
