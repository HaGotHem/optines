const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://vqwgnvrhcaosnjczuwth.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODc0MjQsImV4cCI6MjA2NzU2MzQyNH0.3R5XkNZGMLmLUI1A5iExLnhsIyiwIyz0Azu7eInQHq4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTaskInsert() {
  try {
    console.log('🔍 Test d\'insertion de tâche...');
    
    // 1. Vérifier les managers disponibles
    console.log('👥 Vérification des managers...');
    const { data: managers, error: managersError } = await supabase
      .from('users')
      .select('id, full_name, section')
      .eq('role', 'manager')
      .eq('is_active', true);
    
    if (managersError) {
      console.error('❌ Erreur lors de la récupération des managers:', managersError);
      return;
    }
    
    console.log('✅ Managers trouvés:', managers);
    
    if (managers.length === 0) {
      console.error('❌ Aucun manager trouvé');
      return;
    }
    
    const selectedManager = managers[0];
    console.log('🎯 Manager sélectionné:', selectedManager);
    
    // 2. Tester avec une tâche similaire à celle du formulaire
    console.log('\n🧪 Test avec une tâche du formulaire...');
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Date d\'aujourd\'hui:', today);
    
    const taskData = {
      title: 'Test Tâche Directeur',
      description: 'Tâche créée depuis le dashboard directeur',
      start_time: '09:00:00',
      end_time: '10:00:00',
      duration: '1h00',
      date: today,
      packages: 0,
      team_size: 2,
      manager_section: selectedManager.section || 'Test Section',
      manager_initials: selectedManager.full_name?.substring(0, 2).toUpperCase() || 'TT',
      palette_condition: false,
      is_pinned: false,
      is_completed: false,
      team_members: [],
      manager_id: selectedManager.id,
      store_id: 1
    };
    
    console.log('📤 Données envoyées:', JSON.stringify(taskData, null, 2));
    
    const { data: insertData, error: insertError } = await supabase
      .from('scheduled_tasks')
      .insert([taskData])
      .select();
    
    if (insertError) {
      console.error('❌ Erreur d\'insertion:', insertError);
      console.error('Message:', insertError.message);
      console.error('Détails:', insertError.details);
      console.error('Hint:', insertError.hint);
    } else {
      console.log('✅ Insertion réussie:', insertData);
    }
    
    // 3. Vérifier les tâches existantes
    console.log('\n📊 Vérification des tâches existantes...');
    const { data: existingTasks, error: selectError } = await supabase
      .from('scheduled_tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (selectError) {
      console.error('❌ Erreur lors de la sélection:', selectError);
    } else {
      console.log('✅ Tâches existantes:', existingTasks?.length || 0);
      if (existingTasks && existingTasks.length > 0) {
        console.log('Dernière tâche créée:', JSON.stringify(existingTasks[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testTaskInsert(); 