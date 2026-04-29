import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { ContractNationalityService } from '@/services/contract-nationality.service';
import type { CreateContractNationalityDto, UpdateContractNationalityDto } from '@/types/api.types';

const QK = 'contract-nationalities';

export function useContractNationalities() {
  return useQuery({
    queryKey: [QK],
    queryFn: ContractNationalityService.getAll,
  });
}

export function useCreateContractNationality() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateContractNationalityDto) => ContractNationalityService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
      message.success('تمت إضافة الجنسية للموديول | Nationality added to module');
    },
    onError: () => message.error('فشل إضافة الجنسية | Failed to add nationality'),
  });
}

export function useUpdateContractNationality() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateContractNationalityDto) => ContractNationalityService.update(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
    },
    onError: () => message.error('فشل التعديل | Update failed'),
  });
}

export function useDeleteContractNationality() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => ContractNationalityService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
      message.success('تم حذف الجنسية | Nationality removed');
    },
    onError: () => message.error('فشل الحذف | Delete failed'),
  });
}
