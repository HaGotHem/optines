const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://vqwgnvrhcaosnjczuwth.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODc0MjQsImV4cCI6MjA2NzU2MzQyNH0.3R5XkNZGMLmLUI1A5iExLnhsIyiwIyz0Azu7eInQHq4";

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEventsTable() {
  console.log('🔍 [DEBUG] ===== VÉRIFICATION TABLE SCHEDULED_EVENTS =====');
  
  try {
    // Essayer de récupérer les événements directement
    console.log('🔍 [DEBUG] Tentative de récupération des événements...');
    const { data: events, error: eventsError } = await supabase
      .from('scheduled_events')
      .select('*')
      .order('created_at', { ascending: false });

    if (eventsError) {
      if (eventsError.code === '42P01') {
        console.log('❌ [DEBUG] La table scheduled_events n\'existe pas');
        return;
      }
      console.error('❌ [DEBUG] Erreur lors de la récupération des événements:', eventsError);
      return;
    }

    console.log('✅ [DEBUG] La table scheduled_events existe');

    // Compter les événements
    console.log('🔍 [DEBUG] Comptage des événements...');
    const { count, error: countError } = await supabase
      .from('scheduled_events')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ [DEBUG] Erreur lors du comptage:', countError);
      return;
    }

    console.log(`✅ [DEBUG] Nombre d'événements dans la table: ${count}`);

    console.log('✅ [DEBUG] Événements récupérés:');
    events.forEach((event, index) => {
      console.log(`  ${index + 1}. ${event.title} (ID: ${event.id})`);
      console.log(`     - Date de début: ${event.start_date}`);
      console.log(`     - Date de fin: ${event.end_date || 'Aucune'}`);
      console.log(`     - Actif: ${event.is_active}`);
      console.log(`     - Manager ID: ${event.manager_id}`);
      console.log(`     - Type de récurrence: ${event.recurrence_type}`);
    });

    // Grouper par manager_id
    const eventsByManager = events.reduce((acc, event) => {
      const managerId = event.manager_id;
      if (!acc[managerId]) {
        acc[managerId] = [];
      }
      acc[managerId].push(event);
      return acc;
    }, {});

    console.log('\n🔍 [DEBUG] Événements groupés par manager_id:');
    Object.keys(eventsByManager).forEach(managerId => {
      console.log(`  Manager ID ${managerId}: ${eventsByManager[managerId].length} événements`);
    });

  } catch (error) {
    console.error('❌ [DEBUG] Erreur générale:', error);
  }
}

checkEventsTable(); 