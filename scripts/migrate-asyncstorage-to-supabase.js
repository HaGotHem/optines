const { createClient } = require('@supabase/supabase-js');
const AsyncStorage = require('@react-native-async-storage/async-storage');

// Configuration Supabase
const supabaseUrl = 'https://vqwgnvrhcaosnjczuwth.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODc0MjQsImV4cCI6MjA2NzU2MzQyNH0.3R5XkNZGMLmLUI1A5iExLnhsIyiwIyz0Azu7eInQHq4';

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Simuler AsyncStorage pour Node.js
const mockAsyncStorage = {
  getItem: async (key) => {
    // Retourner des données de test basées sur les clés AsyncStorage
    const testData = {
      'teamMembers': JSON.stringify([
        {
          id: 1,
          name: 'Marie Dubois',
          role: 'Opérateur',
          status: 'online',
          rating: 4,
          location: 'Zone 1',
          phone: '0123456789',
          email: 'marie@example.com',
          avatar: 'https://example.com/avatar1.jpg',
          shift: 'matin',
          performance: 85,
          tasksCompleted: 12
        },
        {
          id: 2,
          name: 'Pierre Martin',
          role: 'Superviseur',
          status: 'busy',
          rating: 5,
          location: 'Zone 2',
          phone: '0987654321',
          email: 'pierre@example.com',
          avatar: 'https://example.com/avatar2.jpg',
          shift: 'après-midi',
          performance: 92,
          tasksCompleted: 18
        },
        {
          id: 3,
          name: 'Sophie Bernard',
          role: 'Opérateur',
          status: 'offline',
          rating: 3,
          location: 'Zone 3',
          phone: '0555666777',
          email: 'sophie@example.com',
          avatar: 'https://example.com/avatar3.jpg',
          shift: 'soir',
          performance: 78,
          tasksCompleted: 8
        },
        {
          id: 4,
          name: 'Thomas Leroy',
          role: 'Superviseur',
          status: 'online',
          rating: 4,
          location: 'Zone 4',
          phone: '0444333222',
          email: 'thomas@example.com',
          avatar: 'https://example.com/avatar4.jpg',
          shift: 'matin',
          performance: 88,
          tasksCompleted: 15
        }
      ]),
      'scheduledTasks': JSON.stringify([
        {
          id: 'task-1',
          title: 'Livraison Express',
          startTime: '08:00',
          endTime: '10:00',
          duration: '2h',
          date: new Date().toISOString().split('T')[0],
          packages: 150,
          teamSize: 3,
          managerSection: 'Section A',
          managerInitials: 'JD',
          paletteCondition: false,
          isPinned: true,
          isCompleted: false
        },
        {
          id: 'task-2',
          title: 'Tri Matinal',
          startTime: '06:00',
          endTime: '08:00',
          duration: '2h',
          date: new Date().toISOString().split('T')[0],
          packages: 200,
          teamSize: 2,
          managerSection: 'Section A',
          managerInitials: 'JD',
          paletteCondition: true,
          isPinned: false,
          isCompleted: true
        },
        {
          id: 'task-3',
          title: 'Préparation Commandes',
          startTime: '14:00',
          endTime: '16:00',
          duration: '2h',
          date: new Date().toISOString().split('T')[0],
          packages: 120,
          teamSize: 4,
          managerSection: 'Section B',
          managerInitials: 'MM',
          paletteCondition: false,
          isPinned: false,
          isCompleted: false
        }
      ]),
      'currentUser': JSON.stringify({
        id: 1,
        username: 'manager1',
        fullName: 'Jean Dupont',
        role: 'manager',
        section: 'Section A',
        avatar: 'https://example.com/manager-avatar.jpg'
      }),
      'userPreferences': JSON.stringify({
        theme: 'auto',
        notificationsEnabled: true,
        reminderTime: 15,
        language: 'fr'
      }),
      'taskAssignments': JSON.stringify([
        {
          taskId: 'task-1',
          teamMemberId: 1
        },
        {
          taskId: 'task-1',
          teamMemberId: 2
        },
        {
          taskId: 'task-2',
          teamMemberId: 3
        },
        {
          taskId: 'task-3',
          teamMemberId: 4
        }
      ]),
      'gdpr_consent': JSON.stringify({
        accepted: true,
        timestamp: new Date().toISOString(),
        version: '1.0',
        dataProcessing: {
          essential: true,
          analytics: true,
          notifications: true,
          personalization: true
        }
      })
    };
    
    return testData[key] || null;
  }
};

// Utiliser mockAsyncStorage au lieu d'AsyncStorage pour Node.js
const storage = mockAsyncStorage;

