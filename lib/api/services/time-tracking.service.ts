import { api } from '../client';
import type { TimeLog, TimeSummaryResponse } from '@/types/project';
import type { ApiResponse } from '@/types/user';

const TIME_TRACKING_ENDPOINT = '/time-tracking';

export const timeTrackingService = {
  getActiveTimer: async (): Promise<ApiResponse<TimeLog | null> & { is_running: boolean }> => {
    const response = await api.get<ApiResponse<TimeLog | null> & { is_running: boolean }>(`${TIME_TRACKING_ENDPOINT}/active`);
    return response.data;
  },

  startTimer: async (taskId: string | number): Promise<TimeLog> => {
    const response = await api.post<ApiResponse<TimeLog>>(`${TIME_TRACKING_ENDPOINT}/start/${taskId}`);
    return response.data.data;
  },

  stopTimer: async (description?: string): Promise<TimeLog> => {
    const response = await api.post<ApiResponse<TimeLog>>(`${TIME_TRACKING_ENDPOINT}/stop`, {
      description
    });
    return response.data.data;
  },

  logManualTime: async (taskId: string | number, data: {
    start_time: string;
    end_time: string;
    description?: string;
  }): Promise<TimeLog> => {
    const response = await api.post<ApiResponse<TimeLog>>(`/tasks/${taskId}/time-logs`, data);
    return response.data.data;
  },

  getTaskLogs: async (taskId: string | number): Promise<ApiResponse<TimeLog[]> & { total_minutes: number; total_hours: number }> => {
    const response = await api.get<ApiResponse<TimeLog[]> & { total_minutes: number; total_hours: number }>(`/tasks/${taskId}/time-logs`);
    return response.data;
  },

  getSummary: async (startDate: string, endDate: string): Promise<TimeSummaryResponse> => {
    const response = await api.get<TimeSummaryResponse>(`${TIME_TRACKING_ENDPOINT}/summary`, {
      params: { 
        start_date: startDate,
        end_date: endDate
      }
    });
    return response.data;
  },

  deleteLog: async (logId: string | number): Promise<void> => {
    await api.delete(`${TIME_TRACKING_ENDPOINT}/${logId}`);
  },
};

export default timeTrackingService;
