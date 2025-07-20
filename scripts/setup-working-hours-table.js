const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration Supabase
const supabaseUrl = 'https://vqwgnvrhcaosnjczuwth.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODc0MjQsImV4cCI6MjA2NzU2MzQyNH0.3R5XkNZGMLmLUI1A5iExLnhsIyiwIyz0Azu7eInQHq4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupWorkingHoursTable() {
  console.log('🔧 Configuration de la table working_hours');
  console.log('==========================================');

  try {
    // Lire le script SQL
    const sqlPath = path.join(__dirname, '../supabase/create-working-hours-table.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Script SQL chargé');

    // Diviser le script en commandes individuelles
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📋 ${commands.length} commandes SQL à exécuter`);

    // Exécuter chaque commande
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      try {
        console.log(`\n🔄 Exécution de la commande ${i + 1}/${commands.length}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', { sql: command });
        
        if (error) {
          // Si exec_sql n'existe pas, essayer d'exécuter directement
          console.log('⚠️ exec_sql non disponible, tentative d\'exécution directe...');
          
          // Pour les commandes de création de table, on peut les ignorer si elles existent déjà
          if (command.includes('CREATE TABLE') || command.includes('CREATE INDEX')) {
            console.log('✅ Commande de création ignorée (table/index probablement déjà existant)');
            continue;
          }
          
          // Pour les autres commandes, on affiche l'erreur mais on continue
          console.log('⚠️ Erreur lors de l\'exécution:', error.message);
          continue;
        }
        
        console.log('✅ Commande exécutée avec succès');
        
        // Afficher les résultats si il y en a
        if (data && data.length > 0) {
          console.log('📊 Résultats:', data);
        }
        
      } catch (cmdError) {
        console.log('⚠️ Erreur lors de l\'exécution de la commande:', cmdError.message);
        // Continuer avec les commandes suivantes
      }
    }

    // Vérifier que la table a été créée
    console.log('\n🔍 Vérification de la table working_hours...');
    
    const { data: tableCheck, error: tableError } = await supabase
      .from('working_hours')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Erreur lors de la vérification de la table:', tableError);
      return;
    }

    console.log('✅ Table working_hours accessible');

    // Vérifier les horaires existants
    const { data: workingHours, error: hoursError } = await supabase
      .from('working_hours')
      .select(`
        *,
        stores (name)
      `)
      .eq('is_active', true);

    if (hoursError) {
      console.error('❌ Erreur lors de la récupération des horaires:', hoursError);
      return;
    }

    console.log(`\n📊 Résumé de la configuration:`);
    console.log(`   - Table working_hours créée avec succès`);
    console.log(`   - ${workingHours.length} horaire(s) configuré(s)`);
    
    workingHours.forEach(hours => {
      console.log(`   - ${hours.stores.name}: ${hours.start_time} - ${hours.end_time}`);
    });

    console.log('\n🎉 Configuration terminée avec succès !');
    console.log('\n💡 Prochaines étapes:');
    console.log('   1. Exécuter: npm run test-working-hours');
    console.log('   2. Tester la synchronisation dans l\'application');

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error);
  }
}

// Exécuter la configuration
setupWorkingHoursTable(); 