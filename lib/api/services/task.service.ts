import { api } from "../client";
import type {
  Task,
  TaskDependency,
  TaskType,
  TaskPriority,
  WipStatus,
  AiSuggestAssigneeResponse,
  AiGenerateSubtasksResponse,
  Comment,
  TimeLog,
} from "@/types/project";
import type { ApiResponse, PaginatedResponse } from "@/types/user";

const TASKS_ENDPOINT = "/tasks";
const LISTS_ENDPOINT = "/lists";

export const taskService = {
  // Tasks
  getListTasks: async (
    listId: string | number
  ): Promise<PaginatedResponse<Task> & { wip_status?: WipStatus }> => {
    const response = await api.get<
      PaginatedResponse<Task> & { wip_status?: WipStatus }
    >(`${LISTS_ENDPOINT}/${listId}/tasks`);
    return response.data;
  },

  createTask: async (data: {
    project_id: string | number;
    board_id: string | number;
    list_id: string | number;
    title: string;
    description?: string;
    type?: TaskType;
    priority?: TaskPriority;
    assignee_id?: string | number | null;
    due_date?: string;
    parent_id?: string | number | null;
  }): Promise<Task> => {
    const response = await api.post<ApiResponse<Task>>(TASKS_ENDPOINT, data);
    return response.data.data;
  },

  updateTask: async (
    taskId: string | number,
    data: Partial<Task>
  ): Promise<Task> => {
    const response = await api.put<ApiResponse<Task>>(
      `${TASKS_ENDPOINT}/${taskId}`,
      data
    );
    return response.data.data;
  },

  deleteTask: async (taskId: string | number): Promise<void> => {
    await api.delete(`${TASKS_ENDPOINT}/${taskId}`);
  },

  moveTask: async (
    taskId: string | number,
    listId: string | number,
    position: number
  ): Promise<Task> => {
    const response = await api.post<ApiResponse<Task>>(
      `${TASKS_ENDPOINT}/${taskId}/move`,
      {
        list_id: listId,
        position,
      }
    );
    return response.data.data;
  },

  // Dependencies
  getTaskDependencies: async (
    taskId: string | number
  ): Promise<{ blockers: TaskDependency[]; blocking: TaskDependency[] }> => {
    const response = await api.get<
      ApiResponse<{ blockers: TaskDependency[]; blocking: TaskDependency[] }>
    >(`${TASKS_ENDPOINT}/${taskId}/dependencies`);
    return response.data.data;
  },

  addDependency: async (
    taskId: string | number,
    blockerTaskId: string | number,
    type?: string
  ): Promise<TaskDependency> => {
    const response = await api.post<ApiResponse<TaskDependency>>(
      `${TASKS_ENDPOINT}/${taskId}/dependencies`,
      {
        blocker_task_id: blockerTaskId,
        dependency_type: type || "finish_to_start",
      }
    );
    return response.data.data;
  },

  deleteDependency: async (
    taskId: string | number,
    dependencyId: string | number
  ): Promise<void> => {
    await api.delete(
      `${TASKS_ENDPOINT}/${taskId}/dependencies/${dependencyId}`
    );
  },

  getAvailableBlockers: async (taskId: string | number): Promise<Task[]> => {
    const response = await api.get<ApiResponse<Task[]>>(
      `${TASKS_ENDPOINT}/${taskId}/available-blockers`
    );
    return response.data.data;
  },

  // AI Features
  suggestAssignee: async (
    projectId: string | number,
    title: string,
    description?: string
  ): Promise<AiSuggestAssigneeResponse> => {
    const response = await api.post<ApiResponse<AiSuggestAssigneeResponse>>(
      `/projects/${projectId}/tasks/ai-suggest-assignee`,
      {
        title,
        description,
      }
    );
    return response.data.data;
  },

  generateSubtasks: async (
    taskId: string | number,
    title: string,
    description?: string
  ): Promise<AiGenerateSubtasksResponse> => {
    const response = await api.post<ApiResponse<AiGenerateSubtasksResponse>>(
      `${TASKS_ENDPOINT}/ai-generate-subtasks`,
      {
        task_id: taskId,
        title,
        description,
      }
    );
    return response.data.data;
  },

  getTaskActivity: async (
    taskId: string | number
  ): Promise<
    Array<{ message: string; created_at: string; user?: { name: string } }>
  > => {
    const response = await api.get<
      ApiResponse<
        Array<{ message: string; created_at: string; user?: { name: string } }>
      >
    >(`${TASKS_ENDPOINT}/${taskId}/activity`);
    return response.data.data;
  },

  getTaskComments: async (taskId: string | number): Promise<Comment[]> => {
    const response = await api.get<ApiResponse<Comment[]>>(
      `${TASKS_ENDPOINT}/${taskId}/comments`
    );
    return response.data.data;
  },

  addComment: async (
    taskId: string | number,
    data: { body: string; parent_id?: number }
  ): Promise<Comment> => {
    const response = await api.post<ApiResponse<Comment>>(
      `${TASKS_ENDPOINT}/${taskId}/comments`,
      data
    );
    return response.data.data;
  },

  getTaskTimeLogs: async (taskId: string | number): Promise<TimeLog[]> => {
    const response = await api.get<ApiResponse<TimeLog[]>>(
      `${TASKS_ENDPOINT}/${taskId}/time-logs`
    );
    return response.data.data;
  },

  toggleTimeTracking: async (
    taskId: string | number
  ): Promise<{ is_running: boolean; data: TimeLog }> => {
    const response = await api.post<{
      success: boolean;
      is_running: boolean;
      data: TimeLog;
    }>(`${TASKS_ENDPOINT}/${taskId}/toggle-time`);
    return response.data;
  },

  getActiveTimer: async (): Promise<{
    is_running: boolean;
    data: TimeLog | null;
  }> => {
    const response = await api.get<{
      success: boolean;
      is_running: boolean;
      data: TimeLog | null;
    }>("/time-tracking/active");
    return response.data;
  },

  uploadFile: async (
    file: File
  ): Promise<{ url: string; name: string; size: number }> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<{
      success: boolean;
      data: { url: string; name: string; size: number };
    }>("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.data;
  },
};

export default taskService;
