import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Task {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  date: string;
  packages: number;
  team_size: number;
  manager_section: string;
  manager_initials: string;
  palette_condition: boolean;
  is_pinned: boolean;
  is_completed: boolean;
  manager_id: string;
  created_at: string;
  updated_at: string;
}

interface TaskInput {
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  date: string;
  packages: number;
  team_size: number;
  manager_section: string;
  manager_initials: string;
  palette_condition?: boolean;
  is_pinned?: boolean;
  is_completed?: boolean;
  manager_id: string;
  store_id?: number;
}

interface TaskFilters {
  managerId?: string;
  date?: string;
  isCompleted?: boolean;
  isPinned?: boolean;
}

export const useSupabaseTasks = (filters: TaskFilters = {}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, [filters.managerId, filters.date]);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let query = supabase
        .from('scheduled_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.managerId) {
        query = query.eq('manager_id', filters.managerId);
      }
      
      if (filters.date) {
        query = query.eq('date', filters.date);
      }
      
      if (filters.isCompleted !== undefined) {
        query = query.eq('is_completed', filters.isCompleted);
      }
      
      if (filters.isPinned !== undefined) {
        query = query.eq('is_pinned', filters.isPinned);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setTasks(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des tâches:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const createTask = async (taskData: TaskInput) => {
    try {
      setError(null);
      
      // Ajouter automatiquement le store_id si pas présent
      const taskDataWithStore = {
        ...taskData,
        store_id: taskData.store_id || 1 // Par défaut, magasin 1
      };
      
      const { data, error } = await supabase
        .from('scheduled_tasks')
        .insert([taskDataWithStore])
        .select()
        .single();

      if (error) throw error;
      
      setTasks(prev => [data, ...prev]);
      return { success: true, task: data };
    } catch (err) {
      console.error('Erreur lors de la création de la tâche:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('scheduled_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setTasks(prev => prev.map(task => 
        task.id === id ? data : task
      ));
      
      return { success: true, task: data };
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la tâche:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const deleteTask = async (id: string) => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('scheduled_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTasks(prev => prev.filter(task => task.id !== id));
      return { success: true };
    } catch (err) {
      console.error('Erreur lors de la suppression de la tâche:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const getTaskById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('scheduled_tasks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erreur lors de la récupération de la tâche:', err);
      return null;
    }
  };

  const getTasksByDate = (date: string) => {
    // Filtrer les tâches depuis l'état local pour usage synchrone
    const filtered = tasks.filter(task => task.date === date);
    console.log('🔍 getTasksByDate (local) - Tâches pour', date, ':', filtered.length);
    return filtered;
  };

  const completeTask = async (id: string) => {
    return updateTask(id, { is_completed: true });
  };

  const assignTeamMemberToTask = async (taskId: string, teamMemberId: number) => {
    try {
      const { error } = await supabase
        .from('task_assignments')
        .insert([{
          task_id: taskId,
          team_member_id: teamMemberId
        }]);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('Erreur lors de l\'assignation:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Erreur inconnue' };
    }
  };

  const unassignTeamMemberFromTask = async (taskId: string, teamMemberId: number) => {
    try {
      const { error } = await supabase
        .from('task_assignments')
        .delete()
        .eq('task_id', taskId)
        .eq('team_member_id', teamMemberId);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('Erreur lors de la désassignation:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Erreur inconnue' };
    }
  };

  const getTaskAssignments = async (taskId: string) => {
    try {
      const { data, error } = await supabase
        .from('task_assignments')
        .select(`
          team_member_id,
          team_members (
            id,
            name,
            role,
            avatar_url
          )
        `)
        .eq('task_id', taskId);

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erreur lors de la récupération des assignations:', err);
      return [];
    }
  };

  const getLocalStats = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.is_completed).length;
    const pinnedTasks = tasks.filter(t => t.is_pinned).length;
    const totalPackages = tasks.reduce((sum, t) => sum + t.packages, 0);
    const totalTeamSize = tasks.reduce((sum, t) => sum + t.team_size, 0);

    return {
      totalTasks,
      completedTasks,
      pendingTasks: totalTasks - completedTasks,
      pinnedTasks,
      totalPackages,
      totalTeamSize,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };
  };

  const toggleTaskPin = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return { success: false, error: 'Tâche non trouvée' };
    
    return updateTask(id, { is_pinned: !task.is_pinned });
  };

  const toggleTaskComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return { success: false, error: 'Tâche non trouvée' };
    
    const newCompletionStatus = !task.is_completed;
    
    // Mettre à jour la tâche
    const result = await updateTask(id, { is_completed: newCompletionStatus });
    
    // ✅ NOUVEAUTÉ : Mettre à jour le statut des employés assignés
    if (result.success && task.team_members && Array.isArray(task.team_members)) {
      try {
        // Si la tâche devient terminée, libérer les employés (status = 'online')
        // Si la tâche redevient non-terminée, marquer les employés comme occupés (status = 'busy')
        const newStatus = newCompletionStatus ? 'online' : 'busy';
        
        console.log(`🔄 Mise à jour du statut des employés assignés à la tâche ${task.title}:`, {
          taskId: id,
          teamMembers: task.team_members,
          newTaskStatus: newCompletionStatus ? 'terminée' : 'en cours',
          newEmployeeStatus: newStatus
        });
        
        for (const employeeId of task.team_members) {
          // Utiliser l'API server.js pour mettre à jour le statut
          const response = await fetch('http://localhost:3001/api/employees/' + employeeId, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus }),
          });
          
          if (!response.ok) {
            console.warn(`⚠️ Impossible de mettre à jour le statut de l'employé ${employeeId}`);
          } else {
            console.log(`✅ Statut de l'employé ${employeeId} mis à jour: ${newStatus}`);
          }
        }
      } catch (error) {
        console.error('❌ Erreur lors de la mise à jour du statut des employés:', error);
        // Ne pas faire échouer la completion de la tâche si la mise à jour des employés échoue
      }
    }
    
    return result;
  };

  return {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    getTaskById,
    getTasksByDate,
    completeTask,
    assignTeamMemberToTask,
    unassignTeamMemberFromTask,
    getTaskAssignments,
    getLocalStats,
    toggleTaskPin,
    toggleTaskComplete,
    refresh: loadTasks
  };
}; 