-- =====================================================
-- MODIFICATION DU SCHÉMA POUR RENDRE PACKAGES OPTIONNEL
-- =====================================================

-- Modifier la table scheduled_tasks pour rendre packages optionnel
ALTER TABLE scheduled_tasks 
ALTER COLUMN packages DROP NOT NULL;

-- Modifier la contrainte CHECK pour permettre NULL
ALTER TABLE scheduled_tasks 
DROP CONSTRAINT IF EXISTS scheduled_tasks_packages_check;

ALTER TABLE scheduled_tasks 
ADD CONSTRAINT scheduled_tasks_packages_check 
CHECK (packages IS NULL OR packages >= 0);

-- Modifier aussi la table scheduled_events pour cohérence
ALTER TABLE scheduled_events 
ALTER COLUMN packages DROP NOT NULL;

ALTER TABLE scheduled_events 
DROP CONSTRAINT IF EXISTS scheduled_events_packages_check;

ALTER TABLE scheduled_events 
ADD CONSTRAINT scheduled_events_packages_check 
CHECK (packages IS NULL OR packages >= 0);

-- Mettre à jour les vues si nécessaire
COMMENT ON COLUMN scheduled_tasks.packages IS 'Nombre de colis (optionnel)';
COMMENT ON COLUMN scheduled_events.packages IS 'Nombre de colis (optionnel)'; 