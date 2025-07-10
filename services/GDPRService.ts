import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

export interface GDPRConsent {
  accepted: boolean;
  timestamp: string;
  version: string;
  dataProcessing: {
    essential: boolean;
    analytics: boolean;
    notifications: boolean;
    personalization: boolean;
  };
}

export interface UserDataRequest {
  id: string;
  userId: number;
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'objection';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  createdAt: string;
  completedAt?: string;
  data?: any;
}

export class GDPRService {
  private static instance: GDPRService;
  
  static getInstance(): GDPRService {
    if (!GDPRService.instance) {
      GDPRService.instance = new GDPRService();
    }
    return GDPRService.instance;
  }

  // Vérifier le consentement RGPD
  async checkConsent(): Promise<GDPRConsent | null> {
    try {
      const consentString = await AsyncStorage.getItem('gdpr_consent');
      if (consentString) {
        return JSON.parse(consentString);
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la vérification du consentement:', error);
      return null;
    }
  }

  // Sauvegarder le consentement
  async saveConsent(consent: GDPRConsent): Promise<void> {
    try {
      await AsyncStorage.setItem('gdpr_consent', JSON.stringify(consent));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du consentement:', error);
    }
  }

  // Chiffrer les données sensibles
  async encryptData(data: string): Promise<string> {
    try {
      // En production, utiliser une vraie bibliothèque de chiffrement
      // Pour cet exemple, on utilise un hash simple
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        data + 'salt_secret_key'
      );
      return hash;
    } catch (error) {
      console.error('Erreur lors du chiffrement:', error);
      return data; // Fallback non sécurisé
    }
  }

  // Déchiffrer les données
  async decryptData(encryptedData: string): Promise<string> {
    // En production, implémenter le déchiffrement
    // Pour cet exemple, on retourne les données telles quelles
    return encryptedData;
  }

  // Droit d'accès aux données
  async getUserData(userId: number): Promise<any> {
    try {
      const consent = await this.checkConsent();
      if (!consent?.accepted) {
        throw new Error('Consentement RGPD non accordé');
      }

      // Récupérer toutes les données de l'utilisateur
      const userData = {
        profile: await this.getUserProfile(userId),
        tasks: await this.getUserTasks(userId),
        preferences: await this.getUserPreferences(userId),
        activity: await this.getUserActivity(userId),
      };

      return userData;
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
      throw error;
    }
  }

