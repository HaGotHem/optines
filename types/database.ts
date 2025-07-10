export interface TeamMember {
  id: number;
  name: string;
  role?: string;
  avatar_url?: string;
  managerId?: number;
  status?: 'online' | 'offline' | 'busy';
  performance?: number;
  tasks_completed?: number;
}

export interface ScheduledTask {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  duration: string;
  date: string;
  packages: number;
  team_size: number;
  manager_section: string;
  manager_initials: string;
  palette_condition: boolean;
  team_members?: number[];
  is_pinned?: boolean;
  is_completed?: boolean;
  manager_id?: string;
}

export interface TaskFilters {
  managerId?: number;
  date?: string;
  status?: string;
} 