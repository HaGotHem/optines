const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vqwgnvrhcaosnjczuwth.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODc0MjQsImV4cCI6MjA2NzU2MzQyNH0.3R5XkNZGMLmLUI1A5iExLnhsIyiwIyz0Azu7eInQHq4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeScheduledTasks() {
  console.log('🔍 Analyse de la table scheduled_tasks...');
  
  try {
    // Essayons de voir quelle structure a vraiment la table
    // en testant des colonnes basiques une par une
    
    const columnsToTest = [
      'id', 'created_at', 'updated_at',  // Colonnes basiques
      'title', 'description',            // Colonnes de contenu
      'start_time', 'end_time', 'date',  // Colonnes temporelles
      'packages', 'team_size',           // Colonnes numériques
      'manager_id', 'store_id',          // Clés étrangères
      'is_completed', 'is_pinned',       // Booléens
      'manager_section', 'manager_initials', // Infos manager
      'palette_condition',               // Conditions
      'team_members'                     // JSON array
    ];
    
    const existingColumns = [];
    const missingColumns = [];
    
    for (const column of columnsToTest) {
      try {
        const { data, error } = await supabase
          .from('scheduled_tasks')
          .select(column)
          .limit(0);
        
        if (error) {
          console.log(`❌ Colonne manquante: ${column} (${error.message})`);
          missingColumns.push(column);
        } else {
          console.log(`✅ Colonne existante: ${column}`);
          existingColumns.push(column);
        }
      } catch (err) {
        console.log(`❌ Erreur pour ${column}:`, err.message);
        missingColumns.push(column);
      }
    }
    
    console.log('\n📊 RÉSUMÉ DE L\'ANALYSE:');
    console.log(`✅ Colonnes existantes (${existingColumns.length}):`, existingColumns);
    console.log(`❌ Colonnes manquantes (${missingColumns.length}):`, missingColumns);
    
    if (missingColumns.length > 0) {
      console.log('\n🛠️ SCRIPT SQL POUR AJOUTER LES COLONNES MANQUANTES:');
      console.log('-- Copiez et collez ce script dans l\'éditeur SQL de Supabase\n');
      
      const sqlCommands = [];
      
      missingColumns.forEach(column => {
        let sqlType = 'TEXT'; // Par défaut
        
        switch (column) {
          case 'title':
          case 'description':
          case 'manager_section':
          case 'manager_initials':
          case 'duration':
            sqlType = 'TEXT';
            break;
          case 'start_time':
          case 'end_time':
            sqlType = 'TIME';
            break;
          case 'date':
            sqlType = 'DATE';
            break;
          case 'packages':
          case 'team_size':
          case 'store_id':
            sqlType = 'INTEGER';
            break;
          case 'manager_id':
            sqlType = 'TEXT'; // UUID en string
            break;
          case 'is_completed':
          case 'is_pinned':
          case 'palette_condition':
            sqlType = 'BOOLEAN DEFAULT false';
            break;
          case 'team_members':
            sqlType = 'JSONB DEFAULT \'[]\'::jsonb';
            break;
        }
        
        sqlCommands.push(`ALTER TABLE scheduled_tasks ADD COLUMN IF NOT EXISTS ${column} ${sqlType};`);
      });
      
      sqlCommands.forEach(cmd => console.log(cmd));
      
      console.log('\n-- Créer des index pour optimiser les performances');
      console.log('CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_date ON scheduled_tasks(date);');
      console.log('CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_manager ON scheduled_tasks(manager_id);');
      console.log('CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_completed ON scheduled_tasks(is_completed);');
      console.log('CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_team_members ON scheduled_tasks USING GIN(team_members);');
      
      console.log('\n🔗 Accédez à l\'éditeur SQL: https://vqwgnvrhcaosnjczuwth.supabase.co/project/vqwgnvrhcaosnjczuwth/sql/new');
    } else {
      console.log('\n✅ Toutes les colonnes nécessaires existent déjà !');
      
      // Test d'insertion complète
      console.log('\n🧪 Test d\'insertion d\'une tâche complète...');
      
      const fullTask = {
        title: 'Tâche de Test Complète',
        description: 'Test de toutes les colonnes',
        start_time: '09:00:00',
        end_time: '11:00:00',
        duration: '2h',
        date: '2025-01-11',
        packages: 150,
        team_size: 3,
        manager_section: 'Section Test',
        manager_initials: 'TT',
        palette_condition: true,
        is_completed: false,
        is_pinned: false,
        team_members: [1, 2, 3],
        manager_id: '4501ff45-84e0-45c7-bf29-2b3fbb619107',
        store_id: 1
      };
      
      const { data: result, error: insertError } = await supabase
        .from('scheduled_tasks')
        .insert([fullTask])
        .select();
      
      if (insertError) {
        console.log('❌ Erreur lors de l\'insertion complète:', insertError.message);
      } else {
        console.log('✅ Tâche complète créée avec succès !');
        console.log('📄 Tâche créée:', result[0]);
        
        // Supprimer la tâche de test
        await supabase
          .from('scheduled_tasks')
          .delete()
          .eq('id', result[0].id);
        console.log('🗑️ Tâche de test supprimée');
      }
    }
    
  } catch (err) {
    console.error('❌ Erreur générale:', err);
  }
}

analyzeScheduledTasks(); 