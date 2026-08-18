export type AgentDetailAccessDecision = 'all' | 'own' | 'unlinked' | 'denied' | 'pending';

export function resolveAgentDetailAccess(params: {
  requestedId: string;
  ownAgentId?: string | number | null;
  canViewAll: boolean;
  canViewOwn: boolean;
  isReady: boolean;
  isLoading: boolean;
}): AgentDetailAccessDecision {
  if (!params.isReady || params.isLoading) return 'pending';
  if (params.canViewAll) return 'all';
  if (!params.canViewOwn) return 'denied';
  if (params.ownAgentId == null) return 'unlinked';
  return String(params.ownAgentId) === String(params.requestedId) ? 'own' : 'denied';
}
