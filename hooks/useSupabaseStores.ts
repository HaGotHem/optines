import { useState, useEffect } from 'react';

interface Store {
  id: number;
  name: string;
  city: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface StoreInput {
  name: string;
  city: string;
  address?: string;
  phone?: string;
  is_active?: boolean;
}

const API_BASE_URL = 'http://localhost:3001/api';

export const useSupabaseStores = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/stores`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement des magasins');
      }
      
      setStores(data.stores || []);
    } catch (err) {
      console.error('Erreur lors du chargement des magasins:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const createStore = async (storeData: StoreInput) => {
    try {
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/stores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(storeData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création du magasin');
      }
      
      // Recharger la liste des magasins
      await loadStores();
      return { success: true, store: data.store };
    } catch (err) {
      console.error('Erreur lors de la création du magasin:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateStore = async (id: number, updates: Partial<StoreInput>) => {
    try {
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/stores/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour du magasin');
      }
      
      // Recharger la liste des magasins
      await loadStores();
      return { success: true };
    } catch (err) {
      console.error('Erreur lors de la mise à jour du magasin:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const deleteStore = async (id: number) => {
    try {
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/stores/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression du magasin');
      }
      
      // Recharger la liste des magasins
      await loadStores();
      return { success: true };
    } catch (err) {
      console.error('Erreur lors de la suppression du magasin:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  return {
    stores,
    isLoading,
    error,
    createStore,
    updateStore,
    deleteStore,
    refreshStores: loadStores,
  };
}; 