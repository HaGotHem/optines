const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration Supabase directe
const supabaseUrl = 'https://vqwgnvrhcaosnjczuwth.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk4NzQyNCwiZXhwIjoyMDY3NTYzNDI0fQ.H_YkS5VWgYY2c9-F08b5gz_2ofJGclXyM00BXZzz9Mk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBreaksTable() {
  console.log('🚀 Création de la table breaks...');

  try {
    // Vérifier si la table existe déjà
    const { data: existingTable, error: checkError } = await supabase
      .from('breaks')
      .select('id')
      .limit(1);

    if (checkError && checkError.message.includes('does not exist')) {
      console.log('📋 La table breaks n\'existe pas, création en cours...');
      
      // Lire le fichier SQL
      const sqlPath = path.join(__dirname, '../supabase/create-breaks-table-simple.sql');
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');
      
      console.log('💡 Veuillez exécuter manuellement ce SQL dans l\'éditeur Supabase:');
      console.log('📋 Allez sur: https://vqwgnvrhcaosnjczuwth.supabase.co/project/vqwgnvrhcaosnjczuwth/sql/new');
      console.log('📋 Copiez et collez le contenu du fichier: supabase/create-breaks-table-simple.sql');
      console.log('');
      console.log('📄 Contenu du fichier SQL:');
      console.log('=' .repeat(80));
      console.log(sqlContent);
      console.log('=' .repeat(80));
      
      return;
    } else {
      console.log('✅ La table breaks existe déjà !');
    }

    // Vérifier que la table existe maintenant
    const { data: tables, error: listError } = await supabase
      .from('breaks')
      .select('id')
      .limit(1);

    if (listError) {
      console.error('❌ Erreur lors de la vérification:', listError);
      return;
    }

    console.log('✅ Vérification : La table breaks existe bien !');

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

// Exécuter le script
createBreaksTable()
  .then(() => {
    console.log('🎉 Script terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  }); 