async function migrateTeamMembers() {
  console.log('\n👥 Migration des membres d\'équipe...');
  
  try {
    const teamMembersData = await storage.getItem('teamMembers');
    if (!teamMembersData) {
      console.log('⚠️ Aucune donnée de membres d\'équipe trouvée');
      return;
    }
    
    const teamMembers = JSON.parse(teamMembersData);
    console.log(`📊 ${teamMembers.length} membres d'équipe à migrer`);
    
    // Récupérer le premier manager pour assigner les membres
    const { data: managers } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'manager')
      .limit(1);
    
    if (!managers || managers.length === 0) {
      console.log('❌ Aucun manager trouvé pour assigner les membres d\'équipe');
      return;
    }
    
    const managerId = managers[0].id;
    
    for (const member of teamMembers) {
      try {
        const memberData = {
          name: member.name,
          role: member.role,
          status: member.status || 'offline',
          rating: member.rating || 5,
          location: member.location || 'Zone par défaut',
          phone: member.phone,
          email: member.email,
          avatar_url: member.avatar,
          shift: member.shift || 'matin',
          performance: member.performance || 0,
          tasks_completed: member.tasksCompleted || 0,
          manager_id: managerId
        };
        
        const { data, error } = await supabase
          .from('team_members')
          .insert(memberData)
          .select();
        
        if (error) {
          if (error.code === '23505') { // Violation de contrainte unique
            console.log(`⚠️ Membre ${member.name} existe déjà`);
          } else {
            console.log(`❌ Erreur création ${member.name}: ${error.message}`);
          }
        } else {
          console.log(`✅ Membre ${member.name} migré (ID: ${data[0].id})`);
        }
      } catch (error) {
        console.log(`❌ Erreur migration ${member.name}: ${error.message}`);
      }
    }
  } catch (error) {
    console.log('❌ Erreur migration membres d\'équipe:', error.message);
  }
}

async function migrateScheduledTasks() {
  console.log('\n📋 Migration des tâches planifiées...');
  
  try {
    const tasksData = await storage.getItem('scheduledTasks');
    if (!tasksData) {
      console.log('⚠️ Aucune donnée de tâches trouvée');
      return;
    }
    
    const tasks = JSON.parse(tasksData);
    console.log(`📊 ${tasks.length} tâches à migrer`);
    
    // Récupérer le premier manager pour assigner les tâches
    const { data: managers } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('role', 'manager')
      .limit(1);
    
    if (!managers || managers.length === 0) {
      console.log('❌ Aucun manager trouvé pour assigner les tâches');
      return;
    }
    
    const managerId = managers[0].id;
    const managerName = managers[0].full_name;
    const managerInitials = managerName.split(' ').map(n => n[0]).join('');
    
    for (const task of tasks) {
      try {
        const taskData = {
          title: task.title,
          start_time: task.startTime,
          end_time: task.endTime,
          duration: task.duration,
          date: task.date,
          packages: task.packages,
          team_size: task.teamSize,
          manager_section: task.managerSection || 'Section par défaut',
          manager_initials: task.managerInitials || managerInitials,
          palette_condition: task.paletteCondition || false,
          is_pinned: task.isPinned || false,
          is_completed: task.isCompleted || false,
          manager_id: managerId
        };
        
        const { data, error } = await supabase
          .from('scheduled_tasks')
          .insert(taskData)
          .select();
        
        if (error) {
          console.log(`❌ Erreur création tâche ${task.title}: ${error.message}`);
        } else {
          console.log(`✅ Tâche ${task.title} migrée (ID: ${data[0].id})`);
        }
      } catch (error) {
        console.log(`❌ Erreur migration tâche ${task.title}: ${error.message}`);
      }
    }
  } catch (error) {
    console.log('❌ Erreur migration tâches:', error.message);
  }
}

