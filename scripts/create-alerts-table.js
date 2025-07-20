const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration Supabase avec la clé anon correcte
const supabaseUrl = 'https://vqwgnvrhcaosnjczuwth.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODc0MjQsImV4cCI6MjA2NzU2MzQyNH0.3R5XkNZGMLmLUI1A5iExLnhsIyiwIyz0Azu7eInQHq4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAlertsTable() {
  console.log('🔧 Création de la table alerts...');

  try {
    // Lire le fichier SQL
    const sqlFilePath = path.join(__dirname, '..', 'supabase', 'create-alerts-table.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('📋 Contenu SQL lu depuis le fichier');
    console.log('📝 Exécution du SQL...');

    // Diviser le SQL en commandes individuelles
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📊 ${commands.length} commandes SQL à exécuter`);

    // Exécuter chaque commande
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        console.log(`🔄 Exécution de la commande ${i + 1}/${commands.length}...`);
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: command + ';' });
          
          if (error) {
            console.log(`⚠️ Commande ${i + 1} (non critique): ${error.message}`);
          } else {
            console.log(`✅ Commande ${i + 1} exécutée avec succès`);
          }
        } catch (err) {
          console.log(`⚠️ Commande ${i + 1} (non critique): ${err.message}`);
        }
      }
    }

    // Vérifier que la table a été créée
    console.log('🔍 Vérification de la création de la table alerts...');
    const { error: checkError } = await supabase
      .from('alerts')
      .select('id')
      .limit(1);

    if (checkError) {
      console.log('❌ La table alerts n\'a pas pu être créée:', checkError.message);
      console.log('💡 Vous devrez créer la table manuellement dans le dashboard Supabase');
    } else {
      console.log('✅ Table alerts créée avec succès !');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la création de la table alerts:', error);
    console.log('💡 Instructions manuelles :');
    console.log('1. Allez dans votre dashboard Supabase');
    console.log('2. Ouvrez l\'éditeur SQL');
    console.log('3. Copiez le contenu du fichier supabase/create-alerts-table.sql');
    console.log('4. Exécutez le script SQL');
  }
}

createAlertsTable(); 