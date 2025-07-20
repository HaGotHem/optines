import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useSupabaseWorkingHours } from './useSupabaseWorkingHours';

export interface ScheduledEvent {
  id: string;
  title: string;
  start_time: string;
  duration_minutes: number;
  packages: number;
  team_size: number;
  manager_section: string;
  manager_initials: string;
  palette_condition: boolean;
  recurrence_type: RecurrenceType;
  recurrence_days: number[] | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  manager_id: number;
  store_id: number;
  created_at: string;
  updated_at: string;
}

export interface EventInput {
  title: string;
  start_time: string;
  duration_minutes: number;
  packages: number;
  team_size: number;
  manager_section: string;
  manager_initials: string;
  palette_condition?: boolean;
  recurrence_type: RecurrenceType;
  recurrence_days?: number[] | null;
  start_date: string;
  end_date?: string | null;
  is_active?: boolean;
  manager_id: number;
  store_id?: number;
}

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'weekdays' | 'custom';

interface EventFilters {
  managerId?: number;
  isActive?: boolean;
}

interface EventStats {
  totalEvents: number;
  activeEvents: number;
  inactiveEvents: number;
  recurringEvents: number;
}

export const useSupabaseEvents = (filters: EventFilters = {}) => {
  const [events, setEvents] = useState<ScheduledEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Hook pour les horaires de travail
  const { isTimeRangeWithinWorkingHours, workingHours } = useSupabaseWorkingHours({ 
    store_id: filters.store_id || 1 
  });

  useEffect(() => {
    loadEvents();
  }, [filters.managerId]);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let query = supabase
        .from('scheduled_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.managerId) {
        query = query.eq('manager_id', filters.managerId);
      }

      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      const { data, error } = await query;

      if (error) {
        if (error.message.includes('does not exist') || error.message.includes('relation')) {
          console.log('🔧 Table scheduled_events non trouvée, création en cours...');
          await createScheduledEventsTable();
          setEvents([]);
          return;
        }
        throw error;
      }
      
      setEvents(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des événements:', err);
      setEvents([]);
      setError('Impossible de charger les événements depuis la base de données.');
    } finally {
      setIsLoading(false);
    }
  };

  const createScheduledEventsTable = async () => {
    try {
      const { error } = await supabase.rpc('create_scheduled_events_table');
      if (error) {
        console.error('Erreur lors de la création de la table:', error);
      }
    } catch (err) {
      console.error('Erreur lors de la création de la table scheduled_events:', err);
    }
  };

  const createEvent = async (eventData: EventInput) => {
    try {
      setError(null);
      
      // Calculer l'heure de fin pour la validation
      const endTime = calculateEndTime(eventData.start_time, eventData.duration_minutes);
      
      // Validation des horaires de travail
      if (workingHours && !isTimeRangeWithinWorkingHours(eventData.start_time, endTime)) {
        const errorMessage = `❌ Impossible de créer l'événement : les horaires (${eventData.start_time} - ${endTime}) sont en dehors des horaires de travail du magasin (${workingHours.start_time} - ${workingHours.end_time})`;
        console.error(errorMessage);
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
      
      const eventDataWithStore = {
        ...eventData,
        store_id: eventData.store_id || 1,
        manager_id: parseInt(eventData.manager_id.toString())
      };
      
      const { data, error } = await supabase
        .from('scheduled_events')
        .insert([eventDataWithStore])
        .select()
        .single();

      if (error) throw error;
      
      setEvents(prev => [data, ...prev]);
      return { success: true, event: data };
    } catch (err) {
      console.error('Erreur lors de la création de l\'événement:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateEvent = async (id: string, updates: Partial<ScheduledEvent>) => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('scheduled_events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setEvents(prev => prev.map(event => 
        event.id === id ? data : event
      ));
      
      return { success: true, event: data };
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'événement:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      setError(null);
      
      // Supprimer d'abord toutes les tâches générées par cet événement
      const { error: tasksError } = await supabase
        .from('scheduled_tasks')
        .delete()
        .eq('recurring_event_id', id);

      if (tasksError) {
        console.warn('Erreur lors de la suppression des tâches liées:', tasksError);
      }
      
      // Supprimer l'événement récurrent
      const { error } = await supabase
        .from('scheduled_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setEvents(prev => prev.filter(event => event.id !== id));
      return { success: true };
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'événement:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const toggleEventActive = async (id: string) => {
    const event = events.find(e => e.id === id);
    if (!event) return { success: false, error: 'Événement non trouvé' };
    
    return updateEvent(id, { is_active: !event.is_active });
  };

  const generateTasksForDate = async (date: string) => {
    try {
      const activeEvents = events.filter(event => event.is_active);
      let generatedCount = 0;

      for (const event of activeEvents) {
        const shouldGenerate = shouldGenerateForDate(event, date);
        if (shouldGenerate) {
          const taskData = {
            title: event.title,
            description: `Tâche générée automatiquement depuis l'événement récurrent : ${event.title}`,
            start_time: event.start_time,
            end_time: calculateEndTime(event.start_time, event.duration_minutes),
            date: date,
            packages: event.packages,
            team_size: event.team_size,
            manager_section: event.manager_section,
            manager_initials: event.manager_initials,
            palette_condition: event.palette_condition,
            manager_id: event.manager_id,
            store_id: event.store_id,
            recurring_event_id: event.id
          };

          const { error } = await supabase
            .from('scheduled_tasks')
            .insert([taskData]);

          if (!error) {
            generatedCount++;
          }
        }
      }

      return { success: true, count: generatedCount };
    } catch (err) {
      console.error('Erreur lors de la génération des tâches:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Erreur inconnue' };
    }
  };

  const generateTasksForRange = async (startDate: string, endDate: string) => {
    let totalGenerated = 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateString = date.toISOString().split('T')[0];
      const result = await generateTasksForDate(dateString);
      if (result.success) {
        totalGenerated += result.count || 0;
      }
    }

    return { success: true, count: totalGenerated };
  };

  const shouldGenerateForDate = (event: ScheduledEvent, date: string): boolean => {
    const eventDate = new Date(date);
    const startDate = new Date(event.start_date);
    const endDate = event.end_date ? new Date(event.end_date) : null;
    
    // Vérifier si la date est dans la plage de l'événement
    if (eventDate < startDate) return false;
    if (endDate && eventDate > endDate) return false;
    
    const dayOfWeek = eventDate.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
    
    switch (event.recurrence_type) {
      case 'daily':
        return true;
      case 'weekly':
        // Générer seulement le jour de la semaine de la date de début
        return dayOfWeek === startDate.getDay();
      case 'weekdays':
        // Générer du lundi au vendredi (1-5)
        return dayOfWeek >= 1 && dayOfWeek <= 5;
      case 'custom':
        // Générer selon les jours personnalisés
        return event.recurrence_days?.includes(dayOfWeek) || false;
      default:
        return false;
    }
  };

  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  const getRecurrenceDescription = (event: ScheduledEvent): string => {
    switch (event.recurrence_type) {
      case 'daily':
        return 'Tous les jours';
      case 'weekly':
        const startDate = new Date(event.start_date);
        const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        return `Tous les ${dayNames[startDate.getDay()]}s`;
      case 'weekdays':
        return 'Lundi à vendredi';
      case 'custom':
        if (event.recurrence_days && event.recurrence_days.length > 0) {
          const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
          const days = event.recurrence_days.map(day => dayNames[day]).join(', ');
          return `Jours personnalisés: ${days}`;
        }
        return 'Jours personnalisés';
      default:
        return 'Aucune récurrence';
    }
  };

  const getNextOccurrence = (event: ScheduledEvent): Date | null => {
    if (!event.is_active) return null;
    
    const today = new Date();
    const startDate = new Date(event.start_date);
    const endDate = event.end_date ? new Date(event.end_date) : null;
    
    if (endDate && today > endDate) return null;
    
    // Chercher la prochaine occurrence
    for (let date = new Date(today); date <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); date.setDate(date.getDate() + 1)) {
      if (shouldGenerateForDate(event, date.toISOString().split('T')[0])) {
        return date;
      }
    }
    
    return null;
  };

  const getEventStats = (): EventStats => {
    const totalEvents = events.length;
    const activeEvents = events.filter(e => e.is_active).length;
    const inactiveEvents = totalEvents - activeEvents;
    const recurringEvents = events.filter(e => e.recurrence_type !== 'none').length;
    
    return {
      totalEvents,
      activeEvents,
      inactiveEvents,
      recurringEvents
    };
  };

  const refresh = () => loadEvents();

  return {
    events,
    isLoading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    toggleEventActive,
    generateTasksForDate,
    generateTasksForRange,
    getRecurrenceDescription,
    getNextOccurrence,
    getEventStats,
    refresh
  };
}; 