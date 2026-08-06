/**
 * Agent Hooks
 * Custom hooks for agent CRUD operations using React Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AgentService } from '@/services/agent.service';
import type { Agent, CreateAgentDto, UpdateAgentDto } from '@/types/api.types';
import type { AgentQuery, PagedResponse } from '@/types/filters.types';
import { message } from 'antd';

export const AGENTS_KEY = 'agents';

/**
 * Fetch all agents
 */
export const useAgents = () => {
  return useQuery<Agent[], Error>({
    queryKey: [AGENTS_KEY],
    queryFn: AgentService.getAll,
  });
};

export const useAgentsPaged = (query?: AgentQuery) => {
  return useQuery<PagedResponse<Agent>, Error>({
    queryKey: [AGENTS_KEY, 'paged', query],
    queryFn: () => AgentService.getPaged(query),
    placeholderData: (previous) => previous,
  });
};

/**
 * Fetch agent by ID.
 *
 * Typed `id: string` (not `number`) even though `Agent.id` is declared as
 * `number` — agent ids returned by the backend are GUID strings in practice,
 * and this hook backs the `/agents/[id]` route where `params.id` is always a
 * string. `AgentService.getById` already accepts `number | string`.
 */
export const useAgent = (id: string | undefined) => {
  return useQuery<Agent, Error>({
    queryKey: [AGENTS_KEY, id],
    queryFn: () => AgentService.getById(id as string),
    enabled: !!id,
  });
};

/**
 * Create new agent
 */
export const useCreateAgent = () => {
  const queryClient = useQueryClient();

  return useMutation<Agent, Error, CreateAgentDto>({
    mutationFn: AgentService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AGENTS_KEY] });
      message.success('Agent created successfully');
    },
    onError: (error: any) => {
      console.error('Create agent error:', error);
      message.error(error?.response?.data?.message || 'Failed to create agent');
    },
  });
};

/**
 * Update agent
 */
export const useUpdateAgent = () => {
  const queryClient = useQueryClient();

  return useMutation<Agent, Error, { id: number; data: UpdateAgentDto }>({
    mutationFn: ({ id, data }) => AgentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AGENTS_KEY] });
      message.success('Agent updated successfully');
    },
    onError: (error: any) => {
      console.error('Update agent error:', error);
      message.error(error?.response?.data?.message || 'Failed to update agent');
    },
  });
};

/**
 * Delete agent
 */
export const useDeleteAgent = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: AgentService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AGENTS_KEY] });
      message.success('Agent deleted successfully');
    },
    onError: (error: any) => {
      console.error('Delete agent error:', error);
      message.error(error?.response?.data?.message || 'Failed to delete agent');
    },
  });
};
