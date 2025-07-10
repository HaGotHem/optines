const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vqwgnvrhcaosnjczuwth.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODc0MjQsImV4cCI6MjA2NzU2MzQyNH0.3R5XkNZGMLmLUI1A5iExLnhsIyiwIyz0Azu7eInQHq4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestTaskToday() {
  console.log('🧪 Création d\'une tâche de test pour aujourd\'hui...');
  
  try {
    // Obtenir un manager ID valide
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
      
    if (usersError || !users || users.length === 0) {
      console.error('❌ Aucun utilisateur trouvé');
      return;
    }
    
    const managerId = users[0].id;
    console.log('👤 Manager ID utilisé:', managerId);
    
    // Créer une tâche pour aujourd'hui
    const today = new Date().toISOString().split('T')[0];
    const testTask = {
      title: 'Tâche de Test Aujourd\'hui',
      description: 'Test des nouvelles fonctionnalités - barre de progression et stats',
      start_time: '10:00:00',
      end_time: '12:00:00',
      duration: '2h',
      date: today,
      packages: 200,
      team_size: 2,
      manager_section: 'Section Test',
      manager_initials: 'ST',
      palette_condition: true,
      is_completed: false,
      is_pinned: false,
      team_members: [1, 2],
      manager_id: managerId,
      store_id: 1
    };
    
    console.log('📝 Création de la tâche pour le', today);
    
    const { data: result, error: insertError } = await supabase
      .from('scheduled_tasks')
      .insert([testTask])
      .select();
    
    if (insertError) {
      console.error('❌ Erreur lors de la création:', insertError);
      return;
    }
    
    console.log('✅ Tâche de test créée avec succès !');
    console.log('📊 Détails de la tâche:', result[0]);
    console.log('');
    console.log('🎯 Maintenant vous pouvez :');
    console.log('   1. Ouvrir l\'application mobile');
    console.log('   2. Aller sur l\'index manager');
    console.log('   3. Voir la tâche dans "Tâches du jour"');
    console.log('   4. Cliquer sur "Marquer comme fini"');
    console.log('   5. Observer la barre de progression passer à 100%');
    console.log('   6. Observer le compteur "Colis traités" se mettre à jour');
    console.log('   7. Vérifier que la tâche apparaît dans le dashboard directeur');
    
  } catch (err) {
    console.error('❌ Erreur générale:', err);
  }
}

createTestTaskToday(); 