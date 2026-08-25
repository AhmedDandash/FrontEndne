/**
 * Nationality Options Hook
 * Consolidates the language-aware label logic that used to be copy-pasted as
 * local `getNationalityLabel`/`getNationalityName` helpers in customers/page.tsx
 * and agents/page.tsx. Backs the shared `NationalitySelect` component.
 */

import { useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNationalities } from './useNationalities';
import type { Nationality } from '@/types/api.types';
import type { NationalityListParams } from '@/services/nationality.service';

export interface NationalityOption {
  value: string;
  label: string;
}

export function useNationalityOptions(params?: NationalityListParams) {
  const language = useAuthStore((state) => state.language);
  const { data, isLoading, isFetching, refetch } = useNationalities(params);

  const nationalities: Nationality[] = useMemo(() => {
    const raw: any = data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.$values)) return raw.$values;
    return [];
  }, [data]);

  const getLabel = useMemo(
    () =>
      (n: Pick<Nationality, 'nationalityNameAr' | 'nationalityNameEn'>): string =>
        language === 'ar'
          ? n.nationalityNameAr || n.nationalityNameEn || ''
          : n.nationalityNameEn || n.nationalityNameAr || '',
    [language]
  );

  const options: NationalityOption[] = useMemo(
    () => nationalities.map((n) => ({ value: String(n.id), label: getLabel(n) })),
    [nationalities, getLabel]
  );

  return { nationalities, options, isLoading, isFetching, getLabel, language, refetch };
}
