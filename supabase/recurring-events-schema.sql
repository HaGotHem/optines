-- =====================================================
-- TABLE: scheduled_events (Événements récurrents)
-- =====================================================

-- Table pour stocker les modèles d'événements récurrents
CREATE TABLE IF NOT EXISTS scheduled_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL, -- Durée en minutes
    packages INTEGER NOT NULL CHECK (packages >= 0),
    team_size INTEGER NOT NULL CHECK (team_size >= 0),
    manager_section VARCHAR(50) NOT NULL,
    manager_initials VARCHAR(10) NOT NULL,
    palette_condition BOOLEAN DEFAULT false,
    team_members JSONB DEFAULT '[]'::jsonb,
    
    -- Paramètres de récurrence
    recurrence_type VARCHAR(20) NOT NULL CHECK (recurrence_type IN ('none', 'daily', 'weekly', 'weekdays', 'custom')),
    recurrence_days JSONB DEFAULT '[]'::jsonb, -- [1,2,3,4,5] pour lun-ven, [1,7] pour lun et dim, etc.
    start_date DATE NOT NULL,
    end_date DATE, -- NULL = récurrence infinie
    
    -- Métadonnées
    is_active BOOLEAN DEFAULT true,
    manager_id TEXT NOT NULL, -- ID du manager qui a créé l'événement
    store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_scheduled_events_manager_id ON scheduled_events(manager_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_events_start_date ON scheduled_events(start_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_events_recurrence ON scheduled_events(recurrence_type);
CREATE INDEX IF NOT EXISTS idx_scheduled_events_active ON scheduled_events(is_active);
CREATE INDEX IF NOT EXISTS idx_scheduled_events_store_id ON scheduled_events(store_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_events_team_members ON scheduled_events USING GIN(team_members);
CREATE INDEX IF NOT EXISTS idx_scheduled_events_days ON scheduled_events USING GIN(recurrence_days);

-- =====================================================
-- TABLE: generated_tasks (Tâches générées automatiquement)
-- =====================================================

-- Table pour lier les tâches générées aux événements récurrents
CREATE TABLE IF NOT EXISTS generated_tasks (
    id BIGSERIAL PRIMARY KEY,
    scheduled_event_id UUID NOT NULL REFERENCES scheduled_events(id) ON DELETE CASCADE,
    scheduled_task_id UUID NOT NULL REFERENCES scheduled_tasks(id) ON DELETE CASCADE,
    generated_for_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(scheduled_event_id, generated_for_date) -- Une seule tâche par événement par jour
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_generated_tasks_event_id ON generated_tasks(scheduled_event_id);
CREATE INDEX IF NOT EXISTS idx_generated_tasks_task_id ON generated_tasks(scheduled_task_id);
CREATE INDEX IF NOT EXISTS idx_generated_tasks_date ON generated_tasks(generated_for_date);

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour calculer l'heure de fin basée sur la durée
CREATE OR REPLACE FUNCTION calculate_end_time(start_time TIME, duration_minutes INTEGER)
RETURNS TIME AS $$
BEGIN
    RETURN (start_time::TIME + (duration_minutes || ' minutes')::INTERVAL)::TIME;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier si un jour de la semaine correspond aux jours de récurrence
CREATE OR REPLACE FUNCTION matches_recurrence_day(target_date DATE, recurrence_days JSONB)
RETURNS BOOLEAN AS $$
DECLARE
    day_of_week INTEGER;
BEGIN
    -- Obtenir le jour de la semaine (1=Lundi, 7=Dimanche)
    day_of_week := EXTRACT(ISODOW FROM target_date);
    
    -- Vérifier si le jour est dans la liste des jours de récurrence
    RETURN recurrence_days ? day_of_week::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER POUR UPDATED_AT
-- =====================================================

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_scheduled_events_updated_at 
    BEFORE UPDATE ON scheduled_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FONCTION DE GÉNÉRATION DES TÂCHES
-- =====================================================

-- Fonction pour générer les tâches d'un événement récurrent pour une date donnée
CREATE OR REPLACE FUNCTION generate_tasks_for_date(target_date DATE)
RETURNS INTEGER AS $$
DECLARE
    event RECORD;
    task_data RECORD;
    new_task_id UUID;
    generated_count INTEGER := 0;
BEGIN
    -- Parcourir tous les événements actifs
    FOR event IN 
        SELECT * FROM scheduled_events 
        WHERE is_active = true 
        AND start_date <= target_date 
        AND (end_date IS NULL OR end_date >= target_date)
    LOOP
        -- Vérifier si une tâche existe déjà pour cet événement et cette date
        IF EXISTS (
            SELECT 1 FROM generated_tasks 
            WHERE scheduled_event_id = event.id 
            AND generated_for_date = target_date
        ) THEN
            CONTINUE; -- Passer au suivant si déjà généré
        END IF;
        
        -- Vérifier si l'événement doit être généré pour cette date
        CASE event.recurrence_type
            WHEN 'none' THEN
                -- Événement unique, seulement à la date de début
                IF target_date != event.start_date THEN
                    CONTINUE;
                END IF;
            WHEN 'daily' THEN
                -- Tous les jours, pas de vérification supplémentaire
                NULL;
            WHEN 'weekly' THEN
                -- Même jour de la semaine que la date de début
                IF EXTRACT(ISODOW FROM target_date) != EXTRACT(ISODOW FROM event.start_date) THEN
                    CONTINUE;
                END IF;
            WHEN 'weekdays' THEN
                -- Seulement les jours de semaine (lun-ven)
                IF EXTRACT(ISODOW FROM target_date) NOT IN (1,2,3,4,5) THEN
                    CONTINUE;
                END IF;
            WHEN 'custom' THEN
                -- Jours personnalisés
                IF NOT matches_recurrence_day(target_date, event.recurrence_days) THEN
                    CONTINUE;
                END IF;
        END CASE;
        
        -- Générer la tâche
        INSERT INTO scheduled_tasks (
            title,
            description,
            start_time,
            end_time,
            duration,
            date,
            packages,
            team_size,
            manager_section,
            manager_initials,
            palette_condition,
            team_members,
            manager_id,
            store_id,
            is_completed,
            is_pinned
        ) VALUES (
            event.title || ' (Récurrent)',
            event.description,
            event.start_time,
            calculate_end_time(event.start_time, event.duration_minutes),
            (event.duration_minutes || ' min'),
            target_date,
            event.packages,
            event.team_size,
            event.manager_section,
            event.manager_initials,
            event.palette_condition,
            event.team_members,
            event.manager_id,
            event.store_id,
            false,
            false
        ) RETURNING id INTO new_task_id;
        
        -- Enregistrer la liaison
        INSERT INTO generated_tasks (
            scheduled_event_id,
            scheduled_task_id,
            generated_for_date
        ) VALUES (
            event.id,
            new_task_id,
            target_date
        );
        
        generated_count := generated_count + 1;
        
    END LOOP;
    
    RETURN generated_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- POLITIQUES RLS
-- =====================================================

-- Activer RLS
ALTER TABLE scheduled_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_tasks ENABLE ROW LEVEL SECURITY;

-- Politiques ouvertes pour le développement (à restreindre en prod)
CREATE POLICY "Lecture ouverte" ON scheduled_events FOR SELECT USING (true);
CREATE POLICY "Écriture ouverte" ON scheduled_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Mise à jour ouverte" ON scheduled_events FOR UPDATE USING (true);
CREATE POLICY "Suppression ouverte" ON scheduled_events FOR DELETE USING (true);

CREATE POLICY "Lecture ouverte" ON generated_tasks FOR SELECT USING (true);
CREATE POLICY "Écriture ouverte" ON generated_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Mise à jour ouverte" ON generated_tasks FOR UPDATE USING (true);
CREATE POLICY "Suppression ouverte" ON generated_tasks FOR DELETE USING (true);

-- =====================================================
-- DONNÉES DE TEST
-- =====================================================

-- Insérer quelques événements récurrents de test
INSERT INTO scheduled_events (
    title,
    description,
    start_time,
    duration_minutes,
    packages,
    team_size,
    manager_section,
    manager_initials,
    palette_condition,
    team_members,
    recurrence_type,
    recurrence_days,
    start_date,
    end_date,
    manager_id,
    store_id
) VALUES 
(
    'Mise en rayon matinale',
    'Mise en rayon quotidienne des produits frais',
    '06:00:00',
    120, -- 2 heures
    100,
    2,
    'Produits frais',
    'PF',
    true,
    '[1, 2]'::jsonb,
    'weekdays', -- Lun-Ven
    '[1,2,3,4,5]'::jsonb,
    CURRENT_DATE,
    NULL, -- Récurrence infinie
    (SELECT id FROM users WHERE role = 'manager' LIMIT 1),
    1
),
(
    'Réception hebdomadaire',
    'Réception des marchandises du lundi',
    '08:00:00',
    180, -- 3 heures
    300,
    4,
    'Entrepôt',
    'EN',
    false,
    '[1, 2, 3, 4]'::jsonb,
    'weekly', -- Chaque semaine le même jour
    '[1]'::jsonb, -- Lundi seulement
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '6 months', -- 6 mois de récurrence
    (SELECT id FROM users WHERE role = 'manager' LIMIT 1),
    1
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON TABLE scheduled_events IS 'Événements récurrents qui génèrent automatiquement des tâches';
COMMENT ON TABLE generated_tasks IS 'Liaison entre événements récurrents et tâches générées';

COMMENT ON COLUMN scheduled_events.recurrence_type IS 'Type de récurrence: none, daily, weekly, weekdays, custom';
COMMENT ON COLUMN scheduled_events.recurrence_days IS 'Jours de la semaine pour récurrence custom (1=Lun, 7=Dim)';
COMMENT ON COLUMN scheduled_events.duration_minutes IS 'Durée de l''événement en minutes';
COMMENT ON COLUMN scheduled_events.start_date IS 'Date de début de la récurrence';
COMMENT ON COLUMN scheduled_events.end_date IS 'Date de fin de la récurrence (NULL = infinie)';

-- Test de génération pour aujourd'hui
SELECT generate_tasks_for_date(CURRENT_DATE) as tasks_generated_today; 