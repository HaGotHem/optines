const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = 'https://vqwgnvrhcaosnjczuwth.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODc0MjQsImV4cCI6MjA2NzU2MzQyNH0.3R5XkNZGMLmLUI1A5iExLnhsIyiwIyz0Azu7eInQHq4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateDatabaseSchema() {
  console.log('🔧 Mise à jour du schéma de base de données...');
  
  try {
    // D'abord vérifier la structure actuelle
    console.log('🔍 Vérification de la structure actuelle...');
    
    // Teste la connexion en listant quelques tâches
    const { data: testTasks, error: testError } = await supabase
      .from('scheduled_tasks')
      .select('id, title, manager_section')
      .limit(1);
      
    if (testError) {
      console.error('❌ Erreur de connexion à Supabase:', testError);
      return;
    }
    
    console.log('✅ Connexion Supabase établie');
    console.log('📋 Exemple de tâche existante:', testTasks?.[0] || 'Aucune tâche trouvée');
    
    // Essayer d'obtenir les colonnes disponibles en faisant une requête limitée
    console.log('🔍 Test de récupération des colonnes disponibles...');
    const { data: columnsTest, error: columnsError } = await supabase
      .from('scheduled_tasks')
      .select('id, title')
      .limit(0);
    
    if (columnsError) {
      console.log('❌ Erreur lors du test de colonnes:', columnsError);
    } else {
      console.log('✅ Accès de base réussi à la table scheduled_tasks');
    }
    
    // Tester d'abord avec une version simplifiée pour voir quelles colonnes existent
    const simpleTaskData = {
      title: 'Test Schema Update',
      start_time: '09:00:00',
      end_time: '10:00:00',
      duration: '1h',
      packages: 100,
      team_size: 2,
      manager_section: 'Test',
      manager_initials: 'TS',
      palette_condition: true,
      manager_id: 1
    };
    
    console.log('🧪 Test d\'insertion simple...');
    const { data: insertResult, error: insertError } = await supabase
      .from('scheduled_tasks')
      .insert([simpleTaskData])
      .select();
    
    if (insertError) {
      console.log('❌ Erreur d\'insertion (colonnes manquantes):', insertError.message);
      
      if (insertError.message.includes('team_members') || insertError.message.includes('description')) {
        console.log('⚠️  Les colonnes team_members ou description sont manquantes');
        console.log('📋 Veuillez exécuter manuellement ce script dans l\'éditeur SQL de Supabase:');
        console.log('');
        console.log('ALTER TABLE scheduled_tasks ADD COLUMN IF NOT EXISTS team_members JSONB DEFAULT \'[]\'::jsonb;');
        console.log('ALTER TABLE scheduled_tasks ADD COLUMN IF NOT EXISTS description TEXT;');
        console.log('CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_team_members ON scheduled_tasks USING GIN (team_members);');
        console.log('');
        console.log('🔗 Accédez à: https://vqwgnvrhcaosnjczuwth.supabase.co/project/vqwgnvrhcaosnjczuwth/sql/new');
      } else {
        console.log('❌ Autre erreur:', insertError);
      }
    } else {
      console.log('✅ Test d\'insertion réussi - les colonnes existent déjà');
      console.log('📊 Tâche de test créée:', insertResult?.[0]);
      
      // Supprimer la tâche de test
      if (insertResult?.[0]?.id) {
        await supabase
          .from('scheduled_tasks')
          .delete()
          .eq('id', insertResult[0].id);
        console.log('🗑️ Tâche de test supprimée');
      }
    }
    
  } catch (err) {
    console.error('❌ Erreur inattendue:', err);
  }
}

updateDatabaseSchema(); 