import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, orpc } from '../lib/api';
import type { Project, CreateProjectDTO } from '../types/project';

export const useProjects = () => {
  return useQuery({
    ...orpc.projects.getAll.queryOptions({ initialData: [] as Project[] })
  });
};

export const useProject = (id: string) => {
  return useQuery({
    ...orpc.projects.get.queryOptions({
      input: { id },
      enabled: !!id
    })
  });
};

export const useCustomerProjects = (customerId: string) => {
  return useQuery({
    ...orpc.projects.getByCustomer.queryOptions({
      input: { customerId },
      initialData: [] as Project[]
    })
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectDTO) => api.projects.create(data),
    onSuccess: (newProject: Project) => {
      queryClient.setQueryData(orpc.projects.getAll.queryKey(), (old: Project[] = []) => [...old, newProject]);
      queryClient.setQueryData(
        orpc.projects.getByCustomer.queryKey({ input: { customerId: newProject.customerId } }),
        (old: Project[] = []) => [...old, newProject]
      );
      queryClient.invalidateQueries({ queryKey: orpc.projects.getAll.queryKey() });
    }
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) => 
      api.projects.update(id, data),
    onSuccess: (updatedProject: Project) => {
      queryClient.setQueryData(orpc.projects.get.queryKey({ input: { id: updatedProject.id } }), updatedProject);
      queryClient.setQueryData(orpc.projects.getAll.queryKey(), (old: Project[] = []) =>
        old.map(project => project.id === updatedProject.id ? updatedProject : project)
      );
      queryClient.invalidateQueries({ queryKey: orpc.projects.getAll.queryKey() });
      queryClient.invalidateQueries({
        queryKey: orpc.projects.getByCustomer.queryKey({ input: { customerId: updatedProject.customerId } })
      });
    }
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.projects.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: orpc.projects.get.queryKey({ input: { id } }) });
      queryClient.setQueryData(orpc.projects.getAll.queryKey(), (old: Project[] = []) =>
        old.filter(project => project.id !== id)
      );
      queryClient.invalidateQueries({ queryKey: orpc.projects.getAll.queryKey() });
    }
  });
};
