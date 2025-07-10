-- Script SQL pour corriger la table scheduled_tasks
-- À exécuter dans l'éditeur SQL de Supabase
-- URL: https://vqwgnvrhcaosnjczuwth.supabase.co/project/vqwgnvrhcaosnjczuwth/sql/new

-- Ajouter toutes les colonnes manquantes
ALTER TABLE scheduled_tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE scheduled_tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE scheduled_tasks ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Tâche sans titre';
ALTER TABLE scheduled_tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE scheduled_tasks ADD COLUMN IF NOT EXISTS start_time TIME NOT NULL DEFAULT '09:00:00';
ALTER TABLE scheduled_tasks ADD COLUMN IF NOT EXISTS end_time TIME NOT NULL DEFAULT '10:00:00';
ALTER TABLE scheduled_tasks ADD COLUMN IF NOT EXISTS date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE scheduled_tasks ADD COLUMN IF NOT EXISTS packages INTEGER NOT NULL DEFAULT 0;
ALTER TABLE scheduled_tasks ADD COLUMN IF NOT EXISTS team_size INTEGER NOT NULL DEFAULT 1;
ALTER TABLE scheduled_tasks ADD COLUMN IF NOT EXISTS store_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE scheduled_tasks ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false;
ALTER TABLE scheduled_tasks ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE scheduled_tasks ADD COLUMN IF NOT EXISTS manager_section TEXT DEFAULT 'Section inconnue';
ALTER TABLE scheduled_tasks ADD COLUMN IF NOT EXISTS manager_initials TEXT DEFAULT 'XX';
ALTER TABLE scheduled_tasks ADD COLUMN IF NOT EXISTS palette_condition BOOLEAN DEFAULT false;
ALTER TABLE scheduled_tasks ADD COLUMN IF NOT EXISTS team_members JSONB DEFAULT '[]'::jsonb;
ALTER TABLE scheduled_tasks ADD COLUMN IF NOT EXISTS duration TEXT DEFAULT '1h';

-- Ajouter les contraintes de clés étrangères si elles n'existent pas
-- (Peut ne pas fonctionner si les colonnes existent déjà, mais ça ne fera pas d'erreur)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'scheduled_tasks_store_id_fkey'
    ) THEN
        ALTER TABLE scheduled_tasks 
        ADD CONSTRAINT scheduled_tasks_store_id_fkey 
        FOREIGN KEY (store_id) REFERENCES stores(id);
    END IF;
END $$;

-- Créer des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_date ON scheduled_tasks(date);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_manager ON scheduled_tasks(manager_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_completed ON scheduled_tasks(is_completed);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_team_members ON scheduled_tasks USING GIN(team_members);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_store_id ON scheduled_tasks(store_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_section ON scheduled_tasks(manager_section);

-- Créer un trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_scheduled_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_scheduled_tasks_updated_at ON scheduled_tasks;
CREATE TRIGGER update_scheduled_tasks_updated_at 
    BEFORE UPDATE ON scheduled_tasks
    FOR EACH ROW EXECUTE FUNCTION update_scheduled_tasks_updated_at();

-- Vérifier que tout fonctionne en insérant une tâche de test
INSERT INTO scheduled_tasks (
    title, 
    description, 
    start_time, 
    end_time, 
    date, 
    packages, 
    team_size, 
    manager_section, 
    manager_initials, 
    palette_condition, 
    team_members, 
    manager_id, 
    store_id,
    duration
) VALUES (
    'Tâche de Test Schema', 
    'Test après correction du schéma', 
    '09:00:00', 
    '11:00:00', 
    CURRENT_DATE, 
    150, 
    3, 
    'Section Test', 
    'ST', 
    true, 
    '[1, 2, 3]'::jsonb, 
    (SELECT id FROM users LIMIT 1), 
    1,
    '2h'
);

-- Afficher le résultat
SELECT 'Tâche de test créée avec succès !' AS message;
SELECT * FROM scheduled_tasks WHERE title = 'Tâche de Test Schema';

-- Supprimer la tâche de test
DELETE FROM scheduled_tasks WHERE title = 'Tâche de Test Schema';
SELECT 'Tâche de test supprimée - schéma corrigé avec succès !' AS final_message; 