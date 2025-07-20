import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationSettings {
  taskReminders: boolean;
  conflictAlerts: boolean;
  employeeUpdates: boolean;
  reminderTime: number; // minutes avant la tâche
}

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  data?: any;
  scheduledDate?: Date;
  type: 'task_reminder' | 'conflict_alert' | 'employee_update' | 'task_created' | 'general';
}

export interface NotificationHistoryItem {
  id: string;
  title: string;
  body: string;
  data?: any;
  date: string; // ISO string
  read: boolean;
}

export const useNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<Notifications.Notification>();
  const [settings, setSettings] = useState<NotificationSettings>({
    taskReminders: true,
    conflictAlerts: true,
    employeeUpdates: true,
    reminderTime: 15, // 15 minutes par défaut
  });
  const [notificationsHistory, setNotificationsHistory] = useState<NotificationHistoryItem[]>([]);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // Initialiser les notifications
  useEffect(() => {
    // Désactiver temporairement les notifications push pour éviter les erreurs
    console.log('Notifications push temporairement désactivées');
    
    // Charger seulement les paramètres et l'historique
    loadNotificationSettings();
    loadNotificationsHistory();

    // Écouter les notifications reçues (locales seulement)
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
      addNotificationToHistory(notification);
    });

    // Écouter les réponses aux notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // Ici vous pouvez gérer les actions sur les notifications
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  // Ajouter une notification à l'historique
  const addNotificationToHistory = async (notif: Notifications.Notification) => {
    const item: NotificationHistoryItem = {
      id: notif.request.identifier || Date.now().toString(),
      title: notif.request.content.title,
      body: notif.request.content.body,
      data: notif.request.content.data,
      date: new Date().toISOString(),
      read: false,
    };
    try {
      const existing = await AsyncStorage.getItem('notificationsHistory');
      const arr: NotificationHistoryItem[] = existing ? JSON.parse(existing) : [];
      arr.unshift(item); // Ajoute en haut
      await AsyncStorage.setItem('notificationsHistory', JSON.stringify(arr));
      setNotificationsHistory(arr);
    } catch (e) {
      console.error('Erreur ajout historique notif', e);
    }
  };

  // Charger l'historique
  const loadNotificationsHistory = async () => {
    try {
      const existing = await AsyncStorage.getItem('notificationsHistory');
      setNotificationsHistory(existing ? JSON.parse(existing) : []);
    } catch (e) {
      setNotificationsHistory([]);
    }
  };

  // Vider l'historique
  const clearNotificationsHistory = async () => {
    await AsyncStorage.removeItem('notificationsHistory');
    setNotificationsHistory([]);
  };

  // Marquer une notification comme lue
  const markNotificationRead = async (id: string) => {
    try {
      const arr = [...notificationsHistory];
      const idx = arr.findIndex(n => n.id === id);
      if (idx !== -1) {
        arr[idx].read = true;
        await AsyncStorage.setItem('notificationsHistory', JSON.stringify(arr));
        setNotificationsHistory(arr);
      }
    } catch (e) {}
  };

  // Enregistrer pour les notifications push
  const registerForPushNotificationsAsync = async () => {
    // Désactiver complètement les notifications push pour éviter les erreurs
    console.log('Notifications push complètement désactivées');
    return null;
  };

  // Charger les paramètres de notification
  const loadNotificationSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('notificationSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres de notification:', error);
    }
  };

  // Sauvegarder les paramètres de notification
  const saveNotificationSettings = async (newSettings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres de notification:', error);
    }
  };

  // Programmer une notification locale
  const scheduleLocalNotification = async (notificationData: NotificationData) => {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data || {},
          sound: 'default',
        },
        trigger: notificationData.scheduledDate ? {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notificationData.scheduledDate,
        } : null,
      });
      
      console.log('Notification programmée:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Erreur lors de la programmation de la notification:', error);
    }
  };

  // Envoyer une notification immédiate
  const sendImmediateNotification = async (title: string, body: string, data?: any) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: 'default',
        },
        trigger: null, // Notification immédiate
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);
    }
  };

  // Programmer un rappel de tâche
  const scheduleTaskReminder = async (taskData: any) => {
    if (!settings.taskReminders) return;

    const taskDate = new Date(taskData.date + 'T' + taskData.startTime);
    const reminderDate = new Date(taskDate.getTime() - (settings.reminderTime * 60 * 1000));

    // Ne pas programmer si le rappel est dans le passé
    if (reminderDate <= new Date()) return;

    // Sur le web, utiliser setTimeout au lieu de notifications programmées
    if (Platform.OS === 'web') {
      const delayMs = reminderDate.getTime() - new Date().getTime();
      if (delayMs > 0) {
        setTimeout(() => {
          sendImmediateNotification(
            '🕐 Rappel de tâche',
            `La tâche "${taskData.title}" commence dans ${settings.reminderTime} minutes`,
            { taskId: taskData.id, type: 'task_reminder' }
          );
        }, delayMs);
        console.log(`Rappel programmé pour le web dans ${Math.round(delayMs / 1000)} secondes`);
      }
      return;
    }

    await scheduleLocalNotification({
      id: `task_reminder_${taskData.id}`,
      title: '🕐 Rappel de tâche',
      body: `La tâche "${taskData.title}" commence dans ${settings.reminderTime} minutes`,
      data: { taskId: taskData.id, type: 'task_reminder' },
      scheduledDate: reminderDate,
      type: 'task_reminder',
    });
  };

  // Envoyer une alerte de conflit
  const sendConflictAlert = async (conflictData: any) => {
    if (!settings.conflictAlerts) return;

    await sendImmediateNotification(
      '⚠️ Conflit de planning détecté',
      `Conflit détecté pour la tâche "${conflictData.title}"`,
      { type: 'conflict_alert', conflictData }
    );
  };

  // Annuler une notification programmée
  const cancelScheduledNotification = async (notificationId: string) => {
    try {
      // Vérifier si la plateforme supporte cette fonctionnalité
      if (Platform.OS === 'web') {
        console.log('cancelScheduledNotificationAsync non supporté sur web');
        return;
      }
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('Notification annulée:', notificationId);
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la notification:', error);
    }
  };

  // Annuler toutes les notifications programmées
  const cancelAllScheduledNotifications = async () => {
    try {
      // Vérifier si la plateforme supporte cette fonctionnalité
      if (Platform.OS === 'web') {
        console.log('cancelAllScheduledNotificationsAsync non supporté sur web');
        return;
      }
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Toutes les notifications ont été annulées');
    } catch (error) {
      console.error('Erreur lors de l\'annulation des notifications:', error);
    }
  };

  // Obtenir toutes les notifications programmées
  const getScheduledNotifications = async () => {
    try {
      // Vérifier si la plateforme supporte cette fonctionnalité
      if (Platform.OS === 'web') {
        console.log('getAllScheduledNotificationsAsync non supporté sur web');
        return [];
      }
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      return [];
    }
  };

  return {
    expoPushToken,
    notification,
    notificationsHistory,
    addNotificationToHistory,
    clearNotificationsHistory,
    markNotificationRead,
    settings,
    scheduleLocalNotification,
    sendImmediateNotification,
    scheduleTaskReminder,
    sendConflictAlert,
    cancelScheduledNotification,
    cancelAllScheduledNotifications,
    getScheduledNotifications,
    saveNotificationSettings,
    loadNotificationSettings,
  };
}; 