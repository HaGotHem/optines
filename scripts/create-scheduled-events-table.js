const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration Supabase
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://vqwgnvrhcaosnjczuwth.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY manquant dans le fichier .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createScheduledEventsTable() {
  console.log('🔧 Création de la table scheduled_events...');

  const createTableSQL = `
    -- =====================================================
    -- TABLE: scheduled_events (Événements récurrents)
    -- =====================================================
    CREATE TABLE IF NOT EXISTS scheduled_events (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(200) NOT NULL,
        start_time TIME NOT NULL,
        duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
        packages INTEGER NOT NULL CHECK (packages >= 0),
        team_size INTEGER NOT NULL CHECK (team_size >= 0),
        manager_section VARCHAR(50) NOT NULL,
        manager_initials VARCHAR(10) NOT NULL,
        palette_condition BOOLEAN DEFAULT false,
        recurrence_type VARCHAR(20) NOT NULL CHECK (recurrence_type IN ('none', 'daily', 'weekly', 'weekdays', 'custom')),
        recurrence_days JSONB DEFAULT NULL, -- Array of days [0,1,2,3,4,5,6] for Sunday-Saturday
        start_date DATE NOT NULL,
        end_date DATE DEFAULT NULL, -- NULL means no end date
        is_active BOOLEAN DEFAULT true,
        manager_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Index pour optimiser les requêtes sur les événements récurrents
    CREATE INDEX IF NOT EXISTS idx_scheduled_events_manager_id ON scheduled_events(manager_id);
    CREATE INDEX IF NOT EXISTS idx_scheduled_events_active ON scheduled_events(is_active);
    CREATE INDEX IF NOT EXISTS idx_scheduled_events_recurrence ON scheduled_events(recurrence_type);
    CREATE INDEX IF NOT EXISTS idx_scheduled_events_dates ON scheduled_events(start_date, end_date);
    CREATE INDEX IF NOT EXISTS idx_scheduled_events_store_id ON scheduled_events(store_id);
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { 
      sql_query: createTableSQL 
    });

    if (error) {
      console.error('❌ Erreur lors de la création de la table:', error);
      
      // Fallback: essayer de créer la table via le SQL Editor
      console.log('\n📋 Veuillez exécuter ce SQL dans l\'éditeur Supabase:');
      console.log(createTableSQL);
      return false;
    }

    console.log('✅ Table scheduled_events créée avec succès !');
    
    // Tester la table
    const { data, error: testError } = await supabase
      .from('scheduled_events')
      .select('*')
      .limit(1);

    if (testError) {
      console.warn('⚠️ Erreur lors du test de la table:', testError.message);
    } else {
      console.log('✅ Table scheduled_events testée avec succès !');
    }

    return true;
  } catch (err) {
    console.error('❌ Erreur lors de la création de la table:', err);
    
    // Afficher le SQL pour exécution manuelle
    console.log('\n📋 Veuillez exécuter ce SQL dans l\'éditeur Supabase:');
    console.log(createTableSQL);
    return false;
  }
}

async function main() {
  console.log('🚀 Script de création de la table scheduled_events');
  console.log('📍 URL Supabase:', SUPABASE_URL);
  
  await createScheduledEventsTable();
  
  console.log('\n✨ Script terminé !');
}

main().catch(console.error); 