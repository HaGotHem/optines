const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase directe
const supabaseUrl = 'https://vqwgnvrhcaosnjczuwth.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk4NzQyNCwiZXhwIjoyMDY3NTYzNDI0fQ.H_YkS5VWgYY2c9-F08b5gz_2ofJGclXyM00BXZzz9Mk';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.log('supabaseUrl:', supabaseUrl ? '✅' : '❌');
  console.log('supabaseServiceKey:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupAlertsTable() {
  console.log('🚀 Création de la table alerts...');

  try {
    // Vérifier si la table existe déjà
    const { data: existingTable, error: checkError } = await supabase
      .from('alerts')
      .select('id')
      .limit(1);

    if (checkError && checkError.message.includes('does not exist')) {
      console.log('📋 La table alerts n\'existe pas, création en cours...');
      
      // Créer la table via une requête SQL directe
      const { error: createError } = await supabase
        .rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS alerts (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                task_id UUID NOT NULL REFERENCES scheduled_tasks(id) ON DELETE CASCADE,
                manager_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                message TEXT NOT NULL,
                severity VARCHAR(20) DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
                is_read BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        });

      if (createError) {
        console.error('❌ Erreur lors de la création de la table:', createError);
        console.log('💡 Solution: Exécutez manuellement ce SQL dans l\'éditeur Supabase:');
        console.log(`
-- Créer la table alerts
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES scheduled_tasks(id) ON DELETE CASCADE,
    manager_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_alerts_task_id ON alerts(task_id);
CREATE INDEX IF NOT EXISTS idx_alerts_manager_id ON alerts(manager_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON alerts(is_read);
        `);
        return;
      }
    } else {
      console.log('✅ La table alerts existe déjà !');
    }

    // Vérifier que la table existe maintenant
    const { data: tables, error: listError } = await supabase
      .from('alerts')
      .select('id')
      .limit(1);

    if (listError) {
      console.error('❌ Erreur lors de la vérification:', listError);
      return;
    }

    console.log('✅ Vérification : La table alerts existe bien !');

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

// Exécuter le script
setupAlertsTable()
  .then(() => {
    console.log('🎉 Script terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  }); 