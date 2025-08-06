import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CompanySettings } from '../types/settings';

export const useSettings = () => {
  return useQuery<CompanySettings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await fetch('/api/settings');
      return response.json();
    },
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: CompanySettings) => {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['settings'], data);
    },
  });
};

export const useUploadLogo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      const response = await fetch('/api/settings/logo', {
        method: 'POST',
        body: formData,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['settings'], (old: CompanySettings | undefined) => ({
        ...old,
        logo: data.logoUrl,
      }));
    },
  });
};
