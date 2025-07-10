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
    
    // Calculer la performance (pourcentage de tâches complétées)
    const performance = todayTasks.length > 0 ? Math.round((completedTasks.length / todayTasks.length) * 100) : 0;
    
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

  /**
   * Génère des données de performance simulées pour les managers qui n'ont pas de tâches
   */
  static generateMockManagerPerformance(managerId: string, managerName: string, section: string): ManagerPerformance {
    // Données simulées pour les managers sans tâches réelles
    const mockData = {
      'marie-dubois': { packages: 485, total: 550, performance: 92, team: 3, reinforcement: 1 },
      'pierre-martin': { packages: 312, total: 450, performance: 76, team: 2, reinforcement: 0 },
      'sophie-laurent': { packages: 523, total: 550, performance: 95, team: 2, reinforcement: 1 },
      'thomas-durand': { packages: 187, total: 400, performance: 68, team: 3, reinforcement: 0 },
      'julie-moreau': { packages: 456, total: 500, performance: 89, team: 2, reinforcement: 1 },
      'antoine-leroy': { packages: 398, total: 480, performance: 85, team: 3, reinforcement: 0 },
      'camille-rousseau': { packages: 467, total: 520, performance: 91, team: 2, reinforcement: 1 },
      'lucas-bernard': { packages: 334, total: 430, performance: 78, team: 3, reinforcement: 0 },
      'emma-petit': { packages: 445, total: 500, performance: 88, team: 2, reinforcement: 1 },
      'nicolas-garnier': { packages: 378, total: 460, performance: 82, team: 3, reinforcement: 0 }
    };

    const key = managerName.toLowerCase().replace(' ', '-');
    const data = mockData[key as keyof typeof mockData] || { packages: 300, total: 400, performance: 75, team: 2, reinforcement: 0 };

    let status: 'excellent' | 'good' | 'warning' | 'critical';
    if (data.performance >= 90) status = 'excellent';
    else if (data.performance >= 75) status = 'good';
    else if (data.performance >= 60) status = 'warning';
    else status = 'critical';

    const remainingPackages = data.total - data.packages;
    const baseTimePerPackage = 40; // secondes par colis
    const extraMembers = data.team - 1;
    const reinforcementPenalty = data.reinforcement > 0 ? 15 : 0;
    const additionalMinutes = (extraMembers * 30) + reinforcementPenalty;
    const baseTimeSeconds = remainingPackages * baseTimePerPackage;
    const totalTimeSeconds = baseTimeSeconds + (additionalMinutes * 60);
    const remainingTimeMinutes = Math.floor(totalTimeSeconds / 60);

    const alerts = data.performance < 70 ? (data.performance < 60 ? 3 : 2) : (data.performance < 85 ? 1 : 0);
    
    let trend: 'up' | 'down' | 'stable';
    if (data.performance >= 85) trend = 'up';
    else if (data.performance <= 65) trend = 'down';
    else trend = 'stable';

    return {
      id: managerId,
      name: managerName,
      section,
      packagesProcessed: data.packages,
      totalPackages: data.total,
      performance: data.performance,
      teamSize: data.team,
      reinforcementWorker: data.reinforcement,
      status,
      alerts,
      trend,
      remainingTimeMinutes,
      tasksCompleted: Math.floor(data.performance / 25), // Simulation
      totalTasks: 4 // Simulation
    };
  }
} 