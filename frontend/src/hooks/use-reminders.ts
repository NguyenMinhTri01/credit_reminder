import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { IReminder, IPaginatedResponse } from '@/shared';
import type { CreateReminderFormData, UpdateReminderFormData } from '@/lib/validations';

const REMINDERS_KEY = ['reminders'] as const;

export function useReminders(params?: { page?: number; limit?: number; search?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.search) searchParams.set('search', params.search);

  const queryString = searchParams.toString();
  const endpoint = `/reminders${queryString ? `?${queryString}` : ''}`;

  return useQuery({
    queryKey: [...REMINDERS_KEY, params],
    queryFn: () => apiClient.get<IPaginatedResponse<IReminder>>(endpoint),
  });
}

export function useReminder(id: string) {
  return useQuery({
    queryKey: [...REMINDERS_KEY, id],
    queryFn: () => apiClient.get<IReminder>(`/reminders/${id}`),
    enabled: !!id,
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReminderFormData) =>
      apiClient.post<IReminder>('/reminders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REMINDERS_KEY });
    },
  });
}

export function useUpdateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReminderFormData }) =>
      apiClient.patch<IReminder>(`/reminders/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REMINDERS_KEY });
    },
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete<IReminder>(`/reminders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REMINDERS_KEY });
    },
  });
}
