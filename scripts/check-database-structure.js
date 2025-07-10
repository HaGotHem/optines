const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vqwgnvrhcaosnjczuwth.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODc0MjQsImV4cCI6MjA2NzU2MzQyNH0.3R5XkNZGMLmLUI1A5iExLnhsIyiwIyz0Azu7eInQHq4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseStructure() {
  console.log('🔍 Diagnostic de la structure de la base de données Supabase...');
  
  try {
    // Tester différentes tables connues pour voir lesquelles existent
    const tablesToTest = ['users', 'team_members', 'scheduled_tasks', 'stores'];
    
    for (const tableName of tablesToTest) {
      console.log(`\n📋 Test de la table: ${tableName}`);
      
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Erreur pour ${tableName}:`, error.message);
        } else {
          console.log(`✅ Table ${tableName} accessible - ${data?.length || 0} enregistrements trouvés`);
          if (data && data.length > 0) {
            console.log(`   📊 Colonnes disponibles:`, Object.keys(data[0]));
            console.log(`   📄 Exemple d'enregistrement:`, data[0]);
          }
        }
      } catch (err) {
        console.log(`❌ Exception pour ${tableName}:`, err.message);
      }
    }
    
    // Tester spécifiquement la création d'une tâche simple
    console.log('\n🧪 Test de création d\'une tâche simple...');
    
    // D'abord, essayons de voir si la table scheduled_tasks existe en essayant différentes approches
    try {
      // Test avec table users d'abord (qui devrait exister)
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (!usersError && users && users.length > 0) {
        console.log('✅ Table users accessible, manager_id disponible:', users[0].id);
        
        // Maintenant essayons de créer une tâche très simple
        const minimalTask = {
          title: 'Test Diagnostic',
          manager_id: users[0].id
        };
        
        const { data: taskResult, error: taskError } = await supabase
          .from('scheduled_tasks')
          .insert([minimalTask])
          .select();
        
        if (taskError) {
          console.log('❌ Erreur lors de la création de tâche:', taskError.message);
          console.log('💡 Il semble que la table scheduled_tasks n\'existe pas ou n\'a pas la bonne structure');
        } else {
          console.log('✅ Tâche créée avec succès:', taskResult[0]);
          
          // Supprimer la tâche de test
          await supabase
            .from('scheduled_tasks')
            .delete()
            .eq('id', taskResult[0].id);
          console.log('🗑️ Tâche de test supprimée');
        }
      } else {
        console.log('❌ Aucun utilisateur trouvé pour le test');
      }
    } catch (err) {
      console.log('❌ Erreur lors du test de création:', err.message);
    }
    
  } catch (err) {
    console.error('❌ Erreur générale:', err);
  }
}

checkDatabaseStructure(); 