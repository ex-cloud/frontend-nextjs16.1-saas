import { api } from "../client";
import type {
  Project,
  Board,
  TaskList,
  ProjectFilters,
  CreateProjectInput,
  ProjectMember,
  AddProjectMemberInput,
  CustomFieldDefinition,
  ProjectView,
} from "@/types/project";
import type { ApiResponse, PaginatedResponse } from "@/types/user";

const PROJECTS_ENDPOINT = "/projects";
const BOARDS_ENDPOINT = "/boards";
const LISTS_ENDPOINT = "/lists";

export const projectService = {
  // Projects
  getProjects: async (
    filters?: ProjectFilters
  ): Promise<PaginatedResponse<Project>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get<PaginatedResponse<Project>>(
      `${PROJECTS_ENDPOINT}?${params.toString()}`
    );
    return response.data;
  },

  getProject: async (id: string | number): Promise<Project> => {
    const response = await api.get<ApiResponse<Project>>(
      `${PROJECTS_ENDPOINT}/${id}`
    );
    return response.data.data;
  },

  createProject: async (data: CreateProjectInput): Promise<Project> => {
    const response = await api.post<ApiResponse<Project>>(
      PROJECTS_ENDPOINT,
      data
    );
    return response.data.data;
  },

  updateProject: async (
    id: string | number,
    data: Partial<CreateProjectInput>
  ): Promise<Project> => {
    const response = await api.put<ApiResponse<Project>>(
      `${PROJECTS_ENDPOINT}/${id}`,
      data
    );
    return response.data.data;
  },

  deleteProject: async (id: string | number): Promise<void> => {
    await api.delete(`${PROJECTS_ENDPOINT}/${id}`);
  },

  restoreProject: async (id: string | number): Promise<void> => {
    await api.post(`${PROJECTS_ENDPOINT}/${id}/restore`);
  },

  forceDeleteProject: async (id: string | number): Promise<void> => {
    await api.delete(`${PROJECTS_ENDPOINT}/${id}/force`);
  },

  // Boards
  getProjectBoards: async (projectId: string | number): Promise<Board[]> => {
    const response = await api.get<ApiResponse<Board[]>>(
      `${PROJECTS_ENDPOINT}/${projectId}/boards`
    );
    return response.data.data;
  },

  createBoard: async (
    projectId: string | number,
    name: string,
    description?: string
  ): Promise<Board> => {
    const response = await api.post<ApiResponse<Board>>(
      `${PROJECTS_ENDPOINT}/${projectId}/boards`,
      {
        name,
        description,
      }
    );
    return response.data.data;
  },

  updateBoard: async (
    boardId: string | number,
    data: { name?: string; description?: string }
  ): Promise<Board> => {
    const response = await api.put<ApiResponse<Board>>(
      `${BOARDS_ENDPOINT}/${boardId}`,
      data
    );
    return response.data.data;
  },

  deleteBoard: async (boardId: string | number): Promise<void> => {
    await api.delete(`${BOARDS_ENDPOINT}/${boardId}`);
  },

  reorderBoards: async (
    projectId: string | number,
    order: (string | number)[]
  ): Promise<void> => {
    await api.put(`${PROJECTS_ENDPOINT}/${projectId}/boards/reorder`, {
      order,
    });
  },

  // Lists
  getBoardLists: async (boardId: string | number): Promise<TaskList[]> => {
    const response = await api.get<ApiResponse<TaskList[]>>(
      `${BOARDS_ENDPOINT}/${boardId}/lists`
    );
    return response.data.data;
  },

  createList: async (
    boardId: string | number,
    name: string,
    color?: string
  ): Promise<TaskList> => {
    const response = await api.post<ApiResponse<TaskList>>(
      `${BOARDS_ENDPOINT}/${boardId}/lists`,
      {
        name,
        color,
      }
    );
    return response.data.data;
  },

  updateList: async (
    listId: string | number,
    data: { name?: string; color?: string; wip_limit?: number }
  ): Promise<TaskList> => {
    const response = await api.put<ApiResponse<TaskList>>(
      `${LISTS_ENDPOINT}/${listId}`,
      data
    );
    return response.data.data;
  },

  deleteList: async (listId: string | number): Promise<void> => {
    await api.delete(`${LISTS_ENDPOINT}/${listId}`);
  },

  reorderLists: async (
    boardId: string | number,
    order: (string | number)[]
  ): Promise<void> => {
    await api.put(`${BOARDS_ENDPOINT}/${boardId}/lists/reorder`, { order });
  },

  // Project Members
  getProjectMembers: async (
    projectId: string | number
  ): Promise<ProjectMember[]> => {
    const response = await api.get<ApiResponse<ProjectMember[]>>(
      `${PROJECTS_ENDPOINT}/${projectId}/members`
    );
    return response.data.data;
  },

  addProjectMember: async (
    projectId: string | number,
    data: AddProjectMemberInput
  ): Promise<void> => {
    await api.post(`${PROJECTS_ENDPOINT}/${projectId}/members`, data);
  },

  removeProjectMember: async (
    projectId: string | number,
    userId: string | number
  ): Promise<void> => {
    await api.delete(`${PROJECTS_ENDPOINT}/${projectId}/members/${userId}`);
  },

  // Custom Fields
  getCustomFields: async (
    projectId: string | number
  ): Promise<CustomFieldDefinition[]> => {
    const response = await api.get<ApiResponse<CustomFieldDefinition[]>>(
      `${PROJECTS_ENDPOINT}/${projectId}/custom-fields`
    );
    return response.data.data;
  },

  createCustomField: async (
    projectId: string | number,
    data: Partial<CustomFieldDefinition>
  ): Promise<CustomFieldDefinition> => {
    const response = await api.post<ApiResponse<CustomFieldDefinition>>(
      `${PROJECTS_ENDPOINT}/${projectId}/custom-fields`,
      data
    );
    return response.data.data;
  },

  updateCustomField: async (
    projectId: string | number,
    fieldId: string | number,
    data: Partial<CustomFieldDefinition>
  ): Promise<CustomFieldDefinition> => {
    const response = await api.put<ApiResponse<CustomFieldDefinition>>(
      `${PROJECTS_ENDPOINT}/${projectId}/custom-fields/${fieldId}`,
      data
    );
    return response.data.data;
  },

  deleteCustomField: async (
    projectId: string | number,
    fieldId: string | number
  ): Promise<void> => {
    await api.delete(
      `${PROJECTS_ENDPOINT}/${projectId}/custom-fields/${fieldId}`
    );
  },

  // Project Views
  getProjectViews: async (
    projectId: string | number
  ): Promise<ProjectView[]> => {
    const response = await api.get<ApiResponse<ProjectView[]>>(
      `${PROJECTS_ENDPOINT}/${projectId}/views`
    );
    return response.data.data;
  },

  createProjectView: async (
    projectId: string | number,
    data: Partial<ProjectView>
  ): Promise<ProjectView> => {
    const response = await api.post<ApiResponse<ProjectView>>(
      `${PROJECTS_ENDPOINT}/${projectId}/views`,
      data
    );
    return response.data.data;
  },

  updateProjectView: async (
    projectId: string | number,
    viewId: string | number,
    data: Partial<ProjectView>
  ): Promise<ProjectView> => {
    const response = await api.put<ApiResponse<ProjectView>>(
      `${PROJECTS_ENDPOINT}/${projectId}/views/${viewId}`,
      data
    );
    return response.data.data;
  },

  deleteProjectView: async (
    projectId: string | number,
    viewId: string | number
  ): Promise<void> => {
    await api.delete(`${PROJECTS_ENDPOINT}/${projectId}/views/${viewId}`);
  },
};

export default projectService;
