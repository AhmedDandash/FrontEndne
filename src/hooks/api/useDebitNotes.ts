import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { DebitNoteService } from '@/services/debit-note.service';
import { getApiErrorMessage } from '@/utils/api-error';
import type { AccountingDocumentFilterDto, CreateDebitNoteDto } from '@/types/api.types';

const QUERY_KEY = ['debit-notes'];

export function useDebitNotes(filters?: AccountingDocumentFilterDto) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters],
    queryFn: () => DebitNoteService.getAll(filters),
    placeholderData: (previous) => previous,
  });
}

export function useDebitNote(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => DebitNoteService.getById(id!),
    enabled: !!id,
  });
}

export function useDebitNoteTrace(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, id, 'trace'],
    queryFn: () => DebitNoteService.getTrace(id!),
    enabled: !!id,
  });
}

export function useCreateDebitNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDebitNoteDto) => DebitNoteService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      message.success('تمت إضافة إشعار المدين بنجاح / Debit note created successfully');
    },
    onError: (err) => {
      message.error(getApiErrorMessage(err, 'فشل إضافة إشعار المدين / Failed to create debit note'));
    },
  });
}
