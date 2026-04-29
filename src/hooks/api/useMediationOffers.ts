/**
 * Mediation Contract Offer Hooks
 * React Query hooks for mediation contract offer operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MediationContractOfferService } from '@/services/mediation-contract-offer.service';
import type {
  MediationContractOffer,
  MediationContractOfferSummary,
  CreateMediationContractOfferDto,
  UpdateMediationContractOfferDto,
} from '@/types/api.types';
import { message } from 'antd';

const QUERY_KEY = 'mediationContractOffers';

/**
 * Fetch offer summary
 */
export const useMediationOfferSummary = () => {
  return useQuery<MediationContractOfferSummary[], Error>({
    queryKey: [QUERY_KEY, 'summary'],
    queryFn: () => MediationContractOfferService.getSummary(),
  });
};

/**
 * Fetch all offers
 */
export const useMediationOffers = () => {
  return useQuery<MediationContractOffer[], Error>({
    queryKey: [QUERY_KEY],
    queryFn: () => MediationContractOfferService.getAll(),
  });
};

/**
 * Fetch offer by ID
 */
export const useMediationOffer = (id: number | string) => {
  return useQuery<MediationContractOffer, Error>({
    queryKey: [QUERY_KEY, id],
    queryFn: () => MediationContractOfferService.getById(id),
    enabled: !!id,
  });
};

/**
 * Create new offer
 */
export const useCreateMediationOffer = () => {
  const queryClient = useQueryClient();

  return useMutation<MediationContractOffer, Error, CreateMediationContractOfferDto>({
    mutationFn: (data) => MediationContractOfferService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تمت إضافة العرض بنجاح / Offer created successfully');
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'فشل إضافة العرض / Failed to create offer');
    },
  });
};

/**
 * Update offer
 */
export const useUpdateMediationOffer = () => {
  const queryClient = useQueryClient();

  return useMutation<
    MediationContractOffer,
    Error,
    { id: number | string; data: UpdateMediationContractOfferDto }
  >({
    mutationFn: ({ id, data }) => MediationContractOfferService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تم تحديث العرض بنجاح / Offer updated successfully');
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'فشل تحديث العرض / Failed to update offer');
    },
  });
};

/**
 * Delete offer
 */
export const useDeleteMediationOffer = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number | string>({
    mutationFn: (id) => MediationContractOfferService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تم حذف العرض بنجاح / Offer deleted successfully');
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'فشل حذف العرض / Failed to delete offer');
    },
  });
};

/**
 * Toggle active status of an offer
 */
export const useToggleMediationOffer = () => {
  const queryClient = useQueryClient();

  return useMutation<MediationContractOffer, Error, number | string>({
    mutationFn: (id) => MediationContractOfferService.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (error: any) => {
      message.error(
        error?.response?.data?.message || 'فشل تغيير حالة العرض / Failed to toggle offer status'
      );
    },
  });
};
