import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
  manager_id: string;
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
  manager_id: string;
  store_id?: number;
}

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'weekdays' | 'custom';

interface EventFilters {
  managerId?: string;
  isActive?: boolean;
}

interface EventStats {
  totalEvents: number;
  activeEvents: number;
  inactiveEvents: number;
  recurringEvents: number;
}

// Données temporaires pour les événements récurrents
const getMockEvents = (managerId?: string): ScheduledEvent[] => {
  if (!managerId) return [];
  
  return [
    {
      id: 'mock-1',
      title: 'Mise en rayon matinale',
      start_time: '05:00',
      duration_minutes: 120,
      packages: 50,
      team_size: 2,
      manager_section: 'Fruits & Légumes',
      manager_initials: 'TH',
      palette_condition: true,
      recurrence_type: 'weekdays',
      recurrence_days: [1, 2, 3, 4, 5], // Lundi à vendredi
      start_date: '2024-01-01',
      end_date: null,
      is_active: true,
      manager_id: managerId,
      store_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'mock-2',
      title: 'Réapprovisionnement weekly',
      start_time: '08:00',
      duration_minutes: 180,
      packages: 80,
      team_size: 3,
      manager_section: 'Épicerie',
      manager_initials: 'TH',
      palette_condition: false,
      recurrence_type: 'weekly',
      recurrence_days: null,
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      is_active: true,
      manager_id: managerId,
      store_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'mock-3',
      title: 'Inventaire mensuel',
      start_time: '06:00',
      duration_minutes: 240,
      packages: 30,
      team_size: 4,
      manager_section: 'Tout magasin',
      manager_initials: 'TH',
      palette_condition: true,
      recurrence_type: 'custom',
      recurrence_days: [1], // Tous les lundis
      start_date: '2024-01-01',
      end_date: null,
      is_active: false,
      manager_id: managerId,
      store_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
};

export const useSupabaseEvents = (filters: EventFilters = {}) => {
  const [events, setEvents] = useState<ScheduledEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingMockData, setIsUsingMockData] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [filters.managerId]);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Vérifier si la table existe
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
        // Si la table n'existe pas, utiliser des données fictives
        if (error.message.includes('does not exist') || error.message.includes('relation')) {
          console.log('🔧 Table scheduled_events non trouvée, utilisation de données factices');
          setIsUsingMockData(true);
          setEvents(getMockEvents(filters.managerId));
          setError('Table scheduled_events non configurée. Utilisation de données d\'exemple.');
          return;
        }
        throw error;
      }
      
      setIsUsingMockData(false);
      setEvents(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des événements:', err);
      
      // En cas d'erreur, utiliser des données factices
      console.log('🔧 Erreur de chargement, utilisation de données factices');
      setIsUsingMockData(true);
      setEvents(getMockEvents(filters.managerId));
      setError('Impossible de charger les événements depuis la base de données. Utilisation de données d\'exemple.');
    } finally {
      setIsLoading(false);
    }
  };

  const createEvent = async (eventData: EventInput) => {
    try {
      setError(null);
      
      if (isUsingMockData) {
        // Mode factice : ajouter un événement temporaire
        const newEvent: ScheduledEvent = {
          ...eventData,
          id: `mock-${Date.now()}`,
          store_id: eventData.store_id || 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          palette_condition: eventData.palette_condition || false,
          is_active: eventData.is_active !== false
        };
        
        setEvents(prev => [newEvent, ...prev]);
        return { success: true, event: newEvent };
      }
      
      const eventDataWithStore = {
        ...eventData,
        store_id: eventData.store_id || 1
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
      
      if (isUsingMockData) {
        // Mode factice : mettre à jour l'événement localement
        setEvents(prev => prev.map(event => 
          event.id === id 
            ? { ...event, ...updates, updated_at: new Date().toISOString() }
            : event
        ));
        return { success: true, event: null };
      }
      
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
      
      if (isUsingMockData) {
        // Mode factice : supprimer l'événement localement
        setEvents(prev => prev.filter(event => event.id !== id));
        return { success: true };
      }
      
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
      // Cette fonction génère les tâches pour une date donnée
      // basée sur les événements récurrents actifs
      const activeEvents = events.filter(event => event.is_active);
      let generatedCount = 0;

      for (const event of activeEvents) {
        const shouldGenerate = shouldGenerateForDate(event, date);
        if (shouldGenerate) {
          // Créer une tâche basée sur l'événement
          const taskData = {
            title: event.title,
            description: `Tâche générée automatiquement depuis l'événement récurrent`,
            start_time: event.start_time,
            end_time: calculateEndTime(event.start_time, event.duration_minutes),
            date: date,
            packages: event.packages,
            team_size: event.team_size,
            manager_section: event.manager_section,
            manager_initials: event.manager_initials,
            palette_condition: event.palette_condition,
            manager_id: event.manager_id,
            store_id: event.store_id
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
    if (eventDate < startDate || (endDate && eventDate > endDate)) {
      return false;
    }

    switch (event.recurrence_type) {
      case 'daily':
        return true;
      case 'weekly':
        return eventDate.getDay() === startDate.getDay();
      case 'weekdays':
        const day = eventDate.getDay();
        return day >= 1 && day <= 5; // Lundi à vendredi
      case 'custom':
        return event.recurrence_days?.includes(eventDate.getDay()) || false;
      default:
        return false;
    }
  };

  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
    
    return endDate.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getRecurrenceDescription = (event: ScheduledEvent): string => {
    switch (event.recurrence_type) {
      case 'daily':
        return 'Tous les jours';
      case 'weekly':
        const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        const startDay = new Date(event.start_date).getDay();
        return `Chaque ${dayNames[startDay]}`;
      case 'weekdays':
        return 'Du lundi au vendredi';
      case 'custom':
        if (event.recurrence_days && event.recurrence_days.length > 0) {
          const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
          return event.recurrence_days.map(day => dayNames[day]).join(', ');
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

    // Commencer à partir d'aujourd'hui ou de la date de début si elle est dans le futur
    let nextDate = new Date(Math.max(today.getTime(), startDate.getTime()));

    // Chercher la prochaine occurrence valide
    for (let i = 0; i < 365; i++) { // Limiter à un an pour éviter les boucles infinies
      if (endDate && nextDate > endDate) {
        return null;
      }

      if (shouldGenerateForDate(event, nextDate.toISOString().split('T')[0])) {
        return nextDate;
      }

      nextDate.setDate(nextDate.getDate() + 1);
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
    refresh: loadEvents,
    isUsingMockData
  };
}; 