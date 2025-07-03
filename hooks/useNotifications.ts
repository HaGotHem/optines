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
  type: 'task_reminder' | 'conflict_alert' | 'employee_update' | 'general';
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
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // Initialiser les notifications
  useEffect(() => {
    registerForPushNotificationsAsync();
    loadNotificationSettings();

    // Écouter les notifications reçues
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // Écouter les réponses aux notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // Ici vous pouvez gérer les actions sur les notifications
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Enregistrer pour les notifications push
  const registerForPushNotificationsAsync = async () => {
    let token;

    // Sur le web, les notifications push ne sont pas supportées de la même manière
    if (Platform.OS === 'web') {
      console.log('Notifications push non supportées sur web');
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          console.log('Permission refusée pour les notifications');
          return;
        }
        
        token = (await Notifications.getExpoPushTokenAsync({
          projectId: 'your-project-id', // À remplacer par votre project ID
        })).data;
      } catch (error) {
        console.log('Erreur lors de l\'enregistrement des notifications:', error);
      }
    } else {
      console.log('Notifications push nécessitent un appareil physique');
    }

    setExpoPushToken(token);
    return token;
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