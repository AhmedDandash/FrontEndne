import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import { unwrap } from '@/utils/api-response';
import type { PeriodClosingResult, ClosePeriodDto } from '@/types/api.types';

export class PeriodClosingService {
  /**
   * Returns whether the given period is closed.
   * Verified live: `status` returns `{ success, data: <boolean> }` — a plain
   * boolean flag, NOT a rich object.
   */
  static async getStatus(year: number, month: number): Promise<boolean> {
    const response = await api.get<any>(API_ENDPOINTS.PERIOD_CLOSING.STATUS, {
      params: { year, month },
    });
    return unwrap<boolean>(response.data) === true;
  }

  static async closePeriod(data: ClosePeriodDto): Promise<PeriodClosingResult> {
    const response = await api.post<any>(API_ENDPOINTS.PERIOD_CLOSING.CLOSE, data);
    return unwrap<PeriodClosingResult>(response.data);
  }
}
