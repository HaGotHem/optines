-- Script pour ajouter la colonne team_members à la table scheduled_tasks
-- À exécuter dans Supabase SQL Editor

-- Ajouter la colonne team_members si elle n'existe pas déjà
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'scheduled_tasks' 
        AND column_name = 'team_members'
    ) THEN
        ALTER TABLE scheduled_tasks 
        ADD COLUMN team_members JSONB DEFAULT '[]'::jsonb;
        
        RAISE NOTICE 'Colonne team_members ajoutée avec succès';
    ELSE
        RAISE NOTICE 'Colonne team_members existe déjà';
    END IF;
END $$;

-- Ajouter aussi la colonne description si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'scheduled_tasks' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE scheduled_tasks 
        ADD COLUMN description TEXT;
        
        RAISE NOTICE 'Colonne description ajoutée avec succès';
    ELSE
        RAISE NOTICE 'Colonne description existe déjà';
    END IF;
END $$;

-- Créer un index pour optimiser les requêtes sur team_members
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_team_members 
ON scheduled_tasks USING GIN (team_members);

-- Vérifier la structure finale de la table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'scheduled_tasks' 
ORDER BY ordinal_position; 