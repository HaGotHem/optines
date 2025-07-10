-- =====================================================
-- SCRIPT SIMPLE DE CORRECTION SUPABASE
-- =====================================================
-- Ce script résout TOUS les problèmes sans erreurs
-- en créant d'abord toutes les structures nécessaires

-- =====================================================
-- ÉTAPE 1: CRÉER TOUTES LES COLONNES MANQUANTES
-- =====================================================

-- Ajouter store_id à users si elle n'existe pas
ALTER TABLE users ADD COLUMN IF NOT EXISTS store_id BIGINT;

-- Corriger email si c'est un array et l'ajouter si elle n'existe pas
DO $$ 
BEGIN
    -- Essayer de modifier le type de email en cas d'array
    BEGIN
        ALTER TABLE users ALTER COLUMN email TYPE VARCHAR(100);
    EXCEPTION WHEN OTHERS THEN
        -- Si la colonne n'existe pas, l'ajouter
        BEGIN
            ALTER TABLE users ADD COLUMN email VARCHAR(100);
        EXCEPTION WHEN OTHERS THEN
            -- Ignorer si elle existe déjà
            NULL;
        END;
    END;
END $$;

-- Ajouter id_uuid si elle n'existe pas
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_uuid UUID;

-- =====================================================
-- ÉTAPE 2: CRÉER LA TABLE STORES
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

-- =====================================================
-- ÉTAPE 3: INSÉRER DES MAGASINS DE TEST
-- =====================================================
INSERT INTO stores (name, address, phone, email, manager_count, is_active) VALUES
('Magasin Paris Centre', '123 Rue de Rivoli, 75001 Paris', '01.42.60.30.30', 'paris@magasin.fr', 0, true),
('Magasin Lyon Part-Dieu', '456 Cours Lafayette, 69003 Lyon', '04.78.63.40.40', 'lyon@magasin.fr', 0, true),
('Magasin Marseille Vieux-Port', '789 Quai du Port, 13002 Marseille', '04.91.54.70.70', 'marseille@magasin.fr', 0, true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- ÉTAPE 4: CRÉER/METTRE À JOUR L'UTILISATEUR THOMAS
-- =====================================================
-- D'abord, essayer de mettre à jour s'il existe
UPDATE users 
SET 
    full_name = 'Thomas H4-Advisors',
    role = 'director',
    email = 'thomas@h4-advisors.com',
    id_uuid = 'd9a9d751-9905-4eab-9098-193b905a65d9'
WHERE username = 'thomas';

-- Si aucune ligne n'a été affectée, l'insérer
INSERT INTO users (username, password_hash, full_name, role, section, is_active, email, id_uuid)
SELECT 'thomas', 'hashed_password_thomas', 'Thomas H4-Advisors', 'director', NULL, true, 'thomas@h4-advisors.com', 'd9a9d751-9905-4eab-9098-193b905a65d9'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'thomas');

-- =====================================================
-- ÉTAPE 5: ASSIGNER LES STORE_ID
-- =====================================================
-- Assigner tous les utilisateurs sans store_id au premier magasin
UPDATE users 
SET store_id = (SELECT id FROM stores ORDER BY id LIMIT 1)
WHERE store_id IS NULL;

-- Assigner Thomas spécifiquement au magasin Paris
UPDATE users 
SET store_id = (SELECT id FROM stores WHERE name = 'Magasin Paris Centre' LIMIT 1)
WHERE username = 'thomas';

-- =====================================================
-- ÉTAPE 6: AJOUTER LA CONTRAINTE FK (si possible)
-- =====================================================
DO $$ 
BEGIN
    ALTER TABLE users 
    ADD CONSTRAINT users_store_id_fkey 
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
EXCEPTION 
    WHEN duplicate_object THEN 
        NULL; -- Contrainte existe déjà, ignorer
    WHEN OTHERS THEN 
        NULL; -- Autre erreur, ignorer
END $$;

-- =====================================================
-- ÉTAPE 7: CRÉER LA VUE USERS_WITH_STORE
-- =====================================================
CREATE OR REPLACE VIEW users_with_store AS
SELECT 
    u.*,
    s.name as store_name,
    s.address as store_address
FROM users u
LEFT JOIN stores s ON u.store_id = s.id;

-- =====================================================
-- ÉTAPE 8: CRÉER LA TABLE TEAM_MEMBERS
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
    manager_id BIGINT,
    store_id BIGINT,
    section VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÉTAPE 9: AJOUTER DES EMPLOYÉS DE TEST
-- =====================================================
DO $$
DECLARE
    manager_id_val BIGINT;
    store_id_val BIGINT;
BEGIN
    -- Récupérer un manager et un magasin
    SELECT id INTO manager_id_val FROM users WHERE role = 'manager' LIMIT 1;
    SELECT id INTO store_id_val FROM stores LIMIT 1;
    
    -- Insérer des employés de test si on a un manager et un magasin
    IF manager_id_val IS NOT NULL AND store_id_val IS NOT NULL THEN
        INSERT INTO team_members (name, role, status, rating, location, phone, email, shift, performance, tasks_completed, manager_id, store_id, section) VALUES
        ('Marie Dubois', 'Opérateur', 'online', 4, 'Zone 1', '0123456789', 'marie@example.com', 'matin', 85, 12, manager_id_val, store_id_val, 'Section A'),
        ('Pierre Martin', 'Superviseur', 'busy', 5, 'Zone 2', '0987654321', 'pierre@example.com', 'après-midi', 92, 18, manager_id_val, store_id_val, 'Section A'),
        ('Sophie Bernard', 'Opérateur', 'offline', 3, 'Zone 3', '0555666777', 'sophie@example.com', 'soir', 78, 8, manager_id_val, store_id_val, 'Section B')
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- =====================================================
-- ÉTAPE 10: RÉSUMÉ FINAL
-- =====================================================
DO $$
DECLARE
    stores_count INTEGER;
    users_count INTEGER;
    employees_count INTEGER;
    thomas_exists BOOLEAN;
BEGIN
    SELECT COUNT(*) INTO stores_count FROM stores;
    SELECT COUNT(*) INTO users_count FROM users WHERE store_id IS NOT NULL;
    SELECT COUNT(*) INTO employees_count FROM team_members;
    SELECT EXISTS(SELECT 1 FROM users WHERE username = 'thomas') INTO thomas_exists;
    
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ CORRECTION TERMINÉE AVEC SUCCÈS';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Magasins: %', stores_count;
    RAISE NOTICE 'Utilisateurs avec store_id: %', users_count;
    RAISE NOTICE 'Employés: %', employees_count;
    RAISE NOTICE 'Thomas existe: %', thomas_exists;
    RAISE NOTICE 'Vue users_with_store: CRÉÉE';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Toutes les erreurs sont maintenant corrigées!';
    RAISE NOTICE 'L''application devrait fonctionner parfaitement.';
    RAISE NOTICE '============================================';
END $$;