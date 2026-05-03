import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import type {
  FollowUpRequirement,
  CreateFollowUpRequirementDto,
  UpdateFollowUpRequirementDto,
} from '@/types/api.types';

export class FollowUpRequirementService {
  private static unwrap<T>(payload: any): T | null {
    const data =
      payload?.data?.value ?? payload?.value ?? payload?.data ?? payload;
    if (!data || (typeof data === 'object' && !data.id && !data.requirementsText)) {
      return null;
    }
    return data as T;
  }

  /**
   * GET /GetByNationalityAndJob?nationalityId=<ContractNationality.id>&jobId=<Job.id>
   * Returns null when no requirement exists for this combination.
   */
  static async getByNationalityAndJob(
    nationalityId: string,
    jobId: string
  ): Promise<FollowUpRequirement | null> {
    const response = await api.get<any>(
      API_ENDPOINTS.CONTRACT_CREATION_REQUIREMENT.GET_BY_NATIONALITY_AND_JOB,
      { params: { nationalityId, jobId } }
    );
    return this.unwrap<FollowUpRequirement>(response.data);
  }

  /**
   * GET /GetById/{id}
   */
  static async getById(id: string): Promise<FollowUpRequirement | null> {
    const response = await api.get<any>(
      API_ENDPOINTS.CONTRACT_CREATION_REQUIREMENT.GET_BY_ID(id)
    );
    return this.unwrap<FollowUpRequirement>(response.data);
  }

  /**
   * POST /Create
   * nationalityId = ContractNationality.id (integer PK from /api/FollowUp/ContractNationality/GetAll)
   * jobId         = Job id
   */
  static async create(dto: CreateFollowUpRequirementDto): Promise<FollowUpRequirement> {
    const response = await api.post<any>(
      API_ENDPOINTS.CONTRACT_CREATION_REQUIREMENT.CREATE,
      {
        nationalityId: dto.nationalityId,
        jobId: dto.jobId,
        requirementsText: dto.requirementsText,
      }
    );
    return this.unwrap<FollowUpRequirement>(response.data) as FollowUpRequirement;
  }

  /**
   * PUT /Update  — id goes in the body, not the URL
   */
  static async update(dto: UpdateFollowUpRequirementDto): Promise<FollowUpRequirement> {
    const response = await api.put<any>(
      API_ENDPOINTS.CONTRACT_CREATION_REQUIREMENT.UPDATE,
      {
        id: dto.id,
        nationalityId: dto.nationalityId ?? undefined,
        jobId: dto.jobId ?? undefined,
        requirementsText: dto.requirementsText ?? undefined,
      }
    );
    return this.unwrap<FollowUpRequirement>(response.data) as FollowUpRequirement;
  }

  /**
   * DELETE /Delete/{id}
   */
  static async delete(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.CONTRACT_CREATION_REQUIREMENT.DELETE(id));
  }
}
