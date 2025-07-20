import { ScheduledTask } from '../types/database';

interface ManagerPerformance {
  id: string;
  name: string;
  section: string;
  packagesProcessed: number;
  totalPackages: number;
  performance: number;
  teamSize: number;
  reinforcementWorker: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  alerts: number;
  trend: 'up' | 'down' | 'stable';
  remainingTimeMinutes: number;
  tasksCompleted: number;
  totalTasks: number;
}

interface PerformanceStats {
  totalPackages: number;
  processedPackages: number;
  averagePerformance: number;
  totalManagers: number;
  totalAlerts: number;
  averageRemainingTime: number;
}

export class PerformanceService {
  /**
   * Calcule les statistiques de performance d'un manager basées sur ses tâches
   */
  static calculateManagerPerformance(
    managerId: string,
    managerName: string,
    managerSection: string,
    tasks: ScheduledTask[]
  ): ManagerPerformance {
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(task => task.date === today && task.manager_id === managerId);
    
    // Calculer les colis traités vs total
    const totalPackages = todayTasks.reduce((sum, task) => sum + (task.packages || 0), 0);
    const completedTasks = todayTasks.filter(task => task.is_completed);
    const packagesProcessed = completedTasks.reduce((sum, task) => sum + (task.packages || 0), 0);
    
    // Calculer la performance (pourcentage de colis traités vs total)
    const performance = totalPackages > 0 ? Math.round((packagesProcessed / totalPackages) * 100) : 0;
    
    // Calculer la taille moyenne de l'équipe
    const averageTeamSize = todayTasks.length > 0 
      ? Math.round(todayTasks.reduce((sum, task) => sum + (task.team_size || 1), 0) / todayTasks.length)
      : 0;
    
    // Calculer le temps restant estimé
    const remainingTimeMinutes = this.calculateRemainingTime(todayTasks);
    
    // Déterminer le statut basé sur la performance
    let status: 'excellent' | 'good' | 'warning' | 'critical';
    if (performance >= 90) status = 'excellent';
    else if (performance >= 75) status = 'good';
    else if (performance >= 60) status = 'warning';
    else status = 'critical';
    
    // Compter les alertes (tâches en retard, faible performance, etc.)
    const alerts = this.calculateAlerts(todayTasks, performance);
    
    // Calculer la tendance (simulation basée sur la performance)
    let trend: 'up' | 'down' | 'stable';
    if (performance >= 85) trend = 'up';
    else if (performance <= 65) trend = 'down';
    else trend = 'stable';
    
    return {
      id: managerId,
      name: managerName,
      section: managerSection,
      packagesProcessed,
      totalPackages,
      performance,
      teamSize: averageTeamSize,
      reinforcementWorker: averageTeamSize > 3 ? 1 : 0, // Simulation
      status,
      alerts,
      trend,
      remainingTimeMinutes,
      tasksCompleted: completedTasks.length,
      totalTasks: todayTasks.length
    };
  }

  /**
   * Calcule le temps restant estimé pour les tâches d'un manager
   */
  private static calculateRemainingTime(tasks: ScheduledTask[]): number {
    const now = new Date();
    let totalMinutes = 0;

    const pendingTasks = tasks.filter(task => !task.is_completed);
    
    pendingTasks.forEach(task => {
      const taskDate = new Date(`${task.date}T${task.start_time}`);
      const endTime = new Date(`${task.date}T${task.end_time}`);
      
      // Si la tâche n'a pas encore commencé
      if (now < taskDate) {
        const durationMs = endTime.getTime() - taskDate.getTime();
        totalMinutes += durationMs / (1000 * 60);
      }
      // Si la tâche est en cours
      else if (now >= taskDate && now < endTime) {
        const remainingMs = endTime.getTime() - now.getTime();
        totalMinutes += Math.max(0, remainingMs / (1000 * 60));
      }
    });

    return Math.round(totalMinutes);
  }

  /**
   * Calcule le nombre d'alertes pour un manager
   */
  private static calculateAlerts(tasks: ScheduledTask[], performance: number): number {
    let alerts = 0;
    
    // Alerte si performance faible
    if (performance < 70) alerts++;
    
    // Alerte si beaucoup de tâches en retard
    const overdueTasks = tasks.filter(task => {
      const taskEnd = new Date(`${task.date}T${task.end_time}`);
      return !task.is_completed && taskEnd < new Date();
    });
    
    if (overdueTasks.length > 0) alerts += overdueTasks.length;
    
    // Alerte si temps restant critique
    const remainingTime = this.calculateRemainingTime(tasks);
    if (remainingTime > 180) alerts++; // Plus de 3 heures restantes
    
    return alerts;
  }

  /**
   * Calcule les statistiques globales de performance
   */
  static calculateGlobalStats(allManagersPerformance: ManagerPerformance[]): PerformanceStats {
    const totalPackages = allManagersPerformance.reduce((sum, manager) => sum + manager.totalPackages, 0);
    const processedPackages = allManagersPerformance.reduce((sum, manager) => sum + manager.packagesProcessed, 0);
    const averagePerformance = allManagersPerformance.length > 0 
      ? Math.round(allManagersPerformance.reduce((sum, manager) => sum + manager.performance, 0) / allManagersPerformance.length)
      : 0;
    const totalAlerts = allManagersPerformance.reduce((sum, manager) => sum + manager.alerts, 0);
    const averageRemainingTime = allManagersPerformance.length > 0
      ? Math.round(allManagersPerformance.reduce((sum, manager) => sum + manager.remainingTimeMinutes, 0) / allManagersPerformance.length)
      : 0;

    return {
      totalPackages,
      processedPackages,
      averagePerformance,
      totalManagers: allManagersPerformance.length,
      totalAlerts,
      averageRemainingTime
    };
  }
} 