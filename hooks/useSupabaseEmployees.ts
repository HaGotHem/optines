import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Employee {
  id: number;
  name: string;
  role: string;
  section: string;
  status: 'online' | 'busy' | 'offline' | 'break';
  rating: number;
  location: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  shift: 'matin' | 'après-midi' | 'soir';
  performance: number;
  tasks_completed: number;
  manager_id: number;
  store_id: number;
  created_at: string;
  updated_at: string;
  store_name?: string;
  store_city?: string;
  manager_name?: string;
  manager_section?: string;
}

interface EmployeeInput {
  name: string;
  role: string;
  section: string;
  location: string;
  phone?: string;
  email?: string;
  shift: 'matin' | 'après-midi' | 'soir';
  manager_id: number;
  store_id: number;
  status?: 'online' | 'busy' | 'offline' | 'break';
  rating?: number;
  performance?: number;
  tasks_completed?: number;
}

interface EmployeeFilters {
  store_id?: number;
  section?: string;
  manager_id?: number;
}

export const useSupabaseEmployees = (filters?: EmployeeFilters) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEmployees();
  }, [filters?.store_id, filters?.section, filters?.manager_id]);

  const loadEmployees = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 useSupabaseEmployees - Loading employees with filters:', filters);
      
      // Vérifier si la table team_members existe
      const { data: tableExists, error: tableError } = await supabase
        .from('team_members')
        .select('id')
        .limit(1);

      if (tableError && tableError.message.includes('does not exist')) {
        console.log('⚠️ useSupabaseEmployees - Table team_members n\'existe pas encore');
        setEmployees([]);
        return;
      }

      let query = supabase
        .from('team_members')
        .select('*');

      // Appliquer les filtres
      if (filters?.store_id) {
        query = query.eq('store_id', filters.store_id);
      }
      
      if (filters?.section) {
        query = query.eq('section', filters.section);
      }
      
      if (filters?.manager_id) {
        query = query.eq('manager_id', filters.manager_id);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }
      
      console.log('✅ useSupabaseEmployees - Employees loaded:', {
        count: data ? data.length : 0,
        employees: data ? data.map(e => ({id: e.id, name: e.name, section: e.section})) : []
      });
      
      setEmployees(data || []);
    } catch (err) {
      console.error('❌ useSupabaseEmployees - Error loading employees:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const createEmployee = async (employeeData: EmployeeInput) => {
    try {
      setError(null);
      
      console.log('🔍 useSupabaseEmployees - Creating employee:', employeeData);
      
      const { data, error } = await supabase
        .from('team_members')
        .insert([employeeData])
        .select()
        .single();

      if (error) {
        throw error;
      }
      
      console.log('✅ useSupabaseEmployees - Employee created:', data);
      
      // Recharger la liste des employés
      await loadEmployees();
      return { success: true, employee: data };
    } catch (err) {
      console.error('❌ useSupabaseEmployees - Error creating employee:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateEmployee = async (id: number, updates: Partial<EmployeeInput>) => {
    try {
      setError(null);
      
      console.log('🔍 useSupabaseEmployees - Updating employee:', { id, updates });
      
      const { data, error } = await supabase
        .from('team_members')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }
      
      console.log('✅ useSupabaseEmployees - Employee updated:', data);
      
      // Recharger la liste des employés
      await loadEmployees();
      return { success: true };
    } catch (err) {
      console.error('❌ useSupabaseEmployees - Error updating employee:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const deleteEmployee = async (id: number) => {
    try {
      setError(null);
      
      console.log('🔍 useSupabaseEmployees - Deleting employee:', id);
      
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
      
      console.log('✅ useSupabaseEmployees - Employee deleted');
      
      // Recharger la liste des employés
      await loadEmployees();
      return { success: true };
    } catch (err) {
      console.error('❌ useSupabaseEmployees - Error deleting employee:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  return {
    employees,
    isLoading,
    error,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    refreshEmployees: loadEmployees,
  };
}; 