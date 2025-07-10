import { useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'manager' | 'director' | 'admin';
  section: string | null;
  store_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  store_name?: string;
}

interface UserInput {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role: 'manager' | 'director' | 'admin';
  section?: string;
  store_id: number;
}

interface UserFilters {
  store_id?: number;
  role?: 'manager' | 'director' | 'admin';
  excludeUserId?: string; // Pour exclure l'utilisateur connecté
}

const API_BASE_URL = 'http://localhost:3001/api';

export const useSupabaseUsers = (filters?: UserFilters) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, [filters?.store_id, filters?.role]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/users`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement des utilisateurs');
      }
      
      let filteredUsers = data.users || [];
      
      // IMPORTANT: Filtrer pour ne montrer que les vrais comptes utilisateurs (directeurs et managers)
      filteredUsers = filteredUsers.filter(user => 
        user.role === 'director' || user.role === 'manager' || user.role === 'admin'
      );
      
      // Exclure l'utilisateur connecté (il ne peut pas se gérer lui-même)
      if (filters?.excludeUserId) {
        filteredUsers = filteredUsers.filter(user => user.id !== filters.excludeUserId);
      }
      
      // Appliquer les filtres spécifiques si spécifiés
      if (filters?.store_id && filters.store_id > 0) {
        filteredUsers = filteredUsers.filter(user => user.store_id === filters.store_id);
      }
      
      if (filters?.role) {
        filteredUsers = filteredUsers.filter(user => user.role === filters.role);
      }
      
      setUsers(filteredUsers);
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const createUser = async (userData: UserInput) => {
    try {
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de l\'utilisateur');
      }
      
      // Recharger la liste des utilisateurs
      await loadUsers();
      return { success: true, user: data.user };
    } catch (err) {
      console.error('Erreur lors de la création de l\'utilisateur:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateUser = async (id: string, updates: Partial<UserInput>) => {
    try {
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour de l\'utilisateur');
      }
      
      // Recharger la liste des utilisateurs
      await loadUsers();
      return { success: true };
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const deleteUser = async (id: string) => {
    try {
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression de l\'utilisateur');
      }
      
      // Recharger la liste des utilisateurs
      await loadUsers();
      return { success: true };
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const resetPassword = async (id: string, newPassword: string) => {
    try {
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/users/${id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la réinitialisation du mot de passe');
      }
      
      return { success: true };
    } catch (err) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const toggleUserStatus = async (id: string) => {
    const user = users.find(u => u.id === id);
    if (!user) return { success: false, error: 'Utilisateur non trouvé' };
    
    return updateUser(id, { is_active: !user.is_active } as any);
  };

  return {
    users,
    isLoading,
    error,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    toggleUserStatus,
    refreshUsers: loadUsers,
  };
}; 