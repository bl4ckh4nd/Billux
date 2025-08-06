import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Invoice } from '../types/invoice';

export const useProjectInvoices = (projectId: string | undefined) => {
  return useQuery<Invoice[], Error>({
    queryKey: ['invoices', 'project', projectId],
    queryFn: () => projectId ? api.invoices.getByProject(projectId) : Promise.resolve([]),
    enabled: !!projectId
  });
};