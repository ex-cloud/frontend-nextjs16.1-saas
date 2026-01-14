import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectService } from "@/lib/api/services/project.service";
import type { ProjectFilters, CreateProjectInput } from "@/types/project";
import { toast } from "sonner";

export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (filters: ProjectFilters) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (id: string | number) =>
    [...projectKeys.details(), String(id)] as const,
  members: (id: string | number) =>
    [...projectKeys.detail(id), "members"] as const,
};

export function useProjects(filters: ProjectFilters) {
  return useQuery({
    queryKey: projectKeys.list(filters),
    queryFn: () => projectService.getProjects(filters),
    staleTime: 30000, // 30 seconds
  });
}

export function useProject(id: string | number) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectService.getProject(id),
    staleTime: 60000,
    enabled: !!id,
  });
}

export function useProjectMembers(id: string | number) {
  return useQuery({
    queryKey: projectKeys.members(id),
    queryFn: () => projectService.getProjectMembers(id),
    staleTime: 30000,
    enabled: !!id,
  });
}

export function useProjectBoards(projectId: string | number) {
  return useQuery({
    queryKey: ["project-boards", projectId],
    queryFn: () => projectService.getProjectBoards(projectId),
    staleTime: 60000,
    enabled: !!projectId,
  });
}

export function useBoardLists(boardId: string | number) {
  return useQuery({
    queryKey: ["board-lists", boardId],
    queryFn: () => projectService.getBoardLists(boardId),
    staleTime: 10000, // Shorter stale time for lists as they change often
    enabled: !!boardId,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectInput) =>
      projectService.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      toast.success("Project created successfully");
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string | number;
      data: Partial<CreateProjectInput>;
    }) => projectService.updateProject(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(variables.id),
      });
      toast.success("Project updated successfully");
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => projectService.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      toast.success("Project moved to trash");
    },
  });
}

export function useRestoreProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => projectService.restoreProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      toast.success("Project restored successfully");
    },
  });
}
