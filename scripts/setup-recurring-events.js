const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://vqwgnvrhcaosnjczuwth.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODc0MjQsImV4cCI6MjA2NzU2MzQyNH0.3R5XkNZGMLmLUI1A5iExLnhsIyiwIyz0Azu7eInQHq4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupRecurringEvents() {
  console.log('🔧 Configuration des événements récurrents...');
  
  try {
    // Lire le schéma SQL
    const schemaPath = path.join(__dirname, '..', 'supabase', 'recurring-events-schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Fichier schema non trouvé:', schemaPath);
      return;
    }
    
    console.log('📖 Lecture du schéma SQL...');
    const sqlContent = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('⚠️  IMPORTANT : Le schéma SQL doit être exécuté manuellement dans Supabase');
    console.log('🔗 Accédez à : https://vqwgnvrhcaosnjczuwth.supabase.co/project/vqwgnvrhcaosnjczuwth/sql/new');
    console.log('');
    console.log('📋 Copiez-collez ce schéma SQL complet :');
    console.log('='.repeat(80));
    console.log(sqlContent);
    console.log('='.repeat(80));
    console.log('');
    
    // Test de connexion à la base pour vérifier si les tables existent déjà
    console.log('🔍 Vérification des tables existantes...');
    
    const tablesToCheck = ['scheduled_events', 'generated_tasks'];
    
    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('id')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table ${tableName} n'existe pas encore`);
        } else {
          console.log(`✅ Table ${tableName} déjà existante`);
        }
      } catch (err) {
        console.log(`❌ Table ${tableName} n'existe pas encore`);
      }
    }
    
    console.log('');
    console.log('🎯 Après avoir exécuté le schéma SQL :');
    console.log('   1. Les tables scheduled_events et generated_tasks seront créées');
    console.log('   2. Les fonctions de génération automatique seront disponibles');
    console.log('   3. Des événements de test seront créés');
    console.log('   4. Vous pourrez tester avec: SELECT generate_tasks_for_date(CURRENT_DATE);');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

setupRecurringEvents(); 