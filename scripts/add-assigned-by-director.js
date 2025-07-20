const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuration Supabase
const supabaseUrl = 'https://vqwgnvrhcaosnjczuwth.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODc0MjQsImV4cCI6MjA2NzU2MzQyNH0.3R5XkNZGMLmLUI1A5iExLnhsIyiwIyz0Azu7eInQHq4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addAssignedByDirector() {
  try {
    console.log('🔧 Ajout du champ assigned_by_director...');
    
    // Lire le fichier SQL
    const sql = fs.readFileSync('supabase/add-assigned-by-director.sql', 'utf8');
    
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

addAssignedByDirector(); 