-- =====================================================
-- SCRIPT DE CORRECTION DU SCHÉMA SUPABASE
-- =====================================================
-- Ce script corrige les problèmes de colonnes manquantes
-- et crée les tables/vues nécessaires pour l'application

-- =====================================================
-- 1. CRÉER LA TABLE STORES (SI ELLE N'EXISTE PAS)
-- =====================================================
CREATE TABLE IF NOT EXISTS stores (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(200),
    phone VARCHAR(20),
    email VARCHAR(100),
    manager_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_stores_active ON stores(is_active);
CREATE INDEX IF NOT EXISTS idx_stores_name ON stores(name);

-- =====================================================
-- 2. CORRIGER ET AJOUTER LES COLONNES NÉCESSAIRES
-- =====================================================
-- Vérifier si la colonne store_id existe, sinon l'ajouter
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'store_id'
    ) THEN
        ALTER TABLE users ADD COLUMN store_id BIGINT;
        RAISE NOTICE 'Colonne store_id ajoutée à la table users';
    ELSE
        RAISE NOTICE 'Colonne store_id existe déjà dans la table users';
    END IF;
END $$;

-- Corriger le type de la colonne email si elle est de type array
DO $$ 
BEGIN
    -- Vérifier si la colonne email existe et son type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email' 
        AND data_type LIKE '%array%'
    ) THEN
        -- Si c'est un array, la convertir en VARCHAR
        ALTER TABLE users ALTER COLUMN email TYPE VARCHAR(100);
        RAISE NOTICE 'Colonne email convertie de array vers VARCHAR';
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email'
    ) THEN
        -- Si la colonne n'existe pas, l'ajouter
        ALTER TABLE users ADD COLUMN email VARCHAR(100);
        RAISE NOTICE 'Colonne email ajoutée à la table users';
    ELSE
        RAISE NOTICE 'Colonne email existe déjà avec le bon type';
    END IF;
END $$;

-- =====================================================
-- 3. INSÉRER DES MAGASINS DE TEST
-- =====================================================
INSERT INTO stores (name, address, phone, email, manager_count, is_active) VALUES
('Magasin Paris Centre', '123 Rue de Rivoli, 75001 Paris', '01.42.60.30.30', 'paris@magasin.fr', 0, true),
('Magasin Lyon Part-Dieu', '456 Cours Lafayette, 69003 Lyon', '04.78.63.40.40', 'lyon@magasin.fr', 0, true),
('Magasin Marseille Vieux-Port', '789 Quai du Port, 13002 Marseille', '04.91.54.70.70', 'marseille@magasin.fr', 0, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. CRÉER ET METTRE À JOUR LES UTILISATEURS
-- =====================================================
-- Assigner tous les utilisateurs existants au premier magasin (seulement si la colonne existe)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'store_id'
    ) THEN
        UPDATE users 
        SET store_id = (SELECT id FROM stores LIMIT 1)
        WHERE store_id IS NULL;
        RAISE NOTICE 'Utilisateurs existants assignés au premier magasin';
    ELSE
        RAISE NOTICE 'Colonne store_id pas encore créée, skip de la mise à jour';
    END IF;
END $$;

-- Créer l'utilisateur Thomas s'il n'existe pas (avec gestion d'erreur pour email)
DO $$
BEGIN
    -- Essayer d'insérer Thomas avec email
    BEGIN
        INSERT INTO users (username, password_hash, full_name, role, section, is_active, email, id_uuid)
        VALUES ('thomas', 'hashed_password_thomas', 'Thomas H4-Advisors', 'director', NULL, true, 'thomas@h4-advisors.com', 'd9a9d751-9905-4eab-9098-193b905a65d9')
        ON CONFLICT (username) DO UPDATE SET
            full_name = 'Thomas H4-Advisors',
            role = 'director',
            email = 'thomas@h4-advisors.com',
            id_uuid = 'd9a9d751-9905-4eab-9098-193b905a65d9';
        RAISE NOTICE 'Utilisateur Thomas créé/mis à jour avec email';
    EXCEPTION 
        WHEN OTHERS THEN
            -- Si ça échoue à cause de l'email, essayer sans
            INSERT INTO users (username, password_hash, full_name, role, section, is_active, id_uuid)
            VALUES ('thomas', 'hashed_password_thomas', 'Thomas H4-Advisors', 'director', NULL, true, 'd9a9d751-9905-4eab-9098-193b905a65d9')
            ON CONFLICT (username) DO UPDATE SET
                full_name = 'Thomas H4-Advisors',
                role = 'director',
                id_uuid = 'd9a9d751-9905-4eab-9098-193b905a65d9';
            RAISE NOTICE 'Utilisateur Thomas créé/mis à jour sans email (problème de type)';
    END;
END $$;

