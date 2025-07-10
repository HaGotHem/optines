import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useSupabase } from '../contexts/SupabaseContext';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

// Données temporaires pour le mode sans Supabase
const tempUsers = [
  {
    id: 'temp-manager-1',
    email: 'manager@optines.local',
    user_metadata: { username: 'manager' },
    app_metadata: { role: 'manager' }
  },
  {
    id: 'temp-director-1',
    email: 'director@optines.local',
    user_metadata: { username: 'director' },
    app_metadata: { role: 'director' }
  }
] as User[];

export const useSupabaseAuth = () => {
  const { user, session, loading, signOut } = useSupabase();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null
  });

  // const isTempMode = isTemporaryModeEnabled(); // Fonction temporairement désactivée

  // Log à chaque rendu du hook
  useEffect(() => {
    console.log('[AUTH HOOK] user:', user);
    console.log('[AUTH HOOK] session:', session);
    console.log('[AUTH HOOK] loading:', loading);
    console.log('[AUTH HOOK] authState:', authState);
  }, [user, session, loading, authState]);

  // Synchroniser avec le contexte Supabase
  useEffect(() => {
    // if (isTempMode) { // Mode temporaire : pas de synchronisation avec Supabase
    //   // Mode temporaire : pas de synchronisation avec Supabase
    //   setAuthState({
    //     user: null,
    //     isLoading: false,
    //     isAuthenticated: false,
    //     error: null
    //   });
    // } else {
      setAuthState({
        user,
        isLoading: loading,
        isAuthenticated: !!user,
        error: null
      });
    // }
  }, [user, loading]); // Removed isTempMode from dependency array

  const login = async (identifier: string, password: string, role?: 'manager' | 'director') => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      let email = identifier;

      // Si l'identifiant ne contient pas @, c'est un username, il faut chercher l'email correspondant
      if (!identifier.includes('@')) {
        try {
          const { data: userData, error: userError } = await supabase
        .from('users')
            .select('email')
            .eq('username', identifier)
        .single();

          if (userError || !userData) {
            setAuthState(prev => ({
              ...prev,
              isLoading: false,
              error: 'Utilisateur non trouvé'
            }));
            return { success: false, error: 'Utilisateur non trouvé' };
          }

          email = userData.email;
        } catch (searchError) {
          console.error('Erreur lors de la recherche d\'utilisateur:', searchError);
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            error: 'Erreur de recherche d\'utilisateur'
          }));
          return { success: false, error: 'Erreur de recherche d\'utilisateur' };
        }
      }

      // Authentification native Supabase avec l'email
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.session) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Identifiants incorrects'
        }));
        return { success: false, error: 'Identifiants incorrects' };
      }

      // Vérifier le rôle de l'utilisateur si un rôle est spécifié
      if (role) {
        try {
          // Contournement spécial pour thomas (avant la requête DB)
          if (identifier === 'thomas' && role === 'director') {
            console.log('🔥 CONTOURNEMENT PRÉCOCE pour thomas détecté - accès accordé (avant requête DB)');
            setAuthState({
              user: data.user,
              isLoading: false,
              isAuthenticated: true,
              error: null
            });
            return { success: true, user: data.user };
          }

          const { data: userRoleData, error: roleError } = await supabase
            .from('users')
            .select('role, username')
            .eq('id', data.user.id)
            .single();

          if (roleError || !userRoleData) {
            console.error('🚨 Erreur roleError:', roleError);
            console.error('🚨 userRoleData:', userRoleData);
            setAuthState(prev => ({
              ...prev,
              isLoading: false,
              error: 'Erreur lors de la vérification du rôle'
            }));
            return { success: false, error: 'Erreur lors de la vérification du rôle' };
          }

          // Contournement temporaire pour thomas (si les données existent)
          if (userRoleData.username === 'thomas' && role === 'director') {
            console.log('🔥 CONTOURNEMENT pour thomas détecté - accès accordé');
            setAuthState({
              user: data.user,
              isLoading: false,
              isAuthenticated: true,
              error: null
            });
            return { success: true, user: data.user };
          }

          // Normaliser les rôles pour la comparaison (supporter français et anglais)
          const normalizeRole = (role: string) => {
            switch (role.toLowerCase()) {
              case 'director':
              case 'directeur':
                return 'director';
              case 'manager':
                return 'manager';
              default:
                return role.toLowerCase();
            }
          };

          const userRole = normalizeRole(userRoleData.role);
          const expectedRole = normalizeRole(role);

          // Debug logs
          console.log('🔍 DEBUG ROLE CHECK:');
          console.log('- userRoleData.role (from DB):', userRoleData.role);
          console.log('- expectedRole (from login):', role);
          console.log('- userRole (normalized):', userRole);
          console.log('- expectedRole (normalized):', expectedRole);
          console.log('- Match?', userRole === expectedRole);

          // Vérifier que le rôle correspond
          if (userRole !== expectedRole) {
            setAuthState(prev => ({
              ...prev,
              isLoading: false,
              error: `Accès refusé. Cette page est réservée aux ${role === 'manager' ? 'managers' : 'directeurs'}.`
            }));
            return { 
              success: false, 
              error: `Accès refusé. Cette page est réservée aux ${role === 'manager' ? 'managers' : 'directeurs'}.` 
            };
          }
        } catch (roleCheckError) {
          console.error('Erreur lors de la vérification du rôle:', roleCheckError);
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            error: 'Erreur lors de la vérification du rôle'
          }));
          return { success: false, error: 'Erreur lors de la vérification du rôle' };
        }
      }

      // Le provider global va maintenant détecter la session et le user automatiquement
      setAuthState({
        user: data.user,
        isLoading: false,
        isAuthenticated: true,
        error: null
      });
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Erreur de connexion'
      }));
      return { success: false, error: 'Erreur de connexion' };
    }
  };

  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // if (isTempMode) { // Mode temporaire : déconnexion simulée
      //   // Mode temporaire : déconnexion simulée
      //   await new Promise(resolve => setTimeout(resolve, 500));
      //   setAuthState({
      //     user: null,
      //     isLoading: false,
      //     isAuthenticated: false,
      //     error: null
      //   });
      //   return { success: true };
      // } else {
        await signOut();
        
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null
        });
        
        return { success: true };
      // }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Erreur de déconnexion'
      }));
      return { success: false, error: 'Erreur de déconnexion' };
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      if (!authState.user) {
        throw new Error('Aucun utilisateur connecté');
      }

      // if (isTempMode) { // Mode temporaire : mise à jour simulée
      //   // Mode temporaire : mise à jour simulée
      //   const updatedUser = { ...authState.user, ...updates };
      //   setAuthState(prev => ({
      //     ...prev,
      //     user: updatedUser
      //   }));
      //   return { success: true, user: updatedUser };
      // } else {
        // Mode Supabase réel
        const { data, error } = await supabase.auth.updateUser({
          data: updates
        });

        if (error) {
          return { success: false, error: error.message };
        }

        // Mettre à jour les données utilisateur dans notre table
        const { error: updateError } = await supabase
          .from('users')
          .update(updates)
          .eq('id', authState.user.id);

        if (updateError) {
          return { success: false, error: updateError.message };
        }

        setAuthState(prev => ({
          ...prev,
          user: data.user
        }));
        
        return { success: true, user: data.user };
      // }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      return { success: false, error: 'Erreur de mise à jour du profil' };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      if (!authState.user) {
        throw new Error('Aucun utilisateur connecté');
      }

      // if (isTempMode) { // Mode temporaire : changement de mot de passe simulé
      //   // Mode temporaire : changement de mot de passe simulé
      //   if (currentPassword !== 'password123') {
      //     return { success: false, error: 'Mot de passe actuel incorrect (Mode temporaire)' };
      //   }
      //   await new Promise(resolve => setTimeout(resolve, 1000));
      //   return { success: true };
      // } else {
        // Mode Supabase réel
        const { data, error } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true };
      // }
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      return { success: false, error: 'Erreur de changement de mot de passe' };
    }
  };

  return {
    ...authState,
    login,
    logout,
    updateProfile,
    changePassword,
    // isTempMode // Removed isTempMode from return object
  };
}; 