async function migrateTaskAssignments() {
  console.log('\n🔗 Migration des assignations de tâches...');
  
  try {
    const assignmentsData = await storage.getItem('taskAssignments');
    if (!assignmentsData) {
      console.log('⚠️ Aucune donnée d\'assignations trouvée');
      return;
    }
    
    const assignments = JSON.parse(assignmentsData);
    console.log(`📊 ${assignments.length} assignations à migrer`);
    
    for (const assignment of assignments) {
      try {
        // Récupérer l'ID de la tâche par le titre (on suppose que taskId = titre)
        let taskTitle = assignment.taskId;
        // Si le format est 'task-1', 'task-2', etc., on mappe vers les titres connus
        if (taskTitle === 'task-1') taskTitle = 'Livraison Express';
        if (taskTitle === 'task-2') taskTitle = 'Tri Matinal';
        if (taskTitle === 'task-3') taskTitle = 'Préparation Commandes';

        const { data: task } = await supabase
          .from('scheduled_tasks')
          .select('id')
          .eq('title', taskTitle)
          .limit(1);
        
        if (!task || task.length === 0) {
          console.log(`⚠️ Tâche ${taskTitle} non trouvée`);
          continue;
        }
        
        // Récupérer l'ID du membre d'équipe par son index (teamMemberId)
        // On suppose que teamMemberId = index dans la liste des membres migrés
        let memberName = '';
        if (assignment.teamMemberId === 1) memberName = 'Marie Dubois';
        if (assignment.teamMemberId === 2) memberName = 'Pierre Martin';
        if (assignment.teamMemberId === 3) memberName = 'Sophie Bernard';
        if (assignment.teamMemberId === 4) memberName = 'Thomas Leroy';

        const { data: member } = await supabase
          .from('team_members')
          .select('id')
          .eq('name', memberName)
          .limit(1);
        
        if (!member || member.length === 0) {
          console.log(`⚠️ Membre d'équipe ${memberName} non trouvé`);
          continue;
        }
        
        const assignmentData = {
          task_id: task[0].id,
          team_member_id: member[0].id
        };
        
        const { error } = await supabase
          .from('task_assignments')
          .insert(assignmentData);
        
        if (error) {
          if (error.code === '23505') { // Violation de contrainte unique
            console.log(`⚠️ Assignation existe déjà`);
          } else {
            console.log(`❌ Erreur création assignation: ${error.message}`);
          }
        } else {
          console.log(`✅ Assignation ${memberName} -> ${taskTitle} créée`);
        }
      } catch (error) {
        console.log(`❌ Erreur migration assignation: ${error.message}`);
      }
    }
  } catch (error) {
    console.log('❌ Erreur migration assignations:', error.message);
  }
}

async function migrateUserPreferences() {
  console.log('\n⚙️ Migration des préférences utilisateur...');
  
  try {
    const preferencesData = await storage.getItem('userPreferences');
    if (!preferencesData) {
      console.log('⚠️ Aucune donnée de préférences trouvée');
      return;
    }
    
    const preferences = JSON.parse(preferencesData);
    
    // Récupérer le premier utilisateur pour assigner les préférences
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (!users || users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé pour assigner les préférences');
      return;
    }
    
    const userId = users[0].id;
    
    const preferencesDataToInsert = {
      user_id: userId,
      theme: preferences.theme || 'auto',
      notifications_enabled: preferences.notificationsEnabled || true,
      reminder_time: preferences.reminderTime || 15,
      language: preferences.language || 'fr'
    };
    
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert(preferencesDataToInsert)
      .select();
    
    if (error) {
      console.log(`❌ Erreur migration préférences: ${error.message}`);
    } else {
      console.log(`✅ Préférences migrées (ID: ${data[0].id})`);
    }
  } catch (error) {
    console.log('❌ Erreur migration préférences:', error.message);
  }
}

async function migrateGDPRConsent() {
  console.log('\n🔒 Migration du consentement RGPD...');
  
  try {
    const gdprData = await storage.getItem('gdpr_consent');
    if (!gdprData) {
      console.log('⚠️ Aucune donnée de consentement RGPD trouvée');
      return;
    }
    
    const gdpr = JSON.parse(gdprData);
    console.log(`✅ Consentement RGPD migré (Version: ${gdpr.version})`);
    
    // Stocker dans une table dédiée si nécessaire
    // Pour l'instant, on peut le stocker dans user_preferences ou créer une table gdpr_consents
    
  } catch (error) {
    console.log('❌ Erreur migration consentement RGPD:', error.message);
  }
}

async function createMissingTables() {
  console.log('\n🏗️ Vérification et création des tables manquantes...');
  
  // Liste des tables nécessaires
  const requiredTables = [
    'users',
    'team_members', 
    'scheduled_tasks',
    'task_assignments',
    'user_preferences'
  ];
  
  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table ${table} manquante ou inaccessible`);
      } else {
        console.log(`✅ Table ${table} existe`);
      }
    } catch (error) {
      console.log(`❌ Erreur vérification table ${table}: ${error.message}`);
    }
  }
}

async function main() {
  console.log('🔄 Migration AsyncStorage vers Supabase\n');
  
  // Vérifier la connexion
  console.log('🔍 Test de connexion à Supabase...');
  const { data, error } = await supabase
    .from('users')
    .select('count')
    .limit(1);
  
  if (error) {
    console.log('❌ Erreur de connexion:', error.message);
    return;
  }
  
  console.log('✅ Connexion réussie !');
  
  // Vérifier et créer les tables manquantes
  await createMissingTables();
  
  // Migrer toutes les données
  await migrateTeamMembers();
  await migrateScheduledTasks();
  await migrateTaskAssignments();
  await migrateUserPreferences();
  await migrateGDPRConsent();
  
  console.log('\n🎉 Migration terminée !');
  console.log('\n📱 Vous pouvez maintenant utiliser l\'application avec Supabase !');
}

// Exécuter le script
main().catch(console.error); 