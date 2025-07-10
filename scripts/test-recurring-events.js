const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vqwgnvrhcaosnjczuwth.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODc0MjQsImV4cCI6MjA2NzU2MzQyNH0.3R5XkNZGMLmLUI1A5iExLnhsIyiwIyz0Azu7eInQHq4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRecurringEvents() {
  console.log('🧪 Test des événements récurrents...');
  
  try {
    // 1. Vérifier si les tables existent
    console.log('\n📋 1. Vérification des tables...');
    
    const { data: eventsCheck, error: eventsError } = await supabase
      .from('scheduled_events')
      .select('id')
      .limit(1);
    
    if (eventsError) {
      console.log('❌ Table scheduled_events non trouvée. Exécutez d\'abord le schéma SQL !');
      console.log('🔗 Allez sur : https://vqwgnvrhcaosnjczuwth.supabase.co/project/vqwgnvrhcaosnjczuwth/sql/new');
      return;
    }
    
    console.log('✅ Table scheduled_events trouvée');
    
    // 2. Vérifier les fonctions PostgreSQL
    console.log('\n🔧 2. Test des fonctions PostgreSQL...');
    
    const { data: funcResult, error: funcError } = await supabase
      .rpc('generate_tasks_for_date', {
        target_date: new Date().toISOString().split('T')[0]
      });
    
    if (funcError) {
      console.log('❌ Fonction generate_tasks_for_date non trouvée:', funcError.message);
      return;
    }
    
    console.log('✅ Fonction generate_tasks_for_date disponible');
    console.log(`   ${funcResult || 0} tâche(s) générée(s) pour aujourd'hui`);
    
    // 3. Créer un événement récurrent de test
    console.log('\n➕ 3. Création d\'un événement récurrent de test...');
    
    const testEvent = {
      title: 'Test Mise en Rayon Quotidienne',
      description: 'Événement de test pour la récurrence quotidienne',
      start_time: '07:00:00',
      duration_minutes: 90, // 1h30
      packages: 150,
      team_size: 2,
      manager_section: 'Test Section',
      manager_initials: 'TS',
      palette_condition: true,
      team_members: [1, 2],
      recurrence_type: 'weekdays', // Lun-Ven
      recurrence_days: [1, 2, 3, 4, 5],
      start_date: new Date().toISOString().split('T')[0],
      end_date: null, // Récurrence infinie
      is_active: true,
      manager_id: 'test-manager-001',
      store_id: 1
    };
    
    const { data: newEvent, error: createError } = await supabase
      .from('scheduled_events')
      .insert([testEvent])
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Erreur lors de la création de l\'événement:', createError.message);
      return;
    }
    
    console.log('✅ Événement récurrent créé avec succès !');
    console.log(`   ID: ${newEvent.id}`);
    console.log(`   Type: ${newEvent.recurrence_type}`);
    console.log(`   Jours: ${newEvent.recurrence_days.join(', ')}`);
    
    // 4. Générer les tâches pour cette semaine
    console.log('\n🔄 4. Génération des tâches pour cette semaine...');
    
    const today = new Date();
    const dates = [];
    
    // Générer pour 7 jours à partir d'aujourd'hui
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    let totalGenerated = 0;
    
    for (const date of dates) {
      const { data: generated, error: genError } = await supabase
        .rpc('generate_tasks_for_date', { target_date: date });
      
      if (genError) {
        console.log(`❌ Erreur génération pour ${date}:`, genError.message);
      } else {
        const count = generated || 0;
        totalGenerated += count;
        if (count > 0) {
          console.log(`   ${date}: ${count} tâche(s) générée(s)`);
        }
      }
    }
    
    console.log(`\n✅ Total: ${totalGenerated} tâche(s) générée(s) pour cette semaine`);
    
    // 5. Vérifier les tâches générées
    console.log('\n📋 5. Vérification des tâches générées...');
    
    const { data: generatedTasks, error: tasksError } = await supabase
      .from('generated_tasks')
      .select(`
        *,
        scheduled_tasks (
          id,
          title,
          date,
          start_time,
          end_time,
          packages
        )
      `)
      .eq('scheduled_event_id', newEvent.id)
      .order('generated_for_date', { ascending: true });
    
    if (tasksError) {
      console.log('❌ Erreur lors de la récupération des tâches:', tasksError.message);
    } else {
      console.log(`✅ ${generatedTasks.length} tâche(s) trouvée(s) dans la table de liaison`);
      
      generatedTasks.forEach((gt, index) => {
        const task = gt.scheduled_tasks;
        console.log(`   ${index + 1}. ${task.title} - ${task.date} (${task.start_time}-${task.end_time}) - ${task.packages} colis`);
      });
    }
    
    // 6. Tester différents types de récurrence
    console.log('\n🔄 6. Test des autres types de récurrence...');
    
    const recurrenceTests = [
      {
        type: 'daily',
        days: [1, 2, 3, 4, 5, 6, 7],
        description: 'Tous les jours'
      },
      {
        type: 'weekly',
        days: [1], // Lundi seulement
        description: 'Chaque lundi'
      },
      {
        type: 'custom',
        days: [2, 4, 6], // Mar, Jeu, Sam
        description: 'Mardi, Jeudi, Samedi'
      }
    ];
    
    for (const test of recurrenceTests) {
      const testEvent2 = {
        ...testEvent,
        title: `Test ${test.description}`,
        recurrence_type: test.type,
        recurrence_days: test.days,
        manager_id: `test-manager-${test.type}`
      };
      
      const { data: event2, error: createError2 } = await supabase
        .from('scheduled_events')
        .insert([testEvent2])
        .select()
        .single();
      
      if (createError2) {
        console.log(`❌ Erreur création ${test.type}:`, createError2.message);
      } else {
        console.log(`✅ Événement ${test.description} créé (ID: ${event2.id})`);
      }
    }
    
    // 7. Statistiques finales
    console.log('\n📊 7. Statistiques finales...');
    
    const { data: allEvents, error: statsError } = await supabase
      .from('scheduled_events')
      .select('id, title, recurrence_type, is_active')
      .eq('manager_id', 'test-manager-001');
    
    if (statsError) {
      console.log('❌ Erreur récupération stats:', statsError.message);
    } else {
      console.log(`✅ ${allEvents.length} événement(s) récurrent(s) de test créé(s)`);
      
      const activeEvents = allEvents.filter(e => e.is_active).length;
      console.log(`   ${activeEvents} actif(s), ${allEvents.length - activeEvents} inactif(s)`);
      
      const byType = allEvents.reduce((acc, event) => {
        acc[event.recurrence_type] = (acc[event.recurrence_type] || 0) + 1;
        return acc;
      }, {});
      
      console.log('   Répartition par type:');
      Object.entries(byType).forEach(([type, count]) => {
        console.log(`     - ${type}: ${count}`);
      });
    }
    
    console.log('\n🎉 Test terminé avec succès !');
    console.log('\n📝 Prochaines étapes :');
    console.log('   1. Tester l\'interface utilisateur dans l\'app');
    console.log('   2. Créer des événements récurrents via le calculateur');
    console.log('   3. Vérifier la génération automatique des tâches');
    console.log('   4. Configurer un système de génération automatique quotidienne');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Fonction pour nettoyer les données de test
async function cleanupTestData() {
  console.log('🧹 Nettoyage des données de test...');
  
  try {
    // Supprimer les événements de test
    const { error: deleteEventsError } = await supabase
      .from('scheduled_events')
      .delete()
      .like('manager_id', 'test-manager-%');
    
    if (deleteEventsError) {
      console.log('❌ Erreur suppression événements:', deleteEventsError.message);
    } else {
      console.log('✅ Événements de test supprimés');
    }
    
    // Les tâches générées et liaisons seront supprimées automatiquement (CASCADE)
    console.log('✅ Nettoyage terminé');
    
  } catch (error) {
    console.error('❌ Erreur nettoyage:', error);
  }
}

// Exécuter le test
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--cleanup')) {
    cleanupTestData();
  } else {
    testRecurringEvents();
  }
} 