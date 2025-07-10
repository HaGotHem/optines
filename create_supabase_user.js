const { createClient } = require('@supabase/supabase-js');

// Remplace par l'URL de ton projet Supabase
const SUPABASE_URL = 'https://vqwgnvrhcaosnjczuwth.supabase.co';
// Ta clé service_role (ne jamais mettre côté client !)
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk4NzQyNCwiZXhwIjoyMDY3NTYzNDI0fQ.H_YkS5VWgYY2c9-F08b5gz_2ofJGclXyM00BXZzz9Mk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function createDirecteur() {
  // 1. Création dans Auth
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'directeur@exemple.com',
    password: 'TestDirecteur',
    email_confirm: true,
    user_metadata: { username: 'directeur', role: 'directeur' }
  });

  if (error) {
    console.error('❌ Erreur création utilisateur Auth:', error.message);
    return;
  }

  const userId = data.user.id; // L’UUID Auth

  // 2. Ajout dans la table users
  const { error: dbError } = await supabase
    .from('users')
    .insert([
      {
        id: userId, // même id que Auth
        username: 'directeur',
        email: 'directeur@exemple.com',
        role: 'directeur'
      }
    ]);

  if (dbError) {
    console.error('❌ Erreur insertion table users:', dbError.message);
  } else {
    console.log('✅ Utilisateur directeur créé et synchronisé !');
    console.log('Email: directeur@exemple.com');
    console.log('Mot de passe: TestDirecteur');
    console.log('UUID:', userId);
  }
}

createDirecteur();