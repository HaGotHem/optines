import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/user';
import { TeamMember, ScheduledTask } from '../types/database';

// Interface pour une vraie base de données
export interface DatabaseService {
  // Users
  getUsers(): Promise<User[]>;
  getUserById(id: number): Promise<User | null>;
  createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  authenticateUser(username: string, password: string, role: string): Promise<User | null>;

  // Team Members
  getTeamMembers(managerId?: number): Promise<TeamMember[]>;
  getTeamMemberById(id: number): Promise<TeamMember | null>;
  createTeamMember(member: Omit<TeamMember, 'id'>): Promise<TeamMember>;
  updateTeamMember(id: number, updates: Partial<TeamMember>): Promise<TeamMember>;
  deleteTeamMember(id: number): Promise<void>;

  // Tasks
  getTasks(filters?: TaskFilters): Promise<ScheduledTask[]>;
  getTaskById(id: string): Promise<ScheduledTask | null>;
  createTask(task: Omit<ScheduledTask, 'id'>): Promise<ScheduledTask>;
  updateTask(id: string, updates: Partial<ScheduledTask>): Promise<ScheduledTask>;
  deleteTask(id: string): Promise<void>;
  getTasksByDate(date: string): Promise<ScheduledTask[]>;
  getTasksByManager(managerId: number): Promise<ScheduledTask[]>;

  // Task Assignments
  assignTeamMemberToTask(taskId: string, teamMemberId: number): Promise<void>;
  unassignTeamMemberFromTask(taskId: string, teamMemberId: number): Promise<void>;
  getTaskAssignments(taskId: string): Promise<TeamMember[]>;
  getTeamMemberTasks(teamMemberId: number): Promise<ScheduledTask[]>;

  // Statistics
  getTaskStats(filters?: TaskFilters): Promise<TaskStats>;
  getManagerStats(managerId: number): Promise<ManagerStats>;
  getTeamPerformance(managerId: number): Promise<TeamPerformance>;
}

// Types pour les filtres
export interface TaskFilters {
  date?: string;
  managerId?: number;
  isCompleted?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface TaskStats {
  totalPackages: number;
  totalTasks: number;
  completedTasks: number;
  totalTeamMembers: number;
  averagePackagesPerTask: number;
  averageTeamSize: number;
  completionRate: number;
  packagesPerHour: number;
}

export interface ManagerStats {
  totalTasks: number;
  completedTasks: number;
  totalPackages: number;
  teamSize: number;
  performance: number;
  averageTaskDuration: number;
}

export interface TeamPerformance {
  totalMembers: number;
  activeMembers: number;
  averagePerformance: number;
  totalTasksCompleted: number;
  averageRating: number;
}

// Implémentation avec SQLite (exemple)
export class SQLiteDatabaseService implements DatabaseService {
  private db: any | null = null; // Changed from SQLite.SQLiteDatabase to any

  async initialize(): Promise<void> {
    // Initialiser la connexion SQLite
    // Créer les tables si elles n'existent pas
  }

  async getUsers(): Promise<User[]> {
    // Requête SQL: SELECT * FROM users WHERE isActive = 1
    return [];
  }

  async getUserById(id: number): Promise<User | null> {
    // Requête SQL: SELECT * FROM users WHERE id = ?
    return null;
  }

  async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    // Requête SQL: INSERT INTO users (...) VALUES (...)
    return {} as User;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    // Requête SQL: UPDATE users SET ... WHERE id = ?
    return {} as User;
  }

  async deleteUser(id: number): Promise<void> {
    // Requête SQL: DELETE FROM users WHERE id = ?
  }

  async authenticateUser(username: string, password: string, role: string): Promise<User | null> {
    // Requête SQL: SELECT * FROM users WHERE username = ? AND password = ? AND role = ? AND isActive = 1
    return null;
  }

  async getTeamMembers(managerId?: number): Promise<TeamMember[]> {
    // Requête SQL: SELECT * FROM team_members WHERE managerId = ? (si spécifié)
    return [];
  }

  async getTeamMemberById(id: number): Promise<TeamMember | null> {
    // Requête SQL: SELECT * FROM team_members WHERE id = ?
    return null;
  }

  async createTeamMember(member: Omit<TeamMember, 'id'>): Promise<TeamMember> {
    // Requête SQL: INSERT INTO team_members (...) VALUES (...)
    return {} as TeamMember;
  }

  async updateTeamMember(id: number, updates: Partial<TeamMember>): Promise<TeamMember> {
    // Requête SQL: UPDATE team_members SET ... WHERE id = ?
    return {} as TeamMember;
  }

  async deleteTeamMember(id: number): Promise<void> {
    // Requête SQL: DELETE FROM team_members WHERE id = ?
  }

