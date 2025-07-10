import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  role: 'manager' | 'director';
  photoUri?: string;
  section?: string;
  isActive: boolean;
  createdAt: string;
}

export class UserProfileService {
  private static instance: UserProfileService;
  private currentUser: UserProfile | null = null;

  private constructor() {}

  static getInstance(): UserProfileService {
    if (!UserProfileService.instance) {
      UserProfileService.instance = new UserProfileService();
    }
    return UserProfileService.instance;
  }

  // Récupérer le profil utilisateur actuel
  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const userString = await AsyncStorage.getItem('currentUser');
      if (userString) {
        this.currentUser = JSON.parse(userString);
        return this.currentUser;
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      return null;
    }
  }

  // Sauvegarder le profil utilisateur
  async saveCurrentUser(user: UserProfile): Promise<void> {
    try {
      this.currentUser = user;
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du profil:', error);
    }
  }

  // Changer le mot de passe
  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      // Récupérer tous les utilisateurs
      const usersString = await AsyncStorage.getItem('users');
      if (!usersString) return false;

      const users = JSON.parse(usersString);
      const currentUser = await this.getCurrentUser();
      
      if (!currentUser) return false;

      // Vérifier le mot de passe actuel
      const userIndex = users.findIndex((u: any) => u.id === currentUser.id);
      if (userIndex === -1) return false;

      // Ici, normalement on vérifierait le hash du mot de passe
      // Pour simplifier, on suppose que le mot de passe est stocké en clair
      if (users[userIndex].password !== currentPassword) {
        return false;
      }

      // Mettre à jour le mot de passe
      users[userIndex].password = newPassword;
      await AsyncStorage.setItem('users', JSON.stringify(users));

      // Mettre à jour le profil actuel
      this.currentUser = users[userIndex];
      if (this.currentUser) {
        await this.saveCurrentUser(this.currentUser);
      }

      return true;
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      return false;
    }
  }

  // Sauvegarder la photo de profil
  async saveProfilePhoto(photoUri: string): Promise<boolean> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) return false;

      // Copier l'image vers le stockage local de l'app
      const fileName = `profile_${currentUser.id}_${Date.now()}.jpg`;
      const destinationUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.copyAsync({
        from: photoUri,
        to: destinationUri
      });

      // Mettre à jour le profil avec la nouvelle photo
      currentUser.photoUri = destinationUri;
      await this.saveCurrentUser(currentUser);

      // Mettre à jour dans la liste des utilisateurs
      const usersString = await AsyncStorage.getItem('users');
      if (usersString) {
        const users = JSON.parse(usersString);
        const userIndex = users.findIndex((u: any) => u.id === currentUser.id);
        if (userIndex !== -1) {
          users[userIndex].photoUri = destinationUri;
          await AsyncStorage.setItem('users', JSON.stringify(users));
        }
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la photo:', error);
      return false;
    }
  }

  // Récupérer la photo de profil
  async getProfilePhoto(): Promise<string | null> {
    try {
      const currentUser = await this.getCurrentUser();
      return currentUser?.photoUri || null;
    } catch (error) {
      console.error('Erreur lors de la récupération de la photo:', error);
      return null;
    }
  }

  // Déconnecter l'utilisateur
  async logout(): Promise<void> {
    try {
      this.currentUser = null;
      await AsyncStorage.removeItem('currentUser');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  }
}

export const userProfileService = UserProfileService.getInstance(); 