const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://vqwgnvrhcaosnjczuwth.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODc0MjQsImV4cCI6MjA2NzU2MzQyNH0.3R5XkNZGMLmLUI1A5iExLnhsIyiwIyz0Azu7eInQHq4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTaskInsert() {
  try {
    console.log('🔍 Test d\'insertion de tâche...');
    
    // 1. Vérifier la structure de la table
    console.log('📋 Vérification de la structure de la table...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'scheduled_tasks')
      .eq('table_schema', 'public');
    
    if (tableError) {
      console.error('❌ Erreur lors de la vérification de la structure:', tableError);
    } else {
      console.log('✅ Structure de la table:');
      tableInfo.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
    // 2. Tester avec une tâche minimale
    console.log('\n🧪 Test avec une tâche minimale...');
    const minimalTask = {
      title: 'Test Task',
      start_time: '09:00:00',
      end_time: '10:00:00',
      duration: '1h00',
      date: '2025-01-20',
      packages: 0,
      team_size: 1,
      manager_section: 'Test Section',
      manager_initials: 'TT',
      manager_id: 1,
      store_id: 1,
      team_members: []
    };
    
    console.log('📤 Données envoyées:', JSON.stringify(minimalTask, null, 2));
    
    const { data: insertData, error: insertError } = await supabase
      .from('scheduled_tasks')
      .insert([minimalTask])
      .select();
    
    if (insertError) {
      console.error('❌ Erreur d\'insertion:', insertError);
      console.error('Message:', insertError.message);
      console.error('Détails:', insertError.details);
      console.error('Hint:', insertError.hint);
    } else {
      console.log('✅ Insertion réussie:', insertData);
    }
    
    // 3. Vérifier les données existantes
    console.log('\n📊 Vérification des données existantes...');
    const { data: existingTasks, error: selectError } = await supabase
      .from('scheduled_tasks')
      .select('*')
      .limit(5);
    
    if (selectError) {
      console.error('❌ Erreur lors de la sélection:', selectError);
    } else {
      console.log('✅ Tâches existantes:', existingTasks?.length || 0);
      if (existingTasks && existingTasks.length > 0) {
        console.log('Exemple de tâche:', JSON.stringify(existingTasks[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testTaskInsert(); 