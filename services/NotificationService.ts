import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotifications } from '../hooks/useNotifications';

interface SmartReminder {
  id: string;
  taskId: string;
  taskTitle: string;
  reminderTime: string; // Format: "HH:MM"
  reminderDate: string; // Format: "YYYY-MM-DD"
  type: 'start' | 'preparation' | 'team_ready' | 'efficiency_alert';
  message: string;
  isEnabled: boolean;
  teamLoadPercentage?: number;
  suggestedTeamSize?: number;
}

export class NotificationService {
  private static instance: NotificationService;
  private notificationHook: ReturnType<typeof useNotifications> | null = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  setNotificationHook(hook: ReturnType<typeof useNotifications>) {
    this.notificationHook = hook;
  }

  // Programmer un rappel pour une tâche
  async scheduleTaskReminder(task: any) {
    if (!this.notificationHook) {
      console.warn('Notification hook not initialized');
      return;
    }

    await this.notificationHook.scheduleTaskReminder(task);
  }

  // Envoyer une alerte de conflit
  async sendConflictAlert(conflictData: any) {
    if (!this.notificationHook) {
      console.warn('Notification hook not initialized');
      return;
    }

    await this.notificationHook.sendConflictAlert(conflictData);
  }

  // Envoyer une notification immédiate
  async sendImmediateNotification(title: string, body: string, data?: any) {
    if (!this.notificationHook) {
      console.warn('Notification hook not initialized');
      return;
    }

    await this.notificationHook.sendImmediateNotification(title, body, data);
  }

  // Notifier un changement d'équipe
  async notifyTeamChange(changeType: 'added' | 'removed' | 'updated', employeeName: string) {
    const messages = {
      added: `👥 ${employeeName} a été ajouté(e) à l'équipe`,
      removed: `👋 ${employeeName} a été retiré(e) de l'équipe`,
      updated: `✏️ Les informations de ${employeeName} ont été mises à jour`,
    };

    await this.sendImmediateNotification(
      'Mise à jour équipe',
      messages[changeType],
      { type: 'employee_update', changeType, employeeName }
    );
  }

  // Notifier une tâche en retard
  async notifyTaskOverdue(task: any) {
    await this.sendImmediateNotification(
      '⚠️ Tâche en retard',
      `La tâche "${task.title}" devrait avoir commencé à ${task.startTime}`,
      { type: 'task_overdue', taskId: task.id }
    );
  }

  // Notifier une tâche terminée
  async notifyTaskCompleted(task: any) {
    await this.sendImmediateNotification(
      '✅ Tâche terminée',
      `La tâche "${task.title}" a été complétée avec succès`,
      { type: 'task_completed', taskId: task.id }
    );
  }

