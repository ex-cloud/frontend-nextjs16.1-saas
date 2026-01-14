import { Department } from './hrm';
import { User } from './user';

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskType = 'task' | 'bug' | 'story' | 'epic';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ProjectMemberRole = 'manager' | 'member' | 'observer';

export interface Project {
  id: string | number;
  name: string;
  key: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date?: string;
  due_date?: string;
  budget?: number;
  owner_id: string | number;
  department_id?: string | number;
  team_id?: string | number;
  progress: number;
  
  // Relationships
  owner?: User;
  department?: Department; // To be refined if needed
  members?: User[];
  explicit_members?: ProjectMember[];
  
  permissions?: {
    can_edit: boolean;
    can_delete: boolean;
    can_manage_members: boolean;
  };
  boards?: Board[];
  
  // Stats
  tasks_count?: number;
  members_count?: number;
  
  created_at: string;
  updated_at: string;
}

export interface Board {
  id: string | number;
  project_id: string | number;
  name: string;
  description?: string;
  type: string;
  is_default: boolean;
  position: number;
  settings?: Record<string, unknown>;
  
  // Relationships
  lists?: TaskList[];
  
  created_at: string;
  updated_at: string;
}

export interface TaskList {
  id: string | number;
  board_id: string | number;
  name: string;
  slug: string;
  type?: string;
  color?: string;
  position: number;
  wip_limit?: number;
  
  // Relationships
  tasks?: Task[];
  
  // Stats
  tasks_count?: number;
  
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string | number;
  task_number: string;
  project_id: string | number;
  board_id: string | number;
  list_id: string | number;
  parent_id?: string | number | null;
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  status: string;
  position: number;
  reporter_id: string | number;
  assignee_id?: string | number | null;
  due_date?: string;
  completed_at?: string;
  estimated_hours?: number;
  story_points?: number;
  tags?: string[];
  
  // Relationships
  assignee?: User;
  reporter?: User;
  subtasks?: Task[];
  blockers?: TaskDependency[];
  blocking?: TaskDependency[];
  
  created_at: string;
  updated_at: string;
}

export interface TaskDependency {
  id: string | number;
  task_id: string | number;
  blocker_task_id: string | number;
  dependency_type: string;
  
  // Relationships
  task?: Task;
  blocker_task?: Task;
  
  created_at: string;
  updated_at: string;
}

export interface TimeLog {
  id: string | number;
  task_id: string | number;
  user_id: string | number;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  description?: string;
  is_manual: boolean;
  
  // Relationships
  task?: Task;
  user?: User;
  
  created_at: string;
  updated_at: string;
}

export interface ProjectFilters {
  search?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  owner_id?: string | number;
  department_id?: string | number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
  only_trashed?: boolean;
}

export interface CreateProjectInput {
  name: string;
  key: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  start_date?: string;
  due_date?: string;
  budget?: number;
  owner_id?: string | number;
  department_id?: string | number;
  team_id?: string | number;
}

export interface WipStatus {
  is_over_limit: boolean;
  current_count: number;
  limit: number;
}

export interface AiSuggestAssigneeResponse {
  suggested_assignee_id: string | number;
  reasoning: string;
  confidence: number;
}

export interface AiGenerateSubtasksResponse {
  subtasks: {
    title: string;
    description?: string;
    priority: TaskPriority;
  }[];
}

export interface TimeSummaryResponse {
  total_minutes: number;
  total_hours: number;
  logs_by_date: Record<string, number>;
  logs_by_task: Record<string, {
    task_title: string;
    minutes: number;
  }>;
}

export interface Comment {
  id: string | number;
  user_id: string | number;
  body: string;
  created_at: string;
  author: User;
  children?: Comment[];
}
export interface ProjectMember {
  id: string | number; // This is the ID of the membership record (or the user ID if simplified, but Resource suggests pivot structure)
  user_id: string | number;
  project_id: string | number;
  
  // The user object is nested
  user?: User; 
  
  // Pivot details are often at the top level in the resource, 
  // OR nested in 'membership' if I mapped it that way?
  // Checking ProjectMemberResource.php (Step 9307):
  // returns: 'role' => $this->role, 
  // returns: 'user' => new UserResource(...)
  // So 'role' is top-level in the JSON.
  
  role: ProjectMemberRole;
  assigned_at?: string;
  is_team_assignment?: boolean;
  
  // If we want to keep backward compatibility with "membership" access pattern 
  // or if we used it in the frontend, we might need to adjust.
  // But ProjectMemberResource output is flat + nested user.
  
  // Let's align with the actual Resource output we saw earlier or inferred:
  // Resource has: id, project_id, user_id, role, assigned_at, user(object), team(object)
  
  membership?: { // Accessor for consistency if needed, but better to use flat props if API is flat
      role: ProjectMemberRole;
      assigned_at: string;
      team_id?: string | number | null;
  };
}

export interface AddProjectMemberInput {
  user_id?: string | number | null;
  team_id?: string | number | null;
  role: ProjectMemberRole;
}
