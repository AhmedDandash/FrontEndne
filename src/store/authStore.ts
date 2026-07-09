import { create } from 'zustand';

interface AuthStore {
  language: 'ar' | 'en';
  setLanguage: (lang: 'ar' | 'en') => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isHydrated: boolean;
  setIsHydrated: (hydrated: boolean) => void;
  /** Logged-in user ID (persisted in localStorage) */
  userId: number | null;
  setUserId: (id: number | null) => void;
  /** Cached display name of the logged-in user */
  username: string | null;
  setUsername: (name: string | null) => void;
  /** Branch the user explicitly selected after login; drives the X-Branch-Id header. */
  branchId: string | null;
  setBranchId: (id: string | null) => void;
  /** Display name of the selected branch (for the header switcher). */
  branchName: string | null;
  /** Set the active branch (id + display name) in one call. */
  setBranch: (id: string | null, name: string | null) => void;
}

// Initialize language from localStorage if available
const getInitialLanguage = (): 'ar' | 'en' => {
  if (typeof window !== 'undefined') {
    const savedLang = localStorage.getItem('language');
    if (savedLang === 'ar' || savedLang === 'en') {
      return savedLang;
    }
  }
  return 'ar';
};

/** Attempt to decode the JWT stored in localStorage and return its payload. */
const decodeStoredJwt = (): Record<string, any> | null => {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  if (!token) return null;
  try {
    const payloadBase64 = token.split('.')[1];
    return JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
};

// Read user ID from localStorage; fall back to JWT decode if not found
const getInitialUserId = (): number | null => {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('userId');
    const parsed = raw ? parseInt(raw, 10) : NaN;
    if (!isNaN(parsed)) return parsed;

    // Fallback: extract from the stored JWT (handles users who logged in before
    // we added explicit userId storage)
    const payload = decodeStoredJwt();
    if (payload) {
      const id =
        payload['nameid'] ??
        payload['sub'] ??
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
      if (id !== undefined && id !== null) {
        const numId = parseInt(String(id), 10);
        if (!isNaN(numId)) {
          localStorage.setItem('userId', String(numId)); // cache for next load
          return numId;
        }
      }
    }
  }
  return null;
};

// Read cached username from localStorage; fall back to JWT name claim
const getInitialUsername = (): string | null => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('username');
    if (stored) return stored;

    // Fallback: extract from the stored JWT
    const payload = decodeStoredJwt();
    if (payload) {
      const name =
        payload['unique_name'] ??
        payload['name'] ??
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];
      if (name) {
        localStorage.setItem('username', name); // cache for next load
        return name;
      }
    }
  }
  return null;
};

// The active branch is chosen explicitly by the user after login (see BranchGate).
// We read ONLY the persisted selection here — we do NOT auto-derive it from the
// JWT, so the user always makes a deliberate choice that drives X-Branch-Id.
const getInitialBranchId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('branchId');
};

const getInitialBranchName = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('branchName');
};

/**
 * The user's "home" branch id from the JWT `branchId` claim, used only to
 * pre-highlight a sensible default in the branch selector — not to auto-select.
 */
export const getJwtBranchId = (): string | null => {
  const payload = decodeStoredJwt();
  const claim = payload?.['branchId'];
  return claim ? String(claim) : null;
};

export const useAuthStore = create<AuthStore>((set) => ({
  language: getInitialLanguage(),
  setLanguage: (lang) => set({ language: lang }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  isHydrated: false,
  setIsHydrated: (hydrated) => set({ isHydrated: hydrated }),
  userId: getInitialUserId(),
  setUserId: (id) => {
    if (typeof window !== 'undefined') {
      id !== null ? localStorage.setItem('userId', String(id)) : localStorage.removeItem('userId');
    }
    set({ userId: id });
  },
  username: getInitialUsername(),
  setUsername: (name) => {
    if (typeof window !== 'undefined') {
      name !== null ? localStorage.setItem('username', name) : localStorage.removeItem('username');
    }
    set({ username: name });
  },
  branchId: getInitialBranchId(),
  setBranchId: (id) => {
    if (typeof window !== 'undefined') {
      id !== null ? localStorage.setItem('branchId', id) : localStorage.removeItem('branchId');
    }
    set({ branchId: id });
  },
  branchName: getInitialBranchName(),
  setBranch: (id, name) => {
    if (typeof window !== 'undefined') {
      if (id !== null) {
        localStorage.setItem('branchId', id);
      } else {
        localStorage.removeItem('branchId');
      }
      if (name) {
        localStorage.setItem('branchName', name);
      } else {
        localStorage.removeItem('branchName');
      }
    }
    set({ branchId: id, branchName: name });
  },
}));
