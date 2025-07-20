const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://vqwgnvrhcaosnjczuwth.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODc0MjQsImV4cCI6MjA2NzU2MzQyNH0.3R5XkNZGMLmLUI1A5iExLnhsIyiwIyz0Azu7eInQHq4";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDeleteEvent() {
  console.log('🔍 [DEBUG] ===== TEST SUPPRESSION ÉVÉNEMENT =====');
  
  try {
    // Récupérer le premier événement pour le test
    const { data: events, error: fetchError } = await supabase
      .from('scheduled_events')
      .select('*')
      .limit(1);

    if (fetchError) {
      console.error('❌ [DEBUG] Erreur lors de la récupération:', fetchError);
      return;
    }

    if (!events || events.length === 0) {
      console.log('❌ [DEBUG] Aucun événement trouvé pour le test');
      return;
    }

    const eventToDelete = events[0];
    console.log('🔍 [DEBUG] Événement à supprimer:', eventToDelete);

    // Supprimer d'abord les tâches liées
    console.log('🔍 [DEBUG] Suppression des tâches liées...');
    const { error: tasksError } = await supabase
      .from('scheduled_tasks')
      .delete()
      .eq('recurring_event_id', eventToDelete.id);

    if (tasksError) {
      console.warn('⚠️ [DEBUG] Erreur lors de la suppression des tâches liées:', tasksError);
    } else {
      console.log('✅ [DEBUG] Tâches liées supprimées (ou aucune trouvée)');
    }

    // Supprimer l'événement
    console.log('🔍 [DEBUG] Suppression de l\'événement...');
    const { error: deleteError } = await supabase
      .from('scheduled_events')
      .delete()
      .eq('id', eventToDelete.id);

    if (deleteError) {
      console.error('❌ [DEBUG] Erreur lors de la suppression:', deleteError);
      return;
    }

    console.log('✅ [DEBUG] Événement supprimé avec succès');

    // Vérifier que l'événement a bien été supprimé
    const { data: remainingEvents, error: checkError } = await supabase
      .from('scheduled_events')
      .select('*')
      .eq('id', eventToDelete.id);

    if (checkError) {
      console.error('❌ [DEBUG] Erreur lors de la vérification:', checkError);
      return;
    }

    if (remainingEvents.length === 0) {
      console.log('✅ [DEBUG] Vérification réussie: l\'événement a bien été supprimé');
    } else {
      console.log('❌ [DEBUG] L\'événement existe encore:', remainingEvents);
    }

  } catch (error) {
    console.error('❌ [DEBUG] Erreur générale:', error);
  }
}

testDeleteEvent(); 