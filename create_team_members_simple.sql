-- Script simple pour créer la table team_members et des employés de test
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Créer la table team_members avec la structure complète
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
    manager_id UUID,
    store_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Ajouter les contraintes de clés étrangères si elles n'existent pas
DO $$ 
BEGIN
    -- Ajouter la contrainte pour manager_id si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'team_members_manager_id_fkey' 
        AND table_name = 'team_members'
    ) THEN
        ALTER TABLE team_members 
        ADD CONSTRAINT team_members_manager_id_fkey 
        FOREIGN KEY (manager_id) REFERENCES auth.users(id);
    END IF;

    -- Ajouter la contrainte pour store_id si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'team_members_store_id_fkey' 
        AND table_name = 'team_members'
    ) THEN
        ALTER TABLE team_members 
        ADD CONSTRAINT team_members_store_id_fkey 
        FOREIGN KEY (store_id) REFERENCES stores(id);
    END IF;
END $$;

-- 3. Créer des employés de test sans spécifier de manager pour l'instant
INSERT INTO team_members (name, role, section, status, rating, location, phone, email, shift, performance, tasks_completed, store_id)
VALUES 
    ('Marie Dubois', 'Opérateur', 'Section A', 'offline', 5, 'Zone de réception', '01.23.45.67.89', 'marie.dubois@magasin.fr', 'matin', 85, 127, 1),
    ('Pierre Martin', 'Superviseur', 'Section A', 'offline', 4, 'Zone de préparation', '01.23.45.67.90', 'pierre.martin@magasin.fr', 'après-midi', 92, 156, 1),
    ('Sophie Laurent', 'Opérateur', 'Section B', 'offline', 5, 'Zone d''expédition', '01.23.45.67.91', 'sophie.laurent@magasin.fr', 'matin', 78, 98, 1),
    ('Antoine Moreau', 'Technicien', 'Section B', 'offline', 4, 'Zone de maintenance', '01.23.45.67.92', 'antoine.moreau@magasin.fr', 'soir', 88, 143, 1),
    ('Julie Bernard', 'Opérateur', 'Section A', 'offline', 5, 'Zone de stockage', '01.23.45.67.93', 'julie.bernard@magasin.fr', 'matin', 91, 134, 1)
ON CONFLICT (id) DO NOTHING;

-- 4. Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Activer RLS (Row Level Security)
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- 6. Politique RLS de base
DROP POLICY IF EXISTS "Users can view team members" ON team_members;
CREATE POLICY "Users can view team members" ON team_members
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can manage team members" ON team_members;
CREATE POLICY "Users can manage team members" ON team_members
    FOR ALL USING (auth.role() = 'authenticated');

-- 7. Vérification
SELECT 'Table team_members créée' as status;
SELECT 'Employés ajoutés:' as info, COUNT(*) as count FROM team_members;
SELECT 'Structure de la table:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'team_members' 
ORDER BY ordinal_position; 