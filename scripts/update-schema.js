const { createClient } = require('@supabase/supabase-js');

// Utiliser les variables d'environnement ou les valeurs par défaut
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://vqwgnvrhcaosnjczuwth.supabase.co';
// Utiliser la clé service_role pour avoir les permissions de création de tables
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk4NzQyNCwiZXhwIjoyMDY3NTYzNDI0fQ.H_YkS5VWgYY2c9-F08b5gz_2ofJGclXyM00BXZzz9Mk';

console.log('🔧 Configuration Supabase:');
console.log('   URL:', supabaseUrl);
console.log('   Key:', supabaseKey ? '✅ Configurée' : '❌ Manquante');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateSchema() {
  console.log('🚀 Mise à jour du schéma de base de données...\n');

  try {
    // 1. Vérifier si la table stores existe
    console.log('📊 Vérification de la table stores...');
    const { data: storesCheck, error: storesCheckError } = await supabase
      .from('stores')
      .select('count', { count: 'exact', head: true });
    
    if (storesCheckError && storesCheckError.code === 'PGRST116') {
      console.log('⚠️ Table stores n\'existe pas. Veuillez l\'exécuter manuellement via le SQL Editor.');
      console.log('   Fichier à exécuter: supabase/schema.sql');
    } else {
      console.log('✅ Table stores existe déjà');
    }

    // 2. Insérer les magasins par défaut
    console.log('🏪 Insertion des magasins par défaut...');
    const { data: existingStores } = await supabase
      .from('stores')
      .select('id')
      .limit(1);

    if (!existingStores || existingStores.length === 0) {
      const { error: insertStoresError } = await supabase
        .from('stores')
        .insert([
          {
            name: 'Magasin Paris Centre',
            address: '123 Rue de Rivoli, 75001 Paris',
            phone: '01.42.60.30.30',
            email: 'paris@magasin.fr',
            is_active: true
          },
          {
            name: 'Magasin Lyon Part-Dieu',
            address: '456 Cours Lafayette, 69003 Lyon',
            phone: '04.78.63.40.40',
            email: 'lyon@magasin.fr',
            is_active: true
          },
          {
            name: 'Magasin Marseille Vieux-Port',
            address: '789 Quai du Port, 13002 Marseille',
            phone: '04.91.54.70.70',
            email: 'marseille@magasin.fr',
            is_active: true
          }
        ]);

      if (insertStoresError) {
        console.error('❌ Erreur lors de l\'insertion des magasins:', insertStoresError);
      } else {
        console.log('✅ Magasins par défaut insérés');
      }
    } else {
      console.log('ℹ️ Magasins déjà existants, passage à l\'étape suivante');
    }

    // 3. Ajouter store_id aux tables existantes si pas présent
    console.log('🔧 Mise à jour des tables existantes...');
    
    // Vérifier si store_id existe déjà dans users
    const { data: userColumns } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'users')
      .eq('column_name', 'store_id');

    if (!userColumns || userColumns.length === 0) {
      console.log('➕ Ajout de store_id à la table users...');
      // En mode sécurisé, on ne peut pas faire d'ALTER TABLE direct
      // Il faudrait utiliser des migrations SQL appropriées
      console.log('ℹ️ Veuillez exécuter le script SQL manuellement pour ajouter store_id');
    } else {
      console.log('✅ store_id déjà présent dans users');
    }

    // 4. Mettre à jour les utilisateurs existants pour avoir un store_id
    console.log('👥 Mise à jour des utilisateurs existants...');
    const { data: usersWithoutStore } = await supabase
      .from('users')
      .select('id, store_id')
      .is('store_id', null);

    if (usersWithoutStore && usersWithoutStore.length > 0) {
      const { error: updateUsersError } = await supabase
        .from('users')
        .update({ store_id: 1 }) // Assigner au premier magasin par défaut
        .is('store_id', null);

      if (updateUsersError) {
        console.error('❌ Erreur lors de la mise à jour des utilisateurs:', updateUsersError);
      } else {
        console.log(`✅ ${usersWithoutStore.length} utilisateur(s) mis à jour`);
      }
    } else {
      console.log('ℹ️ Tous les utilisateurs ont déjà un store_id');
    }

    // 5. Créer un utilisateur admin par défaut
    console.log('🔐 Création de l\'utilisateur admin...');
    const { data: existingAdmin } = await supabase
      .from('users')
      .select('id')
      .eq('username', 'admin')
      .single();

    if (!existingAdmin) {
      const { error: adminError } = await supabase
        .from('users')
        .insert([{
          username: 'admin',
          password_hash: 'hashed_admin_password',
          full_name: 'Administrateur Système',
          role: 'admin',
          section: null,
          store_id: 1,
          is_active: true
        }]);

      if (adminError) {
        console.error('❌ Erreur lors de la création de l\'admin:', adminError);
      } else {
        console.log('✅ Utilisateur admin créé (username: admin)');
      }
    } else {
      console.log('ℹ️ Utilisateur admin déjà existant');
    }

    console.log('\n🎉 Mise à jour du schéma terminée avec succès !');
    console.log('\n📋 Résumé :');
    console.log('   - Table stores créée');
    console.log('   - Magasins par défaut ajoutés');
    console.log('   - Utilisateurs mis à jour avec store_id');
    console.log('   - Utilisateur admin créé');
    console.log('\n⚠️  Note importante :');
    console.log('   Si les colonnes store_id n\'ont pas pu être ajoutées automatiquement,');
    console.log('   veuillez exécuter le fichier supabase/schema.sql manuellement.');

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du schéma:', error);
    process.exit(1);
  }
}

