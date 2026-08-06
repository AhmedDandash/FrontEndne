/**
 * Hourly Order Notifications hooks — WhatsApp delivery log + retry failed.
 * Retry requires `hourly.admin.full_access`.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { HourlyNotificationsService } from '@/services/hourly-worker.service';
import { getApiErrorMessage } from '@/utils/api-error';
import type { HourlyNotificationListParams } from '@/types/hourly-worker.types';

const NOTIFICATIONS_KEY = ['hourly-notifications'];

export function useHourlyNotifications(params?: HourlyNotificationListParams) {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, params],
    queryFn: () => HourlyNotificationsService.getAll(params),
    placeholderData: (previous) => previous,
  });
}

export function useHourlyNotificationMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });

  const retry = useMutation({
    mutationFn: (id: string) => HourlyNotificationsService.retry(id),
    onSuccess: () => {
      invalidate();
      message.success('تمت إعادة الإرسال / Notification resent');
    },
    onError: (err) => message.error(getApiErrorMessage(err, 'فشل إعادة الإرسال / Failed to retry')),
  });

  return { retry };
}
