const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://vqwgnvrhcaosnjczuwth.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk4NzQyNCwiZXhwIjoyMDY3NTYzNDI0fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.log('Assurez-vous que EXPO_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définies');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupWorkingHours() {
  console.log('🔧 Configuration de la table working_hours...');

  try {
    // Créer la table working_hours
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql_query: `
        -- =====================================================
        -- TABLE: working_hours (Horaires de magasin)
        -- =====================================================
        CREATE TABLE IF NOT EXISTS working_hours (
            id BIGSERIAL PRIMARY KEY,
            store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(store_id)
        );

        -- Index pour optimiser les requêtes
        CREATE INDEX IF NOT EXISTS idx_working_hours_store_id ON working_hours(store_id);
        CREATE INDEX IF NOT EXISTS idx_working_hours_active ON working_hours(is_active);

        -- Trigger pour mettre à jour automatiquement updated_at
        CREATE TRIGGER update_working_hours_updated_at BEFORE UPDATE ON working_hours
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        -- Politiques RLS (Row Level Security)
        ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY;

        -- Politiques ouvertes pour le développement (à restreindre en prod)
        CREATE POLICY "Tout le monde peut lire" ON working_hours FOR SELECT USING (true);
        CREATE POLICY "Tout le monde peut insérer" ON working_hours FOR INSERT WITH CHECK (true);
        CREATE POLICY "Tout le monde peut mettre à jour" ON working_hours FOR UPDATE USING (true);
        CREATE POLICY "Tout le monde peut supprimer" ON working_hours FOR DELETE USING (true);
      `
    });

    if (createError) {
      console.error('❌ Erreur lors de la création de la table:', createError);
      return;
    }

    console.log('✅ Table working_hours créée avec succès');

    // Insérer des horaires par défaut pour les magasins existants
    const { error: insertError } = await supabase.rpc('exec_sql', {
      sql_query: `
        INSERT INTO working_hours (store_id, start_time, end_time, is_active) 
        SELECT id, '06:00'::TIME, '21:00'::TIME, true
        FROM stores 
        WHERE id NOT IN (SELECT store_id FROM working_hours)
        ON CONFLICT (store_id) DO NOTHING;
      `
    });

    if (insertError) {
      console.error('❌ Erreur lors de l\'insertion des horaires par défaut:', insertError);
      return;
    }

    console.log('✅ Horaires par défaut insérés avec succès');

    // Vérifier les horaires créés
    const { data: workingHours, error: selectError } = await supabase
      .from('working_hours')
      .select('*, stores(name)');

    if (selectError) {
      console.error('❌ Erreur lors de la vérification:', selectError);
      return;
    }

    console.log('📋 Horaires configurés:');
    workingHours.forEach(hours => {
      console.log(`  - ${hours.stores.name}: ${hours.start_time} - ${hours.end_time}`);
    });

    console.log('🎉 Configuration des horaires terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error);
  }
}

// Exécuter le script
setupWorkingHours(); 