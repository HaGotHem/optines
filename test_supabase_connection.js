const { createClient } = require('@supabase/supabase-js');

// Remplace par tes infos Supabase
const SUPABASE_URL = 'https://vqwgnvrhcaosnjczuwth.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk4NzQyNCwiZXhwIjoyMDY3NTYzNDI0fQ.H_YkS5VWgYY2c9-F08b5gz_2ofJGclXyM00BXZzz9Mk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testConnection() {
  const { data, error } = await supabase.from('users').select('*').limit(1);

  if (error) {
    console.error('❌ Erreur de connexion ou de requête :', error.message);
  } else {
    console.log('✅ Connexion réussie ! Exemple de données :', data);
  }
}

testConnection();