import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MediationContractOfferService } from '@/services/mediation-contract-offer.service';
import type {
  MediationContractOffer,
  CreateMediationContractOfferDto,
  UpdateMediationContractOfferDto,
} from '@/types/api.types';
import { message } from 'antd';

const QUERY_KEY = 'mediationContractOffers';

export const useMediationOffers = () => {
  return useQuery<MediationContractOffer[], Error>({
    queryKey: [QUERY_KEY],
    queryFn: () => MediationContractOfferService.getAll(),
  });
};

export const useMediationOffer = (id: string) => {
  return useQuery<MediationContractOffer, Error>({
    queryKey: [QUERY_KEY, id],
    queryFn: () => MediationContractOfferService.getById(id),
    enabled: !!id,
  });
};

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

export const useUpdateMediationOffer = () => {
  const queryClient = useQueryClient();

  return useMutation<MediationContractOffer, Error, UpdateMediationContractOfferDto>({
    mutationFn: (data) => MediationContractOfferService.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تم تحديث العرض بنجاح / Offer updated successfully');
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'فشل تحديث العرض / Failed to update offer');
    },
  });
};

export const useDeleteMediationOffer = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
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

export const useToggleMediationOffer = () => {
  const queryClient = useQueryClient();

  return useMutation<MediationContractOffer, Error, string>({
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
