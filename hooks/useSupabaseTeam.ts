import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface TeamMember {
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
  manager_id: string;
  created_at: string;
  updated_at: string;
}

interface TeamMemberInput {
  name: string;
  role: string;
  status?: 'online' | 'busy' | 'offline' | 'break';
  rating?: number;
  location?: string;
  phone?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  shift?: string;
  performance?: number;
  tasks_completed?: number;
  manager_id: string;
  store_id?: number;
}

export const useSupabaseTeam = (managerId?: string | number) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔍 useSupabaseTeam - managerId changed:', {
      managerId,
      type: typeof managerId,
      isValidId: managerId !== undefined && managerId !== null
    });
    
    if (managerId !== undefined && managerId !== null) {
      loadTeamMembers();
    }
  }, [managerId]);

  const loadTeamMembers = async () => {
    if (managerId === undefined || managerId === null) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 useSupabaseTeam - Loading members for managerId:', managerId.toString());
      
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('manager_id', managerId.toString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('✅ useSupabaseTeam - Members loaded:', {
        count: data ? data.length : 0,
        members: data ? data.map(m => ({id: m.id, name: m.name})) : []
      });
      
      setMembers(data || []);
    } catch (err) {
      console.error('❌ useSupabaseTeam - Error loading members:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const addTeamMember = async (memberData: TeamMemberInput) => {
    try {
      setError(null);
      
      // Ajouter automatiquement le store_id si pas présent
      const memberDataWithStore = {
        ...memberData,
        store_id: memberData.store_id || 1 // Par défaut, magasin 1
      };
      
      const { data, error } = await supabase
        .from('team_members')
        .insert([memberDataWithStore])
        .select()
        .single();

      if (error) throw error;
      
      setMembers(prev => [data, ...prev]);
      return { success: true, member: data };
    } catch (err) {
      console.error('Erreur lors de l\'ajout du membre:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateTeamMember = async (id: number, updates: Partial<TeamMember>) => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('team_members')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setMembers(prev => prev.map(member => 
        member.id === id ? data : member
      ));
      
      return { success: true, member: data };
    } catch (err) {
      console.error('Erreur lors de la mise à jour du membre:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const deleteTeamMember = async (id: number) => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setMembers(prev => prev.filter(member => member.id !== id));
      return { success: true };
    } catch (err) {
      console.error('Erreur lors de la suppression du membre:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const getTeamMemberById = async (id: number) => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erreur lors de la récupération du membre:', err);
      return null;
    }
  };

  const getTeamStats = async () => {
    if (managerId === undefined || managerId === null) return null;
    
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('status, performance, tasks_completed')
        .eq('manager_id', managerId.toString());

      if (error) throw error;
      
      const stats = {
        totalMembers: data.length,
        onlineMembers: data.filter(m => m.status === 'online').length,
        averagePerformance: data.reduce((sum, m) => sum + m.performance, 0) / data.length || 0,
        totalTasksCompleted: data.reduce((sum, m) => sum + m.tasks_completed, 0)
      };
      
      return stats;
    } catch (err) {
      console.error('Erreur lors du calcul des statistiques:', err);
      return null;
    }
  };

  return {
    members,
    isLoading,
    error,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
    getTeamMemberById,
    getTeamStats,
    refresh: loadTeamMembers
  };
}; 