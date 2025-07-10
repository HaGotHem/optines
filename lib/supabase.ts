import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration Supabase - Clés réelles
const supabaseUrl = 'https://vqwgnvrhcaosnjczuwth.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODc0MjQsImV4cCI6MjA2NzU2MzQyNH0.3R5XkNZGMLmLUI1A5iExLnhsIyiwIyz0Azu7eInQHq4';

// Créer le client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

// Types pour les tables Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: number;
          username: string;
          password_hash: string;
          full_name: string;
          role: 'manager' | 'director';
          section: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          last_login: string | null;
          avatar_url: string | null;
        };
        Insert: {
          id?: number;
          username: string;
          password_hash: string;
          full_name: string;
          role: 'manager' | 'director';
          section?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          id?: number;
          username?: string;
          password_hash?: string;
          full_name?: string;
          role?: 'manager' | 'director';
          section?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
          avatar_url?: string | null;
        };
      };
      team_members: {
        Row: {
          id: number;
          name: string;
          role: string;
          status: 'online' | 'busy' | 'offline' | 'break';
          rating: number;
          location: string;
          phone: string | null;
          email: string | null;
          avatar_url: string | null;
          shift: string;
          performance: number;
          tasks_completed: number;
          manager_id: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          role: string;
          status?: 'online' | 'busy' | 'offline' | 'break';
          rating?: number;
          location: string;
          phone?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          shift: string;
          performance?: number;
          tasks_completed?: number;
          manager_id: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          role?: string;
          status?: 'online' | 'busy' | 'offline' | 'break';
          rating?: number;
          location?: string;
          phone?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          shift?: string;
          performance?: number;
          tasks_completed?: number;
          manager_id?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      scheduled_tasks: {
        Row: {
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
          is_pinned: boolean;
          is_completed: boolean;
          manager_id: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
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
          is_pinned?: boolean;
          is_completed?: boolean;
          manager_id: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          start_time?: string;
          end_time?: string;
          duration?: string;
          date?: string;
          packages?: number;
          team_size?: number;
          manager_section?: string;
          manager_initials?: string;
          palette_condition?: boolean;
          is_pinned?: boolean;
          is_completed?: boolean;
          manager_id?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      task_assignments: {
        Row: {
          id: number;
          task_id: string;
          team_member_id: number;
          assigned_at: string;
        };
        Insert: {
          id?: number;
          task_id: string;
          team_member_id: number;
          assigned_at?: string;
        };
        Update: {
          id?: number;
          task_id?: string;
          team_member_id?: number;
          assigned_at?: string;
        };
      };
      user_preferences: {
        Row: {
          id: number;
          user_id: number;
          theme: 'light' | 'dark' | 'auto';
          notifications_enabled: boolean;
          reminder_time: number;
          language: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          user_id: number;
          theme?: 'light' | 'dark' | 'auto';
          notifications_enabled?: boolean;
          reminder_time?: number;
          language?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          user_id?: number;
          theme?: 'light' | 'dark' | 'auto';
          notifications_enabled?: boolean;
          reminder_time?: number;
          language?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Types TypeScript pour faciliter l'utilisation
export type User = Database['public']['Tables']['users']['Row'];
export type TeamMember = Database['public']['Tables']['team_members']['Row'];
export type ScheduledTask = Database['public']['Tables']['scheduled_tasks']['Row'];
export type TaskAssignment = Database['public']['Tables']['task_assignments']['Row'];
export type UserPreference = Database['public']['Tables']['user_preferences']['Row'];

// Types pour les insertions
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type TeamMemberInsert = Database['public']['Tables']['team_members']['Insert'];
export type ScheduledTaskInsert = Database['public']['Tables']['scheduled_tasks']['Insert'];
export type TaskAssignmentInsert = Database['public']['Tables']['task_assignments']['Insert'];
export type UserPreferenceInsert = Database['public']['Tables']['user_preferences']['Insert'];

// Types pour les mises à jour
export type UserUpdate = Database['public']['Tables']['users']['Update'];
export type TeamMemberUpdate = Database['public']['Tables']['team_members']['Update'];
export type ScheduledTaskUpdate = Database['public']['Tables']['scheduled_tasks']['Update'];
export type TaskAssignmentUpdate = Database['public']['Tables']['task_assignments']['Update'];
export type UserPreferenceUpdate = Database['public']['Tables']['user_preferences']['Update']; 