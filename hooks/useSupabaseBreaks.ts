import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Break {
  id: number;
  employee_id: number;
  break_type: 'pause' | 'dejeuner' | 'cafe';
  start_time: string;
  end_time: string;
  date: string;
  description?: string;
  repeat_days?: number[]; // 0=Dimanche, 1=Lundi, etc.
  created_at: string;
  updated_at: string;
}

interface BreakFilters {
  employee_id?: number;
  date?: string;
  break_type?: string;
  manager_id?: string; // Nouveau filtre pour filtrer par manager
  team_member_ids?: number[]; // Nouveau filtre pour filtrer par employés de l'équipe
}

interface CreateBreakData {
  employee_id: number;
  break_type: 'pause' | 'dejeuner' | 'cafe';
  start_time: string;
  end_time: string;
  date: string;
  description?: string;
  repeat_days?: number[];
}

interface UpdateBreakData {
  break_type?: 'pause' | 'dejeuner' | 'cafe';
  start_time?: string;
  end_time?: string;
  date?: string;
  description?: string;
  repeat_days?: number[];
}

export function useSupabaseBreaks(filters?: BreakFilters) {
  const [breaks, setBreaks] = useState<Break[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour récupérer les pauses
  const fetchBreaks = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('breaks')
        .select('*')
        .order('start_time', { ascending: true });

      // Appliquer les filtres
      if (filters?.employee_id) {
        query = query.eq('employee_id', filters.employee_id);
      }

      if (filters?.date) {
        query = query.eq('date', filters.date);
      }

      if (filters?.break_type) {
        query = query.eq('break_type', filters.break_type);
      }

      // Nouveau filtre : filtrer par les employés de l'équipe du manager
      if (filters?.team_member_ids && filters.team_member_ids.length > 0) {
        query = query.in('employee_id', filters.team_member_ids);
        console.log('🔍 useSupabaseBreaks - Filtrage par employés de l\'équipe:', filters.team_member_ids);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      console.log('✅ useSupabaseBreaks - Pauses récupérées:', {
        count: data ? data.length : 0,
        filters: filters,
        breaks: data ? data.map(b => ({ id: b.id, employee_id: b.employee_id, start_time: b.start_time })) : []
      });

      setBreaks(data || []);
    } catch (err) {
      console.error('Erreur lors de la récupération des pauses:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour créer une pause
  const createBreak = async (breakData: CreateBreakData) => {
    try {
      setError(null);

      const { data, error: createError } = await supabase
        .from('breaks')
        .insert([breakData])
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // Mettre à jour la liste locale
      setBreaks(prev => [...prev, data]);
      return { success: true, data };
    } catch (err) {
      console.error('Erreur lors de la création de la pause:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Fonction pour mettre à jour une pause
  const updateBreak = async (breakId: number, updates: UpdateBreakData) => {
    try {
      setError(null);

      const { data, error: updateError } = await supabase
        .from('breaks')
        .update(updates)
        .eq('id', breakId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Mettre à jour la liste locale
      setBreaks(prev => prev.map(breakItem => 
        breakItem.id === breakId ? data : breakItem
      ));

      return { success: true, data };
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la pause:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Fonction pour supprimer une pause
  const deleteBreak = async (breakId: number) => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('breaks')
        .delete()
        .eq('id', breakId);

      if (deleteError) {
        throw deleteError;
      }

      // Mettre à jour la liste locale
      setBreaks(prev => prev.filter(breakItem => breakItem.id !== breakId));

      return { success: true };
    } catch (err) {
      console.error('Erreur lors de la suppression de la pause:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Fonction pour récupérer les pauses d'un employé pour une période
  const getEmployeeBreaks = async (employeeId: number, startDate: string, endDate: string) => {
    try {
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('breaks')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      return { success: true, data: data || [] };
    } catch (err) {
      console.error('Erreur lors de la récupération des pauses de l\'employé:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Fonction pour créer des pauses récurrentes
  const createRecurringBreaks = async (
    employeeId: number,
    breakData: Omit<CreateBreakData, 'date'>,
    repeatDays: number[],
    startDate: string,
    endDate: string
  ) => {
    try {
      setError(null);

      const breaksToCreate = [];
      const currentDate = new Date(startDate);
      const endDateObj = new Date(endDate);

      while (currentDate <= endDateObj) {
        const dayOfWeek = currentDate.getDay();
        
        if (repeatDays.includes(dayOfWeek)) {
          breaksToCreate.push({
            ...breakData,
            employee_id: employeeId,
            date: currentDate.toISOString().split('T')[0]
          });
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (breaksToCreate.length === 0) {
        return { success: false, error: 'Aucune pause à créer pour la période spécifiée' };
      }

      const { data, error: createError } = await supabase
        .from('breaks')
        .insert(breaksToCreate)
        .select();

      if (createError) {
        throw createError;
      }

      // Mettre à jour la liste locale
      setBreaks(prev => [...prev, ...(data || [])]);

      return { success: true, data: data || [] };
    } catch (err) {
      console.error('Erreur lors de la création des pauses récurrentes:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Fonction pour calculer la durée des pauses qui chevauchent une période donnée
  const calculateOverlappingBreaksDuration = (
    taskStartTime: string,
    taskEndTime: string,
    employeeId: number,
    date: string
  ): number => {
    try {
      // Filtrer les pauses de l'employé pour la date donnée
      const employeeBreaksForDate = breaks.filter(
        breakItem => breakItem.employee_id === employeeId && breakItem.date === date
      );

      let totalOverlapDuration = 0;

      employeeBreaksForDate.forEach(breakItem => {
        const breakStart = breakItem.start_time;
        const breakEnd = breakItem.end_time;

        // Convertir les heures en minutes pour faciliter les calculs
        const taskStartMinutes = parseInt(taskStartTime.split(':')[0]) * 60 + parseInt(taskStartTime.split(':')[1]);
        const taskEndMinutes = parseInt(taskEndTime.split(':')[0]) * 60 + parseInt(taskEndTime.split(':')[1]);
        const breakStartMinutes = parseInt(breakStart.split(':')[0]) * 60 + parseInt(breakStart.split(':')[1]);
        const breakEndMinutes = parseInt(breakEnd.split(':')[0]) * 60 + parseInt(breakEnd.split(':')[1]);

        // Calculer l'intersection entre la tâche et la pause
        const overlapStart = Math.max(taskStartMinutes, breakStartMinutes);
        const overlapEnd = Math.min(taskEndMinutes, breakEndMinutes);

        if (overlapStart < overlapEnd) {
          // Il y a un chevauchement
          const overlapDuration = overlapEnd - overlapStart;
          totalOverlapDuration += overlapDuration;
        }
      });

      return totalOverlapDuration;
    } catch (err) {
      console.error('Erreur lors du calcul des pauses qui chevauchent:', err);
      return 0;
    }
  };

  // Charger les données au montage et quand les filtres changent
  useEffect(() => {
    fetchBreaks();
  }, [filters?.employee_id, filters?.date, filters?.break_type, filters?.team_member_ids]);

  return {
    breaks,
    isLoading,
    error,
    fetchBreaks,
    createBreak,
    updateBreak,
    deleteBreak,
    getEmployeeBreaks,
    createRecurringBreaks,
    calculateOverlappingBreaksDuration,
  };
} 