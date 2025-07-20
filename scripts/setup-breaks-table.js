const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration Supabase
const supabaseUrl = 'https://vqwgnvrhcaosnjczuwth.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODc0MjQsImV4cCI6MjA2NzU2MzQyNH0.3R5XkNZGMLmLUI1A5iExLnhsIyiwIyz0Azu7eInQHq4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupBreaksTable() {
  console.log('🔧 Configuration de la table breaks...\n');

  try {
    // Lire le fichier SQL
    const sqlPath = path.join(__dirname, 'create-breaks-table.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📋 Exécution du script SQL...');
    
    // Exécuter le script SQL
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      // Si la fonction RPC n'existe pas, on essaie une approche alternative
      console.log('⚠️ RPC exec_sql non disponible, tentative d\'exécution directe...');
      
      // Diviser le script en commandes individuelles
      const commands = sqlContent.split(';').filter(cmd => cmd.trim());
      
      for (const command of commands) {
        if (command.trim()) {
          try {
            const { error: cmdError } = await supabase.rpc('exec_sql', { sql: command + ';' });
            if (cmdError) {
              console.log(`   ⚠️ Commande ignorée (probablement déjà exécutée): ${command.substring(0, 50)}...`);
            }
          } catch (e) {
            console.log(`   ⚠️ Commande ignorée: ${command.substring(0, 50)}...`);
          }
        }
      }
    }

    // Vérifier que la table existe maintenant
    console.log('\n📋 Vérification de la table breaks...');
    const { data: tableCheck, error: checkError } = await supabase
      .from('breaks')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('❌ La table breaks n\'existe toujours pas:', checkError.message);
      console.log('\n💡 Solution alternative :');
      console.log('   1. Connectez-vous à votre dashboard Supabase');
      console.log('   2. Allez dans l\'éditeur SQL');
      console.log('   3. Copiez et exécutez le contenu du fichier scripts/create-breaks-table.sql');
      return;
    }

    console.log('✅ Table breaks créée avec succès !');
    
    // Test de création d'une pause
    console.log('\n📋 Test de création d\'une pause...');
    const { data: employees } = await supabase
      .from('team_members')
      .select('id')
      .limit(1);

    if (employees && employees.length > 0) {
      const testBreak = {
        employee_id: employees[0].id,
        start_time: '12:00:00',
        end_time: '12:30:00',
        date: new Date().toISOString().split('T')[0],
        break_type: 'pause',
        description: 'Test de création',
        is_recurring: false,
        recurrence_days: [],
        recurrence_end_date: null
      };

      const { data: newBreak, error: createError } = await supabase
        .from('breaks')
        .insert([testBreak])
        .select()
        .single();

      if (createError) {
        console.error('❌ Erreur lors du test de création:', createError);
      } else {
        console.log('✅ Test de création réussi !');
        
        // Supprimer la pause de test
        await supabase
          .from('breaks')
          .delete()
          .eq('id', newBreak.id);
        
        console.log('✅ Pause de test supprimée');
      }
    }

    console.log('\n🎉 Configuration terminée avec succès !');
    console.log('\n📝 Fonctionnalités disponibles :');
    console.log('   - Création de pauses simples');
    console.log('   - Création de pauses récurrentes');
    console.log('   - Sélection des jours de répétition');
    console.log('   - Date de fin de répétition');
    console.log('   - Gestion par le manager dans la page équipe rayon');

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error);
  }
}

setupBreaksTable(); 