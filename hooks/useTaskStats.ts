import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Task {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  duration: string;
  date: string;
  packages: number;
  teamSize: number;
  managerSection: string;
  managerInitials: string;
  teamMembers?: number[];
  isCompleted?: boolean;
}

interface TaskStats {
  totalPackages: number;
  totalTasks: number;
  completedTasks: number;
  totalTeamMembers: number;
  averagePackagesPerTask: number;
  averageTeamSize: number;
  completionRate: number;
  packagesPerHour: number;
}

export const useTaskStats = () => {
  const [stats, setStats] = useState<TaskStats>({
    totalPackages: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalTeamMembers: 0,
    averagePackagesPerTask: 0,
    averageTeamSize: 0,
    completionRate: 0,
    packagesPerHour: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadTaskStats = async () => {
    try {
      setLoading(true);
      const tasksString = await AsyncStorage.getItem('scheduledTasks');
      console.log('🔍 Tasks from AsyncStorage:', tasksString);
      const tasks: Task[] = tasksString ? JSON.parse(tasksString) : [];
      console.log('📦 Parsed tasks:', tasks);

      if (tasks.length === 0) {
        console.log('⚠️ Aucune tâche trouvée dans le système');
        // Afficher des zéros si aucune tâche n'existe
        setStats({
          totalPackages: 0,
          totalTasks: 0,
          completedTasks: 0,
          totalTeamMembers: 0,
          averagePackagesPerTask: 0,
          averageTeamSize: 0,
          completionRate: 0,
          packagesPerHour: 0,
        });
        return;
      }

      const totalPackages = tasks.reduce((sum, task) => sum + task.packages, 0);
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.isCompleted).length;
      const totalTeamMembers = tasks.reduce((sum, task) => sum + task.teamSize, 0);
      const averagePackagesPerTask = Math.round(totalPackages / totalTasks);
      const averageTeamSize = Math.round(totalTeamMembers / totalTasks);
      const completionRate = Math.round((completedTasks / totalTasks) * 100);

      console.log('📊 Calculated stats:', {
        totalPackages,
        totalTasks,
        completedTasks,
        totalTeamMembers,
        averagePackagesPerTask,
        averageTeamSize,
        completionRate
      });

      // Afficher un message d'alerte dans la console pour l'utilisateur
      if (tasks.length === 0) {
        console.log('🚨 ATTENTION: Aucune tâche trouvée dans le système!');
        console.log('💡 Pour tester, allez dans "Calculateur" et planifiez une tâche');
      } else {
        console.log(`✅ ${tasks.length} tâche(s) trouvée(s) dans le système`);
        console.log('📦 Détails de la première tâche:', tasks[0]);
      }

      // Calculer les colis par heure basé sur le temps total des tâches
      let totalHours = 0;
      tasks.forEach(task => {
        const [startHour, startMin] = task.startTime.split(':').map(Number);
        const [endHour, endMin] = task.endTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        const durationMinutes = endMinutes - startMinutes;
        totalHours += durationMinutes / 60;
      });

      // Calculer les colis par heure en fonction du temps passé
      const packagesPerHour = totalHours > 0 ? Math.round(totalPackages / totalHours) : 0;
      
      // Calculer les colis traités en fonction du temps passé (pour les tâches terminées)
      const completedTasksPackages = tasks
        .filter(task => task.isCompleted)
        .reduce((sum, task) => sum + task.packages, 0);
      
      const completedTasksHours = tasks
        .filter(task => task.isCompleted)
        .reduce((sum, task) => {
          const [startHour, startMin] = task.startTime.split(':').map(Number);
          const [endHour, endMin] = task.endTime.split(':').map(Number);
          const startMinutes = startHour * 60 + startMin;
          const endMinutes = endHour * 60 + endMin;
          const durationMinutes = endMinutes - startMinutes;
          return sum + (durationMinutes / 60);
        }, 0);
      
      const actualPackagesPerHour = completedTasksHours > 0 ? Math.round(completedTasksPackages / completedTasksHours) : packagesPerHour;

      setStats({
        totalPackages: totalPackages || 0,
        totalTasks: totalTasks || 0,
        completedTasks: completedTasks || 0,
        totalTeamMembers: totalTeamMembers || 0,
        averagePackagesPerTask: averagePackagesPerTask || 0,
        averageTeamSize: averageTeamSize || 0,
        completionRate: completionRate || 0,
        packagesPerHour: actualPackagesPerHour || 0,
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTaskStats();
  }, []);

  return { stats, loading, refreshStats: loadTaskStats };
}; 