  async getTasks(filters?: TaskFilters): Promise<ScheduledTask[]> {
    // Requête SQL complexe avec filtres
    let query = 'SELECT * FROM scheduled_tasks WHERE 1=1';
    const params: any[] = [];

    if (filters?.date) {
      query += ' AND date = ?';
      params.push(filters.date);
    }

    if (filters?.managerId) {
      query += ' AND managerId = ?';
      params.push(filters.managerId);
    }

    if (filters?.isCompleted !== undefined) {
      query += ' AND isCompleted = ?';
      params.push(filters.isCompleted);
    }

    // Exécuter la requête
    return [];
  }

  async getTaskById(id: string): Promise<ScheduledTask | null> {
    // Requête SQL: SELECT * FROM scheduled_tasks WHERE id = ?
    return null;
  }

  async createTask(task: Omit<ScheduledTask, 'id'>): Promise<ScheduledTask> {
    // Requête SQL: INSERT INTO scheduled_tasks (...) VALUES (...)
    return {} as ScheduledTask;
  }

  async updateTask(id: string, updates: Partial<ScheduledTask>): Promise<ScheduledTask> {
    // Requête SQL: UPDATE scheduled_tasks SET ... WHERE id = ?
    return {} as ScheduledTask;
  }

  async deleteTask(id: string): Promise<void> {
    // Requête SQL: DELETE FROM scheduled_tasks WHERE id = ?
  }

  async getTasksByDate(date: string): Promise<ScheduledTask[]> {
    // Requête SQL: SELECT * FROM scheduled_tasks WHERE date = ?
    return [];
  }

  async getTasksByManager(managerId: number): Promise<ScheduledTask[]> {
    // Requête SQL: SELECT * FROM scheduled_tasks WHERE managerId = ?
    return [];
  }

  async assignTeamMemberToTask(taskId: string, teamMemberId: number): Promise<void> {
    // Requête SQL: INSERT INTO task_assignments (taskId, teamMemberId) VALUES (?, ?)
  }

  async unassignTeamMemberFromTask(taskId: string, teamMemberId: number): Promise<void> {
    // Requête SQL: DELETE FROM task_assignments WHERE taskId = ? AND teamMemberId = ?
  }

  async getTaskAssignments(taskId: string): Promise<TeamMember[]> {
    // Requête SQL avec JOIN: 
    // SELECT tm.* FROM team_members tm 
    // JOIN task_assignments ta ON tm.id = ta.teamMemberId 
    // WHERE ta.taskId = ?
    return [];
  }

  async getTeamMemberTasks(teamMemberId: number): Promise<ScheduledTask[]> {
    // Requête SQL avec JOIN:
    // SELECT st.* FROM scheduled_tasks st
    // JOIN task_assignments ta ON st.id = ta.taskId
    // WHERE ta.teamMemberId = ?
    return [];
  }

  async getTaskStats(filters?: TaskFilters): Promise<TaskStats> {
    // Requêtes SQL complexes pour calculer les statistiques
    return {
      totalPackages: 0,
      totalTasks: 0,
      completedTasks: 0,
      totalTeamMembers: 0,
      averagePackagesPerTask: 0,
      averageTeamSize: 0,
      completionRate: 0,
      packagesPerHour: 0,
    };
  }

  async getManagerStats(managerId: number): Promise<ManagerStats> {
    // Requêtes SQL pour les stats du manager
    return {
      totalTasks: 0,
      completedTasks: 0,
      totalPackages: 0,
      teamSize: 0,
      performance: 0,
      averageTaskDuration: 0,
    };
  }

  async getTeamPerformance(managerId: number): Promise<TeamPerformance> {
    // Requêtes SQL pour les performances de l'équipe
    return {
      totalMembers: 0,
      activeMembers: 0,
      averagePerformance: 0,
      totalTasksCompleted: 0,
      averageRating: 0,
    };
  }
}

// Service de migration depuis AsyncStorage
export class MigrationService {
  static async migrateFromAsyncStorage(databaseService: DatabaseService): Promise<void> {
    try {
      console.log('🔄 Début de la migration depuis AsyncStorage...');

      // Migrer les utilisateurs
      const usersString = await AsyncStorage.getItem('@users_database');
      if (usersString) {
        const users = JSON.parse(usersString);
        for (const user of users) {
          await databaseService.createUser(user);
        }
        console.log(`✅ ${users.length} utilisateurs migrés`);
      }

      // Migrer les membres d'équipe
      const teamString = await AsyncStorage.getItem('teamMembers');
      if (teamString) {
        const teamMembers = JSON.parse(teamString);
        for (const member of teamMembers) {
          await databaseService.createTeamMember(member);
        }
        console.log(`✅ ${teamMembers.length} membres d'équipe migrés`);
      }

      // Migrer les tâches
      const tasksString = await AsyncStorage.getItem('scheduledTasks');
      if (tasksString) {
        const tasks = JSON.parse(tasksString);
        for (const task of tasks) {
          await databaseService.createTask(task);
        }
        console.log(`✅ ${tasks.length} tâches migrées`);
      }

      console.log('🎉 Migration terminée avec succès !');
    } catch (error) {
      console.error('❌ Erreur lors de la migration:', error);
      throw error;
    }
  }
} 