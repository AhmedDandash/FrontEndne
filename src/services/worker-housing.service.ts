import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import type {
  HousedWorker,
  HousingApplicantParams,
  WorkerStatusLogDto,
  DeportationDto,
  HandoverDto,
  IssueResidencyDto,
  AddUpdateDto,
  ExitAndReEntryDto,
} from '@/types/housing.types';

export class WorkerHousingService {
  private static unwrapList<T>(payload: any): T[] {
    const candidates = [
      payload,
      payload?.data,
      payload?.data?.value,
      payload?.value,
      payload?.result,
      payload?.data?.result,
      payload?.items,
      payload?.data?.items,
      payload?.value?.items,
      payload?.records,
      payload?.data?.records,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate as T[];
      if (Array.isArray(candidate?.$values)) return candidate.$values as T[];
    }

    console.warn('[WorkerHousingService] Unexpected response shape:', payload);
    return [];
  }

  // ─── Housed List ─────────────────────────────────────────────────────────

  static async getHoused(params: HousingApplicantParams = {}): Promise<HousedWorker[]> {
    const query: Record<string, any> = {
      pageNumber: params.pageNumber ?? 1,
      pageSize: params.pageSize ?? 200,
    };
    if (params.searchKeyword) query.searchKeyword = params.searchKeyword;
    if (params.nationalityId) query.nationalityId = params.nationalityId;
    if (params.agentId) query.agentId = params.agentId;
    if (params.jobId) query.jobId = params.jobId;
    if (params.isReadyForDeportation !== undefined)
      query.isReadyForDeportation = params.isReadyForDeportation;
    if (params.isReadyForHandover !== undefined)
      query.isReadyForHandover = params.isReadyForHandover;
    if (params.hasResidency !== undefined) query.hasResidency = params.hasResidency;
    if (params.wantsWork !== undefined) query.wantsWork = params.wantsWork;
    if (params.wantsTransfer !== undefined) query.wantsTransfer = params.wantsTransfer;

    const response = await api.get<any>(API_ENDPOINTS.WORKER_MASTER.HOUSED, { params: query });
    return this.unwrapList<HousedWorker>(response.data);
  }

  // ─── Worker Status Log (Housing assignment — StatusType 8) ───────────────

  static async assignHousing(data: WorkerStatusLogDto): Promise<void> {
    await api.post(API_ENDPOINTS.WORKER_STATUS_LOG.CREATE, {
      workerId: data.workerId,
      statusType: 8,
      housingId: data.housingId,
      statusDate: data.statusDate,
      notes: data.notes ?? null,
    });
  }

  static async undoLastStatus(workerId: string): Promise<void> {
    await api.delete(API_ENDPOINTS.WORKER_STATUS_LOG.DELETE(workerId));
  }

  // ─── Toggle worker preferences ───────────────────────────────────────────

  static async toggleWantsWork(workerId: string): Promise<void> {
    await api.post(API_ENDPOINTS.WORKER_STATUS_LOG.ACTIVATE_WANTS_WORK(workerId));
  }

  static async toggleWantsTransfer(workerId: string): Promise<void> {
    await api.post(API_ENDPOINTS.WORKER_STATUS_LOG.ACTIVATE_WANTS_TRANSFER(workerId));
  }

  // ─── Worker Pathway Actions ───────────────────────────────────────────────

  static async deportation(workerId: string, data: DeportationDto): Promise<void> {
    const form = new FormData();
    form.append('TransportType', data.transportType);
    if (data.carrierName) form.append('CarrierName', data.carrierName);
    if (data.tripNumber) form.append('TripNumber', data.tripNumber);
    if (data.deportationTime) form.append('DeportationTime', data.deportationTime);
    if (data.destinationName) form.append('DestinationName', data.destinationName);
    if (data.saudiMobile) form.append('SaudiMobile', data.saudiMobile);
    if (data.whatsAppNumber) form.append('WhatsAppNumber', data.whatsAppNumber);
    if (data.borderNumber) form.append('BorderNumber', data.borderNumber);
    if (data.ticketType) form.append('TicketType', data.ticketType);
    if (data.ticketImage) form.append('TicketImage', data.ticketImage);

    await api.post(API_ENDPOINTS.WORKER_MASTER.DEPORTATION(workerId), form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  static async cancelDeportation(workerId: string): Promise<void> {
    await api.post(API_ENDPOINTS.WORKER_MASTER.CANCEL_DEPORTATION(workerId));
  }

  static async handover(workerId: string, data: HandoverDto): Promise<void> {
    await api.post(API_ENDPOINTS.WORKER_MASTER.HANDOVER(workerId), {
      handoverTime: data.handoverTime,
      saudiMobile: data.saudiMobile ?? null,
      whatsAppNumber: data.whatsAppNumber ?? null,
      borderNumber: data.borderNumber ?? null,
    });
  }

  static async issueResidency(workerId: string, data: IssueResidencyDto): Promise<void> {
    await api.post(API_ENDPOINTS.WORKER_MASTER.ISSUE_RESIDENCY(workerId), {
      iqamaNumber: data.iqamaNumber,
    });
  }

  static async addUpdate(workerId: string, data: AddUpdateDto): Promise<void> {
    await api.post(API_ENDPOINTS.WORKER_MASTER.ADD_UPDATE(workerId), {
      updateDate: data.updateDate,
      notes: data.notes,
    });
  }

  static async exitAndReEntry(workerId: string, data: ExitAndReEntryDto): Promise<void> {
    await api.post(API_ENDPOINTS.WORKER_MASTER.EXIT_AND_REENTRY(workerId), {
      exitDate: data.exitDate,
      reason: data.reason ?? null,
    });
  }

  static async exitHousing(workerId: string): Promise<void> {
    await api.post(API_ENDPOINTS.WORKER_MASTER.EXIT_HOUSING(workerId));
  }
}
