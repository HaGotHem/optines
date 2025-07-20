import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useSupabaseWorkingHours } from './useSupabaseWorkingHours';
import { useTaskRefresh } from '../contexts/TaskRefreshContext';

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
  is_deleted: boolean;
  manager_id: string;
  created_at: string;
  updated_at: string;
}

interface TaskInput {
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  duration?: string;
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
  
  // Hook pour les horaires de travail
  const { isTimeRangeWithinWorkingHours, workingHours } = useSupabaseWorkingHours({ 
    store_id: filters.store_id || 1 
  });

  // Hook pour le rafraîchissement global
  const { refreshTrigger } = useTaskRefresh();

  useEffect(() => {
    console.log('🔄 [HOOK] useEffect déclenché - filtres changés:', filters);
    loadTasks();
  }, [filters.managerId, filters.date, filters.isCompleted, filters.isPinned]);

  // Écouter les rafraîchissements globaux
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log('🔄 [HOOK] Rafraîchissement global détecté, rechargement des tâches');
      loadTasks();
    }
  }, [refreshTrigger]);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 [HOOK] Chargement des tâches avec filtres:', filters);
      
      let query = supabase
        .from('scheduled_tasks')
        .select('*')
        // .eq('is_deleted', false) // Temporairement commenté car la colonne n'existe pas
        .order('created_at', { ascending: false });

      if (filters.managerId) {
        query = query.eq('manager_id', filters.managerId);
        console.log('🔄 [HOOK] Filtre manager_id ajouté:', filters.managerId);
      }
      
      if (filters.date) {
        query = query.eq('date', filters.date);
        console.log('🔄 [HOOK] Filtre date ajouté:', filters.date);
      }
      
      if (filters.isCompleted !== undefined) {
        query = query.eq('is_completed', filters.isCompleted);
      }
      
      if (filters.isPinned !== undefined) {
        query = query.eq('is_pinned', filters.isPinned);
      }

      const { data, error } = await query;
      
      console.log('🔄 [HOOK] Résultat de la requête:', { 
        data: data?.length || 0, 
        error,
        taskIds: data?.map(t => t.id) || []
      });

      if (error) throw error;
      
      console.log('🔄 [HOOK] Mise à jour de l\'état avec', data?.length || 0, 'tâches');
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
      
      // Validation des horaires de travail
      if (workingHours && !isTimeRangeWithinWorkingHours(taskData.start_time, taskData.end_time)) {
        const errorMessage = `❌ Impossible de créer la tâche : les horaires (${taskData.start_time} - ${taskData.end_time}) sont en dehors des horaires de travail du magasin (${workingHours.start_time} - ${workingHours.end_time})`;
        console.error(errorMessage);
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
      
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

      if (error) {
        console.error('❌ Erreur Supabase:', error.message);
        throw error;
      }
      
      setTasks(prev => [data, ...prev]);
      
      // Forcer le rechargement des tâches pour s'assurer que tout est synchronisé
      setTimeout(() => {
        loadTasks();
      }, 500);
      
      return { success: true, task: data };
    } catch (err) {
      console.error('Erreur création tâche:', err);
      
      let errorMessage = 'Erreur inconnue';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = JSON.stringify(err);
      }
      
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
      
      console.log('🔄 [HOOK] Tentative de suppression de la tâche:', id);
      
      // Suppression physique temporaire car la colonne is_deleted n'existe pas
      const { data, error } = await supabase
        .from('scheduled_tasks')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      console.log('🔄 [HOOK] Suppression réussie dans Supabase:', data);
      
      // Retirer la tâche de la liste locale
      setTasks(prev => {
        const filtered = prev.filter(task => task.id !== id);
        console.log('🔄 [HOOK] Tâches après suppression locale:', filtered.length);
        return filtered;
      });
      
      // Forcer un rechargement complet après un délai pour s'assurer de la synchronisation
      setTimeout(() => {
        console.log('🔄 [HOOK] Rechargement forcé après suppression');
        loadTasks();
      }, 1000);
      
      console.log('🔄 [HOOK] Tâche supprimée avec succès:', data);
      return { success: true, task: data };
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

  // ✅ NOUVEAU : Fonction optimisée pour calculer les colis traités en temps réel
  const getPackagesProgress = (date: string) => {
    const dateTasks = tasks.filter(t => t.date === date);
    const currentTime = new Date();
    
    let totalPackages = 0;
    let treatedPackages = 0;
    
    dateTasks.forEach(task => {
      totalPackages += task.packages || 0;
      
      if (task.is_completed) {
        // Tâche terminée : 100% des colis
        treatedPackages += task.packages || 0;
      } else {
        const start = new Date(`${task.date}T${task.start_time}`);
        const end = new Date(`${task.date}T${task.end_time}`);
        
        if (currentTime >= start && currentTime < end) {
          // Tâche en cours : proportionnel au temps écoulé
          const totalDuration = end.getTime() - start.getTime();
          const elapsedTime = currentTime.getTime() - start.getTime();
          const progressPercentage = Math.min(100, Math.max(0, (elapsedTime / totalDuration) * 100));
          const estimatedPackages = Math.floor((task.packages || 0) * (progressPercentage / 100));
          treatedPackages += estimatedPackages;
        } else if (currentTime >= end) {
          // Tâche terminée mais pas marquée : compter tous les colis
          treatedPackages += task.packages || 0;
        }
        // Tâches futures : 0 colis traités
      }
    });
    
    return {
      totalPackages,
      treatedPackages,
      progressPercentage: totalPackages > 0 ? Math.round((treatedPackages / totalPackages) * 100) : 0
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

  // Fonction pour restaurer une tâche supprimée (utile pour l'administration)
  const restoreTask = async (id: string) => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('scheduled_tasks')
        .update({ is_deleted: false, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Recharger les tâches pour inclure la tâche restaurée
      await loadTasks();
      
      console.log('🔄 [HOOK] Tâche restaurée:', data);
      return { success: true, task: data };
    } catch (err) {
      console.error('Erreur lors de la restauration de la tâche:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Fonction pour récupérer toutes les tâches (y compris supprimées) - pour l'administration
  const getAllTasks = async (includeDeleted: boolean = false) => {
    try {
      let query = supabase
        .from('scheduled_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (!includeDeleted) {
        query = query.eq('is_deleted', false);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return { success: true, tasks: data || [] };
    } catch (err) {
      console.error('Erreur lors de la récupération de toutes les tâches:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      return { success: false, error: errorMessage };
    }
  };

  return {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    restoreTask,
    getAllTasks,
    getTaskById,
    getTasksByDate,
    completeTask,
    assignTeamMemberToTask,
    unassignTeamMemberFromTask,
    getTaskAssignments,
    getLocalStats,
    getPackagesProgress,
    toggleTaskPin,
    toggleTaskComplete,
    refresh: loadTasks
  };
}; 