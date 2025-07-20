import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/user';

const USERS_STORAGE_KEY = '@users_database';

// Données initiales par défaut - seulement un utilisateur admin de base
const defaultUsers: User[] = [
  // Utilisateur admin de base pour l'initialisation
  { 
    id: 0, 
    username: 'admin', 
    password: 'admin123', 
    fullName: 'Administrateur', 
    role: 'director', 
    section: null,
    createdAt: new Date().toISOString(),
    isActive: true
  }
];

export const useUserDatabase = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les utilisateurs depuis AsyncStorage
  const loadUsers = async () => {
    try {
      const storedUsers = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      } else {
        // Première fois: initialiser avec les utilisateurs par défaut
        await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
        setUsers(defaultUsers);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      setUsers(defaultUsers);
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder les utilisateurs dans AsyncStorage
  const saveUsers = async (newUsers: User[]) => {
    try {
      await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(newUsers));
      setUsers(newUsers);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des utilisateurs:', error);
    }
  };

  // Ajouter un nouvel utilisateur
  const addUser = async (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: Math.max(...users.map(u => u.id), 0) + 1,
      createdAt: new Date().toISOString(),
    };
    const newUsers = [...users, newUser];
    await saveUsers(newUsers);
    return newUser;
  };

  // Mettre à jour un utilisateur
  const updateUser = async (id: number, updates: Partial<User>) => {
    const newUsers = users.map(user => 
      user.id === id ? { ...user, ...updates } : user
    );
    await saveUsers(newUsers);
  };

  // Supprimer un utilisateur
  const deleteUser = async (id: number) => {
    try {
      console.log('🔍 Tentative de suppression de l\'utilisateur ID:', id);
      console.log('📈 Utilisateurs avant suppression:', users.length);
      
      // Vérifier si l'utilisateur existe
      const userToDelete = users.find(user => user.id === id);
      if (!userToDelete) {
        console.warn('⚠️ Utilisateur non trouvé avec ID:', id);
        throw new Error('Utilisateur non trouvé');
      }
      
      // Filtrer l'utilisateur à supprimer
      const newUsers = users.filter(user => user.id !== id);
      
      console.log('📉 Utilisateurs après suppression:', newUsers.length);
      
      // Sauvegarder immédiatement
      await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(newUsers));
      
      // Mettre à jour l'état local
      setUsers(newUsers);
      
      console.log('✅ Utilisateur supprimé avec succès:', userToDelete.fullName);
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      throw error;
    }
  };

  // Authentifier un utilisateur
  const authenticateUser = (username: string, password: string, role: 'manager' | 'director') => {
    console.log('🔐 Tentative d\'authentification:');
    console.log('  - Username:', username);
    console.log('  - Password:', password);
    console.log('  - Role:', role);
    console.log('  - Nombre d\'utilisateurs dans la DB:', users.length);
    console.log('  - Utilisateurs disponibles:', users.map(u => ({ username: u.username, role: u.role, isActive: u.isActive })));
    
    const user = users.find(user => 
      user.username === username && 
      user.password === password && 
      user.role === role &&
      user.isActive
    );
    
    if (user) {
      console.log('✅ Authentification réussie pour:', user.fullName);
    } else {
      console.log('❌ Authentification échouée - Utilisateur non trouvé ou invalide');
    }
    
    return user;
  };

  // Obtenir les utilisateurs par rôle
  const getUsersByRole = (role: 'manager' | 'director') => {
    return users.filter(user => user.role === role);
  };

  // Vérifier si un nom d'utilisateur existe déjà
  const isUsernameTaken = (username: string, excludeId?: number) => {
    return users.some(user => 
      user.username === username && user.id !== excludeId
    );
  };

  // Réinitialiser la base de données aux valeurs par défaut
  const resetToDefaults = async () => {
    await saveUsers(defaultUsers);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return {
    users,
    loading,
    addUser,
    updateUser,
    deleteUser,
    authenticateUser,
    getUsersByRole,
    isUsernameTaken,
    resetToDefaults,
    loadUsers
  };
}; 