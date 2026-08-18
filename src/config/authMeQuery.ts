export const AUTH_TOKEN_REFRESHED_EVENT = 'sigma:auth-token-refreshed';
export const AUTH_ME_QUERY_KEY = ['auth', 'me'] as const;

export function subscribeToAuthTokenRefresh(refetchMe: () => unknown) {
  if (typeof window === 'undefined') return () => {};
  const refetchClaims = () => {
    void refetchMe();
  };
  window.addEventListener(AUTH_TOKEN_REFRESHED_EVENT, refetchClaims);
  return () => window.removeEventListener(AUTH_TOKEN_REFRESHED_EVENT, refetchClaims);
}
