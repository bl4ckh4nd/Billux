import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Project, CreateProjectDTO } from '../types/project';

export const useProjects = () => {
  return useQuery<Project[], Error>({
    queryKey: ['projects'],
    queryFn: api.projects.getAll,
    initialData: []
  });
};

export const useProject = (id: string) => {
  return useQuery<Project | undefined, Error>({
    queryKey: ['projects', id],
    queryFn: () => api.projects.get(id),
    enabled: !!id
  });
};

export const useCustomerProjects = (customerId: string) => {
  return useQuery<Project[], Error>({
    queryKey: ['projects', 'customer', customerId],
    queryFn: () => api.projects.getByCustomer(customerId),
    initialData: []
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectDTO) => api.projects.create(data),
    onSuccess: (newProject: Project) => {
      queryClient.setQueryData<Project[]>(['projects'], (old = []) => [...old, newProject]);
      queryClient.setQueryData<Project[]>(
        ['projects', 'customer', newProject.customerId],
        (old = []) => [...old, newProject]
      );
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) => 
      api.projects.update(id, data),
    onSuccess: (updatedProject: Project) => {
      queryClient.setQueryData<Project>(['projects', updatedProject.id], updatedProject);
      queryClient.setQueryData<Project[]>(['projects'], (old = []) => 
        old.map(project => project.id === updatedProject.id ? updatedProject : project)
      );
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'customer', updatedProject.customerId] });
    }
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.projects.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: ['projects', id] });
      queryClient.setQueryData<Project[]>(['projects'], (old = []) => 
        old.filter(project => project.id !== id)
      );
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });
};
