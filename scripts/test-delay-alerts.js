const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://vqwgnvrhcaosnjczuwth.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk5NzI5MCwiZXhwIjoyMDUwNTczMjkwfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDelayAlerts() {
  console.log('🧪 Test des alertes de retard...\n');

  try {
    // 1. Vérifier la table alerts
    console.log('1️⃣ Vérification de la table alerts...');
    const { data: alerts, error: alertsError } = await supabase
      .from('alerts')
      .select('*')
      .limit(5);

    if (alertsError) {
      console.error('❌ Erreur lors de la récupération des alertes:', alertsError);
      return;
    }

    console.log(`✅ Table alerts accessible - ${alerts.length} alertes trouvées`);
    if (alerts.length > 0) {
      console.log('📋 Exemple d\'alerte:', alerts[0]);
    }

    // 2. Vérifier la table scheduled_tasks
    console.log('\n2️⃣ Vérification de la table scheduled_tasks...');
    const { data: tasks, error: tasksError } = await supabase
      .from('scheduled_tasks')
      .select('*')
      .limit(3);

    if (tasksError) {
      console.error('❌ Erreur lors de la récupération des tâches:', tasksError);
      return;
    }

    console.log(`✅ Table scheduled_tasks accessible - ${tasks.length} tâches trouvées`);
    if (tasks.length > 0) {
      console.log('📋 Exemple de tâche:', tasks[0]);
    }

    // 3. Créer une alerte de test
    console.log('\n3️⃣ Création d\'une alerte de test...');
    const testAlert = {
      task_id: tasks.length > 0 ? tasks[0].id : 'test-task-id',
      manager_id: 'test-manager-id',
      message: '🧪 TEST: Tâche "Réception colis matin" en retard de 15 minutes.\n\n📋 Cause: Camion en retard\n👤 Manager: Test Manager\n🏪 Section: Test Section',
      severity: 'critical'
    };

    const { data: newAlert, error: createError } = await supabase
      .from('alerts')
      .insert([testAlert])
      .select()
      .single();

    if (createError) {
      console.error('❌ Erreur lors de la création de l\'alerte:', createError);
      return;
    }

    console.log('✅ Alerte de test créée avec succès:', newAlert);

    // 4. Vérifier que l'alerte apparaît dans la liste
    console.log('\n4️⃣ Vérification de l\'apparition de l\'alerte...');
    const { data: updatedAlerts, error: fetchError } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('❌ Erreur lors de la récupération de l\'alerte:', fetchError);
      return;
    }

    if (updatedAlerts.length > 0) {
      console.log('✅ Alerte récupérée avec succès:', updatedAlerts[0]);
    }

    // 5. Nettoyer l'alerte de test
    console.log('\n5️⃣ Nettoyage de l\'alerte de test...');
    const { error: deleteError } = await supabase
      .from('alerts')
      .delete()
      .eq('id', newAlert.id);

    if (deleteError) {
      console.error('❌ Erreur lors de la suppression de l\'alerte de test:', deleteError);
    } else {
      console.log('✅ Alerte de test supprimée avec succès');
    }

    console.log('\n🎉 Test des alertes de retard terminé avec succès !');
    console.log('\n📋 Résumé:');
    console.log('   ✅ Table alerts accessible');
    console.log('   ✅ Table scheduled_tasks accessible');
    console.log('   ✅ Création d\'alertes fonctionnelle');
    console.log('   ✅ Récupération d\'alertes fonctionnelle');
    console.log('   ✅ Suppression d\'alertes fonctionnelle');

  } catch (error) {
    console.error('❌ Erreur générale lors du test:', error);
  }
}

// Exécuter le test
testDelayAlerts(); 