-- =====================================================
-- 5. AJOUTER LA CONTRAINTE DE CLÉ ÉTRANGÈRE ET FINALISER LES ASSIGNATIONS
-- =====================================================
-- Ajouter la contrainte FK après avoir créé la colonne
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_store_id_fkey' AND table_name = 'users'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT users_store_id_fkey 
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
        RAISE NOTICE 'Contrainte FK store_id ajoutée à la table users';
    ELSE
        RAISE NOTICE 'Contrainte FK store_id existe déjà';
    END IF;
END $$;

-- Maintenant, assigner tous les utilisateurs sans store_id au premier magasin
UPDATE users 
SET store_id = (SELECT id FROM stores LIMIT 1)
WHERE store_id IS NULL;

-- Assigner Thomas au magasin Paris spécifiquement
UPDATE users 
SET store_id = (SELECT id FROM stores WHERE name = 'Magasin Paris Centre' LIMIT 1)
WHERE username = 'thomas';

-- =====================================================
-- 6. CRÉER LA VUE USERS_WITH_STORE
-- =====================================================
CREATE OR REPLACE VIEW users_with_store AS
SELECT 
    u.*,
    s.name as store_name,
    s.address as store_address
FROM users u
LEFT JOIN stores s ON u.store_id = s.id;

-- =====================================================
-- 7. CRÉER LA TABLE TEAM_MEMBERS (EMPLOYÉS)
-- =====================================================
CREATE TABLE IF NOT EXISTS team_members (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'busy', 'offline', 'break')),
    rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    location VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    avatar_url TEXT,
    shift VARCHAR(20) NOT NULL CHECK (shift IN ('matin', 'après-midi', 'soir')),
    performance INTEGER DEFAULT 0 CHECK (performance >= 0 AND performance <= 100),
    tasks_completed INTEGER DEFAULT 0 CHECK (tasks_completed >= 0),
    manager_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    store_id BIGINT REFERENCES stores(id) ON DELETE CASCADE,
    section VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_team_members_manager_id ON team_members(manager_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);
CREATE INDEX IF NOT EXISTS idx_team_members_shift ON team_members(shift);
CREATE INDEX IF NOT EXISTS idx_team_members_store_id ON team_members(store_id);

-- =====================================================
-- 8. INSÉRER DES EMPLOYÉS DE TEST
-- =====================================================
-- Récupérer l'ID d'un manager pour les assignations
DO $$
DECLARE
    manager_id_val BIGINT;
    store_id_val BIGINT;
BEGIN
    -- Récupérer un manager existant
    SELECT id INTO manager_id_val FROM users WHERE role = 'manager' LIMIT 1;
    -- Récupérer le premier magasin
    SELECT id INTO store_id_val FROM stores LIMIT 1;
    
    IF manager_id_val IS NOT NULL AND store_id_val IS NOT NULL THEN
        INSERT INTO team_members (name, role, status, rating, location, phone, email, shift, performance, tasks_completed, manager_id, store_id, section) VALUES
        ('Marie Dubois', 'Opérateur', 'online', 4, 'Zone 1', '0123456789', 'marie@example.com', 'matin', 85, 12, manager_id_val, store_id_val, 'Section A'),
        ('Pierre Martin', 'Superviseur', 'busy', 5, 'Zone 2', '0987654321', 'pierre@example.com', 'après-midi', 92, 18, manager_id_val, store_id_val, 'Section A'),
        ('Sophie Bernard', 'Opérateur', 'offline', 3, 'Zone 3', '0555666777', 'sophie@example.com', 'soir', 78, 8, manager_id_val, store_id_val, 'Section B')
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Employés de test ajoutés avec manager_id=% et store_id=%', manager_id_val, store_id_val;
    ELSE
        RAISE NOTICE 'Impossible d''ajouter des employés de test - pas de manager ou magasin trouvé';
    END IF;
END $$;

-- =====================================================
-- 9. METTRE À JOUR LES TRIGGERS
-- =====================================================
-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour mettre à jour automatiquement updated_at
DROP TRIGGER IF EXISTS update_stores_updated_at ON stores;
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10. VÉRIFICATIONS FINALES
-- =====================================================
-- Afficher un résumé des changements
DO $$
DECLARE
    stores_count INTEGER;
    users_count INTEGER;
    employees_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO stores_count FROM stores;
    SELECT COUNT(*) INTO users_count FROM users WHERE store_id IS NOT NULL;
    SELECT COUNT(*) INTO employees_count FROM team_members;
    
    RAISE NOTICE '============================================';
    RAISE NOTICE 'RÉSUMÉ DES CORRECTIONS APPLIQUÉES';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Magasins créés: %', stores_count;
    RAISE NOTICE 'Utilisateurs avec store_id: %', users_count;
    RAISE NOTICE 'Employés créés: %', employees_count;
    RAISE NOTICE 'Vue users_with_store: CRÉÉE';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Les erreurs de store_id manquant sont maintenant corrigées!';
    RAISE NOTICE '============================================';
END $$; 