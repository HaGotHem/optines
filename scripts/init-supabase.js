const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://vqwgnvrhcaosnjczuwth.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODc0MjQsImV4cCI6MjA2NzU2MzQyNH0.3R5XkNZGMLmLUI1A5iExLnhsIyiwIyz0Azu7eInQHq4';

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔍 Test de connexion à Supabase...');
  
  try {
    // Test simple de connexion
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Erreur de connexion:', error.message);
      return false;
    }
    
    console.log('✅ Connexion réussie !');
    return true;
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.message);
    return false;
  }
}

async function checkTables() {
  console.log('\n📋 Vérification des tables...');
  
  const tables = ['users', 'team_members', 'scheduled_tasks', 'task_assignments', 'user_preferences'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table ${table}: ${error.message}`);
      } else {
        console.log(`✅ Table ${table}: OK`);
      }
    } catch (error) {
      console.log(`❌ Table ${table}: ${error.message}`);
    }
  }
}

async function createTestUsers() {
  console.log('\n👥 Création des utilisateurs de test...');
  
  const testUsers = [
    {
      username: 'manager1',
      password_hash: 'hashed_password_1',
      full_name: 'Jean Dupont',
      role: 'manager',
      section: 'Section A',
      is_active: true
    },
    {
      username: 'manager2',
      password_hash: 'hashed_password_2',
      full_name: 'Marie Martin',
      role: 'manager',
      section: 'Section B',
      is_active: true
    },
    {
      username: 'directeur1',
      password_hash: 'hashed_password_3',
      full_name: 'Pierre Durand',
      role: 'director',
      section: null,
      is_active: true
    }
  ];
  
  for (const user of testUsers) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert(user)
        .select();
      
      if (error) {
        if (error.code === '23505') { // Violation de contrainte unique
          console.log(`⚠️ Utilisateur ${user.username} existe déjà`);
        } else {
          console.log(`❌ Erreur création ${user.username}: ${error.message}`);
        }
      } else {
        console.log(`✅ Utilisateur ${user.username} créé (ID: ${data[0].id})`);
      }
    } catch (error) {
      console.log(`❌ Erreur création ${user.username}: ${error.message}`);
    }
  }
}

async function createTestTeamMembers() {
  console.log('\n👥 Création des membres d\'équipe de test...');
  
  // D'abord, récupérer les IDs des managers
  const { data: managers } = await supabase
    .from('users')
    .select('id, username')
    .eq('role', 'manager');
  
  if (!managers || managers.length === 0) {
    console.log('❌ Aucun manager trouvé pour créer les membres d\'équipe');
    return;
  }
  
  const testMembers = [
    {
      name: 'Marie Dubois',
      role: 'Opérateur',
      status: 'online',
      rating: 4,
      location: 'Zone 1',
      phone: '0123456789',
      email: 'marie@example.com',
      shift: 'matin',
      performance: 85,
      tasks_completed: 12,
      manager_id: managers[0].id
    },
    {
      name: 'Pierre Martin',
      role: 'Superviseur',
      status: 'busy',
      rating: 5,
      location: 'Zone 2',
      phone: '0987654321',
      email: 'pierre@example.com',
      shift: 'après-midi',
      performance: 92,
      tasks_completed: 18,
      manager_id: managers[0].id
    },
    {
      name: 'Sophie Bernard',
      role: 'Opérateur',
      status: 'offline',
      rating: 3,
      location: 'Zone 3',
      phone: '0555666777',
      email: 'sophie@example.com',
      shift: 'soir',
      performance: 78,
      tasks_completed: 8,
      manager_id: managers[1]?.id || managers[0].id
    },
    {
      name: 'Thomas Leroy',
      role: 'Superviseur',
      status: 'online',
      rating: 4,
      location: 'Zone 4',
      phone: '0444333222',
      email: 'thomas@example.com',
      shift: 'matin',
      performance: 88,
      tasks_completed: 15,
      manager_id: managers[1]?.id || managers[0].id
    }
  ];
  
  for (const member of testMembers) {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .insert(member)
        .select();
      
      if (error) {
        console.log(`❌ Erreur création membre ${member.name}: ${error.message}`);
      } else {
        console.log(`✅ Membre ${member.name} créé (ID: ${data[0].id})`);
      }
    } catch (error) {
      console.log(`❌ Erreur création membre ${member.name}: ${error.message}`);
    }
  }
}

async function createTestTasks() {
  console.log('\n📋 Création des tâches de test...');
  
  // Récupérer les IDs des managers
  const { data: managers } = await supabase
    .from('users')
    .select('id, username, full_name')
    .eq('role', 'manager');
  
  if (!managers || managers.length === 0) {
    console.log('❌ Aucun manager trouvé pour créer les tâches');
    return;
  }
  
  const today = new Date().toISOString().split('T')[0];
  
  const testTasks = [
    {
      title: 'Livraison Express',
      start_time: '08:00:00',
      end_time: '10:00:00',
      duration: '2h',
      date: today,
      packages: 150,
      team_size: 3,
      manager_section: 'Section A',
      manager_initials: 'JD',
      palette_condition: false,
      manager_id: managers[0].id
    },
    {
      title: 'Tri Matinal',
      start_time: '06:00:00',
      end_time: '08:00:00',
      duration: '2h',
      date: today,
      packages: 200,
      team_size: 2,
      manager_section: 'Section A',
      manager_initials: 'JD',
      palette_condition: true,
      manager_id: managers[0].id
    },
    {
      title: 'Préparation Commandes',
      start_time: '14:00:00',
      end_time: '16:00:00',
      duration: '2h',
      date: today,
      packages: 120,
      team_size: 4,
      manager_section: 'Section B',
      manager_initials: 'MM',
      palette_condition: false,
      manager_id: managers[1]?.id || managers[0].id
    }
  ];
  
  for (const task of testTasks) {
    try {
      const { data, error } = await supabase
        .from('scheduled_tasks')
        .insert(task)
        .select();
      
      if (error) {
        console.log(`❌ Erreur création tâche ${task.title}: ${error.message}`);
      } else {
        console.log(`✅ Tâche ${task.title} créée (ID: ${data[0].id})`);
      }
    } catch (error) {
      console.log(`❌ Erreur création tâche ${task.title}: ${error.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Initialisation de Supabase pour Optines\n');
  
  // Test de connexion
  const isConnected = await testConnection();
  if (!isConnected) {
    console.log('\n❌ Impossible de se connecter à Supabase. Vérifiez votre configuration.');
    return;
  }
  
  // Vérifier les tables
  await checkTables();
  
  // Créer les données de test
  await createTestUsers();
  await createTestTeamMembers();
  await createTestTasks();
  
  console.log('\n🎉 Initialisation terminée !');
  console.log('\n📱 Vous pouvez maintenant tester l\'application avec :');
  console.log('   Username: manager1');
  console.log('   Password: password123');
  console.log('   Role: manager');
}

// Exécuter le script
main().catch(console.error); 