import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { CreditNoteService } from '@/services/credit-note.service';
import { getApiErrorMessage } from '@/utils/api-error';
import type { AccountingDocumentFilterDto, CreateCreditNoteDto } from '@/types/api.types';

const QUERY_KEY = ['credit-notes'];

export function useCreditNotes(filters?: AccountingDocumentFilterDto) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters],
    queryFn: () => CreditNoteService.getAll(filters),
    placeholderData: (previous) => previous,
  });
}

export function useCreditNote(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => CreditNoteService.getById(id!),
    enabled: !!id,
  });
}

export function useCreditNoteTrace(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, id, 'trace'],
    queryFn: () => CreditNoteService.getTrace(id!),
    enabled: !!id,
  });
}

export function useCreateCreditNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCreditNoteDto) => CreditNoteService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      message.success('تمت إضافة إشعار الدائن بنجاح / Credit note created successfully');
    },
    onError: (err) => {
      message.error(getApiErrorMessage(err, 'فشل إضافة إشعار الدائن / Failed to create credit note'));
    },
  });
}
