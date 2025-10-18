import { useQuery } from '@tanstack/react-query';
import { orpc } from '../lib/api';
import type { Invoice } from '../types/invoice';

export const useProjectInvoices = (projectId: string | undefined) => {
  return useQuery({
    ...orpc.invoices.getByProject.queryOptions({
      input: projectId ? { projectId } : undefined,
      enabled: !!projectId,
      initialData: [] as Invoice[]
    })
  });
};