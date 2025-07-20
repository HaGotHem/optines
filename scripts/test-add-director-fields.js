const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://vqwgnvrhcaosnjczuwth.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODc0MjQsImV4cCI6MjA2NzU2MzQyNH0.3R5XkNZGMLmLUI1A5iExLnhsIyiwIyz0Azu7eInQHq4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAddDirectorFields() {
  try {
    console.log('🔧 Test d\'ajout des champs directeur...');
    
    // 1. Vérifier la structure actuelle de la table
    console.log('📋 Vérification de la structure actuelle...');
    const { data: existingTasks, error: selectError } = await supabase
      .from('scheduled_tasks')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.error('❌ Erreur lors de la vérification:', selectError);
      return;
    }
    
    console.log('✅ Structure actuelle:', Object.keys(existingTasks[0] || {}));
    
    // 2. Tester l'insertion avec les nouveaux champs
    console.log('\n🧪 Test d\'insertion avec nouveaux champs...');
    const testTask = {
      title: 'Test Tâche Directeur avec nouveaux champs',
      description: 'Test des nouveaux champs assigned_by_director et director_id',
      start_time: '10:00:00',
      end_time: '11:00:00',
      duration: '1h00',
      date: '2025-07-20',
      packages: 0,
      team_size: 2,
      manager_section: 'Test Section',
      manager_initials: 'TT',
      palette_condition: false,
      is_pinned: false,
      is_completed: false,
      team_members: [],
      manager_id: '2a0953a5-d2f0-4684-85a5-1ee90887d315',
      store_id: 1,
      assigned_by_director: true,
      director_id: '4501ff45-84e0-45c7-bf29-2b3fbb619107'
    };
    
    console.log('📤 Données de test:', JSON.stringify(testTask, null, 2));
    
    const { data: insertData, error: insertError } = await supabase
      .from('scheduled_tasks')
      .insert([testTask])
      .select();
    
    if (insertError) {
      console.error('❌ Erreur d\'insertion:', insertError);
      console.error('Message:', insertError.message);
      console.error('Détails:', insertError.details);
      console.error('Hint:', insertError.hint);
    } else {
      console.log('✅ Insertion réussie avec nouveaux champs:', insertData);
    }
    
    // 3. Vérifier les tâches avec les nouveaux champs
    console.log('\n📊 Vérification des tâches avec nouveaux champs...');
    const { data: tasksWithDirector, error: filterError } = await supabase
      .from('scheduled_tasks')
      .select('*')
      .eq('assigned_by_director', true)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (filterError) {
      console.error('❌ Erreur lors du filtrage:', filterError);
    } else {
      console.log('✅ Tâches assignées par directeur:', tasksWithDirector?.length || 0);
      if (tasksWithDirector && tasksWithDirector.length > 0) {
        console.log('Exemple:', JSON.stringify(tasksWithDirector[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testAddDirectorFields(); 