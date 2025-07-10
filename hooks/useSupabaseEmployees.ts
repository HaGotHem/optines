import { useState, useEffect } from 'react';

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

const API_BASE_URL = 'http://localhost:3001/api';

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
      
      // Construire l'URL avec les filtres
      const queryParams = new URLSearchParams();
      if (filters?.store_id) queryParams.append('store_id', filters.store_id.toString());
      if (filters?.section) queryParams.append('section', filters.section);
      if (filters?.manager_id) queryParams.append('manager_id', filters.manager_id.toString());
      
      const url = `${API_BASE_URL}/employees${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement des employés');
      }
      
      setEmployees(data.employees || []);
    } catch (err) {
      console.error('Erreur lors du chargement des employés:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const createEmployee = async (employeeData: EmployeeInput) => {
    try {
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de l\'employé');
      }
      
      // Recharger la liste des employés
      await loadEmployees();
      return { success: true, employee: data.employee };
    } catch (err) {
      console.error('Erreur lors de la création de l\'employé:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateEmployee = async (id: number, updates: Partial<EmployeeInput>) => {
    try {
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour de l\'employé');
      }
      
      // Recharger la liste des employés
      await loadEmployees();
      return { success: true };
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'employé:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const deleteEmployee = async (id: number) => {
    try {
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression de l\'employé');
      }
      
      // Recharger la liste des employés
      await loadEmployees();
      return { success: true };
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'employé:', err);
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