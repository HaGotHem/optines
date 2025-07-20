const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuration Supabase
const supabaseUrl = 'https://vqwgnvrhcaosnjczuwth.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDU5NzI5MCwiZXhwIjoyMDUwMTczMjkwfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function makePackagesOptional() {
  try {
    console.log('🔧 Modification du schéma pour rendre packages optionnel...');
    
    // Lire le fichier SQL
    const sql = fs.readFileSync('supabase/make-packages-optional.sql', 'utf8');
    
    // Exécuter les commandes SQL une par une
    const commands = sql.split(';').filter(cmd => cmd.trim());
    
    for (const command of commands) {
      if (command.trim()) {
        console.log('📝 Exécution:', command.trim().substring(0, 50) + '...');
        
        const { data, error } = await supabase.rpc('exec_sql', { sql: command.trim() });
        
        if (error) {
          console.error('❌ Erreur:', error);
        } else {
          console.log('✅ Succès');
        }
      }
    }
    
    console.log('🎉 Modification terminée !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la modification:', error);
  }
}

makePackagesOptional(); 