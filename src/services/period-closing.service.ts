import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import { unwrap } from '@/utils/api-response';
import type {
  PeriodClosingResult,
  ClosePeriodDto,
  OpenPeriodDto,
  PeriodYearStatus,
} from '@/types/api.types';

/**
 * Period Closing service — YEAR-based.
 *
 * Verified live (2026-07) against https://sigma-api.runasp.net:
 *   • GET  /api/V1/PeriodClosing            → PeriodYearStatus[] (2025 → current year)
 *   • GET  /api/V1/PeriodClosing/status     → boolean (?year=)
 *   • POST /api/V1/PeriodClosing/close      → PeriodClosingResult   body { year }
 *   • POST /api/V1/PeriodClosing/open       → PeriodClosingResult   body { year }
 *
 * All endpoints are branch-scoped: the backend returns 400
 * ("يجب إرسال X-Branch-Id …") when the X-Branch-Id header is missing. That
 * header is injected globally by the api client, so no per-call handling here.
 */
export class PeriodClosingService {
  /** Coerce a value that may be an array or a `{ $values: [] }` wrapper. */
  private static asArray(value: any): any[] {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.$values)) return value.$values;
    return [];
  }

  /**
   * GET /PeriodClosing — the list of accounting years with their closed/open
   * state. The backend already bounds the range to 2025 → current year.
   */
  static async getYears(): Promise<PeriodYearStatus[]> {
    const response = await api.get<any>(API_ENDPOINTS.PERIOD_CLOSING.GET_ALL);
    const data = unwrap<any>(response.data);
    return this.asArray(data).map((raw) => ({
      year: Number(raw?.year),
      isClosed: raw?.isClosed === true,
      closedAt: raw?.closedAt ?? null,
      closedBy: raw?.closedBy ?? null,
      closingJournalEntryId: raw?.closingJournalEntryId ?? null,
    }));
  }

  /**
   * Returns whether the given year is closed.
   * `status` returns `{ success, data: <boolean> }` — a plain boolean flag.
   */
  static async getStatus(year: number): Promise<boolean> {
    const response = await api.get<any>(API_ENDPOINTS.PERIOD_CLOSING.STATUS, {
      params: { year },
    });
    return unwrap<boolean>(response.data) === true;
  }

  /** POST /PeriodClosing/close — close a year and transfer net income. */
  static async closePeriod(data: ClosePeriodDto): Promise<PeriodClosingResult> {
    const response = await api.post<any>(API_ENDPOINTS.PERIOD_CLOSING.CLOSE, data);
    return unwrap<PeriodClosingResult>(response.data);
  }

  /** POST /PeriodClosing/open — reopen a previously closed year. */
  static async openPeriod(data: OpenPeriodDto): Promise<PeriodClosingResult> {
    const response = await api.post<any>(API_ENDPOINTS.PERIOD_CLOSING.OPEN, data);
    return unwrap<PeriodClosingResult>(response.data);
  }
}
