-- Script d'initialisation pour le nouveau projet Supabase vqwgnvrhcaosnjczuwth
-- Exécuter ce script dans l'éditeur SQL de Supabase

-- 1. Vérification et mise à jour de la table stores existante
-- La table stores existe déjà, on vérifie juste qu'elle a les colonnes nécessaires
DO $$ 
BEGIN
    -- Ajouter manager_count si la colonne n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='manager_count') THEN
        ALTER TABLE stores ADD COLUMN manager_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. Modification de la table users existante pour ajouter store_id s'il n'existe pas
DO $$ 
BEGIN
    -- Ajouter store_id si la colonne n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='store_id') THEN
        ALTER TABLE users ADD COLUMN store_id BIGINT REFERENCES stores(id);
    END IF;
    
    -- Ajouter full_name si la colonne n'existe pas  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='full_name') THEN
        ALTER TABLE users ADD COLUMN full_name VARCHAR(255);
    END IF;
    
    -- Ajouter section si la colonne n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='section') THEN
        ALTER TABLE users ADD COLUMN section VARCHAR(255);
    END IF;
    
    -- Ajouter is_active si la colonne n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_active') THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 3. Création de la table team_members
CREATE TABLE IF NOT EXISTS team_members (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    section VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'offline' CHECK (status IN ('online', 'busy', 'offline', 'break')),
    rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    location VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    avatar_url TEXT,
    shift VARCHAR(50) NOT NULL,
    performance INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    manager_id UUID REFERENCES auth.users(id),
    store_id BIGINT REFERENCES stores(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Création de la vue users_with_store
CREATE OR REPLACE VIEW users_with_store AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.full_name,
    u.role,
    u.section,
    u.store_id,
    u.is_active,
    u.created_at,
    u.updated_at,
    s.name as store_name,
    s.city as store_city,
    s.address as store_address
FROM users u
LEFT JOIN stores s ON u.store_id = s.id;

-- 5. Insertion des magasins de test (si ils n'existent pas déjà)
INSERT INTO stores (id, name, city, address, phone)
VALUES 
    (1, 'Magasin Paris Centre', 'Paris', '123 Rue de Rivoli, 75001 Paris', '01.42.60.30.30'),
    (3, 'Magasin Marseille Vieux-Port', 'Marseille', '789 Quai du Port, 13002 Marseille', '04.91.54.32.10')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    city = EXCLUDED.city,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone;

-- 6. Mise à jour de la séquence des stores pour éviter les conflits
SELECT setval('stores_id_seq', GREATEST(10, (SELECT MAX(id) FROM stores)));

-- 7. Mise à jour des utilisateurs existants pour leur assigner un magasin
UPDATE users 
SET store_id = 1, full_name = COALESCE(full_name, username), is_active = COALESCE(is_active, true)
WHERE store_id IS NULL;

-- 8. Création d'employés de test pour Thomas (manager_id sera l'UUID de Thomas)
-- Note: Remplacez 'USER_UUID_HERE' par l'UUID réel de Thomas depuis auth.users

-- Première, trouvons l'UUID de Thomas
-- SELECT id FROM auth.users WHERE email = 'thomas@h4-advisors.com';

-- Insertion d'employés de test (à adapter avec le bon UUID)
INSERT INTO team_members (name, role, section, status, rating, location, phone, email, shift, performance, tasks_completed, manager_id, store_id)
VALUES 
    ('Marie Dubois', 'Opérateur', 'Section A', 'offline', 5, 'Zone de réception', '01.23.45.67.89', 'marie.dubois@magasin.fr', 'matin', 85, 127, 
     (SELECT id FROM auth.users WHERE email = 'thomas@h4-advisors.com' LIMIT 1), 1),
    ('Pierre Martin', 'Superviseur', 'Section A', 'offline', 4, 'Zone de préparation', '01.23.45.67.90', 'pierre.martin@magasin.fr', 'après-midi', 92, 156, 
     (SELECT id FROM auth.users WHERE email = 'thomas@h4-advisors.com' LIMIT 1), 1),
    ('Sophie Laurent', 'Opérateur', 'Section B', 'offline', 5, 'Zone d''expédition', '01.23.45.67.91', 'sophie.laurent@magasin.fr', 'matin', 78, 98, 
     (SELECT id FROM auth.users WHERE email = 'thomas@h4-advisors.com' LIMIT 1), 1),
    ('Antoine Moreau', 'Technicien', 'Section B', 'offline', 4, 'Zone de maintenance', '01.23.45.67.92', 'antoine.moreau@magasin.fr', 'soir', 88, 143, 
     (SELECT id FROM auth.users WHERE email = 'thomas@h4-advisors.com' LIMIT 1), 1)
ON CONFLICT DO NOTHING;

-- 9. Activation de RLS (Row Level Security) si nécessaire
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- 10. Politiques RLS de base (à adapter selon vos besoins de sécurité)
-- Politique pour les stores
DROP POLICY IF EXISTS "Users can view stores" ON stores;
CREATE POLICY "Users can view stores" ON stores
    FOR SELECT USING (auth.role() = 'authenticated');

-- Politique pour les users  
DROP POLICY IF EXISTS "Users can view users" ON users;
CREATE POLICY "Users can view users" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

-- Politique pour les team_members
DROP POLICY IF EXISTS "Users can view team members" ON team_members;
CREATE POLICY "Users can view team members" ON team_members
    FOR SELECT USING (auth.role() = 'authenticated');

-- 11. Triggers pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_stores_updated_at ON stores;
CREATE TRIGGER update_stores_updated_at
    BEFORE UPDATE ON stores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 12. Vérification finale
SELECT 'Stores créés:' as info, COUNT(*) as count FROM stores;
SELECT 'Users avec store_id:' as info, COUNT(*) as count FROM users WHERE store_id IS NOT NULL;
SELECT 'Team members créés:' as info, COUNT(*) as count FROM team_members;
SELECT 'Vue users_with_store disponible:' as info, COUNT(*) as count FROM users_with_store; 