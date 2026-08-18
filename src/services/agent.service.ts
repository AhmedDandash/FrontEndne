/**
 * Agent Service
 * Handles all agent-related API calls
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import { buildListParams } from '@/lib/api/buildListParams';
import type { Agent, CreateAgentDto, UpdateAgentDto } from '@/types/api.types';
import type { AgentQuery, PagedResponse } from '@/types/filters.types';

export class AgentService {
  /**
   * Get all agents.
   *
   * Sends a large PageSize explicitly — the backend defaults to a small page
   * size (10) when none is supplied, which silently truncates this "get
   * everything" method once more than 10 agents exist (the identical bug
   * found and fixed in JobService/NationalityService this session).
   */
  static async getAll(): Promise<Agent[]> {
    const response = await api.get<any>(API_ENDPOINTS.AGENT.GET_ALL, {
      params: { PageSize: 9999 },
    });

    // Handle different response structures
    let agents: Agent[] = [];

    if (Array.isArray(response.data)) {
      agents = response.data;
    } else if (response.data && typeof response.data === 'object') {
      // Check if data is nested (common patterns: data.data, data.result, data.items, data.agents)
      const data = response.data as any;
      if (Array.isArray(data.data)) {
        agents = data.data;
      } else if (Array.isArray(data.result)) {
        agents = data.result;
      } else if (Array.isArray(data.items)) {
        agents = data.items;
      } else if (Array.isArray(data.agents)) {
        agents = data.agents;
      } else if (Array.isArray(data.data?.items)) {
        // Paginated envelope: { success, data: { items, totalCount, ... }, errors, statusCode }
        agents = data.data.items;
      }
    }

    return agents;
  }

  /**
   * Get agent by ID
   */
  static async getPaged(query?: AgentQuery): Promise<PagedResponse<Agent>> {
    const params = buildListParams(query as Record<string, unknown>);
    const response = await api.get<any>(API_ENDPOINTS.AGENT.GET_ALL, { params });
    const payload = response.data?.data ?? response.data?.result ?? response.data?.value ?? response.data;
    const items = Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload)
        ? payload
        : [];

    return {
      items,
      totalCount: payload?.totalCount ?? items.length,
      pageNumber: payload?.pageNumber ?? query?.PageNumber ?? 1,
      pageSize: payload?.pageSize ?? query?.PageSize ?? 10,
    };
  }

  static async getById(id: number | string): Promise<Agent> {
    const response = await api.get<any>(API_ENDPOINTS.AGENT.GET_BY_ID(id));
    // The backend wraps the record in an envelope ({ data: {...} } / { result } /
    // { value }); unwrap it like getAll() does. Returning response.data raw left
    // every field undefined on the /agents/[id] detail route.
    const payload = response.data;
    return (payload?.data ?? payload?.result ?? payload?.value ?? payload) as Agent;
  }

  static async getMe(): Promise<Agent | null> {
    try {
      const response = await api.get<any>(API_ENDPOINTS.AGENT.ME);
      const payload = response.data?.data ?? response.data?.result ?? response.data?.value ?? response.data;
      return payload ? (payload as Agent) : null;
    } catch (error: any) {
      if (error?.response?.status === 404) return null;
      throw error;
    }
  }

  /**
   * Create new agent
   */
  static async create(data: CreateAgentDto): Promise<Agent> {
    const response = await api.post<Agent>(API_ENDPOINTS.AGENT.CREATE, data);
    return response.data;
  }

  /**
   * Update agent — new API requires id in body (UpdateAgentDto.id)
   */
  static async update(id: number | string, data: UpdateAgentDto): Promise<Agent> {
    const payload: UpdateAgentDto = { ...data, id: String(id) };
    const response = await api.put<Agent>(API_ENDPOINTS.AGENT.UPDATE(id), payload);
    return response.data;
  }

  /**
   * Delete agent
   */
  static async delete(id: number | string): Promise<void> {
    await api.delete(API_ENDPOINTS.AGENT.DELETE(id));
  }
}
