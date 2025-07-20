-- =====================================================
-- SCHEMA POUR LES ÉVÉNEMENTS RÉCURRENTS
-- =====================================================

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_scheduled_events_manager_id ON scheduled_events(manager_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_events_store_id ON scheduled_events(store_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_events_start_date ON scheduled_events(start_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_events_end_date ON scheduled_events(end_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_events_active ON scheduled_events(is_active);
CREATE INDEX IF NOT EXISTS idx_scheduled_events_recurrence_type ON scheduled_events(recurrence_type);

-- =====================================================
-- AJOUTER LA COLONNE recurring_event_id À scheduled_tasks
-- =====================================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'scheduled_tasks' AND column_name = 'recurring_event_id'
    ) THEN
        ALTER TABLE scheduled_tasks ADD COLUMN recurring_event_id UUID REFERENCES scheduled_events(id) ON DELETE CASCADE;
        RAISE NOTICE 'Colonne recurring_event_id ajoutée à la table scheduled_tasks';
    ELSE
        RAISE NOTICE 'Colonne recurring_event_id existe déjà dans la table scheduled_tasks';
    END IF;
END $$;

-- Index pour la nouvelle colonne
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_recurring_event_id ON scheduled_tasks(recurring_event_id);

-- =====================================================
-- FONCTION POUR METTRE À JOUR updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- TRIGGERS POUR METTRE À JOUR updated_at
-- =====================================================
DROP TRIGGER IF EXISTS update_scheduled_events_updated_at ON scheduled_events;
CREATE TRIGGER update_scheduled_events_updated_at 
    BEFORE UPDATE ON scheduled_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FONCTION POUR CRÉER LA TABLE SI ELLE N'EXISTE PAS
-- =====================================================
CREATE OR REPLACE FUNCTION create_scheduled_events_table()
RETURNS void AS $$
BEGIN
    -- Cette fonction est appelée par le hook useSupabaseEvents
    -- La table est déjà créée par ce script, donc on ne fait rien
    RAISE NOTICE 'Table scheduled_events déjà créée';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FONCTION POUR GÉNÉRER LES TÂCHES POUR UNE DATE
-- =====================================================
CREATE OR REPLACE FUNCTION generate_tasks_for_date(target_date DATE)
RETURNS INTEGER AS $$
DECLARE
    event_record RECORD;
    generated_count INTEGER := 0;
    task_id UUID;
BEGIN
    -- Parcourir tous les événements récurrents actifs
    FOR event_record IN 
        SELECT * FROM scheduled_events 
        WHERE is_active = true 
        AND start_date <= target_date 
        AND (end_date IS NULL OR end_date >= target_date)
    LOOP
        -- Vérifier si l'événement doit générer une tâche pour cette date
        IF should_generate_for_date(event_record, target_date) THEN
            -- Créer la tâche
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
$$ LANGUAGE plpgsql;

-- =====================================================
-- FONCTION POUR VÉRIFIER SI UN ÉVÉNEMENT DOIT GÉNÉRER UNE TÂCHE
-- =====================================================
CREATE OR REPLACE FUNCTION should_generate_for_date(event_record scheduled_events, target_date DATE)
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
            RETURN day_of_week BETWEEN 1 AND 5; -- Lundi à vendredi
        WHEN 'custom' THEN
            RETURN event_record.recurrence_days @> to_jsonb(day_of_week);
        ELSE
            RETURN false;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FONCTION POUR CALCULER L'HEURE DE FIN
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_end_time(start_time TIME, duration_minutes INTEGER)
RETURNS TIME AS $$
BEGIN
    RETURN start_time + (duration_minutes || ' minutes')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VUE POUR LES ÉVÉNEMENTS AVEC INFORMATIONS COMPLÈTES
-- =====================================================
CREATE OR REPLACE VIEW events_with_details AS
SELECT 
    se.*,
    u.full_name as manager_name,
    s.name as store_name,
    CASE 
        WHEN se.recurrence_type = 'daily' THEN 'Tous les jours'
        WHEN se.recurrence_type = 'weekly' THEN 'Tous les ' || 
            CASE EXTRACT(DOW FROM se.start_date)
                WHEN 0 THEN 'dimanches'
                WHEN 1 THEN 'lundis'
                WHEN 2 THEN 'mardis'
                WHEN 3 THEN 'mercredis'
                WHEN 4 THEN 'jeudis'
                WHEN 5 THEN 'vendredis'
                WHEN 6 THEN 'samedis'
            END
        WHEN se.recurrence_type = 'weekdays' THEN 'Lundi à vendredi'
        WHEN se.recurrence_type = 'custom' THEN 'Jours personnalisés'
        ELSE 'Aucune récurrence'
    END as recurrence_description
FROM scheduled_events se
LEFT JOIN users u ON se.manager_id = u.id
LEFT JOIN stores s ON se.store_id = s.id;

-- =====================================================
-- POLITIQUES RLS (Row Level Security)
-- =====================================================
ALTER TABLE scheduled_events ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux managers de voir leurs propres événements
CREATE POLICY "Managers can view their own events" ON scheduled_events
    FOR SELECT USING (manager_id::text = auth.jwt() ->> 'user_id');

-- Politique pour permettre aux managers de créer leurs propres événements
CREATE POLICY "Managers can create their own events" ON scheduled_events
    FOR INSERT WITH CHECK (manager_id::text = auth.jwt() ->> 'user_id');

-- Politique pour permettre aux managers de modifier leurs propres événements
CREATE POLICY "Managers can update their own events" ON scheduled_events
    FOR UPDATE USING (manager_id::text = auth.jwt() ->> 'user_id');

-- Politique pour permettre aux managers de supprimer leurs propres événements
CREATE POLICY "Managers can delete their own events" ON scheduled_events
    FOR DELETE USING (manager_id::text = auth.jwt() ->> 'user_id');

-- =====================================================
-- COMMENTAIRES
-- =====================================================
COMMENT ON TABLE scheduled_events IS 'Table des événements récurrents pour la génération automatique de tâches';
COMMENT ON COLUMN scheduled_events.recurrence_days IS 'Array JSON des jours de la semaine (0=Dimanche, 1=Lundi, etc.) pour les récurrences personnalisées';
COMMENT ON COLUMN scheduled_events.end_date IS 'Date de fin de récurrence, NULL pour une récurrence illimitée';
COMMENT ON COLUMN scheduled_events.is_active IS 'Indique si l''événement récurrent est actif et génère des tâches'; 