import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface PerformanceLog {
  id: number;
  team_member_id: number;
  task_id: string;
  estimated_duration_minutes: number;
  actual_duration_minutes: number;
  performance_score: number;
  completion_date: string;
  notes?: string;
  created_at: string;
}

interface EmployeePerformanceStats {
  id: number;
  name: string;
  role: string;
  current_performance: number;
  tasks_completed: number;
  total_tasks: number;
  avg_performance: number;
  min_performance: number;
  max_performance: number;
  avg_actual_duration: number;
  avg_estimated_duration: number;
  excellent_tasks: number;
  good_tasks: number;
  average_tasks: number;
  poor_tasks: number;
}

interface TaskWithPerformance {
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
  estimated_duration_minutes: number;
  actual_duration_minutes: number;
  performance_score: number;
  completed_by: number;
  completion_notes?: string;
  completed_by_name?: string;
  completed_by_role?: string;
  performance_level?: string;
}

interface TaskCompletionData {
  taskId: string;
  teamMemberId: number;
  actualStartTime: string;
  actualEndTime: string;
  notes?: string;
}

export const useEmployeePerformance = (managerId?: number) => {
  const [performanceStats, setPerformanceStats] = useState<EmployeePerformanceStats[]>([]);
  const [performanceLogs, setPerformanceLogs] = useState<PerformanceLog[]>([]);
  const [tasksWithPerformance, setTasksWithPerformance] = useState<TaskWithPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPerformanceData();
  }, [managerId]);

  const loadPerformanceData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Charger les statistiques de performance
      let statsQuery = supabase
        .from('employee_performance_stats')
        .select('*')
        .order('avg_performance', { ascending: false });

      // Filtrer par manager si spécifié
      if (managerId) {
        statsQuery = statsQuery.eq('manager_id', managerId);
      }

      const { data: statsData, error: statsError } = await statsQuery;
      if (statsError) throw statsError;
      setPerformanceStats(statsData || []);

      // Charger les logs de performance récents
      let logsQuery = supabase
        .from('performance_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (managerId) {
        logsQuery = logsQuery.eq('manager_id', managerId);
      }

      const { data: logsData, error: logsError } = await logsQuery;
      if (logsError) throw logsError;
      setPerformanceLogs(logsData || []);

      // Charger les tâches avec performance
      let tasksQuery = supabase
        .from('tasks_with_performance')
        .select('*')
        .order('created_at', { ascending: false });

      if (managerId) {
        tasksQuery = tasksQuery.eq('manager_id', managerId);
      }

      const { data: tasksData, error: tasksError } = await tasksQuery;
      if (tasksError) throw tasksError;
      setTasksWithPerformance(tasksData || []);

    } catch (err) {
      console.error('Erreur lors du chargement des données de performance:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const completeTask = async (completionData: TaskCompletionData) => {
    try {
      setError(null);

      const { data, error } = await supabase.rpc('update_employee_performance', {
        p_task_id: completionData.taskId,
        p_team_member_id: completionData.teamMemberId,
        p_actual_start_time: completionData.actualStartTime,
        p_actual_end_time: completionData.actualEndTime,
        p_completion_notes: completionData.notes || null
      });

      if (error) throw error;

      // Recharger les données
      await loadPerformanceData();

      return { success: true, performanceScore: data };
    } catch (err) {
      console.error('Erreur lors de la finalisation de la tâche:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const getEmployeePerformance = async (employeeId: number) => {
    try {
      const { data, error } = await supabase
        .from('employee_performance_stats')
        .select('*')
        .eq('id', employeeId)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error('Erreur lors du chargement de la performance de l\'employé:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Erreur inconnue' };
    }
  };

  const getEmployeePerformanceHistory = async (employeeId: number, days: number = 30) => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('performance_logs')
        .select('*')
        .eq('team_member_id', employeeId)
        .gte('completion_date', startDate.toISOString().split('T')[0])
        .order('completion_date', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err) {
      console.error('Erreur lors du chargement de l\'historique de performance:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Erreur inconnue' };
    }
  };

  const getTopPerformers = (limit: number = 5) => {
    return performanceStats
      .filter(emp => emp.tasks_completed > 0)
      .sort((a, b) => b.avg_performance - a.avg_performance)
      .slice(0, limit);
  };

  const getPerformanceTrend = (employeeId: number, days: number = 7) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return performanceLogs
      .filter(log => 
        log.team_member_id === employeeId && 
        new Date(log.completion_date) >= startDate
      )
      .sort((a, b) => new Date(a.completion_date).getTime() - new Date(b.completion_date).getTime());
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { level: 'Excellent', color: '#10b981', icon: '🏆' };
    if (score >= 75) return { level: 'Bon', color: '#3b82f6', icon: '📈' };
    if (score >= 50) return { level: 'Moyen', color: '#f59e0b', icon: '🎯' };
    return { level: 'À améliorer', color: '#ef4444', icon: '⚠️' };
  };

  const calculateTeamAveragePerformance = () => {
    if (performanceStats.length === 0) return 0;
    
    const totalPerformance = performanceStats.reduce((sum, emp) => sum + emp.avg_performance, 0);
    return Math.round(totalPerformance / performanceStats.length);
  };

  const getPerformanceDistribution = () => {
    const distribution = {
      excellent: 0,
      good: 0,
      average: 0,
      poor: 0
    };

    performanceStats.forEach(emp => {
      if (emp.avg_performance >= 90) distribution.excellent++;
      else if (emp.avg_performance >= 75) distribution.good++;
      else if (emp.avg_performance >= 50) distribution.average++;
      else distribution.poor++;
    });

    return distribution;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h${mins > 0 ? mins : ''}` : `${mins}min`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return {
    // Données
    performanceStats,
    performanceLogs,
    tasksWithPerformance,
    isLoading,
    error,

    // Actions
    loadPerformanceData,
    completeTask,
    getEmployeePerformance,
    getEmployeePerformanceHistory,

    // Utilitaires
    getTopPerformers,
    getPerformanceTrend,
    getPerformanceLevel,
    calculateTeamAveragePerformance,
    getPerformanceDistribution,
    formatDuration,
    formatDate,

    // Statistiques calculées
    teamAveragePerformance: calculateTeamAveragePerformance(),
    performanceDistribution: getPerformanceDistribution(),
    topPerformers: getTopPerformers(),
  };
}; 