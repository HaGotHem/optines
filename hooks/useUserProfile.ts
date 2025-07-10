import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useSupabaseAuth } from './useSupabaseAuth';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'manager' | 'director' | 'directeur' | 'admin';
  section: string | null;
  store_id: number;
  is_active: boolean;
  store_name?: string;
  store_city?: string;
}

export const useUserProfile = () => {
  const { user, isAuthenticated } = useSupabaseAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserProfile();
    } else {
      setProfile(null);
      setIsLoading(false);
    }
  }, [user, isAuthenticated]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // CONTOURNEMENT TEMPORAIRE pour Thomas
      if (user?.email === 'thomas@h4-advisors.com') {
        console.log('🔧 Contournement temporaire pour Thomas - vue users_with_store non disponible');
        const thomasProfile: UserProfile = {
          id: user.id,
          username: 'thomas',
          email: 'thomas@h4-advisors.com',
          full_name: 'Thomas H4-Advisors',
          role: 'director',
          section: null,
          store_id: 1, // Magasin par défaut
          is_active: true,
          store_name: 'Magasin Paris Centre',
          store_city: 'Paris'
        };
        setProfile(thomasProfile);
        return;
      }

      // Essayer d'abord la vue users_with_store (si elle existe)
      let profileData = null;
      const { data: viewData, error: viewError } = await supabase
        .from('users_with_store')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (!viewError && viewData) {
        profileData = viewData;
      } else {
        console.log('🔄 Vue users_with_store non disponible, utilisation de la table users...');
        
        // Récupérer depuis la table users directement
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user?.id)
          .single();

        if (userError) {
          console.error('❌ Erreur lors du chargement depuis users:', userError);
          setError('Erreur lors du chargement du profil utilisateur');
          return;
        }

        // Créer un profil avec les données disponibles (sans store_id)
        profileData = {
          ...userData,
          store_id: 1, // Valeur par défaut
          store_name: 'Magasin par défaut',
          store_city: 'Non défini'
        };
      }

      // Normaliser les données du profil
      const normalizedProfile: UserProfile = {
        id: profileData.id || user?.id,
        username: profileData.username || 'unknown',
        email: profileData.email || user?.email || '',
        full_name: profileData.full_name || 'Utilisateur',
        role: profileData.role || 'manager',
        section: profileData.section || null,
        store_id: profileData.store_id || 1,
        is_active: profileData.is_active !== false,
        store_name: profileData.store_name || 'Magasin par défaut',
        store_city: profileData.store_city || 'Non défini'
      };

      setProfile(normalizedProfile);
    } catch (err) {
      console.error('❌ Erreur lors du chargement du profil:', err);
      setError('Erreur lors du chargement du profil utilisateur');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    profile,
    isLoading,
    error,
    refreshProfile: loadUserProfile,
  };
}; 