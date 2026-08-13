/**
 * useEmploymentContractOffers / useOperatingContractOffers Hook
 * React Query hooks for Operating Contract Offer operations.
 *
 * Migration notes:
 *  - Renamed endpoint: /api/EmploymentContractOffers → /api/OperatingContractOffer
 *  - SUMMARY endpoint removed — summary query stub returns [] to avoid breaking consumers
 *  - nationalityId, jobId, branchId are now UUID strings
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
  OperatingContractOfferService,
  type OperatingContractOfferQuery,
} from '@/services/employment-contract-offer.service';
import { getApiErrorMessage } from '@/utils/api-error';
import type {
  CreateOperatingContractOfferDto,
  UpdateOperatingContractOfferDto,
} from '@/types/api.types';

const QUERY_KEY = 'operating-contract-offers';

export function useEmploymentContractOffers(
  params?: OperatingContractOfferQuery | Record<string, any>
) {
  const queryClient = useQueryClient();

  // Get all offers
  const {
    data: offers,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => OperatingContractOfferService.getAll(params),
    placeholderData: (previous) => previous,
    staleTime: 0,
  });

  // Get offer by ID
  const useOffer = (id: number | string) => {
    return useQuery({
      queryKey: [QUERY_KEY, id],
      queryFn: () => OperatingContractOfferService.getById(id),
      enabled: !!id,
    });
  };

  // Create offer
  const createMutation = useMutation({
    mutationFn: (data: CreateOperatingContractOfferDto) =>
      OperatingContractOfferService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تمت إضافة العرض بنجاح / Offer created successfully');
    },
    onError: (error: any) => {
      message.error(getApiErrorMessage(error, 'فشل إضافة العرض / Failed to create offer'));
    },
  });

  // Update offer
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: UpdateOperatingContractOfferDto }) =>
      OperatingContractOfferService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تم تحديث العرض بنجاح / Offer updated successfully');
    },
    onError: (error: any) => {
      message.error(getApiErrorMessage(error, 'فشل تحديث العرض / Failed to update offer'));
    },
  });

  // Delete offer
  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => OperatingContractOfferService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تم حذف العرض بنجاح / Offer deleted successfully');
    },
    onError: (error: any) => {
      message.error(getApiErrorMessage(error, 'فشل حذف العرض / Failed to delete offer'));
    },
  });

  return {
    /** No dedicated summary endpoint — consumers should use `offers` directly */
    summary: [] as any[],
    isSummaryLoading: isLoading,
    summaryError: error,
    refetchSummary: refetch,
    offers,
    isLoading,
    error,
    refetch,
    useOffer,
    createOffer: createMutation.mutate,
    createOfferAsync: createMutation.mutateAsync,
    updateOffer: updateMutation.mutate,
    updateOfferAsync: updateMutation.mutateAsync,
    deleteOffer: deleteMutation.mutate,
    deleteOfferAsync: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

/** @deprecated Alias for backward compatibility */
export const useOperatingContractOffers = useEmploymentContractOffers;
