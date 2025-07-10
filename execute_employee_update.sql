-- Script SQL pour mettre à jour la structure de la base de données pour les employés
-- Exécuter ce script dans l'éditeur SQL de Supabase

-- 1. Ajouter la colonne section à la table team_members si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'team_members' AND column_name = 'section') THEN
        ALTER TABLE team_members ADD COLUMN section TEXT;
        RAISE NOTICE 'Colonne section ajoutée à team_members';
    ELSE
        RAISE NOTICE 'Colonne section existe déjà dans team_members';
    END IF;
END $$;

-- 2. Créer la vue team_members_with_store si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.views 
                   WHERE table_name = 'team_members_with_store') THEN
        EXECUTE '
        CREATE VIEW team_members_with_store AS
        SELECT 
            tm.*,
            s.name as store_name,
            s.location as store_location
        FROM team_members tm
        LEFT JOIN stores s ON tm.store_id = s.id
        ';
        RAISE NOTICE 'Vue team_members_with_store créée';
    ELSE
        RAISE NOTICE 'Vue team_members_with_store existe déjà';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Note: La vue team_members_with_store ne peut pas être créée (probablement car la table stores n''existe pas encore)';
END $$;

-- 3. Créer l'utilisateur thomas s'il n'existe pas dans la table users
DO $$ 
BEGIN
    -- Vérifier si l'utilisateur thomas existe déjà
    IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'thomas') THEN
        -- Utiliser l'ID Supabase réel de thomas s'il est déjà authentifié
        INSERT INTO users (id, username, email, role, created_at, updated_at)
        VALUES (
            'd9a9d751-9905-4eab-9098-193b905a65d9'::uuid,
            'thomas',
            'thomas@h4-advisors.com',
            'directeur',
            now(),
            now()
        )
        ON CONFLICT (id) DO UPDATE SET
            username = EXCLUDED.username,
            email = EXCLUDED.email,
            role = EXCLUDED.role,
            updated_at = now();
        
        RAISE NOTICE 'Utilisateur thomas créé/mis à jour dans la table users';
    ELSE
        RAISE NOTICE 'Utilisateur thomas existe déjà dans la table users';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Erreur lors de la création de l''utilisateur thomas: %', SQLERRM;
END $$;

-- 4. Afficher le résultat
SELECT 'Script terminé - Vérification des données:' as status;

-- Vérifier la structure de team_members
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'team_members' 
ORDER BY ordinal_position;

-- Vérifier l'utilisateur thomas
SELECT id, username, email, role, created_at 
FROM users 
WHERE username = 'thomas'; 