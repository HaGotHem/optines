-- =====================================================
-- AJOUT DU CHAMP POUR IDENTIFIER LES TÂCHES ASSIGNÉES PAR LES DIRECTEURS
-- =====================================================

-- Ajouter le champ assigned_by_director à la table scheduled_tasks
ALTER TABLE scheduled_tasks 
ADD COLUMN IF NOT EXISTS assigned_by_director BOOLEAN DEFAULT false;

-- Ajouter le champ director_id pour identifier quel directeur a assigné la tâche
ALTER TABLE scheduled_tasks 
ADD COLUMN IF NOT EXISTS director_id UUID REFERENCES users(id);

-- Mettre à jour les commentaires
COMMENT ON COLUMN scheduled_tasks.assigned_by_director IS 'Indique si la tâche a été assignée par un directeur';
COMMENT ON COLUMN scheduled_tasks.director_id IS 'ID du directeur qui a assigné la tâche';

-- Créer un index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_assigned_by_director 
ON scheduled_tasks(assigned_by_director);

CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_director_id 
ON scheduled_tasks(director_id); 