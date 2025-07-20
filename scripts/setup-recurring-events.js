const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration Supabase - utiliser les clés correctes
const supabaseUrl = 'https://vqwgnvrhcaosnjczuwth.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODc0MjQsImV4cCI6MjA2NzU2MzQyNH0.3R5XkNZGMLmLUI1A5iExLnhsIyiwIyz0Azu7eInQHq4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupRecurringEvents() {
  console.log('🚀 Configuration des événements récurrents...');
  
  try {
    // Lire le fichier SQL
    const sqlPath = path.join(__dirname, '../supabase/recurring-events-schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Exécution du script SQL...');
    
    // Exécuter le script SQL
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Erreur lors de l\'exécution du script SQL:', error);
      
      // Essayer d'exécuter les commandes une par une
      console.log('🔄 Tentative d\'exécution manuelle...');
      await executeSQLManually();
    } else {
      console.log('✅ Script SQL exécuté avec succès');
    }
    
    // Vérifier que la table existe
    await verifyTableExists();
    
    console.log('🎉 Configuration des événements récurrents terminée !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error);
  }
}

async function executeSQLManually() {
  const commands = [
    // Créer la table scheduled_events
    `CREATE TABLE IF NOT EXISTS scheduled_events (
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
      recurrence_days JSONB DEFAULT NULL,
      start_date DATE NOT NULL,
      end_date DATE DEFAULT NULL,
      is_active BOOLEAN DEFAULT true,
      manager_id BIGINT NOT NULL,
      store_id BIGINT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    
    // Ajouter la colonne recurring_event_id à scheduled_tasks
    `ALTER TABLE scheduled_tasks ADD COLUMN IF NOT EXISTS recurring_event_id UUID`,
    
    // Créer les index
    `CREATE INDEX IF NOT EXISTS idx_scheduled_events_manager_id ON scheduled_events(manager_id)`,
    `CREATE INDEX IF NOT EXISTS idx_scheduled_events_store_id ON scheduled_events(store_id)`,
    `CREATE INDEX IF NOT EXISTS idx_scheduled_events_start_date ON scheduled_events(start_date)`,
    `CREATE INDEX IF NOT EXISTS idx_scheduled_events_end_date ON scheduled_events(end_date)`,
    `CREATE INDEX IF NOT EXISTS idx_scheduled_events_active ON scheduled_events(is_active)`,
    `CREATE INDEX IF NOT EXISTS idx_scheduled_events_recurrence_type ON scheduled_events(recurrence_type)`,
    `CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_recurring_event_id ON scheduled_tasks(recurring_event_id)`,
    
    // Créer la fonction update_updated_at_column
    `CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql'`,
    
    // Créer le trigger
    `DROP TRIGGER IF EXISTS update_scheduled_events_updated_at ON scheduled_events`,
    `CREATE TRIGGER update_scheduled_events_updated_at 
        BEFORE UPDATE ON scheduled_events
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,
    
    // Créer la fonction create_scheduled_events_table
    `CREATE OR REPLACE FUNCTION create_scheduled_events_table()
    RETURNS void AS $$
    BEGIN
        RAISE NOTICE 'Table scheduled_events déjà créée';
    END;
    $$ LANGUAGE plpgsql`,
    
    // Créer la fonction calculate_end_time
    `CREATE OR REPLACE FUNCTION calculate_end_time(start_time TIME, duration_minutes INTEGER)
    RETURNS TIME AS $$
    BEGIN
        RETURN start_time + (duration_minutes || ' minutes')::INTERVAL;
    END;
    $$ LANGUAGE plpgsql`,
    
    // Créer la fonction should_generate_for_date
    `CREATE OR REPLACE FUNCTION should_generate_for_date(event_record scheduled_events, target_date DATE)
    RETURNS BOOLEAN AS $$
    DECLARE
        day_of_week INTEGER;
        start_day_of_week INTEGER;
    BEGIN
        day_of_week := EXTRACT(DOW FROM target_date);
        start_day_of_week := EXTRACT(DOW FROM event_record.start_date);
        
        CASE event_record.recurrence_type
            WHEN 'daily' THEN
                RETURN true;
            WHEN 'weekly' THEN
                RETURN day_of_week = start_day_of_week;
            WHEN 'weekdays' THEN
                RETURN day_of_week BETWEEN 1 AND 5;
            WHEN 'custom' THEN
                RETURN event_record.recurrence_days @> to_jsonb(day_of_week);
            ELSE
                RETURN false;
        END CASE;
    END;
    $$ LANGUAGE plpgsql`,
    
    // Créer la fonction generate_tasks_for_date
    `CREATE OR REPLACE FUNCTION generate_tasks_for_date(target_date DATE)
    RETURNS INTEGER AS $$
    DECLARE
        event_record RECORD;
        generated_count INTEGER := 0;
        task_id UUID;
    BEGIN
        FOR event_record IN 
            SELECT * FROM scheduled_events 
            WHERE is_active = true 
            AND start_date <= target_date 
            AND (end_date IS NULL OR end_date >= target_date)
        LOOP
            IF should_generate_for_date(event_record, target_date) THEN
                INSERT INTO scheduled_tasks (
                    title,
                    start_time,
                    end_time,
                    duration,
                    date,
                    packages,
                    team_size,
                    manager_section,
                    manager_initials,
                    palette_condition,
                    manager_id,
                    store_id,
                    recurring_event_id
                ) VALUES (
                    event_record.title,
                    event_record.start_time,
                    calculate_end_time(event_record.start_time, event_record.duration_minutes),
                    event_record.duration_minutes || ' min',
                    target_date,
                    event_record.packages,
                    event_record.team_size,
                    event_record.manager_section,
                    event_record.manager_initials,
                    event_record.palette_condition,
                    event_record.manager_id,
                    event_record.store_id,
                    event_record.id
                ) RETURNING id INTO task_id;
                
                generated_count := generated_count + 1;
            END IF;
        END LOOP;
        
        RETURN generated_count;
    END;
    $$ LANGUAGE plpgsql`
  ];
  
  for (const command of commands) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: command });
      if (error) {
        console.warn('⚠️ Erreur sur la commande:', error.message);
      } else {
        console.log('✅ Commande exécutée');
      }
    } catch (err) {
      console.warn('⚠️ Erreur sur la commande:', err.message);
    }
  }
}

async function verifyTableExists() {
  try {
    const { data, error } = await supabase
      .from('scheduled_events')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ La table scheduled_events n\'existe pas:', error);
      return false;
    }
    
    console.log('✅ Table scheduled_events vérifiée');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    return false;
  }
}

// Exécuter le script
if (require.main === module) {
  setupRecurringEvents();
}

module.exports = { setupRecurringEvents }; 