import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUserProfile } from './useUserProfile';

export interface WorkingHours {
  id: number;
  store_id: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UseSupabaseWorkingHoursProps {
  store_id?: number;
}

export const useSupabaseWorkingHours = ({ store_id }: UseSupabaseWorkingHoursProps = {}) => {
  const [workingHours, setWorkingHours] = useState<WorkingHours | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Récupérer le profil utilisateur pour obtenir le store_id
  const { profile: userProfile } = useUserProfile();
  
  // Utiliser le store_id fourni en paramètre ou celui de l'utilisateur connecté
  const effectiveStoreId = store_id || userProfile?.store_id || 1;

  // Charger les horaires de travail
  const loadWorkingHours = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Chargement des horaires pour le magasin:', effectiveStoreId);

      const { data, error: fetchError } = await supabase
        .from('working_hours')
        .select('*')
        .eq('store_id', effectiveStoreId)
        .eq('is_active', true)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // Aucune donnée trouvée, créer des horaires par défaut
          console.log('Aucun horaire trouvé, création d\'horaires par défaut...');
          await createDefaultWorkingHours();
          return;
        }
        throw fetchError;
      }

      setWorkingHours(data);
      console.log('✅ Horaires chargés:', data);
    } catch (err) {
      console.error('Erreur lors du chargement des horaires:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  // Créer des horaires par défaut
  const createDefaultWorkingHours = async () => {
    try {
      const defaultHours = {
        store_id: effectiveStoreId,
        start_time: '06:00',
        end_time: '21:00',
        is_active: true
      };

      const { data, error: insertError } = await supabase
        .from('working_hours')
        .insert(defaultHours)
        .select()
        .single();

      if (insertError) throw insertError;

      setWorkingHours(data);
      console.log('✅ Horaires par défaut créés:', data);
    } catch (err) {
      console.error('Erreur lors de la création des horaires par défaut:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la création des horaires par défaut');
    }
  };

  // Mettre à jour les horaires
  const updateWorkingHours = async (start_time: string, end_time: string) => {
    try {
      setError(null);

      console.log('🔄 Mise à jour des horaires pour le magasin:', effectiveStoreId, { start_time, end_time });

      const { data, error: updateError } = await supabase
        .from('working_hours')
        .update({
          start_time,
          end_time,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('store_id', effectiveStoreId)
        .select()
        .single();

      if (updateError) throw updateError;

      setWorkingHours(data);
      console.log('✅ Horaires mis à jour avec succès:', data);
      return data;
    } catch (err) {
      console.error('Erreur lors de la mise à jour des horaires:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour des horaires');
      throw err;
    }
  };

  // Valider si une heure est dans les horaires de travail
  const isWithinWorkingHours = (time: string): boolean => {
    if (!workingHours) return true; // Si pas d'horaires définis, accepter tout

    const [hours, minutes] = time.split(':').map(Number);
    const timeInMinutes = hours * 60 + minutes;

    const [startHours, startMinutes] = workingHours.start_time.split(':').map(Number);
    const startTimeInMinutes = startHours * 60 + startMinutes;

    const [endHours, endMinutes] = workingHours.end_time.split(':').map(Number);
    const endTimeInMinutes = endHours * 60 + endMinutes;

    return timeInMinutes >= startTimeInMinutes && timeInMinutes <= endTimeInMinutes;
  };

  // Valider si une plage horaire est dans les horaires de travail
  const isTimeRangeWithinWorkingHours = (startTime: string, endTime: string): boolean => {
    if (!workingHours) return true; // Si pas d'horaires définis, accepter tout

    const isStartValid = isWithinWorkingHours(startTime);
    const isEndValid = isWithinWorkingHours(endTime);

    // Vérifier aussi que la plage ne dépasse pas les horaires de fermeture
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const [storeEndHours, storeEndMinutes] = workingHours.end_time.split(':').map(Number);

    const startTimeInMinutes = startHours * 60 + startMinutes;
    const endTimeInMinutes = endHours * 60 + endMinutes;
    const storeEndTimeInMinutes = storeEndHours * 60 + storeEndMinutes;

    return isStartValid && isEndValid && endTimeInMinutes <= storeEndTimeInMinutes;
  };

  // Charger les horaires au montage du composant et quand le store_id change
  useEffect(() => {
    if (effectiveStoreId) {
      loadWorkingHours();
    }
  }, [effectiveStoreId]);

  // Synchronisation en temps réel via Supabase Realtime
  useEffect(() => {
    if (!effectiveStoreId) return;

    console.log('🔔 Configuration de la synchronisation en temps réel pour le magasin:', effectiveStoreId);

    // S'abonner aux changements de la table working_hours pour ce magasin
    const subscription = supabase
      .channel('working_hours_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'working_hours',
          filter: `store_id=eq.${effectiveStoreId}`
        },
        (payload) => {
          console.log('🔄 Changement détecté dans les horaires:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newWorkingHours = payload.new as WorkingHours;
            if (newWorkingHours.is_active) {
              setWorkingHours(newWorkingHours);
              console.log('✅ Horaires synchronisés:', newWorkingHours);
            }
          } else if (payload.eventType === 'DELETE') {
            // Si les horaires actifs sont supprimés, recharger
            loadWorkingHours();
          }
        }
      )
      .subscribe();

    // Nettoyer l'abonnement
    return () => {
      console.log('🔔 Désabonnement de la synchronisation des horaires');
      subscription.unsubscribe();
    };
  }, [effectiveStoreId]);

  return {
    workingHours,
    isLoading,
    error,
    loadWorkingHours,
    updateWorkingHours,
    isWithinWorkingHours,
    isTimeRangeWithinWorkingHours,
    storeId: effectiveStoreId
  };
}; 