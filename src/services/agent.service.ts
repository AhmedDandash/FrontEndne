/**
 * Agent Service
 * Handles all agent-related API calls
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import type { Agent, CreateAgentDto, UpdateAgentDto } from '@/types/api.types';

export class AgentService {
  /**
   * Get all agents
   */
  static async getAll(): Promise<Agent[]> {
    const response = await api.get<Agent[]>(API_ENDPOINTS.AGENT.GET_ALL);

    // Log the actual response to debug
    console.log('📊 Agent API Response:', {
      status: response.status,
      data: response.data,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data),
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
      } else {
        console.warn('⚠️ Unexpected response structure for agents:', response.data);
      }
    }

    console.log('📦 Parsed agents:', agents.length, 'agents found');
    return agents;
  }

  /**
   * Get agent by ID
   */
  static async getById(id: number | string): Promise<Agent> {
    const response = await api.get<any>(API_ENDPOINTS.AGENT.GET_BY_ID(id));
    // The backend wraps the record in an envelope ({ data: {...} } / { result } /
    // { value }); unwrap it like getAll() does. Returning response.data raw left
    // every field undefined on the /agents/[id] detail route.
    const payload = response.data;
    return (payload?.data ?? payload?.result ?? payload?.value ?? payload) as Agent;
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
