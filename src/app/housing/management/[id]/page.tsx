'use client';

/**
 * Housing detail route — Phase 3 of the modal→route migration (party/HR
 * entities), mirroring Phase 1's contract routes and Phase 2's accounting
 * documents.
 *
 * SPECIAL CASE: unlike the other Phase 3 entities, there is no
 * `GET /api/Housing/{id}` endpoint (only `getAll()` / `useHousings()` —
 * see the same constraint documented in `resolveContractRoute()`'s housing
 * probe in `src/lib/journal-entry-navigation.ts`). So this route fetches the
 * full list via `useHousings()` and finds the record client-side by id,
 * rather than a single-record fetch hook like the other 3 entities.
 *
 * The create/edit flow stays on the list page (`?openId=` still opens the
 * edit modal there via `useOpenIdParam`); this route's "Edit" action just
 * deep-links back to it.
 */
import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useHousings } from '@/hooks/api/useHousing';
import RecordDetailShell from '@/components/record-detail/RecordDetailShell';
import HousingDetailView from '../_components/HousingDetailView';

const LIST_ROUTE = '/housing/management';

export default function HousingDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  // This page has no language store toggle upstream (mirrors the list page,
  // which also hardcodes `lang: Lang = 'ar'`); keep Arabic as the primary
  // language with English fallback text for parity with the list page's `t`.
  const isAr = true;
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const { housings, isLoading, error, refetch } = useHousings();
  const housing = (housings ?? []).find((h) => h.id === id);

  const notFound = !isLoading && !error && !housing;

  return (
    <RecordDetailShell
      loading={isLoading}
      error={!notFound ? error : undefined}
      notFound={notFound}
      onRetry={() => refetch()}
      breadcrumbs={[
        { label: t('إدارة السكنات', 'Housing Management'), href: LIST_ROUTE },
        { label: housing?.name || `#${id}` },
      ]}
      backHref={LIST_ROUTE}
      title={housing?.name || `#${id}`}
      subtitle={
        housing
          ? t(
              `الإشغال: ${housing.currentOccupancy}/${housing.capacity}`,
              `Occupancy: ${housing.currentOccupancy}/${housing.capacity}`
            )
          : undefined
      }
      actions={
        housing && (
          <Button icon={<EditOutlined />} onClick={() => router.push(`${LIST_ROUTE}?openId=${housing.id}`)}>
            {t('تعديل', 'Edit')}
          </Button>
        )
      }
    >
      {housing && <HousingDetailView housing={housing} isAr={isAr} />}
    </RecordDetailShell>
  );
}