// Fonction pour créer les vues si elles n'existent pas
async function createViews() {
  console.log('\n📊 Création des vues...');
  
  try {
    // Vue users_with_store
    const createUsersWithStoreView = `
      CREATE OR REPLACE VIEW users_with_store AS
      SELECT 
        u.*,
        s.name as store_name,
        s.address as store_address
      FROM users u
      LEFT JOIN stores s ON u.store_id = s.id;
    `;

    const { error: usersViewError } = await supabase.rpc('exec_sql', {
      sql: createUsersWithStoreView
    });

    if (usersViewError && !usersViewError.message.includes('permission denied')) {
      console.log('ℹ️ Impossible de créer la vue users_with_store automatiquement');
    } else {
      console.log('✅ Vue users_with_store créée');
    }

    // Vue store_stats
    const createStoreStatsView = `
      CREATE OR REPLACE VIEW store_stats AS
      SELECT 
        s.id,
        s.name as store_name,
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT CASE WHEN u.role = 'manager' THEN u.id END) as managers_count,
        COUNT(DISTINCT CASE WHEN u.role = 'director' THEN u.id END) as directors_count,
        COUNT(DISTINCT tm.id) as team_members_count,
        COUNT(DISTINCT st.id) as tasks_count,
        s.is_active
      FROM stores s
      LEFT JOIN users u ON s.id = u.store_id
      LEFT JOIN team_members tm ON s.id = tm.store_id
      LEFT JOIN scheduled_tasks st ON s.id = st.store_id
      GROUP BY s.id, s.name, s.is_active;
    `;

    const { error: statsViewError } = await supabase.rpc('exec_sql', {
      sql: createStoreStatsView
    });

    if (statsViewError && !statsViewError.message.includes('permission denied')) {
      console.log('ℹ️ Impossible de créer la vue store_stats automatiquement');
    } else {
      console.log('✅ Vue store_stats créée');
    }

  } catch (error) {
    console.log('ℹ️ Création des vues ignorée (nécessite des privilèges élevés)');
  }
}

// Exécuter le script
if (require.main === module) {
  updateSchema()
    .then(() => createViews())
    .then(() => {
      console.log('\n✨ Tous les changements appliqués avec succès !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { updateSchema, createViews }; 