  // Droit de rectification
  async updateUserData(userId: number, updates: any): Promise<void> {
    try {
      const consent = await this.checkConsent();
      if (!consent?.accepted) {
        throw new Error('Consentement RGPD non accordé');
      }

      // Mettre à jour les données utilisateur
      if (updates.profile) {
        await this.updateUserProfile(userId, updates.profile);
      }
      if (updates.preferences) {
        await this.updateUserPreferences(userId, updates.preferences);
      }

      // Enregistrer la demande de rectification
      await this.logDataRequest({
        id: this.generateRequestId(),
        userId,
        type: 'rectification',
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        data: updates,
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour des données:', error);
      throw error;
    }
  }

  // Droit d'effacement
  async deleteUserData(userId: number): Promise<void> {
    try {
      const consent = await this.checkConsent();
      if (!consent?.accepted) {
        throw new Error('Consentement RGPD non accordé');
      }

      // Supprimer toutes les données de l'utilisateur
      await this.deleteUserProfile(userId);
      await this.deleteUserTasks(userId);
      await this.deleteUserPreferences(userId);
      await this.deleteUserActivity(userId);

      // Enregistrer la demande d'effacement
      await this.logDataRequest({
        id: this.generateRequestId(),
        userId,
        type: 'erasure',
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Erreur lors de la suppression des données:', error);
      throw error;
    }
  }

  // Droit à la portabilité
  async exportUserData(userId: number): Promise<any> {
    try {
      const consent = await this.checkConsent();
      if (!consent?.accepted) {
        throw new Error('Consentement RGPD non accordé');
      }

      const userData = await this.getUserData(userId);
      
      // Formater les données pour l'export
      const exportData = {
        exportDate: new Date().toISOString(),
        userId,
        data: userData,
        format: 'JSON',
        version: '1.0',
      };

      // Enregistrer la demande d'export
      await this.logDataRequest({
        id: this.generateRequestId(),
        userId,
        type: 'portability',
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        data: exportData,
      });

      return exportData;
    } catch (error) {
      console.error('Erreur lors de l\'export des données:', error);
      throw error;
    }
  }

  // Droit d'opposition
  async objectToProcessing(userId: number, processingType: string): Promise<void> {
    try {
      const consent = await this.checkConsent();
      if (!consent?.accepted) {
        throw new Error('Consentement RGPD non accordé');
      }

      // Mettre à jour le consentement pour désactiver le traitement
      const updatedConsent = {
        ...consent,
        dataProcessing: {
          ...consent.dataProcessing,
          [processingType]: false,
        },
      };

      await this.saveConsent(updatedConsent);

      // Enregistrer l'opposition
      await this.logDataRequest({
        id: this.generateRequestId(),
        userId,
        type: 'objection',
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        data: { processingType },
      });
    } catch (error) {
      console.error('Erreur lors de l\'opposition:', error);
      throw error;
    }
  }

  // Méthodes privées pour la gestion des données
  private async getUserProfile(userId: number): Promise<any> {
    try {
      const usersString = await AsyncStorage.getItem('@users_database');
      if (usersString) {
        const users = JSON.parse(usersString);
        return users.find((user: any) => user.id === userId);
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      return null;
    }
  }

  private async getUserTasks(userId: number): Promise<any[]> {
    try {
      const tasksString = await AsyncStorage.getItem('scheduledTasks');
      if (tasksString) {
        const tasks = JSON.parse(tasksString);
        return tasks.filter((task: any) => task.managerId === userId);
      }
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des tâches:', error);
      return [];
    }
  }

  private async getUserPreferences(userId: number): Promise<any> {
    try {
      const preferencesString = await AsyncStorage.getItem(`user_preferences_${userId}`);
      if (preferencesString) {
        return JSON.parse(preferencesString);
      }
      return {};
    } catch (error) {
      console.error('Erreur lors de la récupération des préférences:', error);
      return {};
    }
  }

  private async getUserActivity(userId: number): Promise<any[]> {
    try {
      const activityString = await AsyncStorage.getItem(`user_activity_${userId}`);
      if (activityString) {
        return JSON.parse(activityString);
      }
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'activité:', error);
      return [];
    }
  }

  private async updateUserProfile(userId: number, updates: any): Promise<void> {
    try {
      const usersString = await AsyncStorage.getItem('@users_database');
      if (usersString) {
        const users = JSON.parse(usersString);
        const updatedUsers = users.map((user: any) => 
          user.id === userId ? { ...user, ...updates } : user
        );
        await AsyncStorage.setItem('@users_database', JSON.stringify(updatedUsers));
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
    }
  }

  private async updateUserPreferences(userId: number, preferences: any): Promise<void> {
    try {
      await AsyncStorage.setItem(`user_preferences_${userId}`, JSON.stringify(preferences));
    } catch (error) {
      console.error('Erreur lors de la mise à jour des préférences:', error);
    }
  }

  private async deleteUserProfile(userId: number): Promise<void> {
    try {
      const usersString = await AsyncStorage.getItem('@users_database');
      if (usersString) {
        const users = JSON.parse(usersString);
        const updatedUsers = users.filter((user: any) => user.id !== userId);
        await AsyncStorage.setItem('@users_database', JSON.stringify(updatedUsers));
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du profil:', error);
    }
  }

  private async deleteUserTasks(userId: number): Promise<void> {
    try {
      const tasksString = await AsyncStorage.getItem('scheduledTasks');
      if (tasksString) {
        const tasks = JSON.parse(tasksString);
        const updatedTasks = tasks.filter((task: any) => task.managerId !== userId);
        await AsyncStorage.setItem('scheduledTasks', JSON.stringify(updatedTasks));
      }
    } catch (error) {
      console.error('Erreur lors de la suppression des tâches:', error);
    }
  }

  private async deleteUserPreferences(userId: number): Promise<void> {
    try {
      await AsyncStorage.removeItem(`user_preferences_${userId}`);
    } catch (error) {
      console.error('Erreur lors de la suppression des préférences:', error);
    }
  }

  private async deleteUserActivity(userId: number): Promise<void> {
    try {
      await AsyncStorage.removeItem(`user_activity_${userId}`);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'activité:', error);
    }
  }

  private async logDataRequest(request: UserDataRequest): Promise<void> {
    try {
      const requestsString = await AsyncStorage.getItem('gdpr_requests');
      const requests = requestsString ? JSON.parse(requestsString) : [];
      requests.push(request);
      await AsyncStorage.setItem('gdpr_requests', JSON.stringify(requests));
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la demande:', error);
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Nettoyer les données expirées
  async cleanupExpiredData(): Promise<void> {
    try {
      const consent = await this.checkConsent();
      if (!consent) return;

      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

      // Nettoyer les données des utilisateurs inactifs depuis plus de 3 ans
      const usersString = await AsyncStorage.getItem('@users_database');
      if (usersString) {
        const users = JSON.parse(usersString);
        const activeUsers = users.filter((user: any) => {
          const lastActivity = new Date(user.lastActivity || user.createdAt);
          return lastActivity > threeYearsAgo;
        });

        if (activeUsers.length !== users.length) {
          await AsyncStorage.setItem('@users_database', JSON.stringify(activeUsers));
          console.log(`Nettoyage RGPD: ${users.length - activeUsers.length} utilisateurs supprimés`);
        }
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage des données:', error);
    }
  }
}

export const gdprService = GDPRService.getInstance(); 