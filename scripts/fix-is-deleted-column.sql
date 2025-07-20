-- Script pour ajouter le champ is_deleted à la table scheduled_tasks
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Ajouter la colonne is_deleted si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'scheduled_tasks' 
        AND column_name = 'is_deleted'
    ) THEN
        ALTER TABLE public.scheduled_tasks 
        ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
        
        -- Créer un index pour améliorer les performances des requêtes
        CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_is_deleted 
        ON public.scheduled_tasks(is_deleted);
        
        RAISE NOTICE 'Colonne is_deleted ajoutée à la table scheduled_tasks';
    ELSE
        RAISE NOTICE 'La colonne is_deleted existe déjà dans la table scheduled_tasks';
    END IF;
END
$$;

-- Mettre à jour toutes les tâches existantes pour avoir is_deleted = false
UPDATE public.scheduled_tasks 
SET is_deleted = false 
WHERE is_deleted IS NULL;

-- Vérifier que la colonne a été ajoutée
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'scheduled_tasks' 
AND column_name = 'is_deleted';

-- Message de confirmation
SELECT 'Champ is_deleted ajouté avec succès à la table scheduled_tasks!' as message; 