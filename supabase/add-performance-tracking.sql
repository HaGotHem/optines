-- Script pour ajouter le suivi de performance des employés
-- À exécuter dans le SQL Editor de Supabase

-- =====================================================
-- 1. AJOUTER LES COLONNES DE PERFORMANCE AUX TÂCHES
-- =====================================================

-- Ajouter les colonnes pour le suivi du temps réel
ALTER TABLE scheduled_tasks 
ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS actual_duration_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS actual_start_time TIME,
ADD COLUMN IF NOT EXISTS actual_end_time TIME,
ADD COLUMN IF NOT EXISTS performance_score DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS completed_by BIGINT REFERENCES team_members(id),
ADD COLUMN IF NOT EXISTS completion_notes TEXT;

-- =====================================================
-- 2. CRÉER UNE TABLE POUR LES LOGS DE PERFORMANCE
-- =====================================================

CREATE TABLE IF NOT EXISTS performance_logs (
    id BIGSERIAL PRIMARY KEY,
    team_member_id BIGINT NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES scheduled_tasks(id) ON DELETE CASCADE,
    estimated_duration_minutes INTEGER NOT NULL,
    actual_duration_minutes INTEGER NOT NULL,
    performance_score DECIMAL(5,2) NOT NULL,
    completion_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_performance_logs_team_member_id ON performance_logs(team_member_id);
CREATE INDEX IF NOT EXISTS idx_performance_logs_task_id ON performance_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_performance_logs_completion_date ON performance_logs(completion_date);
CREATE INDEX IF NOT EXISTS idx_performance_logs_performance_score ON performance_logs(performance_score);

-- =====================================================
-- 3. CRÉER UNE FONCTION POUR CALCULER LA PERFORMANCE
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_performance_score(
    estimated_minutes INTEGER,
    actual_minutes INTEGER
) RETURNS DECIMAL(5,2) AS $$
DECLARE
    score DECIMAL(5,2);
BEGIN
    -- Éviter la division par zéro
    IF estimated_minutes = 0 THEN
        RETURN 0.00;
    END IF;
    
    -- Calculer le ratio de performance
    -- Plus l'employé est rapide, plus le score est élevé
    -- Score max = 100, Score min = 0
    score := (estimated_minutes::DECIMAL / actual_minutes::DECIMAL) * 100;
    
    -- Limiter le score entre 0 et 100
    IF score > 100 THEN
        score := 100.00;
    ELSIF score < 0 THEN
        score := 0.00;
    END IF;
    
    RETURN ROUND(score, 2);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. CRÉER UNE FONCTION POUR METTRE À JOUR LA PERFORMANCE
-- =====================================================

CREATE OR REPLACE FUNCTION update_employee_performance(
    p_task_id UUID,
    p_team_member_id BIGINT,
    p_actual_start_time TIME,
    p_actual_end_time TIME,
    p_completion_notes TEXT DEFAULT NULL
) RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_estimated_duration INTEGER;
    v_actual_duration INTEGER;
    v_performance_score DECIMAL(5,2);
    v_completion_date DATE;
BEGIN
    -- Récupérer la durée estimée de la tâche
    SELECT estimated_duration_minutes, date 
    INTO v_estimated_duration, v_completion_date
    FROM scheduled_tasks 
    WHERE id = p_task_id;
    
    -- Calculer la durée réelle en minutes
    v_actual_duration := EXTRACT(EPOCH FROM (p_actual_end_time - p_actual_start_time)) / 60;
    
    -- Calculer le score de performance
    v_performance_score := calculate_performance_score(v_estimated_duration, v_actual_duration);
    
    -- Mettre à jour la tâche
    UPDATE scheduled_tasks 
    SET 
        actual_duration_minutes = v_actual_duration,
        actual_start_time = p_actual_start_time,
        actual_end_time = p_actual_end_time,
        performance_score = v_performance_score,
        completed_by = p_team_member_id,
        completion_notes = p_completion_notes,
        is_completed = true,
        updated_at = NOW()
    WHERE id = p_task_id;
    
    -- Ajouter un log de performance
    INSERT INTO performance_logs (
        team_member_id,
        task_id,
        estimated_duration_minutes,
        actual_duration_minutes,
        performance_score,
        completion_date,
        notes
    ) VALUES (
        p_team_member_id,
        p_task_id,
        v_estimated_duration,
        v_actual_duration,
        v_performance_score,
        v_completion_date,
        p_completion_notes
    );
    
    -- Mettre à jour la performance moyenne de l'employé
    UPDATE team_members 
    SET 
        performance = (
            SELECT ROUND(AVG(performance_score), 0)
            FROM performance_logs 
            WHERE team_member_id = p_team_member_id
        ),
        tasks_completed = (
            SELECT COUNT(*)
            FROM performance_logs 
            WHERE team_member_id = p_team_member_id
        ),
        updated_at = NOW()
    WHERE id = p_team_member_id;
    
    RETURN v_performance_score;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. CRÉER UNE VUE POUR LES STATISTIQUES DE PERFORMANCE
-- =====================================================

CREATE OR REPLACE VIEW employee_performance_stats AS
SELECT 
    tm.id,
    tm.name,
    tm.role,
    tm.performance as current_performance,
    tm.tasks_completed,
    COUNT(pl.id) as total_tasks,
    ROUND(AVG(pl.performance_score), 2) as avg_performance,
    ROUND(MIN(pl.performance_score), 2) as min_performance,
    ROUND(MAX(pl.performance_score), 2) as max_performance,
    ROUND(AVG(pl.actual_duration_minutes), 2) as avg_actual_duration,
    ROUND(AVG(pl.estimated_duration_minutes), 2) as avg_estimated_duration,
    COUNT(CASE WHEN pl.performance_score >= 90 THEN 1 END) as excellent_tasks,
    COUNT(CASE WHEN pl.performance_score >= 75 AND pl.performance_score < 90 THEN 1 END) as good_tasks,
    COUNT(CASE WHEN pl.performance_score >= 50 AND pl.performance_score < 75 THEN 1 END) as average_tasks,
    COUNT(CASE WHEN pl.performance_score < 50 THEN 1 END) as poor_tasks
FROM team_members tm
LEFT JOIN performance_logs pl ON tm.id = pl.team_member_id
GROUP BY tm.id, tm.name, tm.role, tm.performance, tm.tasks_completed;

-- =====================================================
-- 6. CRÉER UNE VUE POUR LES TÂCHES AVEC PERFORMANCE
-- =====================================================

CREATE OR REPLACE VIEW tasks_with_performance AS
SELECT 
    st.*,
    tm.name as completed_by_name,
    tm.role as completed_by_role,
    pl.performance_score,
    pl.actual_duration_minutes,
    pl.estimated_duration_minutes,
    CASE 
        WHEN pl.performance_score >= 90 THEN 'Excellent'
        WHEN pl.performance_score >= 75 THEN 'Bon'
        WHEN pl.performance_score >= 50 THEN 'Moyen'
        ELSE 'À améliorer'
    END as performance_level
FROM scheduled_tasks st
LEFT JOIN team_members tm ON st.completed_by = tm.id
LEFT JOIN performance_logs pl ON st.id = pl.task_id;

-- =====================================================
-- 7. ACTIVER RLS POUR LES NOUVELLES TABLES
-- =====================================================

ALTER TABLE performance_logs ENABLE ROW LEVEL SECURITY;

-- Politiques pour performance_logs
CREATE POLICY "Managers can view performance logs" ON performance_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.id = performance_logs.team_member_id
            AND tm.manager_id = auth.uid()::bigint
        )
    );

CREATE POLICY "Managers can insert performance logs" ON performance_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.id = performance_logs.team_member_id
            AND tm.manager_id = auth.uid()::bigint
        )
    );

-- Politiques ouvertes pour le développement
CREATE POLICY "Tout le monde peut lire" ON performance_logs FOR SELECT USING (true);
CREATE POLICY "Tout le monde peut insérer" ON performance_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Tout le monde peut mettre à jour" ON performance_logs FOR UPDATE USING (true);
CREATE POLICY "Tout le monde peut supprimer" ON performance_logs FOR DELETE USING (true);

-- =====================================================
-- 8. MISE À JOUR DES TYPES TYPESCRIPT
-- =====================================================

-- Note: Les types TypeScript seront mis à jour dans le fichier lib/supabase.ts 