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
  
  const tables = ['stores', 'users', 'team_members', 'scheduled_tasks', 'alerts', 'scheduled_events', 'breaks', 'working_hours'];
  
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
  
  console.log('\n🎉 Initialisation terminée !');
  console.log('\n📱 Vous pouvez maintenant créer des utilisateurs via le panel développeur.');
}

// Exécuter le script
main().catch(console.error); 