  // Analyser la charge de travail de l'équipe pour une date donnée
  async analyzeTeamWorkload(date: string): Promise<{
    totalPackages: number;
    totalTeamMembers: number;
    averageLoadPerPerson: number;
    peakHours: string[];
    suggestedTeamSize: number;
  }> {
    try {
      const existingTasksString = await AsyncStorage.getItem('scheduledTasks');
      if (!existingTasksString) {
        return {
          totalPackages: 0,
          totalTeamMembers: 0,
          averageLoadPerPerson: 0,
          peakHours: [],
          suggestedTeamSize: 1
        };
      }

      const existingTasks = JSON.parse(existingTasksString);
      const tasksForDate = existingTasks.filter((task: any) => task.date === date);
      
      let totalPackages = 0;
      let totalTeamMembers = 0;
      const hourlyLoad: { [hour: string]: number } = {};

      for (const task of tasksForDate) {
        totalPackages += task.packages || 0;
        totalTeamMembers += task.teamSize || 1;

        // Analyser la charge par heure
        const startTime = task.startTime || task.start_time;
        const endTime = task.endTime || task.end_time;
        
        if (!startTime || !endTime) {
          console.warn('Missing start or end time for task:', task);
          continue;
        }

        const startHour = parseInt(startTime.split(':')[0]);
        const endHour = parseInt(endTime.split(':')[0]);
        
        if (isNaN(startHour) || isNaN(endHour)) {
          console.warn('Invalid time format for task:', task);
          continue;
        }
        
        for (let hour = startHour; hour < endHour; hour++) {
          const hourKey = hour.toString().padStart(2, '0');
          hourlyLoad[hourKey] = (hourlyLoad[hourKey] || 0) + (task.packages || 0);
        }
      }

      // Trouver les heures de pointe
      const peakHours = Object.entries(hourlyLoad)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => hour + ':00');

      // Calculer la taille d'équipe suggérée
      const averageLoadPerPerson = totalTeamMembers > 0 ? totalPackages / totalTeamMembers : 0;
      const suggestedTeamSize = Math.max(1, Math.ceil(totalPackages / 50)); // 50 colis par personne par défaut

      return {
        totalPackages,
        totalTeamMembers,
        averageLoadPerPerson,
        peakHours,
        suggestedTeamSize
      };
    } catch (error) {
      console.error('Error analyzing team workload:', error);
      return {
        totalPackages: 0,
        totalTeamMembers: 0,
        averageLoadPerPerson: 0,
        peakHours: [],
        suggestedTeamSize: 1
      };
    }
  }

  // Générer des rappels intelligents pour une tâche
  async generateSmartReminders(task: any): Promise<SmartReminder[]> {
    const reminders: SmartReminder[] = [];
    const taskDate = task.date;
    const taskStartTime = task.startTime || task.start_time;
    const taskEndTime = task.endTime || task.end_time;

    // Vérifier que les données nécessaires sont disponibles
    if (!taskStartTime || !taskDate || !task.id || !task.title) {
      console.warn('Données de tâche incomplètes pour générer des rappels:', task);
      return reminders;
    }

    // Analyser la charge de travail
    const workload = await this.analyzeTeamWorkload(taskDate);

    // 1. Rappel de début de tâche (15 minutes avant)
    const startReminderTime = this.subtractMinutes(taskStartTime, 15);
    if (startReminderTime) {
      reminders.push({
        id: `start_${task.id}`,
        taskId: task.id,
        taskTitle: task.title,
        reminderTime: startReminderTime,
        reminderDate: taskDate,
        type: 'start',
        message: `🚀 Début de la réception de colis à ${taskStartTime} - ${task.packages || 0} colis à traiter`,
        isEnabled: true
      });
    }

    // 2. Rappel de préparation (30 minutes avant)
    const prepReminderTime = this.subtractMinutes(taskStartTime, 30);
    if (prepReminderTime) {
      reminders.push({
        id: `prep_${task.id}`,
        taskId: task.id,
        taskTitle: task.title,
        reminderTime: prepReminderTime,
        reminderDate: taskDate,
        type: 'preparation',
        message: `⚡ Préparation pour la réception de colis à ${taskStartTime} - Vérifiez l'équipement`,
        isEnabled: true
      });
    }

    // 3. Rappel d'équipe prête (45 minutes avant)
    const teamReminderTime = this.subtractMinutes(taskStartTime, 45);
    if (teamReminderTime) {
      reminders.push({
        id: `team_${task.id}`,
        taskId: task.id,
        taskTitle: task.title,
        reminderTime: teamReminderTime,
        reminderDate: taskDate,
        type: 'team_ready',
        message: `👥 Équipe requise pour la réception de colis à ${taskStartTime} - ${task.teamSize || task.team_size || 1} personne(s)`,
        isEnabled: true
      });
    }

    // 4. Alerte d'efficacité si charge élevée
    if (workload.averageLoadPerPerson > 60) {
      const efficiencyReminderTime = this.subtractMinutes(taskStartTime, 60);
      if (efficiencyReminderTime) {
        reminders.push({
          id: `efficiency_${task.id}`,
          taskId: task.id,
          taskTitle: task.title,
          reminderTime: efficiencyReminderTime,
          reminderDate: taskDate,
          type: 'efficiency_alert',
          message: `⚠️ Charge élevée détectée: ${Math.round(workload.averageLoadPerPerson)} colis/personne. Considérez augmenter l'équipe.`,
          isEnabled: true,
          teamLoadPercentage: Math.round(workload.averageLoadPerPerson),
          suggestedTeamSize: workload.suggestedTeamSize
        });
      }
    }

    return reminders;
  }

  // Soustraire des minutes d'une heure
  private subtractMinutes(time: string | undefined | null, minutes: number): string | null {
    // Vérifier que time est défini et valide
    if (!time || typeof time !== 'string') {
      console.warn('Time is undefined or invalid:', time);
      return null;
    }

    // Vérifier que le format est correct (HH:MM)
    if (!time.includes(':')) {
      console.warn('Invalid time format, expected HH:MM:', time);
      return null;
    }

    try {
      const [hours, mins] = time.split(':').map(Number);
      
      // Vérifier que les valeurs sont des nombres valides
      if (isNaN(hours) || isNaN(mins)) {
        console.warn('Invalid time values:', time);
        return null;
      }

      const totalMinutes = hours * 60 + mins - minutes;
      
      // Vérifier que le résultat n'est pas négatif
      if (totalMinutes < 0) {
        console.warn('Result would be negative:', totalMinutes);
        return null;
      }

      const newHours = Math.floor(totalMinutes / 60);
      const newMins = totalMinutes % 60;
      return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('Error in subtractMinutes:', error, 'for time:', time);
      return null;
    }
  }

  // Sauvegarder les rappels intelligents
  async saveSmartReminders(taskId: string, reminders: SmartReminder[]) {
    try {
      const existingRemindersString = await AsyncStorage.getItem('smartReminders');
      const existingReminders = existingRemindersString ? JSON.parse(existingRemindersString) : {};
      
      existingReminders[taskId] = reminders;
      await AsyncStorage.setItem('smartReminders', JSON.stringify(existingReminders));
    } catch (error) {
      console.error('Error saving smart reminders:', error);
    }
  }

  // Récupérer les rappels intelligents pour une tâche
  async getSmartReminders(taskId: string): Promise<SmartReminder[]> {
    try {
      const existingRemindersString = await AsyncStorage.getItem('smartReminders');
      const existingReminders = existingRemindersString ? JSON.parse(existingRemindersString) : {};
      return existingReminders[taskId] || [];
    } catch (error) {
      console.error('Error getting smart reminders:', error);
      return [];
    }
  }

  // Récupérer tous les rappels intelligents
  async getAllSmartReminders(): Promise<SmartReminder[]> {
    try {
      const existingRemindersString = await AsyncStorage.getItem('smartReminders');
      const existingReminders = existingRemindersString ? JSON.parse(existingRemindersString) : {};
      
      const allReminders: SmartReminder[] = [];
      Object.values(existingReminders).forEach((taskReminders: any) => {
        allReminders.push(...taskReminders);
      });
      
      return allReminders;
    } catch (error) {
      console.error('Error getting all smart reminders:', error);
      return [];
    }
  }

  // Activer/désactiver un rappel
  async toggleReminder(reminderId: string, isEnabled: boolean) {
    try {
      const existingRemindersString = await AsyncStorage.getItem('smartReminders');
      const existingReminders = existingRemindersString ? JSON.parse(existingRemindersString) : {};
      
      // Trouver et mettre à jour le rappel
      Object.keys(existingReminders).forEach(taskId => {
        const taskReminders = existingReminders[taskId];
        const reminderIndex = taskReminders.findIndex((r: SmartReminder) => r.id === reminderId);
        if (reminderIndex !== -1) {
          taskReminders[reminderIndex].isEnabled = isEnabled;
        }
      });
      
      await AsyncStorage.setItem('smartReminders', JSON.stringify(existingReminders));
    } catch (error) {
      console.error('Error toggling reminder:', error);
    }
  }

  // Supprimer un rappel
  async deleteReminder(reminderId: string) {
    try {
      const existingRemindersString = await AsyncStorage.getItem('smartReminders');
      const existingReminders = existingRemindersString ? JSON.parse(existingRemindersString) : {};
      
      // Trouver et supprimer le rappel
      Object.keys(existingReminders).forEach(taskId => {
        existingReminders[taskId] = existingReminders[taskId].filter((r: SmartReminder) => r.id !== reminderId);
      });
      
      await AsyncStorage.setItem('smartReminders', JSON.stringify(existingReminders));
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  }

  // Programmer des rappels intelligents pour une tâche
  async scheduleSmartReminders(task: any) {
    const reminders = await this.generateSmartReminders(task);
    await this.saveSmartReminders(task.id, reminders);
    
    // Programmer les notifications pour les rappels activés
    for (const reminder of reminders) {
      if (reminder.isEnabled) {
        await this.scheduleReminderNotification(reminder);
      }
    }
  }

  // Programmer une notification pour un rappel
  async scheduleReminderNotification(reminder: SmartReminder) {
    if (!this.notificationHook) return;

    const reminderDate = new Date(`${reminder.reminderDate}T${reminder.reminderTime}`);
    const now = new Date();

    // Ne programmer que pour les rappels futurs
    if (reminderDate > now) {
      await this.notificationHook.scheduleLocalNotification(
        reminder.id,
        'Rappel tâche',
        reminder.message,
        reminderDate,
        { type: 'smart_reminder', reminderId: reminder.id, taskId: reminder.taskId }
      );
    }
  }

  // Programmer des rappels pour toutes les tâches existantes
  async scheduleRemindersForExistingTasks() {
    try {
      const existingTasksString = await AsyncStorage.getItem('scheduledTasks');
      if (!existingTasksString) return;

      const existingTasks = JSON.parse(existingTasksString);
      const now = new Date();

      for (const task of existingTasks) {
        const startTime = task.startTime || task.start_time;
        
        if (!task.date || !startTime) {
          console.warn('Missing required task data for scheduling:', task);
          continue;
        }

        try {
          const taskDate = new Date(task.date + 'T' + startTime);
          
          // Vérifier que la date est valide
          if (isNaN(taskDate.getTime())) {
            console.warn('Invalid date format for task:', task);
            continue;
          }
          
          // Ne programmer que pour les tâches futures
          if (taskDate > now) {
            await this.scheduleTaskReminder(task);
            await this.scheduleSmartReminders(task);
          }
        } catch (error) {
          console.error('Error processing task for scheduling:', error, task);
        }
      }
    } catch (error) {
      console.error('Error scheduling reminders for existing tasks:', error);
    }
  }

  // Nettoyer les notifications obsolètes
  async cleanupOldNotifications() {
    if (!this.notificationHook) return;

    try {
      const scheduledNotifications = await this.notificationHook.getScheduledNotifications();
      const now = new Date();

      for (const notification of scheduledNotifications) {
        const trigger = notification.trigger as any;
        if (trigger?.date && new Date(trigger.date) < now) {
          await this.notificationHook.cancelScheduledNotification(notification.identifier);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
    }
  }

  // Vérifier et notifier les tâches en retard
  async checkOverdueTasks() {
    try {
      const existingTasksString = await AsyncStorage.getItem('scheduledTasks');
      if (!existingTasksString) return;

      const existingTasks = JSON.parse(existingTasksString);
      const now = new Date();

      for (const task of existingTasks) {
        const startTime = task.startTime || task.start_time;
        const endTime = task.endTime || task.end_time;
        
        if (!task.date || !startTime || !endTime) {
          console.warn('Missing required task data:', task);
          continue;
        }

        try {
          const taskDate = new Date(task.date + 'T' + startTime);
          const taskEndDate = new Date(task.date + 'T' + endTime);
          
          // Vérifier que les dates sont valides
          if (isNaN(taskDate.getTime()) || isNaN(taskEndDate.getTime())) {
            console.warn('Invalid date format for task:', task);
            continue;
          }
          
          // Si la tâche devrait être en cours mais n'est pas terminée
          if (taskDate <= now && taskEndDate > now && !task.completed) {
            await this.notifyTaskOverdue(task);
          }
        } catch (error) {
          console.error('Error processing task for overdue check:', error, task);
        }
      }
    } catch (error) {
      console.error('Error checking overdue tasks:', error);
    }
  }

  // Initialiser le service de notifications
  async initialize() {
    await this.cleanupOldNotifications();
    await this.scheduleRemindersForExistingTasks();
    
    // Vérifier les tâches en retard toutes les 5 minutes
    setInterval(() => {
      this.checkOverdueTasks();
    }, 5 * 60 * 1000);
  }
}

// Instance singleton
export const notificationService = NotificationService.getInstance(); 