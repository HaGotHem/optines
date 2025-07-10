-- Mise à jour de la table team_members pour ajouter le champ section
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS section VARCHAR(50);

-- Index pour optimiser les requêtes par section
CREATE INDEX IF NOT EXISTS idx_team_members_section ON team_members(section);

-- Vue pour les employés avec informations de magasin
CREATE OR REPLACE VIEW team_members_with_store AS
SELECT 
    tm.*,
    s.name as store_name,
    s.city as store_city,
    u.full_name as manager_name,
    u.section as manager_section
FROM team_members tm
LEFT JOIN stores s ON tm.store_id = s.id
LEFT JOIN users u ON tm.manager_id = u.id
ORDER BY tm.created_at DESC;

-- Mettre à jour les employés existants avec des sections de test
UPDATE team_members 
SET section = 'test' 
WHERE section IS NULL AND name LIKE '%Test%';

UPDATE team_members 
SET section = 'fruits-legumes' 
WHERE section IS NULL AND name LIKE '%Marie%';

UPDATE team_members 
SET section = 'boucherie' 
WHERE section IS NULL AND name LIKE '%Pierre%'; 